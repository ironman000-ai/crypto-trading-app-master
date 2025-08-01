import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Fallback data for when API is rate limited
const fallbackMarketData = {
  bitcoin: {
    id: 'bitcoin',
    symbol: 'btc',
    name: 'Bitcoin',
    current_price: 45000,
    price_change_percentage_24h: 2.5,
    market_cap: 880000000000,
    total_volume: 25000000000
  },
  ethereum: {
    id: 'ethereum',
    symbol: 'eth',
    name: 'Ethereum',
    current_price: 2800,
    price_change_percentage_24h: 1.8,
    market_cap: 340000000000,
    total_volume: 15000000000
  },
  solana: {
    id: 'solana',
    symbol: 'sol',
    name: 'Solana',
    current_price: 95,
    price_change_percentage_24h: -0.5,
    market_cap: 42000000000,
    total_volume: 2000000000
  },
  dogecoin: {
    id: 'dogecoin',
    symbol: 'doge',
    name: 'Dogecoin',
    current_price: 0.08,
    price_change_percentage_24h: 3.2,
    market_cap: 11000000000,
    total_volume: 800000000
  },
  cardano: {
    id: 'cardano',
    symbol: 'ada',
    name: 'Cardano',
    current_price: 0.45,
    price_change_percentage_24h: 1.1,
    market_cap: 16000000000,
    total_volume: 400000000
  }
};

function generateFallbackChartData(coinId: string) {
  const basePrice = fallbackMarketData[coinId as keyof typeof fallbackMarketData]?.current_price || 45000;
  const prices = [];
  const now = Date.now();
  
  for (let i = 24; i >= 0; i--) {
    const timestamp = now - (i * 60 * 60 * 1000); // hourly data for 24 hours
    const variation = (Math.random() - 0.5) * 0.05; // 5% max variation
    const price = basePrice * (1 + variation);
    prices.push([timestamp, price]);
  }
  
  return { prices };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');
  const apiKey = process.env.COINGECKO_API_KEY;

  if (!path) {
    return NextResponse.json({ error: 'Path is required' }, { status: 400 });
  }

  try {
    const url = `https://api.coingecko.com/api/v3/${path}`;
    const params = new URLSearchParams(searchParams);
    params.delete('path'); // Remove our internal param
    if (apiKey) {
      params.append('x_cg_demo_api_key', apiKey);
    }
    const queryString = params.toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;

    const response = await fetch(fullUrl);

    if (!response.ok) {
      // Handle rate limiting (429) and other API errors with fallback data
      if (response.status === 429) {
        console.warn('CoinGecko API rate limit exceeded, using fallback data');
        return handleFallbackResponse(path, searchParams);
      }
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.warn('CoinGecko API error, using fallback data:', error);
    return handleFallbackResponse(path, searchParams);
  }
}

function handleFallbackResponse(path: string | null, searchParams: URLSearchParams) {
  if (!path) {
    return NextResponse.json({ error: 'Path is required' }, { status: 400 });
  }

  // Handle market data requests
  if (path === 'coins/markets') {
    const ids = searchParams.get('ids');
    if (ids) {
      const coinIds = ids.split(',');
      const data = coinIds.map(id => fallbackMarketData[id as keyof typeof fallbackMarketData]).filter(Boolean);
      return NextResponse.json(data);
    }
    return NextResponse.json(Object.values(fallbackMarketData));
  }

  // Handle chart data requests
  if (path.includes('/market_chart')) {
    const coinId = path.split('/')[1];
    const chartData = generateFallbackChartData(coinId);
    return NextResponse.json(chartData);
  }

  // Default fallback
  return NextResponse.json({ error: 'API temporarily unavailable, please try again later' }, { status: 503 });
}