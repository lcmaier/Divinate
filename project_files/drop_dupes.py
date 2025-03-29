#!/usr/bin/env python
"""
MongoDB Duplicate Price Records Cleanup

This script identifies and removes duplicate price entries from the card_prices collection,
keeping only the most recent entry for each unique combination of card_key, date, and finish.
"""

from pymongo import MongoClient
from datetime import datetime
from logger import get_logger
from constants import MONGO_URI, MONGO_DB_NAME, MONGO_COLLECTIONS
import argparse

# Set up logging
logger = get_logger(__name__)

def connect_to_db(mongo_uri=MONGO_URI, db_name=MONGO_DB_NAME):
    """Connect to MongoDB and return client and database objects."""
    try:
        client = MongoClient(mongo_uri)
        db = client[db_name]
        # Test connection
        db.command('ping')
        logger.info(f"Connected to MongoDB at {mongo_uri}")
        return client, db
    except Exception as e:
        logger.error(f"Error connecting to MongoDB: {e}")
        return None, None

def find_duplicates(db, date_str=None):
    """
    Find duplicate price entries for the specified date or all dates.
    
    Args:
        db: MongoDB database connection
        date_str: Optional date string in YYYY-MM-DD format
        
    Returns:
        Dictionary with statistics about duplicates found
    """
    prices_collection = db[MONGO_COLLECTIONS["card_prices"]]
    
    # Create date filter if a specific date is provided
    date_filter = {}
    if date_str:
        try:
            date_obj = datetime.strptime(date_str, "%Y-%m-%d")
            # Create filter for the entire day
            start_of_day = datetime(date_obj.year, date_obj.month, date_obj.day, 0, 0, 0)
            end_of_day = datetime(date_obj.year, date_obj.month, date_obj.day, 23, 59, 59)
            date_filter = {"date": {"$gte": start_of_day, "$lte": end_of_day}}
            logger.info(f"Looking for duplicates on {date_str}")
        except ValueError:
            logger.error(f"Invalid date format: {date_str}. Expected YYYY-MM-DD")
            return None
    
    # Create aggregation pipeline to find duplicates
    pipeline = [
        {"$match": date_filter},
        {"$group": {
            "_id": {
                "card_key": "$card_key", 
                "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$date"}},
                "finish": "$finish"
            },
            "count": {"$sum": 1},
            "doc_ids": {"$push": "$_id"}
        }},
        {"$match": {"count": {"$gt": 1}}},
        {"$sort": {"_id.date": 1, "_id.card_key": 1}}
    ]
    
    duplicate_groups = list(prices_collection.aggregate(pipeline))
    
    if not duplicate_groups:
        logger.info("No duplicates found")
        return {"duplicates_found": 0}
    
    # Calculate statistics
    total_dupes = 0
    total_docs_to_remove = 0
    unique_keys_affected = len(duplicate_groups)
    
    for group in duplicate_groups:
        count = group["count"]
        docs_to_remove = count - 1  # Keep one document per group
        total_dupes += count
        total_docs_to_remove += docs_to_remove
    
    stats = {
        "duplicates_found": total_dupes,
        "unique_keys_affected": unique_keys_affected,
        "docs_to_remove": total_docs_to_remove
    }
    
    logger.info(f"Found {total_dupes} duplicate price records across {unique_keys_affected} unique card_key/date/finish combinations")
    logger.info(f"Will remove {total_docs_to_remove} documents to deduplicate")
    
    return stats, duplicate_groups

def remove_duplicates(db, duplicate_groups, dry_run=True):
    """
    Remove duplicate price entries, keeping the one with the most recent _id.
    This optimized version batches delete operations for better performance.
    
    Args:
        db: MongoDB database connection
        duplicate_groups: Groups of duplicate documents from find_duplicates()
        dry_run: If True, only report what would be done without making changes
        
    Returns:
        Number of documents removed
    """
    if dry_run:
        logger.info("DRY RUN: No documents will be removed")
    
    prices_collection = db[MONGO_COLLECTIONS["card_prices"]]
    total_removed = 0
    
    # For large operations, batch the deletions
    all_ids_to_remove = []
    batch_size = 5000  # Adjust based on your MongoDB server capacity
    total_groups = len(duplicate_groups)
    
    logger.info(f"Processing {total_groups} groups with duplicates...")
    
    for i, group in enumerate(duplicate_groups):
        doc_ids = group["doc_ids"]
        # Sort by _id in descending order (assuming higher _id means more recent)
        doc_ids.sort(reverse=True)
        # Keep the first one (most recent), remove the rest
        ids_to_remove = doc_ids[1:]
        all_ids_to_remove.extend(ids_to_remove)
        
        # Log progress periodically
        if (i+1) % 10000 == 0 or i+1 == total_groups:
            logger.info(f"Processed {i+1}/{total_groups} groups ({((i+1)/total_groups)*100:.1f}%)")
        
        # Execute batch deletion when batch is full or at the end
        if len(all_ids_to_remove) >= batch_size or i+1 == total_groups:
            if not dry_run and all_ids_to_remove:
                logger.info(f"Deleting batch of {len(all_ids_to_remove)} records...")
                start_time = datetime.now()
                result = prices_collection.delete_many({"_id": {"$in": all_ids_to_remove}})
                end_time = datetime.now()
                removed = result.deleted_count
                total_removed += removed
                duration = (end_time - start_time).total_seconds()
                logger.info(f"Deleted {removed} records in {duration:.2f} seconds ({removed/duration:.1f} records/sec)")
                # Clear the batch
                all_ids_to_remove = []
            else:
                total_removed += len(all_ids_to_remove)
                all_ids_to_remove = []
    
    if dry_run:
        logger.info(f"DRY RUN: Would remove {total_removed} duplicate records")
    else:
        logger.info(f"Successfully removed {total_removed} duplicate records")
    
    return total_removed

