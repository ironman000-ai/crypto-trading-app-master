'use client';

import { useState, useEffect } from 'react';
import { Bot, Play, Pause, Settings, TrendingUp, AlertTriangle, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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
}

export default function AutoTradePage() {
  const { user } = useAuth();
  const [botActive, setBotActive] = useState(false);
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
  const [stats, setStats] = useState({
    totalTrades: 0,
    profitableTrades: 0,
    totalProfit: 0,
    winRate: 0,
  });

  useEffect(() => {
    if (!user) return;

    // Generate mock trade logs
    const generateMockLogs = () => {
      const logs: TradeLog[] = [];
      for (let i = 0; i < 10; i++) {
        const profit = (Math.random() - 0.4) * 50; // Bias towards profit
        logs.push({
          id: `trade_${i}`,
          coin: ['BTC', 'ETH', 'SOL'][Math.floor(Math.random() * 3)],
          action: Math.random() > 0.5 ? 'buy' : 'sell',
          price: Math.random() * 50000 + 40000,
          amount: Math.random() * 0.1 + 0.01,
          profit: profit,
          confidence: Math.floor(Math.random() * 30) + 70,
          timestamp: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
          status: 'completed',
        });
      }
      setTradeLogs(logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      
      // Calculate stats
      const profitable = logs.filter(log => log.profit && log.profit > 0).length;
      const totalProfit = logs.reduce((sum, log) => sum + (log.profit || 0), 0);
      
      setStats({
        totalTrades: logs.length,
        profitableTrades: profitable,
        totalProfit,
        winRate: logs.length > 0 ? (profitable / logs.length * 100) : 0,
      });
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

  const handleConnectAPI = () => {
    // Simulate API connection
    setTimeout(() => {
      setApiConnected(true);
      toast.success('Exchange API connected successfully');
    }, 1000);
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
            24/7智能交易机器人，让AI为您执行交易策略
          </p>
        </div>

        {/* Status Bar */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
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
          {/* Bot Controls */}
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
                    <p className="text-sm text-slate-400">可以开始自动交易</p>
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

          {/* Trading Logs */}
          <div className="lg:col-span-2">
            <Card className="glassmorphism">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>交易记录</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tradeLogs.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      暂无交易记录
                    </div>
                  ) : (
                    tradeLogs.map((log) => (
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
      </div>
    </div>
  );
}