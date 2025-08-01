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

  const handleNavClick = (href: string) => {
    setIsOpen(false);
    // 强制页面跳转
    window.location.href = href;
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'glassmorphism backdrop-blur-md' : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <div 
            onClick={() => handleNavClick('/')}
            className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <Bot className="w-8 h-8 text-blue-400" />
            <span className="text-xl font-bold gradient-text">AI Quantum</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.href)}
                className={`transition-colors hover:text-blue-400 cursor-pointer ${
                  pathname === item.href ? 'text-blue-400' : 'text-white'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="glassmorphism hover:bg-white/10">
                    <User className="w-4 h-4 mr-2" />
                    {user.email.split('@')[0]}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="glassmorphism border-white/20">
                  <DropdownMenuItem onClick={() => handleNavClick('/dashboard')}>
                    用户中心
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/20" />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    登出
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  className="glassmorphism hover:bg-white/10"
                  onClick={() => handleNavClick('/auth/login')}
                >
                  登录
                </Button>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => handleNavClick('/auth/register')}
                >
                  注册
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden hover:bg-white/10"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-white/10 glassmorphism">
            <div className="flex flex-col space-y-2">
              {navigation.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.href)}
                  className={`block py-3 px-4 rounded transition-colors text-left ${
                    pathname === item.href
                      ? 'text-blue-400 bg-blue-400/10'
                      : 'text-white hover:text-blue-400 hover:bg-white/5'
                  }`}
                >
                  {item.name}
                </button>
              ))}
              
              <div className="border-t border-white/10 pt-2 mt-2">
                {user ? (
                  <>
                    <button
                      onClick={() => handleNavClick('/dashboard')}
                      className="block py-3 px-4 rounded text-left text-white hover:text-blue-400 hover:bg-white/5 w-full"
                    >
                      用户中心
                    </button>
                    <button
                      onClick={handleLogout}
                      className="block py-3 px-4 rounded text-left text-white hover:text-blue-400 hover:bg-white/5 w-full"
                    >
                      <LogOut className="w-4 h-4 mr-2 inline" />
                      登出
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleNavClick('/auth/login')}
                      className="block py-3 px-4 rounded text-left text-white hover:text-blue-400 hover:bg-white/5 w-full"
                    >
                      登录
                    </button>
                    <button
                      onClick={() => handleNavClick('/auth/register')}
                      className="block py-3 px-4 rounded text-left text-white hover:text-blue-400 hover:bg-white/5 w-full"
                    >
                      注册
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}