'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Bot, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigation = [
    { name: '首页', href: '/' },
    { name: 'AI预测', href: '/ai-prediction' },
    { name: '自动交易', href: '/auto-trade' },
    { name: 'OKX交易', href: '/okx-trading' },
    { name: '交易记录', href: '/records' },
    { name: '方案价格', href: '/pricing' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'glassmorphism' : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 cursor-pointer">
            <Bot className="w-8 h-8 text-blue-400" />
            <span className="text-xl font-bold gradient-text">AI Quantum</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`transition-colors hover:text-blue-400 ${
                  pathname === item.href ? 'text-blue-400' : 'text-white'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="glassmorphism">
                    <User className="w-4 h-4 mr-2" />
                    {user.email}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="glassmorphism">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">用户中心</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    登出
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" className="glassmorphism">
                    登录
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    注册
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-white/10">
            <div className="flex flex-col space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block py-2 px-4 rounded transition-colors ${
                    pathname === item.href
                      ? 'text-blue-400 bg-blue-400/10'
                      : 'text-white hover:text-blue-400 hover:bg-white/5'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="block py-2 px-4 rounded text-white hover:text-blue-400 hover:bg-white/5"
                    onClick={() => setIsOpen(false)}
                  >
                    用户中心
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                    className="block py-2 px-4 rounded text-left text-white hover:text-blue-400 hover:bg-white/5"
                  >
                    登出
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="block py-2 px-4 rounded text-white hover:text-blue-400 hover:bg-white/5"
                    onClick={() => setIsOpen(false)}
                  >
                    登录
                  </Link>
                  <Link
                    href="/auth/register"
                    className="block py-2 px-4 rounded text-white hover:text-blue-400 hover:bg-white/5"
                    onClick={() => setIsOpen(false)}
                  >
                    注册
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}