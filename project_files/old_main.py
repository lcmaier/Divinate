import logging
from scraper import MTGGoldfishScraper
from ingestor import PriceIngestor
from scryfall_daily_updater import DailyPriceUpdater
from constants import *
from utils import *
from stack_logging import with_caller_logging
import json

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("mtg_price_tracker.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@with_caller_logging
def download_sets(setlist:list[tuple[str, str]]):
    logger.debug(f"setlist: {setlist}")
    missing_sets = []
    for set_code, set_name in setlist:
        scraper = MTGGoldfishScraper(set_code, set_name, EMAIL, PASSWORD)
        logged_in = scraper.login()
        if logged_in:
            card_urls = scraper.get_cards_info()
            for card in card_urls:
                scraper.download_price_history(card)
        else:
            # append set we failed to grab to return list
            missing_sets.append((set_code, set_name))
            # after all downloads complete, process manifest and assign synthetic collector numbers if any
            scraper.assign_synthetic_collector_numbers_to_manifest()
    return missing_sets


def get_sets_from_scryfall_bulk():
    """
    Get all sets from the latest Scryfall bulk data download.
    
    Returns:
        List of (set_code, set_name) tuples
    """
    try:
        # Initialize the updater just to use its methods
        updater = DailyPriceUpdater()
        
        # Get the bulk data info
        bulk_info = updater.get_latest_bulk_data_info()
        if not bulk_info:
            logger.error("Failed to get bulk data info")
            return []
        
        # Get or download the bulk data file
        bulk_data_path = updater.download_bulk_data(bulk_info)
        if not bulk_data_path:
            logger.error("Failed to download bulk data")
            return []
        
        # Extract unique set codes and names
        set_dict = {}
        
        with open(bulk_data_path, 'r', encoding='utf-8') as f:
            cards = json.load(f)
            
            for card in cards:
                set_code = card.get('set')
                set_name = card.get('set_name')
                
                if set_code and set_name:
                    set_dict[set_code] = set_name
        
        set_list = [(code, name) for code, name in set_dict.items()]
        logger.info(f"Found {len(set_list)} sets in Scryfall bulk data")
        return set_list
    
    except Exception as e:
        logger.error(f"Error getting sets from Scryfall bulk data: {e}")
        return []



def ingest_price_data(setcodelist: list[tuple[str,str]]):
    ing = PriceIngestor()
    status = ing.connect_to_db()
    logger.debug(f"Status of database connection: {status}")
    if not status:
        logger.error("Failed to connect to MongoDB. Exiting.")
        ing.close_connection()
        return False
    
    status = ing.create_collections_and_indexes()
    if not status:
        logger.error("Failed to create collections and indexes in MongoDB. Exiting.")
        ing.close_connection()
        return False

    for set_code, _ in setcodelist:
        ing.ingest_set_prices(set_code)
    
    ing.close_connection()
    logger.info("Done with price ingestion.")
    return True

def update_card_metadata(format_str: str):
    updater = DailyPriceUpdater(MONGO_URI, MONGO_DB_NAME, format_str)
    status = updater.connect_to_db()
    if not status:
        logger.error("Failed to connect to MongoDB for Scryfall updates. Exiting.")
        return False
    
    logger.info("Importing card metadata from Scryfall bulk data...")
    update_success = updater.import_scryfall_card_data()
    if update_success:
        logger.info("Successfully imported card metadata")
    else:
        logger.error("Failed to import card metadata")
    return update_success

@with_caller_logging
def ingest_sets(setcodelist: list[tuple[str,str]], format_str: str):
    ingest_price_data(setcodelist)
    update_card_metadata(format_str)


if __name__ == '__main__':
    format_str = "Vintage"
    sets = get_sets_from_scryfall_bulk()
    logger.debug(f"Type of sets: {type(sets)}")
    logger.info(f"Sets to download: {sets}")
    download_sets(sets)
    # data should be downloaded, now ingest it

    ingest_sets(sets, format_str)
    exit(0)