def main():
    """Main function to find and remove duplicates."""
    parser = argparse.ArgumentParser(description="Clean up duplicate price records in MongoDB")
    parser.add_argument("--date", help="Specific date to check for duplicates (YYYY-MM-DD format)")
    parser.add_argument("--execute", action="store_true", help="Actually remove duplicates (without this flag, runs in dry-run mode)")
    parser.add_argument("--fast", action="store_true", help="Skip finding duplicates and directly delete all but the newest record for each card_key/date/finish combination")
    args = parser.parse_args()
    
    # Connect to database
    client, db = connect_to_db()
    if db is None:
        logger.error("Failed to connect to database")
        return 1
    
    try:
        if args.fast and not args.execute:
            logger.warning("--fast option requires --execute. Switching to normal mode.")
            args.fast = False
            
        # Fast mode: directly update the database without building the duplicate list first
        if args.fast and args.execute:
            logger.info("Running in FAST mode - directly deduplicating the collection...")
            result = deduplicate_fast(db, args.date)
            logger.info(f"Fast deduplication complete. Database optimized.")
            return 0
            
        # Normal mode: find duplicates first, then remove them
        stats, duplicate_groups = find_duplicates(db, args.date)
        
        if not stats or stats["duplicates_found"] == 0:
            logger.info("No duplicates found. Database is clean.")
            return 0
        
        # Remove duplicates if not in dry-run mode
        dry_run = not args.execute
        if dry_run:
            logger.info("Running in dry-run mode. Use --execute to actually remove duplicates.")
        
        removed = remove_duplicates(db, duplicate_groups, dry_run)
        
        if not dry_run:
            logger.info(f"Cleanup complete. Removed {removed} duplicate records.")
        
        return 0
    
    except Exception as e:
        logger.error(f"Error in duplicate cleanup: {e}")
        return 1
    
    finally:
        # Close database connection
        if client:
            client.close()
            logger.info("Database connection closed")


def deduplicate_fast(db, date_str=None):
    """
    Faster deduplication that uses MongoDB's aggregation to do the work.
    This is much more efficient for large collections.
    
    Args:
        db: MongoDB database connection
        date_str: Optional date string in YYYY-MM-DD format
        
    Returns:
        Number of documents removed
    """
    prices_collection = db[MONGO_COLLECTIONS["card_prices"]]
    
    # Create date filter if a specific date is provided
    date_filter = {}
    if date_str:
        try:
            date_obj = datetime.strptime(date_str, "%Y-%m-%d")
            # Create filter for the entire day
            start_of_day = datetime(date_obj.year, date_obj.month, date_obj.day, 0, 0, 0)
            end_of_day = datetime(date_obj.year, date_obj.month, date_obj.day, 23, 59, 59)
            date_filter = {"date": {"$gte": start_of_day, "$lte": end_of_day}}
            logger.info(f"Deduplicating records from {date_str}")
        except ValueError:
            logger.error(f"Invalid date format: {date_str}. Expected YYYY-MM-DD")
            return 0
    
    # First, create a temporary collection with the most recent document for each group
    logger.info("Creating temporary collection with the most recent document for each group...")
    
    # Use MongoDB's aggregation to find the latest record for each card_key/date/finish combo
    pipeline = [
        {"$match": date_filter},
        {"$sort": {"_id": -1}},  # Sort by _id descending (newer first)
        {"$group": {
            "_id": {
                "card_key": "$card_key", 
                "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$date"}},
                "finish": "$finish"
            },
            "doc_id": {"$first": "$_id"}  # Keep the most recent document's _id
        }}
    ]
    
    # Create a list of IDs to keep
    start_time = datetime.now()
    ids_to_keep = [doc["doc_id"] for doc in prices_collection.aggregate(pipeline)]
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    logger.info(f"Found {len(ids_to_keep)} unique records to keep in {duration:.2f} seconds")
    
    # Delete all documents except those with IDs in the ids_to_keep list
    if ids_to_keep:
        start_time = datetime.now()
        delete_filter = {"_id": {"$nin": ids_to_keep}}
        if date_filter:
            # Combine with date filter if present
            delete_filter.update(date_filter)
            
        logger.info(f"Deleting duplicate records...")
        result = prices_collection.delete_many(delete_filter)
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        logger.info(f"Deleted {result.deleted_count} duplicate records in {duration:.2f} seconds")
        return result.deleted_count
    else:
        logger.info("No records to keep identified. This is unexpected.")
        return 0

if __name__ == "__main__":
    exit(main())