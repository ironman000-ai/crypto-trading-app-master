import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ALLTICK_API_KEY = '24b312ffd3b36711b157ffd6072a2e81-c-app';
const ALLTICK_BASE_URL = 'https://quote-api.alltick.co/quote';

// 币种映射
const SYMBOL_MAP: { [key: string]: string } = {
  'bitcoin': 'BTCUSDT',
  'ethereum': 'ETHUSDT',
  'binancecoin': 'BNBUSDT',
  'solana': 'SOLUSDT',
  'ripple': 'XRPUSDT',
  'cardano': 'ADAUSDT',
  'avalanche-2': 'AVAXUSDT',
  'dogecoin': 'DOGEUSDT',
  'tron': 'TRXUSDT',
  'polkadot': 'DOTUSDT',
  'matic-network': 'MATICUSDT',
  'litecoin': 'LTCUSDT',
  'shiba-inu': 'SHIBUSDT',
  'uniswap': 'UNIUSDT',
  'cosmos': 'ATOMUSDT',
  'chainlink': 'LINKUSDT',
  'aptos': 'APTUSDT',
  'internet-computer': 'ICPUSDT',
  'filecoin': 'FILUSDT',
  'usd-coin': 'USDCUSDT'
};

// 反向映射
const REVERSE_SYMBOL_MAP: { [key: string]: string } = {};
Object.entries(SYMBOL_MAP).forEach(([key, value]) => {
  REVERSE_SYMBOL_MAP[value] = key;
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');
  const symbols = searchParams.get('symbols');
  const symbol = searchParams.get('symbol');
  const period = searchParams.get('period') || '1d';
  const count = searchParams.get('count') || '100';

  try {
    if (endpoint === 'realtime') {
      // 获取实时行情数据
      const symbolList = symbols ? symbols.split(',').map(s => SYMBOL_MAP[s] || s) : ['BTCUSDT'];
      
      const response = await fetch(`${ALLTICK_BASE_URL}/realtime`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': ALLTICK_API_KEY
        },
        body: JSON.stringify({
          trace: `realtime_${Date.now()}`,
          data: {
            symbol_list: symbolList,
            field_list: ['latest_price', 'open', 'high', 'low', 'volume', 'prev_close', 'change_rate']
          }
        })
      });

      if (!response.ok) {
        throw new Error(`AllTick API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.code !== 0) {
        throw new Error(`AllTick API error: ${data.message}`);
      }

      // 转换为CoinGecko格式
      const formattedData = data.data.map((item: any) => {
        const coinId = REVERSE_SYMBOL_MAP[item.symbol] || item.symbol.toLowerCase();
        const price = parseFloat(item.latest_price || 0);
        const prevClose = parseFloat(item.prev_close || price);
        const changeRate = parseFloat(item.change_rate || 0);
        
        return {
          id: coinId,
          symbol: item.symbol.replace('USDT', '').toLowerCase(),
          name: item.symbol.replace('USDT', ''),
          current_price: price,
          price_change_24h: price - prevClose,
          price_change_percentage_24h: changeRate,
          total_volume: parseFloat(item.volume || 0),
          market_cap: price * 21000000, // 估算市值
          high_24h: parseFloat(item.high || price),
          low_24h: parseFloat(item.low || price)
        };
      });

      return NextResponse.json(formattedData);
    }

    if (endpoint === 'kline') {
      // 获取K线数据
      const alltickSymbol = SYMBOL_MAP[symbol || 'bitcoin'] || 'BTCUSDT';
      
      const response = await fetch(`${ALLTICK_BASE_URL}/kline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': ALLTICK_API_KEY
        },
        body: JSON.stringify({
          trace: `kline_${Date.now()}`,
          data: {
            symbol: alltickSymbol,
            period: period,
            count: parseInt(count)
          }
        })
      });

      if (!response.ok) {
        throw new Error(`AllTick API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.code !== 0) {
        throw new Error(`AllTick API error: ${data.message}`);
      }

      // 转换为CoinGecko market_chart格式
      const prices = data.data.map((item: any) => [
        parseInt(item.time) * 1000, // 转换为毫秒
        parseFloat(item.close)
      ]);

      const volumes = data.data.map((item: any) => [
        parseInt(item.time) * 1000,
        parseFloat(item.volume)
      ]);

      return NextResponse.json({
        prices,
        total_volumes: volumes
      });
    }

    return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });

  } catch (error) {
    console.error('AllTick API error:', error);
    
    // 返回备用数据
    if (endpoint === 'realtime') {
      const fallbackData = [
        {
          id: 'bitcoin',
          symbol: 'btc',
          name: 'Bitcoin',
          current_price: 97234,
          price_change_24h: 1856,
          price_change_percentage_24h: 1.95,
          total_volume: 28500000000,
          market_cap: 1900000000000,
          high_24h: 98000,
          low_24h: 95000
        }
      ];
      return NextResponse.json(fallbackData);
    }

    if (endpoint === 'kline') {
      const now = Date.now();
      const prices = [];
      const volumes = [];
      
      for (let i = 100; i >= 0; i--) {
        const timestamp = now - (i * 60 * 60 * 1000);
        const price = 97234 * (1 + (Math.random() - 0.5) * 0.02);
        const volume = Math.random() * 1000000;
        
        prices.push([timestamp, price]);
        volumes.push([timestamp, volume]);
      }
      
      return NextResponse.json({ prices, total_volumes: volumes });
    }

    return NextResponse.json({ error: 'API temporarily unavailable' }, { status: 503 });
  }
}