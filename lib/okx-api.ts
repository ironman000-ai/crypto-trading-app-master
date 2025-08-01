import crypto from 'crypto';

// OKX API 配置
const OKX_BASE_URL = process.env.OKX_SANDBOX === 'true' 
  ? 'https://www.okx.com' // 沙盒环境
  : 'https://www.okx.com'; // 生产环境

const API_KEY = process.env.OKX_API_KEY!;
const SECRET_KEY = process.env.OKX_SECRET_KEY!;
const PASSPHRASE = process.env.OKX_PASSPHRASE!;

// OKX API 接口类型定义
export interface OKXAccount {
  totalEq: string;      // 总权益
  isoEq: string;        // 逐仓权益
  adjEq: string;        // 调整后权益
  ordFroz: string;      // 挂单冻结
  imr: string;          // 初始保证金
  mmr: string;          // 维持保证金
  mgnRatio: string;     // 保证金率
  notionalUsd: string;  // 以美元计价的持仓数量
  uTime: string;        // 账户信息更新时间
}

export interface OKXBalance {
  ccy: string;          // 币种
  bal: string;          // 余额
  frozenBal: string;    // 冻结余额
  availBal: string;     // 可用余额
}

export interface OKXPosition {
  instId: string;       // 产品ID
  posSide: string;      // 持仓方向
  pos: string;          // 持仓数量
  baseBal: string;      // 交易币余额
  quoteBal: string;     // 计价币余额
  avgPx: string;        // 开仓平均价
  upl: string;          // 未实现收益
  uplRatio: string;     // 未实现收益率
  lever: string;        // 杠杆倍数
  liqPx: string;        // 强平价格
  markPx: string;       // 标记价格
  margin: string;       // 保证金余额
  mgnMode: string;      // 保证金模式
  mgnRatio: string;     // 保证金率
  mmr: string;          // 维持保证金
  liab: string;         // 负债额
  interest: string;     // 利息
  tradeId: string;      // 最新成交ID
  notionalUsd: string;  // 以美元计价的持仓数量
  adl: string;          // 信号区
  bizRefId: string;     // 业务参考ID
  bizRefType: string;   // 业务参考类型
  cTime: string;        // 持仓创建时间
  uTime: string;        // 持仓信息更新时间
}

export interface OKXOrder {
  instId: string;       // 产品ID
  ordId: string;        // 订单ID
  clOrdId: string;      // 客户自定义订单ID
  tag: string;          // 订单标签
  px: string;           // 委托价格
  sz: string;           // 委托数量
  pnl: string;          // 收益
  ordType: string;      // 订单类型
  side: string;         // 订单方向
  posSide: string;      // 持仓方向
  tdMode: string;       // 交易模式
  accFillSz: string;    // 累计成交数量
  fillPx: string;       // 最新成交价格
  tradeId: string;      // 最新成交ID
  fillSz: string;       // 最新成交数量
  fillTime: string;     // 最新成交时间
  state: string;        // 订单状态
  lever: string;        // 杠杆倍数
  tpTriggerPx: string;  // 止盈触发价
  tpOrdPx: string;      // 止盈委托价
  slTriggerPx: string;  // 止损触发价
  slOrdPx: string;      // 止损委托价
  feeCcy: string;       // 交易手续费币种
  fee: string;          // 手续费
  rebateCcy: string;    // 返佣金币种
  rebate: string;       // 返佣金额
  tgtCcy: string;       // 目标币种
  category: string;     // 订单种类
  uTime: string;        // 订单状态更新时间
  cTime: string;        // 订单创建时间
}

export interface OKXOrderRequest {
  instId: string;       // 产品ID，如 BTC-USDT
  tdMode: 'cash' | 'cross' | 'isolated'; // 交易模式
  side: 'buy' | 'sell'; // 订单方向
  ordType: 'market' | 'limit' | 'post_only' | 'fok' | 'ioc'; // 订单类型
  sz: string;           // 委托数量
  px?: string;          // 委托价格（限价单必填）
  ccy?: string;         // 保证金币种
  clOrdId?: string;     // 客户自定义订单ID
  tag?: string;         // 订单标签
  posSide?: 'long' | 'short' | 'net'; // 持仓方向
  reduceOnly?: boolean; // 是否只减仓
  tgtCcy?: 'base_ccy' | 'quote_ccy'; // 委托数量的类型
  tpTriggerPx?: string; // 止盈触发价
  tpOrdPx?: string;     // 止盈委托价
  slTriggerPx?: string; // 止损触发价
  slOrdPx?: string;     // 止损委托价
}

