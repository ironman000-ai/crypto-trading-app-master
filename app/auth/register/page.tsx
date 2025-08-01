'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bot, Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('密码和确认密码不匹配');
      return;
    }

    if (!agreed) {
      toast.error('请同意服务条款和隐私政策');
      return;
    }

    setLoading(true);

    try {
      const success = await register(email, password);
      if (success) {
        toast.success('注册成功！欢迎加入AI Quantum Trading');
        router.push('/dashboard');
      } else {
        toast.error('注册失败，请稍后重试');
      }
    } catch (error) {
      toast.error('注册过程中发生错误');
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
          <h1 className="text-3xl font-bold mb-2">创建账户</h1>
          <p className="text-slate-400">加入AI智能交易的世界</p>
        </div>

        <Card className="glassmorphism">
          <CardHeader>
            <CardTitle className="text-center">注册新账户</CardTitle>
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
                    placeholder="创建安全密码（至少8位）"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="glassmorphism border-white/20 pl-10 pr-10"
                    required
                    minLength={8}
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

              <div>
                <Label htmlFor="confirm-password">确认密码</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="再次输入密码"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="glassmorphism border-white/20 pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="agree"
                  checked={agreed}
                  onCheckedChange={(checked) => setAgreed(checked as boolean)}
                  className="mt-1"
                />
                <Label htmlFor="agree" className="text-sm text-slate-400 leading-relaxed">
                  我同意{' '}
                  <Link href="/terms" className="text-blue-400 hover:text-blue-300">
                    服务条款
                  </Link>{' '}
                  和{' '}
                  <Link href="/privacy" className="text-blue-400 hover:text-blue-300">
                    隐私政策
                  </Link>
                </Label>
              </div>

              <Button
                type="submit"
                disabled={loading || !agreed}
                className="w-full bg-blue-600 hover:bg-blue-700 glow-effect"
              >
                {loading ? '注册中...' : '创建账户'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-400">
                已有账户？{' '}
                <Link href="/auth/login" className="text-blue-400 hover:text-blue-300">
                  立即登录
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-400">
            注册后您将免费获得基础预测功能
          </p>
        </div>
      </div>
    </div>
  );
}