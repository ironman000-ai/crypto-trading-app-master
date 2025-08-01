'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Bot, Play, Pause, Settings, TrendingUp, TrendingDown, Activity, DollarSign, Target, AlertTriangle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navigation } from '@/components/Navigation';
import { RealtimeChart } from '@/components/RealtimeChart';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface TradingConfig {
  symbol: string;
  strategy: string;
  riskLevel: number;
  maxPositionSize: number;
  stopLoss: number;
  takeProfit: number;
  enabled: boolean;
}

interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  amount: number;
  price?: number;
  type: 'market' | 'limit';
  status: 'pending' | 'filled' | 'cancelled' | 'rejected';
  timestamp: string;
}

interface Account {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  profit: number;
  orders: Order[];
}

interface MarketAnalysis {
  price: number;
  priceChange24h: number;
  volume24h: number;
  volatility: number;
  rsi: number;
  macd: number;
  bollinger: {
    upper: number;
    middle: number;
    lower: number;
  };
  support: number;
  resistance: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  signal: 'buy' | 'sell' | 'hold';
  confidence: number;
}

export default function AutoTradePage() {
  const { user } = useAuth();
  const [botRunning, setBotRunning] = useState(false);
  const [tradingMode, setTradingMode] = useState<'simulation' | 'live'>('simulation');
  const [tradingLogs, setTradingLogs] = useState<string[]>([]);
  const [marketAnalysis, setMarketAnalysis] = useState<MarketAnalysis | null>(null);
  const [lastAnalysisTime, setLastAnalysisTime] = useState<Date | null>(null);
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const tradingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [realtimeData, setRealtimeData] = useState<any>(null);

  const [config, setConfig] = useState<TradingConfig>({
    symbol: 'BTC/USDT',
    strategy: 'trend_following',
    riskLevel: 2,
    maxPositionSize: 1000,
    stopLoss: 2,
    takeProfit: 4,
    enabled: true,
  });

  const [simulationAccount, setSimulationAccount] = useState<Account>({
    balance: 10000,
    equity: 10000,
    margin: 0,
    freeMargin: 10000,
    marginLevel: 0,
    profit: 0,
    orders: [],
  });

  const [realTimeAccount, setRealTimeAccount] = useState<Account>({
    balance: 0,
    equity: 0,
    margin: 0,
    freeMargin: 0,
    marginLevel: 0,
    profit: 0,
    orders: [],
  });

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleString('zh-CN');
    const logEntry = `[${timestamp}] ${message}`;
    setTradingLogs(prev => [logEntry, ...prev.slice(0, 99)]);
  }, []);

  // 获取实时市场数据并进行技术分析
  const fetchMarketAnalysis = useCallback(async () => {
    try {
      const coinMap: { [key: string]: string } = {
        'BTC/USDT': 'bitcoin',
        'ETH/USDT': 'ethereum',
        'SOL/USDT': 'solana',
        'ADA/USDT': 'cardano',
      };
      
      const coinId = coinMap[config.symbol] || 'bitcoin';
      
      // 获取当前价格和24小时数据 - 使用CoinGecko API
      const marketResponse = await fetch(`/api/crypto?endpoint=coins/markets&ids=${coinId}&vs_currency=usd`);
      const marketData = await marketResponse.json();
      
      // 获取历史价格数据用于技术分析 - 使用CoinGecko API
      const chartResponse = await fetch(`/api/crypto?endpoint=coins/chart&id=${coinId}&vs_currency=usd&days=7&interval=hourly`);
      const chartData = await chartResponse.json();
      
      const currentMarketData = marketData[0];
      const priceHistory = chartData.prices || [];
      
      if (!currentMarketData || priceHistory.length === 0) {
        throw new Error('市场数据不完整');
      }
      
      // 计算技术指标
      const prices = priceHistory.map((p: [number, number]) => p[1]);
      const currentPrice = currentMarketData.current_price;
      const priceChange24h = currentMarketData.price_change_percentage_24h || 0;
      const volume24h = currentMarketData.total_volume || 0;
      
      // 计算RSI (简化版)
      const rsi = calculateRSI(prices);
      
      // 计算MACD (简化版)
      const macd = calculateMACD(prices);
      
      // 计算布林带
      const bollinger = calculateBollingerBands(prices);
      
      // 计算支撑阻力位
      const support = Math.min(...prices.slice(-24)) * 0.98;
      const resistance = Math.max(...prices.slice(-24)) * 1.02;
      
      // 计算波动率
      const volatility = calculateVolatility(prices);
      
      // 综合分析生成交易信号
      const analysis = generateTradingSignal({
        currentPrice,
        priceChange24h,
        volume24h,
        rsi,
        macd,
        bollinger,
        support,
        resistance,
        volatility
      });
      
      const marketAnalysisResult: MarketAnalysis = {
        price: currentPrice,
        priceChange24h,
        volume24h,
        volatility,
        rsi,
        macd,
        bollinger,
        support,
        resistance,
        trend: analysis.trend,
        signal: analysis.signal,
        confidence: analysis.confidence
      };
      
      setMarketAnalysis(marketAnalysisResult);
      setLastAnalysisTime(new Date());
      
      addLog(`市场分析完成: ${config.symbol} 价格 $${currentPrice.toFixed(2)}, 信号: ${analysis.signal.toUpperCase()}, 置信度: ${analysis.confidence}%`);
      
      return marketAnalysisResult;
      
    } catch (error) {
      console.error('CoinGecko市场分析失败:', error);
      addLog(`市场分析失败: ${error instanceof Error ? error.message : '未知错误'}`);
      return null;
    }
  }, [config.symbol, addLog]);
  
  // 技术指标计算函数
  const calculateRSI = (prices: number[], period: number = 14): number => {
    if (prices.length < period + 1) return 50;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = prices.length - period; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  };
  
  const calculateMACD = (prices: number[]): number => {
    if (prices.length < 26) return 0;
    
    const ema12 = calculateEMA(prices, 12);
    const ema26 = calculateEMA(prices, 26);
    
    return ema12 - ema26;
  };
  
  const calculateEMA = (prices: number[], period: number): number => {
    if (prices.length === 0) return 0;
    
    const multiplier = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }
    
    return ema;
  };
  
  const calculateBollingerBands = (prices: number[], period: number = 20): { upper: number; middle: number; lower: number } => {
    if (prices.length < period) {
      const avg = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      return { upper: avg * 1.02, middle: avg, lower: avg * 0.98 };
    }
    
    const recentPrices = prices.slice(-period);
    const sma = recentPrices.reduce((sum, price) => sum + price, 0) / period;
    
    const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
    const stdDev = Math.sqrt(variance);
    
    return {
      upper: sma + (stdDev * 2),
      middle: sma,
      lower: sma - (stdDev * 2)
    };
  };
  
  const calculateVolatility = (prices: number[]): number => {
    if (prices.length < 2) return 0;
    
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    
    return Math.sqrt(variance) * 100;
  };
  
  // 生成交易信号
  const generateTradingSignal = (data: {
    currentPrice: number;
    priceChange24h: number;
    volume24h: number;
    rsi: number;
    macd: number;
    bollinger: { upper: number; middle: number; lower: number };
    support: number;
    resistance: number;
    volatility: number;
  }) => {
    let bullishSignals = 0;
    let bearishSignals = 0;
    let confidence = 0;
    
    // RSI分析
    if (data.rsi < 30) {
      bullishSignals += 2; // 超卖，买入信号
      confidence += 15;
    } else if (data.rsi > 70) {
      bearishSignals += 2; // 超买，卖出信号
      confidence += 15;
    }
    
    // MACD分析
    if (data.macd > 0) {
      bullishSignals += 1;
      confidence += 10;
    } else {
      bearishSignals += 1;
      confidence += 10;
    }
    
    // 布林带分析
    if (data.currentPrice <= data.bollinger.lower) {
      bullishSignals += 2; // 价格触及下轨，买入信号
      confidence += 20;
    } else if (data.currentPrice >= data.bollinger.upper) {
      bearishSignals += 2; // 价格触及上轨，卖出信号
      confidence += 20;
    }
    
    // 价格趋势分析
    if (data.priceChange24h > 5) {
      bullishSignals += 1;
      confidence += 10;
    } else if (data.priceChange24h < -5) {
      bearishSignals += 1;
      confidence += 10;
    }
    
    // 成交量分析
    if (data.volume24h > 1000000000) { // 高成交量
      confidence += 15;
    }
    
    // 支撑阻力分析
    if (data.currentPrice <= data.support * 1.01) {
      bullishSignals += 1; // 接近支撑位
      confidence += 10;
    } else if (data.currentPrice >= data.resistance * 0.99) {
      bearishSignals += 1; // 接近阻力位
      confidence += 10;
    }
    
    // 波动率调整
    if (data.volatility > 10) {
      confidence *= 0.8; // 高波动率降低置信度
    }
    
    // 确定趋势和信号
    let trend: 'bullish' | 'bearish' | 'neutral';
    let signal: 'buy' | 'sell' | 'hold';
    
    if (bullishSignals > bearishSignals + 1) {
      trend = 'bullish';
      signal = confidence > 60 ? 'buy' : 'hold';
    } else if (bearishSignals > bullishSignals + 1) {
      trend = 'bearish';
      signal = confidence > 60 ? 'sell' : 'hold';
    } else {
      trend = 'neutral';
      signal = 'hold';
    }
    
    return {
      trend,
      signal,
      confidence: Math.min(95, Math.max(30, confidence))
    };
  };

  const executeSimulatedTrade = useCallback((signal: 'buy' | 'sell', analysis: MarketAnalysis) => {
    const tradeAmount = Math.min(config.maxPositionSize, simulationAccount.freeMargin * 0.1);
    const fillPrice = analysis.price * (1 + (Math.random() - 0.5) * 0.001);
    
    const order: Order = {
      id: `sim_${Date.now()}`,
      symbol: config.symbol,
      side: signal,
      amount: tradeAmount / fillPrice,
      price: fillPrice,
      type: 'market',
      status: 'filled',
      timestamp: new Date().toISOString(),
    };

    setSimulationAccount(prev => {
      const profit = signal === 'buy' ? 
        (analysis.price - fillPrice) * order.amount :
        (fillPrice - analysis.price) * order.amount;
      
      return {
        ...prev,
        orders: [order, ...prev.orders.slice(0, 49)],
        profit: prev.profit + profit,
        equity: prev.balance + prev.profit + profit,
      };
    });

    const profit = signal === 'buy' ? 
      (analysis.price - fillPrice) * order.amount :
      (fillPrice - analysis.price) * order.amount;
    const profitText = profit > 0 ? `盈利 $${profit.toFixed(2)}` : `亏损 $${Math.abs(profit).toFixed(2)}`;
    addLog(`智能交易执行: ${signal.toUpperCase()} ${order.amount.toFixed(4)} ${config.symbol} @ $${fillPrice.toFixed(2)} - ${profitText} (置信度: ${analysis.confidence}%)`);
  }, [config, simulationAccount, addLog]);

  const runTradingBot = useCallback(async () => {
    if (!marketAnalysis) {
      addLog('等待市场分析数据...');
      return;
    }
    
    const { signal, confidence, trend } = marketAnalysis;
    
    // 只有在置信度足够高时才执行交易
    if (confidence < 60) {
      addLog(`信号置信度不足 (${confidence}%)，继续观望...`);
      return;
    }
    
    // 风险管理：检查最大仓位
    if (signal === 'buy' && simulationAccount.freeMargin < config.maxPositionSize) {
      addLog('可用资金不足，跳过买入信号');
      return;
    }
    
    if (signal === 'buy') {
      if (tradingMode === 'simulation') {
        executeSimulatedTrade('buy', marketAnalysis);
      } else {
        addLog(`实盘买入信号: ${config.symbol} @ $${marketAnalysis.price.toFixed(2)} (置信度: ${confidence}%)`);
      }
    } else if (signal === 'sell') {
      if (tradingMode === 'simulation') {
        executeSimulatedTrade('sell', marketAnalysis);
      } else {
        addLog(`实盘卖出信号: ${config.symbol} @ $${marketAnalysis.price.toFixed(2)} (置信度: ${confidence}%)`);
      }
    } else {
      addLog(`持有信号: 当前市场条件不适合交易 (趋势: ${trend}, 置信度: ${confidence}%)`);
    }
  }, [tradingMode, config, marketAnalysis, executeSimulatedTrade, addLog, simulationAccount]);

  useEffect(() => {
    if (botRunning) {
      addLog(`交易机器人启动 - ${tradingMode === 'live' ? '实盘模式' : '模拟模式'}`);
      
      // 立即进行一次市场分析
      fetchMarketAnalysis();
      
      // 设置市场分析定时器 (每5分钟分析一次)
      analysisIntervalRef.current = setInterval(fetchMarketAnalysis, 300000);
      
      // 设置交易决策定时器 (每1分钟检查一次交易机会)
      tradingIntervalRef.current = setInterval(runTradingBot, 60000);
    } else {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
      }
      if (tradingIntervalRef.current) {
        clearInterval(tradingIntervalRef.current);
        tradingIntervalRef.current = null;
      }
      addLog('交易机器人已停止');
    }

    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
      if (tradingIntervalRef.current) {
        clearInterval(tradingIntervalRef.current);
      }
    };
  }, [botRunning, tradingMode, addLog, fetchMarketAnalysis, runTradingBot]);

  const toggleBot = () => {
    if (!user) {
      toast.error('请先登录以使用自动交易功能');
      return;
    }
    setBotRunning(prev => !prev);
  };

  const clearLogs = () => {
    setTradingLogs([]);
    toast.success('交易日志已清空');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center">
        <Card className="glassmorphism max-w-md">
          <CardContent className="p-8 text-center">
            <Bot className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">需要登录</h2>
            <p className="text-slate-400 mb-6">请先登录以使用自动交易功能</p>
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <a href="/auth/login">立即登录</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentAccount = tradingMode === 'live' ? realTimeAccount : simulationAccount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
            AI毫秒级自动交易机器人
          </h1>
          <p className="text-xl text-slate-300">
            毫秒级数据分析，24/7智能交易，捕捉每一个微小的市场机会
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Control Panel */}
          <div className="lg:col-span-1">
            <Card className="glassmorphism">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bot className="w-5 h-5 text-blue-400" />
                  <span>机器人控制</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Bot Status */}
                <div className="text-center">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    botRunning ? 'bg-green-500/20 border-2 border-green-400' : 'bg-slate-500/20 border-2 border-slate-400'
                  }`}>
                    <Bot className={`w-10 h-10 ${botRunning ? 'text-green-400' : 'text-slate-400'}`} />
                  </div>
                  <Badge variant={botRunning ? 'default' : 'secondary'}>
                    {botRunning ? '运行中' : '已停止'}
                  </Badge>
                </div>

                {/* Trading Mode */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">交易模式</Label>
                  <Tabs value={tradingMode} onValueChange={(value) => setTradingMode(value as 'simulation' | 'live')}>
                    <TabsList className="grid w-full grid-cols-2 glassmorphism">
                      <TabsTrigger value="simulation">模拟</TabsTrigger>
                      <TabsTrigger value="live">实盘</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* Start/Stop Button */}
                <Button
                  onClick={toggleBot}
                  className={`w-full ${
                    botRunning 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-green-600 hover:bg-green-700 glow-effect'
                  }`}
                >
                  {botRunning ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      停止机器人
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      启动机器人
                    </>
                  )}
                </Button>

                {/* Configuration */}
                <div className="space-y-6">
                  <h3 className="font-semibold flex items-center">
                    <Settings className="w-4 h-4 mr-2" />
                    交易配置
                  </h3>
                  
                  <div>
                    <Label htmlFor="symbol">交易对</Label>
                    <Select value={config.symbol} onValueChange={(value) => setConfig(prev => ({ ...prev, symbol: value }))}>
                      <SelectTrigger className="glassmorphism border-white/20 mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glassmorphism">
                        <SelectItem value="BTC/USDT">BTC/USDT</SelectItem>
                        <SelectItem value="ETH/USDT">ETH/USDT</SelectItem>
                        <SelectItem value="SOL/USDT">SOL/USDT</SelectItem>
                        <SelectItem value="ADA/USDT">ADA/USDT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="strategy">交易策略</Label>
                    <Select value={config.strategy} onValueChange={(value) => setConfig(prev => ({ ...prev, strategy: value }))}>
                      <SelectTrigger className="glassmorphism border-white/20 mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glassmorphism">
                        <SelectItem value="trend_following">趋势跟踪</SelectItem>
                        <SelectItem value="mean_reversion">均值回归</SelectItem>
                        <SelectItem value="momentum">动量策略</SelectItem>
                        <SelectItem value="arbitrage">套利策略</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="risk">风险等级: {config.riskLevel}</Label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={config.riskLevel}
                      onChange={(e) => setConfig(prev => ({ ...prev, riskLevel: parseInt(e.target.value) }))}
                      className="w-full mt-2"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                      <span>保守</span>
                      <span>激进</span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="position">最大仓位 ($)</Label>
                    <Input
                      id="position"
                      type="number"
                      value={config.maxPositionSize}
                      onChange={(e) => setConfig(prev => ({ ...prev, maxPositionSize: parseFloat(e.target.value) || 0 }))}
                      className="glassmorphism border-white/20 mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="stop-loss">止损 (%)</Label>
                      <Input
                        id="stop-loss"
                        type="number"
                        value={config.stopLoss}
                        onChange={(e) => setConfig(prev => ({ ...prev, stopLoss: parseFloat(e.target.value) || 0 }))}
                        className="glassmorphism border-white/20 mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="take-profit">止盈 (%)</Label>
                      <Input
                        id="take-profit"
                        type="number"
                        value={config.takeProfit}
                        onChange={(e) => setConfig(prev => ({ ...prev, takeProfit: parseFloat(e.target.value) || 0 }))}
                        className="glassmorphism border-white/20 mt-1"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Market Analysis Display */}
                {(marketAnalysis || realtimeData) && (
                  <div className="mt-6 p-4 glassmorphism rounded-lg">
                    <h3 className="font-semibold mb-3 flex items-center">
                      <Activity className="w-4 h-4 mr-2 text-green-400 animate-pulse" />
                      毫秒级分析
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">当前价格:</span>
                        <span className="font-medium">${(realtimeData?.price || marketAnalysis?.price || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">24h变化:</span>
                        <span className={`font-medium ${(realtimeData?.changePercent || marketAnalysis?.priceChange24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {(realtimeData?.changePercent || marketAnalysis?.priceChange24h || 0) >= 0 ? '+' : ''}{(realtimeData?.changePercent || marketAnalysis?.priceChange24h || 0).toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">RSI:</span>
                        <span className={`font-medium ${
                          (realtimeData?.rsi || marketAnalysis?.rsi || 50) < 30 ? 'text-green-400' : 
                          (realtimeData?.rsi || marketAnalysis?.rsi || 50) > 70 ? 'text-red-400' : 'text-yellow-400'
                        }`}>
                          {(realtimeData?.rsi || marketAnalysis?.rsi || 50).toFixed(1)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">交易信号:</span>
                        <Badge variant={
                          (realtimeData?.signal || marketAnalysis?.signal) === 'buy' ? 'default' : 
                          (realtimeData?.signal || marketAnalysis?.signal) === 'sell' ? 'destructive' : 'secondary'
                        }>
                          {(realtimeData?.signal || marketAnalysis?.signal) === 'buy' ? '买入' : 
                           (realtimeData?.signal || marketAnalysis?.signal) === 'sell' ? '卖出' : '持有'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">置信度:</span>
                        <span className="font-medium text-blue-400">{(realtimeData?.confidence || marketAnalysis?.confidence || 0)}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">更新频率:</span>
                        <span className="font-medium text-green-400">30秒</span>
                      </div>
                      {lastAnalysisTime && (
                        <div className="text-xs text-slate-500 mt-2">
                          最后更新: {lastAnalysisTime.toLocaleTimeString('zh-CN')}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Dashboard */}
          <div className="lg:col-span-3 space-y-6">
            {/* 实时价格图表 */}
            <RealtimeChart 
              symbol={config.symbol.replace('/USDT', '')} 
              title={`${config.symbol} 实时交易数据`}
              height={300}
              maxDataPoints={100}
            />
            
            {/* Account Overview */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="glassmorphism">
                <CardContent className="p-4 text-center">
                  <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold">${currentAccount.balance.toLocaleString()}</div>
                  <div className="text-sm text-slate-400">账户余额</div>
                </CardContent>
              </Card>

              <Card className="glassmorphism">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold">${currentAccount.equity.toLocaleString()}</div>
                  <div className="text-sm text-slate-400">账户净值</div>
                </CardContent>
              </Card>

              <Card className="glassmorphism">
                <CardContent className="p-4 text-center">
                  <Target className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <div className={`text-2xl font-bold ${currentAccount.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${currentAccount.profit.toFixed(2)}
                  </div>
                  <div className="text-sm text-slate-400">浮动盈亏</div>
                </CardContent>
              </Card>

              <Card className="glassmorphism">
                <CardContent className="p-4 text-center">
                  <Activity className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{currentAccount.orders.length}</div>
                  <div className="text-sm text-slate-400">活跃订单</div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Chart Placeholder */}
            <Card className="glassmorphism">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>实时账户表现</span>
                  <Badge variant="secondary">{tradingMode === 'live' ? '实盘' : '模拟'}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {botRunning ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <Activity className="w-16 h-16 mx-auto mb-4 text-green-400 animate-pulse" />
                        <p className="text-green-400">AI交易机器人运行中</p>
                        <p className="text-sm text-slate-400">30秒数据更新频率</p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">
                      <div className="text-center">
                        <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p>启动机器人开始实时数据流</p>
                        <p className="text-sm">实时性能监控</p>
                      </div>
                    </div>
                  )}
                  </div>
              </CardContent>
            </Card>

            {/* Orders Status */}
            {tradingMode === 'live' && (
              <Card className="glassmorphism">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>订单状态</span>
                    <Badge variant="secondary">
                      {realTimeAccount.orders.length} 个订单
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {realTimeAccount.orders.length > 0 ? (
                    <div className="space-y-3">
                      {realTimeAccount.orders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-3 glassmorphism rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Badge variant={order.side === 'buy' ? 'default' : 'destructive'}>
                              {order.side === 'buy' ? '买入' : '卖出'}
                            </Badge>
                            <div>
                              <div className="font-medium">{order.symbol}</div>
                              <div className="text-xs text-slate-400">
                                {order.amount.toFixed(4)} {order.type === 'limit' && order.price && `@ $${order.price.toFixed(2)}`}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant={
                              order.status === 'filled' ? 'default' :
                              order.status === 'pending' ? 'secondary' :
                              order.status === 'cancelled' ? 'outline' : 'destructive'
                            }>
                              {order.status === 'filled' ? '已成交' :
                               order.status === 'pending' ? '待成交' :
                               order.status === 'cancelled' ? '已取消' : '已拒绝'}
                            </Badge>
                            <div className="text-xs text-slate-400 mt-1">
                              {new Date(order.timestamp).toLocaleString('zh-CN')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      暂无订单记录
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Trading Logs */}
            <Card className="glassmorphism">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-blue-400 animate-pulse" />
                    <span>AI交易日志</span>
                    <Badge variant="secondary">{tradingMode === 'live' ? '实盘' : '模拟'}</Badge>
                    <Badge variant="outline" className="text-xs">实时更新</Badge>
                  </div>
                  <Button variant="outline" size="sm" onClick={clearLogs}>
                    清空日志
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 overflow-y-auto space-y-2">
                  {tradingLogs.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      等待AI分析和交易信号...
                    </div>
                  ) : (
                    tradingLogs.map((log, index) => (
                      <div key={index} className={`text-sm p-2 glassmorphism rounded ${
                        log.includes('盈利') ? 'border-l-4 border-green-400 text-green-300' :
                        log.includes('亏损') ? 'border-l-4 border-red-400 text-red-300' :
                        log.includes('分析完成') ? 'border-l-4 border-blue-400 text-blue-300' :
                        log.includes('智能交易执行') ? 'border-l-4 border-purple-400 text-purple-300' :
                        log.includes('连接') || log.includes('启动') ? 'border-l-4 border-blue-400 text-blue-300' :
                        'text-slate-300'
                      }`}>
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}