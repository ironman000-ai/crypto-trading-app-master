'use client';

import { useState, useEffect } from 'react';
import { Bot, Play, Pause, Settings, TrendingUp, AlertTriangle, Activity, DollarSign, Target, BarChart3, RefreshCw, Eye, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import axios from 'axios';

interface BotSettings {
  amount: number;
  stopLoss: number;
  takeProfit: number;
  confidenceThreshold: number;
  maxDailyTrades: number;
  coins: string[];
}

interface TradeLog {
  id: string;
  coin: string;
  action: 'buy' | 'sell';
  price: number;
  amount: number;
  profit?: number;
  confidence: number;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
  type: 'real' | 'simulation';
}

interface SimulationAccount {
  balance: number;
  initialBalance: number;
  totalProfit: number;
  totalLoss: number;
  positions: Position[];
}

interface Position {
  id: string;
  coin: string;
  amount: number;
  entryPrice: number;
  currentPrice: number;
  profit: number;
  timestamp: string;
}

interface MarketPrice {
  coin: string;
  price: number;
  change24h: number;
  volume: number;
}

export default function AutoTradePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('simulation');
  const [botActive, setBotActive] = useState(false);
  const [simulationBotActive, setSimulationBotActive] = useState(false);
  const [settings, setSettings] = useState<BotSettings>({
    amount: 10,
    stopLoss: 5,
    takeProfit: 10,
    confidenceThreshold: 70,
    maxDailyTrades: 10,
    coins: ['BTC'],
  });
  const [apiConnected, setApiConnected] = useState(false);
  const [tradeLogs, setTradeLogs] = useState<TradeLog[]>([]);
  const [simulationAccount, setSimulationAccount] = useState<SimulationAccount>({
    balance: 10000,
    initialBalance: 10000,
    totalProfit: 0,
    totalLoss: 0,
    positions: [],
  });
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [stats, setStats] = useState({
    totalTrades: 0,
    profitableTrades: 0,
    totalProfit: 0,
    winRate: 0,
  });
  const [simulationStats, setSimulationStats] = useState({
    totalTrades: 0,
    profitableTrades: 0,
    totalProfit: 0,
    winRate: 0,
    roi: 0,
  });

  const coins = [
    { value: 'BTC', label: 'Bitcoin (BTC)', id: 'bitcoin' },
    { value: 'ETH', label: 'Ethereum (ETH)', id: 'ethereum' },
    { value: 'BNB', label: 'BNB (BNB)', id: 'binancecoin' },
    { value: 'SOL', label: 'Solana (SOL)', id: 'solana' },
    { value: 'XRP', label: 'XRP (XRP)', id: 'ripple' },
    { value: 'ADA', label: 'Cardano (ADA)', id: 'cardano' },
    { value: 'AVAX', label: 'Avalanche (AVAX)', id: 'avalanche-2' },
    { value: 'DOGE', label: 'Dogecoin (DOGE)', id: 'dogecoin' },
    { value: 'DOT', label: 'Polkadot (DOT)', id: 'polkadot' },
    { value: 'MATIC', label: 'Polygon (MATIC)', id: 'matic-network' },
  ];

  // Fetch real-time market prices
  useEffect(() => {
    const fetchMarketPrices = async () => {
      try {
        const coinIds = coins.map(coin => coin.id).join(',');
        const response = await axios.get('/api/coingecko', {
          params: {
            path: 'coins/markets',
            vs_currency: 'usd',
            ids: coinIds,
            order: 'market_cap_desc',
            per_page: 10,
            page: 1,
            sparkline: false,
            price_change_percentage: '24h'
          }
        });

        const prices: MarketPrice[] = response.data.map((coin: any) => ({
          coin: coins.find(c => c.id === coin.id)?.value || coin.symbol.toUpperCase(),
          price: coin.current_price,
          change24h: coin.price_change_percentage_24h || 0,
          volume: coin.total_volume || 0,
        }));

        setMarketPrices(prices);
      } catch (error) {
        console.warn('Using fallback market prices');
        // Fallback prices
        const fallbackPrices: MarketPrice[] = [
          { coin: 'BTC', price: 45000, change24h: 2.5, volume: 25000000000 },
          { coin: 'ETH', price: 2800, change24h: 1.8, volume: 15000000000 },
          { coin: 'BNB', price: 320, change24h: -0.5, volume: 2000000000 },
          { coin: 'SOL', price: 95, change24h: 3.2, volume: 1500000000 },
          { coin: 'XRP', price: 0.52, change24h: 1.1, volume: 1200000000 },
          { coin: 'ADA', price: 0.45, change24h: -1.2, volume: 800000000 },
          { coin: 'AVAX', price: 28, change24h: 2.8, volume: 600000000 },
          { coin: 'DOGE', price: 0.08, change24h: 5.0, volume: 500000000 },
          { coin: 'DOT', price: 6.5, change24h: 1.5, volume: 400000000 },
          { coin: 'MATIC', price: 0.85, change24h: 0.8, volume: 350000000 },
        ];
        setMarketPrices(fallbackPrices);
      }
    };

    fetchMarketPrices();
    const interval = setInterval(fetchMarketPrices, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Update positions with current prices
  useEffect(() => {
    if (marketPrices.length > 0) {
      setSimulationAccount(prev => ({
        ...prev,
        positions: prev.positions.map(position => {
          const marketPrice = marketPrices.find(p => p.coin === position.coin);
          if (marketPrice) {
            const currentPrice = marketPrice.price;
            const profit = (currentPrice - position.entryPrice) * position.amount;
            return { ...position, currentPrice, profit };
          }
          return position;
        })
      }));
    }
  }, [marketPrices]);

  // Simulation bot logic
  useEffect(() => {
    if (!simulationBotActive || marketPrices.length === 0) return;

    const simulationInterval = setInterval(() => {
      // Simulate AI prediction and trading decision
      const selectedCoins = settings.coins.length > 0 ? settings.coins : ['BTC'];
      const randomCoin = selectedCoins[Math.floor(Math.random() * selectedCoins.length)];
      const marketPrice = marketPrices.find(p => p.coin === randomCoin);
      
      if (!marketPrice) return;

      // Simulate AI confidence (70-95%)
      const confidence = Math.floor(Math.random() * 25) + 70;
      
      if (confidence >= settings.confidenceThreshold) {
        // Decide buy or sell based on market trend and random factors
        const shouldBuy = marketPrice.change24h > 0 && Math.random() > 0.4;
        
        if (shouldBuy && simulationAccount.balance >= settings.amount) {
          // Execute buy order
          const amount = settings.amount / marketPrice.price;
          const newPosition: Position = {
            id: `pos_${Date.now()}`,
            coin: randomCoin,
            amount,
            entryPrice: marketPrice.price,
            currentPrice: marketPrice.price,
            profit: 0,
            timestamp: new Date().toISOString(),
          };

          const newTrade: TradeLog = {
            id: `sim_trade_${Date.now()}`,
            coin: randomCoin,
            action: 'buy',
            price: marketPrice.price,
            amount,
            confidence,
            timestamp: new Date().toISOString(),
            status: 'completed',
            type: 'simulation',
          };

          setSimulationAccount(prev => ({
            ...prev,
            balance: prev.balance - settings.amount,
            positions: [...prev.positions, newPosition],
          }));

          setTradeLogs(prev => [newTrade, ...prev]);
          toast.success(`模拟买入 ${randomCoin}: $${marketPrice.price.toFixed(2)}`);
        } else {
          // Check for sell opportunities
          const position = simulationAccount.positions.find(p => p.coin === randomCoin);
          if (position) {
            const currentProfit = (marketPrice.price - position.entryPrice) / position.entryPrice * 100;
            
            // Sell if profit target reached or stop loss triggered
            if (currentProfit >= settings.takeProfit || currentProfit <= -settings.stopLoss) {
              const sellValue = position.amount * marketPrice.price;
              const profit = sellValue - (position.amount * position.entryPrice);

              const newTrade: TradeLog = {
                id: `sim_trade_${Date.now()}`,
                coin: randomCoin,
                action: 'sell',
                price: marketPrice.price,
                amount: position.amount,
                profit,
                confidence,
                timestamp: new Date().toISOString(),
                status: 'completed',
                type: 'simulation',
              };

              setSimulationAccount(prev => ({
                ...prev,
                balance: prev.balance + sellValue,
                totalProfit: prev.totalProfit + (profit > 0 ? profit : 0),
                totalLoss: prev.totalLoss + (profit < 0 ? Math.abs(profit) : 0),
                positions: prev.positions.filter(p => p.id !== position.id),
              }));

              setTradeLogs(prev => [newTrade, ...prev]);
              toast.success(`模拟卖出 ${randomCoin}: $${marketPrice.price.toFixed(2)} (${profit > 0 ? '+' : ''}$${profit.toFixed(2)})`);
            }
          }
        }
      }
    }, 10000); // Execute every 10 seconds

    return () => clearInterval(simulationInterval);
  }, [simulationBotActive, marketPrices, settings, simulationAccount.balance, simulationAccount.positions]);

  // Calculate simulation statistics
  useEffect(() => {
    const simulationTrades = tradeLogs.filter(trade => trade.type === 'simulation');
    const profitableTrades = simulationTrades.filter(trade => trade.profit && trade.profit > 0).length;
    const totalProfit = simulationTrades.reduce((sum, trade) => sum + (trade.profit || 0), 0);
    const roi = ((simulationAccount.balance + simulationAccount.positions.reduce((sum, pos) => sum + (pos.amount * pos.currentPrice), 0) - simulationAccount.initialBalance) / simulationAccount.initialBalance) * 100;

    setSimulationStats({
      totalTrades: simulationTrades.length,
      profitableTrades,
      totalProfit,
      winRate: simulationTrades.length > 0 ? (profitableTrades / simulationTrades.length * 100) : 0,
      roi,
    });
  }, [tradeLogs, simulationAccount]);

  // Generate initial mock data for real trading
  useEffect(() => {
    if (!user) return;

    const generateMockLogs = () => {
      const logs: TradeLog[] = [];
      for (let i = 0; i < 5; i++) {
        const profit = (Math.random() - 0.4) * 50;
        logs.push({
          id: `real_trade_${i}`,
          coin: ['BTC', 'ETH', 'SOL'][Math.floor(Math.random() * 3)],
          action: Math.random() > 0.5 ? 'buy' : 'sell',
          price: Math.random() * 50000 + 40000,
          amount: Math.random() * 0.1 + 0.01,
          profit: profit,
          confidence: Math.floor(Math.random() * 30) + 70,
          timestamp: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
          status: 'completed',
          type: 'real',
        });
      }
      
      const realTrades = logs.filter(log => log.type === 'real');
      const profitable = realTrades.filter(log => log.profit && log.profit > 0).length;
      const totalProfit = realTrades.reduce((sum, log) => sum + (log.profit || 0), 0);
      
      setStats({
        totalTrades: realTrades.length,
        profitableTrades: profitable,
        totalProfit,
        winRate: realTrades.length > 0 ? (profitable / realTrades.length * 100) : 0,
      });

      setTradeLogs(prev => [...logs, ...prev]);
    };

    generateMockLogs();
  }, [user]);

  const handleStartBot = () => {
    if (!apiConnected) {
      toast.error('Please connect your exchange API first');
      return;
    }
    
    setBotActive(true);
    toast.success('Trading bot started successfully');
  };

  const handleStopBot = () => {
    setBotActive(false);
    toast.success('Trading bot stopped');
  };

  const handleStartSimulationBot = () => {
    setSimulationBotActive(true);
    toast.success('模拟交易机器人已启动');
  };

  const handleStopSimulationBot = () => {
    setSimulationBotActive(false);
    toast.success('模拟交易机器人已停止');
  };

  const handleConnectAPI = () => {
    setTimeout(() => {
      setApiConnected(true);
      toast.success('Exchange API connected successfully');
    }, 1000);
  };

  const resetSimulationAccount = () => {
    setSimulationAccount({
      balance: 10000,
      initialBalance: 10000,
      totalProfit: 0,
      totalLoss: 0,
      positions: [],
    });
    setTradeLogs(prev => prev.filter(trade => trade.type !== 'simulation'));
    toast.success('模拟账户已重置');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center">
        <Card className="glassmorphism max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
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
            自动交易控制台
          </h1>
          <p className="text-xl text-slate-300">
            24/7智能交易机器人，支持模拟交易和实盘交易
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 glassmorphism">
            <TabsTrigger value="simulation" className="flex items-center space-x-2">
              <Eye className="w-4 h-4" />
              <span>模拟交易</span>
            </TabsTrigger>
            <TabsTrigger value="real" className="flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>实盘交易</span>
            </TabsTrigger>
          </TabsList>

          {/* Simulation Trading */}
          <TabsContent value="simulation" className="space-y-8">
            {/* Simulation Status Bar */}
            <div className="grid md:grid-cols-5 gap-4">
              <Card className="glassmorphism">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <DollarSign className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="text-sm text-slate-400">账户余额</div>
                  <div className="text-lg font-bold text-green-400">
                    ${simulationAccount.balance.toFixed(2)}
                  </div>
                </CardContent>
              </Card>

              <Card className="glassmorphism">
                <CardContent className="p-4 text-center">
                  <div className="text-lg font-bold text-blue-400">{simulationStats.totalTrades}</div>
                  <div className="text-sm text-slate-400">总交易次数</div>
                </CardContent>
              </Card>

              <Card className="glassmorphism">
                <CardContent className="p-4 text-center">
                  <div className="text-lg font-bold text-purple-400">{simulationStats.winRate.toFixed(1)}%</div>
                  <div className="text-sm text-slate-400">胜率</div>
                </CardContent>
              </Card>

              <Card className="glassmorphism">
                <CardContent className="p-4 text-center">
                  <div className={`text-lg font-bold ${simulationStats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${simulationStats.totalProfit.toFixed(2)}
                  </div>
                  <div className="text-sm text-slate-400">总盈亏</div>
                </CardContent>
              </Card>

              <Card className="glassmorphism">
                <CardContent className="p-4 text-center">
                  <div className={`text-lg font-bold ${simulationStats.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {simulationStats.roi.toFixed(2)}%
                  </div>
                  <div className="text-sm text-slate-400">投资回报率</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-4 gap-8">
              {/* Simulation Controls */}
              <div className="lg:col-span-1 space-y-6">
                <Card className="glassmorphism">
                  <CardHeader>
                    <CardTitle>模拟交易控制</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">模拟机器人</div>
                        <div className="text-sm text-slate-400">启用AI模拟交易</div>
                      </div>
                      <Switch
                        checked={simulationBotActive}
                        onCheckedChange={simulationBotActive ? handleStopSimulationBot : handleStartSimulationBot}
                      />
                    </div>

                    {simulationBotActive && (
                      <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                        <div className="flex items-center space-x-2 mb-2">
                          <Activity className="w-4 h-4 text-green-400 animate-pulse" />
                          <span className="text-green-400 font-medium">模拟交易运行中</span>
                        </div>
                        <p className="text-sm text-slate-400">
                          正在使用实时数据进行模拟交易，观察AI策略表现
                        </p>
                      </div>
                    )}

                    <Button
                      onClick={resetSimulationAccount}
                      variant="outline"
                      className="w-full glassmorphism border-white/20"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      重置模拟账户
                    </Button>
                  </CardContent>
                </Card>

                {/* Current Positions */}
                <Card className="glassmorphism">
                  <CardHeader>
                    <CardTitle>当前持仓</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {simulationAccount.positions.length === 0 ? (
                      <div className="text-center py-4 text-slate-400">
                        暂无持仓
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {simulationAccount.positions.map((position) => (
                          <div key={position.id} className="p-3 glassmorphism rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">{position.coin}</span>
                              <Badge variant={position.profit >= 0 ? 'default' : 'destructive'}>
                                {position.profit >= 0 ? '+' : ''}${position.profit.toFixed(2)}
                              </Badge>
                            </div>
                            <div className="text-sm text-slate-400">
                              <div>数量: {position.amount.toFixed(6)}</div>
                              <div>成本: ${position.entryPrice.toFixed(2)}</div>
                              <div>现价: ${position.currentPrice.toFixed(2)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Market Prices */}
                <Card className="glassmorphism">
                  <CardHeader>
                    <CardTitle>实时行情</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {marketPrices.slice(0, 5).map((price) => (
                        <div key={price.coin} className="flex justify-between items-center text-sm">
                          <span className="font-medium">{price.coin}</span>
                          <div className="text-right">
                            <div>${price.price.toLocaleString()}</div>
                            <div className={`text-xs ${price.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {price.change24h >= 0 ? '+' : ''}{price.change24h.toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Simulation Trading Logs */}
              <div className="lg:col-span-3">
                <Card className="glassmorphism">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="w-5 h-5" />
                      <span>模拟交易记录</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {tradeLogs.filter(log => log.type === 'simulation').length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                          暂无模拟交易记录，启动模拟机器人开始交易
                        </div>
                      ) : (
                        tradeLogs
                          .filter(log => log.type === 'simulation')
                          .slice(0, 20)
                          .map((log) => (
                            <div key={log.id} className="flex items-center justify-between p-4 glassmorphism rounded-lg">
                              <div className="flex items-center space-x-4">
                                <Badge variant={log.action === 'buy' ? 'default' : 'destructive'}>
                                  {log.action === 'buy' ? '买入' : '卖出'}
                                </Badge>
                                <div>
                                  <div className="font-medium">{log.coin}</div>
                                  <div className="text-sm text-slate-400">
                                    {new Date(log.timestamp).toLocaleString('zh-CN')}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="text-right">
                                <div className="font-medium">
                                  ${log.price.toLocaleString()} × {log.amount.toFixed(6)}
                                </div>
                                {log.profit !== undefined && (
                                  <div className={`text-sm ${log.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {log.profit >= 0 ? '+' : ''}${log.profit.toFixed(2)}
                                  </div>
                                )}
                              </div>
                              
                              <div className="text-right">
                                <div className="text-sm text-slate-400">置信度</div>
                                <div className="font-medium">{log.confidence}%</div>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Real Trading */}
          <TabsContent value="real" className="space-y-8">
            {/* Real Trading Status Bar */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="glassmorphism">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Bot className={`w-6 h-6 ${botActive ? 'text-green-400' : 'text-gray-400'}`} />
                  </div>
                  <div className="text-sm text-slate-400">机器人状态</div>
                  <div className={`font-semibold ${botActive ? 'text-green-400' : 'text-gray-400'}`}>
                    {botActive ? '运行中' : '已停止'}
                  </div>
                </CardContent>
              </Card>

              <Card className="glassmorphism">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-1">{stats.totalTrades}</div>
                  <div className="text-sm text-slate-400">总交易次数</div>
                </CardContent>
              </Card>

              <Card className="glassmorphism">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-400 mb-1">{stats.winRate.toFixed(1)}%</div>
                  <div className="text-sm text-slate-400">胜率</div>
                </CardContent>
              </Card>

              <Card className="glassmorphism">
                <CardContent className="p-4 text-center">
                  <div className={`text-2xl font-bold mb-1 ${stats.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${stats.totalProfit.toFixed(2)}
                  </div>
                  <div className="text-sm text-slate-400">总盈亏</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Real Trading Controls */}
              <div className="lg:col-span-1 space-y-6">
                {/* API Connection */}
                <Card className="glassmorphism">
                  <CardHeader>
                    <CardTitle>交易所API连接</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!apiConnected ? (
                      <>
                        <div>
                          <Label htmlFor="api-key">API Key</Label>
                          <Input 
                            id="api-key" 
                            type="password" 
                            placeholder="输入您的API Key"
                            className="glassmorphism border-white/20 mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="api-secret">API Secret</Label>
                          <Input 
                            id="api-secret" 
                            type="password" 
                            placeholder="输入您的API Secret"
                            className="glassmorphism border-white/20 mt-1"
                          />
                        </div>
                        <Button onClick={handleConnectAPI} className="w-full bg-blue-600 hover:bg-blue-700">
                          连接API
                        </Button>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <div className="w-12 h-12 bg-green-400/20 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Bot className="w-6 h-6 text-green-400" />
                        </div>
                        <p className="text-green-400 font-semibold">API已连接</p>
                        <p className="text-sm text-slate-400">可以开始实盘交易</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Bot Control */}
                <Card className="glassmorphism">
                  <CardHeader>
                    <CardTitle>机器人控制</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">自动交易</div>
                        <div className="text-sm text-slate-400">启用AI驱动的自动交易</div>
                      </div>
                      <Switch
                        checked={botActive}
                        onCheckedChange={botActive ? handleStopBot : handleStartBot}
                        disabled={!apiConnected}
                      />
                    </div>

                    {botActive && (
                      <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                        <div className="flex items-center space-x-2 mb-2">
                          <Activity className="w-4 h-4 text-green-400 animate-pulse" />
                          <span className="text-green-400 font-medium">机器人运行中</span>
                        </div>
                        <p className="text-sm text-slate-400">
                          正在监控市场信号，当满足条件时将自动执行交易
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Trading Settings */}
                <Card className="glassmorphism">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="w-5 h-5" />
                      <span>交易设置</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="amount">单次交易金额 (USDT)</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={settings.amount}
                        onChange={(e) => setSettings({...settings, amount: Number(e.target.value)})}
                        className="glassmorphism border-white/20 mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="stop-loss">止损百分比 (%)</Label>
                      <Input
                        id="stop-loss"
                        type="number"
                        value={settings.stopLoss}
                        onChange={(e) => setSettings({...settings, stopLoss: Number(e.target.value)})}
                        className="glassmorphism border-white/20 mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="take-profit">止盈百分比 (%)</Label>
                      <Input
                        id="take-profit"
                        type="number"
                        value={settings.takeProfit}
                        onChange={(e) => setSettings({...settings, takeProfit: Number(e.target.value)})}
                        className="glassmorphism border-white/20 mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="confidence">最低置信度 (%)</Label>
                      <Input
                        id="confidence"
                        type="number"
                        value={settings.confidenceThreshold}
                        onChange={(e) => setSettings({...settings, confidenceThreshold: Number(e.target.value)})}
                        className="glassmorphism border-white/20 mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="max-trades">每日最大交易次数</Label>
                      <Input
                        id="max-trades"
                        type="number"
                        value={settings.maxDailyTrades}
                        onChange={(e) => setSettings({...settings, maxDailyTrades: Number(e.target.value)})}
                        className="glassmorphism border-white/20 mt-1"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Real Trading Logs */}
              <div className="lg:col-span-2">
                <Card className="glassmorphism">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5" />
                      <span>实盘交易记录</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {tradeLogs.filter(log => log.type === 'real').length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                          暂无实盘交易记录
                        </div>
                      ) : (
                        tradeLogs
                          .filter(log => log.type === 'real')
                          .map((log) => (
                            <div key={log.id} className="flex items-center justify-between p-4 glassmorphism rounded-lg">
                              <div className="flex items-center space-x-4">
                                <Badge variant={log.action === 'buy' ? 'default' : 'destructive'}>
                                  {log.action === 'buy' ? '买入' : '卖出'}
                                </Badge>
                                <div>
                                  <div className="font-medium">{log.coin}</div>
                                  <div className="text-sm text-slate-400">
                                    {new Date(log.timestamp).toLocaleString('zh-CN')}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="text-right">
                                <div className="font-medium">
                                  ${log.price.toLocaleString()} × {log.amount.toFixed(4)}
                                </div>
                                {log.profit && (
                                  <div className={`text-sm ${log.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {log.profit >= 0 ? '+' : ''}${log.profit.toFixed(2)}
                                  </div>
                                )}
                              </div>
                              
                              <div className="text-right">
                                <div className="text-sm text-slate-400">置信度</div>
                                <div className="font-medium">{log.confidence}%</div>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}