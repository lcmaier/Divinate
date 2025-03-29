import logging
from pathlib import Path
import requests
from bs4 import BeautifulSoup
from urllib.parse import quote_plus
from typing import Optional
import time
import os
import hashlib
import json
from constants import *
from utils import mtg_goldfish_login, generate_card_key
from typing import Optional, Dict

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


# create directories if they don't already exist
for directory in [DATA_DIR, SET_DATA_DIR, MODELS_DIR]:
    directory.mkdir(parents=True, exist_ok=True)


class MTGGoldfishScraper:
    """
    Class to hold all functionality related to scraping MTGGoldfish
    Required arguments for initialization:
    - set_code: The code for the set to scrape. 3 letters, all caps (ex: WOE).
    - set_name: The name of the set to scrape. Capitalization as it appears on MTGGoldfish (ex: Wilds of Eldraine).
    - email: The email address associated with the MTGGoldfish account.
    - password: The password associated with the MTGGoldfish account.
    """
    def __init__(self, set_code, set_name, email, password) -> None:
        self.set_code = set_code
        self.set_name = set_name
        self.email = email
        self.password = password
        self.base_url = "https://www.mtggoldfish.com"
        self.session = requests.Session()
        self.headers = MTGGOLDFISH_HEADERS
        # Add these headers to the session
        self.session.headers.update(self.headers)

        # now that we've specified set code, create the set-specific directory
        self.set_downloads_dir = SET_DATA_DIR / self.set_code
        self.set_downloads_dir.mkdir(parents=True, exist_ok=True)

        # create manifest id dict (format is hashed_val: card_name) to ensure no collisions
        # if already exists, read from file
        if (self.set_downloads_dir / "manifest.json").is_file():
            try:
                with open(self.set_downloads_dir / "manifest.json", 'r') as f:
                    self.manifest_id_dict = json.load(f)
            except json.JSONDecodeError:
                logger.error(f"Error decoding JSON from {self.set_downloads_dir / 'manifest.json'}. Creating new manifest.")
                self.manifest_id_dict = {}
        else:
            self.manifest_id_dict = {}
        return


    
    def login(self) -> bool:
        return mtg_goldfish_login(self.session, self.email, self.password)
    
    # def assign_synthetic_collector_numbers(self, manifest_dict, set_code: str):
    #     """
    #     Assigns unique synthetic collector numbers to sealed products that don't have them.
        
    #     Args:
    #         manifest_dict: The manifest dictionary containing card information
    #         set_code: The set code to process
            
    #     Returns:
    #         Updated manifest dictionary with synthetic collector numbers for sealed products
    #     """
    #     # First, find the maximum existing collector number for this set
    #     max_collector_num = 0
    #     product_without_numbers = []
        
    #     # Identify products without collector numbers and find max
    #     for file_id, card_info in manifest_dict.items():
    #         if card_info['set_code'] != set_code:
    #             continue
                
    #         set_number = card_info.get('set_number')
            
    #         # Skip if not a product for this set
    #         if not set_number:
    #             product_without_numbers.append(file_id)
    #             continue
                
    #         try:
    #             # Handle numeric collector numbers
    #             num = int(''.join(filter(str.isdigit, set_number)))
    #             max_collector_num = max(max_collector_num, num)
    #         except (ValueError, TypeError):
    #             # If we can't parse it as a number, add to products without numbers
    #             product_without_numbers.append(file_id)
        
    #     # Now assign synthetic collector numbers to products without them
    #     next_collector_num = max_collector_num + 1
        
    #     for file_id in product_without_numbers:
    #         # Create a synthetic collector number prefixed with 'S' (for sealed)
    #         synthetic_number = f"S{next_collector_num}"
            
    #         # Update the manifest entry
    #         manifest_dict[file_id]['set_number'] = synthetic_number
            
    #         # Also update the card_key to include this new number
    #         manifest_dict[file_id]['card_key'] = f"{set_code}-{synthetic_number}"
            
    #         # Log the mapping to help with debugging/reference
    #         product_name = manifest_dict[file_id]['name']
    #         logger.info(f"Assigned synthetic collector number {synthetic_number} to sealed product: {product_name}")
            
    #         # Increment for the next product
    #         next_collector_num += 1
        
    #     return manifest_dict

    def get_cards_info(self) -> list[dict]:
        """
        Creates list of dictionaries for each card with the following fields:
            'name': card name,
            'goldfish_id': MTG Card ID,
            'set_number': set_number, (TODO: Deprecate)
            'tags': ','.join(tags), (TODO: Deprecate)
            'rarity': rarity, (TODO: Deprecate)
            'download_url': download_url
        """
        # set up the URL to scrape
        url = f"{self.base_url}/sets/{self.set_name.replace(':', '').replace(' ', '+').replace('\'', '').replace('.', '')}/All+Cards#paper"
        # HARDCODED EXCEPTIONS BECAUSE MTGGOLDFISH DOES NOT STANDARDIZE THEIR URLS VERY WELL
        match self.set_code:
            case "one":
                url = f"{self.base_url}/sets/PhyrexiaAll+Will+Be+One/All+Cards#paper"
            case "mkm":
                url = f"{self.base_url}/sets/Ravnica+Murders+at+Karlov+Manor#paper"
            case "lci":
                url = f"{self.base_url}/sets/Lost+Caverns+of+Ixalan#paper"
            case "mkc":
                url = f"{self.base_url}/sets/Ravnica+Murders+at+Karlov+Manor+Commander#paper"
            case "lcc":
                url = f"{self.base_url}/sets/Lost+Caverns+of+Ixalan+Commander#paper"
            case "wot":
                url = f"{self.base_url}/sets/Enchanting+Tales#paper"
            case "ltc":
                url = f"{self.base_url}/sets/The+Lord+of+the+Rings+Tales+of+Middle+Earth+Commander#paper"
            case "ltr":
                url = f"{self.base_url}/sets/The+Lord+of+the+Rings+Tales+of+Middle+Earth#paper"
            case "sld":
                url = f"{self.base_url}/sets/Secret+Lair#paper"
            case "scd":
                url = f"{self.base_url}/sets/Starter+Commander#paper"
            case "brr":
                url = f"{self.base_url}/sets/The+Brothers+War+Retro+Frame+Artifacts#paper"
            case "gn3":
                url = f"{self.base_url}/sets/Game+Night+Free-For-All#paper"
            case "40k":
                url = f"{self.base_url}/sets/Warhammer+40K+Commander+Decks#paper"
            case "ncc":
                url = f"{self.base_url}/sets/Streets+of+New+Capenna+Commander#paper"
            case "nec":
                url = f"{self.base_url}/sets/Kamigawa+Neon+Dynasty+Commander#paper"
            case "voc":
                url = f"{self.base_url}/sets/Innistrad+Crimson+Vow+Commander#paper"
            case "mic":
                url = f"{self.base_url}/sets/Innistrad+Midnight+Hunt+Commander#paper"
            case "afc":
                url = f"{self.base_url}/sets/Adventures+in+the+Forgotten+Realms+Commander#paper"
            case "gk2":
                url = f"{self.base_url}/sets/Ravnica+Allegiance+Guild+Kits#paper"
            case "gs1":
                url = f"{self.base_url}/sets/Global+Series#paper"
            case "mm3":
                url = f"{self.base_url}/sets/Modern+Masters+2017+Edition#paper"


        logger.info(f"Fetching card URLs for set {self.set_name} from url: {url}")

        try:
            response = self.session.get(url)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, 'html.parser')
            card_info_list = []

            # locate the table containing the card names and URLs
            table = soup.find('table', {'class': 'card-container-table table table-striped table-sm'})

            if not table:
                logger.error(f"No table found for set {self.set_name}")
                return []
            
            table = table.find('tbody')
            # iterate through each row of the table
            missing_card_names = 0
            missing_card_links = 0
            for row in table.find_all('tr')[1:]: # skip first row since it's the header
                logger.debug(f"Row: {row}")
                # extract relevant info
                cells = row.find_all('td')
                logger.debug(f"Cells: {cells}")
                set_number = cells[0].text.strip() if len(cells) > 0 else None
                name_span = cells[1].find('span', {'class': 'card_name'}) if len(cells) > 1 else None

                rarity = cells[3].text.strip() if len(cells) > 3 else None
                
                if not name_span:
                    missing_card_names += 1

                # example HTML for a name cell:
                # <a data-card-id="Agatha's Soul Cauldron [WOE]" data-full-image="https://cdn1.mtggoldfish.com/images/gf/Agatha%2527s%2BSoul%2BCauldron%2B%255BWOE%255D.jpg" rel="popover" href="/price/Wilds+of+Eldraine/Agathas+Soul+Cauldron" data-original-title="" title="">Agatha's Soul Cauldron</a>
                # with that in mind, we parse the name and URL
                card_link = name_span.find('a', href=True)

                if not card_link:
                    missing_card_links += 1
                    continue

                card_name = card_link.text.strip()

                # Extract all tags from badge spans
                tags = []
                
                # Find all badge spans
                badge_spans = row.find_all('span', {'class': 'badge'})
                for badge in badge_spans:
                    badge_text = badge.text.strip()
                    tags.append(badge_text)

                     # Log badge classes to help discover all possible badge types
                    badge_classes = ' '.join(badge.get('class', []))
                    logger.debug(f"Found badge: {badge_classes} with text: {badge_text}")

                # Download link for a card is mtggoldfish.com/price-download/paper/CARDNAME+[SETCODE] (i.e. just encoding the card name and set code in UTF-8)
                goldfish_id = card_link.get('data-card-id')

                
                url_encoded = quote_plus(goldfish_id)
                download_url = f"{self.base_url}/price-download/paper/{url_encoded}"

                # generate card key
                card_key = generate_card_key(self.set_code, set_number, card_name)


                card_info = {
                        'name': card_name,
                        'goldfish_id': goldfish_id,
                        'card_key': card_key,
                        'set_number': set_number,
                        'tags': ','.join(tags),
                        'rarity': rarity,
                        'download_url': download_url
                    }
                    
                card_info_list.append(card_info)
            
            logger.info(f"Found {len(card_info_list)} card URLs for set {self.set_name}. {missing_card_names} cards names were missing and {missing_card_links} card links were missing.")

            missing_cards = missing_card_names + missing_card_links
            if missing_cards > 0:
                logger.warning(f"Missing {missing_cards} cards in set {self.set_name}.")
            
            return card_info_list



        except Exception as e:
            logger.error(f"Error fetching card URLs for set {self.set_name}: {e}")
            time.sleep(5)
            return []
        

    def download_price_history(self, card_info: dict) -> Optional[Path]:
        """
        Downloads the price history CSV for a given card.

        Args:
            card_info: Dictionary generated by get_cards_info() containing the card's name, card ID, and download URL.
        
        Returns:
            Path to the downloaded file if successful, None otherwise.
        """
        # first pull info from dictionary
        card_name = card_info['name']
        goldfish_id = card_info['goldfish_id']
        download_url = card_info['download_url']
        set_number = card_info['set_number']
        card_key = card_info['card_key']
        tags = card_info['tags']
        rarity = card_info['rarity']

        logger.info(f"Downloading price history for card_key = {card_key} (goldfish id = {goldfish_id})")

        # Create a manifest file path
        manifest_path = self.set_downloads_dir / "manifest.json"
        # Create a hash of the (unique) goldfish id
        file_id = hashlib.md5(goldfish_id.encode('utf-8')).hexdigest()[:10] # truncate to 10 characters
        # create and validate the manifest record
        manifest_record = self.manifest_id_dict.get(file_id)
        if manifest_record and type(manifest_record) != dict:
            logger.warning(f"Card id {file_id} has malformed manifest. Expected a dictionary or nothing but got {type(manifest_record)}. The manifest is\n{manifest_record}")

        if manifest_record and manifest_record.get('name') != card_name:
            logger.info(f"Collision detected in file_id hashing for {goldfish_id}. Adding a character and rehashing.")
            file_id = hashlib.md5(goldfish_id.encode('utf-8')).hexdigest()[:11] # truncate to 11 characters to avoid collision
        


        # now that manifest is created, we try to download the price history
        csv_filename = f"{file_id}.csv"
        csv_path = self.set_downloads_dir / csv_filename

        # check if the file already exists
        if csv_path.exists():
            logger.info(f"File {csv_filename} already exists in {self.set_code} folder. Skipping download.")
            return csv_path
        
        try:
            # rate limit the requests to avoid getting throttled
            time.sleep(1)

            response = self.session.get(download_url)
            response.raise_for_status()

            # save the response content to a file
            with open(csv_path, 'wb') as f:
                f.write(response.content)

            # verify the file was created
            if os.path.getsize(csv_path) > 0:
                with open(csv_path, 'r') as f:
                    first_few = []
                    for _ in range(5):
                        try:
                            first_few.append(next(f))
                        except StopIteration:
                            break

                # verify content looks like pairs of the form (M)M/DD/YYYY,PRICE
                two_columns = []
                date_format_ok = []
                price_format_ok = []

                for line in first_few:
                    if not line.strip():
                        continue
                        
                    parts = line.strip().split(',')
                    if len(parts) >= 2:  # Check if there are at least 2 parts
                        two_columns.append(True)
                        
                        date_parts = parts[0].split('-')
                        date_format_ok.append(len(date_parts) == 3)
                        
                        try:
                            float(parts[1])
                            price_format_ok.append(True)
                        except ValueError:
                            price_format_ok.append(False)
                    else:
                        two_columns.append(False)
                
                format_ok = all(two_columns and date_format_ok and price_format_ok)
                if format_ok:
                    # if the manifest already exists, read from file
                    manifest = {}
                    if manifest_path.exists():
                        try:
                            with open(manifest_path, 'r') as f:
                                manifest = json.load(f)

                        except json.JSONDecodeError:
                            logger.error(f"Error decoding JSON from {manifest_path}. Creating new manifest.")
                    
                    # update manifest with new file_id's information
                    manifest[file_id] = {
                        'goldfish_id': goldfish_id,
                        'name': card_name,
                        'set_number': set_number,
                        'card_key': card_key,
                        'tags': tags,
                        'rarity': rarity,
                        'set_code': self.set_code,
                        'set_name': self.set_name,
                        'filename': csv_filename
                    }


                    with open(manifest_path, 'w') as f:
                        json.dump(manifest, f, indent=2)

                    logger.info(f"Successfully downloaded price history for {card_name} to {self.set_code} folder")
                    return csv_path
                
                else:
                    logger.error(f"Downloaded file for {card_name} is populated but not in the expected format")
                    # Keep the file for inspection but return None
                    return None
                
            else:
                # we have an empty file
                logger.warning(f"Downloaded file for {card_name} is empty")
                # remove from OS
                os.remove(csv_path)
                return None
        
        except Exception as e:
            logger.error(f"Error downloading price history for card {card_name}: {e}")
            return None
    
    # def assign_synthetic_collector_numbers_to_manifest(self):
    #     """
    #     Process the manifest file after all downloads are complete.
    #     Assigns synthetic collector numbers to sealed products and updates the manifest.
    #     """
    #     manifest_path = self.set_downloads_dir / "manifest.json"

    #     if not manifest_path.exists():
    #         logger.warning(f"No manifest file found at {manifest_path}")
    #         return
        
    #     try:
    #         # Read the existing manifest
    #         with open(manifest_path, 'r') as f:
    #             manifest = json.load(f)
            
    #         # Skip if manifest is empty
    #         if not manifest:
    #             logger.warning(f"Manifest is empty for set {self.set_code}")
    #             return

    #         # Count sealed products
    #         sealed_product_count = sum(1 for info in manifest.values() 
    #                                 if not info.get('is_card'))
            
    #         if sealed_product_count > 0:
    #             logger.info(f"Found {sealed_product_count} sealed products without collector numbers in set {self.set_code}")
                
    #             # Find the maximum existing collector number
    #             updated_manifest = self.assign_synthetic_collector_numbers(manifest, self.set_code)
    #             # write updated manifest back to file
    #             with open(manifest_path, 'w') as f:
    #                 json.dump(updated_manifest, f, indent=2)
    #         return    
        
    #     except Exception as e:
    #         logger.error(f"Error processing manifest for set {self.set_code}: {e}")


# below is example usage, will be copied into main.py
for set, setname in SETS:
    scraper = MTGGoldfishScraper(set, setname, EMAIL, PASSWORD)
    logged_in = scraper.login()
    if logged_in:
        card_urls = scraper.get_cards_info()
        for card in card_urls:
            scraper.download_price_history(card)