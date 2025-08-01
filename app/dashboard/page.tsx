'use client';

import { useState, useEffect } from 'react';
import { User, Settings, Shield, CreditCard, TrendingUp, Activity, Target, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function DashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalTrades: 156,
    profitableTrades: 112,
    totalProfit: 2450.75,
    winRate: 71.8,
    accuracy: 74.2,
    activeStrategies: 3,
  });

  const performanceData = [
    { name: '成功交易', value: 112, color: '#10b981' },
    { name: '亏损交易', value: 44, color: '#ef4444' },
  ];

  const monthlyData = [
    { month: '1月', profit: 320, trades: 24 },
    { month: '2月', profit: 485, trades: 31 },
    { month: '3月', profit: 392, trades: 28 },
    { month: '4月', profit: 567, trades: 35 },
    { month: '5月', profit: 428, trades: 29 },
    { month: '6月', profit: 278, trades: 19 },
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center">
        <Card className="glassmorphism max-w-md">
          <CardContent className="p-8 text-center">
            <User className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">需要登录</h2>
            <p className="text-slate-400 mb-6">请先登录以访问用户中心</p>
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <a href="/auth/login">立即登录</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('个人信息已更新');
    } catch (error) {
      toast.error('更新失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', name: '概览', icon: TrendingUp },
    { id: 'profile', name: '个人信息', icon: User },
    { id: 'security', name: '安全设置', icon: Shield },
    { id: 'subscription', name: '订阅管理', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
            用户中心
          </h1>
          <p className="text-xl text-slate-300">
            管理您的账户和交易设置
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="glassmorphism">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg">{user.email}</h3>
                  <Badge variant="secondary" className="mt-2">
                    {user.subscription === 'premium' ? '高级版用户' : '免费版用户'}
                  </Badge>
                </div>

                <nav className="space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                          activeTab === tab.id
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-300 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{tab.name}</span>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid md:grid-cols-4 gap-6">
                  <Card className="glassmorphism">
                    <CardContent className="p-6 text-center">
                      <Activity className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                      <div className="text-2xl font-bold">{stats.totalTrades}</div>
                      <div className="text-sm text-slate-400">总交易次数</div>
                    </CardContent>
                  </Card>

                  <Card className="glassmorphism">
                    <CardContent className="p-6 text-center">
                      <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-3" />
                      <div className="text-2xl font-bold text-green-400">${stats.totalProfit}</div>
                      <div className="text-sm text-slate-400">总收益</div>
                    </CardContent>
                  </Card>

                  <Card className="glassmorphism">
                    <CardContent className="p-6 text-center">
                      <Target className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                      <div className="text-2xl font-bold">{stats.winRate}%</div>
                      <div className="text-sm text-slate-400">胜率</div>
                    </CardContent>
                  </Card>

                  <Card className="glassmorphism">
                    <CardContent className="p-6 text-center">
                      <Award className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
                      <div className="text-2xl font-bold">{stats.accuracy}%</div>
                      <div className="text-sm text-slate-400">预测准确率</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid lg:grid-cols-2 gap-6">
                  <Card className="glassmorphism">
                    <CardHeader>
                      <CardTitle>交易分布</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={performanceData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={90}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {performanceData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex justify-center space-x-6 mt-4">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                          <span className="text-sm text-slate-400">成功交易</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
                          <span className="text-sm text-slate-400">亏损交易</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glassmorphism">
                    <CardHeader>
                      <CardTitle>月度收益</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="month" stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'rgba(30, 41, 59, 0.95)', 
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '8px'
                              }} 
                            />
                            <Bar dataKey="profit" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity */}
                <Card className="glassmorphism">
                  <CardHeader>
                    <CardTitle>最近活动</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { action: 'BTC买入交易执行', time: '2小时前', profit: '+$45.20', status: 'success' },
                        { action: 'ETH预测分析完成', time: '4小时前', confidence: '82%', status: 'info' },
                        { action: 'SOL卖出交易执行', time: '6小时前', profit: '+$28.50', status: 'success' },
                        { action: '交易机器人启动', time: '1天前', status: 'info' },
                      ].map((activity, index) => (
                        <div key={index} className="flex items-center justify-between p-4 glassmorphism rounded-lg">
                          <div>
                            <div className="font-medium">{activity.action}</div>
                            <div className="text-sm text-slate-400">{activity.time}</div>
                          </div>
                          <div className="text-right">
                            {activity.profit && (
                              <div className="text-green-400 font-semibold">{activity.profit}</div>
                            )}
                            {activity.confidence && (
                              <div className="text-blue-400 font-semibold">{activity.confidence}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'profile' && (
              <Card className="glassmorphism">
                <CardHeader>
                  <CardTitle>个人信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="email">邮箱地址</Label>
                      <Input
                        id="email"
                        value={user.email}
                        disabled
                        className="glassmorphism border-white/20 mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="created">注册时间</Label>
                      <Input
                        id="created"
                        value={new Date(user.created_at).toLocaleDateString('zh-CN')}
                        disabled
                        className="glassmorphism border-white/20 mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="timezone">时区设置</Label>
                    <Input
                      id="timezone"
                      value="Asia/Shanghai (UTC+8)"
                      className="glassmorphism border-white/20 mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="language">语言偏好</Label>
                    <Input
                      id="language"
                      value="简体中文"
                      className="glassmorphism border-white/20 mt-1"
                    />
                  </div>

                  <Button 
                    onClick={handleSaveProfile}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? '保存中...' : '保存更改'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {activeTab === 'security' && (
              <Card className="glassmorphism">
                <CardHeader>
                  <CardTitle>安全设置</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">双因素认证</h4>
                        <p className="text-sm text-slate-400">为您的账户添加额外的安全层</p>
                      </div>
                      <Switch />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">邮件通知</h4>
                        <p className="text-sm text-slate-400">重要活动的邮件提醒</p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">交易确认</h4>
                        <p className="text-sm text-slate-400">执行交易前需要确认</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/10">
                    <h4 className="font-medium mb-4">修改密码</h4>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="current-password">当前密码</Label>
                        <Input
                          id="current-password"
                          type="password"
                          className="glassmorphism border-white/20 mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="new-password">新密码</Label>
                        <Input
                          id="new-password"
                          type="password"
                          className="glassmorphism border-white/20 mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="confirm-password">确认新密码</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          className="glassmorphism border-white/20 mt-1"
                        />
                      </div>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        更新密码
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'subscription' && (
              <Card className="glassmorphism">
                <CardHeader>
                  <CardTitle>订阅管理</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-6 glassmorphism rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold">
                          {user.subscription === 'premium' ? '高级版' : '免费版'}
                        </h3>
                        <p className="text-slate-400">
                          {user.subscription === 'premium' 
                            ? '享受所有高级功能和无限制使用' 
                            : '基础功能，每日3次预测限制'
                          }
                        </p>
                      </div>
                      <Badge variant={user.subscription === 'premium' ? 'default' : 'secondary'}>
                        {user.subscription === 'premium' ? '已激活' : '基础版'}
                      </Badge>
                    </div>

                    {user.subscription === 'premium' ? (
                      <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">续费日期:</span>
                          <span>2025-08-28</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">月费:</span>
                          <span>$29.00</span>
                        </div>
                        <Button variant="outline" className="w-full glassmorphism border-white/20">
                          管理订阅
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="text-sm text-slate-400">
                          升级到高级版以解锁全部功能
                        </div>
                        <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                          <a href="/pricing">立即升级</a>
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">使用统计</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>今日预测次数</span>
                          <span>2/3</span>
                        </div>
                        <Progress value={67} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>月度交易量</span>
                          <span>$12,500</span>
                        </div>
                        <Progress value={45} className="h-2" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}