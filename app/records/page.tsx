'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

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

export default function RecordsPage() {
  const { user } = useAuth();
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center">
        <Card className="glassmorphism max-w-md">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">需要登录</h2>
            <p className="text-slate-400 mb-6">请先登录以查看交易记录</p>
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
            交易记录
          </h1>
          <p className="text-xl text-slate-300">
            查看您的所有交易历史和统计数据
          </p>
        </div>

        {/* Status Bar */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
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

          <Card className="glassmorphism">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-400 mb-1">{stats.profitableTrades}</div>
              <div className="text-sm text-slate-400">盈利交易</div>
            </CardContent>
          </Card>
        </div>

        {/* Trading Logs */}
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
  );
}