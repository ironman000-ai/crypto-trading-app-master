'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Activity } from 'lucide-react';
import { useRealTimePrice } from '@/lib/realtime-websocket';

interface ChartDataPoint {
  time: string;
  price: number;
  volume: number;
  timestamp: number;
  bid: number;
  ask: number;
}

interface RealtimeChartProps {
  symbol: string;
  title?: string;
  height?: number;
  maxDataPoints?: number;
  showVolume?: boolean;
}

export function RealtimeChart({ 
  symbol, 
  title, 
  height = 300, 
  maxDataPoints = 200,
  showVolume = false
}: RealtimeChartProps) {
  const { data, connectionStatus, isConnected } = useRealTimePrice(symbol);
  const [chartData, setChartData] = React.useState<ChartDataPoint[]>([]);
  const [priceStats, setPriceStats] = React.useState({
    min: 0,
    max: 0,
    avg: 0,
    volatility: 0
  });

  React.useEffect(() => {
    if (data) {
      const newPoint: ChartDataPoint = {
        time: new Date(data.timestamp).toLocaleTimeString('zh-CN', { 
          hour12: false,
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit'
        }),
        price: data.price,
        volume: data.volume,
        timestamp: data.timestamp,
        bid: data.bid,
        ask: data.ask
      };

      setChartData(prev => {
        const newData = [...prev, newPoint];
        // 保持最大数据点数量
        if (newData.length > maxDataPoints) {
          newData.shift();
        }
        
        // 计算统计数据
        if (newData.length > 1) {
          const prices = newData.map(d => d.price);
          const min = Math.min(...prices);
          const max = Math.max(...prices);
          const avg = prices.reduce((sum, p) => sum + p, 0) / prices.length;
          
          // 计算波动率
          const variance = prices.reduce((sum, p) => sum + Math.pow(p - avg, 2), 0) / prices.length;
          const volatility = Math.sqrt(variance) / avg * 100;
          
          setPriceStats({ min, max, avg, volatility });
        }
        
        return newData;
      });
    }
  }, [data, maxDataPoints]);

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${price.toFixed(2)}`;
    if (price >= 1) return `$${price.toFixed(4)}`;
    if (price >= 0.01) return `$${price.toFixed(6)}`;
    return `$${price.toFixed(8)}`;
  };

  const currentPrice = data?.price || 0;
  const priceChange = chartData.length > 1 ? currentPrice - chartData[0].price : 0;
  const priceChangePercent = chartData.length > 1 ? (priceChange / chartData[0].price) * 100 : 0;

  return (
    <Card className="glassmorphism">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span>{title || `${symbol} 币安实时价格`}</span>
            {isConnected ? (
              <div className="flex items-center space-x-1">
                <Wifi className="w-4 h-4 text-green-400 animate-pulse" />
                <Badge variant="default" className="bg-green-600">
                  <Activity className="w-3 h-3 mr-1" />
                  实时连接
                </Badge>
              </div>
            ) : (
              <div className="flex items-center space-x-1">
                <WifiOff className="w-4 h-4 text-red-400" />
                <Badge variant="destructive">
                  {connectionStatus}
                </Badge>
              </div>
            )}
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
            {showVolume ? (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="time" 
                  stroke="#9ca3af"
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  stroke="#9ca3af"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) => (value / 1000000).toFixed(1) + 'M'}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(30, 41, 59, 0.95)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px'
                  }}
                  labelFormatter={(label) => `时间: ${label}`}
                  formatter={(value: number) => [(value / 1000000).toFixed(2) + 'M', '成交量']}
                />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorVolume)"
                  strokeWidth={1}
                />
              </AreaChart>
            ) : (
              <LineChart data={chartData}>
                <XAxis 
                  dataKey="time" 
                  stroke="#9ca3af"
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  stroke="#9ca3af"
                  domain={['dataMin - 0.1', 'dataMax + 0.1']}
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
                  formatter={(value: number, name: string) => {
                    if (name === 'price') return [formatPrice(value), '价格'];
                    if (name === 'bid') return [formatPrice(value), '买价'];
                    if (name === 'ask') return [formatPrice(value), '卖价'];
                    return [value, name];
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="bid"
                  stroke="#10b981"
                  strokeWidth={1}
                  dot={false}
                  strokeDasharray="3 3"
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="ask"
                  stroke="#ef4444"
                  strokeWidth={1}
                  dot={false}
                  strokeDasharray="3 3"
                  isAnimationActive={false}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-slate-400">数据点</div>
            <div className="font-medium text-blue-400">{chartData.length}/{maxDataPoints}</div>
          </div>
          <div className="text-center">
            <div className="text-slate-400">波动率</div>
            <div className="font-medium text-yellow-400">{priceStats.volatility.toFixed(3)}%</div>
          </div>
          <div className="text-center">
            <div className="text-slate-400">最高</div>
            <div className="font-medium text-green-400">{formatPrice(priceStats.max)}</div>
          </div>
          <div className="text-center">
            <div className="text-slate-400">最低</div>
            <div className="font-medium text-red-400">{formatPrice(priceStats.min)}</div>
          </div>
        </div>

        {isConnected && (
          <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
            <span>🔗 币安WebSocket实时数据流</span>
            <span>📊 毫秒级更新频率</span>
            <span>⚡ {data ? `延迟: ${Date.now() - data.timestamp}ms` : '等待数据'}</span>
          </div>
        )}
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
          title={`${symbol} 币安实时走势`}
          height={250}
          maxDataPoints={100}
        />
      ))}
    </div>
  );
}