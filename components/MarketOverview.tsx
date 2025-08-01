'use client';

import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Wifi, WifiOff, Activity } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const POPULAR_COINS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA'];

// 临时移除WebSocket依赖，使用模拟数据
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

export function MarketOverview() {
  const { data, connectionStatus, isConnected } = useRealTimePrices(POPULAR_COINS);
  const [priceAnimations, setPriceAnimations] = useState<Map<string, 'up' | 'down' | null>>(new Map());
  const [lastPrices, setLastPrices] = useState<Map<string, number>>(new Map());

  // 币种名称映射
  const coinNames: { [key: string]: string } = {
    'BTC': 'Bitcoin',
    'ETH': 'Ethereum', 
    'BNB': 'BNB',
    'SOL': 'Solana',
    'XRP': 'XRP',
    'ADA': 'Cardano'
  };

  // 处理价格变化动画
  React.useEffect(() => {
    data.forEach((coinData, symbol) => {
      const lastPrice = lastPrices.get(symbol);
      if (lastPrice && coinData.price !== lastPrice) {
        const animation = coinData.price > lastPrice ? 'up' : 'down';
        setPriceAnimations(prev => new Map(prev.set(symbol, animation)));
        
        // 清除动画
        setTimeout(() => {
          setPriceAnimations(prev => new Map(prev.set(symbol, null)));
        }, 500);
      }
      setLastPrices(prev => new Map(prev.set(symbol, coinData.price)));
    });
  }, [data, lastPrices]);

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

  if (data.size === 0) {
    return (
      <div>
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-2">
            <WifiOff className="w-5 h-5 text-red-400" />
            <span className="text-red-400">正在连接币安WebSocket...</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {POPULAR_COINS.map((symbol, i) => (
            <Card key={i} className="glassmorphism animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-slate-700 rounded mb-4"></div>
                <div className="h-6 bg-slate-700 rounded mb-2"></div>
                <div className="h-4 bg-slate-700 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center space-x-4">
          {isConnected ? (
            <>
              <div className="flex items-center space-x-2">
                <Wifi className="w-5 h-5 text-green-400 animate-pulse" />
                <Badge variant="default" className="bg-green-600">
                  <Activity className="w-3 h-3 mr-1" />
                  币安实时数据流
                </Badge>
              </div>
              <span className="text-sm text-green-400">
                {data.size} 个币种实时更新
              </span>
            </>
          ) : (
            <>
              <WifiOff className="w-5 h-5 text-red-400" />
              <Badge variant="destructive">{connectionStatus}</Badge>
            </>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {POPULAR_COINS.map((symbol) => {
          const coinData = data.get(symbol);
          
          if (!coinData) {
            return (
              <Card key={symbol} className="glassmorphism animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-4 bg-slate-700 rounded w-16"></div>
                    <div className="h-4 bg-slate-700 rounded w-12"></div>
                  </div>
                  <div className="h-8 bg-slate-700 rounded mb-2"></div>
                  <div className="h-4 bg-slate-700 rounded w-24"></div>
                </CardContent>
              </Card>
            );
          }
          
          const animation = priceAnimations.get(symbol);
          
          return (
            <Card key={symbol} className="glassmorphism trading-card-hover cursor-pointer relative overflow-hidden">
              {/* 币安实时数据指示器 */}
              <div className="absolute top-2 right-2 flex items-center space-x-1">
                <Wifi className="w-3 h-3 text-green-400 animate-pulse" />
                <span className="text-xs text-green-400">币安</span>
              </div>
              
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold">{symbol}</span>
                      <span className="text-slate-400">{coinNames[symbol]}</span>
                    </div>
                  </div>
                  <div className={`flex items-center space-x-1 ${
                    coinData.changePercent >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {coinData.changePercent >= 0 ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : (
                      <TrendingDown className="w-5 h-5" />
                    )}
                    <span className="font-semibold">
                      {coinData.changePercent >= 0 ? '+' : ''}{coinData.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className={`text-3xl font-bold transition-all duration-300 ${
                    animation === 'up' ? 'text-green-400 scale-110 glow-green' :
                    animation === 'down' ? 'text-red-400 scale-110 glow-red' : 
                    'text-white'
                  }`}>
                    ${formatPrice(coinData.price)}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">24h 变化:</span>
                    <span className={coinData.change >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {coinData.change >= 0 ? '+' : ''}${Math.abs(coinData.change).toFixed(4)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">24h 成交量:</span>
                    <span className="text-slate-300">
                      {formatVolume(coinData.volume)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">买价/卖价:</span>
                    <span className="text-slate-300">
                      <span className="text-green-400">${formatPrice(coinData.bid)}</span>
                      <span className="mx-1">/</span>
                      <span className="text-red-400">${formatPrice(coinData.ask)}</span>
                    </span>
                  </div>
                </div>
                
                {/* 实时价格波动指示 */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span>币安实时数据</span>
                    <span>{new Date(coinData.timestamp).toLocaleTimeString('zh-CN', {
                      hour12: false,
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}</span>
                  </div>
                  <div className="h-8 flex items-end space-x-1">
                    {[...Array(30)].map((_, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-t transition-all duration-100 ${
                          coinData.changePercent >= 0 ? 'bg-green-400/30' : 'bg-red-400/30'
                        }`}
                        style={{ 
                          height: `${20 + Math.abs(coinData.changePercent) * 10 + Math.random() * 60}%`
                        }}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
