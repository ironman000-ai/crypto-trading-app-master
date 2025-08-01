import React from 'react';

// 优化后的加密货币API集成 - 基于推荐的免费API组合
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
  // 新增技术指标字段
  rsi?: number;
  macd?: number;
  bollinger?: {
    upper: number;
    middle: number;
    lower: number;
  };
}

export interface CryptoHistoricalData {
  timestamp: number;
  price: number;
  volume: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface TechnicalIndicators {
  rsi: number;
  macd: number;
  signal: number;
  histogram: number;
  sma20: number;
  sma50: number;
  bollinger: {
    upper: number;
    middle: number;
    lower: number;
  };
  volume_sma: number;
}

export interface AIPredictonRequest {
  symbol: string;
  timeframe: string;
  data: {
    rsi: number;
    macd: number;
    volume: number;
    trend: 'up' | 'down' | 'sideways';
    news_sentiment: 'positive' | 'negative' | 'neutral';
    price_history: number[];
  };
  predict_period: string; // "1h", "4h", "1d"
}

export interface AIPredictionResponse {
  symbol: string;
  prediction: 'buy' | 'sell' | 'hold';
  confidence: number;
  probability_up: number;
  probability_down: number;
  target_price: number;
  stop_loss: number;
  reasoning: string;
  technical_analysis: string;
  risk_level: 'low' | 'medium' | 'high';
}

class OptimizedCryptoAPIManager {
  private readonly COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';
  private readonly BINANCE_BASE_URL = 'https://api.binance.com/api/v3';
  private readonly BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws/';
  
  // 缓存系统 - 针对不同数据类型设置不同缓存时间
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  // 缓存时间配置（毫秒）
  private readonly CACHE_CONFIG = {
    PRICE: 10000,      // 价格数据：10秒
    MARKET: 30000,     // 市场数据：30秒
    HISTORICAL: 300000, // 历史数据：5分钟
    TECHNICAL: 60000,   // 技术指标：1分钟
    PREDICTION: 180000  // AI预测：3分钟
  };

  // CoinGecko币种ID映射（扩展支持更多币种）
  private readonly coinGeckoIds: { [key: string]: string } = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'BNB': 'binancecoin',
    'SOL': 'solana',
    'XRP': 'ripple',
    'USDC': 'usd-coin',
    'USDT': 'tether',
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
    'NEAR': 'near',
    'VET': 'vechain',
    'ALGO': 'algorand',
    'HBAR': 'hedera-hashgraph',
    'QNT': 'quant-network'
  };

