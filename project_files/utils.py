from constants import *
from bs4 import BeautifulSoup
import requests
import logging
from pymongo import MongoClient
from typing import Optional
import hashlib


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("mtg_price_tracker.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def _connect_to_db():
    """
    Connect to MongoDB database.
    Returns MongoDB client and database objects.
    """
    try:
        client = MongoClient(MONGO_URI)
        db = client[MONGO_DB_NAME]
        return client, db
    except Exception as e:
        logger.error(f"Error connecting to MongoDB: {e}")
        return None, None



def mtg_goldfish_login(session: requests.Session, email: str, password: str) -> bool:
    """
    Log in to MTGGoldfish using the provided email and password.
    Returns True if login is successful, False otherwise.
    """
    base_url = "https://www.mtggoldfish.com"
    login_url = f"{base_url}/login"
    try:
        response = session.get(login_url)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find the authenticity token for the email login form
        auth_token = None
        for form in soup.find_all('form', {'class': 'layout-auth-identity-form'}):
            auth_token_input = form.find('input', {'name': 'authenticity_token'})
            if auth_token_input:
                auth_token = auth_token_input.get('value')
                break
        
        if not auth_token:
            logger.error("Could not find authenticity token for login")
            return False
        
        # Build the login data
        login_data = {
            'authenticity_token': auth_token,
            'auth_key': email,
            'password': password,
            'commit': 'Log In'
        }
        
        # Post the login data
        login_post_url = f"{base_url}/auth/identity/callback"
        response = session.post(login_post_url, data=login_data, allow_redirects=True)
        
        # Check if login was successful
        if "Invalid email or password" in response.text:
            logger.error("Login failed: Invalid email or password")
            return False
            
        # Another way to check successful login is to look for elements that appear only when logged in
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Try to find an element that would only be present when logged in
        # This could be a username display, account menu, etc.
        # For example, look for a "Log Out" link or similar
        logout_link = soup.find('a', string=lambda text: text and 'Logout' in text)
        account_menu = soup.find('a', string=lambda text: text and 'My Account' in text)
        
        if logout_link or account_menu or 'auth_token' in session.cookies:
            logger.info("Login successful!")
            return True
        else:
            logger.warning("Login may have failed - could not confirm login state")
            return False
            
    except Exception as e:
        logger.error(f"Error during login: {e}")
        return False




# the key for identifying card objects between MTGGoldfish and Scryfall is set_code-collector_number if collector_number exists, otherwise
# we use the backup key of set_code-card_name-treatments (since the same card can have multiple treatments and collector numbers)
# to that end we define the following functions to get treatments out--TODO IF NEEDED: build a mapping from scryfall to MTGGoldfish tags for price updates
def extract_treatments_from_goldfish_id(goldfish_id: str) -> list:
    """
    Extract treatment information from MTGGoldfish ID.
    
    Args:
        goldfish_id: The MTGGoldfish ID string
        
    Returns:
        List of treatments (e.g., ["prerelease", "foil"])
    """
    treatments = []
    
    # Check for foil
    is_foil = goldfish_id.endswith(" (F)")
    if is_foil:
        treatments.append("foil")
    
    # Extract any treatments in angle brackets
    import re
    treatment_matches = re.findall(r'<([^>]+)>', goldfish_id)
    for treatment in treatment_matches:
        treatments.append(treatment.lower())
    
    return treatments


def extract_treatments_from_scryfall(card_data: dict) -> list:
    """
    Extract treatment information from Scryfall card data.
    
    Args:
        card_data: The Scryfall card data
        
    Returns:
        List of treatments in normalized format
    """
    treatments = []
    
    # Check for finishes (foil, etched, etc.)
    finishes = card_data.get('finishes', [])
    for finish in finishes:
        if finish != "nonfoil":  # Skip nonfoil as it's the default
            treatments.append(finish)
    
    # Check promo status
    if card_data.get('promo', False):
        treatments.append('promo')
    
    # Check frame effects
    frame_effects = card_data.get('frame_effects', [])
    for effect in frame_effects:
        treatments.append(effect)
    
    # Check for prerelease
    if 'prerelease' in card_data.get('keywords', []) or 'prerelease' in card_data.get('frame_effects', []):
        treatments.append('prerelease')
    
    # Check for extended art
    if card_data.get('full_art', False):
        treatments.append('fullart')
    
    # Check for borderless
    if card_data.get('border_color') == 'borderless':
        treatments.append('borderless')
    
    # Check collector number for special indicators
    collector_number = card_data.get('collector_number', '')
    if collector_number.startswith('p'):
        treatments.append('promo')
    elif collector_number.startswith('s'):
        treatments.append('special')
    
    # Remove duplicates and return
    return list(set(treatments))



def generate_card_key(set_code: str, collector_number: Optional[str], card_name: Optional[str]) -> str:
    """
    Generate a consistent card_key from available information.
    For cards with collector numbers, use set_code-collector_number.
    For sealed products or other items without collector numbers, use a hash-based key.
    
    Args:
        set_code: The set code
        collector_number: The collector number (may be None or empty)
        card_name: The name of the card (used for fallback when collector_number is unavailable)
        
    Returns:
        A unique card_key
    """
    # Normalize set_code to lowercase
    set_code = set_code.lower()


    # Primary method: If we have a valid collector number
    if collector_number and collector_number.strip() and collector_number.strip()[0] != 'S':
        # Ensure collector_number is a clean string
        collector_number = collector_number.strip()
        return f"{set_code}-{collector_number}"
    
    # Fallback: Use card_name if available (both Scryfall and MTGGoldfish have card names)
    elif card_name:
        # Create a stable hash from the card_name
        hash_id = hashlib.md5(card_name.encode('utf-8')).hexdigest()[:8]
        return f"{set_code}-name-{hash_id}"
    
    # Last resort: Generate a random identifier (should rarely happen)
    else:
        import uuid
        key = f"{set_code}-rnd-{str(uuid.uuid4())[:8]}"
        logger.warning(f"Generating random card_key for set {set_code} - missing collector number and card name. Generated key is {key}")
        return key
    


def get_set_tuples() -> list[tuple[str, str]]:
    try:
        response = requests.get("https://api.scryfall.com/sets")
        response.raise_for_status()

        data = response.json()
        sets_info = []
        for set_data in data["data"]:
            sets_info.append((set_data["code"], set_data["name"]))

        return sets_info

    except Exception as e:
        "Error getting set tuples, exiting."
        return []