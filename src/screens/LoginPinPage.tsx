import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TextInput,
  Image,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { apiService } from '../services/api';
import Logo from '../assets/img/logo-mms.png';

type LoginPinPageNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'LoginPinPage'
>;

interface Props {
  navigation: LoginPinPageNavigationProp;
}

export const LoginPinPage: React.FC<Props> = ({ navigation }) => {
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; pin?: string }>({});

  // Prevent hardware back button from navigating back into a logged-out session
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        BackHandler.exitApp();
        return true;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => subscription.remove();
    }, [])
  );

  // API Config modal state
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [tempUrl, setTempUrl] = useState(apiService.getBaseUrl());

  const handleOpenConfig = () => {
    setTempUrl(apiService.getBaseUrl());
    setConfigModalVisible(true);
  };

  const handleSaveApiUrl = () => {
    if (!tempUrl.trim()) {
      Alert.alert('Error', 'Please enter a valid API URL');
      return;
    }
    apiService.setBaseUrl(tempUrl);
    setConfigModalVisible(false);
    Alert.alert('API Config', `Base URL updated to:\n${apiService.getBaseUrl()}`);
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Forgot Password / PIN',
      'Please contact your Madaris Administrator or Nazim-e-Taleem to reset your 4-digit PIN or password.',
      [{ text: 'OK' }]
    );
  };

  const handleLogin = async () => {
    const newErrors: { identifier?: string; pin?: string } = {};

    if (!identifier.trim()) {
      newErrors.identifier = 'Please enter Username, CNIC, or Mobile Number';
    }
    if (!pin) {
      newErrors.pin = '4-Digit PIN is required';
    } else if (pin.length !== 4) {
      newErrors.pin = 'PIN must be 4 digits';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const res = await apiService.loginPin(identifier, pin);
      setLoading(false);

      if (res.success) {
        const resolvedRole = (
          res.role ||
          res.user?.role ||
          (res.data as any)?.role ||
          (res.data as any)?.user?.role ||
          res.student?.role ||
          'student'
        ).toLowerCase();
        const isSuperAdmin =
          resolvedRole === 'superadmin' || resolvedRole === 'admin';

        const displayName =
          res.user?.name ||
          (res.data as any)?.user?.name ||
          res.teacher?.name ||
          res.parent?.name ||
          res.student?.fullName ||
          (res.student
            ? `${res.student.firstName || ''} ${res.student.lastName || ''}`.trim()
            : '') ||
          (isSuperAdmin ? 'Hazrat Maulana Muhtamim Sahib' : 'Talib-e-Ilm');

        // Direct navigation when matched in the `users` table as SuperAdmin / Admin
        if (isSuperAdmin) {
          apiService.setSessionRole(resolvedRole);
          apiService.setCurrentStudent(null);
          navigation.reset({
            index: 0,
            routes: [
              {
                name: 'SuperAdminDashboard',
                params: {
                  userName: displayName,
                  role: resolvedRole === 'admin' ? 'Admin' : 'SuperAdmin',
                },
              },
            ],
          });
          return;
        }

        if (resolvedRole === 'teacher') {
          apiService.setSessionRole('teacher');
          apiService.setCurrentStudent(null);
          navigation.reset({
            index: 0,
            routes: [
              {
                name: 'TeacherPortalScreen',
                params: { teacher: res.teacher },
              },
            ],
          });
          return;
        }

        if (resolvedRole === 'parent') {
          apiService.setSessionRole('parent');
          apiService.setCurrentStudent(null);
          navigation.reset({
            index: 0,
            routes: [
              {
                name: 'ParentPortalScreen',
                params: { token: res.token, parent: res.parent },
              },
            ],
          });
          return;
        }

        // Student login: keep strict 'student' role and store only this student's profile
        apiService.setSessionRole('student');
        apiService.setCurrentStudent(res.student || null);
        navigation.reset({
          index: 0,
          routes: [
            {
              name: 'DashboardScreen',
              params: {
                userName: displayName,
                role: 'student',
                student: res.student,
              },
            },
          ],
        });
      } else {
        Alert.alert(
          'Login Failed',
          res.message || 'Invalid PIN or credentials. Please try again.'
        );
      }
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Error', err.message || 'Failed to authenticate');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Bar with API Config Settings */}
          <View style={styles.topBar}>
            <View style={styles.topPlaceholder} />
            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={handleOpenConfig}
            >
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>

          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image source={Logo} style={styles.logo} />
          </View>

          <Text style={styles.title}>Madaris Management</Text>
          <Text style={styles.subtitle}>
            Enter your registered Username, CNIC, or Mobile No and 4-digit PIN to sign in.
          </Text>

          {/* Login Form */}
          <View style={styles.card}>
            <CustomInput
              label="Username, CNIC, or Mobile No"
              placeholder="e.g. superadmin, 12345-6789012-3, or 03001234567"
              value={identifier}
              onChangeText={setIdentifier}
              error={errors.identifier}
              required
            />

            <CustomInput
              label="4-Digit PIN"
              placeholder="••••"
              value={pin}
              onChangeText={(txt) => setPin(txt.replace(/\D/g, '').slice(0, 4))}
              keyboardType="number-pad"
              maxLength={4}
              isPin
              error={errors.pin}
              required
            />

            <TouchableOpacity
              style={styles.forgotPasswordContainer}
              onPress={handleForgotPassword}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <CustomButton
              title="Unlock / Login"
              onPress={handleLogin}
              loading={loading}
              style={{ marginTop: 6 }}
            />

            {/* Dedicated Portals Section */}
            <View style={styles.portalsContainer}>
              <TouchableOpacity
                style={[styles.portalCardBtn, { marginBottom: 10, borderColor: '#fde68a', backgroundColor: '#fffbeb' }]}
                onPress={() => navigation.navigate('TeacherPortalScreen')}
                activeOpacity={0.8}
              >
                <Text style={styles.portalCardIcon}>👳‍♂️</Text>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.portalCardTitle}>Teacher Portal (اساتذہ پورٹل)</Text>
                  <Text style={styles.portalCardSub}>
                    Enter class, mark daily attendance & check student monthly/yearly reports
                  </Text>
                </View>
                <Text style={styles.portalCardArrow}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.portalCardBtn}
                onPress={() => navigation.navigate('ParentPortalScreen')}
                activeOpacity={0.8}
              >
                <Text style={styles.portalCardIcon}>👨‍👩‍👦</Text>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.portalCardTitle}>Parent Portal (والدین پورٹل)</Text>
                  <Text style={styles.portalCardSub}>
                    View child enrollment, monthly & yearly attendance reports
                  </Text>
                </View>
                <Text style={styles.portalCardArrow}>→</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* API Server Configuration Modal */}
      <Modal
        visible={configModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setConfigModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>API Server Configuration</Text>
            <Text style={styles.modalSubtext}>
              Set the backend API host URL or select a preset below:
            </Text>

            <TextInput
              style={styles.urlInput}
              value={tempUrl}
              onChangeText={setTempUrl}
              placeholder="http://localhost:5000"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Presets */}
            <Text style={styles.presetLabel}>Quick Presets:</Text>
            <View style={styles.presetList}>
              <TouchableOpacity
                style={[
                  styles.presetChip,
                  tempUrl === 'http://localhost:5000' && styles.presetChipActive,
                ]}
                onPress={() => setTempUrl('http://localhost:5000')}
              >
                <Text
                  style={[
                    styles.presetChipText,
                    tempUrl === 'http://localhost:5000' &&
                    styles.presetChipTextActive,
                  ]}
                >
                  🔌 USB Phone (localhost:5000)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.presetChip,
                  tempUrl === 'http://10.0.2.2:5000' && styles.presetChipActive,
                ]}
                onPress={() => setTempUrl('http://10.0.2.2:5000')}
              >
                <Text
                  style={[
                    styles.presetChipText,
                    tempUrl === 'http://10.0.2.2:5000' &&
                    styles.presetChipTextActive,
                  ]}
                >
                  📱 Android Emulator (10.0.2.2:5000)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.presetChip,
                  tempUrl === 'http://192.168.1.9:5000' && styles.presetChipActive,
                ]}
                onPress={() => setTempUrl('http://192.168.1.9:5000')}
              >
                <Text
                  style={[
                    styles.presetChipText,
                    tempUrl === 'http://192.168.1.9:5000' &&
                    styles.presetChipTextActive,
                  ]}
                >
                  📶 Wi-Fi LAN (192.168.1.9:5000)
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setConfigModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveApiUrl}
              >
                <Text style={styles.saveBtnText}>Save URL</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  logo: {
    width: 90,
    height: 90,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  topPlaceholder: {
    width: 36,
  },
  backBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },
  settingsBtn: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  settingsIcon: {
    fontSize: 18,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#059669',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  logoEmblem: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 28,
    paddingHorizontal: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginTop: -4,
    marginBottom: 16,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#059669',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  modalSubtext: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  urlInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    color: '#111827',
    marginBottom: 14,
  },
  presetLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  presetList: {
    gap: 8,
    marginBottom: 20,
  },
  presetChip: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  presetChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  presetChipText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  presetChipTextActive: {
    color: '#059669',
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    color: '#6B7280',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#059669',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  portalsContainer: {
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 16,
  },
  portalCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    padding: 12,
    elevation: 1,
  },
  portalCardIcon: {
    fontSize: 24,
  },
  portalCardTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  portalCardSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  portalCardArrow: {
    fontSize: 16,
    color: '#059669',
    fontWeight: 'bold',
  },
});
