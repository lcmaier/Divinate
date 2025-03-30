// app/ui/price-history/price-chart-v2.test.tsx
import { render, screen } from '@testing-library/react';
import { PriceHistoryChart } from './price-chart-v2';

// Mock the LineChart component entirely
jest.mock('../../ui/core/line-chart', () => ({
  LineChart: () => <div data-testid="mocked-line-chart" />
}));

describe('PriceHistoryChart', () => {
  it('renders empty state when no data is provided', () => {
    render(
      <PriceHistoryChart
        data={[]}
        finishesToShow={['nonfoil', 'foil']}
        title="Test Card"
      />
    );
    
    expect(screen.getByText('No price data available')).toBeInTheDocument();
  });
});