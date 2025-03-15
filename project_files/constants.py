from pathlib import Path
import os

# Get the project root directory (one level up from constants.py)
PROJECT_ROOT = Path(os.path.dirname(os.path.abspath(__file__))).parent

# Define paths relative to the project root
DATA_DIR = PROJECT_ROOT / "data"
DB_PATH = DATA_DIR / "mtg_prices.db"
SET_DATA_DIR = DATA_DIR / "set_data"
MODELS_DIR = PROJECT_ROOT / "models"
SCRYFALL_BULK_DIR = DATA_DIR / "scryfall_bulk_daily"

# Read credentials from the file in the project root
with open(PROJECT_ROOT / "credentials.txt") as f:
    lines = f.readlines()
    EMAIL = lines[0].strip()
    PASSWORD = lines[1].strip()

MTGGOLDFISH_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Referer': 'https://www.mtggoldfish.com/'
}

SCRYFALL_HEADERS = {
    'User-Agent': 'MTGPriceTracker/1.0 (Personal Project)',
    'Accept': 'application/json',
    'Content-Type': 'application/json'
}

SCRYFALL_BULK_DATA_URL = "https://api.scryfall.com/bulk-data"

# MongoDB constants
MONGO_URI = "mongodb://localhost:27017/"
MONGO_DB_NAME = "mtg_price_tracker"
MONGO_COLLECTIONS = {
    "cards": "cards",
    "card_prices": "card_prices" # time series collection
}

