'use client'

import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Badge, Avatar, Spin } from 'antd';
import { 
  DashboardOutlined, 
  TeamOutlined, 
  EnvironmentOutlined,
  BarChartOutlined,
  UserOutlined,
  RiseOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useSearchParams } from 'next/navigation';
import StaffStatusTable from './StaffStatusTable';
import AnalyticsDashboard from './AnalyticsDashboard';
import LocationSetter from './LocationSetter';
import Navbar from './ui/navbar';
import { useQuery } from '@apollo/client';
import { gql } from 'graphql-tag';

const { Title, Text } = Typography;

const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    shiftAnalytics {
      totalHoursToday
      totalStaffClockedIn
      averageHoursPerDay
    }
    activeShifts {
      id
      user {
        name
      }
    }
  }
`;

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Props {
  user: User;
}

export default function ManagerDashboard({ user }: Props) {
  const searchParams = useSearchParams();
  const [selectedTab, setSelectedTab] = useState(searchParams!.get('tab') || 'overview');
  const { user: auth0User } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const { data: statsData, loading: statsLoading } = useQuery(GET_DASHBOARD_STATS, {
    pollInterval: 30000, // Update every 30 seconds
  });

  useEffect(() => {
    const tab = searchParams!.get('tab') || 'overview';
    setSelectedTab(tab);
    setIsLoading(false);
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar userRole="MANAGER" userName={user.name} userEmail={user.email} userImage={auth0User?.picture ?? undefined} />
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center animate-fade-in">
            <Spin size="large" />
            <div className="mt-4">
              <Text className="text-gray-600">Loading Manager Dashboard...</Text>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stats = statsData?.shiftAnalytics;
  const activeStaff = statsData?.activeShifts || [];

  const renderContent = () => {
    switch (selectedTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="premium-card p-6 hover-lift bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Staff Clocked In</p>
                    <p className="text-3xl font-bold text-blue-700 mt-2">
                      {statsLoading ? (
                        <div className="loading-skeleton h-8 w-16 rounded" />
                      ) : (
                        stats?.totalStaffClockedIn || 0
                      )}
                    </p>
                    <p className="text-sm text-blue-500 mt-1">
                      {activeStaff.length} active now
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <UserOutlined className="text-2xl text-white" />
                  </div>
                </div>
              </div>

              <div className="premium-card p-6 hover-lift bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Hours Today</p>
                    <p className="text-3xl font-bold text-green-700 mt-2">
                      {statsLoading ? (
                        <div className="loading-skeleton h-8 w-16 rounded" />
                      ) : (
                        `${stats?.totalHoursToday?.toFixed(1) || '0.0'}h`
                      )}
                    </p>
                    <p className="text-sm text-green-500 mt-1">
                      Avg: {stats?.averageHoursPerDay?.toFixed(1) || '0.0'}h/day
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <ClockCircleOutlined className="text-2xl text-white" />
                  </div>
                </div>
              </div>

              <div className="premium-card p-6 hover-lift bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Efficiency</p>
                    <p className="text-3xl font-bold text-purple-700 mt-2">98.5%</p>
                    <p className="text-sm text-purple-500 mt-1">+2.1% from last week</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <RiseOutlined className="text-2xl text-white" />
                  </div>
                </div>
              </div>

              <div className="premium-card p-6 hover-lift bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">Locations</p>
                    <p className="text-3xl font-bold text-orange-700 mt-2">3</p>
                    <p className="text-sm text-orange-500 mt-1">Active zones</p>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <EnvironmentOutlined className="text-2xl text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Analytics Dashboard */}
            <AnalyticsDashboard />
          </div>
        );
      case 'staff':
        return <StaffStatusTable />;
      case 'location':
        return <LocationSetter />;
      default:
        return (
          <div className="space-y-8">
            <AnalyticsDashboard />
          </div>
        );
    }
  };

  const tabItems = [
    { key: 'overview', label: 'Dashboard Overview', icon: BarChartOutlined },
    { key: 'staff', label: 'Staff Status', icon: TeamOutlined },
    { key: 'location', label: 'Location Settings', icon: EnvironmentOutlined },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-green-50 bg-galaxy-pattern">
      <Navbar userRole="MANAGER" userName={user.name} userEmail={user.email} userImage={auth0User?.picture ?? undefined} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {selectedTab === 'overview' && 'Dashboard Overview'}
                {selectedTab === 'staff' && 'Staff Management'}
                {selectedTab === 'location' && 'Location Settings'}
              </h1>
              <p className="text-gray-600 mt-2">
                {selectedTab === 'overview' && 'Monitor system performance and key Metrics'}
                {selectedTab === 'staff' && 'View real-time staff status and activity'}
                {selectedTab === 'location' && 'Configure work location perimeters'}
              </p>
            </div>
            <Badge className="status-online">
              Manager
            </Badge>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabItems.map((tab) => {
                const Icon = tab.icon;
                const isActive = selectedTab === tab.key;
                
                return (
                  <button
                    key={tab.key}
                    onClick={() => setSelectedTab(tab.key)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                      isActive
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="animate-scale-in">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}