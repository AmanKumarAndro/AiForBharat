import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { CurvedBottomBar } from 'react-native-curved-bottom-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import MyFarmScreen from '../screens/MyFarmScreen';
import QueriesScreen from '../screens/QueriesScreen';
import ToolsScreen from '../screens/ToolsScreen';
import { COLORS } from '../utils/constants';

// SVG Icons from assets/svg folder
import HomeTabIcon from '../../assets/svg/HomeTabIcon';
import FarmTabIcon from '../../assets/svg/FarmTabIcon';
import ChatTabIcon from '../../assets/svg/ChatTabIcon';
import GearTabIcon from '../../assets/svg/GearTabIcon';
import VoiceWaveIcon from '../../assets/svg/VoiceWaveIcon';

// Tab configuration
const TAB_LABELS = {
  Dashboard: 'Home',
  MyFarm: 'My Farm',
  Queries: 'Queries',
  Tools: 'Tools',
};

const TAB_ICON_COMPONENTS = {
  Dashboard: HomeTabIcon,
  MyFarm: FarmTabIcon,
  Queries: ChatTabIcon,
  Tools: GearTabIcon,
};

const renderTabBar = ({ routeName, selectedTab, navigate }) => {
  const isSelected = routeName === selectedTab;
  const color = isSelected ? '#A5D6A7' : 'rgba(255,255,255,0.5)';
  const label = TAB_LABELS[routeName] || routeName;
  const IconComponent = TAB_ICON_COMPONENTS[routeName];
  const size = isSelected ? 23 : 21;

  return (
    <TouchableOpacity
      onPress={() => navigate(routeName)}
      style={styles.tabbarItem}
      activeOpacity={0.8}>
      {IconComponent && <IconComponent width={size} height={size} color={color} />}
      <Text style={[styles.tabLabel, { color }]}>{label}</Text>
      {isSelected && <View style={styles.activeIndicator} />}
    </TouchableOpacity>
  );
};

function BottomTabNavigator({ navigation }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <>
      <SafeAreaView edges={['top']} style={{ backgroundColor: COLORS.background }} />
      <CurvedBottomBar.Navigator
        type="DOWN"
        style={styles.bottomBar}
        shadowStyle={styles.shadow}
        borderTopLeftRight={false}
        height={55}
        circleWidth={20}
        bgColor="#1B5E20"
        initialRouteName="Dashboard"
        screenOptions={{
          headerShown: false,
        }}
        renderCircle={({ navigate }) => (
          <Animated.View style={[styles.btnCircleUp, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.shadow2}>
              <View style={styles.shadow1}>
                <TouchableOpacity
                  style={styles.circleButton}
                  onPress={() => navigation.navigate('QueryAssistant')}
                  activeOpacity={0.85}>
                  <VoiceWaveIcon width={28} height={28} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        )}
        tabBar={renderTabBar}>
        <CurvedBottomBar.Screen
          name="Dashboard"
          position="LEFT"
          component={HomeScreen}
        />
        <CurvedBottomBar.Screen
          name="MyFarm"
          position="LEFT"
          component={MyFarmScreen}
        />
        <CurvedBottomBar.Screen
          name="Queries"
          position="RIGHT"
          component={QueriesScreen}
        />
        <CurvedBottomBar.Screen
          name="Tools"
          position="RIGHT"
          component={ToolsScreen}
        />
      </CurvedBottomBar.Navigator>
      <SafeAreaView edges={['bottom']} style={{ backgroundColor: '#1B5E20' }} />
    </>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  tabbarItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#A5D6A7',
    marginTop: 3,
  },
  btnCircleUp: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    bottom: 25,
  },
  shadow2: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    borderRadius: 999,
    padding: 3,
  },
  shadow1: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.30,
    shadowRadius: 3,
    borderRadius: 999,
  },
  circleButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default BottomTabNavigator;
