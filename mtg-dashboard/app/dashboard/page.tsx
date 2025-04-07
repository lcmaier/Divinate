// app/dashboard/page.tsx
// currently using for testing, will develop dashboard homepage later
"use client";

import { useState } from "react";
import { PriceHistoryChart } from "@/app/ui/price-history/price-chart-v2";
import { CardDetailsPanel } from "../ui/card-details/card-details-panel";
import { RawPricePoint } from "../lib/price-types";
import SearchResultCard from "@/app/ui/price-history/search-result-card-v2";
import { CardDetails } from "../lib/card-data";
import SearchResults from "../ui/price-history/search-results-v2";

// Sample data for visualization during development
const sampleData = [
    { date: "2024-01-01", nonfoil: 9.99, foil: 24.99, etched: 19.99 },
    { date: "2024-01-02", nonfoil: 10.50, foil: 26.50, etched: null },
    { date: "2024-01-03", nonfoil: 11.25, foil: 27.99, etched: 21.50 },
    { date: "2024-01-04", nonfoil: 10.75, foil: 25.99, etched: null },
    { date: "2024-01-05", nonfoil: 12.99, foil: 29.99, etched: 19.76 },
    { date: "2024-01-06", nonfoil: 12.50, foil: 28.50, etched: 18.53 },
  ]

  // Data with some gaps to test null handling
const gappyData = [
  { date: "2024-01-01", nonfoil: 9.99, foil: null, etched: null },
  { date: "2024-01-02", nonfoil: 10.50, foil: 26.50, etched: null },
  { date: "2024-01-03", nonfoil: null, foil: 27.99, etched: 21.50 },
  { date: "2024-01-04", nonfoil: 10.75, foil: null, etched: null },
  { date: "2024-01-05", nonfoil: 12.99, foil: 29.99, etched: 19.76 },
  { date: "2024-01-06", nonfoil: 12.50, foil: 28.50, etched: null },
]

// Empty data to test the empty state handling
const emptyData: Array<{
  date: string;
  nonfoil?: number | null;
  foil?: number | null;
  etched?: number | null;
  [key: string]: any;
}> = [];

