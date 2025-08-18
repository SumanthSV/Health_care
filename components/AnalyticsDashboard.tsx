'use client'

import React from 'react';
import { Card, Row, Col, Typography, Statistic, Spin, Empty, Progress } from 'antd';
import { 
  ClockCircleOutlined, 
  TeamOutlined, 
  WarningOutlined,
  CalendarOutlined,
  // TrendingUp, // Removed because it does not exist in @ant-design/icons
  LineChartOutlined,
  UsergroupAddOutlined
} from '@ant-design/icons';
import { useQuery } from '@apollo/client';
import { gql } from 'graphql-tag';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

const { Title, Text } = Typography;

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ChartTitle,
  Tooltip,
  Legend,
  ArcElement
);

const GET_ANALYTICS = gql`
  query GetAnalytics {
    shiftAnalytics {
      totalHoursToday
      averageHoursPerDay
      totalStaffClockedIn
      dailyClockIns {
        date
        count
      }
      weeklyHours {
        staffName
        hours
      }
    }
  }
`;

export default function AnalyticsDashboard() {
  const { data, loading, error } = useQuery(GET_ANALYTICS, {
    pollInterval: 60000, // Update every minute
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96 animate-fade-in">
        <div className="text-center">
          <Spin size="large" />
          <div className="mt-4">
            <Text type="secondary">Loading analytics...</Text>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="premium-card p-8">
        <Empty 
          description="Unable to load analytics" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  const analytics = data?.shiftAnalytics;

  // Chart configurations
  const dailyClockInsData = {
    labels: analytics?.dailyClockIns?.map((item: any) => 
      new Date(item.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    ) || [],
    datasets: [
      {
        label: 'Daily Clock-Ins',
        data: analytics?.dailyClockIns?.map((item: any) => item.count) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const weeklyHoursData = {
    labels: analytics?.weeklyHours?.map((item: any) => item.staffName) || [],
    datasets: [
      {
        label: 'Weekly Hours',
        data: analytics?.weeklyHours?.map((item: any) => item.hours) || [],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(6, 182, 212, 0.8)',
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(6, 182, 212, 1)',
        ],
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  };

  const statusData = {
    labels: ['Clocked In', 'Clocked Out'],
    datasets: [
      {
        data: [analytics?.totalStaffClockedIn || 0, Math.max(0, 12 - (analytics?.totalStaffClockedIn || 0))],
        backgroundColor: ['rgba(16, 185, 129, 0.8)', 'rgba(156, 163, 175, 0.3)'],
        borderColor: ['rgba(16, 185, 129, 1)', 'rgba(156, 163, 175, 0.6)'],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            family: 'Inter',
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        cornerRadius: 8,
        padding: 12,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            family: 'Inter',
          }
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            family: 'Inter',
          }
        }
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            family: 'Inter',
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        cornerRadius: 8,
        padding: 12,
      }
    },
  };

  return (
    <div className="space-y-8 animate-fade-in bg-mesh-gradient p-6 rounded-3xl">
      {/* Performance Overview */}
      <div className="premium-card p-6 shadow-xl bg-gradient-to-br from-white to-blue-50 border-blue-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Performance Overview</h3>
            <p className="text-gray-600">Key metrics and trends for today</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-green-600">
            <LineChartOutlined className="text-2xl text-green-600" />
            <span>All systems operational</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <LineChartOutlined className="text-2xl text-white" />
            </div>
            <div className="text-3xl font-bold text-blue-700 mb-1">
              {analytics?.totalHoursToday?.toFixed(1) || '0.0'}h
            </div>
            <div className="text-sm text-blue-600 mb-2 font-medium">Hours Today</div>
            <Progress 
              percent={Math.min(100, ((analytics?.totalHoursToday || 0) / 40) * 100)} 
              showInfo={false} 
              strokeColor="linear-gradient(to right, #3b82f6, #10b981)"
              trailColor="#e5e7eb"
              size="small"
            />
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <UsergroupAddOutlined className="text-2xl text-white" />
            </div>
            <div className="text-3xl font-bold text-green-700 mb-1">
              {analytics?.totalStaffClockedIn || 0}
            </div>
            <div className="text-sm text-green-600 mb-2 font-medium">Active Staff</div>
            <Progress 
              percent={Math.min(100, ((analytics?.totalStaffClockedIn || 0) / 12) * 100)} 
              showInfo={false} 
              strokeColor="linear-gradient(to right, #10b981, #059669)"
              trailColor="#e5e7eb"
              size="small"
            />
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <ClockCircleOutlined className="text-2xl text-white" />
            </div>
            <div className="text-3xl font-bold text-purple-700 mb-1">
              {analytics?.averageHoursPerDay?.toFixed(1) || '0.0'}h
            </div>
            <div className="text-sm text-purple-600 mb-2 font-medium">Daily Average</div>
            <Progress 
              percent={Math.min(100, ((analytics?.averageHoursPerDay || 0) / 8) * 100)} 
              showInfo={false} 
              strokeColor="linear-gradient(to right, #8b5cf6, #7c3aed)"
              trailColor="#e5e7eb"
              size="small"
            />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="premium-card p-6 hover-lift shadow-xl bg-gradient-to-br from-white to-gray-50">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Daily Activity</h4>
                <p className="text-sm text-gray-600">Clock-ins over the past week</p>
              </div>
              <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Last 7 days
              </div>
            </div>
            <div style={{ height: '320px' }}>
              {analytics?.dailyClockIns?.length > 0 ? (
                <Bar data={dailyClockInsData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Empty 
                    description="No activity data available" 
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div>
          <div className="premium-card p-6 hover-lift shadow-xl bg-gradient-to-br from-white to-green-50 border-green-200">
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900">Staff Status</h4>
              <p className="text-sm text-gray-600">Current availability</p>
            </div>
            <div style={{ height: '200px' }} className="mb-4">
              <Doughnut data={statusData} options={doughnutOptions} />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Clocked In</span>
                </div>
                <span className="font-medium">{analytics?.totalStaffClockedIn || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  <span>Available</span>
                </div>
                <span className="font-medium">{Math.max(0, 12 - (analytics?.totalStaffClockedIn || 0))}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Hours Chart */}
      <div className="premium-card p-6 animate-scale-in hover-lift shadow-xl bg-gradient-to-br from-white to-purple-50 border-purple-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="text-lg font-semibold text-gray-900">Weekly Hours by Staff</h4>
            <p className="text-sm text-gray-600">Individual performance this week</p>
          </div>
          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            Current week
          </div>
        </div>
        <div style={{ height: '350px' }}>
          {analytics?.weeklyHours?.length > 0 ? (
            <Bar 
              data={weeklyHoursData} 
              options={{
                ...chartOptions,
                indexAxis: 'y' as const,
                plugins: {
                  legend: {
                    display: false,
                  },
                  tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'white',
                    bodyColor: 'white',
                    cornerRadius: 8,
                    padding: 12,
                  }
                },
                scales: {
                  x: {
                    beginAtZero: true,
                    grid: {
                      color: 'rgba(0, 0, 0, 0.05)',
                    },
                    ticks: {
                      font: {
                        family: 'Inter',
                      }
                    }
                  },
                  y: {
                    grid: {
                      display: false,
                    },
                    ticks: {
                      font: {
                        family: 'Inter',
                      }
                    }
                  },
                },
              }} 
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Empty 
                description="No staff hours data available" 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}