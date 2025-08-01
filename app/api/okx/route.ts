import { NextRequest, NextResponse } from 'next/server';
import { okxAPI, OKXUtils } from '@/lib/okx-api';

export const dynamic = 'force-dynamic';

// 🔐 OKX真实交易API路由
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const instId = searchParams.get('instId');

    switch (action) {
      case 'account':
        // 获取账户信息
        const [balance, config] = await Promise.all([
          okxAPI.getAccountBalance(),
          okxAPI.getAccountConfig()
        ]);
        
        return NextResponse.json({
          success: true,
          data: {
            balance,
            config,
            timestamp: Date.now()
          }
        });

      case 'positions':
        // 获取持仓信息
        const positions = await okxAPI.getPositions(instId || undefined);
        
        return NextResponse.json({
          success: true,
          data: positions,
          timestamp: Date.now()
        });

      case 'orders':
        // 获取当前订单
        const orders = await okxAPI.getOrders(instId || undefined);
        
        return NextResponse.json({
          success: true,
          data: orders,
          timestamp: Date.now()
        });

      case 'order-history':
        // 获取历史订单
        const orderHistory = await okxAPI.getOrderHistory(instId || undefined);
        
        return NextResponse.json({
          success: true,
          data: orderHistory,
          timestamp: Date.now()
        });

      case 'ticker':
        // 获取单个交易对行情
        if (!instId) {
          return NextResponse.json(
            { error: 'instId is required for ticker' },
            { status: 400 }
          );
        }
        
        const ticker = await okxAPI.getTicker(instId);
        
        return NextResponse.json({
          success: true,
          data: ticker,
          timestamp: Date.now()
        });

      case 'tickers':
        // 获取所有交易对行情
        const tickers = await okxAPI.getAllTickers();
        
        return NextResponse.json({
          success: true,
          data: tickers,
          timestamp: Date.now()
        });

      case 'klines':
        // 获取K线数据
        if (!instId) {
          return NextResponse.json(
            { error: 'instId is required for klines' },
            { status: 400 }
          );
        }
        
        const bar = searchParams.get('bar') || '1H';
        const limit = parseInt(searchParams.get('limit') || '100');
        
        const klines = await okxAPI.getKlines(instId, bar, limit);
        
        return NextResponse.json({
          success: true,
          data: klines,
          timestamp: Date.now()
        });

      case 'trading-fees':
        // 获取交易手续费
        const fees = await okxAPI.getTradingFees(instId || undefined);
        
        return NextResponse.json({
          success: true,
          data: fees,
          timestamp: Date.now()
        });

      case 'bills':
        // 获取资金流水
        const ccy = searchParams.get('ccy');
        const type = searchParams.get('type');
        
        const bills = await okxAPI.getBills(ccy || undefined, type || undefined);
        
        return NextResponse.json({
          success: true,
          data: bills,
          timestamp: Date.now()
        });

      case 'health':
        // API健康检查
        return NextResponse.json({
          status: 'healthy',
          timestamp: Date.now(),
          api_key: process.env.OKX_API_KEY ? 'configured' : 'missing',
          environment: process.env.OKX_SANDBOX === 'true' ? 'sandbox' : 'production'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('OKX API Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'OKX API request failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'place-order':
        // 下单
        const orderRequest = await request.json();
        
        // 验证必要参数
        if (!orderRequest.instId || !orderRequest.side || !orderRequest.sz) {
          return NextResponse.json(
            { error: 'Missing required parameters: instId, side, sz' },
            { status: 400 }
          );
        }

        // 设置默认值
        const order = {
          tdMode: 'cash',
          ...orderRequest,
          clOrdId: orderRequest.clOrdId || `ai_${Date.now()}`, // 自定义订单ID
          tag: orderRequest.tag || 'AI_QUANTUM_TRADING'
        };

        const result = await okxAPI.placeOrder(order);
        
        return NextResponse.json({
          success: true,
          data: result,
          timestamp: Date.now()
        });

      case 'cancel-order':
        // 撤销订单
        const { instId, ordId } = await request.json();
        
        if (!instId || !ordId) {
          return NextResponse.json(
            { error: 'Missing required parameters: instId, ordId' },
            { status: 400 }
          );
        }

        const cancelResult = await okxAPI.cancelOrder(instId, ordId);
        
        return NextResponse.json({
          success: true,
          data: cancelResult,
          timestamp: Date.now()
        });

      case 'market-buy':
        // 市价买入（简化接口）
        const { instId: buyInstId, amount: buyAmount, ccy } = await request.json();
        
        if (!buyInstId || !buyAmount) {
          return NextResponse.json(
            { error: 'Missing required parameters: instId, amount' },
            { status: 400 }
          );
        }

        const buyResult = await okxAPI.marketBuy(buyInstId, buyAmount, ccy);
        
        return NextResponse.json({
          success: true,
          data: buyResult,
          timestamp: Date.now()
        });

      case 'market-sell':
        // 市价卖出（简化接口）
        const { instId: sellInstId, amount: sellAmount } = await request.json();
        
        if (!sellInstId || !sellAmount) {
          return NextResponse.json(
            { error: 'Missing required parameters: instId, amount' },
            { status: 400 }
          );
        }

        const sellResult = await okxAPI.marketSell(sellInstId, sellAmount);
        
        return NextResponse.json({
          success: true,
          data: sellResult,
          timestamp: Date.now()
        });

      case 'limit-buy':
        // 限价买入
        const { instId: limitBuyInstId, amount: limitBuyAmount, price: limitBuyPrice } = await request.json();
        
        if (!limitBuyInstId || !limitBuyAmount || !limitBuyPrice) {
          return NextResponse.json(
            { error: 'Missing required parameters: instId, amount, price' },
            { status: 400 }
          );
        }

        const limitBuyResult = await okxAPI.limitBuy(limitBuyInstId, limitBuyAmount, limitBuyPrice);
        
        return NextResponse.json({
          success: true,
          data: limitBuyResult,
          timestamp: Date.now()
        });

      case 'limit-sell':
        // 限价卖出
        const { instId: limitSellInstId, amount: limitSellAmount, price: limitSellPrice } = await request.json();
        
        if (!limitSellInstId || !limitSellAmount || !limitSellPrice) {
          return NextResponse.json(
            { error: 'Missing required parameters: instId, amount, price' },
            { status: 400 }
          );
        }

        const limitSellResult = await okxAPI.limitSell(limitSellInstId, limitSellAmount, limitSellPrice);
        
        return NextResponse.json({
          success: true,
          data: limitSellResult,
          timestamp: Date.now()
        });

      case 'batch-orders':
        // 批量下单
        const { orders } = await request.json();
        
        if (!orders || !Array.isArray(orders)) {
          return NextResponse.json(
            { error: 'Invalid orders parameter' },
            { status: 400 }
          );
        }

        const batchResult = await okxAPI.placeMultipleOrders(orders);
        
        return NextResponse.json({
          success: true,
          data: batchResult,
          timestamp: Date.now()
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('OKX Trading API Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'OKX trading request failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}