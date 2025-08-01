'use client';

import { useState, useEffect } from 'react';
import { Shield, DollarSign, TrendingUp, TrendingDown, Activity, AlertTriangle, Zap, Target, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface OKXBalance {
  ccy: string;
  bal: string;
  frozenBal: string;
  availBal: string;
}

interface OKXPosition {
  instId: string;
  pos: string;
  avgPx: string;
  upl: string;
  uplRatio: string;
  markPx: string;
}

interface OKXOrder {
  instId: string;
  ordId: string;
  side: string;
  sz: string;
  px: string;
  state: string;
  fillSz: string;
  avgPx: string;
  fee: string;
  cTime: string;
}

interface OKXTicker {
  instId: string;
  last: string;
  askPx: string;
  bidPx: string;
  open24h: string;
  high24h: string;
  low24h: string;
  vol24h: string;
  volCcy24h: string;
}

export default function OKXTradingPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(false);
  const [balances, setBalances] = useState<OKXBalance[]>([]);
  const [positions, setPositions] = useState<OKXPosition[]>([]);
  const [orders, setOrders] = useState<OKXOrder[]>([]);
  const [tickers, setTickers] = useState<OKXTicker[]>([]);
  const [selectedPair, setSelectedPair] = useState('BTC-USDT');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy');
  const [orderAmount, setOrderAmount] = useState('');
  const [orderPrice, setOrderPrice] = useState('');

  // 热门交易对
  const popularPairs = [
    'BTC-USDT', 'ETH-USDT', 'BNB-USDT', 'SOL-USDT', 
    'XRP-USDT', 'ADA-USDT', 'AVAX-USDT', 'DOGE-USDT'
  ];

  useEffect(() => {
    if (user) {
      fetchAccountData();
      fetchMarketData();
    }
  }, [user]);

  const fetchAccountData = async () => {
    try {
      setLoading(true);
      
      const [accountRes, positionsRes, ordersRes] = await Promise.all([
        fetch('/api/okx?action=account'),
        fetch('/api/okx?action=positions'),
        fetch('/api/okx?action=orders')
      ]);

      if (accountRes.ok) {
        const accountData = await accountRes.json();
        setBalances(accountData.data.balance || []);
      }

      if (positionsRes.ok) {
        const positionsData = await positionsRes.json();
        setPositions(positionsData.data || []);
      }

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData.data || []);
      }

    } catch (error) {
      console.error('获取账户数据失败:', error);
      toast.error('获取账户数据失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchMarketData = async () => {
    try {
      const response = await fetch('/api/okx?action=tickers');
      if (response.ok) {
        const data = await response.json();
        // 只显示热门交易对
        const filteredTickers = data.data.filter((ticker: OKXTicker) => 
          popularPairs.includes(ticker.instId)
        );
        setTickers(filteredTickers);
      }
    } catch (error) {
      console.error('获取市场数据失败:', error);
    }
  };

  const handlePlaceOrder = async () => {
    if (!orderAmount) {
      toast.error('请输入交易数量');
      return;
    }

    if (orderType === 'limit' && !orderPrice) {
      toast.error('限价单请输入价格');
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        instId: selectedPair,
        side: orderSide,
        ordType: orderType,
        sz: orderAmount,
        ...(orderType === 'limit' && { px: orderPrice })
      };

      const response = await fetch('/api/okx?action=place-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`${orderSide === 'buy' ? '买入' : '卖出'}订单提交成功！`);
        setOrderAmount('');
        setOrderPrice('');
        fetchAccountData(); // 刷新账户数据
      } else {
        toast.error(`下单失败: ${result.details}`);
      }

    } catch (error) {
      console.error('下单失败:', error);
      toast.error('下单失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (ordId: string, instId: string) => {
    try {
      const response = await fetch('/api/okx?action=cancel-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ordId, instId })
      });

      const result = await response.json();

      if (result.success) {
        toast.success('订单撤销成功！');
        fetchAccountData();
      } else {
        toast.error(`撤销失败: ${result.details}`);
      }

    } catch (error) {
      console.error('撤销订单失败:', error);
      toast.error('撤销订单失败');
    }
  };

  const formatNumber = (num: string | number, decimals: number = 4) => {
    const n = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(n)) return '0';
    return n.toFixed(decimals);
  };

  const formatCurrency = (num: string | number) => {
    const n = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(n)) return '$0';
    return `$${n.toLocaleString()}`;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center">
        <Card className="glassmorphism max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 text-blue-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">需要登录</h2>
            <p className="text-slate-400 mb-6">请先登录以使用OKX真实交易功能</p>
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
            🔥 OKX真实交易
          </h1>
          <p className="text-xl text-slate-300">
            连接您的OKX账户，开始AI驱动的真实交易
          </p>
          <div className="flex items-center justify-center space-x-2 mt-4">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-400">OKX API已连接 - 真实交易模式</span>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 glassmorphism">
            <TabsTrigger value="account">账户概览</TabsTrigger>
            <TabsTrigger value="trading">交易下单</TabsTrigger>
            <TabsTrigger value="positions">持仓管理</TabsTrigger>
            <TabsTrigger value="orders">订单管理</TabsTrigger>
            <TabsTrigger value="market">市场行情</TabsTrigger>
          </TabsList>

          {/* 账户概览 */}
          <TabsContent value="account" className="space-y-6">
            <div className="grid md:grid-cols-4 gap-6">
              <Card className="glassmorphism">
                <CardContent className="p-6 text-center">
                  <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-3" />
                  <div className="text-2xl font-bold">
                    {formatCurrency(balances.find(b => b.ccy === 'USDT')?.availBal || '0')}
                  </div>
                  <div className="text-sm text-slate-400">可用USDT</div>
                </CardContent>
              </Card>

              <Card className="glassmorphism">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                  <div className="text-2xl font-bold">{positions.length}</div>
                  <div className="text-sm text-slate-400">持仓数量</div>
                </CardContent>
              </Card>

              <Card className="glassmorphism">
                <CardContent className="p-6 text-center">
                  <Activity className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                  <div className="text-2xl font-bold">{orders.length}</div>
                  <div className="text-sm text-slate-400">活跃订单</div>
                </CardContent>
              </Card>

              <Card className="glassmorphism">
                <CardContent className="p-6 text-center">
                  <Target className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
                  <div className="text-2xl font-bold">
                    {formatCurrency(
                      positions.reduce((sum, pos) => sum + parseFloat(pos.upl || '0'), 0)
                    )}
                  </div>
                  <div className="text-sm text-slate-400">未实现盈亏</div>
                </CardContent>
              </Card>
            </div>

            {/* 余额详情 */}
            <Card className="glassmorphism">
              <CardHeader>
                <CardTitle>账户余额</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <Activity className="w-8 h-8 mx-auto mb-4 text-blue-400 animate-spin" />
                    <p className="text-slate-400">加载账户数据中...</p>
                  </div>
                ) : balances.length > 0 ? (
                  <div className="space-y-3">
                    {balances
                      .filter(balance => parseFloat(balance.bal) > 0)
                      .map((balance, index) => (
                        <div key={index} className="flex items-center justify-between p-3 glassmorphism rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-white">
                                {balance.ccy.slice(0, 2)}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium">{balance.ccy}</div>
                              <div className="text-xs text-slate-400">
                                冻结: {formatNumber(balance.frozenBal)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{formatNumber(balance.availBal)}</div>
                            <div className="text-xs text-slate-400">
                              总计: {formatNumber(balance.bal)}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    暂无余额数据
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 交易下单 */}
          <TabsContent value="trading" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="glassmorphism">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-blue-400" />
                    <span>快速下单</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>交易对</Label>
                    <Select value={selectedPair} onValueChange={setSelectedPair}>
                      <SelectTrigger className="glassmorphism border-white/20 mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glassmorphism">
                        {popularPairs.map((pair) => (
                          <SelectItem key={pair} value={pair}>
                            {pair}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>订单类型</Label>
                      <Select value={orderType} onValueChange={(value: 'market' | 'limit') => setOrderType(value)}>
                        <SelectTrigger className="glassmorphism border-white/20 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="glassmorphism">
                          <SelectItem value="market">市价单</SelectItem>
                          <SelectItem value="limit">限价单</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>交易方向</Label>
                      <Select value={orderSide} onValueChange={(value: 'buy' | 'sell') => setOrderSide(value)}>
                        <SelectTrigger className="glassmorphism border-white/20 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="glassmorphism">
                          <SelectItem value="buy">买入</SelectItem>
                          <SelectItem value="sell">卖出</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>交易数量</Label>
                    <Input
                      type="number"
                      placeholder="输入交易数量"
                      value={orderAmount}
                      onChange={(e) => setOrderAmount(e.target.value)}
                      className="glassmorphism border-white/20 mt-1"
                    />
                  </div>

                  {orderType === 'limit' && (
                    <div>
                      <Label>限价价格</Label>
                      <Input
                        type="number"
                        placeholder="输入限价价格"
                        value={orderPrice}
                        onChange={(e) => setOrderPrice(e.target.value)}
                        className="glassmorphism border-white/20 mt-1"
                      />
                    </div>
                  )}

                  <Button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className={`w-full ${
                      orderSide === 'buy' 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-red-600 hover:bg-red-700'
                    } glow-effect`}
                  >
                    {loading ? (
                      <>
                        <Activity className="w-4 h-4 mr-2 animate-spin" />
                        下单中...
                      </>
                    ) : (
                      <>
                        <Target className="w-4 h-4 mr-2" />
                        {orderSide === 'buy' ? '买入' : '卖出'} {selectedPair}
                      </>
                    )}
                  </Button>

                  <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm font-medium text-yellow-400">风险提示</span>
                    </div>
                    <p className="text-xs text-slate-300">
                      这是真实的OKX交易，将使用您的真实资金。请确认交易参数无误后再提交订单。
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* 当前选中交易对信息 */}
              <Card className="glassmorphism">
                <CardHeader>
                  <CardTitle>{selectedPair} 实时行情</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const ticker = tickers.find(t => t.instId === selectedPair);
                    if (!ticker) {
                      return (
                        <div className="text-center py-8 text-slate-400">
                          <BarChart3 className="w-8 h-8 mx-auto mb-2" />
                          <p>加载行情数据中...</p>
                        </div>
                      );
                    }

                    const priceChange = parseFloat(ticker.last) - parseFloat(ticker.open24h);
                    const priceChangePercent = (priceChange / parseFloat(ticker.open24h)) * 100;

                    return (
                      <div className="space-y-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold mb-2">
                            ${formatNumber(ticker.last, 2)}
                          </div>
                          <div className={`flex items-center justify-center space-x-2 ${
                            priceChange >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {priceChange >= 0 ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : (
                              <TrendingDown className="w-4 h-4" />
                            )}
                            <span>
                              {priceChange >= 0 ? '+' : ''}{formatNumber(priceChange, 2)} 
                              ({priceChangePercent >= 0 ? '+' : ''}{formatNumber(priceChangePercent, 2)}%)
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 glassmorphism rounded-lg">
                            <div className="text-sm text-slate-400 mb-1">24h最高</div>
                            <div className="font-medium text-green-400">
                              ${formatNumber(ticker.high24h, 2)}
                            </div>
                          </div>
                          <div className="text-center p-3 glassmorphism rounded-lg">
                            <div className="text-sm text-slate-400 mb-1">24h最低</div>
                            <div className="font-medium text-red-400">
                              ${formatNumber(ticker.low24h, 2)}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 glassmorphism rounded-lg">
                            <div className="text-sm text-slate-400 mb-1">买一价</div>
                            <div className="font-medium text-green-400">
                              ${formatNumber(ticker.bidPx, 2)}
                            </div>
                          </div>
                          <div className="text-center p-3 glassmorphism rounded-lg">
                            <div className="text-sm text-slate-400 mb-1">卖一价</div>
                            <div className="font-medium text-red-400">
                              ${formatNumber(ticker.askPx, 2)}
                            </div>
                          </div>
                        </div>

                        <div className="text-center p-3 glassmorphism rounded-lg">
                          <div className="text-sm text-slate-400 mb-1">24h成交量</div>
                          <div className="font-medium">
                            {formatNumber(ticker.vol24h)} {selectedPair.split('-')[0]}
                          </div>
                          <div className="text-xs text-slate-500">
                            ≈ {formatCurrency(ticker.volCcy24h)}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 持仓管理 */}
          <TabsContent value="positions" className="space-y-6">
            <Card className="glassmorphism">
              <CardHeader>
                <CardTitle>当前持仓</CardTitle>
              </CardHeader>
              <CardContent>
                {positions.length > 0 ? (
                  <div className="space-y-3">
                    {positions.map((position, index) => {
                      const upl = parseFloat(position.upl || '0');
                      const uplRatio = parseFloat(position.uplRatio || '0');
                      
                      return (
                        <div key={index} className="flex items-center justify-between p-4 glassmorphism rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div>
                              <div className="font-medium text-lg">{position.instId}</div>
                              <div className="text-sm text-slate-400">
                                持仓: {formatNumber(position.pos)} | 均价: ${formatNumber(position.avgPx)}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${upl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {upl >= 0 ? '+' : ''}${formatNumber(upl, 2)}
                            </div>
                            <div className={`text-sm ${uplRatio >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {uplRatio >= 0 ? '+' : ''}{formatNumber(uplRatio, 2)}%
                            </div>
                            <div className="text-xs text-slate-400">
                              标记价: ${formatNumber(position.markPx)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    暂无持仓
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 订单管理 */}
          <TabsContent value="orders" className="space-y-6">
            <Card className="glassmorphism">
              <CardHeader>
                <CardTitle>活跃订单</CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length > 0 ? (
                  <div className="space-y-3">
                    {orders.map((order, index) => (
                      <div key={index} className="flex items-center justify-between p-4 glassmorphism rounded-lg">
                        <div className="flex items-center space-x-4">
                          <Badge variant={order.side === 'buy' ? 'default' : 'destructive'}>
                            {order.side === 'buy' ? '买入' : '卖出'}
                          </Badge>
                          <div>
                            <div className="font-medium">{order.instId}</div>
                            <div className="text-sm text-slate-400">
                              数量: {formatNumber(order.sz)} | 价格: ${formatNumber(order.px)}
                            </div>
                            <div className="text-xs text-slate-500">
                              {new Date(parseInt(order.cTime)).toLocaleString('zh-CN')}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline">
                            {order.state === 'live' ? '待成交' : 
                             order.state === 'partially_filled' ? '部分成交' : 
                             order.state === 'filled' ? '已成交' : '已取消'}
                          </Badge>
                          {order.state === 'live' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCancelOrder(order.ordId, order.instId)}
                              className="text-red-400 border-red-400 hover:bg-red-400/10"
                            >
                              撤销
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    暂无活跃订单
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 市场行情 */}
          <TabsContent value="market" className="space-y-6">
            <Card className="glassmorphism">
              <CardHeader>
                <CardTitle>热门交易对</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {tickers.map((ticker, index) => {
                    const priceChange = parseFloat(ticker.last) - parseFloat(ticker.open24h);
                    const priceChangePercent = (priceChange / parseFloat(ticker.open24h)) * 100;
                    
                    return (
                      <div 
                        key={index} 
                        className={`p-4 glassmorphism rounded-lg cursor-pointer transition-all hover:scale-105 ${
                          selectedPair === ticker.instId ? 'ring-2 ring-blue-400' : ''
                        }`}
                        onClick={() => setSelectedPair(ticker.instId)}
                      >
                        <div className="text-center">
                          <div className="font-bold text-lg mb-1">{ticker.instId}</div>
                          <div className="text-2xl font-bold mb-2">
                            ${formatNumber(ticker.last, 2)}
                          </div>
                          <div className={`flex items-center justify-center space-x-1 text-sm ${
                            priceChange >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {priceChange >= 0 ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            <span>
                              {priceChangePercent >= 0 ? '+' : ''}{formatNumber(priceChangePercent, 2)}%
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-2">
                            24h量: {formatNumber(parseFloat(ticker.vol24h) / 1000)}K
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}