'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Bot, TrendingUp, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MarketOverview } from '@/components/MarketOverview';
import { Navigation } from '@/components/Navigation';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-3xl" />
        <div className="relative container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 glassmorphism">
              <Bot className="w-4 h-4 mr-2" />
              AI量子交易技术
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 gradient-text">
              智能交易
              <br />
              量子未来
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-8 leading-relaxed">
              基于先进AI算法的加密货币交易预测平台
              <br />
              让智能算法为您把握每一个交易机会
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/ai-prediction">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 glow-effect">
                  开始AI预测
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="glassmorphism border-white/20 hover:bg-white/10">
                  查看方案
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Market Overview */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">毫秒级实时行情</h2>
            <p className="text-slate-400 text-lg">100毫秒更新频率，捕捉每一个价格波动</p>
            <div className="flex items-center justify-center space-x-2 mt-4">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-400">实时数据流</span>
            </div>
          </div>
          <MarketOverview />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-r from-slate-900/50 to-blue-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">核心功能特色</h2>
            <p className="text-slate-400 text-lg">专业的AI交易工具，助您在加密市场中获得优势</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="glassmorphism trading-card-hover">
              <CardHeader>
                <TrendingUp className="w-12 h-12 text-blue-400 mb-4" />
                <CardTitle className="text-xl">AI智能预测</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400">
                  基于深度学习算法，分析市场数据，提供高精度的价格走势预测，平均准确率达75%以上。
                </p>
              </CardContent>
            </Card>

            <Card className="glassmorphism trading-card-hover">
              <CardHeader>
                <Bot className="w-12 h-12 text-green-400 mb-4" />
                <CardTitle className="text-xl">自动交易机器人</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400">
                  24/7全天候自动交易，根据AI信号执行买卖操作，解放双手，让算法为您赚钱。
                </p>
              </CardContent>
            </Card>

            <Card className="glassmorphism trading-card-hover">
              <CardHeader>
                <Shield className="w-12 h-12 text-purple-400 mb-4" />
                <CardTitle className="text-xl">风险控制</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-400">
                  智能止损止盈设置，多维度风险评估，保护您的投资资金安全。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="glassmorphism rounded-2xl p-8 md:p-12">
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-2">75%+</div>
                <div className="text-slate-400">预测准确率</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-green-400 mb-2">10K+</div>
                <div className="text-slate-400">活跃用户</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-purple-400 mb-2">24/7</div>
                <div className="text-slate-400">全天候监控</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-yellow-400 mb-2">5+</div>
                <div className="text-slate-400">支持币种</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">准备开始您的AI交易之旅？</h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            加入数千名成功交易者的行列，让AI算法为您的投资保驾护航
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 glow-effect">
                <Zap className="mr-2 h-5 w-5" />
                立即注册
              </Button>
            </Link>
            <Link href="/ai-prediction">
              <Button size="lg" variant="outline" className="glassmorphism border-white/20 hover:bg-white/10">
                体验预测
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold gradient-text">AI Quantum Trading</h3>
              <p className="text-slate-400 mt-1">智能交易，量子未来</p>
            </div>
            <div className="flex space-x-6 text-slate-400">
              <Link href="/privacy" className="hover:text-white transition-colors">隐私政策</Link>
              <Link href="/terms" className="hover:text-white transition-colors">服务条款</Link>
              <Link href="/contact" className="hover:text-white transition-colors">联系我们</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-slate-400">
            <p>&copy; 2025 AI Quantum Trading. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}