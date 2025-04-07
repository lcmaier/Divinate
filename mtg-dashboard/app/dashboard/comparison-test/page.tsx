// app/dashboard/card-comparison-test/page.tsx
"use client";

import { useState } from "react";
import CardComparisonPanel from "@/app/ui/card-comparison/card-comparison-panel";
import { Button } from "@/components/ui/button";
import { CardDetails } from "@/app/lib/card-data"; // Import the type

// Cast sample data to CardDetails
const sampleCard1: CardDetails = {
  card_key: "wwk-31",
  name: "Jace, the Mind Sculptor",
  set: "wwk",
  set_name: "Worldwake",
  collector_number: "31",
  rarity: "mythic",
  color_identity: ["U"],
  type_line: "Legendary Planeswalker — Jace",
  oracle_text: "+2: Look at the top card of target player's library. You may put that card on the bottom of that player's library.\n0: Draw three cards, then put two cards from your hand on top of your library in any order.\n−1: Return target creature to its owner's hand.\n−12: Exile all cards from target player's library, then that player shuffles their hand into their library.",
  loyalty: "3",
  image_uris: {
    small: "https://cards.scryfall.io/small/front/0/e/0e606072-a3aa-4300-ba90-ec92a721fa76.jpg?1562281841",
    normal: "https://cards.scryfall.io/normal/front/0/e/0e606072-a3aa-4300-ba90-ec92a721fa76.jpg?1562281841",
    large: "https://cards.scryfall.io/large/front/0/e/0e606072-a3aa-4300-ba90-ec92a721fa76.jpg?1562281841"
  },
  prices: {
    usd: "21.16",
    usd_foil: "146.55",
    usd_etched: null
  }
};

const sampleCard2: CardDetails = {
  card_key: "mh3-237",
  name: "Ajani, Nacatl Pariah // Ajani, Nacatl Avenger",
  set: "mh3",
  set_name: "Modern Horizons 3",
  collector_number: "237",
  rarity: "mythic",
  color_identity: ["R", "W"],
  layout: "transform",
  card_faces: [
    {
      name: "Ajani, Nacatl Pariah",
      type_line: "Legendary Creature — Cat Warrior",
      oracle_text: "When Ajani enters, create a 2/1 white Cat Warrior creature token.\nWhenever one or more other Cats you control die, you may exile Ajani, then return him to the battlefield transformed under his owner's control.",
      power: "1",
      toughness: "2",
      image_uris: {
        small: "https://cards.scryfall.io/small/front/0/d/0d16e8e0-31b2-4389-afd6-783c501f6fa0.jpg?1738269605",
        normal: "https://cards.scryfall.io/normal/front/0/d/0d16e8e0-31b2-4389-afd6-783c501f6fa0.jpg?1738269605",
        large: "https://cards.scryfall.io/large/front/0/d/0d16e8e0-31b2-4389-afd6-783c501f6fa0.jpg?1738269605"
      }
    },
    {
      name: "Ajani, Nacatl Avenger",
      type_line: "Legendary Planeswalker — Ajani",
      oracle_text: "+2: Put a +1/+1 counter on each Cat you control.\n0: Create a 2/1 white Cat Warrior creature token. When you do, if you control a red permanent other than Ajani, he deals damage equal to the number of creatures you control to any target.\n−4: Each opponent chooses an artifact, a creature, an enchantment, and a planeswalker from among the nonland permanents they control, then sacrifices the rest.",
      loyalty: "3",
      image_uris: {
        small: "https://cards.scryfall.io/small/back/0/d/0d16e8e0-31b2-4389-afd6-783c501f6fa0.jpg?1738269605",
        normal: "https://cards.scryfall.io/normal/back/0/d/0d16e8e0-31b2-4389-afd6-783c501f6fa0.jpg?1738269605",
        large: "https://cards.scryfall.io/large/back/0/d/0d16e8e0-31b2-4389-afd6-783c501f6fa0.jpg?1738269605"
      }
    }
  ],
  prices: {
    usd: "10.08",
    usd_foil: "11.25",
    usd_etched: null
  }
};

const sampleCard3: CardDetails = {
  card_key: "otj-228",
  name: "Roxanne, Starfall Savant",
  set: "otj",
  set_name: "Outlaws of Thunder Junction",
  collector_number: "228",
  rarity: "rare",
  color_identity: ["G", "R"],
  type_line: "Legendary Creature — Cat Druid",
  oracle_text: "Whenever Roxanne enters or attacks, create a tapped colorless artifact token named Meteorite with \"When this token enters, it deals 2 damage to any target\" and \"{T}: Add one mana of any color.\"\nWhenever you tap an artifact token for mana, add one mana of any type that artifact token produced.",
  power: "4",
  toughness: "3",
  image_uris: {
    small: "https://cards.scryfall.io/small/front/1/1/11fbe52f-febd-49fc-8391-28d3efe9c3eb.jpg?1712356193",
    normal: "https://cards.scryfall.io/normal/front/1/1/11fbe52f-febd-49fc-8391-28d3efe9c3eb.jpg?1712356193",
    large: "https://cards.scryfall.io/large/front/1/1/11fbe52f-febd-49fc-8391-28d3efe9c3eb.jpg?1712356193"
  },
  prices: {
    usd: "0.69",
    usd_foil: "0.74",
    usd_etched: null
  }
};

// Define array of sample cards
const sampleCards = [sampleCard1, sampleCard2, sampleCard3];

export default function ComparisonTestPage() {
  const [selectedCards, setSelectedCards] = useState<CardDetails[]>([sampleCard1, sampleCard2, sampleCard3]);
  
  // Fixed toggle function with proper typing
  const toggleCard = (card: CardDetails) => {
    if (selectedCards.some(c => c.card_key === card.card_key)) {
      setSelectedCards(selectedCards.filter(c => c.card_key !== card.card_key));
    } else {
      setSelectedCards([...selectedCards, card]);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Card Comparison Panel Test</h1>
      
      <div className="flex flex-wrap gap-3">
        {sampleCards.map(card => (
          <Button 
            key={card.card_key}
            variant={selectedCards.some(c => c.card_key === card.card_key) ? "default" : "outline"}
            onClick={() => toggleCard(card)}
          >
            {card.name.split(' // ')[0]} {/* Just show first face name for double-faced cards */}
          </Button>
        ))}
      </div>
      
      <div className="mt-6">
        <CardComparisonPanel cards={selectedCards} days={90} />
      </div>
    </div>
  );
}