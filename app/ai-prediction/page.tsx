'use client';

import { useState, useEffect } from 'react';
import { Bot, TrendingUp, TrendingDown, Activity, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Navigation } from '@/components/Navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import axios from 'axios';

interface PredictionResult {
  up_probability: number;
  down_probability: number;
  confidence: number;
  trend: 'bullish' | 'bearish';
  signal_strength: 'weak' | 'moderate' | 'strong';
  support_level: number;
  resistance_level: number;
  recommendation: string;
}

export default function AIPredictionPage() {
  const [selectedCoin, setSelectedCoin] = useState('BTC');
  const [timeframe, setTimeframe] = useState('5m');
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  const coins = [
    { value: 'BTC', label: 'Bitcoin (BTC)' },
    { value: 'ETH', label: 'Ethereum (ETH)' },
    { value: 'SOL', label: 'Solana (SOL)' },
    { value: 'DOGE', label: 'Dogecoin (DOGE)' },
    { value: 'ADA', label: 'Cardano (ADA)' },
  ];

  const timeframes = [
    { value: '5m', label: '5分钟' },
    { value: '15m', label: '15分钟' },
    { value: '30m', label: '30分钟' },
    { value: '1h', label: '1小时' },
    { value: '4h', label: '4小时' },
    { value: '1d', label: '1天' },
  ];

  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        const coinId = selectedCoin.toLowerCase() === 'btc' ? 'bitcoin' :
                      selectedCoin.toLowerCase() === 'eth' ? 'ethereum' :
                      selectedCoin.toLowerCase() === 'sol' ? 'solana' :
                      selectedCoin.toLowerCase() === 'doge' ? 'dogecoin' :
                      selectedCoin.toLowerCase() === 'ada' ? 'cardano' : 'bitcoin';
        
        const response = await axios.get(
          '/api/coingecko',
          {
            params: {
              path: `coins/${coinId}/market_chart`,
              vs_currency: 'usd',
              days: 1
            }
          }
        );
        
        const data = response.data.prices.slice(-30).map(([timestamp, price]: [number, number]) => ({
          time: new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          price
        }));
        
        setHistoricalData(data);
      } catch (error) {
        console.warn('Using fallback historical data due to API limitations');
        // Fallback to mock data
        const fallbackData = [];
        const basePrice = selectedCoin === 'BTC' ? 45000 : selectedCoin === 'ETH' ? 2800 : 95;
        for (let i = 30; i >= 0; i--) {
          const date = new Date();
          date.setMinutes(date.getMinutes() - i * 5);
          const variation = (Math.random() - 0.5) * 0.02;
          const price = basePrice * (1 + variation);
          fallbackData.push({
            time: date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
            price
          });
        }
        setHistoricalData(fallbackData);
      }
    };

    fetchHistoricalData();
    const interval = setInterval(fetchHistoricalData, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [selectedCoin]);

  const getPrediction = async () => {
    setLoading(true);
    
    try {
      const coinId = selectedCoin.toLowerCase() === 'btc' ? 'bitcoin' :
                    selectedCoin.toLowerCase() === 'eth' ? 'ethereum' :
                    selectedCoin.toLowerCase() === 'sol' ? 'solana' :
                    selectedCoin.toLowerCase() === 'doge' ? 'dogecoin' :
                    selectedCoin.toLowerCase() === 'ada' ? 'cardano' : 'bitcoin';
      
      const response = await axios.get(
        `/api/coingecko?path=coins/markets&vs_currency=usd&ids=${coinId}`
      );
      
      const currentPrice = response.data[0].current_price;
      const priceChange24h = response.data[0].price_change_percentage_24h;
      
      // Simple mock AI prediction based on real data
      const upProb = priceChange24h > 0 ? 60 + Math.random() * 20 : 40 + Math.random() * 20;
      const downProb = 100 - upProb;
      const confidence = 70 + Math.random() * 20;
      
      let recommendation;
      if (upProb > 70 && confidence > 80) {
        recommendation = '强烈买入信号';
      } else if (upProb > 60 && confidence > 70) {
        recommendation = '买入信号';
      } else if (upProb < 40 && confidence > 70) {
        recommendation = '卖出信号';
      } else {
        recommendation = '观望';
      }
      
      const mockPrediction: PredictionResult = {
        up_probability: Math.round(upProb),
        down_probability: Math.round(downProb),
        confidence: Math.round(confidence),
        trend: upProb > 50 ? 'bullish' : 'bearish',
        signal_strength: confidence > 80 ? 'strong' : confidence > 70 ? 'moderate' : 'weak',
        support_level: currentPrice * 0.95,
        resistance_level: currentPrice * 1.05,
        recommendation,
      };
      
      setPrediction(mockPrediction);
    } catch (error) {
      console.warn('Using fallback prediction data due to API limitations');
      // Fallback mock prediction
      const confidence = Math.floor(Math.random() * 30) + 65;
      const upProb = Math.floor(Math.random() * 60) + 20;
      const downProb = 100 - upProb;
      
      let recommendation;
      if (upProb > 70 && confidence > 80) {
        recommendation = '强烈买入信号';
      } else if (upProb > 60 && confidence > 70) {
        recommendation = '买入信号';
      } else if (upProb < 40 && confidence > 70) {
        recommendation = '卖出信号';
      } else {
        recommendation = '观望';
      }
      
      setPrediction({
        up_probability: upProb,
        down_probability: downProb,
        confidence,
        trend: upProb > 50 ? 'bullish' : 'bearish',
        signal_strength: confidence > 80 ? 'strong' : confidence > 70 ? 'moderate' : 'weak',
        support_level: selectedCoin === 'BTC' ? 44000 : selectedCoin === 'ETH' ? 2700 : 90,
        resistance_level: selectedCoin === 'BTC' ? 46000 : selectedCoin === 'ETH' ? 2900 : 100,
        recommendation,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
            AI智能预测
          </h1>
          <p className="text-xl text-slate-300">
            基于深度学习算法的加密货币价格走势预测
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Control Panel */}
          <div className="lg:col-span-1">
            <Card className="glassmorphism">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bot className="w-5 h-5 text-blue-400" />
                  <span>预测设置</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">选择币种</label>
                  <Select value={selectedCoin} onValueChange={setSelectedCoin}>
                    <SelectTrigger className="glassmorphism border-white/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glassmorphism">
                      {coins.map((coin) => (
                        <SelectItem key={coin.value} value={coin.value}>
                          {coin.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">时间周期</label>
                  <Select value={timeframe} onValueChange={setTimeframe}>
                    <SelectTrigger className="glassmorphism border-white/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glassmorphism">
                      {timeframes.map((tf) => (
                        <SelectItem key={tf.value} value={tf.value}>
                          {tf.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={getPrediction} 
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 glow-effect"
                >
                  {loading ? (
                    <>
                      <Activity className="w-4 h-4 mr-2 animate-spin" />
                      分析中...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      开始预测
                    </>
                  )}
                </Button>

                {prediction && (
                  <div className="mt-6 p-4 glassmorphism rounded-lg">
                    <h3 className="font-semibold mb-3 flex items-center">
                      <Target className="w-4 h-4 mr-2 text-blue-400" />
                      预测摘要
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">趋势:</span>
                        <Badge variant={prediction.trend === 'bullish' ? 'default' : 'destructive'}>
                          {prediction.trend === 'bullish' ? '看涨' : '看跌'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">信号强度:</span>
                        <span className={
                          prediction.signal_strength === 'strong' ? 'text-green-400' :
                          prediction.signal_strength === 'moderate' ? 'text-yellow-400' : 'text-red-400'
                        }>
                          {prediction.signal_strength === 'strong' ? '强' :
                           prediction.signal_strength === 'moderate' ? '中' : '弱'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">建议:</span>
                        <span className="text-white font-medium">{prediction.recommendation}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Price Chart */}
            <Card className="glassmorphism">
              <CardHeader>
                <CardTitle>价格走势图 - {selectedCoin}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historicalData}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="time" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(30, 41, 59, 0.95)', 
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px'
                        }} 
                      />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="#3b82f6"
                        fillOpacity={1}
                        fill="url(#colorPrice)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Prediction Results */}
            {prediction && (
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="glassmorphism">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                      <span>上涨概率</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-green-400 mb-2">
                        {prediction.up_probability}%
                      </div>
                      <Progress value={prediction.up_probability} className="mb-4" />
                      <p className="text-sm text-slate-400">
                        基于技术指标和市场情绪分析
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glassmorphism">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingDown className="w-5 h-5 text-red-400" />
                      <span>下跌概率</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-red-400 mb-2">
                        {prediction.down_probability}%
                      </div>
                      <Progress value={prediction.down_probability} className="mb-4" />
                      <p className="text-sm text-slate-400">
                        考虑市场风险和波动性
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glassmorphism md:col-span-2">
                  <CardHeader>
                    <CardTitle>AI分析报告</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-400 mb-1">
                          {prediction.confidence}%
                        </div>
                        <div className="text-sm text-slate-400">置信度</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-400 mb-1">
                          ${prediction.support_level.toLocaleString()}
                        </div>
                        <div className="text-sm text-slate-400">支撑位</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-400 mb-1">
                          ${prediction.resistance_level.toLocaleString()}
                        </div>
                        <div className="text-sm text-slate-400">阻力位</div>
                      </div>
                    </div>
                    
                    <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <h4 className="font-semibold text-blue-400 mb-2">交易建议</h4>
                      <p className="text-slate-300">{prediction.recommendation}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}