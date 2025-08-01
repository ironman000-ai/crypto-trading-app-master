'use client';

import { useState, useEffect, useCallback } from 'react';
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

export default function AutoTradePage() {
  const { user } = useAuth();
  const [botRunning, setBotRunning] = useState(false);
  const [tradingMode, setTradingMode] = useState<'simulation' | 'live'>('simulation');
  const [tradingLogs, setTradingLogs] = useState<string[]>([]);
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

  const simulateMarketData = useCallback(() => {
    const basePrice = 45000;
    const variation = (Math.random() - 0.5) * 0.02;
    return {
      price: basePrice * (1 + variation),
      volume: Math.random() * 1000000 + 500000,
      trend: Math.random() > 0.5 ? 'up' : 'down',
    };
  }, []);

  const executeSimulatedTrade = useCallback((signal: 'buy' | 'sell', marketData: any) => {
    const tradeAmount = Math.min(config.maxPositionSize, simulationAccount.freeMargin * 0.1);
    const fillPrice = marketData.price * (1 + (Math.random() - 0.5) * 0.001);
    
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
        (marketData.price - fillPrice) * order.amount :
        (fillPrice - marketData.price) * order.amount;
      
      return {
        ...prev,
        orders: [order, ...prev.orders.slice(0, 49)],
        profit: prev.profit + profit,
        equity: prev.balance + prev.profit + profit,
      };
    });

    const profit = signal === 'buy' ? 
      (marketData.price - fillPrice) * order.amount :
      (fillPrice - marketData.price) * order.amount;
    const profitText = profit > 0 ? `盈利 $${profit.toFixed(2)}` : `亏损 $${Math.abs(profit).toFixed(2)}`;
    addLog(`模拟交易执行: ${signal.toUpperCase()} ${order.amount.toFixed(4)} ${config.symbol} @ $${fillPrice.toFixed(2)} - ${profitText}`);
  }, [config, simulationAccount, addLog]);

  const runTradingBot = useCallback(() => {
    const marketData = simulateMarketData();
    
    const shouldBuy = marketData.trend === 'up' && Math.random() > 0.7;
    const shouldSell = marketData.trend === 'down' && Math.random() > 0.7;
    
    if (shouldBuy) {
      if (tradingMode === 'simulation') {
        executeSimulatedTrade('buy', marketData);
      } else {
        addLog(`实盘买入信号: ${config.symbol} @ $${marketData.price.toFixed(2)}`);
      }
    } else if (shouldSell) {
      if (tradingMode === 'simulation') {
        executeSimulatedTrade('sell', marketData);
      } else {
        addLog(`实盘卖出信号: ${config.symbol} @ $${marketData.price.toFixed(2)}`);
      }
    }
  }, [tradingMode, config, simulateMarketData, executeSimulatedTrade, addLog]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (botRunning) {
      addLog(`交易机器人启动 - ${tradingMode === 'live' ? '实盘模式' : '模拟模式'}`);
      interval = setInterval(runTradingBot, 5000);
    } else if (interval) {
      clearInterval(interval);
      addLog('交易机器人已停止');
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [botRunning, runTradingBot, tradingMode, addLog]);

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
            AI自动交易机器人
          </h1>
          <p className="text-xl text-slate-300">
            24/7智能交易，让AI为您把握每一个市场机会
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
                <div className="space-y-4">
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
              </CardContent>
            </Card>
          </div>

          {/* Main Dashboard */}
          <div className="lg:col-span-3 space-y-6">
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
                  <span>账户表现</span>
                  <Badge variant="secondary">{tradingMode === 'live' ? '实盘' : '模拟'}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-slate-400">
                  <div className="text-center">
                    <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>性能图表将在此显示</p>
                    <p className="text-sm">启动机器人后开始记录数据</p>
                  </div>
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
                    <Activity className="w-5 h-5 text-blue-400" />
                    <span>交易日志</span>
                    <Badge variant="secondary">{tradingMode === 'live' ? '实盘' : '模拟'}</Badge>
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
                      暂无交易日志
                    </div>
                  ) : (
                    tradingLogs.map((log, index) => (
                      <div key={index} className={`text-sm p-2 glassmorphism rounded ${
                        log.includes('盈利') ? 'border-l-4 border-green-400 text-green-300' :
                        log.includes('亏损') ? 'border-l-4 border-red-400 text-red-300' :
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