MAR1225_MISSING_SETS = [
    # ('pss4', 'MKM Standard Showdown'), # no price info even on Scryfall
    # ('pmkm', 'Murders at Karlov Manor Promos'), # no MTGG price data
    # ('pl24', 'Year of the Dragon 2024'), # no MTGG price data
    # ('pw24', 'Wizards Play Network 2024'), # no MTGG price data
    # ('plci', 'The Lost Caverns of Ixalan Promos'), # no MTGG price data
    # ('pmat', 'March of the Machine: The Aftermath Promos'), # no MTGG price data
    # ('pwoe', 'Wilds of Eldraine Promos'), # no MTGG price data
    # ('pmda', 'Magic Duel Masters Promos'), # no MTGG price data
    # ('p30t', '30th Anniversary Celebration Tokyo'), # no MTGG price data
    # ('pmom', 'March of the Machine Promos'), # no MTGG price data
    # ('slp', 'Secret Lair Showdown'), # no MTGG price data
    # ('pw23', 'Wizards Play Network 2023'), # no MTGG price data
    # ('p23', 'Judge Gift Cards 2023'), # no MTGG price data
    # ('pbro', "The Brothers' War Promos"), # no MTGG price data
    # ('p30h', '30th Anniversary History Promos'), # no MTGG price data
    # ('pdmu', 'Dominaria United Promos'), # no MTGG price data
    # ('p30a', '30th Anniversary Play Promos'), # no MTGG price data
    # ('sch', 'Store Championships'), # no MTGG price data
    # ('pclb', "Battle for Baldur's Gate Promos"), # no MTGG price data
    # ('pncc', 'New Capenna Commander Promos'), # no MTGG price data
    # ('psnc', 'Streets of New Capenna Promos'), # no MTGG price data
    # ('pw22', 'Wizards Play Network 2022'), # no MTGG price data
    # ('p22', 'Judge Gift Cards 2022'), # no MTGG price data
    # ('pvow', 'Innistrad: Crimson Vow Promos'), # no MTGG price data
    # ('q06', 'Pioneer Challenger Decks 2021'), # no MTGG price data
    # ('plg21', 'Love Your LGS 2021'), # no MTGG price data
    # ('pw21', 'Wizards Play Network 2021'), # no MTGG price data
    # ('pkhm', 'Kaldheim Promos'), # no MTGG price data
    # ('pznr', 'Zendikar Rising Promos'), # no MTGG price data
    # ('pm21', 'Core Set 2021 Promos'), # no MTGG price data 
    # ('piko', 'Ikoria: Lair of Behemoths Promos'), # no MTGG price data
    # ('pwcs', 'Planeswalker Championship Promos'), # no MTGG price data
    # ('pm20', 'Core Set 2020 Promos'), # no MTGG price data
    # ('ppp1', 'M20 Promo Packs'), # no MTGG price data
    # ('pwar', 'War of the Spark Promos'), # no MTGG price data
    # ('j19', 'Judge Gift Cards 2019'), # no MTGG price data
    # ('prw2', 'RNA Ravnica Weekend'), # no MTGG price data
    # ('prna', 'Ravnica Allegiance Promos'), # no MTGG price data
    # ('pm19', 'Core Set 2019 Promos'), # no MTGG price data
    # ('pss3', 'M19 Standard Showdown'), # no MTGG price data
    # ('pdom', 'Dominaria Promos'), # no MTGG price data
    # ('prix', 'Rivals of Ixalan Promos'), # no MTGG price data
    # ('pxtc', 'XLN Treasure Chest'), # no MTGG price data
    # ('g17', '2017 Gift Pack'), # no MTGG price data
    # ('pxln', 'Ixalan Promos'), # no MTGG price data
    # ('pss2', 'XLN Standard Showdown'), # no MTGG price data
    # ('phou', 'Hour of Devastation Promos'), # no MTGG price data
    # ('pakh', 'Amonkhet Promos'), # no MTGG price data
    # ('pkld', 'Kaladesh Promos'), # no MTGG price data
    # ('pemn', 'Eldritch Moon Promos'), # no MTGG price data
    # ('pogw', 'Oath of the Gatewatch Promos'), # no MTGG price data
    # ('pz1', 'Legendary Cube Prize Pack'), # no MTGG price data
    # ('pbfz', 'Battle for Zendikar Promos'), # no MTGG price data
    # ('cp3', 'Magic Origins Clash Pack'), # no MTGG price data
    # ('pori', 'Magic Origins Promos'), # no MTGG price data
    # ('ptkdf', 'Tarkir Dragonfury'), # no MTGG price data
    # ('pdtk', 'Dragons of Tarkir Promos'), # no MTGG price data
    # ('pfrf', 'Fate Reforged Promos'), # no MTGG price data
    # ('cp2', 'Fate Reforged Clash Pack'), # no MTGG price data
    # ('f15', 'Friday Night Magic 2015'), # no MTGG price data
    # ('m15', 'Magic 2015'), # no MTGG price data
    ('ori', 'Magic Origins'),
    # ('cp1', 'Magic 2015 Clash Pack'), # no MTGG price data
    # ('pm15', 'Magic 2015 Promos'), # no MTGG price data
    # ('pjou', 'Journey into Nyx Promos'), # no MTGG price data
    # ('f14', 'Friday Night Magic 2014'), # no MTGG price data
    # ('j14', 'Judge Gift Cards 2014'), # no MTGG price data
    # ('c13', 'Commander 2013'), # no MTGG price data
    ('m14', 'Magic 2014'), 
    # ('psdc', 'San Diego Comic-Con 2013'), # no MTGG price data
    # ('pdgm', "Dragon's Maze Promos"), # no MTGG price data
    # ('pgtc', 'Gatecrash Promos'), # no MTGG price data
    # ('pdp14', 'Duels of the Planeswalkers 2014 Promos '), # no MTGG price data
    # ('prtr', 'Return to Ravnica Promos'), # no MTGG price data
    ('pc2', 'Planechase 2012'), 
    # ('pidw', 'IDW Comics Inserts'), # no MTGG price data
    # ('f12', 'Friday Night Magic 2012'), # no MTGG price data
    # ('pisd', 'Innistrad Promos'), # no MTGG price data
    ('cmd', 'Commander 2011'), 
    ('td2', 'Duel Decks: Mirrodin Pure vs. New Phyrexia'), 
    # ('pmps11', 'Magic Premiere Shop 2011'), # no MTGG price data
    # ('ps11', 'Salvat 2011'), # no MTGG price data
    # ('g11', 'Judge Gift Cards 2011'), # no MTGG price data
    # ('f11', 'Friday Night Magic 2011'), # no MTGG price data
    # ('p11', 'Magic Player Rewards 2011'), # no MTGG price data
    # ('psom', 'Scars of Mirrodin Promos'), # no MTGG price data
    # ('pmps10', 'Magic Premiere Shop 2010'), # no MTGG price data
    # ('f10', 'Friday Night Magic 2010'), # no MTGG price data
    # ('p10', 'Magic Player Rewards 2010'), # no MTGG price data
    # ('pzen', 'Zendikar Promos'), # no MTGG price data
    # ('pmps09', 'Magic Premiere Shop 2009'), # no MTGG price data
    # ('p09', 'Magic Player Rewards 2009'), # no MTGG price data
    # ('pmps08', 'Magic Premiere Shop 2008'), # no MTGG price data
    # ('p08', 'Magic Player Rewards 2008'), # no MTGG price data
    # ('pmps07', 'Magic Premiere Shop 2007'), # no MTGG price data
    # ('p07', 'Magic Player Rewards 2007'), # no MTGG price data
    ('tsb', 'Time Spiral Timeshifted'), 
    ('cst', 'Coldsnap Theme Decks'), 
    # ('pcmp', 'Champs and States'), # no MTGG price data
    # ('pmps06', 'Magic Premiere Shop 2006'), # no MTGG price data
    # ('pal06', 'Arena League 2006'), # no MTGG price data
    # ('dci', 'DCI Promos'), # no MTGG price data
    # ('p06', 'Magic Player Rewards 2006'), # no MTGG price data
    # ('phuk', 'Hachette UK'), # no MTGG price data
    # ('pmps', 'Magic Premiere Shop 2005'), # no MTGG price data
    # ('psal', 'Salvat 2005'), # no MTGG price data
    # ('p9ed', 'Ninth Edition Promos'), # no MTGG price data
    # ('pal05', 'Arena League 2005'), # no MTGG price data
    # ('f05', 'Friday Night Magic 2005'), # no MTGG price data
    # ('pal04', 'Arena League 2004'), # no MTGG price data
    # ('pjjt', 'Japan Junior Tournament'), # no MTGG price data
    # ('pal03', 'Arena League 2003'), # no MTGG price data
    # ('f03', 'Friday Night Magic 2003'), # no MTGG price data
    # ('pal02', 'Arena League 2002'), # no MTGG price data
    # ('pal01', 'Arena League 2001'), # no MTGG price data
    # ('g01', 'Judge Gift Cards 2001'), # no MTGG price data
    # ('f01', 'Friday Night Magic 2001'), # no MTGG price data
    # ('pelp', 'European Land Program'), # no MTGG price data
    # ('pal00', 'Arena League 2000'), # no MTGG price data
    # ('fnm', 'Friday Night Magic 2000'), # no MTGG price data
    # ('psus', 'Junior Super Series'), # no MTGG price data
    # ('pwos', 'Wizards of the Coast Online Store'), # no MTGG price data
    # ('pgru', 'Guru'), # no MTGG price data
    # ('pal99', 'Arena League 1999'), # no MTGG price data
    # ('palp', 'Asia Pacific Land Program'), # no MTGG price data
    ('itp', 'Introductory Two-Player Set'), 
    ('parl', 'Arena League 1996'), 
    ('rqs', 'Rivals Quick Start Set'), 
    ('rin', 'Rinascimento'), 
    ('ren', 'Renaissance'),  
    ('pmei', 'Media and Collaboration Promos'), 
    ('sum', 'Summer Magic / Edgar'), 
    ('2ed', 'Unlimited Edition'), 
    ('leb', 'Limited Edition Beta'), 
    ('lea', 'Limited Edition Alpha')
]


