'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RealtimePriceProps {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume?: number;
  timestamp: number;
  showVolume?: boolean;
  className?: string;
}

export function RealtimePrice({ 
  symbol, 
  price, 
  change, 
  changePercent, 
  volume, 
  timestamp,
  showVolume = false,
  className = "" 
}: RealtimePriceProps) {
  const [priceAnimation, setPriceAnimation] = React.useState<'up' | 'down' | null>(null);
  const [lastPrice, setLastPrice] = React.useState(price);

  React.useEffect(() => {
    if (price !== lastPrice) {
      setPriceAnimation(price > lastPrice ? 'up' : 'down');
      setLastPrice(price);
      
      // 清除动画
      const timer = setTimeout(() => setPriceAnimation(null), 300);
      return () => clearTimeout(timer);
    }
  }, [price, lastPrice]);

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toFixed(0);
    if (price >= 1) return price.toFixed(2);
    if (price >= 0.01) return price.toFixed(4);
    return price.toFixed(8);
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(1)}B`;
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(1)}M`;
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(1)}K`;
    return volume.toFixed(0);
  };

  return (
    <div className={`flex items-center justify-between p-3 glassmorphism rounded-lg ${className}`}>
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-lg">{symbol}</span>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              Date.now() - timestamp < 500 ? 'bg-green-400' : 'bg-slate-400'
            }`} />
            <span className="text-xs text-slate-400">实时</span>
          </div>
        </div>
      </div>

      <div className="text-right">
        <div className={`text-xl font-bold transition-all duration-300 ${
          priceAnimation === 'up' ? 'text-green-400 scale-105' :
          priceAnimation === 'down' ? 'text-red-400 scale-105' :
          'text-white'
        }`}>
          ${formatPrice(price)}
        </div>
        
        <div className="flex items-center justify-end space-x-2 mt-1">
          <div className={`flex items-center space-x-1 text-sm ${
            changePercent >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {changePercent >= 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%</span>
          </div>
          
          {showVolume && volume && (
            <Badge variant="outline" className="text-xs">
              {formatVolume(volume)}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

// 实时价格列表组件
export function RealtimePriceList({ symbols }: { symbols: string[] }) {
  const [prices, setPrices] = React.useState<Map<string, any>>(new Map());
  const [isConnected, setIsConnected] = React.useState(false);

  React.useEffect(() => {
    // 这里会连接到实时数据管理器
    setIsConnected(true);
    
    // 模拟实时数据更新
    const interval = setInterval(() => {
      symbols.forEach(symbol => {
        const basePrice = symbol === 'BTC' ? 43250 : symbol === 'ETH' ? 2678 : 100;
        const lastPrice = prices.get(symbol)?.price || basePrice;
        const change = (Math.random() - 0.5) * lastPrice * 0.001;
        const newPrice = lastPrice + change;
        
        setPrices(prev => new Map(prev.set(symbol, {
          price: newPrice,
          change: newPrice - basePrice,
          changePercent: ((newPrice - basePrice) / basePrice) * 100,
          volume: Math.random() * 1000000000,
          timestamp: Date.now()
        })));
      });
    }, 100);

    return () => {
      clearInterval(interval);
      setIsConnected(false);
    };
  }, [symbols.join(',')]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">实时价格</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          <span className="text-sm text-slate-400">
            {isConnected ? '已连接' : '连接中...'}
          </span>
        </div>
      </div>
      
      {symbols.map(symbol => {
        const data = prices.get(symbol);
        if (!data) return (
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
            price={data.price}
            change={data.change}
            changePercent={data.changePercent}
            volume={data.volume}
            timestamp={data.timestamp}
            showVolume={true}
          />
        );
      })}
    </div>
  );
}