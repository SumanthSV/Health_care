'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Card, Typography, Button, Badge, Avatar, Space, Modal, Input, Progress, Divider } from 'antd';
import { 
  ClockCircleOutlined,
  UserOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  StopOutlined,
  HistoryOutlined as HistoryIcon,
  WarningOutlined,
  InfoCircleOutlined
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
  const [currentView, setCurrentView] = useState(searchParams!.get('tab') || 'clock');
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [withinPerimeter, setWithinPerimeter] = useState(false);
  const [clockModalVisible, setClockModalVisible] = useState(false);
  const [clockAction, setClockAction] = useState<'in' | 'out'>('in');
  const [notes, setNotes] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [autoClockoutTimer, setAutoClockoutTimer] = useState<NodeJS.Timeout | null>(null);
  const [autoClockoutCountdown, setAutoClockoutCountdown] = useState<number>(0);
  const [isOutsidePerimeter, setIsOutsidePerimeter] = useState(false);
  const [lastKnownLocation, setLastKnownLocation] = useState<{lat: number, lng: number} | null>(null);
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
    const tab = searchParams!.get('tab') || 'clock';
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
          setLastKnownLocation(location);
          setLocationAccuracy(position.coords.accuracy);
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
            
            // Handle perimeter status change
            if (isWithin !== withinPerimeter) {
              setWithinPerimeter(isWithin);
              handlePerimeterStatusChange(isWithin);
            }
          }
        },
        (error) => {
          let errorMessage = 'Unable to access location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location permissions in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable. Please check your GPS settings.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please refresh and try again.';
              break;
          }
          setLocationError(errorMessage);
          console.error('Geolocation error:', error);
          toast.error(errorMessage);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000
        }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      setLocationError('Geolocation is not supported by this browser.');
    }
  }, [locationData]);

  // Start auto clock-out timer when leaving perimeter
  const startAutoClockoutTimer = () => {
    setAutoClockoutCountdown(60);
    const timer = setInterval(() => {
      setAutoClockoutCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setAutoClockoutTimer(null);
          // Perform clock-out automatically
          if (isCurrentlyClockedIn && currentShift && currentLocation) {
            clockOutMutation({
              variables: {
                shiftId: currentShift.id,
                location: currentLocation,
                notes: 'Auto clock-out due to leaving work zone'
              }
            }).then(() => {
              toast.info('Automatically clocked out for leaving the work zone.');
              refetchShifts();
            });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setAutoClockoutTimer(timer);
  };

  // Cancel auto clock-out timer when re-entering perimeter
  const cancelAutoClockoutTimer = () => {
    if (autoClockoutTimer) {
      clearInterval(autoClockoutTimer);
      setAutoClockoutTimer(null);
      setAutoClockoutCountdown(0);
    }
  };

  // Handle perimeter status changes and auto-checkout logic
  const handlePerimeterStatusChange = (isWithin: boolean) => {
    if (!isCurrentlyClockedIn) return;

    if (!isWithin && !isOutsidePerimeter) {
      // Just left the perimeter
      setIsOutsidePerimeter(true);
      startAutoClockoutTimer();
      toast.warning('You have left the work zone', {
        description: 'Automatic clock-out will occur in 60 seconds if you remain outside',
        duration: 5000
      });
    } else if (isWithin && isOutsidePerimeter) {
      // Re-entered the perimeter
      setIsOutsidePerimeter(false);
      cancelAutoClockoutTimer();
      toast.success('Welcome back to the work zone', {
        description: 'Automatic clock-out has been cancelled',
        duration: 3000
      });
    }
  };
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
      {/* Auto Clock-out Warning */}
      {isOutsidePerimeter && autoClockoutCountdown > 0 && (
        <div className="premium-card p-4 md:p-6 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 animate-scale-in">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <WarningOutlined className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-orange-800">Outside Work Zone</h3>
                <div className="text-2xl font-bold text-orange-600">
                  {Math.floor(autoClockoutCountdown / 60)}:{(autoClockoutCountdown % 60).toString().padStart(2, '0')}
                </div>
              </div>
              <p className="text-orange-700 mb-4">
                You are currently outside the designated work area. Return within {autoClockoutCountdown} seconds to prevent automatic clock-out.
              </p>
              <div className="mb-3">
                <Progress 
                  percent={((60 - autoClockoutCountdown) / 60) * 100} 
                  strokeColor={{
                    '0%': '#f59e0b',
                    '70%': '#f97316',
                    '100%': '#ef4444',
                  }}
                  trailColor="#fed7aa"
                  showInfo={false}
                  size="small"
                />
              </div>
              <div className="text-sm text-orange-600 bg-orange-100 rounded-lg p-2">
                💡 <strong>Tip:</strong> Move back to the work location to cancel automatic clock-out
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Status Card */}
      <div className="premium-card p-6 md:p-8 text-center hover-lift shadow-xl bg-gradient-to-br from-white to-gray-50">
        <div className="space-y-6">
          {isCurrentlyClockedIn ? (
            <div className="animate-scale-in space-y-4">
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <CheckCircleOutlined className="text-4xl md:text-5xl text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 md:w-8 md:h-8 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                  <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                </div>
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-green-600 mb-3">Currently Clocked In</h3>
                <p className="text-gray-600 text-base md:text-lg mb-2">
                  Since: {new Date(currentShift.clockInTime).toLocaleString()}
                </p>
                {locationAccuracy && (
                  <p className="text-sm text-gray-500">
                    Location accuracy: ±{Math.round(locationAccuracy)}m
                  </p>
                )}
              </div>
              {currentShift.clockInNotes && (
                <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-4 max-w-md mx-auto border border-blue-100">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Clock-in Notes: </span>
                    {currentShift.clockInNotes}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="animate-scale-in space-y-4">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <StopOutlined className="text-4xl md:text-5xl text-gray-500" />
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-600 mb-3">Currently Clocked Out</h3>
                <p className="text-gray-500 text-base md:text-lg">Ready to start your shift</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Location Map */}
      <div className="premium-card overflow-hidden shadow-xl">
        <div className="p-4 md:p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-green-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                <EnvironmentOutlined className="text-2xl text-blue-200" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900">Work Location</h3>
                <p className="text-sm text-gray-600">
                  {locationError ? 'Location unavailable' : 
                   currentLocation ? `Location detected ${locationAccuracy ? `(±${Math.round(locationAccuracy)}m)` : ''}` : 'Getting location...'}
                </p>
              </div>
            </div>
            <div className={`status-indicator ${withinPerimeter ? 'status-online' : 'status-warning'} text-xs font-medium px-3 py-1 rounded-full`}>
              {withinPerimeter ? '✓ In Work Zone' : '⚠ Outside Zone'}
            </div>
          </div>
          
          {/* Location Status Details */}
          {currentLocation && (
            <div className="mt-4 p-3 bg-white rounded-lg border border-gray-100">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${withinPerimeter ? 'bg-green-500 animate-pulse' : 'bg-orange-500'}`}></div>
                  <span className="font-medium text-gray-700">
                    {withinPerimeter ? 'Inside work perimeter' : 'Outside work perimeter'}
                  </span>
                </div>
                {locationAccuracy && (
                  <span className="text-gray-500 bg-gray-100 px-2 py-1 rounded-full text-xs">
                    ±{Math.round(locationAccuracy)}m accuracy
                  </span>
                )}
              </div>
            </div>
          )}
          
          {locationError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <InfoCircleOutlined className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-700">
                  <div className="font-medium mb-1">Location Error</div>
                  <div>{locationError}</div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <LocationMap 
          currentLocation={currentLocation}
          withinPerimeter={withinPerimeter}
          className="h-64 md:h-80"
        />
      </div>

      {/* Clock Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="premium-card p-4 md:p-6 hover-lift shadow-xl bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg hover:scale-105 transition-transform duration-200">
              <ClockCircleOutlined className="text-2xl md:text-3xl text-white" />
            </div>
            <div>
              <h4 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">Clock In</h4>
              <p className="text-gray-600 mb-4 md:mb-6 text-sm md:text-base">
                Start your shift and begin tracking your work time
              </p>
              {!withinPerimeter && !isCurrentlyClockedIn && (
                <div className="text-xs text-orange-600 bg-orange-50 rounded-lg p-2 mb-4">
                  ⚠ You must be within the work zone to clock in
                </div>
              )}
            </div>
            <Button 
              type="primary"
              size="large"
              block
              disabled={isCurrentlyClockedIn || !withinPerimeter || !currentLocation}
              onClick={() => showClockModal('in')}
              className="premium-button-primary h-12 md:h-14 shadow-lg hover:shadow-xl transition-all duration-200"
              loading={isAnimating && clockAction === 'in'}
            >
              {!currentLocation ? 'Getting Location...' :
               !withinPerimeter ? 'Outside Work Area' :
               isCurrentlyClockedIn ? 'Already Clocked In' : 'Clock In'}
            </Button>
          </div>
        </div>

        <div className="premium-card p-4 md:p-6 hover-lift shadow-xl bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg hover:scale-105 transition-transform duration-200">
              <StopOutlined className="text-2xl md:text-3xl text-white" />
            </div>
            <div>
              <h4 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">Clock Out</h4>
              <p className="text-gray-600 mb-4 md:mb-6 text-sm md:text-base">
                End your shift and finalize your work time
              </p>
              {isCurrentlyClockedIn && (
                <div className="text-xs text-blue-600 bg-blue-50 rounded-lg p-2 mb-4">
                  ℹ You can clock out from anywhere or it will happen automatically if you leave the work zone
                </div>
              )}
            </div>
            <Button 
              danger
              size="large"
              block
              disabled={!isCurrentlyClockedIn || !currentLocation}
              onClick={() => showClockModal('out')}
              className="h-12 md:h-14 premium-button-outline border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 shadow-lg hover:shadow-xl transition-all duration-200"
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
        title={
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              clockAction === 'in' ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {clockAction === 'in' ? 
                <ClockCircleOutlined className={`w-5 h-5 ${clockAction === 'in' ? 'text-green-600' : 'text-red-600'}`} /> :
                <StopOutlined className="w-5 h-5 text-red-600" />
              }
            </div>
            <span className="text-lg font-semibold">
              Clock {clockAction === 'in' ? 'In' : 'Out'}
            </span>
          </div>
        }
        open={clockModalVisible}
        onOk={handleClockAction}
        onCancel={() => {
          setClockModalVisible(false);
          setNotes('');
        }}
        okText={clockAction === 'in' ? 'Confirm Clock In' : 'Confirm Clock Out'}
        okButtonProps={{ 
          type: clockAction === 'in' ? 'primary' : 'default',
          danger: clockAction === 'out',
          size: 'large'
        }}
        cancelButtonProps={{ size: 'large' }}
        width={window.innerWidth < 768 ? '90%' : 520}
      >
        <Divider />
        <div className="py-2">
          <p className="text-gray-600 mb-6 text-base">
            Add any notes for this {clockAction === 'in' ? 'clock-in' : 'clock-out'} (optional):
          </p>
          <TextArea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={`Enter notes for ${clockAction === 'in' ? 'starting' : 'ending'} your shift...`}
            maxLength={500}
            showCount
            className="premium-textarea"
          />
          <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-100">
            <div className="flex items-start space-x-3">
              <EnvironmentOutlined className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-medium text-gray-800 mb-1">Current Location</div>
                <p className="text-sm text-gray-600 font-mono">
              {currentLocation ? 
                `${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}` : 
                'Location not available'}
                </p>
                {locationAccuracy && (
                  <p className="text-xs text-gray-500 mt-1">
                    Accuracy: ±{Math.round(locationAccuracy)} meters
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 bg-ripple-pattern" ref={dashboardRef}>
      <Navbar userRole="CARE_WORKER" userName={user.name} userEmail={user.email} userImage={auth0User?.picture ?? undefined} />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {currentView === 'clock' ? 'Clock In/Out' : 'Shift History'}
              </h1>
              <p className="text-gray-600 mt-2 text-sm md:text-base">
                {currentView === 'clock' ? 
                  'Manage your work shifts' :
                  'View your complete shift history'}
              </p>
            </div>
            <Badge className="status-online text-xs md:text-sm px-2 md:px-3 py-1">
              Care Worker
            </Badge>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-4 md:space-x-8 overflow-x-auto">
              <button
                onClick={() => setCurrentView('clock')}
                className={`flex items-center space-x-2 py-4 px-2 md:px-1 border-b-2 font-medium text-sm md:text-base transition-colors duration-200 whitespace-nowrap ${
                  currentView === 'clock'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ClockCircleOutlined className="w-4 h-4 md:w-5 md:h-5" />
                <span>Clock In/Out</span>
              </button>
              <button
                onClick={() => setCurrentView('history')}
                className={`flex items-center space-x-2 py-4 px-2 md:px-1 border-b-2 font-medium text-sm md:text-base transition-colors duration-200 whitespace-nowrap ${
                  currentView === 'history'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <HistoryIcon className="w-4 h-4 md:w-5 md:h-5" />
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
