import { connectToDatabase, COLLECTIONS } from "./mongo";
import { cache } from 'react';
import { Document } from 'mongodb';

export type PriceDataPoint = {
    date: Date;
    price: number;
    finish: string;
    [key: string]: any; // Allow additional properties
};

export type CardFace = {
  name: string;
  mana_cost?: string;
  type_line?: string;
  oracle_text?: string;
  colors?: string[];
  image_uris?: {
    small?: string;
    normal?: string;
    large?: string;
    png?: string;
  };
};


export type CardDetails = {
    card_key: string;
    name: string;
    set: string;
    collector_number: string;
    set_name: string;
    image_uris?: {
        small?: string;
        normal?: string;
        large?: string;
        png?: string;
    };
    layout?: string;
    card_faces?: CardFace[];
    color_identity?: string[];
    power?: string,
    toughness?: string,
    loyalty?: string;
    mana_cost?: string;
    type_line?: string;
    oracle_text?: string;
    rarity?: string;
    released_at?: string;
    prices?: {
      usd?: string | null;
      usd_foil?: string | null;
      usd_etched?: string | null;
    };
    // property to store the latest price data from our timeseries collection
    latest_prices?: {
        nonfoil?: {
            price: number;
            date: string;
        };
        foil?: {
            price: number;
            date: string;
        };
        etched?: {
            price: number;
            date: string;
        };
    };
};

// need a function to convert the superset JSON doc from the 'cards' collection into the subset of fields
// we need without typescript yelling at us. Use this function to adjust what the frontend pulls about a card
// when pulling price history
function convertToCardDetails(doc: Document | null): CardDetails | null {
    if (!doc) return null;
    
    return {
      card_key: doc.card_key?.toString() || '',
      name: doc.name?.toString() || '',
      set: doc.set?.toString() || '',
      collector_number: doc.collector_number?.toString() || '',
      set_name: doc.set_name?.toString() || '',
      image_uris: doc.image_uris as CardDetails['image_uris'],
      mana_cost: doc.mana_cost?.toString(),
      type_line: doc.type_line?.toString(),
      oracle_text: doc.oracle_text?.toString() || '',
      rarity: doc.rarity?.toString() || '',
      released_at: doc.released_at?.toISOString() || undefined,
      prices: doc.prices,
      latest_prices: doc.latest_prices
    };
  }


export const fetchCardPriceHistory = cache(async (
    setCode: string,
    collectorNumber: string,
    days: number = 30,
    finish: string = 'nonfoil'
): Promise<{ card: CardDetails | null; priceHistory: PriceDataPoint[] }> => {
    
    const { db } = await connectToDatabase();

    // create card key from setCode and collectorNumber
    const cardKey = `${setCode.toLowerCase()}-${collectorNumber}`;

    try {
        // first, find the card in 'cards'
        const cardDoc = await db.collection(COLLECTIONS.cards).findOne({ cardKey });

        // if it's not there we have to exit early
        if (!cardDoc) {
            console.log(`card not found for card_key: ${cardKey}`);
            return { card: null, priceHistory: [] };
        }
        
        // explicitly assert the types of the fields we want to prevent typescript from yelling at us
        const card = convertToCardDetails(cardDoc);

        // calculate the date from `days` days ago
        const date = new Date();
        date.setDate(date.getDate() - days);

        // search `card_prices` for all matches for the timeframe and card_key, sort it
        // by ascending and put it into an array
        const priceHistory = await db.collection(COLLECTIONS.card_prices)
            .find({
                cardKey,
                date: { $get: date },
                finish: finish
            })
            .sort({ date: 1 })
            .toArray();
        
        // get price histories into React format
        const formattedPriceHistory = priceHistory.map(point => ({
            date: point.date,
            price: point.price,
            finish: point.finish
        }));

        return {
            card: card as CardDetails,
            priceHistory: formattedPriceHistory
        };
    } catch (error) {
        console.error('Error fetching card price history:', error);
        throw new Error('Failed to fetch card price history');
    }
} );


// Function to search for cards (will be useful for autocomplete later)
export const searchCards = cache(async (query: string, limit: number = 10) => {
    const { db } = await connectToDatabase();
    
    // don't start searching until the user has typed at least 3 letters to prevent
    // pulling the whole db and slowing down the UI
    if (!query || query.length < 2) {
      return [];
    }
    
    try {
      // Create a case-insensitive regex for searching
      const searchRegex = new RegExp(query, 'i');
      
      // Search for cards by name
      const cards = await db.collection(COLLECTIONS.cards)
        .find({
          name: searchRegex
        })
        .limit(limit)
        .toArray();
      
      return cards;
    } catch (error) {
      console.error('Error searching cards:', error);
      return [];
    }
  });