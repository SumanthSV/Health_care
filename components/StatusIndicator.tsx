'use client'

import React from 'react';
import { Badge } from 'antd';

interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'busy' | 'away';
  text?: string;
  size?: 'small' | 'default' | 'large';
  animated?: boolean;
}

export default function StatusIndicator({ 
  status, 
  text, 
  size = 'default',
  animated = true 
}: StatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'online':
        return {
          color: 'success',
          className: 'status-online',
          text: text || 'Online'
        };
      case 'busy':
        return {
          color: 'error',
          className: 'status-busy',
          text: text || 'Busy'
        };
      case 'away':
        return {
          color: 'warning',
          className: 'status-away',
          text: text || 'Away'
        };
      default:
        return {
          color: 'default',
          className: 'status-offline',
          text: text || 'Offline'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="flex items-center space-x-2">
      <div className="relative">
        <Badge 
          status={config.color as any} 
          className={`${config.className} ${animated ? 'animate-pulse' : ''}`}
        />
        {animated && status === 'online' && (
          <div className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-30"></div>
        )}
      </div>
      {text && (
        <span className={`text-sm font-medium ${
          status === 'online' ? 'text-green-600' :
          status === 'busy' ? 'text-red-600' :
          status === 'away' ? 'text-yellow-600' :
          'text-gray-500'
        }`}>
          {config.text}
        </span>
      )}
    </div>
  );
}