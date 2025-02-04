import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs 
      screenOptions={{
        tabBarStyle: { 
          backgroundColor: 'white',
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Flights',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'airplane' : 'airplane-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="atc"
        options={{
          title: 'ATC',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'radio' : 'radio-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
} 