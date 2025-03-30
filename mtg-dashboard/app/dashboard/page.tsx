// app/dashboard/page.tsx
// currently using for testing, will develop dashboard homepage later
"use client";

import { PriceHistoryChart } from "@/app/ui/price-history/price-chart-v2";
import { CardDetailsPanel } from "../ui/card-details/card-details-panel";
import { RawPricePoint } from "../lib/price-types";

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
    "$oid": "67d5ce21c2d2fb42e2d3f9a6"
  },
  "card_key": "otj-228",
  "all_parts": [
    {
      "object": "related_card",
      "id": "7b8aea8d-452a-4b23-bc78-8c7db54610d3",
      "component": "combo_piece",
      "name": "Roxanne, Starfall Savant",
      "type_line": "Legendary Creature — Cat Druid",
      "uri": "https://api.scryfall.com/cards/7b8aea8d-452a-4b23-bc78-8c7db54610d3"
    },
    {
      "object": "related_card",
      "id": "00b41ca9-0bf0-41fc-af65-854e602ee007",
      "component": "token",
      "name": "Meteorite",
      "type_line": "Token Artifact",
      "uri": "https://api.scryfall.com/cards/00b41ca9-0bf0-41fc-af65-854e602ee007"
    }
  ],
  "arena_id": 90574,
  "artist": "Ina Wong",
  "artist_ids": [
    "66509051-6c00-40cf-a6a7-471b6db84fe0"
  ],
  "booster": true,
  "border_color": "black",
  "card_back_id": "0aeebaf5-8c7d-4636-9e82-8c27447861f7",
  "cardmarket_id": 763960,
  "cmc": 5,
  "collector_number": "228",
  "color_identity": [
    "G",
    "R"
  ],
  "colors": [
    "G",
    "R"
  ],
  "digital": false,
  "edhrec_rank": 4093,
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
  "id": "11fbe52f-febd-49fc-8391-28d3efe9c3eb",
  "illustration_id": "bebd4775-0a88-4de7-8a10-ef5fd5aa93fa",
  "image_status": "highres_scan",
  "image_uris": {
    "small": "https://cards.scryfall.io/small/front/1/1/11fbe52f-febd-49fc-8391-28d3efe9c3eb.jpg?1712356193",
    "normal": "https://cards.scryfall.io/normal/front/1/1/11fbe52f-febd-49fc-8391-28d3efe9c3eb.jpg?1712356193",
    "large": "https://cards.scryfall.io/large/front/1/1/11fbe52f-febd-49fc-8391-28d3efe9c3eb.jpg?1712356193",
    "png": "https://cards.scryfall.io/png/front/1/1/11fbe52f-febd-49fc-8391-28d3efe9c3eb.png?1712356193",
    "art_crop": "https://cards.scryfall.io/art_crop/front/1/1/11fbe52f-febd-49fc-8391-28d3efe9c3eb.jpg?1712356193",
    "border_crop": "https://cards.scryfall.io/border_crop/front/1/1/11fbe52f-febd-49fc-8391-28d3efe9c3eb.jpg?1712356193"
  },
  "keywords": [],
  "lang": "en",
  "layout": "normal",
  "legalities": {
    "standard": "legal",
    "future": "legal",
    "historic": "legal",
    "timeless": "legal",
    "gladiator": "legal",
    "pioneer": "legal",
    "explorer": "legal",
    "modern": "legal",
    "legacy": "legal",
    "pauper": "not_legal",
    "vintage": "legal",
    "penny": "legal",
    "commander": "legal",
    "oathbreaker": "legal",
    "standardbrawl": "legal",
    "brawl": "legal",
    "alchemy": "legal",
    "paupercommander": "not_legal",
    "duel": "legal",
    "oldschool": "not_legal",
    "premodern": "not_legal",
    "predh": "not_legal"
  },
  "mana_cost": "{3}{R}{G}",
  "mtgo_id": 124367,
  "multiverse_ids": [
    655169
  ],
  "name": "Roxanne, Starfall Savant",
  "nonfoil": true,
  "object": "card",
  "oracle_id": "11765eaf-87a1-48bd-90c1-7a5f21be5918",
  "oracle_text": "Whenever Roxanne enters or attacks, create a tapped colorless artifact token named Meteorite with \"When this token enters, it deals 2 damage to any target\" and \"{T}: Add one mana of any color.\"\nWhenever you tap an artifact token for mana, add one mana of any type that artifact token produced.",
  "oversized": false,
  "penny_rank": 5560,
  "power": "4",
  "preview": {
    "source": "Dorasuta",
    "source_uri": "https://dorasuta.jp/column/detail?aid=11026",
    "previewed_at": "2024-03-27"
  },
  "prices": {
    "usd": "0.69",
    "usd_foil": "0.74",
    "usd_etched": null,
    "eur": "0.57",
    "eur_foil": "1.27",
    "tix": "0.02"
  },
  "prints_search_uri": "https://api.scryfall.com/cards/search?order=released&q=oracleid%3A11765eaf-87a1-48bd-90c1-7a5f21be5918&unique=prints",
  "produced_mana": [
    "B",
    "G",
    "R",
    "U",
    "W"
  ],
  "promo": false,
  "purchase_uris": {
    "tcgplayer": "https://partner.tcgplayer.com/c/4931599/1830156/21018?subId1=api&u=https%3A%2F%2Fwww.tcgplayer.com%2Fproduct%2F544419%3Fpage%3D1",
    "cardmarket": "https://www.cardmarket.com/en/Magic/Products/Singles/Outlaws-of-Thunder-Junction/Roxanne-Starfall-Savant?referrer=scryfall&utm_campaign=card_prices&utm_medium=text&utm_source=scryfall",
    "cardhoarder": "https://www.cardhoarder.com/cards/124367?affiliate_id=scryfall&ref=card-profile&utm_campaign=affiliate&utm_medium=card&utm_source=scryfall"
  },
  "rarity": "rare",
  "related_uris": {
    "gatherer": "https://gatherer.wizards.com/Pages/Card/Details.aspx?multiverseid=655169&printed=false",
    "tcgplayer_infinite_articles": "https://partner.tcgplayer.com/c/4931599/1830156/21018?subId1=api&trafcat=infinite&u=https%3A%2F%2Finfinite.tcgplayer.com%2Fsearch%3FcontentMode%3Darticle%26game%3Dmagic%26q%3DRoxanne%252C%2BStarfall%2BSavant",
    "tcgplayer_infinite_decks": "https://partner.tcgplayer.com/c/4931599/1830156/21018?subId1=api&trafcat=infinite&u=https%3A%2F%2Finfinite.tcgplayer.com%2Fsearch%3FcontentMode%3Ddeck%26game%3Dmagic%26q%3DRoxanne%252C%2BStarfall%2BSavant",
    "edhrec": "https://edhrec.com/route/?cc=Roxanne%2C+Starfall+Savant"
  },
  "released_at": "2024-04-19",
  "reprint": false,
  "reserved": false,
  "rulings_uri": "https://api.scryfall.com/cards/11fbe52f-febd-49fc-8391-28d3efe9c3eb/rulings",
  "scryfall_set_uri": "https://scryfall.com/sets/otj?utm_source=api",
  "scryfall_uri": "https://scryfall.com/card/otj/228/roxanne-starfall-savant?utm_source=api",
  "security_stamp": "oval",
  "set": "otj",
  "set_id": "55a85ebe-644e-4bef-8be8-5290408be3d1",
  "set_name": "Outlaws of Thunder Junction",
  "set_search_uri": "https://api.scryfall.com/cards/search?order=set&q=e%3Aotj&unique=prints",
  "set_type": "expansion",
  "set_uri": "https://api.scryfall.com/sets/55a85ebe-644e-4bef-8be8-5290408be3d1",
  "source": "scryfall",
  "story_spotlight": false,
  "tcgplayer_id": 544419,
  "textless": false,
  "toughness": "3",
  "type_line": "Legendary Creature — Cat Druid",
  "updated_at": {
    "$date": "2025-03-30T04:30:18.216Z"
  },
  "uri": "https://api.scryfall.com/cards/11fbe52f-febd-49fc-8391-28d3efe9c3eb",
  "variation": false
};

