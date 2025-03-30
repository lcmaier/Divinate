// app/lib/price-types.ts

// Types for the raw data from your MongoDB database
export interface RawPricePoint {
  _id: string;
  card_key: string;
  date: string | Date;
  price: number;
  finish: 'nonfoil' | 'foil' | 'etched';
  source: string;
  metadata: {
    name: string;
    set: string;
    collector_number: string;
    promo_types: string[];
    frame_effects: string[];
  };
}

// Types for the transformed data used by your hook
export interface PriceHistoryData {
  [finish: string]: Array<{
    date: string | Date;
    price: number;
  }>;
}

// Type for the chart data expected by PriceHistoryChart
export interface ChartDataPoint {
  date: string;
  [finish: string]: string | number | null;
}