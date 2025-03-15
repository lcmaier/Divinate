from logger import get_logger
from constants import *
from pymongo import MongoClient, ASCENDING


logger = get_logger(__name__)


class DatabaseManager:
    """
    Minimal database manager for setting up and maintaining MongoDB collections 
    for the scryfall_daily_updater.py.
    """
    def __init__(self, mongo_uri=MONGO_URI, db_name=MONGO_DB_NAME):
        self.mongo_uri = mongo_uri
        self.db_name = db_name
        self.client = None
        self.db = None

    def connect_to_db(self):
        """
        Connect to MongoDB database.
        Returns True if connection successful, False otherwise.
        """
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

    def setup_database(self):
        """
        Set up collections and indexes needed for scryfall_daily_updater.py.
        This method ensures the database structure is properly configured.
        """
        try:
            if not self.db:
                if not self.connect_to_db():
                    return False
                
            collections = self.db.list_collection_names()
            
            # 1. Setup card_prices collection (timeseries)
            if MONGO_COLLECTIONS["card_prices"] not in collections:
                self.db.create_collection(
                    MONGO_COLLECTIONS["card_prices"],
                    timeseries={
                        "timeField": "date",
                        "metaField": "card_key",
                        "granularity": "hours"
                    }
                )
                logger.info(f"Created time series collection: {MONGO_COLLECTIONS['card_prices']}")
            
            # 2. Set up indexes for the cards collection
            # Primary key is card_key for compatibility with scryfall_daily_updater
            self.db[MONGO_COLLECTIONS["cards"]].create_index([("card_key", ASCENDING)], unique=True)
            
            # Create index on Scryfall ID but NOT unique to avoid conflicts
            self.db[MONGO_COLLECTIONS["cards"]].create_index([("id", ASCENDING)])
            
            # Basic search indexes
            self.db[MONGO_COLLECTIONS["cards"]].create_index([("name", ASCENDING)])
            self.db[MONGO_COLLECTIONS["cards"]].create_index([("set", ASCENDING)])
            
            # Format legality indexes for filtering
            self.db[MONGO_COLLECTIONS["cards"]].create_index([("legalities.standard", ASCENDING)])
            self.db[MONGO_COLLECTIONS["cards"]].create_index([("legalities.pioneer", ASCENDING)])
            self.db[MONGO_COLLECTIONS["cards"]].create_index([("legalities.modern", ASCENDING)])
            self.db[MONGO_COLLECTIONS["cards"]].create_index([("legalities.legacy", ASCENDING)])
            self.db[MONGO_COLLECTIONS["cards"]].create_index([("legalities.vintage", ASCENDING)])
            
            logger.info("Database setup completed successfully.")
            return True
            
        except Exception as e:
            logger.error(f"Error setting up database: {e}")
            return False

    def check_database_status(self):
        """
        Check the status of the database and return basic stats.
        """
        if not self.db:
            if not self.connect_to_db():
                return "Database connection failed"
        
        try:
            card_count = self.db[MONGO_COLLECTIONS["cards"]].count_documents({})
            price_count = self.db[MONGO_COLLECTIONS["card_prices"]].count_documents({})
            
            sets = self.db[MONGO_COLLECTIONS["cards"]].distinct("set")
            set_count = len(sets)
            
            status = f"Database Status:\n"
            status += f"- Total cards: {card_count}\n"
            status += f"- Total price points: {price_count}\n"
            status += f"- Total sets: {set_count}\n"
            
            return status
            
        except Exception as e:
            logger.error(f"Error checking database status: {e}")
            return f"Error: {str(e)}"

    def close_connection(self):
        """
        Close the MongoDB connection.
        """
        if self.client:
            self.client.close()
            self.client = None
            self.db = None
            logger.info("MongoDB connection closed")


# Function to quickly set up the database
def setup_database():
    db_manager = DatabaseManager()
    success = db_manager.setup_database()
    db_manager.close_connection()
    return success


# If run directly, set up the database
if __name__ == "__main__":
    setup_database()