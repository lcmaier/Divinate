import logging
from constants import *
from pymongo import ASCENDING
import pandas as pd
import json
from typing import Dict, List, Optional
import utils
from datetime import datetime

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("mtg_price_tracker.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)




class PriceIngestor:
    """
    Class to handle ingestion of raw MTG price data into MongoDB.
    """
    def __init__(self, mongo_uri=MONGO_URI, db_name=MONGO_DB_NAME) -> None:
        self.mongo_uri = mongo_uri
        self.db_name = db_name
        self.client = None
        self.db = None


    def connect_to_db(self) -> bool:
        """
        Establish a connection to MongoDB.
        """
        self.client, self.db = utils.connect_to_db()
        return self.db is not None


    def create_collections_and_indexes(self) -> bool:
        """
        Creates the necessary collections and indexes in MongoDB.
        """
        try:
            # Create time series collection for card prices if it doesn't exist
            collections = self.db.list_collection_names()
            
            if MONGO_COLLECTIONS["card_prices"] not in collections:
                self.db.create_collection(
                    MONGO_COLLECTIONS["card_prices"],
                    timeseries={
                        "timeField": "date",
                        "metaField": "card_key", # combo key (set_code-collector_number)
                        "granularity": "hours" # technically daily but mongoDB's time series granularity only goes up to hours
                    }
                )
                logger.info(f"Created time series collection {MONGO_COLLECTIONS['card_prices']}")
            
            # Create indexes for the cards collection 
            self.db[MONGO_COLLECTIONS["cards"]].create_index([("goldfish_id", ASCENDING)], unique=True) # primary lookup key is goldfish ID since that's printing-specific
            self.db[MONGO_COLLECTIONS["cards"]].create_index([("id", ASCENDING)]) # for referencing specific printing of a card or cards by Scryfall id
            self.db[MONGO_COLLECTIONS["cards"]].create_index([("oracle_id", ASCENDING)]) # for referencing all versions of a card or cards
            self.db[MONGO_COLLECTIONS["cards"]].create_index([("name", ASCENDING)]) # for referencing a card object by name
            self.db[MONGO_COLLECTIONS["cards"]].create_index([("set", ASCENDING)]) # for filtering by a set or sets

            # Card key index for looking up by card_key (set-collector_number)
            self.db[MONGO_COLLECTIONS["cards"]].create_index([("card_key", ASCENDING)], unique=True)

            # format legality indices
            self.db[MONGO_COLLECTIONS["cards"]].create_index([("legalities.standard", ASCENDING)]) # for filtering to standard-legal cards
            self.db[MONGO_COLLECTIONS["cards"]].create_index([("legalities.pioneer", ASCENDING)]) # for filtering to pioneer-legal cards
            self.db[MONGO_COLLECTIONS["cards"]].create_index([("legalities.modern", ASCENDING)]) # for filtering to modern-legal cards
            self.db[MONGO_COLLECTIONS["cards"]].create_index([("legalities.legacy", ASCENDING)]) # for filtering to legacy-legal cards
            self.db[MONGO_COLLECTIONS["cards"]].create_index([("legalities.vintage", ASCENDING)]) # for filtering to vintage-legal cards
            
            # Create composite index for time range queries by set
            self.db[MONGO_COLLECTIONS["cards"]].create_index([
                ("set", ASCENDING),
                ("released_at", ASCENDING)
            ])
            
            logger.info("MongoDB collections and indexes created successfully.")
            return True
        except Exception as e:
            logger.error(f"Error creating collections and indexes: {e}")
            return False
        

        
    def add_or_update_card(self, set_code: str, collector_number: str, card_data: Dict) -> bool:
        """
        Adds or updates a card in the database.
        
        Args:
            set_code: The set code (e.g., "BIG")
            collector_number: The collector number (e.g., "90")
            card_data: Dictionary of additional data about the card
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Create the card_key
            goldfish_id = card_data.get('goldfish_id')
            if not goldfish_id:
                logger.error("Cannot add card without goldfish_id")
                return False

            # Generate card_key
            set_code = card_data.get('set')
            collector_number = card_data.get('collector_number')
            
            if not set_code:
                logger.error(f"Cannot add card with goldfish_id {goldfish_id} without set_code")
                return False
                
            card_key = utils.generate_card_key(set_code, collector_number, goldfish_id)
            card_data['card_key'] = card_key
            card_data['updated_at'] = datetime.now()
            
            # Update card record or insert if it doesn't exist
            result = self.db[MONGO_COLLECTIONS["cards"]].update_one(
                {"goldfish_id": goldfish_id},
                {"$set": card_data},
                upsert=True
            )
            
            logger.info(f"Card {goldfish_id} ({card_key}) {'updated' if result.matched_count else 'added'} in database")
            return True

        except Exception as e:
            logger.error(f"Error adding/updating card {card_data.get('goldfish_id')}: {e}")
            return False

    def get_card_prices_from_csv(self, csv_path: str, card_key: str) -> List:
        """
        Transforms a given CSV into price documents for MongoDB
        
        Args:
            csv_path: Path to CSV with price data
            card_key: unique identifier with format: f"{set_code}-{collector_number}"
        
        Returns:
            List of price documents if successful, empty list if error
        """
        try:
            # read CSV data
            df = pd.read_csv(csv_path, header=None, names=["date", "price"])
            df['date'] = pd.to_datetime(df['date'], format='%Y-%m-%d')

            # prep documents for insertion
            price_docs = []
            for _, row in df.iterrows():
                price_doc = {
                    "card_key": card_key, # this is our universal identifier
                    "date": row['date'].to_pydatetime(),
                    "price": float(row['price'])
                }
                price_docs.append(price_doc)
            
            # insert as a batch
            if price_docs:
                return price_docs
            
            logger.error("price_docs in the add_card_prices method is empty, not committing to db.")
            return []
        
        except Exception as e:
            logger.error(f"Error adding prices for {card_key}: {e}")
            return []
        
    def add_card_prices_bulk(self, price_data_list: List[Dict]) -> bool:
        """
        Adds price data for multiple cards at once to the time series collection.
        
        Args:
            price_data_list: List of price documents to insert
                Price document format is {
                    card_key: key of format 'set_code'-'collectors_number'
                    date: date in format %Y-%m-%d
                    price: float detailing price (USD) for the given card on the given date
                }
        """
        try:
            if price_data_list:
                self.db[MONGO_COLLECTIONS["card_prices"]].insert_many(price_data_list)
                logger.info(f"Added {len(price_data_list)} price data points to time series collection")
                return True
            return False
        except Exception as e:
            logger.error(f"Error adding bulk price data: {e}")
            return False

        
    def ingest_set_prices(self, set_code: str) -> bool:
        """
        Ingest price data for a particular set.
        
        Args:
            set_code: The set code (e.g., "BIG")
        """
        # Get the directory containing CSV files for this set
        set_dir = SET_DATA_DIR / set_code 

        if not set_dir.exists():
            logger.error(f"Directory {set_dir} does not exist")
            return False
        
        # Get the manifest path
        manifest_path = set_dir / 'manifest.json'

        if not manifest_path.exists():
            logger.error(f"Manifest file for {set_dir} does not exist")
            return False
        
        # Read the manifest
        try:
            with open(manifest_path, 'r') as f:
                manifest = json.load(f)
        except json.JSONDecodeError:
            logger.error(f"Error parsing manifest file in {set_dir}")
            return False
        
        # Check the manifest isn't empty
        if not manifest:
            logger.warning(f"Manifest file is empty in {set_dir}")
            return False
        
        # Collect all price documents to insert in bulk
        all_price_docs = []
        
        # Process each card in the manifest
        for _, card_info in manifest.items():
            set_number = card_info['set_number']
            filename = card_info['filename']
            goldfish_id = card_info['card_id']
            card_name = card_info['name']
            
            csv_path = set_dir / filename
            
            if not csv_path.exists():
                logger.warning(f"CSV file {filename} not found for set {set_code}, number {set_number}")
                continue
            
            card_key = utils.generate_card_key(set_code, set_number, card_name)
            # Get price documents from CSV
            has_price_history = True
            price_docs = self.get_card_prices_from_csv(csv_path, card_key)
            if not price_docs:
                has_price_history = False
            
            self.add_or_update_card(set_code, set_number, {"goldfish_id": goldfish_id, "card_key": card_key, "has_goldfish_history": has_price_history})
            
            # Add to the bulk list
            all_price_docs.extend(price_docs)
        
        # Insert all price documents in bulk
        if all_price_docs:
            success = self.add_card_prices_bulk(all_price_docs)
            if success:
                logger.info(f"Successfully ingested all price data for set {set_code}")
                return True
            else:
                logger.error(f"Failed to ingest price data for set {set_code}")
                return False
        else:
            logger.warning(f"No price data found for set {set_code}")
            return False
    
    def close_connection(self):
        """
        Closes the MongoDB connection.
        """
        if self.client:
            self.client.close()
            self.client = None
            self.db = None
            logger.info("MongoDB connection closed")

