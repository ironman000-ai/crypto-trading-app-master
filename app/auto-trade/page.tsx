'use client';

import { useState, useEffect } from 'react';
import { Bot, Play, Square, Settings, TrendingUp, TrendingDown, Activity, AlertTriangle, DollarSign, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface BotSettings {
  enabled: boolean;
  maxInvestment: number;
  riskLevel: 'low' | 'medium' | 'high';
  stopLoss: number;
  takeProfit: number;
  coins: string[];
  tradingHours: {
    start: string; // UTC time
    end: string;   // UTC time
    enabled: boolean;
  };
  technicalIndicators: {
    rsi: {
      period: number;
      overbought: number;
      oversold: number;
    };
    ma: {
      shortPeriod: number;
      longPeriod: number;
    };
    bollingerBands: {
      period: number;
      stdDev: number;
    };
    atr: {
      period: number;
      highVolatilityThreshold: number;
    };
  };
  riskManagement: {
    maxDrawdown: number;
    diversificationLimit: number;
    positionSizing: 'fixed' | 'percentage' | 'kelly';
    maxRiskPerTrade: number;
    minROIThreshold: number;
  };
}

interface Position {
  id: string;
  coin: string;
  amount: number;
  entryPrice: number;
  currentPrice: number;
  profit: number;
  profitPercent: number;
  timestamp: string;
  status: 'open' | 'closed';
}

interface Account {
  balance: number;
  totalInvested: number;
  totalProfit: number;
  positions: Position[];
  dailyPnL: number;
}

export default function AutoTradePage() {
  const { user } = useAuth();
  const [botRunning, setBotRunning] = useState(false);
  const [settings, setSettings] = useState<BotSettings>({
    enabled: false,
    maxInvestment: 1000, // 初始资金1000单位
    riskLevel: 'medium',
    stopLoss: 1.5, // 优化止损至1.5%
    takeProfit: 3.0, // 优化止盈至3%
    coins: ['BTC', 'ETH'], // 专注高流动性币种
    tradingHours: {
      start: '08:00', // UTC 8:00 (CST 15:00)
      end: '20:00',   // UTC 20:00 (CST 3:00次日)
      enabled: true,
    },
    technicalIndicators: {
      rsi: {
        period: 14,
        overbought: 70,
        oversold: 30,
      },
      ma: {
        shortPeriod: 5,
        longPeriod: 20,
      },
      bollingerBands: {
        period: 20,
        stdDev: 2,
      },
      atr: {
        period: 14,
        highVolatilityThreshold: 5, // 5% ATR阈值
      },
    },
    riskManagement: {
      maxDrawdown: 20,
      diversificationLimit: 2, // 减少分散化，专注优质币种
      positionSizing: 'percentage',
      maxRiskPerTrade: 1.0, // 每笔交易最大风险1%
      minROIThreshold: 2.0, // 最小ROI阈值2%
    },
  });

  const [account, setAccount] = useState<Account>({
    balance: 10000,
    totalInvested: 0,
    totalProfit: 0,
    positions: [],
    dailyPnL: 0,
  });

  const [botStats, setBotStats] = useState({
    totalTrades: 0,
    successfulTrades: 0,
    winRate: 0,
    avgProfit: 0,
    maxDrawdown: 0,
    sharpeRatio: 0,
  });

  const [recentTrades, setRecentTrades] = useState<Position[]>([]);
  const [apiConnected, setApiConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tradingLogs, setTradingLogs] = useState<string[]>([]);
  const [marketConditions, setMarketConditions] = useState({
    volatility: 'medium',
    trend: 'neutral',
    volume: 'normal',
    lastUpdate: new Date().toISOString(),
  });

  // 实时市场数据更新
  useEffect(() => {
    const updateMarketData = () => {
      setMarketPrices(prev => prev.map(market => ({
        ...market,
        price: market.price * (1 + (Math.random() - 0.5) * 0.02), // ±1% 随机波动
        change: (Math.random() - 0.5) * 10, // ±5% 变化范围
      })));
      
      // 更新市场状况
      setMarketConditions(prev => ({
        ...prev,
        volatility: Math.random() > 0.7 ? 'high' : Math.random() > 0.3 ? 'medium' : 'low',
        trend: Math.random() > 0.6 ? 'bullish' : Math.random() > 0.3 ? 'neutral' : 'bearish',
        volume: Math.random() > 0.5 ? 'high' : 'normal',
        lastUpdate: new Date().toISOString(),
      }));
    };

    // 每30秒更新一次市场数据
    const marketInterval = setInterval(updateMarketData, 30000);
    
    return () => clearInterval(marketInterval);
  }, []);

  // 虚拟交易模拟
  const simulateVirtualTrade = () => {
    if (!botRunning || !isWithinTradingHours()) return;

    const shouldTrade = Math.random() > 0.85; // 15% 交易概率
    
    if (shouldTrade) {
      const coin = settings.coins[Math.floor(Math.random() * settings.coins.length)];
      const marketPrice = marketPrices.find(p => p.coin === coin);
      
      if (marketPrice) {
        // 基于技术指标的交易决策
        const rsi = 30 + Math.random() * 40; // 模拟RSI 30-70
        const maSignal = Math.random() > 0.5; // MA交叉信号
        const volatility = Math.abs(marketPrice.change);
        
        // 交易条件判断
        const shouldBuy = rsi < 35 && maSignal && volatility < 8;
        const shouldSell = rsi > 65 && !maSignal;
        
        if (shouldBuy || shouldSell) {
          const isProfit = Math.random() > 0.25; // 75% 盈利概率
          const profitPercent = isProfit ? 
            Math.random() * settings.takeProfit : 
            -Math.random() * settings.stopLoss;
          
          const amount = (settings.maxInvestment * 0.01) / marketPrice.price; // 1% 仓位
          const profit = (marketPrice.price * amount * profitPercent) / 100;
          
          const newTrade: Position = {
            id: `trade_${Date.now()}`,
            coin,
            amount,
            entryPrice: marketPrice.price,
            currentPrice: marketPrice.price * (1 + profitPercent / 100),
            profit,
            profitPercent,
            timestamp: new Date().toISOString(),
            status: 'closed',
          };
          
          // 更新交易记录
          setRecentTrades(prev => [newTrade, ...prev.slice(0, 19)]);
          
          // 更新账户信息
          setAccount(prev => ({
            ...prev,
            balance: prev.balance + profit,
            totalProfit: prev.totalProfit + profit,
            dailyPnL: prev.dailyPnL + profit,
          }));
          
          // 更新统计数据
          setBotStats(prev => ({
            ...prev,
            totalTrades: prev.totalTrades + 1,
            successfulTrades: prev.successfulTrades + (isProfit ? 1 : 0),
            winRate: ((prev.successfulTrades + (isProfit ? 1 : 0)) / (prev.totalTrades + 1)) * 100,
            avgProfit: (prev.avgProfit * prev.totalTrades + profit) / (prev.totalTrades + 1),
          }));
          
          // 添加交易日志
          const logMessage = `${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })} CST - ${coin} ${shouldBuy ? '买入' : '卖出'} ${isProfit ? '盈利' : '亏损'} $${Math.abs(profit).toFixed(2)} (${profitPercent.toFixed(2)}%) - RSI:${rsi.toFixed(1)} MA:${maSignal ? '金叉' : '死叉'}`;
          setTradingLogs(prev => [logMessage, ...prev.slice(0, 49)]);
          
          // 显示通知
          if (isProfit) {
            toast.success(`${coin} 交易获利 $${profit.toFixed(2)} (${profitPercent.toFixed(2)}%)`);
          } else {
            toast.error(`${coin} 交易亏损 $${Math.abs(profit).toFixed(2)} (${Math.abs(profitPercent).toFixed(2)}%)`);
          }
        }
      }
    }
  };

  // 自动交易循环
  useEffect(() => {
    if (botRunning && apiConnected) {
      const tradingInterval = setInterval(() => {
        simulateVirtualTrade();
      }, 45000); // 每45秒检查一次交易机会

      return () => clearInterval(tradingInterval);
    }
  }, [botRunning, apiConnected, settings, marketPrices]);

  // 生成虚拟持仓
  const generateVirtualPositions = () => {
    if (!botRunning) return;
    
    const positions: Position[] = [];
    const activeCoins = settings.coins.slice(0, 2); // 限制同时持仓数量
    
    activeCoins.forEach((coin, index) => {
      if (Math.random() > 0.6) { // 60% 概率持仓
        const marketPrice = marketPrices.find(p => p.coin === coin)?.price || 100;
        const entryPrice = marketPrice * (0.98 + Math.random() * 0.04); // ±2% 入场价
        const amount = (settings.maxInvestment * 0.02) / entryPrice; // 2% 仓位
        const currentProfit = (marketPrice - entryPrice) * amount;
        const profitPercent = (currentProfit / (entryPrice * amount)) * 100;
        
        positions.push({
          id: `pos_${coin}_${index}`,
          coin,
          amount,
          entryPrice,
          currentPrice: marketPrice,
          profit: currentProfit,
          profitPercent,
          timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
          status: 'open',
        });
      }
    });
    
    setAccount(prev => ({ ...prev, positions }));
  };

  // 定期更新持仓
  useEffect(() => {
    if (botRunning && apiConnected) {
      generateVirtualPositions();
      const positionInterval = setInterval(() => {
        // 更新现有持仓的当前价格和盈亏
        setAccount(prev => ({
          ...prev,
          positions: prev.positions.map(pos => {
            const currentMarketPrice = marketPrices.find(p => p.coin === pos.coin)?.price || pos.currentPrice;
            const newProfit = (currentMarketPrice - pos.entryPrice) * pos.amount;
            const newProfitPercent = (newProfit / (pos.entryPrice * pos.amount)) * 100;
            
            return {
              ...pos,
              currentPrice: currentMarketPrice,
              profit: newProfit,
              profitPercent: newProfitPercent,
            };
          }),
        }));
      }, 10000); // 每10秒更新持仓
      
      return () => clearInterval(positionInterval);
    }
  }, [botRunning, apiConnected, marketPrices]);

  const logTradingActivity = (message: string) => {
    const timestamp = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
    const logEntry = `${timestamp} CST - ${message}`;
    setTradingLogs(prev => [logEntry, ...prev.slice(0, 49)]);
  };

  // Check if current time is within trading hours
  const isWithinTradingHours = () => {
    if (!settings.tradingHours.enabled) return true;
    
    const now = new Date();
    const currentUTCHour = now.getUTCHours();
    const currentUTCMinute = now.getUTCMinutes();
    const currentTimeInMinutes = currentUTCHour * 60 + currentUTCMinute;
    
    const [startHour, startMinute] = settings.tradingHours.start.split(':').map(Number);
    const [endHour, endMinute] = settings.tradingHours.end.split(':').map(Number);
    
    const startTimeInMinutes = startHour * 60 + startMinute;
    const endTimeInMinutes = endHour * 60 + endMinute;
    
    // Handle overnight trading hours (e.g., 20:00 to 08:00 next day)
    if (startTimeInMinutes > endTimeInMinutes) {
      return currentTimeInMinutes >= startTimeInMinutes || currentTimeInMinutes <= endTimeInMinutes;
    }
    
    // Normal trading hours (e.g., 08:00 to 20:00)
    return currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes;
  };

  // Mock market prices
  const [marketPrices] = useState([
    { coin: 'BTC', price: 45000, change: 2.5 },
    { coin: 'ETH', price: 2800, change: -1.2 },
    { coin: 'SOL', price: 95, change: 5.8 },
    { coin: 'ADA', price: 0.45, change: -0.8 },
    { coin: 'DOT', price: 6.5, change: 3.2 },
  ]);

  useEffect(() => {
    if (botRunning) {
      const interval = setInterval(() => {
        if (isWithinTradingHours()) {
          analyzeMarketAndTrade();
        } else {
          logTradingActivity('交易时间外，机器人待机中');
        }
      }, 60000); // 每分钟评估1次交易机会

      return () => clearInterval(interval);
    }
  }, [botRunning, settings]);

  const handleStartBot = async () => {
    if (!user) {
      toast.error('请先登录以使用自动交易功能');
      return;
    }

    if (!apiConnected) {
      toast.error('请先连接交易API');
      return;
    }

    setLoading(true);
    try {
      // Simulate bot startup
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setBotRunning(true);
      setSettings(prev => ({ ...prev, enabled: true }));
      toast.success('自动交易机器人已启动');
    } catch (error) {
      toast.error('启动失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleStopBot = () => {
    setBotRunning(false);
    setSettings(prev => ({ ...prev, enabled: false }));
    toast.success('自动交易机器人已停止');
  };

  const connectAPI = async () => {
    setLoading(true);
    try {
      // Simulate API connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setApiConnected(true);
      toast.success('API连接成功');
      
      // Fetch account info
      const mockAccount = {
        balance: 10000 + Math.random() * 5000,
        totalInvested: Math.random() * 3000,
        totalProfit: (Math.random() - 0.3) * 1000,
        positions: generateMockPositions(),
        dailyPnL: (Math.random() - 0.4) * 200,
      };
      
      setAccount(mockAccount);
    } catch (error) {
      toast.error('API连接失败');
    } finally {
      setLoading(false);
    }
  };

  const generateMockPositions = (): Position[] => {
    const positions: Position[] = [];
    const coins = ['BTC', 'ETH', 'SOL', 'ADA'];
    
    for (let i = 0; i < Math.floor(Math.random() * 4) + 1; i++) {
      const coin = coins[Math.floor(Math.random() * coins.length)];
      const marketPrice = marketPrices.find(p => p.coin === coin)?.price || 100;
      const entryPrice = marketPrice * (0.95 + Math.random() * 0.1);
      const amount = Math.random() * 0.1 + 0.01;
      const profit = (marketPrice - entryPrice) * amount;
      
      positions.push({
        id: `pos_${i}`,
        coin,
        amount,
        entryPrice,
        currentPrice: marketPrice,
        profit,
        profitPercent: (profit / (entryPrice * amount)) * 100,
        timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
        status: 'open',
      });
    }
    
    return positions;
  };

  const simulateTrading = () => {
    if (!botRunning) return;

    // Simulate a trade decision
    const shouldTrade = Math.random() > 0.7; // 30% chance to trade
    
    if (shouldTrade) {
      const coin = settings.coins[Math.floor(Math.random() * settings.coins.length)];
      const marketPrice = marketPrices.find(p => p.coin === coin);
      
      if (marketPrice) {
        const isProfit = Math.random() > 0.3; // 70% chance of profit
        const profitPercent = isProfit ? 
          Math.random() * settings.takeProfit : 
          -Math.random() * settings.stopLoss;
        
        const amount = 0.01 + Math.random() * 0.05;
        const profit = (marketPrice.price * amount * profitPercent) / 100;
        
        const newTrade: Position = {
          id: `trade_${Date.now()}`,
          coin,
          amount,
          entryPrice: marketPrice.price,
          currentPrice: marketPrice.price * (1 + profitPercent / 100),
          profit,
          profitPercent,
          timestamp: new Date().toISOString(),
          status: 'closed',
        };
        
        setRecentTrades(prev => [newTrade, ...prev.slice(0, 9)]);
        setAccount(prev => ({
          ...prev,
          balance: prev.balance + profit,
          totalProfit: prev.totalProfit + profit,
          dailyPnL: prev.dailyPnL + profit,
        }));
        
        setBotStats(prev => ({
          ...prev,
          totalTrades: prev.totalTrades + 1,
          successfulTrades: prev.successfulTrades + (isProfit ? 1 : 0),
          winRate: ((prev.successfulTrades + (isProfit ? 1 : 0)) / (prev.totalTrades + 1)) * 100,
          avgProfit: (prev.avgProfit * prev.totalTrades + profit) / (prev.totalTrades + 1),
        }));
        
        if (isProfit) {
          toast.success(`${coin} 交易获利 $${profit.toFixed(2)}`);
        } else {
          toast.error(`${coin} 交易亏损 $${Math.abs(profit).toFixed(2)}`);
        }
      }
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
            AI自动交易机器人
          </h1>
          <p className="text-xl text-slate-300">
            24/7智能交易，让AI为您把握每一个市场机会
          </p>
        </div>

        {/* Status Bar */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="glassmorphism">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Bot className={`w-8 h-8 ${botRunning ? 'text-green-400' : 'text-slate-400'}`} />
              </div>
              <div className="text-lg font-semibold">
                {botRunning ? '运行中' : '已停止'}
              </div>
              <div className="text-sm text-slate-400">机器人状态</div>
            </CardContent>
          </Card>

          <Card className="glassmorphism">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-blue-400 mb-1">
                ${account.balance.toLocaleString()}
              </div>
              <div className="text-sm text-slate-400">账户余额</div>
            </CardContent>
          </Card>

          <Card className="glassmorphism">
            <CardContent className="p-6 text-center">
              <div className={`text-2xl font-bold mb-1 ${account.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${account.totalProfit.toFixed(2)}
              </div>
              <div className="text-sm text-slate-400">总盈亏</div>
            </CardContent>
          </Card>

          <Card className="glassmorphism">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-purple-400 mb-1">
                {botStats.winRate.toFixed(1)}%
              </div>
              <div className="text-sm text-slate-400">胜率</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Control Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Bot Controls */}
            <Card className="glassmorphism">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>机器人控制</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!apiConnected ? (
                  <Button 
                    onClick={connectAPI}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? '连接中...' : '连接交易API'}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">API状态</span>
                      <Badge variant="default">已连接</Badge>
                    </div>
                    
                    {!botRunning ? (
                      <Button 
                        onClick={handleStartBot}
                        disabled={loading}
                        className="w-full bg-green-600 hover:bg-green-700 glow-effect"
                      >
                        {loading ? (
                          <>
                            <Activity className="w-4 h-4 mr-2 animate-spin" />
                            启动中...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            启动机器人
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleStopBot}
                        className="w-full bg-red-600 hover:bg-red-700"
                      >
                        <Square className="w-4 h-4 mr-2" />
                        停止机器人
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Settings */}
            <Card className="glassmorphism">
              <CardHeader>
                <CardTitle>交易设置</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="maxInvestment">最大投资金额</Label>
                  <Input
                    id="maxInvestment"
                    type="number"
                    value={settings.maxInvestment}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      maxInvestment: Number(e.target.value)
                    }))}
                    className="glassmorphism border-white/20 mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="stopLoss">止损百分比 (%)</Label>
                  <Input
                    id="stopLoss"
                    type="number"
                    value={settings.stopLoss}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      stopLoss: Number(e.target.value)
                    }))}
                    className="glassmorphism border-white/20 mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="takeProfit">止盈百分比 (%)</Label>
                  <Input
                    id="takeProfit"
                    type="number"
                    value={settings.takeProfit}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      takeProfit: Number(e.target.value)
                    }))}
                    className="glassmorphism border-white/20 mt-1"
                  />
                </div>

                <div>
                  <Label>风险等级</Label>
                  <div className="flex space-x-2 mt-2">
                    {(['low', 'medium', 'high'] as const).map((level) => (
                      <Button
                        key={level}
                        variant={settings.riskLevel === level ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSettings(prev => ({ ...prev, riskLevel: level }))}
                        className="flex-1"
                      >
                        {level === 'low' ? '低' : level === 'medium' ? '中' : '高'}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Stats */}
            <Card className="glassmorphism">
              <CardHeader>
                <CardTitle>性能统计</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">总交易次数:</span>
                  <span>{botStats.totalTrades}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">成功交易:</span>
                  <span className="text-green-400">{botStats.successfulTrades}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">平均收益:</span>
                  <span className={botStats.avgProfit >= 0 ? 'text-green-400' : 'text-red-400'}>
                    ${botStats.avgProfit.toFixed(2)}
                  </span>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-400">胜率:</span>
                    <span>{botStats.winRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={botStats.winRate} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Dashboard */}
          <div className="lg:col-span-2 space-y-6">
            {/* Market Prices */}
            <Card className="glassmorphism">
              <CardHeader>
                <CardTitle>实时行情</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {marketPrices.map((market) => (
                    <div key={market.coin} className="p-4 glassmorphism rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{market.coin}</span>
                        <div className={`flex items-center ${market.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {market.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          <span className="ml-1 text-sm">{market.change.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="text-lg font-bold">
                        ${market.price.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Current Positions */}
            <Card className="glassmorphism">
              <CardHeader>
                <CardTitle>当前持仓</CardTitle>
              </CardHeader>
              <CardContent>
                {account.positions.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    暂无持仓
                  </div>
                ) : (
                  <div className="space-y-4">
                    {account.positions.map((position) => (
                      <div key={position.id} className="flex items-center justify-between p-4 glassmorphism rounded-lg">
                        <div>
                          <div className="font-semibold">{position.coin}</div>
                          <div className="text-sm text-slate-400">
                            {position.amount.toFixed(4)} @ ${position.entryPrice.toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${position.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {position.profit >= 0 ? '+' : ''}${position.profit.toFixed(2)}
                          </div>
                          <div className={`text-sm ${position.profitPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {position.profitPercent >= 0 ? '+' : ''}{position.profitPercent.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Trades */}
            <Card className="glassmorphism">
              <CardHeader>
                <CardTitle>最近交易</CardTitle>
              </CardHeader>
              <CardContent>
                {recentTrades.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    暂无交易记录
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentTrades.map((trade) => (
                      <div key={trade.id} className="flex items-center justify-between p-3 glassmorphism rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${trade.profit >= 0 ? 'bg-green-400' : 'bg-red-400'}`} />
                          <div>
                            <div className="font-medium">{trade.coin}</div>
                            <div className="text-xs text-slate-400">
                              {new Date(trade.timestamp).toLocaleString('zh-CN')}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${trade.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)}
                          </div>
                          <div className={`text-xs ${trade.profitPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {trade.profitPercent >= 0 ? '+' : ''}{trade.profitPercent.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 交易日志 */}
            <Card className="glassmorphism">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-blue-400" />
                  <span>交易日志</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 overflow-y-auto space-y-2">
                  {tradingLogs.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      暂无交易日志
                    </div>
                  ) : (
                    tradingLogs.map((log, index) => (
                      <div key={index} className="text-sm p-2 glassmorphism rounded text-slate-300">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 市场状况 */}
            <Card className="glassmorphism">
              <CardHeader>
                <CardTitle>当前市场状况</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 glassmorphism rounded-lg">
                    <div className="text-sm text-slate-400 mb-1">交易时段</div>
                    <div className={`font-medium ${isWithinTradingHours() ? 'text-green-400' : 'text-red-400'}`}>
                      {isWithinTradingHours() ? '活跃时段' : '休市时段'}
                    </div>
                  </div>
                  
                  <div className="text-center p-3 glassmorphism rounded-lg">
                    <div className="text-sm text-slate-400 mb-1">市场波动</div>
                    <div className="font-medium text-yellow-400">
                      {marketConditions.volatility === 'high' ? '高波动' : 
                       marketConditions.volatility === 'medium' ? '中等波动' : '低波动'}
                    </div>
                  </div>
                  
                  <div className="text-center p-3 glassmorphism rounded-lg">
                    <div className="text-sm text-slate-400 mb-1">整体趋势</div>
                    <div className="font-medium text-blue-400">
                      {marketConditions.trend === 'bullish' ? '看涨' : 
                       marketConditions.trend === 'bearish' ? '看跌' : '中性'}
                    </div>
                  </div>
                  
                  <div className="text-center p-3 glassmorphism rounded-lg">
                    <div className="text-sm text-slate-400 mb-1">成交量</div>
                    <div className="font-medium text-purple-400">
                      {marketConditions.volume === 'high' ? '高成交量' : 
                       marketConditions.volume === 'low' ? '低成交量' : '正常'}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 text-xs text-slate-400 text-center">
                  最后更新: {new Date(marketConditions.lastUpdate).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })} CST
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}