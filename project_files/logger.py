"""
Centralized logging configuration for the MTG Price Predictor Dashboard.
This module provides a consistent logging setup across all application components.
"""

import logging
import io
import sys
from pathlib import Path
from datetime import datetime
from typing import Optional

# Get the project root directory 
PROJECT_ROOT = Path(__file__).parent

# Define paths
LOGS_DIR = PROJECT_ROOT / "logs"
CHANGELOGS_DIR = PROJECT_ROOT / "logs" / "changelogs"

# Ensure log directories exist
LOGS_DIR.mkdir(exist_ok=True)
CHANGELOGS_DIR.mkdir(exist_ok=True)

# Default log format
DEFAULT_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s'
SIMPLE_FORMAT = '%(asctime)s - %(message)s'

# Add a custom formatter that handles Unicode safely
class UnicodeCompatibleFormatter(logging.Formatter):
    """
    A formatter that safely handles Unicode characters regardless of environment.
    This prevents errors when logging strings with special characters.
    """
    def format(self, record):
        # Format the message using the parent formatter
        formatted_message = super().format(record)
        
        # If we're in a Windows environment with a console that might not support Unicode
        if sys.platform == 'win32' and isinstance(sys.stdout, io.TextIOWrapper) and sys.stdout.encoding != 'utf-8':
            # Replace or strip problematic characters
            try:
                # First try to encode using the system's encoding with replacements
                return formatted_message.encode(sys.stdout.encoding, errors='replace').decode(sys.stdout.encoding)
            except UnicodeError:
                # If that fails, strip to ASCII as a last resort
                return ''.join(c if ord(c) < 128 else '?' for c in formatted_message)
        else:
            # For systems with proper Unicode support, return as-is
            return formatted_message

# Set up the root logger
root_logger = logging.getLogger()
root_logger.setLevel(logging.INFO)

# Main application log file
def get_main_log_file():
    """Get the path to the main application log file."""
    return LOGS_DIR / "mtg_price_tracker.log"

# Add handlers to the root logger only if they don't exist yet
if not root_logger.handlers:
    # Create file handler for the main application log with UTF-8 encoding
    file_handler = logging.FileHandler(get_main_log_file(), encoding='utf-8')
    file_handler.setFormatter(UnicodeCompatibleFormatter(DEFAULT_FORMAT))
    root_logger.addHandler(file_handler)
    
    # Create console handler with Unicode safety
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(UnicodeCompatibleFormatter(DEFAULT_FORMAT))
    root_logger.addHandler(console_handler)

# Dictionary to keep track of special loggers we've created
_special_loggers = {}

def get_logger(name: str) -> logging.Logger:
    """
    Get a named logger that inherits the root logger's configuration.
    
    Args:
        name: The name of the logger, typically __name__ from the calling module
        
    Returns:
        A configured logger
    """
    return logging.getLogger(name)

def get_changelog_logger() -> logging.Logger:
    """
    Get or create a special logger for card database change tracking.
    This logger writes to its own daily log file and doesn't propagate to the root logger.
    
    Returns:
        A configured changelog logger
    """
    # Use cached logger if it exists
    if 'changelog' in _special_loggers:
        return _special_loggers['changelog']
    
    # Create a unique log file for today's update
    today = datetime.now().strftime("%Y-%m-%d")
    log_file = CHANGELOGS_DIR / f"mtg_changes_{today}.log"
    
    # Set up the changelog logger
    changelog_logger = logging.getLogger("mtg_changelog")
    changelog_logger.setLevel(logging.INFO)
    
    # Important: disable propagation to avoid messages going to the root logger
    changelog_logger.propagate = False
    
    # Remove any existing handlers
    for handler in changelog_logger.handlers[:]:
        changelog_logger.removeHandler(handler)
    
    # Create a file handler with UTF-8 encoding
    file_handler = logging.FileHandler(log_file, mode='a', encoding='utf-8')
    file_handler.setLevel(logging.INFO)
    
    # Create a formatter
    formatter = UnicodeCompatibleFormatter(SIMPLE_FORMAT)
    file_handler.setFormatter(formatter)
    
    # Add the handler to the logger
    changelog_logger.addHandler(file_handler)
    
    # Cache the logger
    _special_loggers['changelog'] = changelog_logger
    
    return changelog_logger

def get_daily_update_logger() -> logging.Logger:
    """
    Get or create a special logger for daily update processes.
    This logger writes to a daily log file.
    
    Returns:
        A configured daily update logger
    """
    # Use cached logger if it exists
    if 'daily_update' in _special_loggers:
        return _special_loggers['daily_update']
    
    # Create a unique log file for today's update
    today = datetime.now().strftime("%Y%m%d")
    log_file = LOGS_DIR / f"daily_update_{today}.log"
    
    # Set up the logger
    update_logger = logging.getLogger("daily_update")
    update_logger.setLevel(logging.INFO)
    
    # Keep propagation enabled so messages also go to the main log
    
    # Remove any existing handlers
    for handler in update_logger.handlers[:]:
        update_logger.removeHandler(handler)
    
    # Create a file handler with UTF-8 encoding
    file_handler = logging.FileHandler(log_file, mode='a', encoding='utf-8')
    file_handler.setLevel(logging.INFO)
    
    # Create a formatter
    formatter = UnicodeCompatibleFormatter(DEFAULT_FORMAT)
    file_handler.setFormatter(formatter)
    
    # Add the handler to the logger
    update_logger.addHandler(file_handler)
    
    # Cache the logger
    _special_loggers['daily_update'] = update_logger
    
    return update_logger

# Convenience function for setting log levels
def set_log_level(level: int, logger_name: Optional[str] = None):
    """
    Set the logging level for a specific logger or the root logger.
    
    Args:
        level: Logging level (e.g., logging.DEBUG, logging.INFO)
        logger_name: Optional name of the logger to modify (None = root logger)
    """
    if logger_name:
        logging.getLogger(logger_name).setLevel(level)
    else:
        root_logger.setLevel(level)