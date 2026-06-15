import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import DashboardScreen from '../screens/DashboardScreen';
import EnvoyerScreen from '../screens/EnvoyerScreen';
import HistoriqueScreen from '../screens/HistoriqueScreen';

const Tab = createBottomTabNavigator();

const ICONS = {
  Dashboard: '◉',
  Envoyer: '✉',
  Historique: '≡',
};

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.4, color: '#fff' }}>
            {ICONS[route.name]}
          </Text>
        ),
        tabBarStyle: {
          backgroundColor: '#141414',
          borderTopColor: '#222',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#444',
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Accueil' }} />
      <Tab.Screen name="Envoyer" component={EnvoyerScreen} options={{ title: 'Envoyer' }} />
      <Tab.Screen name="Historique" component={HistoriqueScreen} options={{ title: 'Historique' }} />
    </Tab.Navigator>
  );
}
