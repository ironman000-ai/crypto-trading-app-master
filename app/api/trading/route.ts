import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// 🛒 自动交易API路由 - 模拟交易接口（生产环境需要接入真实交易所API）

interface TradingAccount {
  balance: number;
  equity: number;
  margin: number;
  free_margin: number;
  positions: Position[];
  orders: Order[];
}

interface Position {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entry_price: number;
  current_price: number;
  pnl: number;
  pnl_percent: number;
  timestamp: number;
}

interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop';
  amount: number;
  price?: number;
  stop_price?: number;
  status: 'pending' | 'filled' | 'cancelled' | 'rejected';
  filled_amount: number;
  timestamp: number;
}

interface PlaceOrderRequest {
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop';
  amount: number;
  price?: number;
  stop_price?: number;
  stop_loss?: number;
  take_profit?: number;
}

// 模拟账户数据存储（生产环境应使用数据库）
const simulatedAccounts = new Map<string, TradingAccount>();
const simulatedPrices = new Map<string, number>();

// 初始化模拟价格
const initializePrices = () => {
  const basePrices: { [key: string]: number } = {
    'BTCUSDT': 43250,
    'ETHUSDT': 2678,
    'BNBUSDT': 312,
    'SOLUSDT': 67,
    'XRPUSDT': 0.62,
    'ADAUSDT': 0.35,
    'AVAXUSDT': 28,
    'DOGEUSDT': 0.08,
    'TRXUSDT': 0.11,
    'DOTUSDT': 6.5,
    'MATICUSDT': 0.85,
    'LTCUSDT': 75,
    'SHIBUSDT': 0.000012,
    'UNIUSDT': 8.5,
    'ATOMUSDT': 12,
    'LINKUSDT': 15
  };
  
  Object.entries(basePrices).forEach(([symbol, price]) => {
    simulatedPrices.set(symbol, price);
  });
};

// 获取或创建模拟账户
const getOrCreateAccount = (userId: string): TradingAccount => {
  if (!simulatedAccounts.has(userId)) {
    simulatedAccounts.set(userId, {
      balance: 10000, // 初始资金 $10,000
      equity: 10000,
      margin: 0,
      free_margin: 10000,
      positions: [],
      orders: []
    });
  }
  return simulatedAccounts.get(userId)!;
};

// 更新模拟价格（添加随机波动）
const updateSimulatedPrices = () => {
  simulatedPrices.forEach((price, symbol) => {
    const volatility = 0.001; // 0.1% 波动率
    const change = (Math.random() - 0.5) * 2 * volatility;
    const newPrice = price * (1 + change);
    simulatedPrices.set(symbol, newPrice);
  });
};

// 计算持仓盈亏
const calculatePnL = (position: Position, currentPrice: number): { pnl: number; pnl_percent: number } => {
  const priceDiff = position.side === 'long' 
    ? currentPrice - position.entry_price
    : position.entry_price - currentPrice;
  
  const pnl = priceDiff * position.size;
  const pnl_percent = (priceDiff / position.entry_price) * 100;
  
  return { pnl, pnl_percent };
};

// 更新账户权益
const updateAccountEquity = (account: TradingAccount) => {
  let totalPnL = 0;
  
  account.positions.forEach(position => {
    const currentPrice = simulatedPrices.get(position.symbol) || position.entry_price;
    const { pnl } = calculatePnL(position, currentPrice);
    totalPnL += pnl;
    
    // 更新持仓信息
    position.current_price = currentPrice;
    position.pnl = pnl;
    position.pnl_percent = (pnl / (position.entry_price * position.size)) * 100;
  });
  
  account.equity = account.balance + totalPnL;
  account.free_margin = account.equity - account.margin;
};

