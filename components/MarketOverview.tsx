'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import axios from 'axios';

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

  useEffect(() => {
    // 从 AllTick API 获取真实市场数据
    const fetchCoinData = async () => {
      try {
        setLoading(true);
        
        // 获取前6个热门加密货币的数据 - 使用AllTick API
        const coinIds = 'bitcoin,ethereum,binancecoin,solana,ripple,cardano';
        const response = await axios.get(`/api/alltick?endpoint=realtime&symbols=${coinIds}`);
        
        // AllTick API 数据已经是正确格式
        const formattedData: CoinData[] = response.data.map((coin: any) => ({
          id: coin.id,
          symbol: coin.symbol.toUpperCase(),
          name: coin.name,
          price: coin.current_price,
          change_24h: coin.price_change_24h,
          change_percent: coin.price_change_percentage_24h,
          volume: coin.total_volume,
          image: undefined // AllTick不提供图片
        }));
        
        setCoins(formattedData);
      } catch (error) {
        console.warn('AllTick API调用失败，使用备用数据:', error);
        // 如果 API 调用失败，使用模拟数据
        const fallbackData: CoinData[] = [
          { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', price: 97234.56, change_24h: 1856.78, change_percent: 1.95, volume: 28500000000 },
          { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', price: 3456.89, change_24h: -89.45, change_percent: -2.52, volume: 15200000000 },
          { id: 'binancecoin', symbol: 'BNB', name: 'BNB', price: 678.23, change_24h: 12.34, change_percent: 1.85, volume: 2100000000 },
          { id: 'solana', symbol: 'SOL', name: 'Solana', price: 234.67, change_24h: 8.92, change_percent: 3.95, volume: 4200000000 },
          { id: 'ripple', symbol: 'XRP', name: 'XRP', price: 2.34, change_24h: 0.12, change_percent: 5.41, volume: 8900000000 },
          { id: 'cardano', symbol: 'ADA', name: 'Cardano', price: 1.23, change_24h: -0.05, change_percent: -3.89, volume: 1800000000 },
        ];
        setCoins(fallbackData);
      } finally {
        setLoading(false);
      }
    };

    fetchCoinData();
    // 每30秒更新一次数据 - AllTick API支持更高频率
    const interval = setInterval(fetchCoinData, 30000);

    return () => clearInterval(interval);
  }, []);

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
      {coins.map((coin) => (
        <Card key={coin.symbol} className="glassmorphism trading-card-hover cursor-pointer">
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
                coin.change_percent >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {coin.change_percent >= 0 ? (
                  <TrendingUp className="w-5 h-5" />
                ) : (
                  <TrendingDown className="w-5 h-5" />
                )}
                <span className="font-semibold">
                  {coin.change_percent >= 0 ? '+' : ''}{coin.change_percent.toFixed(2)}%
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-3xl font-bold">
                ${coin.price.toLocaleString(undefined, { 
                  minimumFractionDigits: Math.min(coin.price >= 1 ? 2 : 4, coin.price >= 1000 ? 0 : 4),
                  maximumFractionDigits: coin.price >= 1000 ? 0 : 4
                })}
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">24h 变化:</span>
                <span className={coin.change_24h >= 0 ? 'text-green-400' : 'text-red-400'}>
                  {coin.change_24h >= 0 ? '+' : ''}${Math.abs(coin.change_24h).toFixed(2)}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">24h 成交量:</span>
                <span className="text-slate-300">
                  ${(coin.volume / 1000000).toFixed(1)}M
                </span>
              </div>
            </div>
            
            {/* Price sparkline simulation */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="h-8 flex items-end space-x-1">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-t ${
                      Math.random() > 0.5 ? 'bg-green-400/30' : 'bg-red-400/30'
                    }`}
                    style={{ height: `${Math.random() * 100}%` }}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}