SETS = [
    ('pdft', 'Aetherdrift Promos'),
    ('pl25', 'Year of the Snake 2025'),
    ('drc', 'Aetherdrift Commander'),
    ('dft', 'Aetherdrift'),
    ('pjsc', 'Japan Standard Cup'),
    ('inr', 'Innistrad Remastered'),
    ('pspl', 'Spotlight Series'),
    ('pio', 'Pioneer Masters'),
    ('pfdn', 'Foundations Promos'),
    ('fdn', 'Foundations'),
    ('j25', 'Foundations Jumpstart'),
    ('dsc', 'Duskmourn: House of Horror Commander'),
    ('pdsk', 'Duskmourn: House of Horror Promos'),
    ('dsk', 'Duskmourn: House of Horror'),
    ('plg24', 'Love Your LGS 2024'),
    ('pblb', 'Bloomburrow Promos'),
    ('blb', 'Bloomburrow'),
    ('pcbb', 'Cowboy Bebop'),
    ('blc', 'Bloomburrow Commander'),
    ('mb2', 'Mystery Booster 2'),
    ('acr', "Assassin's Creed"),
    ('mh3', 'Modern Horizons 3'),
    ('m3c', 'Modern Horizons 3 Commander'),
    ('potj', 'Outlaws of Thunder Junction Promos'),
    ('otp', 'Breaking News'),
    ('otc', 'Outlaws of Thunder Junction Commander'),
    ('big', 'The Big Score'),
    ('otj', 'Outlaws of Thunder Junction'),
    ('pip', 'Fallout'),
    ('clu', 'Ravnica: Clue Edition'),
    ('pss4', 'MKM Standard Showdown'),
    ('pmkm', 'Murders at Karlov Manor Promos'),
    ('mkm', 'Murders at Karlov Manor'),
    ('mkc', 'Murders at Karlov Manor Commander'),
    ('pl24', 'Year of the Dragon 2024'),
    ('rvr', 'Ravnica Remastered'),
    ('pw24', 'Wizards Play Network 2024'),
    ('spg', 'Special Guests'),
    ('plci', 'The Lost Caverns of Ixalan Promos'),
    ('lci', 'The Lost Caverns of Ixalan'),
    ('pmat', 'March of the Machine: The Aftermath Promos'),
    ('rex', 'Jurassic World Collection'),
    ('lcc', 'The Lost Caverns of Ixalan Commander'),
    ('who', 'Doctor Who'),
    ('pwoe', 'Wilds of Eldraine Promos'),
    ('woc', 'Wilds of Eldraine Commander'),
    ('wot', 'Wilds of Eldraine: Enchanting Tales'),
    ('pmda', 'Magic   Duel Masters Promos'),
    ('woe', 'Wilds of Eldraine'),
    ('p30t', '30th Anniversary Celebration Tokyo'),
    ('cmm', 'Commander Masters'),
    ('ha7', 'Historic Anthology 7'),
    ('ltc', 'Tales of Middle-earth Commander'),
    ('ltr', 'The Lord of the Rings: Tales of Middle-earth'),
    ('mat', 'March of the Machine: The Aftermath'),
    ('pmom', 'March of the Machine Promos'),
    ('mul', 'Multiverse Legends'),
    ('mom', 'March of the Machine'),
    ('moc', 'March of the Machine Commander'),
    ('sis', 'Shadows of the Past'),
    ('sir', 'Shadows over Innistrad Remastered'),
    ('slp', 'Secret Lair Showdown'),
    ('pl23', 'Year of the Rabbit 2023'),
    ('pone', 'Phyrexia: All Will Be One Promos'),
    ('one', 'Phyrexia: All Will Be One'),
    ('onc', 'Phyrexia: All Will Be One Commander'),
    ('dmr', 'Dominaria Remastered'),
    ('pw23', 'Wizards Play Network 2023'),
    ('p23', 'Judge Gift Cards 2023'),
    ('ea2', 'Explorer Anthology 2'),
    ('scd', 'Starter Commander Decks'),
    ('j22', 'Jumpstart 2022'),
    ('brc', "The Brothers' War Commander"),
    ('brr', "The Brothers' War Retro Artifacts"),
    ('pbro', "The Brothers' War Promos"),
    ('bro', "The Brothers' War"),
    ('slc', 'Secret Lair 30th Anniversary Countdown Kit'),
    ('gn3', 'Game Night: Free-for-All'),
    ('unf', 'Unfinity'),
    ('40k', 'Warhammer 40,000 Commander'),
    ('p30h', '30th Anniversary History Promos'),
    ('pdmu', 'Dominaria United Promos'),
    ('dmu', 'Dominaria United'),
    ('dmc', 'Dominaria United Commander'),
    ('p30a', '30th Anniversary Play Promos'),
    ('sch', 'Store Championships'),
    ('2x2', 'Double Masters 2022'),
    ('hbg', "Alchemy Horizons: Baldur's Gate"),
    ('pclb', "Battle for Baldur's Gate Promos"),
    ('clb', "Commander Legends: Battle for Baldur's Gate"),
    ('pncc', 'New Capenna Commander Promos'),
    ('snc', 'Streets of New Capenna'),
    ('ncc', 'New Capenna Commander'),
    ('psnc', 'Streets of New Capenna Promos'),
    ('gdy', 'Game Day Promos'),
    ('pw22', 'Wizards Play Network 2022'),
    ('neo', 'Kamigawa: Neon Dynasty'),
    ('nec', 'Neon Dynasty Commander'),
    ('cc2', 'Commander Collection: Black'),
    ('dbl', 'Innistrad: Double Feature'),
    ('p22', 'Judge Gift Cards 2022'),
    ('pvow', 'Innistrad: Crimson Vow Promos'),
    ('voc', 'Crimson Vow Commander'),
    ('vow', 'Innistrad: Crimson Vow'),
    ('q06', 'Pioneer Challenger Decks 2021'),
    ('mic', 'Midnight Hunt Commander'),
    ('mid', 'Innistrad: Midnight Hunt'),
    ('j21', 'Jumpstart: Historic Horizons'),
    ('afc', 'Forgotten Realms Commander'),
    ('afr', 'Adventures in the Forgotten Realms'),
    ('plg21', 'Love Your LGS 2021'),
    ('pw21', 'Wizards Play Network 2021'),
    ('mh2', 'Modern Horizons 2'),
    ('c21', 'Commander 2021'),
    ('stx', 'Strixhaven: School of Mages'),
    ('sta', 'Strixhaven Mystical Archive'),
    ('tsr', 'Time Spiral Remastered'),
    ('ha4', 'Historic Anthology 4'),
    ('pkhm', 'Kaldheim Promos'),
    ('khc', 'Kaldheim Commander'),
    ('khm', 'Kaldheim'),
    ('cmr', 'Commander Legends'),
    ('klr', 'Kaladesh Remastered'),
    ('plst', 'The List'),
    ('pznr', 'Zendikar Rising Promos'),
    ('znr', 'Zendikar Rising'),
    ('zne', 'Zendikar Rising Expeditions'),
    ('znc', 'Zendikar Rising Commander'),
    ('anb', 'Arena Beginner Set'),
    ('akr', 'Amonkhet Remastered'),
    ('2xm', 'Double Masters'),
    ('ajmp', 'Jumpstart Arena Exclusives'),
    ('jmp', 'Jumpstart'),
    ('pm21', 'Core Set 2021 Promos'),
    ('m21', 'Core Set 2021'),
    ('slu', 'Secret Lair: Ultimate Edition'),
    ('ha3', 'Historic Anthology 3'),
    ('piko', 'Ikoria: Lair of Behemoths Promos'),
    ('iko', 'Ikoria: Lair of Behemoths'),
    ('c20', 'Commander 2020'),
    ('ha2', 'Historic Anthology 2'),
    ('und', 'Unsanctioned'),
    ('pthb', 'Theros Beyond Death Promos'),
    ('thb', 'Theros Beyond Death'),
    ('pf20', 'MagicFest 2020'),
    ('sld', 'Secret Lair Drop'),
    ('ha1', 'Historic Anthology 1'),
    ('gn2', 'Game Night 2019'),
    ('peld', 'Throne of Eldraine Promos'),
    ('eld', 'Throne of Eldraine'),
    ('pwcs', 'Planeswalker Championship Promos'),
    ('c19', 'Commander 2019'),
    ('pm20', 'Core Set 2020 Promos'),
    ('ppp1', 'M20 Promo Packs'),
    ('m20', 'Core Set 2020'),
    ('ss2', 'Signature Spellbook: Gideon'),
    ('mh1', 'Modern Horizons'),
    ('pwar', 'War of the Spark Promos'),
    ('war', 'War of the Spark'),
    ('j19', 'Judge Gift Cards 2019'),
    ('prw2', 'RNA Ravnica Weekend'),
    ('gk2', 'RNA Guild Kit'),
    ('prna', 'Ravnica Allegiance Promos'),
    ('rna', 'Ravnica Allegiance'),
    ('pf19', 'MagicFest 2019'),
    ('puma', 'Ultimate Box Topper'),
    ('uma', 'Ultimate Masters'),
    ('gnt', 'Game Night'),
    ('prwk', 'GRN Ravnica Weekend'),
    ('gk1', 'GRN Guild Kit'),
    ('pgrn', 'Guilds of Ravnica Promos'),
    ('grn', 'Guilds of Ravnica'),
    ('c18', 'Commander 2018'),
    ('ana', 'Arena New Player Experience'),
    ('pana', 'MTG Arena Promos'),
    ('oana', 'Arena New Player Experience Cards'),
    ('pm19', 'Core Set 2019 Promos'),
    ('pss3', 'M19 Standard Showdown'),
    ('m19', 'Core Set 2019'),
    ('gs1', 'Global Series Jiang Yanggu & Mu Yanling'),
    ('ss1', 'Signature Spellbook: Jace'),
    ('cm2', 'Commander Anthology Volume II'),
    ('bbd', 'Battlebond'),
    ('pdom', 'Dominaria Promos'),
    ('dom', 'Dominaria'),
    ('ddu', 'Duel Decks: Elves vs. Inventors'),
    ('a25', 'Masters 25'),
    ('prix', 'Rivals of Ixalan Promos'),
    ('rix', 'Rivals of Ixalan'),
    ('ust', 'Unstable'),
    ('pxtc', 'XLN Treasure Chest'),
    ('e02', 'Explorers of Ixalan'),
    ('ima', 'Iconic Masters'),
    ('ddt', 'Duel Decks: Merfolk vs. Goblins'),
    ('g17', '2017 Gift Pack'),
    ('pxln', 'Ixalan Promos'),
    ('xln', 'Ixalan'),
    ('pss2', 'XLN Standard Showdown'),
    ('c17', 'Commander 2017'),
    ('phou', 'Hour of Devastation Promos'),
    ('hou', 'Hour of Devastation'),
    ('e01', 'Archenemy: Nicol Bolas'),
    ('cma', 'Commander Anthology'),
    ('pakh', 'Amonkhet Promos'),
    ('akh', 'Amonkhet'),
    ('mp2', 'Amonkhet Invocations'),
    ('w17', 'Welcome Deck 2017'),
    ('dds', 'Duel Decks: Mind vs. Might'),
    ('mm3', 'Modern Masters 2017'),
    ('aer', 'Aether Revolt'),
    ('pca', 'Planechase Anthology'),
    ('pz2', 'Treasure Chest'),
    ('c16', 'Commander 2016'),
    ('pkld', 'Kaladesh Promos'),
    ('kld', 'Kaladesh'),
    ('mps', 'Kaladesh Inventions'),
    ('ddr', 'Duel Decks: Nissa vs. Ob Nixilis'),
    ('cn2', 'Conspiracy: Take the Crown'),
    ('pemn', 'Eldritch Moon Promos'),
    ('emn', 'Eldritch Moon'),
    ('ema', 'Eternal Masters'),
    ('soi', 'Shadows over Innistrad'),
    ('w16', 'Welcome Deck 2016'),
    ('ddq', 'Duel Decks: Blessed vs. Cursed'),
    ('ogw', 'Oath of the Gatewatch'),
    ('pogw', 'Oath of the Gatewatch Promos'),
    ('pz1', 'Legendary Cube Prize Pack'),
    ('c15', 'Commander 2015'),
    ('bfz', 'Battle for Zendikar'),
    ('pbfz', 'Battle for Zendikar Promos'),
    ('ddp', 'Duel Decks: Zendikar vs. Eldrazi'),
    ('v15', 'From the Vault: Angels'),
    ('cp3', 'Magic Origins Clash Pack'),
    ('pori', 'Magic Origins Promos'),
    ('ori', 'Magic Origins'),
    ('mm2', 'Modern Masters 2015'),
    ('tpr', 'Tempest Remastered'),
    ('ptkdf', 'Tarkir Dragonfury'),
    ('pdtk', 'Dragons of Tarkir Promos'),
    ('dtk', 'Dragons of Tarkir'),
    ('ddo', 'Duel Decks: Elspeth vs. Kiora'),
    ('pfrf', 'Fate Reforged Promos'),
    ('cp2', 'Fate Reforged Clash Pack'),
    ('frf', 'Fate Reforged'),
    ('f15', 'Friday Night Magic 2015'),
    ('jvc', 'Duel Decks Anthology: Jace vs. Chandra'),
    ('evg', 'Duel Decks Anthology: Elves vs. Goblins'),
    ('dvd', 'Duel Decks Anthology: Divine vs. Demonic'),
    ('gvl', 'Duel Decks Anthology: Garruk vs. Liliana'),
    ('c14', 'Commander 2014'),
    ('ktk', 'Khans of Tarkir'),
    ('ddn', 'Duel Decks: Speed vs. Cunning'),
    ('m15', 'Magic 2015'),
    ('cp1', 'Magic 2015 Clash Pack'),
    ('pm15', 'Magic 2015 Promos'),
    ('cns', 'Conspiracy'),
    ('md1', 'Modern Event Deck 2014'),
    ('jou', 'Journey into Nyx'),
    ('pjou', 'Journey into Nyx Promos'),
    ('ddm', 'Duel Decks: Jace vs. Vraska'),
    ('bng', 'Born of the Gods'),
    ('f14', 'Friday Night Magic 2014'),
    ('j14', 'Judge Gift Cards 2014'),
    ('c13', 'Commander 2013'),
    ('ths', 'Theros'),
    ('ddl', 'Duel Decks: Heroes vs. Monsters'),
    ('v13', 'From the Vault: Twenty'),
    ('m14', 'Magic 2014'),
    ('psdc', 'San Diego Comic-Con 2013'),
    ('mma', 'Modern Masters'),
    ('dgm', "Dragon's Maze"),
    ('pdgm', "Dragon's Maze Promos"),
    ('ddk', 'Duel Decks: Sorin vs. Tibalt'),
    ('gtc', 'Gatecrash'),
    ('pgtc', 'Gatecrash Promos'),
    ('pdp14', 'Duels of the Planeswalkers 2014 Promos '),
    ('rtr', 'Return to Ravnica'),
    ('prtr', 'Return to Ravnica Promos'),
    ('ddj', 'Duel Decks: Izzet vs. Golgari'),
    ('m13', 'Magic 2013'),
    ('pc2', 'Planechase 2012'),
    ('avr', 'Avacyn Restored'),
    ('ddi', 'Duel Decks: Venser vs. Koth'),
    ('dka', 'Dark Ascension'),
    ('pidw', 'IDW Comics Inserts'),
    ('f12', 'Friday Night Magic 2012'),
    ('pd3', 'Premium Deck Series: Graveborn'),
    ('isd', 'Innistrad'),
    ('pisd', 'Innistrad Promos'),
    ('ddh', 'Duel Decks: Ajani vs. Nicol Bolas'),
    ('v11', 'From the Vault: Legends'),
    ('m12', 'Magic 2012'),
    ('cmd', 'Commander 2011'),
    ('td2', 'Duel Decks: Mirrodin Pure vs. New Phyrexia'),
    ('nph', 'New Phyrexia'),
    ('ddg', 'Duel Decks: Knights vs. Dragons'),
    ('mbs', 'Mirrodin Besieged'),
    ('me4', 'Masters Edition IV'),
    ('pmps11', 'Magic Premiere Shop 2011'),
    ('ps11', 'Salvat 2011'),
    ('g11', 'Judge Gift Cards 2011'),
    ('f11', 'Friday Night Magic 2011'),
    ('p11', 'Magic Player Rewards 2011'),
    ('pd2', 'Premium Deck Series: Fire and Lightning'),
    ('td0', 'Magic Online Theme Decks'),
    ('som', 'Scars of Mirrodin'),
    ('psom', 'Scars of Mirrodin Promos'),
    ('ddf', 'Duel Decks: Elspeth vs. Tezzeret'),
    ('m11', 'Magic 2011'),
    ('arc', 'Archenemy'),
    ('dpa', 'Duels of the Planeswalkers'),
    ('roe', 'Rise of the Eldrazi'),
    ('dde', 'Duel Decks: Phyrexia vs. the Coalition'),
    ('wwk', 'Worldwake'),
    ('pmps10', 'Magic Premiere Shop 2010'),
    ('f10', 'Friday Night Magic 2010'),
    ('p10', 'Magic Player Rewards 2010'),
    ('h09', 'Premium Deck Series: Slivers'),
    ('ddd', 'Duel Decks: Garruk vs. Liliana'),
    ('pzen', 'Zendikar Promos'),
    ('zen', 'Zendikar'),
    ('me3', 'Masters Edition III'),
    ('hop', 'Planechase'),
    ('m10', 'Magic 2010'),
    ('arb', 'Alara Reborn'),
    ('ddc', 'Duel Decks: Divine vs. Demonic'),
    ('con', 'Conflux'),
    ('pmps09', 'Magic Premiere Shop 2009'),
    ('p09', 'Magic Player Rewards 2009'),
    ('dd2', 'Duel Decks: Jace vs. Chandra'),
    ('ala', 'Shards of Alara'),
    ('me2', 'Masters Edition II'),
    ('drb', 'From the Vault: Dragons'),
    ('shm', 'Shadowmoor'),
    ('mor', 'Morningtide'),
    ('pmps08', 'Magic Premiere Shop 2008'),
    ('p08', 'Magic Player Rewards 2008'),
    ('dd1', 'Duel Decks: Elves vs. Goblins'),
    ('lrw', 'Lorwyn'),
    ('me1', 'Masters Edition'),
    ('10e', 'Tenth Edition'),
    ('fut', 'Future Sight'),
    ('pgpx', 'Grand Prix Promos'),
    ('ppro', 'Pro Tour Promos'),
    ('pmps07', 'Magic Premiere Shop 2007'),
    ('p07', 'Magic Player Rewards 2007'),
    ('tsb', 'Time Spiral Timeshifted'),
    ('tsp', 'Time Spiral'),
    ('cst', 'Coldsnap Theme Decks'),
    ('csp', 'Coldsnap'),
    ('dis', 'Dissension'),
    ('pcmp', 'Champs and States'),
    ('gpt', 'Guildpact'),
    ('pmps06', 'Magic Premiere Shop 2006'),
    ('pal06', 'Arena League 2006'),
    ('dci', 'DCI Promos'),
    ('p06', 'Magic Player Rewards 2006'),
    ('phuk', 'Hachette UK'),
    ('pmps', 'Magic Premiere Shop 2005'),
    ('rav', 'Ravnica: City of Guilds'),
    ('psal', 'Salvat 2005'),
    ('p9ed', 'Ninth Edition Promos'),
    ('9ed', 'Ninth Edition'),
    ('sok', 'Saviors of Kamigawa'),
    ('pal05', 'Arena League 2005'),
    ('f05', 'Friday Night Magic 2005'),
    ('unh', 'Unhinged'),
    ('chk', 'Champions of Kamigawa'),
    ('dst', 'Darksteel'),
    ('pal04', 'Arena League 2004'),
    ('mrd', 'Mirrodin'),
    ('8ed', 'Eighth Edition'),
    ('scg', 'Scourge'),
    ('pjjt', 'Japan Junior Tournament'),
    ('pal03', 'Arena League 2003'),
    ('f03', 'Friday Night Magic 2003'),
    ('ons', 'Onslaught'),
    ('prm', 'Magic Online Promos'),
    ('pal02', 'Arena League 2002'),
    ('dkm', 'Deckmasters'),
    ('ody', 'Odyssey'),
    ('apc', 'Apocalypse'),
    ('7ed', 'Seventh Edition'),
    ('pls', 'Planeshift'),
    ('pal01', 'Arena League 2001'),
    ('g01', 'Judge Gift Cards 2001'),
    ('f01', 'Friday Night Magic 2001'),
    ('inv', 'Invasion'),
    ('btd', 'Beatdown Box Set'),
    ('pelp', 'European Land Program'),
    ('pal00', 'Arena League 2000'),
    ('fnm', 'Friday Night Magic 2000'),
    ('psus', 'Junior Super Series'),
    ('brb', 'Battle Royale Box Set'),
    ('mmq', 'Mercadian Masques'),
    ('pwos', 'Wizards of the Coast Online Store'),
    ('pgru', 'Guru'),
    ('s99', 'Starter 1999'),
    ('ptk', 'Portal Three Kingdoms'),
    ('6ed', 'Classic Sixth Edition'),
    ('pal99', 'Arena League 1999'),
    ('ath', 'Anthologies'),
    ('usg', "Urza's Saga"),
    ('palp', 'Asia Pacific Land Program'),
    ('ugl', 'Unglued'),
    ('p02', 'Portal Second Age'),
    ('sth', 'Stronghold'),
    ('tmp', 'Tempest'),
    ('por', 'Portal'),
    ('5ed', 'Fifth Edition'),
    ('vis', 'Visions'),
    ('itp', 'Introductory Two-Player Set'),
    ('mir', 'Mirage'),
    ('parl', 'Arena League 1996'),
    ('rqs', 'Rivals Quick Start Set'),
    ('rin', 'Rinascimento'),
    ('ren', 'Renaissance'),
    ('chr', 'Chronicles'),
    ('bchr', 'Chronicles Foreign Black Border'),
    ('ice', 'Ice Age'),
    ('4bb', 'Fourth Edition Foreign Black Border'),
    ('4ed', 'Fourth Edition'),
    ('pmei', 'Media and Collaboration Promos'),
    ('drk', 'The Dark'),
    ('sum', 'Summer Magic / Edgar'),
    ('fbb', 'Foreign Black Border'),
    ('3ed', 'Revised Edition'),
    ('atq', 'Antiquities'),
    ('arn', 'Arabian Nights'),
    ('2ed', 'Unlimited Edition'),
    ('leb', 'Limited Edition Beta'),
    ('lea', 'Limited Edition Alpha')
]