  // Binance交易对映射
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
    'NEAR': 'NEARUSDT',
    'VET': 'VETUSDT',
    'ALGO': 'ALGOUSDT'
  };

  private getCachedData(key: string, cacheType: keyof typeof this.CACHE_CONFIG): any | null {
    const cached = this.cache.get(key);
    const ttl = this.CACHE_CONFIG[cacheType];
    
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    
    // 清理过期缓存
    if (cached) {
      this.cache.delete(key);
    }
    
    return null;
  }

  private setCachedData(key: string, data: any, cacheType: keyof typeof this.CACHE_CONFIG): void {
    const ttl = this.CACHE_CONFIG[cacheType];
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  // 🔹 1. CoinGecko API - 获取实时价格（免费，推荐）
  async getCoinGeckoPrice(symbol: string): Promise<CryptoPrice | null> {
    const cacheKey = `coingecko_price_${symbol}`;
    const cached = this.getCachedData(cacheKey, 'PRICE');
    if (cached) return cached;

    try {
      const response = await fetch(`/api/crypto?endpoint=simple/price&ids=${this.coinGeckoIds[symbol]}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true&include_last_updated_at=true`);

      if (!response.ok) {
        throw new Error(`CoinGecko API错误: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const coinData = data[this.coinGeckoIds[symbol]];

      if (!coinData) {
        throw new Error(`CoinGecko未找到币种数据: ${symbol}`);
      }

      const cryptoPrice: CryptoPrice = {
        symbol,
        price: coinData.usd,
        change24h: coinData.usd_24h_change || 0,
        changePercent24h: ((coinData.usd_24h_change || 0) / coinData.usd) * 100,
        volume24h: coinData.usd_24h_vol || 0,
        marketCap: coinData.usd_market_cap || 0,
        high24h: coinData.usd * 1.05, // CoinGecko简单API不提供，估算
        low24h: coinData.usd * 0.95,
        timestamp: (coinData.last_updated_at || Date.now() / 1000) * 1000,
      };

      this.setCachedData(cacheKey, cryptoPrice, 'PRICE');
      return cryptoPrice;

    } catch (error) {
      console.error(`CoinGecko获取${symbol}价格失败:`, error);
      return null;
    }
  }

  // 🔹 2. Binance Public API - 获取详细行情数据（免费，推荐）
  async getBinancePrice(symbol: string): Promise<CryptoPrice | null> {
    const cacheKey = `binance_price_${symbol}`;
    const cached = this.getCachedData(cacheKey, 'PRICE');
    if (cached) return cached;

    try {
      const binanceSymbol = this.binanceSymbols[symbol];
      if (!binanceSymbol) throw new Error(`Binance不支持的币种: ${symbol}`);

      const response = await fetch(
        `${this.BINANCE_BASE_URL}/ticker/24hr?symbol=${binanceSymbol}`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'AI-Quantum-Trading/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Binance API错误: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      const cryptoPrice: CryptoPrice = {
        symbol,
        price: parseFloat(data.lastPrice),
        change24h: parseFloat(data.priceChange),
        changePercent24h: parseFloat(data.priceChangePercent),
        volume24h: parseFloat(data.quoteVolume), // USDT成交量
        marketCap: 0, // Binance不提供市值
        high24h: parseFloat(data.highPrice),
        low24h: parseFloat(data.lowPrice),
        timestamp: data.closeTime,
      };

      this.setCachedData(cacheKey, cryptoPrice, 'PRICE');
      return cryptoPrice;

    } catch (error) {
      console.error(`Binance获取${symbol}价格失败:`, error);
      return null;
    }
  }

  // 🔹 3. 智能价格获取 - 自动选择最佳数据源
  async getOptimalPrice(symbol: string): Promise<CryptoPrice | null> {
    try {
      // 优先使用Binance（数据更实时）
      const binancePrice = await this.getBinancePrice(symbol);
      if (binancePrice) {
        // 如果需要市值数据，补充CoinGecko数据
        const coinGeckoPrice = await this.getCoinGeckoPrice(symbol);
        if (coinGeckoPrice) {
          binancePrice.marketCap = coinGeckoPrice.marketCap;
        }
        return binancePrice;
      }

      // Binance失败时使用CoinGecko
      return await this.getCoinGeckoPrice(symbol);

    } catch (error) {
      console.error(`获取${symbol}最优价格失败:`, error);
      return null;
    }
  }

  // 🔹 4. 批量获取多币种价格
  async getBatchPrices(symbols: string[]): Promise<Map<string, CryptoPrice>> {
    const results = new Map<string, CryptoPrice>();
    
    // 并发获取所有币种价格
    const promises = symbols.map(async (symbol) => {
      const price = await this.getOptimalPrice(symbol);
      if (price) {
        results.set(symbol, price);
      }
    });

    await Promise.allSettled(promises);
    return results;
  }

  // 🔹 5. 获取K线历史数据（Binance）
  async getBinanceKlines(symbol: string, interval: string = '1h', limit: number = 100): Promise<CryptoHistoricalData[]> {
    const cacheKey = `binance_klines_${symbol}_${interval}_${limit}`;
    const cached = this.getCachedData(cacheKey, 'HISTORICAL');
    if (cached) return cached;

    try {
      const binanceSymbol = this.binanceSymbols[symbol];
      if (!binanceSymbol) throw new Error(`Binance不支持的币种: ${symbol}`);

      const response = await fetch(
        `${this.BINANCE_BASE_URL}/klines?symbol=${binanceSymbol}&interval=${interval}&limit=${limit}`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'AI-Quantum-Trading/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Binance K线API错误: ${response.status}`);
      }

      const data = await response.json();
      
      const klines: CryptoHistoricalData[] = data.map((kline: any[]) => ({
        timestamp: kline[0],
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        price: parseFloat(kline[4]), // close price
        volume: parseFloat(kline[5])
      }));

      this.setCachedData(cacheKey, klines, 'HISTORICAL');
      return klines;

    } catch (error) {
      console.error(`获取${symbol} K线数据失败:`, error);
      return [];
    }
  }

  // 🔹 6. 计算技术指标（基于ta-lib逻辑）
  calculateTechnicalIndicators(klines: CryptoHistoricalData[]): TechnicalIndicators | null {
    if (klines.length < 50) return null;

    const closes = klines.map(k => k.close);
    const volumes = klines.map(k => k.volume);
    
    try {
      // RSI计算（14周期）
      const rsi = this.calculateRSI(closes, 14);
      
      // MACD计算
      const macd = this.calculateMACD(closes);
      
      // 简单移动平均线
      const sma20 = this.calculateSMA(closes, 20);
      const sma50 = this.calculateSMA(closes, 50);
      
      // 布林带
      const bollinger = this.calculateBollingerBands(closes, 20, 2);
      
      // 成交量移动平均
      const volume_sma = this.calculateSMA(volumes, 20);

      return {
        rsi,
        macd: macd.macd,
        signal: macd.signal,
        histogram: macd.histogram,
        sma20,
        sma50,
        bollinger,
        volume_sma
      };

    } catch (error) {
      console.error('技术指标计算失败:', error);
      return null;
    }
  }

  // RSI计算
  private calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = prices.length - period; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  // MACD计算
  private calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
    if (prices.length < 26) return { macd: 0, signal: 0, histogram: 0 };
    
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macd = ema12 - ema26;
    
    // 简化的信号线计算
    const signal = macd * 0.9; // 简化版本
    const histogram = macd - signal;
    
    return { macd, signal, histogram };
  }

  // EMA计算
  private calculateEMA(prices: number[], period: number): number {
    if (prices.length === 0) return 0;
    
    const multiplier = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  }

  // SMA计算
  private calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return 0;
    
    const recentPrices = prices.slice(-period);
    return recentPrices.reduce((sum, price) => sum + price, 0) / period;
  }

  // 布林带计算
  private calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2): { upper: number; middle: number; lower: number } {
    if (prices.length < period) {
      const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      return { upper: avg * 1.02, middle: avg, lower: avg * 0.98 };
    }
    
    const recentPrices = prices.slice(-period);
    const sma = recentPrices.reduce((sum, price) => sum + price, 0) / period;
    
    const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
    const standardDeviation = Math.sqrt(variance);
    
    return {
      upper: sma + (standardDeviation * stdDev),
      middle: sma,
      lower: sma - (standardDeviation * stdDev)
    };
  }

  // 🔹 7. AI预测接口（自建模块）
  async getAIPrediction(request: AIPredictonRequest): Promise<AIPredictionResponse | null> {
    const cacheKey = `ai_prediction_${request.symbol}_${request.timeframe}`;
    const cached = this.getCachedData(cacheKey, 'PREDICTION');
    if (cached) return cached;

    try {
      // 这里可以调用你的AI预测服务
      // 示例：调用本地Flask API或者云端AI服务
      const response = await fetch('/api/ai-predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`AI预测API错误: ${response.status}`);
      }

      const prediction: AIPredictionResponse = await response.json();
      
      this.setCachedData(cacheKey, prediction, 'PREDICTION');
      return prediction;

    } catch (error) {
      console.error('AI预测失败，使用备用算法:', error);
      
      // 备用预测算法（基于技术指标）
      return this.generateFallbackPrediction(request);
    }
  }

  // 备用预测算法
  private generateFallbackPrediction(request: AIPredictonRequest): AIPredictionResponse {
    const { data } = request;
    
    let bullishSignals = 0;
    let bearishSignals = 0;
    let confidence = 50;
    
    // RSI分析
    if (data.rsi < 30) {
      bullishSignals += 2;
      confidence += 15;
    } else if (data.rsi > 70) {
      bearishSignals += 2;
      confidence += 15;
    }
    
    // MACD分析
    if (data.macd > 0) {
      bullishSignals += 1;
      confidence += 10;
    } else {
      bearishSignals += 1;
      confidence += 10;
    }
    
    // 趋势分析
    if (data.trend === 'up') {
      bullishSignals += 1;
      confidence += 10;
    } else if (data.trend === 'down') {
      bearishSignals += 1;
      confidence += 10;
    }
    
    // 情绪分析
    if (data.news_sentiment === 'positive') {
      bullishSignals += 1;
      confidence += 5;
    } else if (data.news_sentiment === 'negative') {
      bearishSignals += 1;
      confidence += 5;
    }
    
    // 成交量分析
    if (data.volume > 1000000000) {
      confidence += 10;
    }
    
    // 确定预测结果
    let prediction: 'buy' | 'sell' | 'hold';
    let probability_up: number;
    let probability_down: number;
    
    if (bullishSignals > bearishSignals + 1) {
      prediction = confidence > 65 ? 'buy' : 'hold';
      probability_up = Math.min(85, 50 + bullishSignals * 8);
      probability_down = 100 - probability_up;
    } else if (bearishSignals > bullishSignals + 1) {
      prediction = confidence > 65 ? 'sell' : 'hold';
      probability_down = Math.min(85, 50 + bearishSignals * 8);
      probability_up = 100 - probability_down;
    } else {
      prediction = 'hold';
      probability_up = 50;
      probability_down = 50;
    }
    
    // 估算目标价格
    const currentPrice = data.price_history[data.price_history.length - 1] || 50000;
    const volatility = 0.02; // 2%波动率
    
    return {
      symbol: request.symbol,
      prediction,
      confidence: Math.min(95, confidence),
      probability_up,
      probability_down,
      target_price: prediction === 'buy' ? currentPrice * (1 + volatility) : 
                   prediction === 'sell' ? currentPrice * (1 - volatility) : currentPrice,
      stop_loss: prediction === 'buy' ? currentPrice * 0.98 : 
                prediction === 'sell' ? currentPrice * 1.02 : currentPrice,
      reasoning: `基于技术指标分析：RSI=${data.rsi.toFixed(1)}, MACD=${data.macd.toFixed(4)}, 趋势=${data.trend}`,
      technical_analysis: `看涨信号: ${bullishSignals}, 看跌信号: ${bearishSignals}, 置信度: ${confidence}%`,
      risk_level: confidence > 80 ? 'low' : confidence > 60 ? 'medium' : 'high'
    };
  }

  // 🔹 8. 市场概览数据
  async getMarketOverview(): Promise<{
    totalMarketCap: number;
    totalVolume24h: number;
    btcDominance: number;
    activeCoins: number;
    fearGreedIndex?: number;
  } | null> {
    const cacheKey = 'market_overview';
    const cached = this.getCachedData(cacheKey, 'MARKET');
    if (cached) return cached;

    try {
      const response = await fetch('/api/crypto?endpoint=global');

      if (!response.ok) {
        throw new Error(`市场概览API错误: ${response.status}`);
      }

      const data = await response.json();
      const globalData = data.data || data;

      const overview = {
        totalMarketCap: globalData.total_market_cap?.usd || 0,
        totalVolume24h: globalData.total_volume?.usd || 0,
        btcDominance: globalData.market_cap_percentage?.btc || 0,
        activeCoins: globalData.active_cryptocurrencies || 0,
        fearGreedIndex: Math.floor(Math.random() * 100) // 可以接入Fear & Greed Index API
      };

      this.setCachedData(cacheKey, overview, 'MARKET');
      return overview;

    } catch (error) {
      console.error('获取市场概览失败:', error);
      return null;
    }
  }

  // 🔹 9. WebSocket实时数据流（Binance）
  createWebSocketConnection(symbols: string[], onMessage: (data: any) => void): WebSocket | null {
    try {
      const streams = symbols
        .map(symbol => this.binanceSymbols[symbol])
        .filter(Boolean)
        .map(symbol => `${symbol.toLowerCase()}@ticker`);
      
      if (streams.length === 0) return null;
      
      const wsUrl = `${this.BINANCE_WS_URL}${streams.join('/')}`;
      const ws = new WebSocket(wsUrl);
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (error) {
          console.error('WebSocket消息解析错误:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket连接错误:', error);
      };
      
      return ws;
      
    } catch (error) {
      console.error('创建WebSocket连接失败:', error);
      return null;
    }
  }

  // 🔹 10. 清理和工具方法
  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  getSupportedSymbols(): string[] {
    return Object.keys(this.coinGeckoIds);
  }

  getBinanceSupportedSymbols(): string[] {
    return Object.keys(this.binanceSymbols);
  }
}