// Sample card from db
const sampleCard = {
  "_id": {
    "$oid": "67d5ce20c2d2fb42e2d3f3b1"
  },
  "card_key": "wwk-31",
  "artist": "Jason Chan",
  "artist_ids": [
    "8062d5a9-51b6-4822-933f-fa9e9dba8416"
  ],
  "booster": true,
  "border_color": "black",
  "card_back_id": "0aeebaf5-8c7d-4636-9e82-8c27447861f7",
  "cardmarket_id": 22110,
  "cmc": 4,
  "collector_number": "31",
  "color_identity": [
    "U"
  ],
  "colors": [
    "U"
  ],
  "digital": false,
  "edhrec_rank": 2929,
  "finishes": [
    "nonfoil",
    "foil"
  ],
  "foil": true,
  "frame": "2003",
  "full_art": false,
  "game_changer": false,
  "games": [
    "paper",
    "mtgo"
  ],
  "has_goldfish_history": false,
  "highres_image": true,
  "id": "0e606072-a3aa-4300-ba90-ec92a721fa76",
  "illustration_id": "b0ab416a-c7a8-4531-8e6a-00a167db4f76",
  "image_status": "highres_scan",
  "image_uris": {
    "small": "https://cards.scryfall.io/small/front/0/e/0e606072-a3aa-4300-ba90-ec92a721fa76.jpg?1562281841",
    "normal": "https://cards.scryfall.io/normal/front/0/e/0e606072-a3aa-4300-ba90-ec92a721fa76.jpg?1562281841",
    "large": "https://cards.scryfall.io/large/front/0/e/0e606072-a3aa-4300-ba90-ec92a721fa76.jpg?1562281841",
    "png": "https://cards.scryfall.io/png/front/0/e/0e606072-a3aa-4300-ba90-ec92a721fa76.png?1562281841",
    "art_crop": "https://cards.scryfall.io/art_crop/front/0/e/0e606072-a3aa-4300-ba90-ec92a721fa76.jpg?1562281841",
    "border_crop": "https://cards.scryfall.io/border_crop/front/0/e/0e606072-a3aa-4300-ba90-ec92a721fa76.jpg?1562281841"
  },
  "keywords": [],
  "lang": "en",
  "layout": "normal",
  "legalities": {
    "standard": "not_legal",
    "future": "not_legal",
    "historic": "legal",
    "timeless": "legal",
    "gladiator": "legal",
    "pioneer": "not_legal",
    "explorer": "not_legal",
    "modern": "legal",
    "legacy": "legal",
    "pauper": "not_legal",
    "vintage": "legal",
    "penny": "not_legal",
    "commander": "legal",
    "oathbreaker": "legal",
    "standardbrawl": "not_legal",
    "brawl": "legal",
    "alchemy": "not_legal",
    "paupercommander": "not_legal",
    "duel": "legal",
    "oldschool": "not_legal",
    "premodern": "not_legal",
    "predh": "legal"
  },
  "loyalty": "3",
  "mana_cost": "{2}{U}{U}",
  "mtgo_foil_id": 35592,
  "mtgo_id": 35591,
  "multiverse_ids": [
    195297
  ],
  "name": "Jace, the Mind Sculptor",
  "nonfoil": true,
  "object": "card",
  "oracle_id": "7f77a84e-5a4b-4834-aefa-3cecc175ae8e",
  "oracle_text": "+2: Look at the top card of target player's library. You may put that card on the bottom of that player's library.\n0: Draw three cards, then put two cards from your hand on top of your library in any order.\n−1: Return target creature to its owner's hand.\n−12: Exile all cards from target player's library, then that player shuffles their hand into their library.",
  "oversized": false,
  "prices": {
    "usd": "21.16",
    "usd_foil": "146.55",
    "usd_etched": null,
    "eur": "17.49",
    "eur_foil": "100.31",
    "tix": "2.23"
  },
  "prints_search_uri": "https://api.scryfall.com/cards/search?order=released&q=oracleid%3A7f77a84e-5a4b-4834-aefa-3cecc175ae8e&unique=prints",
  "promo": false,
  "purchase_uris": {
    "tcgplayer": "https://partner.tcgplayer.com/c/4931599/1830156/21018?subId1=api&u=https%3A%2F%2Fwww.tcgplayer.com%2Fproduct%2F34384%3Fpage%3D1",
    "cardmarket": "https://www.cardmarket.com/en/Magic/Products/Singles/Worldwake/Jace-the-Mind-Sculptor?referrer=scryfall&utm_campaign=card_prices&utm_medium=text&utm_source=scryfall",
    "cardhoarder": "https://www.cardhoarder.com/cards/35591?affiliate_id=scryfall&ref=card-profile&utm_campaign=affiliate&utm_medium=card&utm_source=scryfall"
  },
  "rarity": "mythic",
  "related_uris": {
    "gatherer": "https://gatherer.wizards.com/Pages/Card/Details.aspx?multiverseid=195297&printed=false",
    "tcgplayer_infinite_articles": "https://partner.tcgplayer.com/c/4931599/1830156/21018?subId1=api&trafcat=infinite&u=https%3A%2F%2Finfinite.tcgplayer.com%2Fsearch%3FcontentMode%3Darticle%26game%3Dmagic%26q%3DJace%252C%2Bthe%2BMind%2BSculptor",
    "tcgplayer_infinite_decks": "https://partner.tcgplayer.com/c/4931599/1830156/21018?subId1=api&trafcat=infinite&u=https%3A%2F%2Finfinite.tcgplayer.com%2Fsearch%3FcontentMode%3Ddeck%26game%3Dmagic%26q%3DJace%252C%2Bthe%2BMind%2BSculptor",
    "edhrec": "https://edhrec.com/route/?cc=Jace%2C+the+Mind+Sculptor"
  },
  "released_at": "2010-02-05",
  "reprint": false,
  "reserved": false,
  "rulings_uri": "https://api.scryfall.com/cards/0e606072-a3aa-4300-ba90-ec92a721fa76/rulings",
  "scryfall_set_uri": "https://scryfall.com/sets/wwk?utm_source=api",
  "scryfall_uri": "https://scryfall.com/card/wwk/31/jace-the-mind-sculptor?utm_source=api",
  "set": "wwk",
  "set_id": "2f248ce6-c2a5-4c6f-a2be-0c593fbe173c",
  "set_name": "Worldwake",
  "set_search_uri": "https://api.scryfall.com/cards/search?order=set&q=e%3Awwk&unique=prints",
  "set_type": "expansion",
  "set_uri": "https://api.scryfall.com/sets/2f248ce6-c2a5-4c6f-a2be-0c593fbe173c",
  "source": "scryfall",
  "story_spotlight": false,
  "tcgplayer_id": 34384,
  "textless": false,
  "type_line": "Legendary Planeswalker — Jace",
  "updated_at": {
    "$date": "2025-03-30T04:30:17.791Z"
  },
  "uri": "https://api.scryfall.com/cards/0e606072-a3aa-4300-ba90-ec92a721fa76",
  "variation": false
};


