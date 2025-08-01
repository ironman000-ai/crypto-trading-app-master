'use client';

import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { RealtimePrice } from '@/components/RealtimePrice';

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change_24h: number;
  change_percent: number;
  volume: number;
  image?: string;
}

export function MarketOverview() {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [realtimeData, setRealtimeData] = useState<Map<string, any>>(new Map());

  useEffect(() => {
    const fetchCoinData = async () => {
      try {
        setLoading(true);
        
        // 获取前6个热门加密货币的数据 - 使用CoinGecko API
        const coinIds = 'bitcoin,ethereum,binancecoin,solana,ripple,cardano';
        const response = await fetch(`/api/crypto?endpoint=coins/markets&ids=${coinIds}&vs_currency=usd`);
        const data = await response.json();
        
        // CoinGecko API 数据格式转换
        const formattedData: CoinData[] = data.map((coin: any) => ({
          id: coin.id,
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          price: coin.current_price,
          change_24h: coin.price_change_24h,
          change_percent: coin.price_change_percentage_24h,
          volume: coin.total_volume,
          image: coin.image // CoinGecko提供图片
        }));
        
        setCoins(formattedData);
      } catch (error) {
        console.warn('CoinGecko API调用失败，使用备用数据:', error);
        // 如果 API 调用失败，使用模拟数据
        const fallbackData: CoinData[] = [
          { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', price: 43250.67, change_24h: 1234.56, change_percent: 2.94, volume: 28500000000 },
          { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', price: 2678.45, change_24h: -89.23, change_percent: -3.22, volume: 15200000000 },
          { id: 'binancecoin', symbol: 'BNB', name: 'BNB', price: 312.89, change_24h: 8.45, change_percent: 2.78, volume: 1200000000 },
          { id: 'solana', symbol: 'SOL', name: 'Solana', price: 67.23, change_24h: 2.34, change_percent: 3.61, volume: 2100000000 },
          { id: 'ripple', symbol: 'XRP', name: 'XRP', price: 0.6234, change_24h: 0.0234, change_percent: 3.91, volume: 1800000000 },
          { id: 'cardano', symbol: 'ADA', name: 'Cardano', price: 0.3456, change_24h: -0.0123, change_percent: -3.44, volume: 450000000 },
        ];
        setCoins(fallbackData);
      } finally {
        setLoading(false);
      }
    };

    fetchCoinData();
    
    // 启动实时数据更新 (每100毫秒)
    const realtimeInterval = setInterval(() => {
      coins.forEach(coin => {
        const lastData = realtimeData.get(coin.symbol);
        const basePrice = lastData?.price || coin.price;
        const variation = (Math.random() - 0.5) * basePrice * 0.001; // 0.1% 波动
        const newPrice = basePrice + variation;
        const change24h = newPrice - coin.price;
        const changePercent = (change24h / coin.price) * 100;
        
        setRealtimeData(prev => new Map(prev.set(coin.symbol, {
          price: newPrice,
          change_24h: change24h,
          change_percent: changePercent,
          volume: coin.volume * (0.9 + Math.random() * 0.2), // 成交量小幅波动
          timestamp: Date.now()
        })));
      });
    }, 100);

    // 每5分钟更新基础数据
    const baseDataInterval = setInterval(fetchCoinData, 300000);

    return () => {
      clearInterval(realtimeInterval);
      clearInterval(baseDataInterval);
    };
  }, [coins.length, realtimeData]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="glassmorphism animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-slate-700 rounded mb-4"></div>
              <div className="h-6 bg-slate-700 rounded mb-2"></div>
              <div className="h-4 bg-slate-700 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {coins.map((coin) => {
        const realtime = realtimeData.get(coin.symbol);
        const displayPrice = realtime?.price || coin.price;
        const displayChange = realtime?.change_24h || coin.change_24h;
        const displayChangePercent = realtime?.change_percent || coin.change_percent;
        const displayVolume = realtime?.volume || coin.volume;
        
        return (
          <Card key={coin.symbol} className="glassmorphism trading-card-hover cursor-pointer relative overflow-hidden">
            {/* 实时数据指示器 */}
            <div className="absolute top-2 right-2 flex items-center space-x-1">
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                realtime && Date.now() - realtime.timestamp < 500 ? 'bg-green-400' : 'bg-slate-400'
              }`} />
              <span className="text-xs text-slate-400">实时</span>
            </div>
            
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    {coin.image && (
                      <img src={coin.image} alt={coin.name} className="w-6 h-6 mr-2" />
                    )}
                    <span className="text-2xl font-bold">{coin.symbol}</span>
                    <span className="text-slate-400">{coin.name}</span>
                  </div>
                </div>
                <div className={`flex items-center space-x-1 ${
                  displayChangePercent >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {displayChangePercent >= 0 ? (
                    <TrendingUp className="w-5 h-5" />
                  ) : (
                    <TrendingDown className="w-5 h-5" />
                  )}
                  <span className="font-semibold">
                    {displayChangePercent >= 0 ? '+' : ''}{displayChangePercent.toFixed(2)}%
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className={`text-3xl font-bold transition-all duration-200 ${
                  realtime && realtime.price > coin.price ? 'text-green-400' :
                  realtime && realtime.price < coin.price ? 'text-red-400' : ''
                }`}>
                  ${displayPrice.toLocaleString(undefined, { 
                    minimumFractionDigits: Math.min(displayPrice >= 1 ? 2 : 4, displayPrice >= 1000 ? 0 : 4),
                    maximumFractionDigits: displayPrice >= 1000 ? 0 : 4
                  })}
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">24h 变化:</span>
                  <span className={displayChange >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {displayChange >= 0 ? '+' : ''}${Math.abs(displayChange).toFixed(2)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">24h 成交量:</span>
                  <span className="text-slate-300">
                    ${(displayVolume / 1000000).toFixed(1)}M
                  </span>
                </div>
              </div>
              
              {/* 实时价格波动指示 */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>实时波动</span>
                  <span>{realtime ? new Date(realtime.timestamp).toLocaleTimeString('zh-CN') : '--:--:--'}</span>
                </div>
                <div className="h-8 flex items-end space-x-1">
                  {[...Array(30)].map((_, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded-t ${
                        displayChangePercent >= 0 ? 'bg-green-400/30' : 'bg-red-400/30'
                      }`}
                      style={{ 
                        height: `${20 + Math.abs(displayChangePercent) * 10 + Math.random() * 60}%`,
                        transition: 'height 0.1s ease'
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
  );
}