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

DIGITAL_ONLY_SET_CODES = [
    'ajmp',
    'akr',
    'ana',
    'anb',
    'ea1',
    'ea2',
    'ea3',
    'ha1',
    'ha2',
    'ha3',
    'ha4',
    'ha5',
    'ha6',
    'ha7',
    'j21',
    'klr',
    'me1',
    'me2',
    'me3',
    'me4',
    'oana',
    'pana',
    'past',
    'pio',
    'pmoa',
    'prm',
    'psdg',
    'pz1',
    'pz2',
    'sir',
    'sis',
    'td0',
    'td2',
    'tpr',
    'vma',
    'xana'
]


SETS = [
    ('pdft', 'Aetherdrift Promos'),
    ('pl25', 'Year of the Snake 2025'),
    ('drc', 'Aetherdrift Commander'),
    ('dft', 'Aetherdrift'),
    ('pjsc', 'Japan Standard Cup'),
    ('inr', 'Innistrad Remastered'),
    ('pspl', 'Spotlight Series'),
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
    ('ltc', 'Tales of Middle-earth Commander'),
    ('ltr', 'The Lord of the Rings: Tales of Middle-earth'),
    ('mat', 'March of the Machine: The Aftermath'),
    ('pmom', 'March of the Machine Promos'),
    ('mul', 'Multiverse Legends'),
    ('mom', 'March of the Machine'),
    ('moc', 'March of the Machine Commander'),
    ('slp', 'Secret Lair Showdown'),
    ('pl23', 'Year of the Rabbit 2023'),
    ('pone', 'Phyrexia: All Will Be One Promos'),
    ('one', 'Phyrexia: All Will Be One'),
    ('onc', 'Phyrexia: All Will Be One Commander'),
    ('dmr', 'Dominaria Remastered'),
    ('pw23', 'Wizards Play Network 2023'),
    ('p23', 'Judge Gift Cards 2023'),
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
    ('afc', 'Forgotten Realms Commander'),
    ('afr', 'Adventures in the Forgotten Realms'),
    ('plg21', 'Love Your LGS 2021'),
    ('pw21', 'Wizards Play Network 2021'),
    ('mh2', 'Modern Horizons 2'),
    ('c21', 'Commander 2021'),
    ('stx', 'Strixhaven: School of Mages'),
    ('sta', 'Strixhaven Mystical Archive'),
    ('tsr', 'Time Spiral Remastered'),
    ('pkhm', 'Kaldheim Promos'),
    ('khc', 'Kaldheim Commander'),
    ('khm', 'Kaldheim'),
    ('cmr', 'Commander Legends'),
    ('plst', 'The List'),
    ('pznr', 'Zendikar Rising Promos'),
    ('znr', 'Zendikar Rising'),
    ('zne', 'Zendikar Rising Expeditions'),
    ('znc', 'Zendikar Rising Commander'),
    ('2xm', 'Double Masters'),
    ('jmp', 'Jumpstart'),
    ('pm21', 'Core Set 2021 Promos'),
    ('m21', 'Core Set 2021'),
    ('slu', 'Secret Lair: Ultimate Edition'),
    ('piko', 'Ikoria: Lair of Behemoths Promos'),
    ('iko', 'Ikoria: Lair of Behemoths'),
    ('c20', 'Commander 2020'),
    ('und', 'Unsanctioned'),
    ('pthb', 'Theros Beyond Death Promos'),
    ('thb', 'Theros Beyond Death'),
    ('pf20', 'MagicFest 2020'),
    ('sld', 'Secret Lair Drop'),
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
    ('c15', 'Commander 2015'),
    ('bfz', 'Battle for Zendikar'),
    ('pbfz', 'Battle for Zendikar Promos'),
    ('ddp', 'Duel Decks: Zendikar vs. Eldrazi'),
    ('v15', 'From the Vault: Angels'),
    ('cp3', 'Magic Origins Clash Pack'),
    ('pori', 'Magic Origins Promos'),
    ('ori', 'Magic Origins'),
    ('mm2', 'Modern Masters 2015'),
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
    ('nph', 'New Phyrexia'),
    ('ddg', 'Duel Decks: Knights vs. Dragons'),
    ('mbs', 'Mirrodin Besieged'),
    ('pmps11', 'Magic Premiere Shop 2011'),
    ('ps11', 'Salvat 2011'),
    ('g11', 'Judge Gift Cards 2011'),
    ('f11', 'Friday Night Magic 2011'),
    ('p11', 'Magic Player Rewards 2011'),
    ('pd2', 'Premium Deck Series: Fire and Lightning'),
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
    ('hop', 'Planechase'),
    ('m10', 'Magic 2010'),
    ('arb', 'Alara Reborn'),
    ('ddc', 'Duel Decks: Divine vs. Demonic'),
    ('con', 'Conflux'),
    ('pmps09', 'Magic Premiere Shop 2009'),
    ('p09', 'Magic Player Rewards 2009'),
    ('dd2', 'Duel Decks: Jace vs. Chandra'),
    ('ala', 'Shards of Alara'),
    ('drb', 'From the Vault: Dragons'),
    ('shm', 'Shadowmoor'),
    ('mor', 'Morningtide'),
    ('pmps08', 'Magic Premiere Shop 2008'),
    ('p08', 'Magic Player Rewards 2008'),
    ('dd1', 'Duel Decks: Elves vs. Goblins'),
    ('lrw', 'Lorwyn'),
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