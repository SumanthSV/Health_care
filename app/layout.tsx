'use client'

import './globals.css';
import { Inter } from 'next/font/google';
import { UserProvider } from '@auth0/nextjs-auth0/client';
import { ApolloProvider } from '@apollo/client/';
import { apolloClient } from '../lib/apollo-client';
import { ConfigProvider, theme } from 'antd';
import { Toaster } from 'sonner';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
});

const healthcareTheme = {
  token: {
    colorPrimary: '#0ea5e9', // Modern blue
    colorSuccess: '#10b981', // Modern green
    colorWarning: '#f59e0b', // Modern amber
    colorError: '#ef4444', // Modern red
    colorInfo: '#0ea5e9',
    borderRadius: 12,
    fontFamily: inter.style.fontFamily,
    fontSize: 14,
    controlHeight: 44,
    borderRadiusLG: 16,
    borderRadiusSM: 8,
  },
  components: {
    Button: {
      borderRadius: 12,
      controlHeight: 44,
      fontWeight: 500,
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    },
    Input: {
      borderRadius: 12,
      controlHeight: 44,
      fontSize: 14,
    },
    Card: {
      borderRadius: 16,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    },
    Table: {
      borderRadius: 16,
    },
    Menu: {
      borderRadius: 12,
      itemBorderRadius: 8,
    },
    Modal: {
      borderRadius: 16,
    },
  },
  algorithm: theme.defaultAlgorithm,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#1890ff" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <title>HealthShift - Staff Clock Management</title>
        <meta name="description" content="Healthcare staff shift management and clock-in/out system" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <UserProvider>
          <ApolloProvider client={apolloClient}>
            <ConfigProvider theme={healthcareTheme}>
              {children}
              <Toaster 
                position="top-right" 
                richColors 
                toastOptions={{
                  style: {
                    borderRadius: '12px',
                    padding: '16px',
                    fontSize: '14px',
                    fontFamily: inter.style.fontFamily,
                  }
                }}
              />
            </ConfigProvider>
          </ApolloProvider>
        </UserProvider>
      </body>
    </html>
  );
}