export interface OKXTicker {
  instId: string;       // 产品ID
  last: string;         // 最新成交价
  lastSz: string;       // 最新成交的数量
  askPx: string;        // 卖一价
  askSz: string;        // 卖一数量
  bidPx: string;        // 买一价
  bidSz: string;        // 买一数量
  open24h: string;      // 24小时开盘价
  high24h: string;      // 24小时最高价
  low24h: string;       // 24小时最低价
  volCcy24h: string;    // 24小时成交量（计价币）
  vol24h: string;       // 24小时成交量（交易币）
  ts: string;           // ticker数据产生时间
  sodUtc0: string;      // UTC0时开盘价
  sodUtc8: string;      // UTC8时开盘价
}

class OKXAPIClient {
  private baseURL: string;
  private apiKey: string;
  private secretKey: string;
  private passphrase: string;

  constructor() {
    this.baseURL = OKX_BASE_URL;
    this.apiKey = API_KEY;
    this.secretKey = SECRET_KEY;
    this.passphrase = PASSPHRASE;
  }

  // 生成签名
  private generateSignature(timestamp: string, method: string, requestPath: string, body: string = ''): string {
    const message = timestamp + method + requestPath + body;
    const signature = crypto.createHmac('sha256', this.secretKey).update(message).digest('base64');
    console.log('OKX API Debug:', {
      timestamp,
      method,
      requestPath,
      body: body.substring(0, 100),
      apiKey: this.apiKey.substring(0, 8) + '...',
      passphrase: this.passphrase
    });
    return signature;
  }