// 执行市价单
const executeMarketOrder = (account: TradingAccount, order: PlaceOrderRequest): Order => {
  const currentPrice = simulatedPrices.get(order.symbol) || 50000;
  const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // 计算手续费 (0.1%)
  const fee = order.amount * currentPrice * 0.001;
  const totalCost = order.amount * currentPrice + fee;
  
  // 检查余额
  if (order.side === 'buy' && totalCost > account.free_margin) {
    return {
      id: orderId,
      symbol: order.symbol,
      side: order.side,
      type: order.type,
      amount: order.amount,
      price: currentPrice,
      status: 'rejected',
      filled_amount: 0,
      timestamp: Date.now()
    };
  }
  
  // 执行订单
  const executedOrder: Order = {
    id: orderId,
    symbol: order.symbol,
    side: order.side,
    type: order.type,
    amount: order.amount,
    price: currentPrice,
    status: 'filled',
    filled_amount: order.amount,
    timestamp: Date.now()
  };
  
  // 更新账户
  if (order.side === 'buy') {
    account.balance -= totalCost;
    
    // 创建多头持仓
    const positionId = `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    account.positions.push({
      id: positionId,
      symbol: order.symbol,
      side: 'long',
      size: order.amount,
      entry_price: currentPrice,
      current_price: currentPrice,
      pnl: 0,
      pnl_percent: 0,
      timestamp: Date.now()
    });
  } else {
    // 卖出逻辑（简化处理）
    const revenue = order.amount * currentPrice - fee;
    account.balance += revenue;
  }
  
  account.orders.push(executedOrder);
  updateAccountEquity(account);
  
  return executedOrder;
};

// 初始化价格
initializePrices();

// 定期更新价格
setInterval(updateSimulatedPrices, 5000); // 每5秒更新一次价格

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const userId = request.headers.get('user-id') || 'demo_user';
    
    if (action === 'place_order') {
      const orderRequest: PlaceOrderRequest = await request.json();
      
      // 验证订单参数
      if (!orderRequest.symbol || !orderRequest.side || !orderRequest.amount) {
        return NextResponse.json(
          { error: '缺少必要的订单参数' },
          { status: 400 }
        );
      }
      
      const account = getOrCreateAccount(userId);
      
      // 目前只支持市价单
      if (orderRequest.type === 'market') {
        const executedOrder = executeMarketOrder(account, orderRequest);
        
        return NextResponse.json({
          success: true,
          order: executedOrder,
          account_summary: {
            balance: account.balance,
            equity: account.equity,
            free_margin: account.free_margin,
            positions_count: account.positions.length
          }
        });
      } else {
        return NextResponse.json(
          { error: '暂时只支持市价单交易' },
          { status: 400 }
        );
      }
    }
    
    if (action === 'close_position') {
      const { position_id } = await request.json();
      const account = getOrCreateAccount(userId);
      
      const positionIndex = account.positions.findIndex(p => p.id === position_id);
      if (positionIndex === -1) {
        return NextResponse.json(
          { error: '持仓不存在' },
          { status: 404 }
        );
      }
      
      const position = account.positions[positionIndex];
      const currentPrice = simulatedPrices.get(position.symbol) || position.entry_price;
      
      // 平仓
      const { pnl } = calculatePnL(position, currentPrice);
      account.balance += (position.entry_price * position.size) + pnl;
      
      // 移除持仓
      account.positions.splice(positionIndex, 1);
      updateAccountEquity(account);
      
      return NextResponse.json({
        success: true,
        closed_position: position,
        pnl: pnl,
        account_summary: {
          balance: account.balance,
          equity: account.equity,
          free_margin: account.free_margin
        }
      });
    }
    
    return NextResponse.json(
      { error: '无效的操作' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('交易API错误:', error);
    
    return NextResponse.json(
      { 
        error: '交易服务暂时不可用',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const userId = request.headers.get('user-id') || 'demo_user';
    
    if (action === 'account') {
      const account = getOrCreateAccount(userId);
      updateAccountEquity(account);
      
      return NextResponse.json({
        account: {
          balance: account.balance,
          equity: account.equity,
          margin: account.margin,
          free_margin: account.free_margin,
          margin_level: account.margin > 0 ? (account.equity / account.margin) * 100 : 0
        },
        positions: account.positions.map(pos => ({
          ...pos,
          current_price: simulatedPrices.get(pos.symbol) || pos.entry_price
        })),
        orders: account.orders.slice(-20), // 最近20个订单
        summary: {
          total_positions: account.positions.length,
          total_pnl: account.positions.reduce((sum, pos) => sum + pos.pnl, 0),
          win_rate: account.orders.length > 0 ? 
            (account.orders.filter(o => o.status === 'filled').length / account.orders.length * 100) : 0
        }
      });
    }
    
    if (action === 'prices') {
      const prices: { [key: string]: number } = {};
      simulatedPrices.forEach((price, symbol) => {
        prices[symbol] = price;
      });
      
      return NextResponse.json({
        prices,
        timestamp: Date.now(),
        update_frequency: '5 seconds'
      });
    }
    
    if (action === 'trading_pairs') {
      return NextResponse.json({
        supported_pairs: Array.from(simulatedPrices.keys()),
        base_currency: 'USDT',
        min_order_size: 0.001,
        max_order_size: 1000,
        trading_fee: 0.1, // 0.1%
        features: [
          'market_orders',
          'position_tracking',
          'pnl_calculation',
          'real_time_prices'
        ]
      });
    }
    
    if (action === 'health') {
      return NextResponse.json({
        status: 'healthy',
        timestamp: Date.now(),
        active_accounts: simulatedAccounts.size,
        supported_pairs: simulatedPrices.size,
        last_price_update: Date.now()
      });
    }
    
    return NextResponse.json(
      { error: '无效的请求参数' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('交易API查询错误:', error);
    
    return NextResponse.json(
      { 
        error: '查询服务暂时不可用',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

// 🔧 交易工具函数
export class TradingUtils {
  // 计算仓位大小
  static calculatePositionSize(
    accountBalance: number,
    riskPercent: number,
    entryPrice: number,
    stopLoss: number
  ): number {
    const riskAmount = accountBalance * (riskPercent / 100);
    const priceRisk = Math.abs(entryPrice - stopLoss);
    return riskAmount / priceRisk;
  }
  
  // 计算止损止盈价格
  static calculateStopLevels(
    entryPrice: number,
    side: 'long' | 'short',
    stopLossPercent: number,
    takeProfitPercent: number
  ): { stopLoss: number; takeProfit: number } {
    if (side === 'long') {
      return {
        stopLoss: entryPrice * (1 - stopLossPercent / 100),
        takeProfit: entryPrice * (1 + takeProfitPercent / 100)
      };
    } else {
      return {
        stopLoss: entryPrice * (1 + stopLossPercent / 100),
        takeProfit: entryPrice * (1 - takeProfitPercent / 100)
      };
    }
  }
  
  // 风险评估
  static assessRisk(
    accountEquity: number,
    positionValue: number,
    leverage: number = 1
  ): 'low' | 'medium' | 'high' {
    const riskRatio = (positionValue * leverage) / accountEquity;
    
    if (riskRatio < 0.02) return 'low';      // < 2%
    if (riskRatio < 0.05) return 'medium';   // 2-5%
    return 'high';                           // > 5%
  }
}