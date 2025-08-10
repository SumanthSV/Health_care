'use client'

import React from 'react';
import { Table, Tag, Card, Typography, Avatar, Space, Tooltip, Badge } from 'antd';
import { UserOutlined, ClockCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useQuery } from '@apollo/client';
import { gql } from 'graphql-tag';

const { Title, Text } = Typography;

const GET_ACTIVE_SHIFTS = gql`
  query GetActiveShifts {
    activeShifts {
      id
      clockInTime
      clockInLocation
      clockInNotes
      status
      user {
        id
        name
        email
      }
    }
  }
`;

export default function StaffStatusTable() {
  const { data, loading, error } = useQuery(GET_ACTIVE_SHIFTS, {
    pollInterval: 30000, // Poll every 30 seconds for real-time updates
  });

  const formatDuration = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const formatLocation = (location: any) => {
    if (!location) return 'N/A';
    if (location.address) return location.address;
    return `${location.lat?.toFixed(4)}, ${location.lng?.toFixed(4)}`;
  };

  const columns = [
    {
      title: 'Staff Member',
      key: 'staff',
      render: (record: any) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div className="font-semibold">{record.user.name}</div>
            <Text type="secondary" className="text-sm">{record.user.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (record: any) => (
        <Space>
          <Badge status="success" />
          <Tag color="green">Clocked In</Tag>
        </Space>
      ),
    },
    {
      title: 'Clock-In Time',
      key: 'clockInTime',
      render: (record: any) => (
        <div>
          <div>{new Date(record.clockInTime).toLocaleTimeString()}</div>
          <Text type="secondary" className="text-sm">
            {new Date(record.clockInTime).toLocaleDateString()}
          </Text>
        </div>
      ),
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (record: any) => (
        <div className="flex items-center space-x-2">
          <ClockCircleOutlined className="text-blue-500" />
          <Text strong>{formatDuration(record.clockInTime)}</Text>
        </div>
      ),
    },
    {
      title: 'Location',
      key: 'location',
      render: (record: any) => (
        <Tooltip title={`Lat: ${record.clockInLocation?.lat}, Lng: ${record.clockInLocation?.lng}`}>
          <div className="flex items-center space-x-2">
            <EnvironmentOutlined className="text-green-500" />
            <Text className="max-w-xs truncate">
              {formatLocation(record.clockInLocation)}
            </Text>
          </div>
        </Tooltip>
      ),
    },
    {
      title: 'Notes',
      key: 'notes',
      render: (record: any) => (
        <Text type="secondary" className="max-w-xs truncate">
          {record.clockInNotes || 'No notes'}
        </Text>
      ),
    },
  ];

  if (error) {
    return (
      <Card>
        <div className="text-center py-8">
          <Text type="danger">Error loading staff status: {error.message}</Text>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-in-left">
        <Card className="hover-lift transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <Text type="secondary">Currently Clocked In</Text>
              <div className="text-3xl font-bold text-green-600 animate-scale-in">
                {data?.activeShifts?.length || 0}
              </div>
            </div>
            <div className="text-4xl text-green-500 animate-pulse-slow">
              <UserOutlined />
            </div>
          </div>
        </Card>

        <Card className="hover-lift transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <Text type="secondary">Total Active Hours</Text>
              <div className="text-3xl font-bold text-blue-600 animate-scale-in">
                {data?.activeShifts?.reduce((total: number, shift: any) => {
                  const start = new Date(shift.clockInTime);
                  const now = new Date();
                  const hours = (now.getTime() - start.getTime()) / (1000 * 60 * 60);
                  return total + hours;
                }, 0)?.toFixed(1) || '0.0'}
              </div>
            </div>
            <div className="text-4xl text-blue-500 animate-pulse-slow">
              <ClockCircleOutlined />
            </div>
          </div>
        </Card>

        <Card className="hover-lift transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <Text type="secondary">Average Shift Time</Text>
              <div className="text-3xl font-bold text-purple-600 animate-scale-in">
                {data?.activeShifts?.length > 0 ? 
                  (data.activeShifts.reduce((total: number, shift: any) => {
                    const start = new Date(shift.clockInTime);
                    const now = new Date();
                    const hours = (now.getTime() - start.getTime()) / (1000 * 60 * 60);
                    return total + hours;
                  }, 0) / data.activeShifts.length).toFixed(1) : '0.0'
                }h
              </div>
            </div>
            <div className="text-4xl text-purple-500 animate-pulse-slow">
              <EnvironmentOutlined />
            </div>
          </div>
        </Card>
      </div>

      {/* Staff Status Table */}
      <Card className="animate-slide-in-right hover-lift">
        <div className="mb-6">
          <Title level={4} className="mb-2">Active Staff Members</Title>
          <Text type="secondary">
            Real-time view of all staff currently clocked in
          </Text>
        </div>
        
        <Table
          columns={columns}
          dataSource={data?.activeShifts || []}
          loading={loading}
          pagination={false}
          rowKey="id"
          className="custom-table"
          locale={{
            emptyText: (
              <div className="py-8 text-center animate-fade-in">
                <UserOutlined className="text-6xl text-gray-300 mb-4" />
                <Title level={4} className="text-gray-400">No Staff Currently Clocked In</Title>
                <Text type="secondary">All staff members are currently clocked out</Text>
              </div>
            )
          }}
        />
      </Card>
    </div>
  );
}