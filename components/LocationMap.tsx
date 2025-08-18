'use client'

import React, { useCallback, useEffect, useState } from 'react';
import { GoogleMap, LoadScript, Circle, Marker } from '@react-google-maps/api';
import { useQuery } from '@apollo/client';
import { gql } from 'graphql-tag';
import { Spin, Alert } from 'antd';
import { MapPin, Navigation } from 'lucide-react';

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

interface LocationMapProps {
  currentLocation?: {lat: number, lng: number} | null;
  withinPerimeter?: boolean;
  className?: string;
  showControls?: boolean;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 37.7749,
  lng: -122.4194, // San Francisco
};

// Custom map styles for a premium look
const mapStyles = [
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
    featureType: 'all',
    elementType: 'labels.text',
    stylers: [{ visibility: 'on' }]
  },
  {
    featureType: 'landscape',
    elementType: 'all',
    stylers: [{ color: '#f2f2f2' }]
  },
  {
    featureType: 'landscape',
    elementType: 'geometry.fill',
    stylers: [{ color: '#ffffff' }]
  },
  {
    featureType: 'landscape.man_made',
    elementType: 'geometry.fill',
    stylers: [{ color: '#ffffff' }]
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
    featureType: 'road',
    elementType: 'geometry.fill',
    stylers: [{ color: '#eeeeee' }]
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#7b7b7b' }]
  },
  {
    featureType: 'road',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#ffffff' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'all',
    stylers: [{ visibility: 'simplified' }]
  },
  {
    featureType: 'road.arterial',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'transit',
    elementType: 'all',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'water',
    elementType: 'all',
    stylers: [{ color: '#46bcec' }, { visibility: 'on' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry.fill',
    stylers: [{ color: '#c8d7d4' }]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#070707' }]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#ffffff' }]
  }
];

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  styles: mapStyles,
  gestureHandling: 'cooperative',
};

export default function LocationMap({ 
  currentLocation, 
  withinPerimeter = false, 
  className = '',
  showControls = false 
}: LocationMapProps) {
  const { data: locationData, loading, error } = useQuery(GET_LOCATION_SETTINGS);
  console.log(locationData);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [locationName, setLocationName] = useState<string>('');
  const [mapsApiLoaded, setMapsApiLoaded] = useState(false);

  // Update map center when location changes
  useEffect(() => {
    if (currentLocation) {
      setMapCenter(currentLocation);
      getLocationName(currentLocation.lat, currentLocation.lng);
    } else if (locationData?.locationSettings?.length > 0) {
      const setting = locationData.locationSettings[0];
      setMapCenter({ lat: setting.latitude, lng: setting.longitude });
    }
  }, [currentLocation, locationData]);

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

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="text-center">
          <Spin size="large" />
          <p className="text-gray-600 mt-2">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <Alert
          message="Map Error"
          description="Unable to load location map"
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Location Name Overlay */}
      {locationName && (
        <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">{locationName}</span>
          </div>
        </div>
      )}

      {/* Status Indicator */}
      {currentLocation && (
        <div className="absolute top-4 right-4 z-10">
          <div className={`px-3 py-2 rounded-lg text-sm font-medium shadow-sm border ${
            withinPerimeter 
              ? 'bg-green-50 text-green-700 border-green-200' 
              : 'bg-yellow-50 text-yellow-700 border-yellow-200'
          }`}>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                withinPerimeter ? 'bg-green-500' : 'bg-yellow-500'
              } ${withinPerimeter ? 'animate-pulse' : ''}`} />
              <span>{withinPerimeter ? 'In Work Zone' : 'Outside Zone'}</span>
            </div>
          </div>
        </div>
      )}

      <LoadScript 
        googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
        loadingElement={
          <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
            <Spin size="large" />
          </div>
        }
      >
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapCenter}
          zoom={16}
          options={mapOptions}
        >
          {/* Work Zone Circles */}
          {locationData?.locationSettings?.map((setting: any) => (
            <Circle
              key={setting.id}
              center={{ lat: setting.latitude, lng: setting.longitude }}
              radius={setting.radius * 1000} // Convert km to meters
              options={{
                fillColor: withinPerimeter ? '#10b981' : '#3b82f6',
                fillOpacity: 0.15,
                strokeColor: withinPerimeter ? '#10b981' : '#3b82f6',
                strokeOpacity: 0.8,
                strokeWeight: 2,
              }}
            />
          ))}

          {/* Work Location Markers */}
          <GoogleMap
            onLoad={() => setMapsApiLoaded(true)}
          /* ...other props */
          >
          {mapsApiLoaded && locationData?.locationSettings?.map((setting: any) => (
            <Marker
              key={`marker-${setting.id}`}
              position={{ lat: setting.latitude, lng: setting.longitude }}
              title={setting.name}
              icon={{
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="12" fill="#3b82f6" stroke="white" stroke-width="3"/>
                    <circle cx="16" cy="16" r="6" fill="white"/>
                  </svg>
                `),
                scaledSize: new window.google.maps.Size(32, 32),
                anchor: new window.google.maps.Point(16, 16),
              }}
            />
            ))}
          </GoogleMap>

          {/* Current Location Marker */}
          {currentLocation && window.google?.maps?.Size && (
            <Marker
              position={currentLocation}
              title="Your Current Location"
              icon={{
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="8" fill="${withinPerimeter ? '#10b981' : '#f59e0b'}" stroke="white" stroke-width="2"/>
                    <circle cx="12" cy="12" r="3" fill="white"/>
                  </svg>
                `),
                scaledSize: new window.google.maps.Size(24, 24),
                anchor: new window.google.maps.Point(12, 12),
              }}
            />
          )}
        </GoogleMap>
      </LoadScript>
    </div>
  );
}