// 全局实例
export const optimizedCryptoAPI = new OptimizedCryptoAPIManager();

// React Hook for optimized real-time crypto data
export function useOptimizedCryptoPrice(symbol: string) {
  const [data, setData] = React.useState<CryptoPrice | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [dataSource, setDataSource] = React.useState<'binance' | 'coingecko' | 'hybrid'>('hybrid');

  React.useEffect(() => {
    let isMounted = true;

    const fetchPrice = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const price = await optimizedCryptoAPI.getOptimalPrice(symbol);

        if (isMounted) {
          setData(price);
          setDataSource('hybrid');
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

    fetchPrice();
    const interval = setInterval(fetchPrice, 10000); // 10秒更新

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [symbol]);

  return { data, loading, error, dataSource };
}

// React Hook for batch crypto prices
export function useOptimizedCryptoPrices(symbols: string[]) {
  const [data, setData] = React.useState<Map<string, CryptoPrice>>(new Map());
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    const fetchPrices = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const prices = await optimizedCryptoAPI.getBatchPrices(symbols);

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
    const interval = setInterval(fetchPrices, 15000); // 15秒更新

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [symbols.join(',')]);

  return { data, loading, error };
}

// React Hook for technical analysis
export function useTechnicalAnalysis(symbol: string, interval: string = '1h') {
  const [indicators, setIndicators] = React.useState<TechnicalIndicators | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    const fetchTechnicalData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const klines = await optimizedCryptoAPI.getBinanceKlines(symbol, interval, 100);
        if (klines.length > 0) {
          const technicalIndicators = optimizedCryptoAPI.calculateTechnicalIndicators(klines);
          
          if (isMounted) {
            setIndicators(technicalIndicators);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : '获取技术分析失败');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchTechnicalData();
    const interval_ms = interval === '1m' ? 60000 : interval === '5m' ? 300000 : 3600000; // 根据时间周期调整更新频率
    const intervalId = setInterval(fetchTechnicalData, interval_ms);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [symbol, interval]);

  return { indicators, loading, error };
}

// 兼容性导出（保持向后兼容）
export const cryptoAPI = optimizedCryptoAPI;
export const useRealTimeCryptoPrice = useOptimizedCryptoPrice;
export const useRealTimeCryptoPrices = useOptimizedCryptoPrices;