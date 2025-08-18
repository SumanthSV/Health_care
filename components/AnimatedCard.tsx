'use client'

import React, { useState } from 'react';
import { Card } from 'antd';

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  loading?: boolean;
  [key: string]: any;
}

export default function AnimatedCard({ 
  children, 
  className = '', 
  hoverable = true,
  loading = false,
  ...props 
}: AnimatedCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card
      className={`
        transition-all duration-300 ease-in-out
        ${hoverable ? 'hover-lift cursor-pointer' : ''}
        ${isHovered ? 'shadow-xl scale-[1.02]' : 'shadow-md'}
        ${loading ? 'animate-pulse' : ''}
        ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      <div className={`transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
        {children}
      </div>
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      )}
    </Card>
  );
}