  // 通用请求方法
  private async request(method: 'GET' | 'POST', endpoint: string, params?: any): Promise<any> {
    const timestamp = new Date().toISOString();
    const requestPath = `/api/v5${endpoint}`;
    
    let url = `${this.baseURL}${requestPath}`;
    let body = '';

    if (method === 'GET' && params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    } else if (method === 'POST' && params) {
      body = JSON.stringify(params);
    }

    const signature = this.generateSignature(timestamp, method, requestPath, body);

    const headers: HeadersInit = {
      'OK-ACCESS-KEY': this.apiKey,
      'OK-ACCESS-SIGN': signature,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': this.passphrase,
      'Content-Type': 'application/json',
      'x-simulated-trading': '1' // 添加模拟交易标识
    };

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: method === 'POST' ? body : undefined,
      });

      if (!response.ok) {
        throw new Error(`OKX API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.code !== '0') {
        throw new Error(`OKX API Error: ${data.code} - ${data.msg}`);
      }

      return data.data;
    } catch (error) {
      console.error('OKX API Request Failed:', error);
      throw error;
    }
  }

  // 🔹 1. 获取账户余额
  async getAccountBalance(): Promise<OKXBalance[]> {
    return await this.request('GET', '/account/balance');
  }

  // 🔹 2. 获取账户配置
  async getAccountConfig(): Promise<OKXAccount[]> {
    return await this.request('GET', '/account/config');
  }

  // 🔹 3. 获取持仓信息
  async getPositions(instId?: string): Promise<OKXPosition[]> {
    const params = instId ? { instId } : {};
    return await this.request('GET', '/account/positions', params);
  }

  // 🔹 4. 获取订单信息
  async getOrders(instId?: string, state?: string): Promise<OKXOrder[]> {
    const params: any = {};
    if (instId) params.instId = instId;
    if (state) params.state = state; // live, partially_filled, filled, canceled
    
    return await this.request('GET', '/trade/orders-pending', params);
  }

  // 🔹 5. 获取历史订单
  async getOrderHistory(instId?: string): Promise<OKXOrder[]> {
    const params = instId ? { instId } : {};
    return await this.request('GET', '/trade/orders-history', params);
  }

  // 🔹 6. 下单
  async placeOrder(orderRequest: OKXOrderRequest): Promise<OKXOrder> {
    const result = await this.request('POST', '/trade/order', orderRequest);
    return result[0];
  }

  // 🔹 7. 批量下单
  async placeMultipleOrders(orders: OKXOrderRequest[]): Promise<OKXOrder[]> {
    return await this.request('POST', '/trade/batch-orders', orders);
  }

  // 🔹 8. 撤销订单
  async cancelOrder(instId: string, ordId: string): Promise<any> {
    return await this.request('POST', '/trade/cancel-order', {
      instId,
      ordId
    });
  }

  // 🔹 9. 获取市场数据（公共接口，无需签名）
  async getTicker(instId: string): Promise<OKXTicker> {
    const url = `${this.baseURL}/api/v5/market/ticker?instId=${instId}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.code !== '0') {
        throw new Error(`OKX Market API Error: ${data.code} - ${data.msg}`);
      }
      
      return data.data[0];
    } catch (error) {
      console.error('OKX Market Data Failed:', error);
      throw error;
    }
  }

  // 🔹 10. 获取所有交易对行情
  async getAllTickers(): Promise<OKXTicker[]> {
    const url = `${this.baseURL}/api/v5/market/tickers?instType=SPOT`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.code !== '0') {
        throw new Error(`OKX Market API Error: ${data.code} - ${data.msg}`);
      }
      
      return data.data;
    } catch (error) {
      console.error('OKX Market Data Failed:', error);
      throw error;
    }
  }

  // 🔹 11. 获取K线数据
  async getKlines(instId: string, bar: string = '1H', limit: number = 100): Promise<any[]> {
    const url = `${this.baseURL}/api/v5/market/candles?instId=${instId}&bar=${bar}&limit=${limit}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.code !== '0') {
        throw new Error(`OKX Market API Error: ${data.code} - ${data.msg}`);
      }
      
      return data.data;
    } catch (error) {
      console.error('OKX Klines Data Failed:', error);
      throw error;
    }
  }

  // 🔹 12. 市价买入（简化接口）
  async marketBuy(instId: string, amount: string, ccy: 'base_ccy' | 'quote_ccy' = 'quote_ccy'): Promise<OKXOrder> {
    return await this.placeOrder({
      instId,
      tdMode: 'cash',
      side: 'buy',
      ordType: 'market',
      sz: amount,
      tgtCcy: ccy
    });
  }

  // 🔹 13. 市价卖出（简化接口）
  async marketSell(instId: string, amount: string): Promise<OKXOrder> {
    return await this.placeOrder({
      instId,
      tdMode: 'cash',
      side: 'sell',
      ordType: 'market',
      sz: amount,
      tgtCcy: 'base_ccy'
    });
  }

  // 🔹 14. 限价买入（简化接口）
  async limitBuy(instId: string, amount: string, price: string): Promise<OKXOrder> {
    return await this.placeOrder({
      instId,
      tdMode: 'cash',
      side: 'buy',
      ordType: 'limit',
      sz: amount,
      px: price,
      tgtCcy: 'base_ccy'
    });
  }

  // 🔹 15. 限价卖出（简化接口）
  async limitSell(instId: string, amount: string, price: string): Promise<OKXOrder> {
    return await this.placeOrder({
      instId,
      tdMode: 'cash',
      side: 'sell',
      ordType: 'limit',
      sz: amount,
      px: price,
      tgtCcy: 'base_ccy'
    });
  }

  // 🔹 16. 获取交易手续费率
  async getTradingFees(instId?: string): Promise<any> {
    const params = instId ? { instId } : {};
    return await this.request('GET', '/account/trade-fee', params);
  }

  // 🔹 17. 获取资金流水
  async getBills(ccy?: string, type?: string): Promise<any> {
    const params: any = {};
    if (ccy) params.ccy = ccy;
    if (type) params.type = type;
    
    return await this.request('GET', '/account/bills', params);
  }
}

// 导出单例
export const okxAPI = new OKXAPIClient();

// 工具函数
export class OKXUtils {
  // 格式化价格（保留适当小数位）
  static formatPrice(price: number, instId: string): string {
    if (instId.includes('BTC')) return price.toFixed(2);
    if (instId.includes('ETH')) return price.toFixed(2);
    if (price > 1000) return price.toFixed(2);
    if (price > 1) return price.toFixed(4);
    if (price > 0.01) return price.toFixed(6);
    return price.toFixed(8);
  }

  // 格式化数量
  static formatSize(size: number, instId: string): string {
    if (instId.includes('BTC')) return size.toFixed(6);
    if (instId.includes('ETH')) return size.toFixed(4);
    return size.toFixed(4);
  }

  // 计算手续费
  static calculateFee(amount: number, price: number, feeRate: number = 0.001): number {
    return amount * price * feeRate;
  }

  // 风险评估
  static assessRisk(accountBalance: number, orderValue: number): 'low' | 'medium' | 'high' {
    const riskRatio = orderValue / accountBalance;
    if (riskRatio < 0.05) return 'low';      // < 5%
    if (riskRatio < 0.15) return 'medium';   // 5-15%
    return 'high';                           // > 15%
  }

  // OKX交易对转换
  static convertSymbol(symbol: string): string {
    // 将 BTC/USDT 转换为 BTC-USDT
    return symbol.replace('/', '-');
  }

  // 反向转换
  static convertSymbolBack(instId: string): string {
    // 将 BTC-USDT 转换为 BTC/USDT
    return instId.replace('-', '/');
  }
}