// Sample for card-details-panel (proper raw prices)
const sampleRawPriceData: RawPricePoint[] = [
  {
    _id: "1",
    card_key: "wwk-31",
    date: "2024-01-01T00:00:00.000Z",
    price: 9.99,
    finish: "nonfoil",
    source: "scryfall",
    metadata: {
      name: "Jace, the Mind Sculptor",
      set: "wwk",
      collector_number: "31",
      promo_types: [],
      frame_effects: []
    }
  },
  {
    _id: "2",
    card_key: "wwk-31",
    date: "2024-01-02T00:00:00.000Z",
    price: 10.50,
    finish: "nonfoil",
    source: "scryfall",
    metadata: {
      name: "Jace, the Mind Sculptor",
      set: "wwk",
      collector_number: "31",
      promo_types: [],
      frame_effects: []
    }
  },
  {
    _id: "3",
    card_key: "wwk-31",
    date: "2024-01-01T00:00:00.000Z",
    price: 24.99,
    finish: "foil",
    source: "scryfall",
    metadata: {
      name: "Jace, the Mind Sculptor",
      set: "wwk",
      collector_number: "31",
      promo_types: [],
      frame_effects: []
    }
  },
  {
    _id: "4",
    card_key: "wwk-31",
    date: "2024-01-01T00:00:00.000Z",
    price: 19.99,
    finish: "etched",
    source: "scryfall",
    metadata: {
      name: "Jace, the Mind Sculptor",
      set: "wwk",
      collector_number: "31",
      promo_types: [],
      frame_effects: []
    }
  }
];


export default function ChartTestPage() {
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
      <div className="space-y-8 p-8">
        <h1 className="text-2xl font-bold">Card Details Test Panel</h1>

        <div className="space-y-2 max-w-6xl mx-auto">
          <CardDetailsPanel
            card={sampleCard}
            priceData={sampleRawPriceData}
          />
        </div>
        <div className="space-y-2 max-w-6xl mx-auto">
          <CardDetailsPanel
            card={sampleCard2}
            priceData={sampleRawPriceData}
          />
        </div>
      </div>
    </div>
  )
}