const sampleCard2 = {
  "_id": {
    "$oid": "67d5ce1fc2d2fb42e2d3f18c"
  },
  "card_key": "mh3-237",
  "all_parts": [
    {
      "object": "related_card",
      "id": "f897d650-f1a2-4366-a025-f12c10310d96",
      "component": "combo_piece",
      "name": "Ajani, Nacatl Pariah // Ajani, Nacatl Avenger",
      "type_line": "Legendary Creature — Cat Warrior // Legendary Planeswalker — Ajani",
      "uri": "https://api.scryfall.com/cards/f897d650-f1a2-4366-a025-f12c10310d96"
    },
    {
      "object": "related_card",
      "id": "ce5c5bcf-1fdd-4d73-a92b-223292da00ca",
      "component": "token",
      "name": "Cat Warrior",
      "type_line": "Token Creature — Cat Warrior",
      "uri": "https://api.scryfall.com/cards/ce5c5bcf-1fdd-4d73-a92b-223292da00ca"
    }
  ],
  "arena_id": 90800,
  "artist": "Chris Rallis",
  "artist_ids": [
    "a8e7b854-b15a-421a-b66d-6e68187ae285"
  ],
  "booster": true,
  "border_color": "black",
  "card_faces": [
    {
      "object": "card_face",
      "name": "Ajani, Nacatl Pariah",
      "mana_cost": "{1}{W}",
      "type_line": "Legendary Creature — Cat Warrior",
      "oracle_text": "When Ajani enters, create a 2/1 white Cat Warrior creature token.\nWhenever one or more other Cats you control die, you may exile Ajani, then return him to the battlefield transformed under his owner's control.",
      "colors": [
        "W"
      ],
      "power": "1",
      "toughness": "2",
      "flavor_text": "His pride denied him; his brother did not.",
      "artist": "Chris Rallis",
      "artist_id": "a8e7b854-b15a-421a-b66d-6e68187ae285",
      "illustration_id": "3dff950b-68c7-4b2d-a8e5-419b140d897e",
      "image_uris": {
        "small": "https://cards.scryfall.io/small/front/0/d/0d16e8e0-31b2-4389-afd6-783c501f6fa0.jpg?1738269605",
        "normal": "https://cards.scryfall.io/normal/front/0/d/0d16e8e0-31b2-4389-afd6-783c501f6fa0.jpg?1738269605",
        "large": "https://cards.scryfall.io/large/front/0/d/0d16e8e0-31b2-4389-afd6-783c501f6fa0.jpg?1738269605",
        "png": "https://cards.scryfall.io/png/front/0/d/0d16e8e0-31b2-4389-afd6-783c501f6fa0.png?1738269605",
        "art_crop": "https://cards.scryfall.io/art_crop/front/0/d/0d16e8e0-31b2-4389-afd6-783c501f6fa0.jpg?1738269605",
        "border_crop": "https://cards.scryfall.io/border_crop/front/0/d/0d16e8e0-31b2-4389-afd6-783c501f6fa0.jpg?1738269605"
      }
    },
    {
      "object": "card_face",
      "name": "Ajani, Nacatl Avenger",
      "mana_cost": "",
      "type_line": "Legendary Planeswalker — Ajani",
      "oracle_text": "+2: Put a +1/+1 counter on each Cat you control.\n0: Create a 2/1 white Cat Warrior creature token. When you do, if you control a red permanent other than Ajani, he deals damage equal to the number of creatures you control to any target.\n−4: Each opponent chooses an artifact, a creature, an enchantment, and a planeswalker from among the nonland permanents they control, then sacrifices the rest.",
      "colors": [
        "R",
        "W"
      ],
      "color_indicator": [
        "R",
        "W"
      ],
      "loyalty": "3",
      "artist": "Chris Rallis",
      "artist_id": "a8e7b854-b15a-421a-b66d-6e68187ae285",
      "illustration_id": "941b8c13-e0db-4ef8-8182-17ae977e65a7",
      "image_uris": {
        "small": "https://cards.scryfall.io/small/back/0/d/0d16e8e0-31b2-4389-afd6-783c501f6fa0.jpg?1738269605",
        "normal": "https://cards.scryfall.io/normal/back/0/d/0d16e8e0-31b2-4389-afd6-783c501f6fa0.jpg?1738269605",
        "large": "https://cards.scryfall.io/large/back/0/d/0d16e8e0-31b2-4389-afd6-783c501f6fa0.jpg?1738269605",
        "png": "https://cards.scryfall.io/png/back/0/d/0d16e8e0-31b2-4389-afd6-783c501f6fa0.png?1738269605",
        "art_crop": "https://cards.scryfall.io/art_crop/back/0/d/0d16e8e0-31b2-4389-afd6-783c501f6fa0.jpg?1738269605",
        "border_crop": "https://cards.scryfall.io/border_crop/back/0/d/0d16e8e0-31b2-4389-afd6-783c501f6fa0.jpg?1738269605"
      }
    }
  ],
  "cardmarket_id": 759962,
  "cmc": 2,
  "collector_number": "237",
  "color_identity": [
    "R",
    "W"
  ],
  "digital": false,
  "edhrec_rank": 6031,
  "finishes": [
    "nonfoil",
    "foil"
  ],
  "foil": true,
  "frame": "2015",
  "frame_effects": [
    "legendary"
  ],
  "full_art": false,
  "game_changer": false,
  "games": [
    "paper",
    "mtgo",
    "arena"
  ],
  "has_goldfish_history": false,
  "highres_image": true,
  "id": "0d16e8e0-31b2-4389-afd6-783c501f6fa0",
  "image_status": "highres_scan",
  "keywords": [
    "Transform"
  ],
  "lang": "en",
  "layout": "transform",
  "legalities": {
    "standard": "not_legal",
    "future": "not_legal",
    "historic": "legal",
    "timeless": "legal",
    "gladiator": "banned",
    "pioneer": "not_legal",
    "explorer": "not_legal",
    "modern": "legal",
    "legacy": "legal",
    "pauper": "not_legal",
    "vintage": "legal",
    "penny": "not_legal",
    "commander": "legal",
    "oathbreaker": "legal",
    "standardbrawl": "not_legal",
    "brawl": "legal",
    "alchemy": "not_legal",
    "paupercommander": "not_legal",
    "duel": "restricted",
    "oldschool": "not_legal",
    "premodern": "not_legal",
    "predh": "not_legal"
  },
  "mtgo_id": 126493,
  "multiverse_ids": [
    661753,
    661754
  ],
  "name": "Ajani, Nacatl Pariah // Ajani, Nacatl Avenger",
  "nonfoil": true,
  "object": "card",
  "oracle_id": "2588f348-d7a3-46c8-9ace-dca53ed5ef99",
  "oversized": false,
  "prices": {
    "usd": "10.08",
    "usd_foil": "11.25",
    "usd_etched": null,
    "eur": "12.86",
    "eur_foil": "15.72",
    "tix": "6.86"
  },
  "prints_search_uri": "https://api.scryfall.com/cards/search?order=released&q=oracleid%3A2588f348-d7a3-46c8-9ace-dca53ed5ef99&unique=prints",
  "promo": false,
  "purchase_uris": {
    "tcgplayer": "https://partner.tcgplayer.com/c/4931599/1830156/21018?subId1=api&u=https%3A%2F%2Fwww.tcgplayer.com%2Fproduct%2F541279%3Fpage%3D1",
    "cardmarket": "https://www.cardmarket.com/en/Magic/Products/Singles/Modern-Horizons-3/Ajani-Nacatl-Pariah-Ajani-Nacatl-Avenger?referrer=scryfall&utm_campaign=card_prices&utm_medium=text&utm_source=scryfall",
    "cardhoarder": "https://www.cardhoarder.com/cards/126493?affiliate_id=scryfall&ref=card-profile&utm_campaign=affiliate&utm_medium=card&utm_source=scryfall"
  },
  "rarity": "mythic",
  "related_uris": {
    "gatherer": "https://gatherer.wizards.com/Pages/Card/Details.aspx?multiverseid=661753&printed=false",
    "tcgplayer_infinite_articles": "https://partner.tcgplayer.com/c/4931599/1830156/21018?subId1=api&trafcat=infinite&u=https%3A%2F%2Finfinite.tcgplayer.com%2Fsearch%3FcontentMode%3Darticle%26game%3Dmagic%26q%3DAjani%252C%2BNacatl%2BPariah%2B%252F%252F%2BAjani%252C%2BNacatl%2BAvenger",
    "tcgplayer_infinite_decks": "https://partner.tcgplayer.com/c/4931599/1830156/21018?subId1=api&trafcat=infinite&u=https%3A%2F%2Finfinite.tcgplayer.com%2Fsearch%3FcontentMode%3Ddeck%26game%3Dmagic%26q%3DAjani%252C%2BNacatl%2BPariah%2B%252F%252F%2BAjani%252C%2BNacatl%2BAvenger",
    "edhrec": "https://edhrec.com/route/?cc=Ajani%2C+Nacatl+Pariah"
  },
  "released_at": "2024-06-14",
  "reprint": false,
  "reserved": false,
  "rulings_uri": "https://api.scryfall.com/cards/0d16e8e0-31b2-4389-afd6-783c501f6fa0/rulings",
  "scryfall_set_uri": "https://scryfall.com/sets/mh3?utm_source=api",
  "scryfall_uri": "https://scryfall.com/card/mh3/237/ajani-nacatl-pariah-ajani-nacatl-avenger?utm_source=api",
  "security_stamp": "oval",
  "set": "mh3",
  "set_id": "3ed80bb6-77e8-4aa7-8262-95377a38aba1",
  "set_name": "Modern Horizons 3",
  "set_search_uri": "https://api.scryfall.com/cards/search?order=set&q=e%3Amh3&unique=prints",
  "set_type": "draft_innovation",
  "set_uri": "https://api.scryfall.com/sets/3ed80bb6-77e8-4aa7-8262-95377a38aba1",
  "source": "scryfall",
  "story_spotlight": false,
  "tcgplayer_id": 541279,
  "textless": false,
  "type_line": "Legendary Creature — Cat Warrior // Legendary Planeswalker — Ajani",
  "updated_at": {
    "$date": "2025-03-31T04:30:27.931Z"
  },
  "uri": "https://api.scryfall.com/cards/0d16e8e0-31b2-4389-afd6-783c501f6fa0",
  "variation": false
}

