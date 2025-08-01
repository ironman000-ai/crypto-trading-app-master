import React from 'react';

// 真实的加密货币API集成
export interface CryptoPrice {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap: number;
  high24h: number;
  low24h: number;
  timestamp: number;
}

export interface CryptoHistoricalData {
  timestamp: number;
  price: number;
  volume: number;
}

class CryptoAPIManager {
  private readonly COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';
  private readonly BINANCE_BASE_URL = 'https://api.binance.com/api/v3';
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 30000; // 30秒缓存

  // CoinGecko币种ID映射
  private readonly coinGeckoIds: { [key: string]: string } = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'BNB': 'binancecoin',
    'SOL': 'solana',
    'XRP': 'ripple',
    'USDC': 'usd-coin',
    'ADA': 'cardano',
    'AVAX': 'avalanche-2',
    'DOGE': 'dogecoin',
    'TRX': 'tron',
    'DOT': 'polkadot',
    'MATIC': 'matic-network',
    'LTC': 'litecoin',
    'SHIB': 'shiba-inu',
    'UNI': 'uniswap',
    'ATOM': 'cosmos',
    'LINK': 'chainlink',
    'APT': 'aptos',
    'ICP': 'internet-computer',
    'FIL': 'filecoin',
  };

  // 币安交易对映射
  private readonly binanceSymbols: { [key: string]: string } = {
    'BTC': 'BTCUSDT',
    'ETH': 'ETHUSDT',
    'BNB': 'BNBUSDT',
    'SOL': 'SOLUSDT',
    'XRP': 'XRPUSDT',
    'ADA': 'ADAUSDT',
    'AVAX': 'AVAXUSDT',
    'DOGE': 'DOGEUSDT',
    'TRX': 'TRXUSDT',
    'DOT': 'DOTUSDT',
    'MATIC': 'MATICUSDT',
    'LTC': 'LTCUSDT',
    'SHIB': 'SHIBUSDT',
    'UNI': 'UNIUSDT',
    'ATOM': 'ATOMUSDT',
    'LINK': 'LINKUSDT',
  };

  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  // 获取单个币种的实时价格 (使用CoinGecko)
  async getRealTimePrice(symbol: string): Promise<CryptoPrice | null> {
    const cacheKey = `price_${symbol}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const coinId = this.coinGeckoIds[symbol];
      if (!coinId) throw new Error(`不支持的币种: ${symbol}`);

      const response = await fetch(
        `${this.COINGECKO_BASE_URL}/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true&include_last_updated_at=true`,
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API错误: ${response.status}`);
      }

      const data = await response.json();
      const coinData = data[coinId];

      if (!coinData) {
        throw new Error(`未找到币种数据: ${symbol}`);
      }

      const cryptoPrice: CryptoPrice = {
        symbol,
        price: coinData.usd,
        change24h: coinData.usd_24h_change || 0,
        changePercent24h: ((coinData.usd_24h_change || 0) / coinData.usd) * 100,
        volume24h: coinData.usd_24h_vol || 0,
        marketCap: coinData.usd_market_cap || 0,
        high24h: coinData.usd * 1.05, // 估算，CoinGecko简单API不提供
        low24h: coinData.usd * 0.95,  // 估算，CoinGecko简单API不提供
        timestamp: (coinData.last_updated_at || Date.now() / 1000) * 1000,
      };

      this.setCachedData(cacheKey, cryptoPrice);
      return cryptoPrice;

    } catch (error) {
      console.error(`获取${symbol}价格失败:`, error);
      return null;
    }
  }

  // 获取多个币种的实时价格
  async getRealTimePrices(symbols: string[]): Promise<Map<string, CryptoPrice>> {
    const results = new Map<string, CryptoPrice>();
    
    try {
      // 批量获取CoinGecko数据
      const coinIds = symbols
        .map(symbol => this.coinGeckoIds[symbol])
        .filter(Boolean);

      if (coinIds.length === 0) return results;

      const response = await fetch(
        `${this.COINGECKO_BASE_URL}/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true&include_last_updated_at=true`,
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API错误: ${response.status}`);
      }

      const data = await response.json();

      symbols.forEach(symbol => {
        const coinId = this.coinGeckoIds[symbol];
        const coinData = data[coinId];

        if (coinData) {
          const cryptoPrice: CryptoPrice = {
            symbol,
            price: coinData.usd,
            change24h: coinData.usd_24h_change || 0,
            changePercent24h: ((coinData.usd_24h_change || 0) / coinData.usd) * 100,
            volume24h: coinData.usd_24h_vol || 0,
            marketCap: coinData.usd_market_cap || 0,
            high24h: coinData.usd * 1.05,
            low24h: coinData.usd * 0.95,
            timestamp: (coinData.last_updated_at || Date.now() / 1000) * 1000,
          };

          results.set(symbol, cryptoPrice);
          this.setCachedData(`price_${symbol}`, cryptoPrice);
        }
      });

    } catch (error) {
      console.error('批量获取价格失败:', error);
      
      // 如果批量失败，尝试单独获取
      for (const symbol of symbols) {
        const price = await this.getRealTimePrice(symbol);
        if (price) {
          results.set(symbol, price);
        }
      }
    }

    return results;
  }

  // 获取历史价格数据
  async getHistoricalData(symbol: string, days: number = 7): Promise<CryptoHistoricalData[]> {
    const cacheKey = `history_${symbol}_${days}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const coinId = this.coinGeckoIds[symbol];
      if (!coinId) throw new Error(`不支持的币种: ${symbol}`);

      const response = await fetch(
        `${this.COINGECKO_BASE_URL}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=${days <= 1 ? 'hourly' : 'daily'}`,
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error(`CoinGecko API错误: ${response.status}`);
      }

      const data = await response.json();
      const prices = data.prices || [];
      const volumes = data.total_volumes || [];

      const historicalData: CryptoHistoricalData[] = prices.map((pricePoint: [number, number], index: number) => ({
        timestamp: pricePoint[0],
        price: pricePoint[1],
        volume: volumes[index] ? volumes[index][1] : 0,
      }));

      this.setCachedData(cacheKey, historicalData);
      return historicalData;

    } catch (error) {
      console.error(`获取${symbol}历史数据失败:`, error);
      return [];
    }
  }

  // 获取市场概览数据
  async getMarketOverview(): Promise<{
    totalMarketCap: number;
    totalVolume24h: number;
    btcDominance: number;
    activeCoins: number;
  } | null> {
    const cacheKey = 'market_overview';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch('/api/crypto?endpoint=global', {
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`API错误: ${response.status}`);
      }

      const data = await response.json();
      const globalData = data.data || data;

      const overview = {
        totalMarketCap: globalData.total_market_cap?.usd || 0,
        totalVolume24h: globalData.total_volume?.usd || 0,
        btcDominance: globalData.market_cap_percentage?.btc || 0,
        activeCoins: globalData.active_cryptocurrencies || 0,
      };

      this.setCachedData(cacheKey, overview);
      return overview;

    } catch (error) {
      console.error('获取市场概览失败:', error);
      return null;
    }
  }

  // 使用币安API获取更高频的价格数据
  async getBinancePrice(symbol: string): Promise<CryptoPrice | null> {
    try {
      const binanceSymbol = this.binanceSymbols[symbol];
      if (!binanceSymbol) throw new Error(`币安不支持的币种: ${symbol}`);

      const response = await fetch(
        `${this.BINANCE_BASE_URL}/ticker/24hr?symbol=${binanceSymbol}`,
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error(`币安API错误: ${response.status}`);
      }

      const data = await response.json();

      const cryptoPrice: CryptoPrice = {
        symbol,
        price: parseFloat(data.lastPrice),
        change24h: parseFloat(data.priceChange),
        changePercent24h: parseFloat(data.priceChangePercent),
        volume24h: parseFloat(data.volume) * parseFloat(data.lastPrice),
        marketCap: 0, // 币安API不提供市值
        high24h: parseFloat(data.highPrice),
        low24h: parseFloat(data.lowPrice),
        timestamp: data.closeTime,
      };

      return cryptoPrice;

    } catch (error) {
      console.error(`获取币安${symbol}价格失败:`, error);
      return null;
    }
  }

  // 清理缓存
  clearCache(): void {
    this.cache.clear();
  }

  // 获取支持的币种列表
  getSupportedSymbols(): string[] {
    return Object.keys(this.coinGeckoIds);
  }
}

