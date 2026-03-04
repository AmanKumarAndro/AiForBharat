import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../utils/constants';

// Screens
import IrrigationDashboardScreen from '../screens/IrrigationDashboardScreen';
import IrrigationTimelineScreen from '../screens/IrrigationTimelineScreen';
import IrrigationAlertsScreen from '../screens/IrrigationAlertsScreen';
import IrrigationProfileScreen from '../screens/IrrigationProfileScreen';

// SVG Icons
import HomeTabIcon from '../../assets/svg/HomeTabIcon';
import LeafIcon from '../../assets/svg/LeafIcon';
import BellIcon from '../../assets/svg/BellIcon';
import UserIcon from '../../assets/svg/UserIcon';

const Tab = createBottomTabNavigator();

export default function IrrigationTabNavigator() {
    return (
        <>
            <SafeAreaView edges={['top']} style={{ backgroundColor: COLORS.background }} />
            <Tab.Navigator
                screenOptions={{
                    tabBarActiveTintColor: '#1B5E20',
                    tabBarInactiveTintColor: '#9CA3AF',
                    tabBarStyle: {
                        height: 70,
                        paddingBottom: 15,
                        paddingTop: 10,
                        backgroundColor: '#FFF',
                        borderTopWidth: 1,
                        borderTopColor: '#F3F4F6',
                        elevation: 8,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: -3 },
                        shadowOpacity: 0.06,
                        shadowRadius: 8,
                    },
                    tabBarLabelStyle: {
                        fontSize: 11,
                        fontWeight: '700',
                        marginTop: -2,
                    },
                    headerShown: false,
                }}
            >
                <Tab.Screen
                    name="IrrigationDashboard"
                    component={IrrigationDashboardScreen}
                    options={{
                        tabBarLabel: 'Home',
                        tabBarIcon: ({ color, focused }) => (
                            <View style={styles.iconContainer}>
                                <HomeTabIcon width={22} height={22} color={color} />
                                {focused && <View style={styles.activeDot} />}
                            </View>
                        ),
                    }}
                />
                <Tab.Screen
                    name="IrrigationTimeline"
                    component={IrrigationTimelineScreen}
                    options={{
                        tabBarLabel: 'Crops',
                        tabBarIcon: ({ color, focused }) => (
                            <View style={styles.iconContainer}>
                                <LeafIcon width={22} height={22} color={color} />
                                {focused && <View style={styles.activeDot} />}
                            </View>
                        ),
                    }}
                />
                <Tab.Screen
                    name="IrrigationAlerts"
                    component={IrrigationAlertsScreen}
                    options={{
                        tabBarLabel: 'Alerts',
                        tabBarIcon: ({ color, focused }) => (
                            <View style={styles.iconContainer}>
                                <BellIcon width={22} height={22} color={color} />
                                {focused && <View style={styles.activeDot} />}
                            </View>
                        ),
                    }}
                />
                <Tab.Screen
                    name="IrrigationProfile"
                    component={IrrigationProfileScreen}
                    options={{
                        tabBarLabel: 'Profile',
                        tabBarIcon: ({ color, focused }) => (
                            <View style={styles.iconContainer}>
                                <UserIcon width={22} height={22} color={color} />
                                {focused && <View style={styles.activeDot} />}
                            </View>
                        ),
                    }}
                />
            </Tab.Navigator>
            <SafeAreaView edges={['bottom']} style={{ backgroundColor: '#FFF' }} />
        </>
    );
}

const styles = StyleSheet.create({
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: '#1B5E20',
        marginTop: 4,
    },
});
