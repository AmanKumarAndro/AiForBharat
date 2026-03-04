import React from 'react';
import { LogBox } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import BottomTabNavigator from './BottomTabNavigator';
import WeatherScreen from '../screens/WeatherScreen';
import ProfileFormScreen from '../screens/ProfileFormScreen';
import api from '../services/api';
import IrrigationAPI from '../services/IrrigationAPI';
import { useState, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import CropGuideScreen from '../screens/CropGuideScreen';
import PestScanScreen from '../screens/PestScanScreen';
import QueryAssistantScreen from '../screens/QueryAssistantScreenSimple';
import IrrigationRegistrationScreen from '../screens/IrrigationRegistrationScreen';
import IrrigationTabNavigator from './IrrigationTabNavigator';
import ProfileScreen from '../screens/ProfileScreen';
import ServicesScreen from '../screens/ServicesScreen';
import RequestStatusScreen from '../screens/RequestStatusScreen';
import ProviderRegisterScreen from '../screens/ProviderRegisterScreen';
import ProviderDashboardScreen from '../screens/ProviderDashboardScreen';
import MarketScreen from '../screens/MarketScreen';
import { COLORS } from '../utils/constants';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

const Stack = createNativeStackNavigator();

// Screens without safe area (like onboarding, login)
const withoutSafeArea = ['ProfileDetails', 'Services', 'Market'];

// Custom hook for safe area wrapper
function withSafeArea(Component, screenName) {
  const Wrapped = props => {
    if (withoutSafeArea.includes(screenName)) {
      return <Component {...props} />;
    }
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: COLORS.background }}
        edges={['top', 'bottom']}>
        <Component {...props} />
      </SafeAreaView>
    );
  };

  Wrapped.displayName = `withSafeArea(${Component.displayName || Component.name || 'Component'
    })`;
  return Wrapped;
}

const AppNavigator = () => {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await api.isAuthenticated();
        if (authenticated) {
          const profileComplete = await api.isProfileComplete();
          setInitialRoute(profileComplete ? 'Home' : 'ProfileForm');
        } else {
          setInitialRoute('Onboarding');
        }
      } catch (error) {
        setInitialRoute('Onboarding');
      }
    };
    checkAuth();
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color="#1B5E20" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: COLORS.background },
      }}>
      {/* Irrigation Module Screens */}
      <Stack.Screen
        name="IrrigationRegistration"
        component={withSafeArea(IrrigationRegistrationScreen, 'IrrigationRegistration')}
      />
      <Stack.Screen
        name="IrrigationMainApp"
        component={IrrigationTabNavigator}
      />

      {/* Existing App Screens */}
      <Stack.Screen
        name="Onboarding"
        component={withSafeArea(OnboardingScreen, 'Onboarding')}
      />
      <Stack.Screen
        name="Login"
        component={withSafeArea(LoginScreen, 'Login')}
      />
      <Stack.Screen
        name="Signup"
        component={withSafeArea(SignupScreen, 'Signup')}
      />
      <Stack.Screen
        name="ProfileForm"
        component={withSafeArea(ProfileFormScreen, 'ProfileForm')}
      />
      <Stack.Screen name="Home" component={BottomTabNavigator} />
      <Stack.Screen
        name="Weather"
        component={withSafeArea(WeatherScreen, 'Weather')}
      />
      <Stack.Screen
        name="CropGuide"
        component={withSafeArea(CropGuideScreen, 'CropGuide')}
      />
      <Stack.Screen
        name="PestScan"
        component={withSafeArea(PestScanScreen, 'PestScan')}
      />
      <Stack.Screen
        name="QueryAssistant"
        component={withSafeArea(QueryAssistantScreen, 'QueryAssistant')}
      />
      <Stack.Screen
        name="ProfileDetails"
        component={withSafeArea(ProfileScreen, 'ProfileDetails')}
      />
      <Stack.Screen
        name="Services"
        component={ServicesScreen}
      />
      <Stack.Screen
        name="RequestStatus"
        component={withSafeArea(RequestStatusScreen, 'RequestStatus')}
      />
      <Stack.Screen
        name="ProviderRegister"
        component={withSafeArea(ProviderRegisterScreen, 'ProviderRegister')}
      />
      <Stack.Screen
        name="ProviderDashboard"
        component={withSafeArea(ProviderDashboardScreen, 'ProviderDashboard')}
      />
      <Stack.Screen
        name="Market"
        component={MarketScreen}
      />
    </Stack.Navigator>
  );
};


export default AppNavigator;
