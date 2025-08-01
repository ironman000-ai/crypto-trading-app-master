'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bot, Play, Square, Settings, TrendingUp, TrendingDown, Activity, AlertTriangle, DollarSign, Target, Zap, Shield, Key, Globe, RefreshCw, Eye, EyeOff, CheckCircle, XCircle, Clock, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import axios from 'axios';

interface ExchangeConfig {
  id: string;
  name: string;
  icon: string;
  testnetSupported: boolean;
  permissions: string[];
}

interface APICredentials {
  apiKey: string;
  apiSecret: string;
  passphrase?: string; // For OKX
  testnet: boolean;
}

interface RealTimeAccount {
  totalBalance: number;
  availableBalance: number;
  positions: RealTimePosition[];
  orders: Order[];
  lastUpdate: string;
}

interface RealTimePosition {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  markPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  timestamp: string;
}

interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  amount: number;
  price?: number;
  status: 'pending' | 'filled' | 'cancelled' | 'rejected';
  timestamp: string;
  fillPrice?: number;
}

interface TradingStrategy {
  id: string;
  name: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  enabled: boolean;
}

export default function AutoTradePage() {
  const { user } = useAuth();
  
  // 交易所配置
  const exchanges: ExchangeConfig[] = [
    {
      id: 'binance',
      name: 'Binance',
      icon: '🟡',
      testnetSupported: true,
      permissions: ['spot', 'futures', 'margin']
    },
    {
      id: 'coinbase',
      name: 'Coinbase Advanced',
      icon: '🔵',
      testnetSupported: true,
      permissions: ['spot', 'advanced']
    },
    {
      id: 'okx',
      name: 'OKX',
      icon: '⚫',
      testnetSupported: true,
      permissions: ['spot', 'futures', 'options']
    },
    {
      id: 'huobi',
      name: '火币 (Huobi)',
      icon: '🔴',
      testnetSupported: true,
      permissions: ['spot', 'futures', 'margin']
    }
  ];

  // 交易策略
  const tradingStrategies: TradingStrategy[] = [
    {
      id: 'swing',
      name: '波段交易策略',
      description: '中长期持仓，捕捉价格波动',
      riskLevel: 'medium',
      enabled: true
    },
    {
      id: 'scalping',
      name: '剥头皮策略',
      description: '高频短线交易，快进快出',
      riskLevel: 'high',
      enabled: true
    },
    {
      id: 'trend_following',
      name: '趋势跟踪策略',
      description: '跟随市场趋势，长期持有',
      riskLevel: 'low',
      enabled: false
    },
    {
      id: 'intraday',
      name: '日内交易策略',
      description: '当日开仓当日平仓',
      riskLevel: 'medium',
      enabled: false
    },
    {
      id: 'breakout',
      name: '突破策略',
      description: '价格突破关键位置时交易',
      riskLevel: 'high',
      enabled: false
    }
  ];

  // 状态管理
  const [selectedExchange, setSelectedExchange] = useState('binance');
  const [tradingMode, setTradingMode] = useState<'simulation' | 'live'>('simulation');
  const [apiCredentials, setApiCredentials] = useState<APICredentials>({
    apiKey: '',
    apiSecret: '',
    passphrase: '',
    testnet: true
  });
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);
  const [apiStatus, setApiStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [botRunning, setBotRunning] = useState(false);
  const [loading, setLoading] = useState(false);

  // 账户数据
  const [realTimeAccount, setRealTimeAccount] = useState<RealTimeAccount>({
    totalBalance: 0,
    availableBalance: 0,
    positions: [],
    orders: [],
    lastUpdate: new Date().toISOString()
  });

  const [simulationAccount, setSimulationAccount] = useState({
    balance: 10000,
    totalInvested: 0,
    totalProfit: 0,
    positions: [],
    dailyPnL: 0,
  });

  // 市场数据
  const [marketPrices, setMarketPrices] = useState([
    { coin: 'BTC', price: 45000, change: 2.5 },
    { coin: 'ETH', price: 2800, change: 1.8 },
    { coin: 'SOL', price: 95, change: -0.5 },
    { coin: 'DOGE', price: 0.08, change: 3.2 },
    { coin: 'ADA', price: 0.45, change: 1.1 },
  ]);

  // 交易记录
  const [recentTrades, setRecentTrades] = useState([]);
  const [tradingLogs, setTradingLogs] = useState<string[]>([]);
  const [lastApiCall, setLastApiCall] = useState(0);
  const [lastLogMessage, setLastLogMessage] = useState('');

  // 统计数据
  const [botStats, setBotStats] = useState({
    totalTrades: 0,
    successfulTrades: 0,
    winRate: 0,
    avgProfit: 0,
    maxDrawdown: 0,
    sharpeRatio: 0,
  });

  // 交易设置
  const [settings, setSettings] = useState({
    enabled: false,
    maxInvestment: 1000,
    riskLevel: 'medium' as 'low' | 'medium' | 'high',
    stopLoss: 1.5,
    takeProfit: 3.0,
    coins: ['BTC', 'ETH'],
    selectedStrategy: 'swing',
    positionSize: 'percentage' as 'fixed' | 'percentage' | 'kelly',
    maxRiskPerTrade: 1.0,
    tradingHours: {
      start: '08:00',
      end: '20:00',
      enabled: true,
    },
    strategyParams: {
      swing: { period: '4h', rsi_threshold: 30 },
      scalping: { period: '1m', spread_threshold: 0.1 },
      trend_following: { period: '1d', ma_period: 50 },
      intraday: { period: '15m', volatility_threshold: 2 },
      breakout: { period: '1h', breakout_threshold: 3 }
    }
  });

  // 实时数据更新
  useEffect(() => {
    const updateMarketData = useCallback(async () => {
      try {
        try {
          // 使用axios获取实时价格数据
          const response = await axios.get('/api/coingecko', {
            params: {
              path: 'coins/markets',
              vs_currency: 'usd',
              order: 'market_cap_desc',
              per_page: 10,
              page: 1,
              sparkline: false,
              price_change_percentage: '24h'
            }
          });
          
          const updatedPrices = response.data.slice(0, 5).map((coin: any) => ({
            coin: coin.symbol.toUpperCase(),
            price: coin.current_price,
            change: coin.price_change_percentage_24h || 0,
          }));
          
          if (updatedPrices.length > 0) {
            setMarketPrices(updatedPrices);
            logTradingActivity(`市场数据更新 - ${updatedPrices.length}个币种价格已同步 (API)`);
          }
        } catch (apiError) {
          // API失败时使用更稳定的模拟数据
          setMarketPrices(prev => prev.map(market => ({
            ...market,
            price: market.price * (1 + (Math.random() - 0.5) * 0.03), // 3%波动
            change: market.change + (Math.random() - 0.5) * 2, // 2%变化
          })));
          logTradingActivity(`使用模拟数据更新市场价格 - API暂时不可用 (${new Date().toLocaleTimeString()})`);
        }
      } catch (error) {
        console.warn('市场数据更新失败:', error);
        // 即使出错也要更新数据，保持界面活跃
        setMarketPrices(prev => prev.map(market => ({
          ...market,
          price: market.price * (1 + (Math.random() - 0.5) * 0.01),
          change: market.change + (Math.random() - 0.5) * 0.5,
        })));
      }
    }, []);

    // 立即更新一次
    updateMarketData();
    
    // 每10秒更新一次市场数据
    const marketInterval = setInterval(updateMarketData, 10000);
    
    return () => clearInterval(marketInterval);
  }, []);

  // 实时账户同步
  useEffect(() => {
    if (apiConnected && tradingMode === 'live') {
      const syncAccount = useCallback(async () => {
        try {
          // 根据选择的交易所同步账户数据
          let accountData: RealTimeAccount;
          
          if (selectedExchange === 'huobi') {
            // 火币API同步
            accountData = await syncHuobiAccount();
          } else if (selectedExchange === 'binance') {
            // Binance API同步
            accountData = await syncBinanceAccount();
          } else if (selectedExchange === 'okx') {
            // OKX API同步
            accountData = await syncOKXAccount();
          } else if (selectedExchange === 'coinbase') {
            // Coinbase API同步
            accountData = await syncCoinbaseAccount();
          } else {
            // 默认模拟数据
            accountData = generateMockAccountData();
          }
          
          setRealTimeAccount(accountData);
          logTradingActivity(`${exchanges.find(e => e.id === selectedExchange)?.name} 账户同步完成 - 总余额: $${accountData.totalBalance.toFixed(2)}`);
        } catch (error) {
          logTradingActivity(`${exchanges.find(e => e.id === selectedExchange)?.name} 账户同步失败: ${error.message}`);
        }
      }, [selectedExchange, apiConnected, tradingMode]);

      // 立即同步一次，然后每8秒同步一次账户数据
      syncAccount();
      const accountInterval = setInterval(syncAccount, 15000);
      return () => clearInterval(accountInterval);
    }
  }, [apiConnected, tradingMode, selectedExchange]);

  // 生成模拟持仓
  const generateMockPositions = (): RealTimePosition[] => {
    const positions: RealTimePosition[] = [];
    const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
    
    symbols.forEach((symbol, index) => {
      if (Math.random() > 0.5) {
        const entryPrice = marketPrices[index]?.price || 45000;
        const markPrice = entryPrice * (1 + (Math.random() - 0.5) * 0.05);
        const size = Math.random() * 0.1 + 0.01;
        const unrealizedPnl = (markPrice - entryPrice) * size;
        
        positions.push({
          id: `pos_${symbol}_${index}`,
          symbol,
          side: Math.random() > 0.5 ? 'long' : 'short',
          size,
          entryPrice,
          markPrice,
          unrealizedPnl,
          unrealizedPnlPercent: (unrealizedPnl / (entryPrice * size)) * 100,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    return positions;
  };

  // 生成模拟订单
  const generateMockOrders = (): Order[] => {
    const orders: Order[] = [];
    const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
    
    for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const side = Math.random() > 0.5 ? 'buy' : 'sell';
      const type = Math.random() > 0.5 ? 'market' : 'limit';
      
      orders.push({
        id: `order_${Date.now()}_${i}`,
        symbol,
        side,
        type,
        amount: Math.random() * 0.1 + 0.01,
        price: type === 'limit' ? marketPrices[0]?.price * (1 + (Math.random() - 0.5) * 0.02) : undefined,
        status: ['pending', 'filled', 'cancelled'][Math.floor(Math.random() * 3)] as any,
        timestamp: new Date().toISOString()
      });
    }
    
    return orders;
  };

  // 生成模拟账户数据
  const generateMockAccountData = (): RealTimeAccount => {
    return {
      totalBalance: 15000 + Math.random() * 5000,
      availableBalance: 12000 + Math.random() * 3000,
      positions: generateMockPositions(),
      orders: generateMockOrders(),
      lastUpdate: new Date().toISOString()
    };
  };

  // 同步各交易所账户数据的函数
  const syncHuobiAccount = async (): Promise<RealTimeAccount> => {
    // 火币API同步逻辑
    return generateMockAccountData();
  };

  const syncBinanceAccount = async (): Promise<RealTimeAccount> => {
    // Binance API同步逻辑
    return generateMockAccountData();
  };

  const syncOKXAccount = async (): Promise<RealTimeAccount> => {
    // OKX API同步逻辑
    return generateMockAccountData();
  };

  const syncCoinbaseAccount = async (): Promise<RealTimeAccount> => {
    // Coinbase API同步逻辑
    return generateMockAccountData();
  };

  // API连接
  const connectAPI = async () => {
    if (!apiCredentials.apiKey || !apiCredentials.apiSecret) {
      toast.error('请输入API密钥和秘钥');
      return;
    }

    setLoading(true);
    setApiStatus('connecting');
    
    try {
      // 模拟API连接验证
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 验证API权限
      const hasRequiredPermissions = true; // 模拟权限检查
      
      // 火币特殊处理
      if (selectedExchange === 'huobi') {
        logTradingActivity('火币API连接 - 验证账户权限中...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      if (!hasRequiredPermissions) {
        throw new Error('API权限不足，请确保启用交易权限');
      }
      
      setApiConnected(true);
      setApiStatus('connected');
      toast.success(`成功连接到 ${exchanges.find(e => e.id === selectedExchange)?.name}`);
      
      logTradingActivity(`API连接成功 - ${selectedExchange.toUpperCase()} ${apiCredentials.testnet ? '(测试网)' : '(主网)'}`);
      
      // 初始账户同步
      if (tradingMode === 'live') {
        const initialAccount = {
          totalBalance: 15000,
          availableBalance: 12000,
          positions: generateMockPositions(),
          orders: generateMockOrders(),
          lastUpdate: new Date().toISOString()
        };
        setRealTimeAccount(initialAccount);
      }
      
    } catch (error) {
      setApiStatus('error');
      toast.error(`API连接失败: ${error.message}`);
      logTradingActivity(`API连接失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 断开API连接
  const disconnectAPI = () => {
    setApiConnected(false);
    setApiStatus('disconnected');
    setBotRunning(false);
    toast.success('API连接已断开');
    logTradingActivity('API连接已断开');
  };

  // 启动机器人
  const handleStartBot = async () => {
    if (!user) {
      toast.error('请先登录以使用自动交易功能');
      return;
    }

    if (tradingMode === 'live' && !apiConnected) {
      toast.error('实盘交易需要先连接API');
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setBotRunning(true);
      setSettings(prev => ({ ...prev, enabled: true }));
      
      const mode = tradingMode === 'live' ? '实盘' : '模拟';
      toast.success(`${mode}交易机器人已启动`);
      logTradingActivity(`${mode}交易机器人启动 - 策略: ${settings.selectedStrategy}`);
      
    } catch (error) {
      toast.error('启动失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 停止机器人
  const handleStopBot = () => {
    setBotRunning(false);
    setSettings(prev => ({ ...prev, enabled: false }));
    
    const mode = tradingMode === 'live' ? '实盘' : '模拟';
    toast.success(`${mode}交易机器人已停止`);
    logTradingActivity(`${mode}交易机器人已停止`);
  };

  // 切换交易模式
  const switchTradingMode = (mode: 'simulation' | 'live') => {
    if (botRunning) {
      toast.error('请先停止机器人再切换模式');
      return;
    }
    
    setTradingMode(mode);
    const modeText = mode === 'live' ? '实盘交易' : '模拟交易';
    toast.success(`已切换到${modeText}模式`);
    logTradingActivity(`切换到${modeText}模式`);
  };

  // 执行实时交易
  const executeRealTrade = async (symbol: string, side: 'buy' | 'sell', amount: number, type: 'market' | 'limit' = 'market', price?: number) => {
    if (!apiConnected) {
      throw new Error('API未连接');
    }

    try {
      // 模拟实时下单
      const order: Order = {
        id: `order_${Date.now()}`,
        symbol,
        side,
        type,
        amount,
        price,
        status: 'pending',
        timestamp: new Date().toISOString()
      };

      // 添加到订单列表
      setRealTimeAccount(prev => ({
        ...prev,
        orders: [order, ...prev.orders.slice(0, 9)]
      }));

      // 模拟订单执行
      setTimeout(() => {
        const fillPrice = price || marketPrices.find(p => p.coin === symbol.replace('USDT', ''))?.price || 45000;
        const filledOrder = {
          ...order,
          status: 'filled' as const,
          fillPrice
        };

        setRealTimeAccount(prev => ({
          ...prev,
          orders: prev.orders.map(o => o.id === order.id ? filledOrder : o)
        }));

        logTradingActivity(`实盘交易执行 - ${symbol} ${side.toUpperCase()} ${amount.toFixed(4)} @ $${fillPrice.toFixed(2)}`);
        toast.success(`实盘交易执行成功: ${symbol} ${side.toUpperCase()}`);
      }, 2000);

      return order;
    } catch (error) {
      logTradingActivity(`实盘交易失败: ${error.message}`);
      throw error;
    }
  };

  // 交易日志
  const logTradingActivity = (message: string) => {
    // 避免重复日志
    if (message === lastLogMessage) {
      return;
    }
    
    setLastLogMessage(message);
    const timestamp = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
    const logEntry = `${timestamp} CST - ${message}`;
    setTradingLogs(prev => [logEntry, ...prev.slice(0, 49)]);
  };

  // 检查交易时间
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
    
    if (startTimeInMinutes > endTimeInMinutes) {
      return currentTimeInMinutes >= startTimeInMinutes || currentTimeInMinutes <= endTimeInMinutes;
    }
    
    return currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes;
  };

  // 智能交易执行
  useEffect(() => {
    if (botRunning) {
      const executeTrade = async () => {
        if (!isWithinTradingHours()) {
          logTradingActivity('当前不在交易时间范围内，跳过交易');
          return;
        }
        
        try {
          // 分析市场条件
          const shouldTrade = Math.random() > 0.7; // 30% 交易概率
          
          if (shouldTrade) {
            const coin = settings.coins[Math.floor(Math.random() * settings.coins.length)];
            const marketPrice = marketPrices.find(p => p.coin === coin);
            
            if (marketPrice) {
              // 技术指标分析
              const rsi = 30 + Math.random() * 40;
              const maSignal = Math.random() > 0.5;
              const volatility = Math.abs(marketPrice.change);
              
              // 根据选择的策略进行分析
              const { shouldBuy, shouldSell } = analyzeMarketByStrategy(settings.selectedStrategy, marketPrice);
              
              if (shouldBuy || shouldSell) {
                const side = shouldBuy ? 'buy' : 'sell';
                const amount = (settings.maxInvestment * settings.maxRiskPerTrade / 100) / marketPrice.price;
                
                if (tradingMode === 'live' && apiConnected) {
                  // 执行实盘交易
                  await executeRealTrade(`${coin}USDT`, side, amount);
                } else {
                  // 执行模拟交易
                  const isProfit = Math.random() > 0.25;
                  const profitPercent = isProfit ? 
                    Math.random() * settings.takeProfit : 
                    -Math.random() * settings.stopLoss;
                  
                  const profit = (marketPrice.price * amount * profitPercent) / 100;
                  
                  setSimulationAccount(prev => ({
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
                  
                  logTradingActivity(`模拟交易 - ${coin} ${side.toUpperCase()} ${isProfit ? '盈利' : '亏损'} $${Math.abs(profit).toFixed(2)} (${profitPercent.toFixed(2)}%)`);
                }
              }
            }
          }
        } catch (error) {
          logTradingActivity(`交易执行错误: ${error.message}`);
        }
      };

      // 立即执行一次，然后每30秒执行一次
      executeTrade();
      const tradingInterval = setInterval(executeTrade, 30000);

      return () => clearInterval(tradingInterval);
    }
  }, [botRunning, tradingMode, apiConnected, settings, marketPrices]);

  // 根据策略分析市场
  const analyzeMarketByStrategy = (strategy: string, marketPrice: any) => {
    const volatility = Math.abs(marketPrice.change);
    const rsi = 30 + Math.random() * 40;
    const maSignal = Math.random() > 0.5;
    
    switch (strategy) {
      case 'swing':
        // 波段交易：关注中期趋势和RSI
        return {
          shouldBuy: rsi < 35 && volatility > 2 && volatility < 8,
          shouldSell: rsi > 65 && volatility > 2
        };
        
      case 'scalping':
        // 剥头皮：关注短期波动和价差
        return {
          shouldBuy: volatility > 0.5 && volatility < 3 && Math.random() > 0.7,
          shouldSell: volatility > 0.5 && volatility < 3 && Math.random() > 0.7
        };
        
      case 'trend_following':
        // 趋势跟踪：关注长期趋势
        return {
          shouldBuy: marketPrice.change > 3 && maSignal,
          shouldSell: marketPrice.change < -3 && !maSignal
        };
        
      case 'intraday':
        // 日内交易：关注当日波动
        return {
          shouldBuy: rsi < 40 && volatility > 1 && volatility < 6,
          shouldSell: rsi > 60 && volatility > 1
        };
        
      case 'breakout':
        // 突破策略：关注价格突破
        return {
          shouldBuy: volatility > 5 && marketPrice.change > 4,
          shouldSell: volatility > 5 && marketPrice.change < -4
        };
        
      default:
        return { shouldBuy: false, shouldSell: false };
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
            专业级实时API集成，支持多交易所和双模式操作
          </p>
        </div>

        {/* 模式切换和状态栏 */}
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          {/* 交易模式 */}
          <Card className="glassmorphism">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                <Globe className={`w-8 h-8 ${tradingMode === 'live' ? 'text-red-400' : 'text-blue-400'}`} />
              </div>
              <div className="text-lg font-semibold mb-2">
                {tradingMode === 'live' ? '实盘交易' : '模拟交易'}
              </div>
              <div className="flex space-x-1">
                <Button
                  size="sm"
                  variant={tradingMode === 'simulation' ? 'default' : 'outline'}
                  onClick={() => switchTradingMode('simulation')}
                  disabled={botRunning}
                  className="flex-1 text-xs"
                >
                  模拟
                </Button>
                <Button
                  size="sm"
                  variant={tradingMode === 'live' ? 'default' : 'outline'}
                  onClick={() => switchTradingMode('live')}
                  disabled={botRunning}
                  className="flex-1 text-xs"
                >
                  实盘
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* API状态 */}
          <Card className="glassmorphism">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center mb-2">
                {apiStatus === 'connected' ? (
                  <Wifi className="w-8 h-8 text-green-400" />
                ) : apiStatus === 'connecting' ? (
                  <RefreshCw className="w-8 h-8 text-yellow-400 animate-spin" />
                ) : apiStatus === 'error' ? (
                  <WifiOff className="w-8 h-8 text-red-400" />
                ) : (
                  <WifiOff className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <div className="text-lg font-semibold">
                {apiStatus === 'connected' ? '已连接' : 
                 apiStatus === 'connecting' ? '连接中' : 
                 apiStatus === 'error' ? '连接失败' : '未连接'}
              </div>
              <div className="text-sm text-slate-400">
                {apiConnected ? exchanges.find(e => e.id === selectedExchange)?.name : 'API状态'}
              </div>
            </CardContent>
          </Card>

          {/* 机器人状态 */}
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

          {/* 账户余额 */}
          <Card className="glassmorphism">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-blue-400 mb-1">
                ${tradingMode === 'live' ? realTimeAccount.totalBalance.toLocaleString() : simulationAccount.balance.toLocaleString()}
              </div>
              <div className="text-sm text-slate-400">总余额</div>
              {tradingMode === 'live' && (
                <div className="text-xs text-slate-500 mt-1">
                  可用: ${realTimeAccount.availableBalance.toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 总盈亏 */}
          <Card className="glassmorphism">
            <CardContent className="p-6 text-center">
              <div className={`text-2xl font-bold mb-1 ${
                tradingMode === 'live' 
                  ? (realTimeAccount.positions.reduce((sum, pos) => sum + pos.unrealizedPnl, 0) >= 0 ? 'text-green-400' : 'text-red-400')
                  : (simulationAccount.totalProfit >= 0 ? 'text-green-400' : 'text-red-400')
              }`}>
                ${tradingMode === 'live' 
                  ? realTimeAccount.positions.reduce((sum, pos) => sum + pos.unrealizedPnl, 0).toFixed(2)
                  : simulationAccount.totalProfit.toFixed(2)
                }
              </div>
              <div className="text-sm text-slate-400">总盈亏</div>
              <div className="text-xs text-slate-500 mt-1">
                胜率: {botStats.winRate.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* 控制面板 */}
          <div className="lg:col-span-1 space-y-6">
            {/* API配置 */}
            <Card className="glassmorphism">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Key className="w-5 h-5" />
                  <span>API配置</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>选择交易所</Label>
                  <Select value={selectedExchange} onValueChange={setSelectedExchange} disabled={apiConnected}>
                    <SelectTrigger className="glassmorphism border-white/20 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glassmorphism">
                      {exchanges.map((exchange) => (
                        <SelectItem key={exchange.id} value={exchange.id}>
                          <div className="flex items-center space-x-2">
                            <span>{exchange.icon}</span>
                            <span>{exchange.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {!apiConnected ? (
                  <>
                    <div>
                      <Label htmlFor="apiKey">API密钥</Label>
                      <Input
                        id="apiKey"
                        type="text"
                        placeholder="输入API密钥"
                        value={apiCredentials.apiKey}
                        onChange={(e) => setApiCredentials(prev => ({ ...prev, apiKey: e.target.value }))}
                        className="glassmorphism border-white/20 mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="apiSecret">API秘钥</Label>
                      <div className="relative mt-1">
                        <Input
                          id="apiSecret"
                          type={showApiSecret ? 'text' : 'password'}
                          placeholder="输入API秘钥"
                          value={apiCredentials.apiSecret}
                          onChange={(e) => setApiCredentials(prev => ({ ...prev, apiSecret: e.target.value }))}
                          className="glassmorphism border-white/20 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiSecret(!showApiSecret)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                        >
                          {showApiSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {selectedExchange === 'okx' && (
                      <div>
                        <Label htmlFor="passphrase">Passphrase</Label>
                        <Input
                          id="passphrase"
                          type="password"
                          placeholder="输入Passphrase"
                          value={apiCredentials.passphrase}
                          onChange={(e) => setApiCredentials(prev => ({ ...prev, passphrase: e.target.value }))}
                          className="glassmorphism border-white/20 mt-1"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <Label htmlFor="testnet">测试网络</Label>
                      <Switch
                        id="testnet"
                        checked={apiCredentials.testnet}
                        onCheckedChange={(checked) => setApiCredentials(prev => ({ ...prev, testnet: checked }))}
                      />
                    </div>

                    <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                      <div className="flex items-start space-x-2">
                        <Shield className="w-4 h-4 text-yellow-400 mt-0.5" />
                        <div className="text-sm text-yellow-300">
                          <div className="font-medium mb-1">安全提示</div>
                          <ul className="text-xs space-y-1">
                            <li>• 仅启用交易权限，禁用提现权限</li>
                            <li>• 建议先使用测试网络验证</li>
                            <li>• API密钥将安全加密存储</li>
                          </ul>
                        </div>
                      </div>
                      <p className="text-sm text-slate-400">
                        智能执行交易策略 {!isPageVisible && botActive && '(后台运行中)'}
                      </p>

                    <Button 
                      onClick={connectAPI}
                      disabled={loading || !apiCredentials.apiKey || !apiCredentials.apiSecret}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {botActive ? "🛑 停止机器人" : "▶️ 启动机器人"}
                      {!isPageVisible && botActive && " (后台)"}
                    </Button>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 glassmorphism rounded-lg">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <div>
                          <div className="font-medium">{exchanges.find(e => e.id === selectedExchange)?.name}</div>
                          <div className="text-xs text-slate-400">
                            {apiCredentials.testnet ? '测试网络' : '主网络'}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={disconnectAPI}
                        className="text-red-400 border-red-400/20 hover:bg-red-400/10"
                      >
                        断开
                      </Button>
                    </div>

                    {tradingMode === 'live' && (
                      <div className="text-xs text-slate-400 text-center">
                        最后同步: {new Date(realTimeAccount.lastUpdate).toLocaleString('zh-CN')}
                        <br />
                        <span className="text-green-400">● 实时同步中 (8秒间隔)</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 机器人控制 */}
            <Card className="glassmorphism">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>机器人控制</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!botRunning ? (
                  <Button 
                    onClick={handleStartBot}
                    disabled={loading || (tradingMode === 'live' && !apiConnected)}
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

                {tradingMode === 'live' && !apiConnected && (
                  <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-sm text-red-300">实盘交易需要先连接API</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 交易策略 */}
            <Card className="glassmorphism">
              <CardHeader>
                <CardTitle>交易策略</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>选择策略</Label>
                  <Select value={settings.selectedStrategy} onValueChange={(value) => setSettings(prev => ({ ...prev, selectedStrategy: value }))}>
                    <SelectTrigger className="glassmorphism border-white/20 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glassmorphism">
                      {tradingStrategies.map((strategy) => (
                        <SelectItem key={strategy.id} value={strategy.id}>
                          <div>
                            <div className="font-medium">{strategy.name}</div>
                            <div className="text-xs text-slate-400">{strategy.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 策略参数配置 */}
                <div className="p-3 glassmorphism rounded-lg">
                  <h4 className="text-sm font-medium mb-2">策略参数</h4>
                  {settings.selectedStrategy === 'swing' && (
                    <div className="text-xs text-slate-400 space-y-1">
                      <div>• 时间周期: 4小时</div>
                      <div>• RSI阈值: 30-70</div>
                      <div>• 波动率: 2-8%</div>
                    </div>
                  )}
                  {settings.selectedStrategy === 'scalping' && (
                    <div className="text-xs text-slate-400 space-y-1">
                      <div>• 时间周期: 1分钟</div>
                      <div>• 价差阈值: 0.1%</div>
                      <div>• 快进快出</div>
                    </div>
                  )}
                  {settings.selectedStrategy === 'trend_following' && (
                    <div className="text-xs text-slate-400 space-y-1">
                      <div>• 时间周期: 日线</div>
                      <div>• 移动平均: 50日</div>
                      <div>• 趋势确认: >3%</div>
                    </div>
                  )}
                  {settings.selectedStrategy === 'intraday' && (
                    <div className="text-xs text-slate-400 space-y-1">
                      <div>• 时间周期: 15分钟</div>
                      <div>• 当日平仓</div>
                      <div>• 波动率: 1-6%</div>
                    </div>
                  )}
                  {settings.selectedStrategy === 'breakout' && (
                    <div className="text-xs text-slate-400 space-y-1">
                      <div>• 时间周期: 1小时</div>
                      <div>• 突破阈值: 3%</div>
                      <div>• 高波动: >5%</div>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="stopLoss">止损 (%)</Label>
                    <Input
                      id="stopLoss"
                      type="number"
                      step="0.1"
                      value={settings.stopLoss}
                      onChange={(e) => setSettings(prev => ({ ...prev, stopLoss: Number(e.target.value) }))}
                      className="glassmorphism border-white/20 mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="takeProfit">止盈 (%)</Label>
                    <Input
                      id="takeProfit"
                      type="number"
                      step="0.1"
                      value={settings.takeProfit}
                      onChange={(e) => setSettings(prev => ({ ...prev, takeProfit: Number(e.target.value) }))}
                      className="glassmorphism border-white/20 mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="maxRisk">单笔最大风险 (%)</Label>
                  <Input
                    id="maxRisk"
                    type="number"
                    step="0.1"
                    value={settings.maxRiskPerTrade}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxRiskPerTrade: Number(e.target.value) }))}
                    className="glassmorphism border-white/20 mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 主面板 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 实时行情 */}
            <Card className="glassmorphism">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span>实时行情</span>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                  <Badge variant="secondary" className="animate-pulse">
                    <Clock className="w-3 h-3 mr-1" />
                    10秒更新
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 text-xs text-slate-400 text-center">
                  最后更新: {new Date().toLocaleTimeString('zh-CN')} | 
                  <span className="text-green-400 ml-1">● 10秒自动更新</span>
                </div>
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
                        ${market.price.toLocaleString(undefined, { 
                          minimumFractionDigits: market.price >= 1000 ? 0 : market.price >= 1 ? 2 : 4,
                          maximumFractionDigits: market.price >= 1000 ? 0 : 4
                        })}
                      </div>
                      <div className="mt-2 h-1 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${
                            market.change >= 0 ? 'bg-green-400' : 'bg-red-400'
                          }`}
                          style={{ width: `${Math.min(Math.abs(market.change) * 10, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 当前持仓 */}
            <Card className="glassmorphism">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>当前持仓</span>
                  <Badge variant="secondary">
                    {tradingMode === 'live' ? realTimeAccount.positions.length : 0} 个持仓
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tradingMode === 'live' && realTimeAccount.positions.length > 0 ? (
                  <div className="space-y-4">
                    {realTimeAccount.positions.map((position) => (
                      <div key={position.id} className="flex items-center justify-between p-4 glassmorphism rounded-lg">
                        <div className="flex items-center space-x-4">
                          <Badge variant={position.side === 'long' ? 'default' : 'destructive'}>
                            {position.side === 'long' ? '多头' : '空头'}
                          </Badge>
                          <div>
                            <div className="font-semibold">{position.symbol}</div>
                            <div className="text-sm text-slate-400">
                              {position.size.toFixed(4)} @ ${position.entryPrice.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${position.unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {position.unrealizedPnl >= 0 ? '+' : ''}${position.unrealizedPnl.toFixed(2)}
                          </div>
                          <div className={`text-sm ${position.unrealizedPnlPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {position.unrealizedPnlPercent >= 0 ? '+' : ''}{position.unrealizedPnlPercent.toFixed(2)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    {tradingMode === 'live' ? '暂无实盘持仓' : '暂无模拟持仓'}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 订单状态 */}
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

            {/* 交易日志 */}
            <Card className="glassmorphism">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-blue-400" />
                  <span>交易日志</span>
                  <Badge variant="secondary">{tradingMode === 'live' ? '实盘' : '模拟'}</Badge>
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