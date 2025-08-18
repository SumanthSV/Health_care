'use client'

import React, { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Menu, 
  X, 
  Home, 
  BarChart3, 
  Users, 
  MapPin, 
  Clock, 
  History,
  LogOut,
  User,
  Shield,
  Activity
} from 'lucide-react';
import { Button } from './button';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';

interface NavbarProps {
  userRole?: 'MANAGER' | 'CARE_WORKER';
  userName?: string;
  userEmail?: string;
  userImage?: string;
}

export default function Navbar({ userRole, userName, userEmail, userImage }: NavbarProps) {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isAuthenticated = !!user;
  const isHomePage = pathname === '/';

  const managerNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/dashboard?tab=staff', label: 'Staff Status', icon: Users },
    { href: '/dashboard?tab=location', label: 'Locations', icon: MapPin },
  ];

  const workerNavItems = [
    { href: '/dashboard', label: 'Clock In/Out', icon: Clock },
    { href: '/dashboard?tab=history', label: 'History', icon: History },
  ];

  const navItems = userRole === 'MANAGER' ? managerNavItems : workerNavItems;

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleSignOut = () => {
    router.push('/api/auth/logout');
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled || !isHomePage 
          ? 'bg-transparent backdrop-blur-md border-b border-gray-200 shadow-sm' 
          : 'border-gray-200  bg-gradient-to-br from-blue-600 to-blue-700 shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link 
              href={isAuthenticated ? '/dashboard' : '/'} 
              className="flex items-center space-x-2 group"
            >
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className={`text-xl font-bold transition-colors duration-200 ${
                isScrolled || !isHomePage ? 'text-gray-900' : 'text-white'
              }`}>
                HealthShift
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {isAuthenticated ? (
                <>
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || 
                      (item.href.includes('?tab=') && pathname === '/dashboard');
                    
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-primary text-white shadow-sm'
                            : isScrolled || !isHomePage
                            ? 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                            : 'text-white/90 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                  
                  {/* User Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-10 w-10 rounded-full ml-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={userImage ?? user?.picture ?? undefined} alt={(userName || user?.name) || undefined} />
                          <AvatarFallback className="bg-primary text-white">
                            {getUserInitials(userName || user?.name || 'U')}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {userName || user?.name}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {userEmail || user?.email}
                          </p>
                          <div className="flex items-center space-x-1 mt-1">
                            <Shield className="w-3 h-3" />
                            <span className="text-xs text-muted-foreground">
                              {userRole === 'MANAGER' ? 'Manager' : 'Care Worker'}
                            </span>
                          </div>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link
                    href="/api/auth/login"
                    className={`text-sm font-medium transition-colors duration-200 ${
                      isScrolled || !isHomePage
                        ? 'text-gray-700 hover:text-gray-900'
                        : 'text-white/90 hover:text-white'
                    }`}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/api/auth/login?screen_hint=signup"
                    className="premium-button-primary px-4 py-2 text-sm"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleMobileMenuToggle}
                className={`transition-colors duration-200 ${
                  isScrolled || !isHomePage
                    ? 'text-gray-700 hover:text-gray-900'
                    : 'text-white hover:text-white'
                }`}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
            <div className="px-4 py-4 space-y-2">
              {isAuthenticated ? (
                <>
                  {/* User Info */}
                  <div className="flex items-center space-x-3 pb-4 border-b border-gray-200">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={userImage ?? user?.picture ?? undefined} alt={(userName || user?.name) || undefined} />
                      <AvatarFallback className="bg-primary text-white">
                        {getUserInitials(userName || user?.name || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {userName || user?.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {userEmail || user?.email}
                      </p>
                      <div className="flex items-center space-x-1 mt-1">
                        <Shield className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                          {userRole === 'MANAGER' ? 'Manager' : 'Care Worker'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Navigation Items */}
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || 
                      (item.href.includes('?tab=') && pathname === '/dashboard');
                    
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMobileMenu}
                        className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors duration-200 mobile-button ${
                          isActive
                            ? 'bg-primary text-white'
                            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}

                  {/* Sign Out */}
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200 w-full mobile-button"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/api/auth/login"
                    onClick={closeMobileMenu}
                    className="block px-3 py-3 rounded-lg text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200 mobile-button"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/api/auth/login?screen_hint=signup"
                    onClick={closeMobileMenu}
                    className="block premium-button-primary px-3 py-3 text-sm text-center mobile-button"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Spacer to prevent content from hiding behind fixed navbar */}
      <div className="h-16" />
    </>
  );
}