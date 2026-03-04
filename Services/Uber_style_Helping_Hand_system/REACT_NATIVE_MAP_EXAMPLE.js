// Complete React Native Map Screen Example
// Shows providers on map with their coordinates

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
import axios from 'axios';

const API_BASE_URL = 'https://nhl6zxlp70.execute-api.ap-south-1.amazonaws.com/prod';

const MapScreen = ({ navigation, route }) => {
  const { serviceType } = route.params; // 'TRACTOR', 'LABOUR', 'TRANSPORT'
  
  const [region, setRegion] = useState({
    latitude: 18.5204,
    longitude: 73.8567,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });
  
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        setRegion({
          latitude,
          longitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        });
        
        // For demo, use pincode 411001
        // In production, use reverse geocoding to get pincode from GPS
        loadProviders('411001');
      },
      (error) => {
        console.error('Location error:', error);
        Alert.alert('Location Error', 'Using default location');
        loadProviders('411001');
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
    );
  };

  const loadProviders = async (pincode) => {
    try {
      setLoading(true);
      
      let url = `${API_BASE_URL}/providers-map?pincode=${pincode}`;
      if (serviceType) {
        url += `&service_type=${serviceType}`;
      }
      
      const response = await axios.get(url);
      setProviders(response.data.providers);
      
      console.log(`Loaded ${response.data.count} providers`);
    } catch (error) {
      console.error('Failed to load providers:', error);
      Alert.alert('Error', 'Failed to load providers');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerPress = (provider) => {
    setSelectedProvider(provider);
    
    // Animate to provider location
    setRegion({
      latitude: provider.latitude,
      longitude: provider.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
  };

  const handleRequestService = async () => {
    if (!selectedProvider) return;
    
    try {
      // Create service request
      const response = await axios.post(`${API_BASE_URL}/request`, {
        farmer_id: '+919910890180', // Get from user context
        farmer_name: 'Test Farmer',
        service_type: serviceType,
        farmer_pincode: '411001',
        estimated_price: selectedProvider.price_per_hour,
      });
      
      Alert.alert(
        'Request Sent!',
        `Request ID: ${response.data.request_id}\nProviders will be notified via SMS.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('RequestStatus', {
              requestId: response.data.request_id,
            }),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create request');
    }
  };

  const getMarkerIcon = (type) => {
    switch (type) {
      case 'TRACTOR': return '🚜';
      case 'LABOUR': return '👷';
      case 'TRANSPORT': return '🚚';
      default: return '📍';
    }
  };

  const getMarkerColor = (provider) => {
    if (selectedProvider?.provider_id === provider.provider_id) {
      return 'red';
    }
    return provider.is_available ? 'green' : 'gray';
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {/* User Location Marker */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="Your Location"
            description="You are here"
            pinColor="blue"
          />
        )}

        {/* Provider Markers */}
        {providers.map((provider) => (
          <Marker
            key={provider.provider_id}
            coordinate={{
              latitude: provider.latitude,
              longitude: provider.longitude,
            }}
            onPress={() => handleMarkerPress(provider)}
            pinColor={getMarkerColor(provider)}
            title={provider.name}
            description={`⭐ ${provider.rating} | ₹${provider.price_per_hour}/hr`}
          >
            <View style={styles.markerContainer}>
              <View style={[
                styles.markerBubble,
                selectedProvider?.provider_id === provider.provider_id && styles.markerSelected
              ]}>
                <Text style={styles.markerIcon}>
                  {getMarkerIcon(provider.service_type)}
                </Text>
                <Text style={styles.markerRating}>
                  ⭐{provider.rating.toFixed(1)}
                </Text>
              </View>
              <View style={styles.markerArrow} />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading providers...</Text>
        </View>
      )}

      {/* Provider Info Card */}
      {selectedProvider && (
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View>
              <Text style={styles.providerName}>{selectedProvider.name}</Text>
              <Text style={styles.providerType}>
                {getMarkerIcon(selectedProvider.service_type)} {selectedProvider.service_type}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedProvider(null)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Rating:</Text>
            <Text style={styles.infoValue}>
              ⭐ {selectedProvider.rating.toFixed(1)} ({selectedProvider.total_jobs} jobs)
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Price:</Text>
            <Text style={styles.infoValue}>₹{selectedProvider.price_per_hour}/hour</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Location:</Text>
            <Text style={styles.infoValue}>{selectedProvider.pincode}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status:</Text>
            <Text style={[
              styles.infoValue,
              { color: selectedProvider.is_available ? '#4CAF50' : '#999' }
            ]}>
              {selectedProvider.is_available ? '● Available' : '● Busy'}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.requestButton,
              !selectedProvider.is_available && styles.requestButtonDisabled
            ]}
            onPress={handleRequestService}
            disabled={!selectedProvider.is_available}
          >
            <Text style={styles.requestButtonText}>
              {selectedProvider.is_available ? 'Request Service' : 'Not Available'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Provider Count Badge */}
      <View style={styles.countBadge}>
        <Text style={styles.countText}>
          {providers.length} {serviceType?.toLowerCase() || 'provider'}(s) nearby
        </Text>
      </View>

      {/* Refresh Button */}
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={() => loadProviders('411001')}
      >
        <Text style={styles.refreshIcon}>🔄</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerBubble: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: '#4CAF50',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerSelected: {
    borderColor: '#FF5722',
    borderWidth: 3,
    transform: [{ scale: 1.1 }],
  },
  markerIcon: {
    fontSize: 24,
  },
  markerRating: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
  markerArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'white',
  },
  loadingContainer: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  loadingText: {
    color: 'white',
    fontSize: 14,
  },
  infoCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  providerName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  providerType: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  closeButton: {
    fontSize: 24,
    color: '#999',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  requestButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  requestButtonDisabled: {
    backgroundColor: '#ccc',
  },
  requestButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  countBadge: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  countText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  refreshButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'white',
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  refreshIcon: {
    fontSize: 24,
  },
});

export default MapScreen;
