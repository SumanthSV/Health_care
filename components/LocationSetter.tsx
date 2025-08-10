'use client'

import React, { useState, useCallback, useEffect } from 'react';
import { Card, Button, Slider, Input, Form, Typography, Space, Divider, Alert, Spin, message } from 'antd';
import { EnvironmentOutlined, AimOutlined, SaveOutlined, AimOutlined as Target } from '@ant-design/icons';
import { GoogleMap, LoadScript, Circle, Marker } from '@react-google-maps/api';
import { useMutation, useQuery } from '@apollo/client';
import { gql } from 'graphql-tag';
import { toast } from 'sonner';

const { Title, Text } = Typography;

const SET_LOCATION = gql`
  mutation SetLocation($name: String!, $latitude: Float!, $longitude: Float!, $radius: Float!) {
    setLocationSetting(name: $name, latitude: $latitude, longitude: $longitude, radius: $radius) {
      id
      name
      latitude
      longitude
      radius
      isActive
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

const mapContainerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '12px',
};

const defaultCenter = {
  lat: 37.7749,
  lng: -122.4194, // San Francisco
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: true,
  fullscreenControl: true,
};

export default function LocationSetter() {
  const [form] = Form.useForm();
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null);
  const [radius, setRadius] = useState(1.0);
  // const [locationName, setLocationName] = useState('Work Location');
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationName, setLocationName] = useState<string>('');

  const { data: locationData, refetch } = useQuery(GET_LOCATION_SETTINGS);
  const [setLocationMutation, { loading: saving }] = useMutation(SET_LOCATION);

  // Get current location
  const getCurrentLocation = useCallback(() => {
    setIsGettingLocation(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(location);
          setMapCenter(location);
          setSelectedLocation(location);
          getLocationName(location.lat, location.lng);
          setIsGettingLocation(false);
          toast.success('Current location detected');
        },
        (error) => {
          setIsGettingLocation(false);
          toast.error('Unable to get current location. Please select on map.');
          console.error('Geolocation error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        }
      );
    } else {
      setIsGettingLocation(false);
      toast.error('Geolocation is not supported by this browser');
    }
  }, []);

  // Load existing location on mount
  useEffect(() => {
    if (locationData?.locationSettings?.length > 0) {
      const setting = locationData.locationSettings[0];
      setSelectedLocation({ lat: setting.latitude, lng: setting.longitude });
      setMapCenter({ lat: setting.latitude, lng: setting.longitude });
      setRadius(setting.radius);
      setLocationName(setting.name);
      getLocationName(setting.latitude, setting.longitude);
      form.setFieldsValue({
        name: setting.name,
        radius: setting.radius,
      });
    }
  }, [locationData, form]);

  const getLocationName = async (lat: number, lng: number) => {
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
          setLocationName(`${streetNumber} ${streetName}${neighborhood ? `, ${neighborhood}` : ''}`);
        } else if (neighborhood) {
          setLocationName(`${neighborhood}${city ? `, ${city}` : ''}`);
        } else if (city) {
          setLocationName(city);
        } else {
          setLocationName(result.formatted_address);
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setLocationName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  };

  const handleMapClick = useCallback((event: any) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    setSelectedLocation({ lat, lng });
    setMapCenter({ lat, lng });
    getLocationName(lat, lng);
  }, []);

  const handleSaveLocation = async () => {
    if (!selectedLocation) {
      toast.error('Please select a location on the map');
      return;
    }

    try {
      await setLocationMutation({
        variables: {
          name: locationName,
          latitude: selectedLocation.lat,
          longitude: selectedLocation.lng,
          radius: radius,
        },
      });
      
      message.success('Location settings saved successfully!');
      refetch();
    } catch (error: any) {
      message.error(error.message || 'Failed to save location settings');
    }
  };

  const existingLocation = locationData?.locationSettings?.[0];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
          <EnvironmentOutlined className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Work Location Settings</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Configure work location perimeters where staff can clock in and out. 
          Set precise boundaries to ensure accurate time tracking and location compliance.
        </p>
      </div>

      {/* Current Location Alert */}
      {existingLocation && (
        <Alert
          message="Active Work Location"
          description={
            <div className="flex items-center justify-between">
              <span>{existingLocation.name} • {existingLocation.radius}km radius</span>
              {locationName && (
                <span className="text-sm text-gray-500">{locationName}</span>
              )}
            </div>
          }
          type="info"
          showIcon
          className="premium-card border-blue-200 bg-blue-50"
        />
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Settings Panel */}
        <div className="space-y-6 animate-slide-in-left">
          <div className="premium-card p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <AimOutlined className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Location Configuration</h3>
                <p className="text-sm text-gray-600">Set up your work zone parameters</p>
              </div>
            </div>

            <Form form={form} layout="vertical" className="space-y-6">
              <Form.Item label="Location Name" required>
                <Input
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g., Main Hospital, North Wing"
                  prefix={<EnvironmentOutlined className="text-gray-400" />}
                  className="premium-input"
                />
              </Form.Item>

              <Form.Item label={`Work Zone Radius: ${radius} km`} required>
                <div className="space-y-4">
                  <Slider
                    min={0.1}
                    max={5.0}
                    step={0.1}
                    value={radius}
                    onChange={setRadius}
                    marks={{
                      0.1: '100m',
                      0.5: '500m',
                      1.0: '1km',
                      2.0: '2km',
                      5.0: '5km',
                    }}
                    className="mb-2"
                  />
                  <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                    Staff can clock in within <strong>{radius} km</strong> of the selected location.
                    This creates a work zone of approximately <strong>{(Math.PI * radius * radius).toFixed(2)} km²</strong>.
                  </div>
                </div>
              </Form.Item>
            </Form>
          </div>

          {/* Action Buttons */}
          <div className="premium-card p-6">
            <div className="space-y-4">
              <Button
                type="dashed"
                icon={<AimOutlined />}
                onClick={getCurrentLocation}
                loading={isGettingLocation}
                block
                size="large"
                className="premium-button-outline h-12 hover:border-blue-300 hover:text-blue-600"
              >
                {isGettingLocation ? 'Getting Location...' : 'Use Current Location'}
              </Button>

              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSaveLocation}
                loading={saving}
                disabled={!selectedLocation || !locationName.trim()}
                block
                size="large"
                className="premium-button-primary h-12"
              >
                {saving ? 'Saving...' : 'Save Location Settings'}
              </Button>
            </div>

            {selectedLocation && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Selected Location:</span>
                  <span className="text-xs text-gray-500">Click map to change</span>
                </div>
                {locationName && (
                  <div className="text-sm text-gray-900 font-medium">{locationName}</div>
                )}
                <div className="text-xs text-gray-500 font-mono">
                  {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="premium-card p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">How to Set Up</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">1</span>
                </div>
                <p className="text-sm text-gray-700">Click anywhere on the map to set your work location</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">2</span>
                </div>
                  <p className="text-sm text-gray-700">Use &quot;Current Location&quot; to automatically detect your position</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">3</span>
                </div>
                <p className="text-sm text-gray-700">Adjust the radius to define the allowed work zone</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">4</span>
                </div>
                <p className="text-sm text-gray-700">Staff can only clock in when inside the blue circle</p>
              </div>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="animate-slide-in-right">
          <div className="premium-card overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <EnvironmentOutlined className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Interactive Map</h3>
                  <p className="text-sm text-gray-600">Click to select work location</p>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <LoadScript 
                googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
                loadingElement={
                  <div className="flex justify-center items-center h-96 bg-gray-100">
                    <div className="text-center">
                      <Spin size="large" />
                      <p className="text-gray-600 mt-2">Loading map...</p>
                    </div>
                  </div>
                }
              >
                <GoogleMap
                  mapContainerStyle={{ ...mapContainerStyle, height: '400px' }}
                  center={mapCenter}
                  zoom={15}
                  onClick={handleMapClick}
                  options={{
                    ...mapOptions,
                    styles: [
                      {
                        featureType: 'all',
                        elementType: 'geometry.fill',
                        stylers: [{ weight: '2.00' }]
                      },
                      {
                        featureType: 'all',
                        elementType: 'geometry.stroke',
                        stylers: [{ color: '#9c9c9c' }]
                      },
                      {
                        featureType: 'landscape',
                        elementType: 'all',
                        stylers: [{ color: '#f2f2f2' }]
                      },
                      {
                        featureType: 'poi',
                        elementType: 'all',
                        stylers: [{ visibility: 'off' }]
                      },
                      {
                        featureType: 'road',
                        elementType: 'all',
                        stylers: [{ saturation: -100 }, { lightness: 45 }]
                      },
                      {
                        featureType: 'water',
                        elementType: 'all',
                        stylers: [{ color: '#46bcec' }, { visibility: 'on' }]
                      }
                    ]
                  }}
                >
                  {selectedLocation && (
                    <>
                      <Marker
                        position={selectedLocation}
                        title="Work Location"
                        icon={{
                          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="16" cy="16" r="12" fill="#3b82f6" stroke="white" stroke-width="3"/>
                              <circle cx="16" cy="16" r="6" fill="white"/>
                            </svg>
                          `),
                          scaledSize: new google.maps.Size(32, 32),
                          anchor: new google.maps.Point(16, 16),
                        }}
                      />
                      <Circle
                        center={selectedLocation}
                        radius={radius * 1000} // Convert km to meters
                        options={{
                          fillColor: '#3b82f6',
                          fillOpacity: 0.15,
                          strokeColor: '#3b82f6',
                          strokeOpacity: 0.8,
                          strokeWeight: 2,
                        }}
                      />
                    </>
                  )}
                  {currentLocation && currentLocation !== selectedLocation && (
                    <Marker
                      position={currentLocation}
                      title="Your Current Location"
                      icon={{
                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                          <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="8" fill="#10b981" stroke="white" stroke-width="2"/>
                            <circle cx="12" cy="12" r="3" fill="white"/>
                          </svg>
                        `),
                        scaledSize: new google.maps.Size(24, 24),
                        anchor: new google.maps.Point(12, 12),
                      }}
                    />
                  )}
                </GoogleMap>
              </LoadScript>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}