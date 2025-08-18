'use client'

import React, { useState, useCallback, useEffect } from 'react';
import { Card, Button, Slider, Input, Form, Typography, Space, Divider, Alert, Spin, message, AutoComplete } from 'antd';
import { EnvironmentOutlined, AimOutlined, SaveOutlined, SearchOutlined, LoadingOutlined, ClearOutlined } from '@ant-design/icons';
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
  height: '100%',
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
  gestureHandling: 'cooperative',
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
};

interface AddressSuggestion {
  value: string;
  label: string;
  location: { lat: number; lng: number };
}

export default function LocationSetter() {
  const [form] = Form.useForm();
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null);
  const [radius, setRadius] = useState(1.0);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationName, setLocationName] = useState<string>('');
  const [addressSearchValue, setAddressSearchValue] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const { data: locationData, refetch } = useQuery(GET_LOCATION_SETTINGS);
  const [setLocationMutation, { loading: saving }] = useMutation(SET_LOCATION);

  // Debounced address search
  const debouncedAddressSearch = useCallback((searchText: string) => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      searchAddresses(searchText);
    }, 300);

    setSearchTimeout(timeout);
  }, [searchTimeout]);

  // Get current location with enhanced error handling
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
          toast.success('Current location detected successfully', {
            description: `Accuracy: ±${Math.round(position.coords.accuracy)}m`
          });
        },
        (error) => {
          setIsGettingLocation(false);
          let errorMessage = 'Unable to get current location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable location permissions.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable. Please try again.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out. Please try again.';
              break;
          }
          toast.error(errorMessage);
          console.error('Geolocation error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
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
      setAddressSearchValue(setting.name);
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

  // Enhanced address search functionality
  const searchAddresses = async (searchText: string) => {
    if (!searchText || searchText.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchText)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const suggestions: AddressSuggestion[] = data.results.slice(0, 8).map((result: any) => ({
          value: result.formatted_address,
          label: result.formatted_address,
          location: {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng,
          },
        }));
        setAddressSuggestions(suggestions);
      } else {
        setAddressSuggestions([]);
      }
    } catch (error) {
      console.error('Address search error:', error);
      toast.error('Failed to search addresses. Please try again.');
      setAddressSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddressSelect = (value: string, option: any) => {
    const suggestion = addressSuggestions.find(s => s.value === value);
    if (suggestion) {
      setSelectedLocation(suggestion.location);
      setMapCenter(suggestion.location);
      setLocationName(suggestion.label);
      setAddressSearchValue(suggestion.label);
      toast.success('Address selected successfully', {
        description: 'Location pinpointed on map'
      });
    }
  };

  const handleMapClick = useCallback((event: any) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    setSelectedLocation({ lat, lng });
    setMapCenter({ lat, lng });
    getLocationName(lat, lng);
    toast.success('Location selected on map');
  }, []);

  const handleSaveLocation = async () => {
    if (!selectedLocation) {
      toast.error('Please select a location on the map or search for an address');
      return;
    }

    if (!locationName.trim()) {
      toast.error('Please provide a name for this location');
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
      toast.success('Work location configured successfully', {
        description: `${locationName} with ${radius}km radius`
      });
      refetch();
    } catch (error: any) {
      message.error(error.message || 'Failed to save location settings');
      toast.error('Failed to save location settings');
    }
  };

  const clearSearch = () => {
    setAddressSearchValue('');
    setAddressSuggestions([]);
  };

  const existingLocation = locationData?.locationSettings?.[0];

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in px-4 md:px-0">
      {/* Enhanced Header */}
      <div className="text-center">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 via-blue-600 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 hover-lift animate-scale-in shadow-lg">
          <EnvironmentOutlined className="text-4xl md:w-10 md:h-10 text-white" />
        </div>
        <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
          Work Location Settings
        </h2>
        <p className="text-gray-600 max-w-3xl mx-auto text-sm md:text-lg leading-relaxed">
          Configure precise work location perimeters where staff can clock in and out. 
          Set accurate boundaries to ensure reliable time tracking and location compliance.
        </p>
      </div>

      {/* Enhanced Current Location Alert */}
      {existingLocation && (
        <Alert
          message="Active Work Location"
          description={
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-col space-y-1">
                <span className="text-sm font-medium">{existingLocation.name}</span>
                <span className="text-xs text-gray-500">Radius: {existingLocation.radius}km • Active perimeter</span>
              </div>
              {locationName && (
                <span className="text-xs text-gray-500 break-all bg-gray-50 px-2 py-1 rounded">
                  {locationName}
                </span>
              )}
            </div>
          }
          type="info"
          showIcon
          className="premium-card border-blue-200 bg-gradient-to-r from-blue-50 to-green-50 animate-slide-in-left shadow-sm"
        />
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
        {/* Enhanced Settings Panel */}
        <div className="space-y-6 animate-slide-in-left">
          {/* Enhanced Address Search Card */}
          {/* <div className="premium-card p-4 md:p-6 hover-lift shadow-md">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-sm">
                <SearchOutlined className="text-2xl text-white" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900">Address Search</h3>
                <p className="text-sm text-gray-600">Search for precise locations worldwide</p>
              </div>
            </div>

            <div className="relative">
              <AutoComplete
                value={addressSearchValue}
                options={addressSuggestions}
                onSearch={debouncedAddressSearch}
                onSelect={handleAddressSelect}
                onChange={setAddressSearchValue}
                placeholder="Search hospitals, clinics, or any address..."
                className="w-full"
                size="large"
                allowClear
                notFoundContent={isSearching ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="flex items-center space-x-3">
                      <LoadingOutlined className="text-blue-500" />
                      <span className="text-gray-600">Searching addresses...</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    {addressSearchValue.length < 3 ? 
                      'Type at least 3 characters to search' : 
                      'No addresses found. Try a different search term.'}
                  </div>
                )}
              >
                <Input
                  prefix={<SearchOutlined className="text-gray-400" />}
                  suffix={
                    <div className="flex items-center space-x-2">
                      {isSearching && <LoadingOutlined className="text-blue-500" />}
                      {addressSearchValue && (
                        <Button
                          type="text"
                          size="small"
                          icon={<ClearOutlined />}
                          onClick={clearSearch}
                          className="text-gray-400 hover:text-gray-600"
                        />
                      )}
                    </div>
                  }
                  className="premium-input"
                />
              </AutoComplete>
            </div>

            <div className="mt-4 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
              💡 <strong>Tip:</strong> Search for specific addresses like '123 Main St Hospital' or facility names for the most accurate results.
            </div>
          </div> */}

          {/* Enhanced Location Configuration Card */}
          <div className="premium-card p-4 md:p-6 hover-lift shadow-md">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                <AimOutlined className="text-2xl text-white" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-semibold text-gray-900">Location Configuration</h3>
                <p className="text-sm text-gray-600">Fine-tune your work zone parameters</p>
              </div>
            </div>

            <Form form={form} layout="vertical" className="space-y-6">
              <Form.Item label="Location Name" required>
                <Input
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g., Main Hospital, North Wing, Emergency Department"
                  prefix={<EnvironmentOutlined className="text-gray-400" />}
                  className="premium-input"
                  size="large"
                  maxLength={100}
                  showCount
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
                    tooltip={{
                      formatter: (value) => `${value} km`,
                    }}
                  />
                  <div className="text-sm text-gray-600 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 border border-blue-100">
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>
                        <div className="font-medium text-gray-800 mb-1">Coverage Area</div>
                        <div>Staff can clock in within <strong>{radius} km</strong> of the selected location.</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Total coverage: ~{(Math.PI * radius * radius).toFixed(2)} km² • 
                          Perimeter: ~{(2 * Math.PI * radius).toFixed(2)} km
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Form.Item>
            </Form>
          </div>

          {/* Enhanced Action Buttons */}
          <div className="premium-card p-4 md:p-6 hover-lift shadow-md">
            <div className="space-y-4">
              <Button
                type="dashed"
                icon={<AimOutlined />}
                onClick={getCurrentLocation}
                loading={isGettingLocation}
                block
                size="large"
                className="premium-button-outline h-12 md:h-14 hover:border-blue-300 hover:text-blue-600 transition-all duration-200"
              >
                {isGettingLocation ? 'Detecting Location...' : 'Use My Current Location'}
              </Button>

              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSaveLocation}
                loading={saving}
                disabled={!selectedLocation || !locationName.trim()}
                block
                size="large"
                className="premium-button-primary h-12 md:h-14 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {saving ? 'Saving Configuration...' : 'Save Location Settings'}
              </Button>
            </div>

            {selectedLocation && (
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 space-y-3 mt-6 animate-fade-in border border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700 flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    Selected Location
                  </span>
                  <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                    Click map to change
                  </span>
                </div>
                {locationName && (
                  <div className="text-sm text-gray-900 font-medium break-words bg-white rounded-lg p-2">
                    {locationName}
                  </div>
                )}
                <div className="text-xs text-gray-500 font-mono bg-white rounded p-2">
                  📍 {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Map */}
        <div className="animate-slide-in-right">
          <div className="premium-card overflow-hidden hover-lift shadow-lg">
            <div className="p-4 md:p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-sm">
                    <EnvironmentOutlined className="text-2xl text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold text-gray-900">Interactive Map</h3>
                    <p className="text-sm text-gray-600">Click anywhere to select work location</p>
                  </div>
                </div>
                <div className={`status-indicator ${selectedLocation ? 'status-online' : 'status-warning'} text-xs font-medium px-3 py-1 rounded-full`}>
                  {selectedLocation ? '✓ Location Set' : '⚠ Select Location'}
                </div>
              </div>
            </div>
            
            <div className="relative">
              <LoadScript 
                googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
                loadingElement={
                  <div className="flex justify-center items-center bg-gradient-to-br from-gray-100 to-blue-100" style={{ height: window.innerWidth < 768 ? '400px' : '600px' }}>
                    <div className="text-center animate-fade-in">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <EnvironmentOutlined className="text-2xl text-blue-600" />
                      </div>
                      <Spin size="large" />
                      <p className="text-gray-600 mt-4 font-medium">Loading interactive map...</p>
                      <p className="text-gray-500 text-sm mt-1">Preparing location services</p>
                    </div>
                  </div>
                }
              >
                <GoogleMap
                  mapContainerStyle={{ 
                    ...mapContainerStyle, 
                    height: window.innerWidth < 768 ? '400px' : '600px',
                    borderRadius: '0 0 12px 12px'
                  }}
                  center={mapCenter}
                  zoom={16}
                  onClick={handleMapClick}
                  options={mapOptions}
                >
                  {selectedLocation && (
                    <>
                      <Marker
                        position={selectedLocation}
                        title={locationName || "Work Location"}
                        icon={{
                          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="20" cy="20" r="16" fill="#3b82f6" stroke="white" stroke-width="4"/>
                              <circle cx="20" cy="20" r="8" fill="white"/>
                              <circle cx="20" cy="20" r="4" fill="#3b82f6"/>
                            </svg>
                          `),
                          scaledSize: new google.maps.Size(40, 40),
                          anchor: new google.maps.Point(20, 20),
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
                          strokeWeight: 3
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
                          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="16" cy="16" r="12" fill="#10b981" stroke="white" stroke-width="3"/>
                            <circle cx="16" cy="16" r="6" fill="white"/>
                            <circle cx="16" cy="16" r="3" fill="#10b981"/>
                          </svg>
                        `),
                        scaledSize: new google.maps.Size(32, 32),
                        anchor: new google.maps.Point(16, 16),
                      }}
                    />
                  )}
                </GoogleMap>
              </LoadScript>
              
              {/* Map overlay info */}
              {selectedLocation && (
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-gray-200 animate-fade-in">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="font-medium text-gray-800">Work Zone Active</span>
                    </div>
                    <span className="text-gray-600 bg-gray-100 px-2 py-1 rounded-full text-xs">
                      {radius}km radius
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

