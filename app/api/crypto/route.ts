import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// CoinGecko免费API基础URL
const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

// 简单的内存缓存
const cache = new Map();
const CACHE_DURATION = 14400000; // 4小时缓存

function getCacheKey(endpoint: string, params: any): string {
  return `${endpoint}_${JSON.stringify(params)}`;
}

function getFromCache(key: string): any {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');
  const ids = searchParams.get('ids') || '';
  const vs_currency = searchParams.get('vs_currency') || 'usd';
  const days = searchParams.get('days') || '1';
  const interval = searchParams.get('interval') || 'hourly';

  try {
    if (endpoint === 'coins/markets') {
      // 获取市场数据
      const cacheKey = getCacheKey('markets', { ids, vs_currency });
      const cachedData = getFromCache(cacheKey);
      if (cachedData) {
        return NextResponse.json(cachedData);
      }

      const url = `${COINGECKO_BASE_URL}/coins/markets?vs_currency=${vs_currency}&ids=${ids}&order=market_cap_desc&per_page=20&page=1&sparkline=false&price_change_percentage=24h`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          ...(process.env.COINGECKO_API_KEY && { 'x-cg-pro-api-key': process.env.COINGECKO_API_KEY }),
        }
      });

      if (!response.ok) {
        return handleFallbackData(endpoint, { ids, vs_currency, days });
      }

      const data = await response.json();
      setCache(cacheKey, data);
      return NextResponse.json(data);
    }

    if (endpoint === 'coins/chart') {
      // 获取价格历史数据
      const coinId = searchParams.get('id');
      if (!coinId) {
        return NextResponse.json({ error: 'Coin ID is required' }, { status: 400 });
      }

      const cacheKey = getCacheKey('chart', { coinId, vs_currency, days });
      const cachedData = getFromCache(cacheKey);
      if (cachedData) {
        return NextResponse.json(cachedData);
      }

      const url = `${COINGECKO_BASE_URL}/coins/${coinId}/market_chart?vs_currency=${vs_currency}&days=${days}&interval=${interval}`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          ...(process.env.COINGECKO_API_KEY && { 'x-cg-pro-api-key': process.env.COINGECKO_API_KEY }),
        }
      });

      if (!response.ok) {
        return handleFallbackData(endpoint, { coinId, vs_currency, days });
      }

      const data = await response.json();
      setCache(cacheKey, data);
      return NextResponse.json(data);
    }

    if (endpoint === 'simple/price') {
      // 获取简单价格数据
      const cacheKey = getCacheKey('simple_price', { ids, vs_currency });
      const cachedData = getFromCache(cacheKey);
      if (cachedData) {
        return NextResponse.json(cachedData);
      }

      const url = `${COINGECKO_BASE_URL}/simple/price?ids=${ids}&vs_currencies=${vs_currency}&include_24hr_change=true&include_24hr_vol=true`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          ...(process.env.COINGECKO_API_KEY && { 'x-cg-pro-api-key': process.env.COINGECKO_API_KEY }),
        }
      });

      if (!response.ok) {
        return handleFallbackData(endpoint, { ids, vs_currency });
      }

      const data = await response.json();
      setCache(cacheKey, data);
      return NextResponse.json(data);
    }

    if (endpoint === 'global') {
      // 获取全球市场数据
      const cacheKey = getCacheKey('global', {});
      const cachedData = getFromCache(cacheKey);
      if (cachedData) {
        return NextResponse.json(cachedData);
      }

      const url = `${COINGECKO_BASE_URL}/global`;
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          ...(process.env.COINGECKO_API_KEY && { 'x-cg-pro-api-key': process.env.COINGECKO_API_KEY }),
        }
      });

      if (!response.ok) {
        return handleFallbackData(endpoint, {});
      }

      const data = await response.json();
      setCache(cacheKey, data);
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });

  } catch (error) {
    console.error('CoinGecko API error:', error);
    
    // 返回备用数据
    return handleFallbackData(endpoint, { ids, vs_currency, days });
  }
}

function handleFallbackData(endpoint: string | null, params: any) {
  if (endpoint === 'coins/markets' || endpoint === 'simple/price') {
    const fallbackData = [
      {
        id: 'bitcoin',
        symbol: 'btc',
        name: 'Bitcoin',
        current_price: 43250.67,
        price_change_24h: 1234.56,
        price_change_percentage_24h: 2.94,
        total_volume: 28500000000,
        market_cap: 847000000000,
        high_24h: 44000,
        low_24h: 42000
      },
      {
        id: 'ethereum',
        symbol: 'eth',
        name: 'Ethereum',
        current_price: 2678.45,
        price_change_24h: -89.23,
        price_change_percentage_24h: -3.22,
        total_volume: 15200000000,
        market_cap: 322000000000,
        high_24h: 2750,
        low_24h: 2600
      },
      {
        id: 'binancecoin',
        symbol: 'bnb',
        name: 'BNB',
        current_price: 312.89,
        price_change_24h: 8.45,
        price_change_percentage_24h: 2.78,
        total_volume: 1200000000,
        market_cap: 48000000000,
        high_24h: 320,
        low_24h: 305
      },
      {
        id: 'solana',
        symbol: 'sol',
        name: 'Solana',
        current_price: 67.23,
        price_change_24h: 2.34,
        price_change_percentage_24h: 3.61,
        total_volume: 2100000000,
        market_cap: 29000000000,
        high_24h: 69,
        low_24h: 64
      },
      {
        id: 'ripple',
        symbol: 'xrp',
        name: 'XRP',
        current_price: 0.6234,
        price_change_24h: 0.0234,
        price_change_percentage_24h: 3.91,
        total_volume: 1800000000,
        market_cap: 34000000000,
        high_24h: 0.65,
        low_24h: 0.60
      },
      {
        id: 'cardano',
        symbol: 'ada',
        name: 'Cardano',
        current_price: 0.3456,
        price_change_24h: -0.0123,
        price_change_percentage_24h: -3.44,
        total_volume: 450000000,
        market_cap: 12000000000,
        high_24h: 0.36,
        low_24h: 0.33
      }
    ];
    return NextResponse.json(fallbackData);
  }

  if (endpoint === 'coins/chart') {
    const now = Date.now();
    const prices = [];
    const volumes = [];
    
    for (let i = 24; i >= 0; i--) {
      const timestamp = now - (i * 60 * 60 * 1000);
      const price = 43250 * (1 + (Math.random() - 0.5) * 0.02);
      const volume = Math.random() * 1000000000 + 500000000;
      
      prices.push([timestamp, price]);
      volumes.push([timestamp, volume]);
    }
    
    return NextResponse.json({ prices, total_volumes: volumes });
  }

  if (endpoint === 'global') {
    const fallbackGlobalData = {
      data: {
        total_market_cap: {
          usd: 1650000000000
        },
        total_volume: {
          usd: 85000000000
        },
        market_cap_percentage: {
          btc: 52.3
        },
        active_cryptocurrencies: 13847
      }
    };
    return NextResponse.json(fallbackGlobalData);
  }

  return NextResponse.json({ error: 'API temporarily unavailable' }, { status: 503 });
}