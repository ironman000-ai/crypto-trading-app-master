interface RealtimePrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
}

interface RealtimeSubscription {
  symbol: string;
  callback: (data: RealtimePrice) => void;
}

class RealtimeDataManager {
  private subscriptions: Map<string, RealtimeSubscription[]> = new Map();
  private priceCache: Map<string, RealtimePrice> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  // 模拟实时价格数据生成器
  private generateRealtimePrice(symbol: string, basePrice: number): RealtimePrice {
    const cached = this.priceCache.get(symbol);
    const lastPrice = cached?.price || basePrice;
    
    // 生成微小的价格波动 (0.01% - 0.1%)
    const volatility = 0.001 + Math.random() * 0.001;
    const direction = Math.random() > 0.5 ? 1 : -1;
    const priceChange = lastPrice * volatility * direction;
    const newPrice = lastPrice + priceChange;
    
    const change24h = cached ? newPrice - basePrice : priceChange;
    const changePercent = (change24h / basePrice) * 100;
    
    return {
      symbol,
      price: newPrice,
      change: change24h,
      changePercent,
      volume: Math.random() * 1000000000 + 500000000,
      timestamp: Date.now()
    };
  }

  // 订阅实时数据
  subscribe(symbol: string, callback: (data: RealtimePrice) => void): () => void {
    if (!this.subscriptions.has(symbol)) {
      this.subscriptions.set(symbol, []);
    }
    
    const subscription: RealtimeSubscription = { symbol, callback };
    this.subscriptions.get(symbol)!.push(subscription);
    
    // 如果是第一个订阅，启动数据更新
    if (!this.isRunning) {
      this.startRealtimeUpdates();
    }
    
    // 立即发送当前数据
    const cached = this.priceCache.get(symbol);
    if (cached) {
      callback(cached);
    }
    
    // 返回取消订阅函数
    return () => {
      const subs = this.subscriptions.get(symbol);
      if (subs) {
        const index = subs.indexOf(subscription);
        if (index > -1) {
          subs.splice(index, 1);
        }
        if (subs.length === 0) {
          this.subscriptions.delete(symbol);
        }
      }
      
      // 如果没有订阅了，停止更新
      if (this.subscriptions.size === 0) {
        this.stopRealtimeUpdates();
      }
    };
  }

  // 启动实时更新 (每100毫秒更新一次)
  private startRealtimeUpdates() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    
    // 基础价格数据
    const basePrices: { [key: string]: number } = {
      'BTC': 43250,
      'ETH': 2678,
      'BNB': 312,
      'SOL': 67,
      'XRP': 0.62,
      'ADA': 0.35,
      'AVAX': 28,
      'DOGE': 0.08,
      'TRX': 0.11,
      'DOT': 6.5,
      'MATIC': 0.85,
      'LTC': 75,
      'SHIB': 0.000012,
      'UNI': 8.5,
      'ATOM': 12,
      'LINK': 15,
      'APT': 9.5,
      'ICP': 5.2,
      'FIL': 4.8,
    };
    
    this.updateInterval = setInterval(() => {
      this.subscriptions.forEach((subs, symbol) => {
        const basePrice = basePrices[symbol] || 100;
        const realtimeData = this.generateRealtimePrice(symbol, basePrice);
        
        // 缓存数据
        this.priceCache.set(symbol, realtimeData);
        
        // 通知所有订阅者
        subs.forEach(sub => {
          try {
            sub.callback(realtimeData);
          } catch (error) {
            console.error('Realtime callback error:', error);
          }
        });
      });
    }, 100); // 100毫秒更新一次
  }

  // 停止实时更新
  private stopRealtimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isRunning = false;
  }

  // 获取当前价格
  getCurrentPrice(symbol: string): RealtimePrice | null {
    return this.priceCache.get(symbol) || null;
  }

  // 清理所有订阅
  cleanup() {
    this.stopRealtimeUpdates();
    this.subscriptions.clear();
    this.priceCache.clear();
  }
}

// 全局实例
export const realtimeDataManager = new RealtimeDataManager();

// React Hook for realtime data
export function useRealtimePrice(symbol: string) {
  const [data, setData] = React.useState<RealtimePrice | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);

  React.useEffect(() => {
    setIsConnected(true);
    
    const unsubscribe = realtimeDataManager.subscribe(symbol, (newData) => {
      setData(newData);
    });

    return () => {
      unsubscribe();
      setIsConnected(false);
    };
  }, [symbol]);

  return { data, isConnected };
}

// React Hook for multiple symbols
export function useRealtimePrices(symbols: string[]) {
  const [data, setData] = React.useState<Map<string, RealtimePrice>>(new Map());
  const [isConnected, setIsConnected] = React.useState(false);

  React.useEffect(() => {
    setIsConnected(true);
    const unsubscribes: (() => void)[] = [];

    symbols.forEach(symbol => {
      const unsubscribe = realtimeDataManager.subscribe(symbol, (newData) => {
        setData(prev => new Map(prev.set(symbol, newData)));
      });
      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
      setIsConnected(false);
    };
  }, [symbols.join(',')]);

  return { data, isConnected };
}