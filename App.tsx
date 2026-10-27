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
import { StudentAddScreen } from './src/screens/StudentAddScreen';
import { TeachersListScreen } from './src/screens/TeachersListScreen';
import { TeacherAddScreen } from './src/screens/TeacherAddScreen';
import { ClassesListScreen } from './src/screens/ClassesListScreen';
import { ClassAddScreen } from './src/screens/ClassAddScreen';
import { ParentsListScreen } from './src/screens/ParentsListScreen';
import { ParentPortalScreen } from './src/screens/ParentPortalScreen';
import { TeacherPortalScreen } from './src/screens/TeacherPortalScreen';
import { AttendanceScreen } from './src/screens/AttendanceScreen';

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
          {/* Auth & Core Flow */}
          <Stack.Screen name="LoginPinPage" component={LoginPinPage} />
          <Stack.Screen name="SuperAdminDashboard" component={SuperAdminDashboard} />
          <Stack.Screen name="DashboardScreen" component={DashboardScreen} />
          <Stack.Screen name="DashboardPage" component={DashboardScreen} />
          <Stack.Screen name="RegisterPage" component={RegisterPage} />
          <Stack.Screen name="AdminPendingPage" component={AdminPendingPage} />

          {/* Student Flow */}
          <Stack.Screen name="StudentsListScreen" component={StudentsListScreen} />
          <Stack.Screen name="StudentAddScreen" component={StudentAddScreen} />

          {/* Teacher Flow */}
          <Stack.Screen name="TeachersListScreen" component={TeachersListScreen} />
          <Stack.Screen name="TeacherAddScreen" component={TeacherAddScreen} />
          <Stack.Screen name="TeacherPortalScreen" component={TeacherPortalScreen} />

          {/* Class / Darja Flow */}
          <Stack.Screen name="ClassesListScreen" component={ClassesListScreen} />
          <Stack.Screen name="ClassAddScreen" component={ClassAddScreen} />

          {/* Parent Flow */}
          <Stack.Screen name="ParentsListScreen" component={ParentsListScreen} />
          <Stack.Screen name="ParentPortalScreen" component={ParentPortalScreen} />

          {/* Attendance / Haziri Flow */}
          <Stack.Screen name="AttendanceScreen" component={AttendanceScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
