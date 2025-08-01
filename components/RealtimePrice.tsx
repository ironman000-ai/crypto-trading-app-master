'use client';

import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Activity, Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// 临时移除WebSocket依赖，使用模拟数据
function useRealTimePrice(symbol: string) {
  const [data, setData] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connected');
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // 模拟实时价格数据
    const basePrices: { [key: string]: number } = {
      'BTC': 43250, 'ETH': 2678, 'BNB': 312, 'SOL': 67, 'XRP': 0.62,
      'ADA': 0.35, 'AVAX': 28, 'DOGE': 0.08, 'TRX': 0.11, 'DOT': 6.5,
      'MATIC': 0.85, 'LTC': 75, 'SHIB': 0.000012, 'UNI': 8.5, 'ATOM': 12,
      'LINK': 15, 'APT': 9.5, 'ICP': 5.2, 'FIL': 4.8
    };
    
    const basePrice = basePrices[symbol] || 100;
    let currentPrice = basePrice;
    
    const interval = setInterval(() => {
      const variation = (Math.random() - 0.5) * currentPrice * 0.001;
      currentPrice += variation;
      const change24h = currentPrice - basePrice;
      const changePercent = (change24h / basePrice) * 100;
      
      setData({
        symbol,
        price: currentPrice,
        change: change24h,
        changePercent,
        volume: Math.random() * 1000000000 + 500000000,
        timestamp: Date.now(),
        high24h: basePrice * 1.05,
        low24h: basePrice * 0.95,
        bid: currentPrice * 0.999,
        ask: currentPrice * 1.001
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [symbol]);

  return { data, connectionStatus, isConnected };
}

function useRealTimePrices(symbols: string[]) {
  const [data, setData] = useState<Map<string, any>>(new Map());
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connected');
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const basePrices: { [key: string]: number } = {
      'BTC': 43250, 'ETH': 2678, 'BNB': 312, 'SOL': 67, 'XRP': 0.62,
      'ADA': 0.35, 'AVAX': 28, 'DOGE': 0.08, 'TRX': 0.11, 'DOT': 6.5,
      'MATIC': 0.85, 'LTC': 75, 'SHIB': 0.000012, 'UNI': 8.5, 'ATOM': 12,
      'LINK': 15, 'APT': 9.5, 'ICP': 5.2, 'FIL': 4.8
    };
    
    const intervals = symbols.map(symbol => {
      const basePrice = basePrices[symbol] || 100;
      let currentPrice = basePrice;
      
      return setInterval(() => {
        const variation = (Math.random() - 0.5) * currentPrice * 0.001;
        currentPrice += variation;
        const change24h = currentPrice - basePrice;
        const changePercent = (change24h / basePrice) * 100;
        
        const newData = {
          symbol,
          price: currentPrice,
          change: change24h,
          changePercent,
          volume: Math.random() * 1000000000 + 500000000,
          timestamp: Date.now(),
          high24h: basePrice * 1.05,
          low24h: basePrice * 0.95,
          bid: currentPrice * 0.999,
          ask: currentPrice * 1.001
        };
        
        setData(prev => new Map(prev.set(symbol, newData)));
      }, 1000);
    });
    
    return () => intervals.forEach(clearInterval);
  }, [symbols.join(',')]);

  return { data, connectionStatus, isConnected };
}

interface RealtimePriceProps {
  symbol: string;
  showVolume?: boolean;
  showBidAsk?: boolean;
  className?: string;
}

export function RealtimePrice({ 
  symbol, 
  showVolume = false,
  showBidAsk = false,
  className = "" 
}: RealtimePriceProps) {
  const { data, connectionStatus, isConnected } = useRealTimePrice(symbol);
  const [priceAnimation, setPriceAnimation] = React.useState<'up' | 'down' | null>(null);
  const [lastPrice, setLastPrice] = React.useState<number>(0);

  React.useEffect(() => {
    if (data && data.price !== lastPrice && lastPrice > 0) {
      setPriceAnimation(data.price > lastPrice ? 'up' : 'down');
      setLastPrice(data.price);
      
      // 清除动画
      const timer = setTimeout(() => setPriceAnimation(null), 500);
      return () => clearTimeout(timer);
    } else if (data && lastPrice === 0) {
      setLastPrice(data.price);
    }
  }, [data?.price, lastPrice]);

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toFixed(2);
    if (price >= 1) return price.toFixed(4);
    if (price >= 0.01) return price.toFixed(6);
    return price.toFixed(8);
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(1)}B`;
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(1)}M`;
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(1)}K`;
    return volume.toFixed(0);
  };

  if (!data) {
    return (
      <div className={`flex items-center justify-between p-3 glassmorphism rounded-lg ${className}`}>
        <div className="flex items-center space-x-3">
          <span className="font-bold text-lg">{symbol}</span>
          <div className="flex items-center space-x-1">
            <WifiOff className="w-3 h-3 text-red-400" />
            <span className="text-xs text-red-400">连接中...</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-slate-400 animate-pulse">---.--</div>
          <div className="text-sm text-slate-400">等待数据</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between p-3 glassmorphism rounded-lg ${className}`}>
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-lg">{symbol}</span>
          <div className="flex items-center space-x-1">
            {isConnected ? (
              <>
                <Wifi className="w-3 h-3 text-green-400 animate-pulse" />
                <span className="text-xs text-green-400">实时</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-red-400" />
                <span className="text-xs text-red-400">{connectionStatus}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="text-right">
        <div className={`text-xl font-bold transition-all duration-300 ${
          priceAnimation === 'up' ? 'text-green-400 scale-110 glow-green' :
          priceAnimation === 'down' ? 'text-red-400 scale-110 glow-red' :
          'text-white'
        }`}>
          ${formatPrice(data.price)}
        </div>
        
        <div className="flex items-center justify-end space-x-2 mt-1">
          <div className={`flex items-center space-x-1 text-sm ${
            data.changePercent >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {data.changePercent >= 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{data.changePercent >= 0 ? '+' : ''}{data.changePercent.toFixed(2)}%</span>
          </div>
          
          {showVolume && (
            <Badge variant="outline" className="text-xs">
              {formatVolume(data.volume)}
            </Badge>
          )}
        </div>

        {showBidAsk && (
          <div className="flex items-center justify-end space-x-2 mt-1 text-xs">
            <span className="text-green-400">买: ${formatPrice(data.bid)}</span>
            <span className="text-red-400">卖: ${formatPrice(data.ask)}</span>
          </div>
        )}

        <div className="text-xs text-slate-400 mt-1">
          {new Date(data.timestamp).toLocaleTimeString('zh-CN', { 
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            fractionalSecondDigits: 3
          })}
        </div>
      </div>
    </div>
  );
}

// 实时价格列表组件
export function RealtimePriceList({ symbols }: { symbols: string[] }) {
  const { data, connectionStatus, isConnected } = useRealTimePrices(symbols);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">币安实时价格流</h3>
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <>
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm text-green-400">币安WebSocket已连接</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-sm text-red-400">{connectionStatus}</span>
            </>
          )}
        </div>
      </div>
      
      {symbols.map(symbol => {
        const symbolData = data.get(symbol);
        if (!symbolData) return (
          <div key={symbol} className="p-3 glassmorphism rounded-lg animate-pulse">
            <div className="flex justify-between items-center">
              <div className="h-4 bg-slate-700 rounded w-16"></div>
              <div className="h-6 bg-slate-700 rounded w-24"></div>
            </div>
          </div>
        );
        
        return (
          <RealtimePrice
            key={symbol}
            symbol={symbol}
            showVolume={true}
            showBidAsk={true}
          />
        );
      })}
    </div>
  );
}