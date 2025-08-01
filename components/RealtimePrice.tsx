'use client';

import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Activity, Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useOptimizedCryptoPrice, useOptimizedCryptoPrices } from '@/lib/crypto-api';

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
  const { data, loading, error, dataSource } = useOptimizedCryptoPrice(symbol);
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

  if (loading) {
    return (
      <div className={`flex items-center justify-between p-3 glassmorphism rounded-lg ${className}`}>
        <div className="flex items-center space-x-3">
          <span className="font-bold text-lg">{symbol}</span>
          <Activity className="w-3 h-3 text-blue-400 animate-spin" />
          <span className="text-xs text-blue-400">加载中...</span>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-slate-400 animate-pulse">---.--</div>
          <div className="text-sm text-slate-400">获取数据中</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`flex items-center justify-between p-3 glassmorphism rounded-lg ${className}`}>
        <div className="flex items-center space-x-3">
          <span className="font-bold text-lg">{symbol}</span>
          <WifiOff className="w-3 h-3 text-red-400" />
          <span className="text-xs text-red-400">数据错误</span>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-red-400">错误</div>
          <div className="text-sm text-slate-400">{error || '获取失败'}</div>
        </div>
      </div>
    );
  }

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
            <Wifi className="w-3 h-3 text-green-400 animate-pulse" />
            <span className="text-xs text-green-400">
              {dataSource === 'hybrid' ? '智能' : dataSource === 'binance' ? 'Binance' : 'CoinGecko'}
            </span>
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
            data.changePercent24h >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {data.changePercent24h >= 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{data.changePercent24h >= 0 ? '+' : ''}{data.changePercent24h.toFixed(2)}%</span>
          </div>
          
          {showVolume && (
            <Badge variant="outline" className="text-xs">
              {formatVolume(data.volume24h)}
            </Badge>
          )}
        </div>

        {showBidAsk && data.high24h && data.low24h && (
          <div className="flex items-center justify-end space-x-2 mt-1 text-xs">
            <span className="text-green-400">高: ${formatPrice(data.high24h)}</span>
            <span className="text-red-400">低: ${formatPrice(data.low24h)}</span>
          </div>
        )}

        <div className="text-xs text-slate-400 mt-1">
          {new Date(data.timestamp).toLocaleTimeString('zh-CN', { 
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })}
        </div>
      </div>
    </div>
  );
}

// 实时价格列表组件
export function RealtimePriceList({ symbols }: { symbols: string[] }) {
  const { data, loading, error } = useOptimizedCryptoPrices(symbols);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">币安实时价格流</h3>
        <div className="flex items-center space-x-2">
          {!loading && !error ? (
            <>
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm text-green-400">优化版API已连接 (智能数据源)</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-sm text-blue-400">{loading ? '加载中' : '数据错误'}</span>
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