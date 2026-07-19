/**
 * Navigation Setup - React Navigation 6
 * Bottom Tabs + Stack Navigators + Drawer for complete mobile flow
 * Deep linking, route params, auth guards
 */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, View } from 'react-native';
import { useAuthContext } from '../context/AuthContext';

// Screens
import HomeScreen from '../screens/HomeScreen';
import NavigationScreen from '../screens/NavigationScreen';
import ChatScreen from '../screens/ChatScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AccessibilityScreen from '../screens/AccessibilityScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabIcon({ focused, icon, label }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 4 }}>
      <Text style={{ fontSize: focused ? 22 : 18 }}>{icon}</Text>
      <Text style={{ fontSize: 10, color: focused ? '#2563eb' : '#64748b', fontWeight: focused ? '700' : '400', marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#1e293b', borderTopWidth: 1, borderTopColor: '#334155', height: 70, paddingBottom: 10, paddingTop: 6 },
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#64748b',
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="🏠" label="Home" /> }} />
      <Tab.Screen name="Navigation" component={NavigationScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="🗺️" label="Map" /> }} />
      <Tab.Screen name="Chat" component={ChatScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="💬" label="Chat" />, tabBarBadge: 3 }} />
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="📊" label="Live" /> }} />
      <Tab.Screen name="Accessibility" component={AccessibilityScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="♿" label="Access" /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="👤" label="You" /> }} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  // Simplified - in production would have Login, Register, Forgot
  const LoginPlaceholder = () => (
    <View style={{ flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>StadiumOS</Text>
      <Text style={{ color: '#64748b', marginTop: 8 }}>Please login via context</Text>
    </View>
  );
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginPlaceholder} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { isAuthenticated, loading } = useAuthContext();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 32 }}>🏟️</Text>
        <Text style={{ color: '#fff', marginTop: 12, fontWeight: 'bold' }}>Loading StadiumOS...</Text>
        <Text style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>FIFA World Cup 2026</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
        {/* Additional stack screens for deep navigation */}
        <Stack.Screen name="ZoneDetail" component={NavigationScreen} options={{ headerShown: true, title: 'Zone Detail', headerStyle: { backgroundColor: '#1e293b' }, headerTintColor: '#fff' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Deep linking config for universal links
export const linking = {
  prefixes: ['stadiumos://', 'https://stadiumops.fifa2026.com'],
  config: {
    screens: {
      Main: {
        screens: {
          HomeTab: 'home',
          Navigation: 'map',
          Chat: 'chat',
          Dashboard: 'dashboard',
          Accessibility: 'accessibility',
          Profile: 'profile',
        },
      },
      ZoneDetail: 'zone/:zoneId',
    },
  },
};
