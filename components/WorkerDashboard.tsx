'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Card, Typography, Button, Badge, Avatar, Space, Modal, Input } from 'antd';
import { 
  ClockCircleOutlined,
  UserOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  StopOutlined,
  HistoryOutlined as HistoryIcon
} from '@ant-design/icons';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import { gql } from 'graphql-tag';
import ShiftHistory from './ShiftHistory';
import Navbar from './ui/navbar';
import LocationMap from './LocationMap';
import { toast } from 'sonner';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const GET_CURRENT_SHIFT = gql`
  query GetCurrentShift {
    shifts {
      id
      clockInTime
      clockOutTime
      clockInLocation
      clockOutLocation
      clockInNotes
      clockOutNotes
      status
    }
  }
`;

const GET_LOCATION_SETTINGS = gql`
  query GetLocationSettings {
    locationSettings {
      id
      name
      latitude
      longitude
      radius
      isActive
    }
  }
`;

const CLOCK_IN = gql`
  mutation ClockIn($location: JSON!, $notes: String) {
    clockIn(location: $location, notes: $notes) {
      id
      clockInTime
      clockInLocation
      clockInNotes
      status
    }
  }
`;

const CLOCK_OUT = gql`
  mutation ClockOut($shiftId: ID!, $location: JSON!, $notes: String) {
    clockOut(shiftId: $shiftId, location: $location, notes: $notes) {
      id
      clockOutTime
      clockOutLocation
      clockOutNotes
      status
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

export default function WorkerDashboard({ user }: Props) {
  const searchParams = useSearchParams();
  const [currentView, setCurrentView] = useState(searchParams.get('tab') || 'clock');
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [withinPerimeter, setWithinPerimeter] = useState(false);
  const [clockModalVisible, setClockModalVisible] = useState(false);
  const [clockAction, setClockAction] = useState<'in' | 'out'>('in');
  const [notes, setNotes] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const { user: auth0User } = useUser();
  
  const { data: shiftsData, refetch: refetchShifts } = useQuery(GET_CURRENT_SHIFT);
  const { data: locationData } = useQuery(GET_LOCATION_SETTINGS);
  
  const [clockInMutation] = useMutation(CLOCK_IN);
  const [clockOutMutation] = useMutation(CLOCK_OUT);

  const currentShift = shiftsData?.shifts?.find((shift: any) => shift.status === 'CLOCKED_IN');
  const isCurrentlyClockedIn = !!currentShift;

  // Get current location
  useEffect(() => {
    const tab = searchParams.get('tab') || 'clock';
    setCurrentView(tab);
  }, [searchParams]);

  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(location);
          setLocationError(null);
          
          // Check if within perimeter
          if (locationData?.locationSettings?.length > 0) {
            const isWithin = locationData.locationSettings.some((setting: any) => {
              const distance = calculateDistance(
                location.lat,
                location.lng,
                setting.latitude,
                setting.longitude
              );
              return distance <= setting.radius;
            });
            setWithinPerimeter(isWithin);
          }
        },
        (error) => {
          setLocationError('Unable to access location. Please enable location services.');
          console.error('Geolocation error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      setLocationError('Geolocation is not supported by this browser.');
    }
  }, [locationData]);

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleClockAction = async () => {
    if (!currentLocation) {
      toast.error('Location not available');
      return;
    }

    setIsAnimating(true);
    try {
      if (clockAction === 'in') {
        await clockInMutation({
          variables: {
            location: currentLocation,
            notes: notes || undefined
          }
        });
        toast.success('Successfully clocked in!');
      } else {
        if (!currentShift) {
          toast.error('No active shift found');
          return;
        }
        
        await clockOutMutation({
          variables: {
            shiftId: currentShift.id,
            location: currentLocation,
            notes: notes || undefined
          }
        });
        toast.success('Successfully clocked out!');
      }
      
      setClockModalVisible(false);
      setNotes('');
      refetchShifts();
      
      // Add success animation
      setTimeout(() => setIsAnimating(false), 1000);
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
      setIsAnimating(false);
    }
  };

  const showClockModal = (action: 'in' | 'out') => {
    setClockAction(action);
    setClockModalVisible(true);
  };

  const getLocationName = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const addressComponents = result.address_components;
        
        // Try to get a meaningful location name
        const streetNumber = addressComponents.find((c: any) => c.types.includes('street_number'))?.long_name;
        const streetName = addressComponents.find((c: any) => c.types.includes('route'))?.long_name;
        const neighborhood = addressComponents.find((c: any) => c.types.includes('neighborhood'))?.long_name;
        const city = addressComponents.find((c: any) => c.types.includes('locality'))?.long_name;
        
        if (streetNumber && streetName) {
          return `${streetNumber} ${streetName}${neighborhood ? `, ${neighborhood}` : ''}`;
        } else if (neighborhood) {
          return `${neighborhood}${city ? `, ${city}` : ''}`;
        } else if (city) {
          return city;
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  };

  const renderClockSection = () => (
    <div className="space-y-8 animate-fade-in">
      {/* Current Status Card */}
      <div className="premium-card p-8 text-center hover-lift">
        <div className="space-y-6">
          {isCurrentlyClockedIn ? (
            <div className="animate-scale-in space-y-4">
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircleOutlined className="text-4xl text-green-600" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-green-600 mb-2">Currently Clocked In</h3>
                <p className="text-gray-600 text-lg">
                  Since: {new Date(currentShift.clockInTime).toLocaleString()}
                </p>
              </div>
              {currentShift.clockInNotes && (
                <div className="bg-blue-50 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Clock-in Notes: </span>
                    {currentShift.clockInNotes}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="animate-scale-in space-y-4">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <StopOutlined className="text-4xl text-gray-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-600 mb-2">Currently Clocked Out</h3>
                <p className="text-gray-500 text-lg">Ready to start your shift</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Location Map */}
      <div className="premium-card overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <EnvironmentOutlined className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Work Location</h3>
                <p className="text-sm text-gray-600">
                  {locationError ? locationError : 
                   currentLocation ? 'Location detected' : 'Getting location...'}
                </p>
              </div>
            </div>
            <div className={`status-indicator ${withinPerimeter ? 'status-online' : 'status-warning'}`}>
              {withinPerimeter ? 'Within Work Area' : 'Outside Work Area'}
            </div>
          </div>
        </div>
        
        <LocationMap 
          currentLocation={currentLocation}
          withinPerimeter={withinPerimeter}
          className="h-64"
        />
      </div>

      {/* Clock Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="premium-card p-6 hover-lift">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto">
              <ClockCircleOutlined className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Clock In</h4>
              <p className="text-gray-600 mb-6">
                Since: {currentShift?.clockInTime? `Since: ${new Date(currentShift.clockInTime).toLocaleString()}`: 'No shift started yet'}
                Start your shift and begin tracking your work time
              </p>
            </div>
            <Button 
              type="primary"
              size="large"
              block
              disabled={isCurrentlyClockedIn || !withinPerimeter || !currentLocation}
              onClick={() => showClockModal('in')}
              className="premium-button-primary h-12"
              loading={isAnimating && clockAction === 'in'}
            >
              {!currentLocation ? 'Getting Location...' :
               !withinPerimeter ? 'Outside Work Area' :
               isCurrentlyClockedIn ? 'Already Clocked In' : 'Clock In'}
            </Button>
          </div>
        </div>

        <div className="premium-card p-6 hover-lift">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center mx-auto">
              <StopOutlined className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Clock Out</h4>
              <p className="text-gray-600 mb-6">
                End your shift and finalize your work time
              </p>
            </div>
            <Button 
              danger
              size="large"
              block
              disabled={!isCurrentlyClockedIn || !currentLocation}
              onClick={() => showClockModal('out')}
              className="h-12 premium-button-outline border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
              loading={isAnimating && clockAction === 'out'}
            >
              {!currentLocation ? 'Getting Location...' :
               !isCurrentlyClockedIn ? 'Not Clocked In' : 'Clock Out'}
            </Button>
          </div>
        </div>
      </div>

      {/* Clock Action Modal */}
      <Modal
        title={`Clock ${clockAction === 'in' ? 'In' : 'Out'}`}
        open={clockModalVisible}
        onOk={handleClockAction}
        onCancel={() => {
          setClockModalVisible(false);
          setNotes('');
        }}
        okText={clockAction === 'in' ? 'Clock In' : 'Clock Out'}
        okButtonProps={{ 
          type: clockAction === 'in' ? 'primary' : 'default',
          danger: clockAction === 'out'
        }}
      >
        <div className="py-4">
          <p className="text-gray-600 mb-4">
            Add any notes for this {clockAction === 'in' ? 'clock-in' : 'clock-out'} (optional):
          </p>
          <TextArea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={`Enter notes for ${clockAction === 'in' ? 'starting' : 'ending'} your shift...`}
            maxLength={500}
          />
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Location: </span>
              {currentLocation ? 
                `${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}` : 
                'Location not available'}
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50" ref={dashboardRef}>
      <Navbar userRole="CARE_WORKER" userName={user.name} userEmail={user.email} userImage={auth0User?.picture} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {currentView === 'clock' ? 'Clock In/Out' : 'Shift History'}
              </h1>
              <p className="text-gray-600 mt-2">
                {currentView === 'clock' ? 
                  'Manage your work shifts with location-based tracking' :
                  'View your complete shift history and work records'}
              </p>
            </div>
            <Badge className="status-online">
              Care Worker
            </Badge>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setCurrentView('clock')}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  currentView === 'clock'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ClockCircleOutlined className="w-5 h-5" />
                <span>Clock In/Out</span>
              </button>
              <button
                onClick={() => setCurrentView('history')}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  currentView === 'history'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <HistoryIcon className="w-5 h-5" />
                <span>History</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="animate-fade-in">
          {currentView === 'clock' ? renderClockSection() : <ShiftHistory />}
        </div>
      </div>
    </div>
  );
}