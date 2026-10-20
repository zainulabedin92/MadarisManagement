import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './src/types';
import { RegisterPage } from './src/screens/RegisterPage';
import { LoginPinPage } from './src/screens/LoginPinPage';
import { AdminPendingPage } from './src/screens/AdminPendingPage';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { SuperAdminDashboard } from './src/screens/SuperAdminDashboard';
import { StudentsListScreen } from './src/screens/StudentsListScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="LoginPinPage"
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="LoginPinPage" component={LoginPinPage} />
          <Stack.Screen name="SuperAdminDashboard" component={SuperAdminDashboard} />
          <Stack.Screen name="StudentsListScreen" component={StudentsListScreen} />
          <Stack.Screen name="DashboardScreen" component={DashboardScreen} />
          <Stack.Screen name="DashboardPage" component={DashboardScreen} />
          <Stack.Screen name="RegisterPage" component={RegisterPage} />
          <Stack.Screen name="AdminPendingPage" component={AdminPendingPage} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
