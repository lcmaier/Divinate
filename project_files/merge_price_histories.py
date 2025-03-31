from logger import get_logger
from constants import MONGO_URI, MONGO_DB_NAME, MONGO_COLLECTIONS, SET_DATA_DIR
from datetime import datetime
from pymongo import MongoClient
import os
import json
import csv

logger = get_logger(__name__)

class GoldfishPriceImporter:
    """
    Class to handle importing MTGGoldfish price history into the MongoDB database.
    """
    def __init__(self, mongo_uri=MONGO_URI, db_name=MONGO_DB_NAME):
        self.mongo_uri = mongo_uri
        self.db_name = db_name
        self.client = None
        self.db = None
        self.cutoff_date = datetime(2025, 3, 20) # Only import data before this date

        # Mapping rules for promos (bc Goldfish fucked up)
        self.tag_to_set_prefix = {
            "planeswalker stamp": "p",
            "prerelease": "p",
        }

        self.tag_to_collector_suffix = {
            "planeswalker stamp": "s",
            "prerelease": "p",
        }

        return
    
    def connect_to_db(self) -> bool:
        try:
            self.client = MongoClient(self.mongo_uri)
            self.db = self.client[self.db_name]
            # Test connection
            self.db.command('ping')
            logger.info(f"Successfully connected to MongoDB at {self.mongo_uri}")
            return True
        except Exception as e:
            logger.error(f"Error connecting to MongoDB: {e}")
            return False
    



    def close_connection(self):
        """Close the MongoDB connection."""
        if self.client:
            self.client.close()
            self.client = None
            self.db = None
            logger.info("MongoDB connection closed")





    def parse_set_manifests(self):
        """
        Parse all set manifests in the SET_DATA_DIR.
        Returns a dict mapping goldfish_id to card info.
        """
        all_cards = {}
        set_dirs = [f for f in os.listdir(SET_DATA_DIR) if os.path.isdir(os.path.join(SET_DATA_DIR, f))]
        
        for set_code in set_dirs:
            manifest_path = os.path.join(SET_DATA_DIR, set_code, "manifest.json")
            if not os.path.exists(manifest_path):
                logger.warning(f"No manifest found for set {set_code}")
                continue
            
            try:
                with open(manifest_path, 'r') as f:
                    manifest = json.load(f)
                
                for file_id, card_info in manifest.items():
                    # Add the set directory to the card info for easy reference
                    card_info['set_dir'] = set_code
                    goldfish_id = card_info.get('goldfish_id')
                    
                    if goldfish_id:
                        all_cards[goldfish_id] = card_info
                        logger.debug(f"Added card: {goldfish_id}")
                
                logger.info(f"Processed manifest for set {set_code} with {len(manifest)} cards")
            
            except Exception as e:
                logger.error(f"Error processing manifest for set {set_code}: {e}")
        
        logger.info(f"Total cards processed from all manifests: {len(all_cards)}")
        return all_cards
    




    def determine_card_key(self, card_info):
        """
        Determines the correct card_key for a MTGGoldfish card based on tags and other info
        """
        base_set_code = card_info.get('set_code', '').lower()
        collector_number = card_info.get('set_number', '')
        name = card_info.get('name', '')

        # determine finish
        finish = "nonfoil"
        if "(F)" in card_info.get('goldfish_id', ''):
            finish = "foil"
        elif "(FE)" in card_info.get('goldfish_id', ''):
            finish = "etched"

        # Parse tags to handle special cases
        tags = card_info.get('tags', '').split(',')
        tags = [tag.strip().lower() for tag in tags if tag.strip()]

        # default initialization
        set_prefixes = []
        collector_suffixes = []

        # Check for special tag mappings
        for tag in tags:
            # promo prefix
            for tag_pattern, prefix in self.tag_to_set_prefix.items():
                if tag_pattern.lower() in tag and not base_set_code.startswith(prefix): # preventing double prefixing
                    set_prefixes.insert(0, prefix)
                
            # promo suffixes
            for tag_pattern, suffix in self.tag_to_collector_suffix.items():
                if tag_pattern.lower() in tag and not any([suffix == oldSuffix for oldSuffix in collector_suffixes]): # preventing double suffixing
                    collector_suffixes.insert(len(collector_suffixes), suffix)

        if base_set_code and collector_number:
            # we should have everything we need to build the card_key in this case 
            full_prefix = ''.join(set_prefixes) + base_set_code
            full_suffix = collector_number + ''.join(collector_suffixes)
            card_key = f"{full_prefix}-{full_suffix}"
            return card_key, finish
        else:
            # older sets without collector numbers or other special cases--handled in find_matching_card_in_db method
            logger.info(f"No collector number for {name} in {base_set_code}. Looking up in database.")

            return None, finish
        





    def find_matching_card_in_db(self, card_key, card_info):
        """
        Find a matching card in the database by card_key.
        If card_key is None, try to find by name and set.
        Returns (card, card_key) tuple.
        """
        card_name = card_info.get('name', '')
        base_set_code = card_info.get('set_code', '').lower()

        # if we got a valid card_key from determine_card_key, use that
        if card_key:
            card = self.db[MONGO_COLLECTIONS["cards"]].find_one({"card_key": card_key})

            if card:
                return card
            else:
                # if not found, log for debugging
                logger.warning(f"Card not found for proper card_key: {card_key}, card name: {card_name}")
        
        # if we have 'None', try finding by name and set (really old sets don't have collector numbers)
        cards = list(self.db[MONGO_COLLECTIONS["cards"]].find({
            "name": card_name,
            "set": base_set_code
        }))

        if len(cards) == 1:
            logger.info(f"Found card by name and set: {card_name}, {base_set_code}")
            return cards[0]
        elif len(cards) > 1:
            logger.warning(f"Multiple cards found for {card_name} in set {base_set_code}. Returning None.")
            return None
        else: # found nothing in the db, return nothing
            logger.error(f"No matching card found for {card_name} in set {base_set_code}. Returning None.")
            return None
        





    def parse_price_file(self, file_path):
        """
        Parse a MTGGoldfish price history CSV file.
        Returnsd a list of (date, price) tuples.
        """
        price_data = []

        try:
            with open(file_path, 'r') as f:
                csv_reader = csv.reader(f)
                for row in csv_reader:
                    if len(row) >= 2:
                        try:
                            date_str = row[0]
                            price_str = row[1]

                            date = datetime.strptime(date_str, '%Y-%m-%d')
                            price = float(price_str) if price_str else None

                            # Only include dates before the cutoff
                            if date < self.cutoff_date:
                                price_data.append((date, price))
                        except Exception as e:
                            logger.error(f"Error parsing row {row} in {file_path}: {e}")
                
            logger.debug(f"Parsed {len(price_data)} price points from {file_path}")
            return price_data
        except Exception as e:
            logger.error(f"Error opening or parsing  {file_path}: {e}")
            return []   







    def process_price_data(self, card, price_data, finish):
        """
        Process and save price data for a card.
        Returns number of records inserted.
        """ 
        card_key = card.get("card_key", '')

        if not card_key:
            logger.error(f"No card_key found for card {card.get('name')}")
            return 0
        
        # Get all dates we already ahve for this card/finish combination in one query for reference later
        existing_dates = set()
        existing_cursor = self.db[MONGO_COLLECTIONS["card_prices"]].find(
            {"card_key": card_key, "finish": finish},
            {"date": 1, "_id": 0}  # Only retrieve the date field
        )

        for doc in existing_cursor:
            if "date" in doc:
                existing_dates.add(doc["date"].strftime("%Y-%m-%d"))

        
        # Prepare batch operations for bulk insert
        price_documents = []

        for date, price in price_data:
            # skip if we already have this date
            date_key = date.strftime("%Y-%m-%d")
            if date_key in existing_dates:
                continue
            
            # Create price doc
            price_doc = {
                "card_key": card_key,
                "date": date,
                "price": price,
                "finish": finish,
                "source": "mtggoldfish",
                "metadata": {
                    "name": card.get("name"),
                    "set": card.get("set"),
                    "collector_number": card.get("collector_number"),
                    "promo_types": card.get("promo_types", []),
                    "frame_effects": card.get("frame_effects", [])
                }
            }
            price_documents.append(price_doc)
        
        # Bulk insert the documents we have to add, if any
        if price_documents:
            try:
                result = self.db[MONGO_COLLECTIONS["card_prices"]].insert_many(price_documents)
                logger.info(f"Added {len(result.inserted_ids)} price points for {card.get('name')} ({card_key})")
                return len(result.inserted_ids)
            except Exception as e:
                logger.error(f"Error inserting price data for {card_key}: {e}")
                return 0
        else:
            logger.debug(f"No new price points to add for {card.get('name')} ({card_key})")
            return 0






    
    def run_import(self) -> bool:
        """
        Run the full import process.
        """
        if not self.connect_to_db():
            logger.error("Failed to connect to database. Aborting import.")
            return False
        
        try:
            # Parse all manifests
            logger.info("Parsing set manifests...")
            all_cards = self.parse_set_manifests()

            # Process each card
            total_cards = len(all_cards)
            processed_cards = 0
            total_price_points = 0
            matched_card_keys = []

            logger.info(f"Starting to process {total_cards} cards")

            for goldfish_id, card_info in all_cards.items():
                processed_cards += 1

                if processed_cards % 100 == 0:
                    logger.info(f"Processed {processed_cards}/{total_cards} cards")
                
                # Determine card key and finish
                potential_card_key, finish = self.determine_card_key(card_info)

                if not finish:
                    logger.warning(f"Couldn't determine the finish for {goldfish_id}")

                # Find matching card already in card_prices collection in db
                card = self.find_matching_card_in_db(potential_card_key, card_info)

                if not card:
                    logger.warning(f"No matching card found for {goldfish_id} -> {potential_card_key}")
                    continue
                else:
                    matched_card_keys.append(card.get('card_key'))

                # Process price history file
                file_path = os.path.join(SET_DATA_DIR, card_info.get('set_dir'), card_info.get('filename'))

                if not os.path.exists(file_path):
                    logger.warning(f"Price history file not found: {file_path}")
                    continue

                price_data = self.parse_price_file(file_path)

                if not price_data:
                    logger.warning(f"No price data found in {file_path}")
                    continue

                # Process and save price data
                points_added = self.process_price_data(card, price_data, finish)
                total_price_points += points_added
            
            logger.info(f"Import completed. Processed {processed_cards}, added {total_price_points} price points.")

            # update cards db to mark cards with goldfish history
            self.db[MONGO_COLLECTIONS["cards"]].update_many(
                {"card_key": {"$in": matched_card_keys}},
                {"$set": {"has_goldfish_history": True}}
            )

            return True
        
        except Exception as e:
            logger.error(f"Error during import process: {e}")
            return False
        
        finally:
            self.close_connection()




if __name__ == "__main__":
    importer = GoldfishPriceImporter()
    success = importer.run_import()
    
    if success:
        logger.info("MTGGoldfish price import completed successfully.")
    else:
        logger.error("MTGGoldfish price import failed.")