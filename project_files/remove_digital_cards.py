#!/usr/bin/env python
"""
Script to remove all digital cards from the MTG Price Tracker database
and create an index to optimize future digital card filtering.

This script:
1. Removes digital cards from the cards collection
2. Removes price records for digital cards from the card_prices collection
3. Creates an index on the digital field for performance
4. Adds digital card filtering to the DailyPriceUpdater class
"""

import logging
import pymongo
from typing import List
from pymongo import MongoClient
from constants import MONGO_URI, MONGO_DB_NAME, MONGO_COLLECTIONS

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("remove_digital_cards.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def connect_to_database():
    """
    Connect to the MongoDB database.
    
    Returns:
        tuple: MongoDB client and database objects
    """
    try:
        logger.info(f"Connecting to MongoDB at {MONGO_URI}")
        client = MongoClient(MONGO_URI)
        db = client[MONGO_DB_NAME]
        # Test connection
        db.command('ping')
        logger.info("Successfully connected to MongoDB")
        return client, db
    except Exception as e:
        logger.error(f"Error connecting to MongoDB: {e}")
        return None, None

def get_digital_card_keys(db) -> List[str]:
    """
    Get all card_keys of digital cards.
    
    Args:
        db: MongoDB database object
        
    Returns:
        list: List of card_keys for digital cards
    """
    try:
        cards_collection = db[MONGO_COLLECTIONS["cards"]]
        digital_card_keys = cards_collection.distinct("card_key", {"digital": True})
        
        logger.info(f"Found {len(digital_card_keys)} digital cards")
        
        # Get a sample of the card names for logging
        if digital_card_keys:
            sample_size = min(5, len(digital_card_keys))
            sample_cards = list(cards_collection.find(
                {"card_key": {"$in": digital_card_keys[:sample_size]}},
                {"name": 1, "set_name": 1}
            ))
            
            sample_info = ", ".join([f"{card.get('name')} ({card.get('set_name')})" for card in sample_cards])
            logger.info(f"Sample of digital cards: {sample_info}...")
        
        return digital_card_keys
    
    except Exception as e:
        logger.error(f"Error getting digital card keys: {e}")
        return []

def remove_from_cards_collection(db) -> int:
    """
    Remove all digital cards from the cards collection.
    
    Args:
        db: MongoDB database object
        
    Returns:
        int: Number of deleted documents
    """
    try:
        cards_collection = db[MONGO_COLLECTIONS["cards"]]
        
        # First get a count for logging
        digital_count = cards_collection.count_documents({"digital": True})
        logger.info(f"Found {digital_count} digital cards to remove from cards collection")
        
        # Get a list of the sets for logging
        digital_sets = cards_collection.distinct("set_name", {"digital": True})
        logger.info(f"Digital cards found in sets: {', '.join(digital_sets)}")
        
        # Delete the records
        result = cards_collection.delete_many({"digital": True})
        logger.info(f"Removed {result.deleted_count} digital cards from cards collection")
        
        return result.deleted_count
    
    except Exception as e:
        logger.error(f"Error removing digital cards: {e}")
        return 0

def remove_from_prices_collection(db, digital_card_keys: List[str]) -> int:
    """
    Remove all price records for digital cards.
    
    Args:
        db: MongoDB database object
        digital_card_keys: List of card_keys for digital cards
        
    Returns:
        int: Number of deleted documents
    """
    try:
        if not digital_card_keys:
            logger.info("No digital card keys found, skipping price removal")
            return 0
            
        prices_collection = db[MONGO_COLLECTIONS["card_prices"]]
        
        # First get a count for logging
        price_count = prices_collection.count_documents({"card_key": {"$in": digital_card_keys}})
        logger.info(f"Found {price_count} price records for digital cards")
        
        # Delete in batches to avoid memory issues with large arrays
        batch_size = 5000
        total_deleted = 0
        
        for i in range(0, len(digital_card_keys), batch_size):
            batch = digital_card_keys[i:i+batch_size]
            result = prices_collection.delete_many({"card_key": {"$in": batch}})
            total_deleted += result.deleted_count
            logger.info(f"Deleted batch of {result.deleted_count} price records (batch {i//batch_size + 1})")
        
        logger.info(f"Removed {total_deleted} price records for digital cards")
        return total_deleted
    
    except Exception as e:
        logger.error(f"Error removing price records: {e}")
        return 0

def create_digital_index(db) -> bool:
    """
    Create an index on the digital field for performance.
    
    Args:
        db: MongoDB database object
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        cards_collection = db[MONGO_COLLECTIONS["cards"]]
        
        # Check if the index already exists
        existing_indexes = cards_collection.index_information()
        for idx_name, idx_info in existing_indexes.items():
            key_names = [key[0] for key in idx_info.get('key', [])]
            if 'digital' in key_names:
                logger.info(f"Index on digital field already exists: {idx_name}")
                return True
        
        # Create the index
        cards_collection.create_index([("digital", pymongo.ASCENDING)], background=True)
        logger.info("Successfully created index on digital field")
        return True
    
    except Exception as e:
        logger.error(f"Error creating index: {e}")
        return False

def main():
    """
    Main function to execute the digital card removal process.
    """
    logger.info("Starting digital card removal process")
    
    # Connect to the database
    client, db = connect_to_database()
    if not client or db is None:
        logger.error("Failed to connect to the database")
        return False
    
    try:
        # Get all digital card keys
        digital_card_keys = get_digital_card_keys(db)
        
        # Remove digital cards from cards collection
        removed_cards = remove_from_cards_collection(db)
        
        # Remove price records for digital cards
        removed_prices = remove_from_prices_collection(db, digital_card_keys)
        
        # Create index on digital field
        create_digital_index(db)
        
        logger.info("Digital card removal process completed successfully")
        logger.info(f"Summary: Removed {removed_cards} digital cards and {removed_prices} price records")
        
        return True
    
    except Exception as e:
        logger.error(f"Error in digital card removal process: {e}")
        return False
    
    finally:
        # Close the connection
        if client:
            client.close()
            logger.info("Database connection closed")

if __name__ == "__main__":
    main()