// 全局实例
export const cryptoAPI = new CryptoAPIManager();

// React Hook for real-time crypto data
export function useRealTimeCryptoPrice(symbol: string) {
  const [data, setData] = React.useState<CryptoPrice | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    const fetchPrice = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 优先使用币安API获取更实时的数据
        let price = await cryptoAPI.getBinancePrice(symbol);
        
        // 如果币安失败，使用CoinGecko
        if (!price) {
          price = await cryptoAPI.getRealTimePrice(symbol);
        }

        if (isMounted) {
          setData(price);
          if (!price) {
            setError(`无法获取${symbol}的价格数据`);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : '获取数据失败');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // 立即获取一次数据
    fetchPrice();

    // 设置定时更新 (每30秒)
    const interval = setInterval(fetchPrice, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [symbol]);

  return { data, loading, error };
}

// React Hook for multiple crypto prices
export function useRealTimeCryptoPrices(symbols: string[]) {
  const [data, setData] = React.useState<Map<string, CryptoPrice>>(new Map());
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    const fetchPrices = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const prices = await cryptoAPI.getRealTimePrices(symbols);

        if (isMounted) {
          setData(prices);
          if (prices.size === 0) {
            setError('无法获取任何价格数据');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : '获取数据失败');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [symbols.join(',')]);

  return { data, loading, error };
}