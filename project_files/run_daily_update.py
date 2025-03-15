#!/usr/bin/env python
"""
Daily Update Runner for MTG Price Tracker
This script:
1. Ensures the database is properly set up
2. Runs the DailyPriceUpdater to fetch the latest prices
3. Handles errors and provides detailed logging
"""

import traceback
import sys
from datetime import datetime
from pathlib import Path
from pymongo import MongoClient

# Import the centralized logger
from logger import get_daily_update_logger

# Import the database manager and price updater
from minimal_ingestor import DatabaseManager
from scryfall_daily_updater import DailyPriceUpdater
from constants import MONGO_URI, MONGO_DB_NAME, MONGO_COLLECTIONS

# Get the logger for daily updates
logger = get_daily_update_logger()

def check_database_exists():
    """Check if the MTG database exists and has the required collections."""
    try:
        # Connect to MongoDB
        client = MongoClient(MONGO_URI)
        
        # Check if database exists
        db_names = client.list_database_names()
        if MONGO_DB_NAME not in db_names:
            logger.info(f"Database '{MONGO_DB_NAME}' not found, will be created")
            client.close()
            return False
            
        # Check if collections exist
        db = client[MONGO_DB_NAME]
        collections = db.list_collection_names()
        
        # Check if required collections exist
        required_collections = set(MONGO_COLLECTIONS.values())
        existing_collections = set(collections)
        
        missing_collections = required_collections - existing_collections
        
        if missing_collections:
            logger.info(f"Missing collections: {', '.join(missing_collections)}")
            client.close()
            return False
            
        # Database exists and has all collections
        client.close()
        return True
        
    except Exception as e:
        logger.error(f"Error checking database: {e}")
        return False

def initialize_database():
    """Set up the database with the required collections and indexes."""
    logger.info("Initializing database...")
    
    try:
        # Create the database manager
        db_manager = DatabaseManager()
        
        # Set up the database
        success = db_manager.setup_database()
        
        # Close the connection
        db_manager.close_connection()
        
        if success:
            logger.info("Database initialization successful")
        else:
            logger.error("Database initialization failed")
            
        return success
        
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        return False

def main():
    """Run the daily price update process with database check and error handling."""
    logger.info("=" * 80)
    logger.info(f"Starting MTG price update - {datetime.now()}")
    logger.info("-" * 80)
    
    try:
        # Check if database exists and initialize if needed
        if not check_database_exists():
            logger.info("Database needs to be initialized")
            if not initialize_database():
                logger.error("Failed to initialize database, cannot continue")
                return 1
            logger.info("Database initialized successfully")
        else:
            logger.info("Database check passed")
            
        # Run the daily price updater
        logger.info("Running daily price update...")
        updater = DailyPriceUpdater(format_name="all")
        success = updater.run()
        
        if success:
            logger.info("Daily price update completed successfully")
            return 0
        else:
            logger.error("Daily price update failed")
            return 1
            
    except Exception as e:
        error_details = traceback.format_exc()
        logger.error(f"Unhandled exception in daily update: {e}")
        logger.error(f"Error details: {error_details}")
        return 1
    finally:
        logger.info(f"Update process ended at {datetime.now()}")
        logger.info("=" * 80)

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)