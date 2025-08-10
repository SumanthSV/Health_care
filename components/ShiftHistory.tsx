'use client'

import React, { useState } from 'react';
import { Table, Card, Typography, Tag, Space, DatePicker, Select, Empty, Tooltip } from 'antd';
import { ClockCircleOutlined, EnvironmentOutlined, FileTextOutlined } from '@ant-design/icons';
import { useQuery } from '@apollo/client';
import { gql } from 'graphql-tag';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const GET_SHIFTS = gql`
  query GetShifts($userId: String) {
    shifts(userId: $userId) {
      id
      clockInTime
      clockOutTime
      clockInLocation
      clockOutLocation
      clockInNotes
      clockOutNotes
      status
      createdAt
    }
  }
`;

export default function ShiftHistory() {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data, loading, error } = useQuery(GET_SHIFTS);

  const formatDuration = (clockIn: string, clockOut: string) => {
    if (!clockIn || !clockOut) return 'In Progress';
    
    const start = new Date(clockIn);
    const end = new Date(clockOut);
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const formatLocation = (location: any) => {
    if (!location) return 'N/A';
    if (location.address) return location.address;
    return `${location.lat?.toFixed(4)}, ${location.lng?.toFixed(4)}`;
  };

  // Filter shifts based on date range and status
  const filteredShifts = data?.shifts?.filter((shift: any) => {
    let matchesDate = true;
    let matchesStatus = true;

    if (dateRange) {
      const shiftDate = dayjs(shift.clockInTime);
      matchesDate = shiftDate.isAfter(dateRange[0].startOf('day')) && 
                   shiftDate.isBefore(dateRange[1].endOf('day'));
    }

    if (statusFilter !== 'all') {
      matchesStatus = shift.status === statusFilter;
    }

    return matchesDate && matchesStatus;
  }) || [];

  const columns = [
    {
      title: 'Date',
      key: 'date',
      render: (record: any) => (
        <div>
          <div className="font-semibold">
            {new Date(record.clockInTime).toLocaleDateString()}
          </div>
          <Text type="secondary" className="text-sm">
            {new Date(record.clockInTime).toLocaleDateString('en-US', { weekday: 'short' })}
          </Text>
        </div>
      ),
    },
    {
      title: 'Clock In',
      key: 'clockIn',
      render: (record: any) => (
        <div>
          <div className="flex items-center space-x-2">
            <ClockCircleOutlined className="text-green-500" />
            <span>{new Date(record.clockInTime).toLocaleTimeString()}</span>
          </div>
          {record.clockInLocation && (
            <Tooltip title={`Lat: ${record.clockInLocation.lat}, Lng: ${record.clockInLocation.lng}`}>
              <div className="flex items-center space-x-1 text-sm text-gray-500 mt-1">
                <EnvironmentOutlined />
                <span className="truncate max-w-32">
                  {formatLocation(record.clockInLocation)}
                </span>
              </div>
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: 'Clock Out',
      key: 'clockOut',
      render: (record: any) => (
        <div>
          {record.clockOutTime ? (
            <div>
              <div className="flex items-center space-x-2">
                <ClockCircleOutlined className="text-red-500" />
                <span>{new Date(record.clockOutTime).toLocaleTimeString()}</span>
              </div>
              {record.clockOutLocation && (
                <Tooltip title={`Lat: ${record.clockOutLocation.lat}, Lng: ${record.clockOutLocation.lng}`}>
                  <div className="flex items-center space-x-1 text-sm text-gray-500 mt-1">
                    <EnvironmentOutlined />
                    <span className="truncate max-w-32">
                      {formatLocation(record.clockOutLocation)}
                    </span>
                  </div>
                </Tooltip>
              )}
            </div>
          ) : (
            <Tag color="processing">In Progress</Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (record: any) => (
        <div className="font-semibold text-center">
          {formatDuration(record.clockInTime, record.clockOutTime)}
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (record: any) => (
        <Tag color={record.status === 'CLOCKED_IN' ? 'processing' : 'success'}>
          {record.status === 'CLOCKED_IN' ? 'Active' : 'Completed'}
        </Tag>
      ),
    },
    {
      title: 'Notes',
      key: 'notes',
      render: (record: any) => (
        <div className="max-w-xs">
          {record.clockInNotes && (
            <div className="mb-2">
              <div className="flex items-center space-x-1 text-sm">
                <FileTextOutlined className="text-blue-500" />
                <Text strong>Clock In:</Text>
              </div>
              <Text type="secondary" className="text-sm truncate block">
                {record.clockInNotes}
              </Text>
            </div>
          )}
          {record.clockOutNotes && (
            <div>
              <div className="flex items-center space-x-1 text-sm">
                <FileTextOutlined className="text-red-500" />
                <Text strong>Clock Out:</Text>
              </div>
              <Text type="secondary" className="text-sm truncate block">
                {record.clockOutNotes}
              </Text>
            </div>
          )}
          {!record.clockInNotes && !record.clockOutNotes && (
            <Text type="secondary" className="text-sm">No notes</Text>
          )}
        </div>
      ),
    },
  ];

  const totalHours = filteredShifts.reduce((total, shift) => {
    if (shift.clockInTime && shift.clockOutTime) {
      const start = new Date(shift.clockInTime);
      const end = new Date(shift.clockOutTime);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return total + hours;
    }
    return total;
  }, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Card */}
      <Card className="hover-lift transition-all duration-300 animate-slide-in-left">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 animate-scale-in">
              {filteredShifts.length}
            </div>
            <Text type="secondary">Total Shifts</Text>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 animate-scale-in">
              {totalHours.toFixed(1)}h
            </div>
            <Text type="secondary">Total Hours</Text>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 animate-scale-in">
              {filteredShifts.length > 0 ? (totalHours / filteredShifts.length).toFixed(1) : '0.0'}h
            </div>
            <Text type="secondary">Avg per Shift</Text>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 animate-scale-in">
              {filteredShifts.filter((shift: any) => shift.status === 'CLOCKED_IN').length}
            </div>
            <Text type="secondary">Active Shifts</Text>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card size="small" className="animate-slide-in-right">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <Text strong className="mr-2">Date Range:</Text>
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
              format="YYYY-MM-DD"
              allowClear
            />
          </div>
          <div>
            <Text strong className="mr-2">Status:</Text>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 150 }}
            >
              <Option value="all">All Status</Option>
              <Option value="CLOCKED_IN">Active</Option>
              <Option value="CLOCKED_OUT">Completed</Option>
            </Select>
          </div>
        </div>
      </Card>

      {/* History Table */}
      <Card className="animate-scale-in hover-lift transition-all duration-300">
        <div className="mb-4">
          <Title level={4}>Shift History</Title>
          <Text type="secondary">
            Complete record of all your clock-in and clock-out activities
          </Text>
        </div>
        
        <Table
          columns={columns}
          dataSource={filteredShifts}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} shifts`,
          }}
          rowKey="id"
          locale={{
            emptyText: (
              <div className="py-8 text-center animate-fade-in">
                <ClockCircleOutlined className="text-6xl text-gray-300 mb-4" />
                <Title level={4} className="text-gray-400">No Shift History</Title>
                <Text type="secondary">
                  {dateRange || statusFilter !== 'all' ? 
                    'No shifts match your current filters' : 
                    'Start clocking in to see your shift history here'}
                </Text>
              </div>
            )
          }}
        />
      </Card>
    </div>
  );
}