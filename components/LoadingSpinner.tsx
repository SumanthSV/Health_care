'use client'

import React from 'react';
import { Spin } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';

interface LoadingSpinnerProps {
  size?: 'small' | 'default' | 'large';
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({ 
  size = 'large', 
  message = 'Loading...', 
  fullScreen = false 
}: LoadingSpinnerProps) {
  const content = (
    <div className="text-center animate-fade-in">
      <div className="relative inline-block mb-4">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center animate-pulse">
          <ClockCircleOutlined className="text-2xl text-white" />
        </div>
        <div className="absolute -inset-2 border-2 border-blue-300 rounded-full animate-ping opacity-30"></div>
      </div>
      <div className="space-y-2">
        <Spin size={size} />
        <div className="text-gray-600 font-medium">{message}</div>
        <div className="flex justify-center space-x-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
        {content}
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center py-12">
      {content}
    </div>
  );
}