'use client'

import React, { useState } from 'react';
import { Table, Tag, Card, Typography, Avatar, Space, Tooltip, Badge, Button, Modal, Divider } from 'antd';
import { UserOutlined, ClockCircleOutlined, EnvironmentOutlined, EyeOutlined, InfoCircleOutlined } from '@ant-design/icons';
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

  const [selectedWorker, setSelectedWorker] = useState<any>(null);
  const [locationModalVisible, setLocationModalVisible] = useState(false);

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
    return `${location.lat?.toFixed(6)}, ${location.lng?.toFixed(6)}`;
  };

  const getLocationName = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        return result.formatted_address;
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const showLocationDetails = async (worker: any) => {
    if (worker.clockInLocation) {
      const address = await getLocationName(worker.clockInLocation.lat, worker.clockInLocation.lng);
      setSelectedWorker({
        ...worker,
        fullAddress: address
      });
      setLocationModalVisible(true);
    }
  };

  const columns = [
    {
      title: 'Staff Member',
      key: 'staff',
      render: (record: any) => (
        <Space>
          <Avatar 
            icon={<UserOutlined />} 
            className="bg-gradient-to-br from-blue-500 to-green-500 border-2 border-white shadow-lg"
          />
          <div>
            <div className="font-semibold text-gray-900">{record.user.name}</div>
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
          <div className="relative">
            <Badge status="success" />
            <div className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-30"></div>
          </div>
          <Tag color="green" className="font-medium px-3 py-1 rounded-full">
            <ClockCircleOutlined className="mr-1" />
            Active
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Clock-In Time',
      key: 'clockInTime',
      render: (record: any) => (
        <div className="space-y-1">
          <div className="font-medium text-gray-900">
            {new Date(record.clockInTime).toLocaleTimeString()}
          </div>
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
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          <Text strong className="text-blue-600 font-mono">
            {formatDuration(record.clockInTime)}
          </Text>
        </div>
      ),
    },
    {
      title: 'Location',
      key: 'location',
      render: (record: any) => (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <EnvironmentOutlined className="text-green-500" />
            <Text className="max-w-xs truncate font-medium">
              {record.clockInLocation ? 'Location Available' : 'No Location'}
            </Text>
          </div>
          {record.clockInLocation && (
            <div className="space-y-1">
              <div className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded">
                {record.clockInLocation.lat?.toFixed(4)}, {record.clockInLocation.lng?.toFixed(4)}
              </div>
              <Button
                size="small"
                type="link"
                icon={<EyeOutlined />}
                onClick={() => showLocationDetails(record)}
                className="p-0 h-auto text-blue-600 hover:text-blue-800"
              >
                View Details
              </Button>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Notes',
      key: 'notes',
      render: (record: any) => (
        <div className="max-w-xs">
          {record.clockInNotes ? (
            <Tooltip title={record.clockInNotes}>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                <Text className="text-sm text-blue-800 line-clamp-2">
                  {record.clockInNotes}
                </Text>
              </div>
            </Tooltip>
          ) : (
            <Text type="secondary" className="text-sm italic">No notes</Text>
          )}
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <Card className="premium-card">
        <div className="text-center py-8">
          <Text type="danger">Error loading staff status: {error.message}</Text>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-in-left">
        <Card className="premium-card hover-lift transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-blue-600 font-medium">Currently Active</Text>
              <div className="text-3xl font-bold text-blue-700 animate-scale-in mt-2">
                {data?.activeShifts?.length || 0}
              </div>
              <Text className="text-blue-500 text-sm mt-1">Staff Members</Text>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <UserOutlined className="text-2xl text-white" />
            </div>
          </div>
        </Card>

        <Card className="premium-card hover-lift transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-green-600 font-medium">Total Hours</Text>
              <div className="text-3xl font-bold text-green-700 animate-scale-in mt-2">
                {data?.activeShifts?.reduce((total: number, shift: any) => {
                  const start = new Date(shift.clockInTime);
                  const now = new Date();
                  const hours = (now.getTime() - start.getTime()) / (1000 * 60 * 60);
                  return total + hours;
                }, 0)?.toFixed(1) || '0.0'}
              </div>
              <Text className="text-green-500 text-sm mt-1">Active Hours</Text>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
              <ClockCircleOutlined className="text-2xl text-white" />
            </div>
          </div>
        </Card>

        <Card className="premium-card hover-lift transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <Text className="text-purple-600 font-medium">Average Duration</Text>
              <div className="text-3xl font-bold text-purple-700 animate-scale-in mt-2">
                {data?.activeShifts?.length > 0 ? 
                  (data.activeShifts.reduce((total: number, shift: any) => {
                    const start = new Date(shift.clockInTime);
                    const now = new Date();
                    const hours = (now.getTime() - start.getTime()) / (1000 * 60 * 60);
                    return total + hours;
                  }, 0) / data.activeShifts.length).toFixed(1) : '0.0'
                }h
              </div>
              <Text className="text-purple-500 text-sm mt-1">Per Staff</Text>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <EnvironmentOutlined className="text-2xl text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Enhanced Staff Status Table */}
      <Card className="premium-card animate-slide-in-right hover-lift shadow-xl">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <Title level={3} className="!mb-2 !text-gray-900">Active Staff Members</Title>
              <Text className="text-gray-600">
                Real-time view of all staff currently clocked in with precise location tracking
              </Text>
            </div>
            <div className="flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-full border border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <Text className="text-green-700 font-medium">Live Updates</Text>
            </div>
          </div>
        </div>
        
        <Table
          columns={columns}
          dataSource={data?.activeShifts || []}
          loading={loading}
          pagination={false}
          rowKey="id"
          className="custom-table"
          rowClassName="hover:bg-gradient-to-r hover:from-blue-50 hover:to-green-50 transition-all duration-300"
          locale={{
            emptyText: (
              <div className="py-12 text-center animate-fade-in">
                <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <UserOutlined className="text-4xl text-gray-400" />
                </div>
                <Title level={4} className="!text-gray-400 !mb-2">No Staff Currently Active</Title>
                <Text className="text-gray-500">All staff members are currently clocked out</Text>
              </div>
            )
          }}
        />
      </Card>

      {/* Location Details Modal */}
      <Modal
        title={
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <EnvironmentOutlined className="text-white text-lg" />
            </div>
            <div>
              <div className="text-lg font-semibold">Staff Location Details</div>
              <div className="text-sm text-gray-500">{selectedWorker?.user?.name}</div>
            </div>
          </div>
        }
        open={locationModalVisible}
        onCancel={() => setLocationModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setLocationModalVisible(false)} className="premium-button-outline">
            Close
          </Button>
        ]}
        width={600}
        className="location-modal"
      >
        {selectedWorker && (
          <div className="space-y-6 py-4">
            <Divider />
            
            {/* Staff Info */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center space-x-4">
                <Avatar 
                  size={48}
                  icon={<UserOutlined />} 
                  className="bg-gradient-to-br from-blue-500 to-green-500"
                />
                <div>
                  <div className="font-semibold text-gray-900">{selectedWorker.user.name}</div>
                  <div className="text-gray-600">{selectedWorker.user.email}</div>
                  <div className="text-sm text-green-600 font-medium">
                    Active since {new Date(selectedWorker.clockInTime).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <InfoCircleOutlined className="text-blue-500" />
                <Text strong className="text-gray-900">Location Information</Text>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Text className="text-gray-500 text-sm font-medium">Latitude</Text>
                    <div className="font-mono text-gray-900 bg-gray-50 px-3 py-2 rounded-lg mt-1">
                      {selectedWorker.clockInLocation?.lat?.toFixed(8)}
                    </div>
                  </div>
                  <div>
                    <Text className="text-gray-500 text-sm font-medium">Longitude</Text>
                    <div className="font-mono text-gray-900 bg-gray-50 px-3 py-2 rounded-lg mt-1">
                      {selectedWorker.clockInLocation?.lng?.toFixed(8)}
                    </div>
                  </div>
                </div>
                
                <div>
                  <Text className="text-gray-500 text-sm font-medium">Full Address</Text>
                  <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg mt-1">
                    {selectedWorker.fullAddress || 'Loading address...'}
                  </div>
                </div>
              </div>
            </div>

            {/* Clock-in Notes */}
            {selectedWorker.clockInNotes && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <InfoCircleOutlined className="text-blue-500" />
                  <Text strong className="text-gray-900">Clock-in Notes</Text>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <Text className="text-blue-800">{selectedWorker.clockInNotes}</Text>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}