// app/dashboard/page.tsx
// currently using for testing, will develop dashboard homepage later
"use client";

import { PriceHistoryChart } from "@/app/ui/price-history/price-chart-v2";

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
    </div>
  )
}
