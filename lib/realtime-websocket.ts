import React from 'react';

interface RealtimePrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
  high24h: number;
  low24h: number;
  bid: number;
  ask: number;
}

interface WebSocketMessage {
  stream: string;
  data: {
    s: string; // symbol
    c: string; // close price
    o: string; // open price
    h: string; // high price
    l: string; // low price
    v: string; // volume
    q: string; // quote volume
    P: string; // price change percent
    p: string; // price change
    b: string; // best bid price
    a: string; // best ask price
    E: number; // event time
  };
}

class RealTimeWebSocketManager {
  private ws: WebSocket | null = null;
  private subscriptions: Map<string, ((data: RealtimePrice) => void)[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private connectionStatus: 'connected' | 'connecting' | 'disconnected' = 'disconnected';

  // Binance WebSocket API (免费且高频)
  private readonly WS_URL = 'wss://stream.binance.com:9443/ws/';
  
  // 币安交易对映射
  private readonly symbolMap: { [key: string]: string } = {
    'BTC': 'btcusdt',
    'ETH': 'ethusdt',
    'BNB': 'bnbusdt',
    'SOL': 'solusdt',
    'XRP': 'xrpusdt',
    'ADA': 'adausdt',
    'AVAX': 'avaxusdt',
    'DOGE': 'dogeusdt',
    'DOT': 'dotusdt',
    'MATIC': 'maticusdt',
    'LTC': 'ltcusdt',
    'UNI': 'uniusdt',
    'ATOM': 'atomusdt',
    'LINK': 'linkusdt',
    'TRX': 'trxusdt',
    'ICP': 'icpusdt',
    'FIL': 'filusdt',
    'APT': 'aptusdt',
    'SHIB': 'shibusdt'
  };

  constructor() {
    this.connect();
  }

  private connect() {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isConnecting = true;
    this.connectionStatus = 'connecting';

    try {
      // 构建订阅的交易对列表
      const streams = Object.values(this.symbolMap).map(symbol => `${symbol}@ticker`);
      const streamUrl = `${this.WS_URL}${streams.join('/')}`;

      this.ws = new WebSocket(streamUrl);

      this.ws.onopen = () => {
        console.log('✅ 币安WebSocket连接已建立 - 毫秒级实时数据流启动');
        this.isConnecting = false;
        this.connectionStatus = 'connected';
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('WebSocket消息解析错误:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('🔌 WebSocket连接已关闭');
        this.connectionStatus = 'disconnected';
        this.isConnecting = false;
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket连接错误:', error);
        this.connectionStatus = 'disconnected';
        this.isConnecting = false;
      };

    } catch (error) {
      console.error('WebSocket连接失败:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private handleMessage(message: WebSocketMessage) {
    if (!message.data || !message.data.s) return;

    const binanceSymbol = message.data.s.toLowerCase();
    const symbol = this.getSymbolFromBinance(binanceSymbol);
    
    if (!symbol) return;

    const data: RealtimePrice = {
      symbol,
      price: parseFloat(message.data.c),
      change: parseFloat(message.data.p),
      changePercent: parseFloat(message.data.P),
      volume: parseFloat(message.data.v),
      timestamp: message.data.E,
      high24h: parseFloat(message.data.h),
      low24h: parseFloat(message.data.l),
      bid: parseFloat(message.data.b),
      ask: parseFloat(message.data.a)
    };

    // 通知所有订阅者
    const subscribers = this.subscriptions.get(symbol);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('订阅回调错误:', error);
        }
      });
    }
  }

  private getSymbolFromBinance(binanceSymbol: string): string | null {
    for (const [symbol, mapped] of Object.entries(this.symbolMap)) {
      if (mapped === binanceSymbol) {
        return symbol;
      }
    }
    return null;
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ WebSocket重连次数已达上限');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 ${delay}ms后尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  subscribe(symbol: string, callback: (data: RealtimePrice) => void): () => void {
    if (!this.subscriptions.has(symbol)) {
      this.subscriptions.set(symbol, []);
    }
    
    this.subscriptions.get(symbol)!.push(callback);
    
    // 返回取消订阅函数
    return () => {
      const subscribers = this.subscriptions.get(symbol);
      if (subscribers) {
        const index = subscribers.indexOf(callback);
        if (index > -1) {
          subscribers.splice(index, 1);
        }
        if (subscribers.length === 0) {
          this.subscriptions.delete(symbol);
        }
      }
    };
  }

  getConnectionStatus(): 'connected' | 'connecting' | 'disconnected' {
    return this.connectionStatus;
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscriptions.clear();
    this.connectionStatus = 'disconnected';
  }

  // 获取支持的交易对列表
  getSupportedSymbols(): string[] {
    return Object.keys(this.symbolMap);
  }
}

// 全局实例
export const realTimeWebSocket = new RealTimeWebSocketManager();

// React Hook for real-time data
export function useRealTimePrice(symbol: string) {
  const [data, setData] = React.useState<RealtimePrice | null>(null);
  const [connectionStatus, setConnectionStatus] = React.useState<'connected' | 'connecting' | 'disconnected'>('disconnected');

  React.useEffect(() => {
    const updateConnectionStatus = () => {
      setConnectionStatus(realTimeWebSocket.getConnectionStatus());
    };

    // 初始状态
    updateConnectionStatus();

    // 订阅实时数据
    const unsubscribe = realTimeWebSocket.subscribe(symbol, (newData) => {
      setData(newData);
      updateConnectionStatus();
    });

    // 定期更新连接状态
    const statusInterval = setInterval(updateConnectionStatus, 1000);

    return () => {
      unsubscribe();
      clearInterval(statusInterval);
    };
  }, [symbol]);

  return { data, connectionStatus, isConnected: connectionStatus === 'connected' };
}

// React Hook for multiple symbols
export function useRealTimePrices(symbols: string[]) {
  const [data, setData] = React.useState<Map<string, RealtimePrice>>(new Map());
  const [connectionStatus, setConnectionStatus] = React.useState<'connected' | 'connecting' | 'disconnected'>('disconnected');

  React.useEffect(() => {
    const unsubscribes: (() => void)[] = [];
    
    const updateConnectionStatus = () => {
      setConnectionStatus(realTimeWebSocket.getConnectionStatus());
    };

    updateConnectionStatus();

    symbols.forEach(symbol => {
      const unsubscribe = realTimeWebSocket.subscribe(symbol, (newData) => {
        setData(prev => new Map(prev.set(symbol, newData)));
        updateConnectionStatus();
      });
      unsubscribes.push(unsubscribe);
    });

    const statusInterval = setInterval(updateConnectionStatus, 1000);

    return () => {
      unsubscribes.forEach(unsub => unsub());
      clearInterval(statusInterval);
    };
  }, [symbols.join(',')]);

  return { data, connectionStatus, isConnected: connectionStatus === 'connected' };
}