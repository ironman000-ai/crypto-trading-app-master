'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ChartDataPoint {
  time: string;
  price: number;
  timestamp: number;
}

interface RealtimeChartProps {
  symbol: string;
  title?: string;
  height?: number;
  maxDataPoints?: number;
}

export function RealtimeChart({ 
  symbol, 
  title, 
  height = 300, 
  maxDataPoints = 100 
}: RealtimeChartProps) {
  const [data, setData] = React.useState<ChartDataPoint[]>([]);
  const [isConnected, setIsConnected] = React.useState(false);
  const [currentPrice, setCurrentPrice] = React.useState<number>(0);

  React.useEffect(() => {
    setIsConnected(true);
    
    // 基础价格
    const basePrice = symbol === 'BTC' ? 43250 : symbol === 'ETH' ? 2678 : 100;
    let currentPriceValue = basePrice;
    
    // 初始化数据
    const initialData: ChartDataPoint[] = [];
    for (let i = maxDataPoints; i > 0; i--) {
      const timestamp = Date.now() - (i * 100);
      const variation = (Math.random() - 0.5) * basePrice * 0.001;
      currentPriceValue += variation;
      
      initialData.push({
        time: new Date(timestamp).toLocaleTimeString('zh-CN', { 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        }),
        price: currentPriceValue,
        timestamp
      });
    }
    setData(initialData);
    setCurrentPrice(currentPriceValue);

    // 实时更新数据 (每100毫秒)
    const interval = setInterval(() => {
      const now = Date.now();
      const variation = (Math.random() - 0.5) * currentPriceValue * 0.001;
      currentPriceValue += variation;
      
      const newPoint: ChartDataPoint = {
        time: new Date(now).toLocaleTimeString('zh-CN', { 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        }),
        price: currentPriceValue,
        timestamp: now
      };

      setData(prev => {
        const newData = [...prev, newPoint];
        // 保持最大数据点数量
        if (newData.length > maxDataPoints) {
          newData.shift();
        }
        return newData;
      });
      
      setCurrentPrice(currentPriceValue);
    }, 100);

    return () => {
      clearInterval(interval);
      setIsConnected(false);
    };
  }, [symbol, maxDataPoints]);

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${price.toFixed(0)}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    if (price >= 0.01) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(8)}`;
  };

  const priceChange = data.length > 1 ? data[data.length - 1].price - data[0].price : 0;
  const priceChangePercent = data.length > 1 ? (priceChange / data[0].price) * 100 : 0;

  return (
    <Card className="glassmorphism">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span>{title || `${symbol} 实时价格`}</span>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{formatPrice(currentPrice)}</div>
            <Badge variant={priceChangePercent >= 0 ? 'default' : 'destructive'}>
              {priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis 
                dataKey="time" 
                stroke="#9ca3af"
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke="#9ca3af"
                domain={['dataMin - 10', 'dataMax + 10']}
                tick={{ fontSize: 10 }}
                tickFormatter={formatPrice}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(30, 41, 59, 0.95)', 
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px'
                }}
                labelFormatter={(label) => `时间: ${label}`}
                formatter={(value: number) => [formatPrice(value), '价格']}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
          <span>更新频率: 100ms</span>
          <span>数据点: {data.length}/{maxDataPoints}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// 多币种实时图表
export function MultiRealtimeChart({ symbols }: { symbols: string[] }) {
  return (
    <div className="grid gap-6">
      {symbols.map(symbol => (
        <RealtimeChart
          key={symbol}
          symbol={symbol}
          title={`${symbol} 实时走势`}
          height={250}
          maxDataPoints={50}
        />
      ))}
    </div>
  );
}