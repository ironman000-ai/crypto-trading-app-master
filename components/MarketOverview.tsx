'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { TrendingUp, TrendingDown, Wifi, WifiOff, Activity } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { optimizedCryptoAPI, useOptimizedCryptoPrices, CryptoPrice } from '@/lib/crypto-api';

const POPULAR_COINS = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA'];

export function MarketOverview() {
  const { data, loading, error } = useOptimizedCryptoPrices(POPULAR_COINS);
  const [priceAnimations, setPriceAnimations] = useState<Map<string, 'up' | 'down' | null>>(new Map());
  const [lastPrices, setLastPrices] = useState<Map<string, number>>(new Map());
  const [marketOverview, setMarketOverview] = useState<any>(null);

  // 币种名称映射
  const coinNames: { [key: string]: string } = {
    'BTC': 'Bitcoin',
    'ETH': 'Ethereum', 
    'BNB': 'BNB',
    'SOL': 'Solana',
    'XRP': 'XRP',
    'ADA': 'Cardano'
  };

  // 获取市场概览数据
  useEffect(() => {
    const fetchMarketOverview = async () => {
      const overview = await optimizedCryptoAPI.getMarketOverview();
      setMarketOverview(overview);
    };

    fetchMarketOverview();
    const interval = setInterval(fetchMarketOverview, 60000); // 每分钟更新
    return () => clearInterval(interval);
  }, []);

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

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-400 animate-spin" />
            <span className="text-blue-400">正在获取实时数据...</span>
          </div>
        </div>
        {marketOverview && (
          <div className="mb-6 p-4 glassmorphism rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-blue-400">${(marketOverview.totalMarketCap / 1e12).toFixed(2)}T</div>
                <div className="text-sm text-slate-400">总市值</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-400">${(marketOverview.totalVolume24h / 1e9).toFixed(1)}B</div>
                <div className="text-sm text-slate-400">24h成交量</div>
              </div>
              <div>
                <div className="text-lg font-bold text-yellow-400">{marketOverview.btcDominance.toFixed(1)}%</div>
                <div className="text-sm text-slate-400">BTC占比</div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-400">{marketOverview.activeCoins.toLocaleString()}</div>
                <div className="text-sm text-slate-400">活跃币种</div>
              </div>
            </div>
          </div>
        )}
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

  if (error) {
    return (
      <div className="text-center py-8">
        <WifiOff className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-red-400 mb-2">数据获取失败</h3>
        <p className="text-slate-400 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          重新加载
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Wifi className="w-5 h-5 text-green-400 animate-pulse" />
            <Badge variant="default" className="bg-green-600">
              <Activity className="w-3 h-3 mr-1" />
              优化版API - CoinGecko + Binance
            </Badge>
          </div>
          <span className="text-sm text-green-400">
            {data.size} 个币种实时更新 (智能缓存 + 10秒刷新)
          </span>
        </div>
      </div>
      
      {/* 市场概览 */}
      {marketOverview && (
        <div className="mb-8 p-6 glassmorphism rounded-lg">
          <h3 className="text-xl font-semibold mb-4 text-center">全球加密货币市场概览</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-400 mb-1">${(marketOverview.totalMarketCap / 1e12).toFixed(2)}T</div>
              <div className="text-sm text-slate-400">总市值</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400 mb-1">${(marketOverview.totalVolume24h / 1e9).toFixed(1)}B</div>
              <div className="text-sm text-slate-400">24h成交量</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-400 mb-1">{marketOverview.btcDominance.toFixed(1)}%</div>
              <div className="text-sm text-slate-400">BTC市场占比</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400 mb-1">{marketOverview.activeCoins.toLocaleString()}</div>
              <div className="text-sm text-slate-400">活跃币种数量</div>
            </div>
          </div>
        </div>
      )}
      
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
              {/* 实时数据指示器 */}
              <div className="absolute top-2 right-2 flex items-center space-x-1">
                <Wifi className="w-3 h-3 text-green-400 animate-pulse" />
                <span className="text-xs text-green-400">实时</span>
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
                    coinData.changePercent24h >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {coinData.changePercent24h >= 0 ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : (
                      <TrendingDown className="w-5 h-5" />
                    )}
                    <span className="font-semibold">
                      {coinData.changePercent24h >= 0 ? '+' : ''}{coinData.changePercent24h.toFixed(2)}%
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
                    <span className={coinData.change24h >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {coinData.change24h >= 0 ? '+' : ''}${Math.abs(coinData.change24h).toFixed(4)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">24h 成交量:</span>
                    <span className="text-slate-300">
                      {formatVolume(coinData.volume24h)}
                    </span>
                  </div>
                  
                  {coinData.marketCap > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">市值:</span>
                      <span className="text-slate-300">
                        {formatVolume(coinData.marketCap)}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">24h 高/低:</span>
                    <span className="text-slate-300">
                      <span className="text-green-400">${formatPrice(coinData.high24h)}</span>
                      <span className="mx-1">/</span>
                      <span className="text-red-400">${formatPrice(coinData.low24h)}</span>
                    </span>
                  </div>
                </div>
                
                {/* 数据来源和更新时间 */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span>优化版API (Binance优先)</span>
                    <span>{new Date(coinData.timestamp).toLocaleTimeString('zh-CN', {
                      hour12: false,
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}</span>
                  </div>
                  <div className="text-xs text-center text-slate-500">
                    智能缓存 + 10秒高频更新
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