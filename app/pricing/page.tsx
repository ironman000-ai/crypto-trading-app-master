'use client';

import { useState } from 'react';
import { Check, Crown, Zap, Bot, TrendingUp, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navigation } from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const plans = [
  {
    name: '免费版',
    price: 0,
    period: '永久免费',
    description: '体验AI预测的强大功能',
    badge: null,
    features: [
      '基础AI预测（每日3次）',
      '查看实时行情',
      '手动交易记录',
      '基础技术指标',
      '社区支持',
    ],
    limitations: [
      '预测次数限制',
      '无自动交易功能',
      '基础图表功能',
    ],
  },
  {
    name: '高级版',
    price: 29,
    period: '每月',
    description: '释放AI交易的全部潜力',
    badge: 'Popular',
    features: [
      '无限AI预测次数',
      '自动交易机器人',
      '高级技术分析',
      '多币种组合策略',
      '详细交易报告',
      '优先客户支持',
      '实时市场警报',
      '风险管理工具',
      '回测功能',
    ],
    limitations: [],
  },
  {
    name: '专业版',
    price: 99,
    period: '每月',
    description: '专业交易者的终极选择',
    badge: 'Premium',
    features: [
      '高级版全部功能',
      'VIP专属算法策略',
      '个人交易顾问',
      '定制化交易策略',
      '机构级数据分析',
      '7x24小时电话支持',
      'API接口访问',
      '白标解决方案',
      '团队协作工具',
    ],
    limitations: [],
  },
];

export default function PricingPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (planName: string, price: number) => {
    if (!user) {
      toast.error('请先登录以订阅服务');
      return;
    }

    setLoading(planName);
    
    try {
      // Simulate payment process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (price === 0) {
        toast.success('免费版功能已激活！');
      } else {
        toast.success(`成功订阅${planName}！`);
      }
    } catch (error) {
      toast.error('订阅失败，请稍后重试');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
      <Navigation />
      
      <div className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
            选择您的AI交易方案
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            从基础预测到专业交易，我们为每个交易者都准备了合适的方案
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={plan.name} 
              className={`glassmorphism trading-card-hover relative ${
                plan.badge === 'Popular' ? 'ring-2 ring-blue-400 scale-105' : ''
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge 
                    className={`px-4 py-1 ${
                      plan.badge === 'Popular' ? 'bg-blue-600' : 'bg-purple-600'
                    }`}
                  >
                    {plan.badge === 'Popular' ? (
                      <>
                        <Star className="w-3 h-3 mr-1" />
                        最受欢迎
                      </>
                    ) : (
                      <>
                        <Crown className="w-3 h-3 mr-1" />
                        尊享版
                      </>
                    )}
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center">
                <div className="mb-4">
                  {index === 0 && <Zap className="w-12 h-12 text-blue-400 mx-auto" />}
                  {index === 1 && <Bot className="w-12 h-12 text-green-400 mx-auto" />}
                  {index === 2 && <TrendingUp className="w-12 h-12 text-purple-400 mx-auto" />}
                </div>
                <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                <div className="mb-4">
                  <span className="text-4xl font-bold">
                    {plan.price === 0 ? '免费' : `$${plan.price}`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-slate-400 ml-1">/{plan.period}</span>
                  )}
                </div>
                <p className="text-slate-400">{plan.description}</p>
              </CardHeader>

              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3 flex items-center">
                    <Check className="w-4 h-4 mr-2 text-green-400" />
                    包含功能
                  </h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start text-sm">
                        <Check className="w-4 h-4 mr-2 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {plan.limitations.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 text-slate-400">限制</h4>
                    <ul className="space-y-2">
                      {plan.limitations.map((limitation, i) => (
                        <li key={i} className="flex items-start text-sm text-slate-400">
                          <span className="w-4 h-4 mr-2 mt-0.5 text-xs">•</span>
                          <span>{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button
                  onClick={() => handleSubscribe(plan.name, plan.price)}
                  disabled={loading === plan.name}
                  className={`w-full ${
                    plan.badge === 'Popular' 
                      ? 'bg-blue-600 hover:bg-blue-700 glow-effect' 
                      : plan.badge === 'Premium'
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : 'bg-slate-600 hover:bg-slate-700'
                  }`}
                >
                  {loading === plan.name ? (
                    '处理中...'
                  ) : plan.price === 0 ? (
                    '立即开始'
                  ) : (
                    `订阅${plan.name}`
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">常见问题</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="glassmorphism">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">如何取消订阅？</h3>
                <p className="text-slate-400 text-sm">
                  您可以随时在用户中心取消订阅，取消后您仍可使用至当前计费周期结束。
                </p>
              </CardContent>
            </Card>

            <Card className="glassmorphism">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">支持哪些支付方式？</h3>
                <p className="text-slate-400 text-sm">
                  我们支持信用卡、PayPal、以及主流加密货币支付（BTC、ETH、USDT）。
                </p>
              </CardContent>
            </Card>

            <Card className="glassmorphism">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">AI预测准确率如何？</h3>
                <p className="text-slate-400 text-sm">
                  我们的AI算法平均预测准确率达到75%以上，但请注意市场有风险，投资需谨慎。
                </p>
              </CardContent>
            </Card>

            <Card className="glassmorphism">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">是否提供退款？</h3>
                <p className="text-slate-400 text-sm">
                  我们提供7天无条件退款保证，如果您不满意服务，可以申请全额退款。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold mb-4">准备开始您的AI交易之旅？</h2>
          <p className="text-xl text-slate-300 mb-8">
            选择适合您的方案，立即体验AI驱动的智能交易
          </p>
          {!user && (
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 glow-effect">
              <a href="/auth/register">立即注册</a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}