'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bot, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        toast.success('登录成功！');
        router.push('/dashboard');
      } else {
        toast.error('登录失败，请检查邮箱和密码');
      }
    } catch (error) {
      toast.error('登录过程中发生错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <Bot className="w-8 h-8 text-blue-400" />
            <span className="text-2xl font-bold gradient-text">AI Quantum</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">欢迎回来</h1>
          <p className="text-slate-400">登录您的账户以继续</p>
        </div>

        <Card className="glassmorphism">
          <CardHeader>
            <CardTitle className="text-center">登录账户</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email">邮箱地址</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="输入您的邮箱"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="glassmorphism border-white/20 pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password">密码</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="输入您的密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="glassmorphism border-white/20 pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Link href="/auth/forgot-password" className="text-sm text-blue-400 hover:text-blue-300">
                  忘记密码？
                </Link>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 glow-effect"
              >
                {loading ? '登录中...' : '登录'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-400">
                还没有账户？{' '}
                <Link href="/auth/register" className="text-blue-400 hover:text-blue-300">
                  立即注册
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-400">
            登录即表示您同意我们的{' '}
            <Link href="/terms" className="text-blue-400 hover:text-blue-300">
              服务条款
            </Link>{' '}
            和{' '}
            <Link href="/privacy" className="text-blue-400 hover:text-blue-300">
              隐私政策
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}