// Sample for card-details-panel (proper raw prices)
const sampleRawPriceData: RawPricePoint[] = [
  {
    _id: "1",
    card_key: "wwk-31",
    date: "2024-01-01T00:00:00.000Z",
    price: 9.99,
    finish: "nonfoil",
    source: "scryfall",
  },
  {
    _id: "2",
    card_key: "wwk-31",
    date: "2024-01-02T00:00:00.000Z",
    price: 10.50,
    finish: "nonfoil",
    source: "scryfall",
  },
  {
    _id: "3",
    card_key: "wwk-31",
    date: "2024-01-01T00:00:00.000Z",
    price: 24.99,
    finish: "foil",
    source: "scryfall",
  },
  {
    _id: "4",
    card_key: "wwk-31",
    date: "2024-01-01T00:00:00.000Z",
    price: 19.99,
    finish: "etched",
    source: "scryfall",
  }
];


export default function ChartTestPage() {
  // State for selected cards
  const [selectedCards, setSelectedCards] = useState<Record<string, boolean>>({});

  // Handler for card selection
  const handleCardSelect = (cardKey: string, selected: boolean) => {
    setSelectedCards(prev => ({
      ...prev,
      [cardKey]: selected
    }));
  };

  return (
    <div className="space-y-8 p-8">
      <h1 className="text-2xl font-bold">Chart Testing Page</h1>
      
      <div className="space-y-2">
        <h2 className="text-xl">Complete Data</h2>
        <PriceHistoryChart 
          data={sampleData}
          finishesToShow={['nonfoil', 'foil', 'etched']}
          title="Jace, the Mind Sculptor"
          subtitle="Worldwake (WWK)"
        />
      </div>
      
      <div className="space-y-2">
        <h2 className="text-xl">Only Regular and Foil</h2>
        <PriceHistoryChart 
          data={sampleData}
          finishesToShow={['nonfoil', 'foil']}
          title="Lightning Bolt"
          subtitle="Magic 2010 (M10)"
        />
      </div>
      
      <div className="space-y-2">
        <h2 className="text-xl">With Missing Data Points</h2>
        <PriceHistoryChart 
          data={gappyData}
          finishesToShow={['nonfoil', 'foil', 'etched']}
          title="Goldspan Dragon"
          subtitle="Kaldheim (KHM)"
        />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl">Empty Data</h2>
        <PriceHistoryChart 
          data={emptyData}
          finishesToShow={['nonfoil', 'foil', 'etched']}
          title="Empty Set"
          subtitle="No Data Available"
        />
      </div>

      {/* Advanced UI Testing */}

      {/* View Details Panel */}
      <div className="space-y-8 p-8">
        {/* <h1 className="text-2xl font-bold">Card Details Test Panel</h1>

        <div className="space-y-2 max-w-6xl mx-auto">
          <CardDetailsPanel
            card={sampleCard}
            days={90}
          />
        </div>

        <div className="space-y-2 max-w-6xl mx-auto">
          <CardDetailsPanel
            card={sampleCard2}
            days={90}
          />
        </div>

        <div className="space-y-2 max-w-6xl mx-auto">
          <SearchResultCard
            card={sampleCard}
            isSelected={selectedCards[sampleCard.card_key] || false}
            onSelect={(selected) => handleCardSelect(sampleCard.card_key, selected)}
          />
        </div>

        <div className="space-y-2 max-w-6xl mx-auto">
          <SearchResultCard
            card={sampleCard2}
            isSelected={selectedCards[sampleCard.card_key] || false}
            onSelect={(selected) => handleCardSelect(sampleCard.card_key, selected)}
          />
        </div> */}
      </div>

      <div className="space-y-8 p-8">
        {/* <h1 className="text-2xl font-bold">Search Results V2 Test</h1>
        
        <div className="space-y-2 max-w-6xl mx-auto">
          <SearchResults
            results={[sampleCard, sampleCard2]} // Your sample cards from your test data
            isLoading={false}
            totalResults={2}
            currentPage={1}
            itemsPerPage={10}
            sortBy="name_asc"
            onPageChange={(page) => console.log(`Page changed to ${page}`)}
            onItemsPerPageChange={(count) => console.log(`Items per page changed to ${count}`)}
            onSortChange={(sort) => console.log(`Sort changed to ${sort}`)}
            selectedCards={Object.keys(selectedCards)
              .filter(key => selectedCards[key])
              .map(key => [sampleCard, sampleCard2].find(card => card.card_key === key))
              .filter(Boolean) as CardDetails[]}
            onCardSelect={(card, selected) => handleCardSelect(card.card_key, selected)}
            onCompareSelected={() => console.log('Compare selected cards')}
          />
        </div> */}
        
        {/* Test loading state */}
        {/* <div className="space-y-2 max-w-6xl mx-auto mt-8">
          <h2 className="text-xl">Loading State</h2>
          <SearchResults
            results={[]}
            isLoading={true}
            totalResults={0}
            currentPage={1}
            itemsPerPage={10}
            sortBy="name_asc"
            onPageChange={() => {}}
            onItemsPerPageChange={() => {}}
            onSortChange={() => {}}
            selectedCards={[]}
            onCardSelect={() => {}}
            onCompareSelected={() => {}}
          />
        </div> */}
        
        {/* Test empty state */}
        {/* <div className="space-y-2 max-w-6xl mx-auto mt-8">
          <h2 className="text-xl">Empty State</h2>
          <SearchResults
            results={[]}
            isLoading={false}
            totalResults={0}
            currentPage={1}
            itemsPerPage={10}
            sortBy="name_asc"
            onPageChange={() => {}}
            onItemsPerPageChange={() => {}}
            onSortChange={() => {}}
            selectedCards={[]}
            onCardSelect={() => {}}
            onCompareSelected={() => {}}
          />
        </div> */}
        
        {/* Test pagination */}
        <div className="space-y-2 max-w-6xl mx-auto mt-8">
          <h2 className="text-xl">Pagination Test</h2>
          <SearchResults
            results={[sampleCard, sampleCard2]}
            isLoading={false}
            totalResults={102} // Pretend we have 102 results
            currentPage={5}  // Show middle page
            itemsPerPage={10}
            sortBy="name_asc"
            onPageChange={(page) => console.log(`Page changed to ${page}`)}
            onItemsPerPageChange={(count) => console.log(`Items per page changed to ${count}`)}
            onSortChange={(sort) => console.log(`Sort changed to ${sort}`)}
            selectedCards={[]}
            onCardSelect={() => {}}
            onCompareSelected={() => {}}
          />
        </div>
      </div>

    </div>
  )
}
