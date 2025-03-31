"""
Daily Scryfall Price Updater

This module handles the daily collection of card prices from Scryfall's
bulk data API.
"""
from logger import get_logger, get_changelog_logger
from datetime import datetime
import json
import pymongo
from typing import Dict, List, Optional
import requests
from pathlib import Path
from constants import *


logger = get_logger(__name__)


class DailyPriceUpdater:
    """
    Class to handle daily price updates using Scryfall's bulk data API.
    """
    def __init__(self, mongo_uri=MONGO_URI, db_name=MONGO_DB_NAME, format_name="all") -> None:
        self.mongo_uri = mongo_uri
        self.db_name = db_name
        self.format_name = format_name.lower()
        self.client = None
        self.db = None
        self.session = requests.Session()
        self.session.headers.update(SCRYFALL_HEADERS)

        # Cache directory for Scryfall bulk data
        self.cache_dir = DATA_DIR / "scryfall_bulk_daily"
        self.cache_dir.mkdir(parents=True, exist_ok=True)

        # Set up a separate changelog logger
        self.changelog_dir = DATA_DIR / "changelogs"
        self.changelog_dir.mkdir(parents=True, exist_ok=True)
        
        # Track statistics for the current update
        self.changes_detected = 0
        self.new_sets = []
        self.ban_restricted_changes = []
        self.format_changes = []
        self.errata_changes = []
        
        # Set up the changelog logger
        self.setup_changelog_logger()
        return

    ## DB CONNECTION METHODS ##
    def connect_to_db(self) -> None:
        """
        Establish a connection to MongoDB.
        """
        try:
            self.client = pymongo.MongoClient(MONGO_URI)
            self.db = self.client[MONGO_DB_NAME]
        except Exception as e:
            logger.error(f"Error connecting to MongoDB: {e}")
    
    def close_connection(self) -> None:
        """
        Close the MongoDB connection.
        """
        if self.client:
            self.client.close()
            self.client = None
            self.db = None
            logger.info("MongoDB connection closed")
        else:
            logger.warning("close_connection method called with no open MongoDB connection, doing nothing.")
        return
    

    ## DATA DOWNLOAD METHODS ##
    def _get_latest_bulk_data_info(self, data_type: str = "default_cards") -> Optional[Dict]:
        """
        Gets the latest bulk data info from Scryfall API. Since this method queries the
        web, it shouldn't be called directly--use the `run` method instead
        
        Args:
            data_type: Type of bulk data (default: "default_cards")
            
        Returns:
            Dict with bulk data info or None if error
        """
        try:
            response = self.session.get(SCRYFALL_BULK_DATA_URL)
            response.raise_for_status()

            data = response.json()

            # Find the specific bulk data type
            for item in data.get('data', []):
                if item.get('type') == data_type:
                    logger.info(f"Found bulk data for {data_type}.")
                    return item
            
            logger.error(f"Bulk data type '{data_type}' not found in Scryfall API response")
            return None

        except Exception as e:
            logger.error(f"Error getting bulk data info: {e}")
            return None


    def _download_bulk_data(self, bulk_info: Dict, download_chunk_size=8192) -> Optional[Path]:
        """
        Downloads the bulk data specified in the bulk_info and saves it to the cache. Since
        this method queries the web, it shouldn't be called directly--use the run method instead

        Args:
            bulk_info: Dict with bulk data info from _get_latest_bulk_data_info()
            download_chunk_size: Chunk size for download (default: 8192)--larger powers of 2 might improve performance on higher-end machines
            
        Returns:
            Path to the downloaded file or None if error
        """
        download_uri = bulk_info.get('download_uri')
        if not download_uri:
            logger.error("No download URI in bulk info")
            return None
        
        # get timestamp from URI for `updated_at`` field in database
        # change special characters to fit our existing datetime format
        timestamp = bulk_info.get('updated_at', '').replace(':', '-').replace('+', '-')
        data_type = bulk_info.get('type', 'default_cards')


        # create cache filename based on timestamp to ensure no collisions
        filename = f"{bulk_info.get('type')}-{timestamp}.json"
        output_path = self.cache_dir / filename

        # Check for existing downloaded file
        if output_path.exists() and output_path.stat().st_size > 0:
            logger.info(f"Using cached bulk data file at: {output_path}")
            return output_path
        

        # clean up older files of the same kind before downloading new ones
        self._cleanup_old_bulk_files(data_type, output_path)
        # Download the file
        try:
            logger.info(f"Downloading bulk data from {download_uri}...")
            response = self.session.get(download_uri, stream=True)
            response.raise_for_status()

            with open(output_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=download_chunk_size):
                    f.write(chunk)

            logger.info(f"Bulk data downloaded and saved to {output_path}")
            return output_path
        
        except Exception as e:
            logger.error(f"Error downloading bulk data: {e}")
            return None
    
    def _cleanup_old_bulk_files(self, data_type: str, new_file_path: Path) -> None:
        """
        Cleans up older bulk data files of the same type to save disk space.
        
        Args:
            data_type: Type of bulk data (e.g., "default_cards")
            new_file_path: Path to the newly downloaded file (which should be kept)
        """
        try:
            # Find all existing files of the same type
            pattern = f"{data_type}-*.json"
            existing_files = list(self.cache_dir.glob(pattern))
            
            # Skip if there are no existing files or only the new file
            if not existing_files or (len(existing_files) == 1 and existing_files[0] == new_file_path):
                return
                
            # Log what we found
            logger.info(f"Found {len(existing_files)} existing bulk data files of type '{data_type}'")
            
            # Keep track of how much space we free
            bytes_freed = 0
            
            # Delete older files (skip the new file we're just downloading)
            for file_path in existing_files:
                if file_path != new_file_path:
                    # Get file size before deleting for our log
                    try:
                        file_size = file_path.stat().st_size
                        file_path.unlink()
                        bytes_freed += file_size
                        logger.info(f"Deleted old bulk data file: {file_path.name} ({file_size / (1024*1024):.2f} MB)")
                    except Exception as e:
                        logger.warning(f"Failed to delete old bulk data file {file_path.name}: {e}")
            
            # Log total space saved
            if bytes_freed > 0:
                logger.info(f"Freed up {bytes_freed / (1024*1024):.2f} MB of disk space")
                
        except Exception as e:
            logger.error(f"Error during bulk data cleanup: {e}")
            # Continue with the download even if cleanup fails
    

    ## DATA EXTRACTION METHODS ##
    
    def is_format_legal(self, card_data: Dict) -> bool:
        """
        Check if a card is legal in the specified format and not from a digital-only set.
        
        Args:
            card_data: Card data from Scryfall
            
        Returns:
            bool: True if the card is legal in the format, False otherwise
        """
        try:
            digital = card_data.get('digital', False)
            if digital:
                return False
            
            if self.format_name == 'all':
                return True
                
            legalities = card_data.get('legalities', {})
            format_status = legalities.get(self.format_name, 'not_legal')
            return format_status in ['legal', 'restricted']
        except Exception as e:
            logger.error(f"Error checking format legality: {e}")
            return False
        
    def generate_card_key(self, card_data: Dict) -> str:
        """
        Generate a stable card key from Scryfall data.
        This is a critical function that creates the identifier that will be 
        used to match with MTGGoldfish data later.
        
        Args:
            card_data: Card data from Scryfall
            
        Returns:
            str: A stable card key
        """
        set_code = card_data.get('set', '').lower()
        collector_number = card_data.get('collector_number', '')
        
        if not set_code or not collector_number:
            # Fallback for cards without proper identifiers
            name = card_data.get('name', 'unknown').lower()
            set_name = card_data.get('set_name', 'unknown').lower()
            return f"{set_code}-{name}-{set_name}"
        

        # Clean collector_number of special Unicode characters
        # First, we'll use ASCII-only for the card_key to avoid encoding issues
        # For weird collector numbers (especially in Secret Lair), use a hash instead
        import re
        if not re.match(r'^[a-zA-Z0-9\-\/]+$', collector_number):
            # Non-standard collector number (contains Unicode or special chars)
            # Create a hash of the collector number to keep it stable but ASCII-safe
            import hashlib
            hash_val = hashlib.md5(collector_number.encode('utf-8')).hexdigest()[:8]
            safe_collector_number = f"x{hash_val}"
            
            # Log the mapping so we can debug if needed
            logger.debug(f"Mapped special collector number '{collector_number}' to '{safe_collector_number}' for {set_code}")
        else:
            # Standard collector number, use as is
            safe_collector_number = collector_number

        # Generate basic card key with set code and collector number
        # This preserves Scryfall's encoding of variants in collector numbers
        # (e.g., "229s" for prerelease cards)
        card_key = f"{set_code}-{collector_number}"
        
        return card_key


    def extract_price_data(self, card_data: Dict) -> List[Dict]:
        """
        Extract price data from a Scryfall card, creating separate entries
        for each finish type (regular, foil, etched).
        
        Args:
            card_data: Card data from Scryfall
            
        Returns:
            List of price entry dictionaries
        """
        result = []

        # get base card key
        base_card_key = self.generate_card_key(card_data)

        # Get today's date
        today = datetime.now().date()
        # need datetime for MongoDB Timeseries object
        today_datetime = datetime.combine(today, datetime.min.time())
        
        # Check price data
        prices = card_data.get('prices', {})
        
        # Get card finishes
        finishes = card_data.get('finishes', ['nonfoil'])

        # Scryfall formatting has 3 potential prices for each record: nonfoil, foil, and etched. We create timeseries objects for each

        # process regular price
        if 'nonfoil' in finishes and prices.get('usd') and prices.get('usd') != 'null':
            try:
                reg_price = float(prices.get('usd'))
                price_entry = {
                    "card_key": base_card_key,
                    "date": today_datetime,
                    "price": reg_price,
                    "finish": "nonfoil",
                    "source": "scryfall",
                    # Metadata for future reconciliation with MTGGoldfish
                    "metadata": {
                        "name": card_data.get('name'),
                        "set": card_data.get('set'),
                        "collector_number": card_data.get('collector_number'),
                        "promo_types": card_data.get('promo_types', []),
                        "frame_effects": card_data.get('frame_effects', [])
                    }
                }
                result.append(price_entry)
            except (ValueError, TypeError) as e:
                logger.warning(f"Failed to extract price data for nonfoil card with card key {base_card_key}. Skipping.")
                pass
        
        #process foil price
        if 'foil' in finishes and prices.get('usd_foil') and prices.get('usd_foil') != "null":
            try:
                foil_price = float(prices.get('usd_foil'))
                price_entry = {
                    "card_key": base_card_key,
                    "date": today_datetime,
                    "price": foil_price,
                    "finish": "foil",
                    "source": "scryfall",
                    # Metadata for future reconciliation with MTGGoldfish
                    "metadata": {
                        "name": card_data.get('name'),
                        "set": card_data.get('set'),
                        "collector_number": card_data.get('collector_number'),
                        "promo_types": card_data.get('promo_types', []),
                        "frame_effects": card_data.get('frame_effects', [])
                    }
                }
                result.append(price_entry)
            except (ValueError, TypeError) as e:
                logger.warning(f"Failed to extract price data for foil card with card key {base_card_key}. Skipping.")
                pass

        #process etched price
        if 'etched' in finishes and prices.get('usd_etched') and prices.get('usd_etched') != "null":
            try:
                foil_price = float(prices.get('usd_etched'))
                price_entry = {
                    "card_key": base_card_key,
                    "date": today_datetime,
                    "price": foil_price,
                    "finish": "etched",
                    "source": "scryfall",
                    # Metadata for future reconciliation with MTGGoldfish
                    "metadata": {
                        "name": card_data.get('name'),
                        "set": card_data.get('set'),
                        "collector_number": card_data.get('collector_number'),
                        "promo_types": card_data.get('promo_types', []),
                        "frame_effects": card_data.get('frame_effects', [])
                    }
                }
                result.append(price_entry)
            except (ValueError, TypeError) as e:
                logger.warning(f"Failed to extract price data for etched card with card key {base_card_key}. Skipping.")
                pass
        
        return result
    
    def create_card_data_document(self, card_data: Dict) -> Dict:
        """
        Create a card data document for the cards collection.
        
        Args:
            card_data: Card data from Scryfall
            
        Returns:
            Dict: Card document for storage
        """
        # Generate the card key
        card_key = self.generate_card_key(card_data)
        
        # Create basic card document
        card_document = card_data.copy()
        
        # Add custom fields
        card_document['card_key'] = card_key
        card_document['updated_at'] = datetime.now()
        card_document['source'] = 'scryfall'
        
        # Add a field to track if this card has historical data from MTGGoldfish
        # This will be updated later when/if we import MTGGoldfish data
        card_document['has_goldfish_history'] = False
        
        return card_document
    
    ## DB UPDATE METHODS
    def setup_changelog_logger(self):
        """Set up a dedicated logger for the changelog."""
        # Get a centralized changelog logger
        self.changelog_logger = get_changelog_logger()
        
        # Log header for this update session
        today = datetime.now().strftime("%Y-%m-%d")
        self.changelog_logger.info(f"MTG Card Database Update - {today}")
        self.changelog_logger.info("=" * 80)


    def track_significant_changes(self, old_doc, new_doc):
        """
        Track significant changes between old and new card documents
        and log them appropriately.
        """
        if not old_doc:
            # It's a new card
            set_code = new_doc.get('set', '').lower()
            set_name = new_doc.get('set_name', '')
            card_name = new_doc.get('name', 'Unknown Card')
            
            # Check if this is the first card from this set, and that it is actually a paper set
            if set_code not in DIGITAL_ONLY_SET_CODES:
                existing_count = self.db[MONGO_COLLECTIONS["cards"]].count_documents({"set": set_code})
                if existing_count == 0:
                    self.changelog_logger.info(f"NEW SET: {set_name} ({set_code}) - First card: {card_name}")
                    self.new_sets.append({
                        'set': set_name,
                        'code': set_code
                    })
                    self.changes_detected += 1
                else:
                    self.changelog_logger.info(f"New card added: {card_name} ({set_code})")
                return
        
        card_name = new_doc.get('name', 'Unknown Card')
        
        # Check for important changes
        changes = []
        
        # Track legality changes
        old_legalities = old_doc.get('legalities', {})
        new_legalities = new_doc.get('legalities', {})
        for format_name in set(old_legalities.keys()) | set(new_legalities.keys()):
            old_status = old_legalities.get(format_name, 'unknown')
            new_status = new_legalities.get(format_name, 'unknown')
            
            if old_status != new_status:
                if old_status == 'legal' and new_status == 'banned':
                    changes.append(f"BANNED in {format_name}")
                elif old_status == 'legal' and new_status == 'restricted':
                    changes.append(f"RESTRICTED in {format_name}")
                elif old_status == 'banned' and new_status == 'legal':
                    changes.append(f"UNBANNED in {format_name}")
                elif old_status == 'restricted' and new_status == 'legal':
                    changes.append(f"UNRESTRICTED in {format_name}")
                elif old_status == 'unknown' and new_status in ['legal', 'restricted']:
                    changes.append(f"Added to {format_name} as {new_status}")
                else:
                    changes.append(f"Status in {format_name} changed: {old_status} → {new_status}")
                
                self.ban_restricted_changes.append({
                        'card': card_name,
                        'old_status': old_status,
                        'new_status': new_status,
                        'format': format_name
                    })
        
        # Track oracle text changes (potential errata)
        old_text = old_doc.get('oracle_text')
        new_text = new_doc.get('oracle_text')
        if old_text != new_text:
            changes.append("Oracle text updated (errata)")
            self.errata_changes.append({
                'card': card_name,
                'old_text': old_text,
                'new_text': new_text
            })
        
        # Track type line changes
        if old_doc.get('type_line') != new_doc.get('type_line'):
            changes.append(f"Type line changed: {old_doc.get('type_line')} → {new_doc.get('type_line')}")
        
        # Track mana cost changes
        if old_doc.get('mana_cost') != new_doc.get('mana_cost'):
            changes.append(f"Mana cost changed: {old_doc.get('mana_cost')} → {new_doc.get('mana_cost')}")
        
        # Log significant changes
        if changes:
            changes_str = ", ".join(changes)
            logger.info(f"CARD CHANGE: {card_name} - {changes_str}")


    def _log_update_summary(self, process_count, card_count, skipped_count, price_count):
        """Log a summary of the update to the changelog."""
        self.changelog_logger.info("\n" + "=" * 80)
        self.changelog_logger.info("UPDATE SUMMARY")
        self.changelog_logger.info("=" * 80)
        self.changelog_logger.info(f"Total cards processed: {process_count}")
        self.changelog_logger.info(f"Cards included in database: {card_count}")
        self.changelog_logger.info(f"Cards skipped (format filtering): {skipped_count}")
        self.changelog_logger.info(f"Price points added: {price_count}")
        self.changelog_logger.info(f"Significant changes detected: {self.changes_detected}")
        
        # Log new sets
        if self.new_sets:
            self.changelog_logger.info("\nNEW SETS:")
            for set_info in self.new_sets:
                self.changelog_logger.info(f"- {set_info['set']} ({set_info['code']})")
            # clear list after printing to changelog
            self.new_sets.clear()
        
        # Log bans and restrictions
        if self.ban_restricted_changes:
            self.changelog_logger.info("\nBAN/RESTRICTED CHANGES:")
            for ban in self.ban_restricted_changes:
                self.changelog_logger.info(f"- {ban['card']}: {ban['old_status']} → {ban['new_status']} in {ban['format']}")
            # clear list after printing to changelog
            self.ban_restricted_changes.clear()
        
        # Log errata
        if self.errata_changes:
            self.changelog_logger.info("\nORACLE TEXT CHANGES:")
            for errata in self.errata_changes:
                self.changelog_logger.info(f"- {errata['card']}:")
                self.changelog_logger.info(f"  OLD: {errata['old_text']}")
                self.changelog_logger.info(f"  NEW: {errata['new_text']}")
            
            self.errata_changes.clear()
        
        self.changelog_logger.info("\n" + "=" * 80)
        self.changelog_logger.info(f"Update completed at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        self.changelog_logger.info("=" * 80 + "\n")


    def update_daily_prices(self) -> bool:
        """
        Update the daily prices for cards in the database.
        Gets the current price from Scryfall data.
        
        Returns:
            bool: True if successful, False otherwise
        """
        if self.db is None:
            logger.error("Not connected to database")
            return False
        
        try:
            bulk_info = self._get_latest_bulk_data_info()
            if not bulk_info:
                return False
            
            bulk_data_path = self._download_bulk_data(bulk_info)
            if not bulk_data_path:
                return False
            
            logger.info("Updating daily prices from Scryfall bulk data...")

            # track stats for logging
            card_count = 0
            price_count = 0
            process_count = 0
            skipped_count = 0

            # Card document operations for bulk insert/update
            card_operations = []
            
            # Price document operations for bulk insert
            price_documents = []

            # Process the bulk data file
            with open(bulk_data_path, 'r', encoding='utf-8') as f:
                cards = json.load(f)
                total_cards = len(cards)
                logger.info(f"Loaded {total_cards} cards from bulk data")

                # process the cards
                for i, card_data in enumerate(cards):
                    try:
                        process_count += 1

                        # Check format legality if not processing all cards
                        if self.format_name != 'all' and not self.is_format_legal(card_data):
                            skipped_count += 1
                            continue
                        
                        # creating the card document
                        card_document = self.create_card_data_document(card_data)

                        # check if document is for a digital card, if so we skip it
                        if card_document['digital']:
                            continue

                        card_key = card_document['card_key']

                        # Look up existing card for change tracking
                        existing_card = self.db[MONGO_COLLECTIONS["cards"]].find_one({"card_key": card_key})
                        
                        # Track significant changes
                        self.track_significant_changes(existing_card, card_document)

                        # add card update operation to card_operations
                        card_operations.append(
                            pymongo.UpdateOne(
                                {"card_key": card_key},
                                {"$set": card_document},
                                upsert=True
                            )
                        )

                        # Extract as much price data as we can for that card and append those values to the price documents list 
                        price_entries = self.extract_price_data(card_data)
                        if price_entries:
                            price_documents.extend(price_entries)
                            price_count += len(price_entries)
                        
                        card_count += 1

                        # Log progress and execute batches periodically
                        if (i+1) % 1000 == 0 or (i+1) == total_cards:
                            logger.info(f"Processed {i + 1}/{total_cards} cards: {card_count} included, {skipped_count} skipped, {price_count} prices, {self.changes_detected} changes")

                            # Execute card update operations in batches
                            if card_operations:
                                batch_size = 500
                                for j in range(0, len(card_operations), batch_size):
                                    batch = card_operations[j:j+batch_size]
                                    result = self.db[MONGO_COLLECTIONS["cards"]].bulk_write(batch)
                                    logger.info(f"Updated {result.modified_count} cards, inserted {result.upserted_count} new cards")
                                
                                # Clear the operations list
                                card_operations = []
                            
                            # Execute price insert operations in batches
                            if price_documents:
                                batch_size = 1000
                                for j in range(0, len(price_documents), batch_size):
                                    batch = price_documents[j:j+batch_size]
                                    self.db[MONGO_COLLECTIONS["card_prices"]].insert_many(batch)
                                    logger.info(f"Inserted {len(batch)} price records")
                                
                                # Clear the price documents list
                                price_documents = []
                    
                    except Exception as e:
                        logger.error(f"Error processing individual card: {e}.")
                        card_key = card_data["card_key"]
                        if card_key:
                            logger.error(f"The above error occured while handling card_key {card_key}")
                        else:
                            logger.error("The above error was unable to be traced to a card_key.")
                        continue
                
                # Handle any remaining operations
                if card_operations:
                    result = self.db[MONGO_COLLECTIONS["cards"]].bulk_write(card_operations)
                    logger.info(f"Updated {result.modified_count} cards, inserted {result.upserted_count} new cards")
                
                if price_documents:
                    self.db[MONGO_COLLECTIONS["card_prices"]].insert_many(price_documents)
                    logger.info(f"Inserted {len(price_documents)} price records")
                
                # Log summary to the changelog
                self._log_update_summary(process_count, card_count, skipped_count, price_count)
                
                logger.info(f"Daily price update completed: processed {process_count} cards total, included {card_count}, skipped {skipped_count}, inserted {price_count} prices")
                return True


        except Exception as e:
            logger.error(f"Error updating daily prices: {e}")
            return False
        
    def _get_latest_changelog(self):
        """Get the path to the most recent changelog file."""
        if not os.path.exists(self.changelog_dir):
            return None
            
        changelog_files = sorted([f for f in os.listdir(self.changelog_dir) if f.startswith("mtg_changes_")], reverse=True)
        if not changelog_files:
            return None
            
        return self.changelog_dir / changelog_files[0]
    
    def print_latest_changelog(self):
        """Print the most recent changelog to the console."""
        latest_log = self._get_latest_changelog()
        if not latest_log:
            logger.info("No changelog files found.")
            return
            
        logger.info(f"Latest changelog: {latest_log}")
        with open(latest_log, 'r') as f:
            print(f.read())
    
    



    def run(self) -> bool:
        """
        Run the daily price update process.
        
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Connect to database
            self.connect_to_db()

            if self.db is None:
                return False
            
            # Set up changelog logger
            self.setup_changelog_logger()
            
            # Update daily prices (this now includes change tracking)
            success = self.update_daily_prices()
            
            # Close database connection
            self.close_connection()
            
            return success
        
        except Exception as e:
            logger.error(f"Error running daily price update: {e}")
            self.changelog_logger.error(f"Error running update: {e}")
            return False