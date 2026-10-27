import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { apiService } from '../services/api';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, any>;
}

const ROLES = [
  'Hifz Teacher',
  'Nazra Teacher',
  'Darse Nizami Teacher',
  'Head Teacher',
  'Tajweed Teacher',
  'General Teacher',
];

export const TeacherAddScreen: React.FC<Props> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [cnic, setCnic] = useState('');
  const [selectedRole, setSelectedRole] = useState('Hifz Teacher');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [submitting, setSubmitting] = useState(false);

  // Auto-format phone: 03XX-XXXXXXX
  const handlePhoneChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 11);
    if (raw.length > 4) {
      setPhone(`${raw.slice(0, 4)}-${raw.slice(4)}`);
    } else {
      setPhone(raw);
    }
  };

  // Auto-format CNIC: XXXXX-XXXXXXX-X
  const handleCnicChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 13);
    if (raw.length > 12) {
      setCnic(`${raw.slice(0, 5)}-${raw.slice(5, 12)}-${raw.slice(12)}`);
    } else if (raw.length > 5) {
      setCnic(`${raw.slice(0, 5)}-${raw.slice(5)}`);
    } else {
      setCnic(raw);
    }
  };

  const handlePreFill = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setName(`Qari Abdul Sami Sahib`);
    setPhone(`0301-${randomSuffix}55`);
    setEmail(`sami.${randomSuffix}@mms.edu`);
    setCnic(`42101-4455667-${Math.floor(1 + Math.random() * 9)}`);
    setSelectedRole('Hifz Teacher');
    setStatus('Active');
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter Teacher full name.');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 11-digit phone number (e.g. 0300-1234567).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiService.createTeacher({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        cnic: cnic.trim() || undefined,
        role: selectedRole,
        status,
      });

      if (res.success) {
        Alert.alert(
          'Teacher Registered!',
          `Hazrat ${name} has been successfully added to MMS Faculty.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Registration Failed', res.message || 'Could not register teacher.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Network error while registering teacher.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Add New Teacher</Text>
          <Text style={styles.headerSubtitle}>استاذ کی نئی رجسٹریشن</Text>
        </View>

        <TouchableOpacity style={styles.prefillBtn} onPress={handlePreFill}>
          <Text style={styles.prefillBtnText}>⚡ Demo Fill</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Card Form */}
          <View style={styles.card}>
            <Text style={styles.sectionHeading}>FACULTY DETAILS (تفصیلاتِ استاذ)</Text>

            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Teacher Full Name <Text style={styles.req}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Maulana Bilal Ahmad"
                placeholderTextColor="#94a3b8"
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Phone Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Phone Number (Mobile) <Text style={styles.req}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="0300-1234567"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={handlePhoneChange}
              />
              <Text style={styles.hint}>Used for SMS alerts & WhatsApp notifications</Text>
            </View>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. bilal.ahmad@mms.edu"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* CNIC Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>National ID / CNIC (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="XXXXX-XXXXXXX-X"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={cnic}
                onChangeText={handleCnicChange}
              />
            </View>

            {/* Role Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Designated Teaching Role <Text style={styles.req}>*</Text>
              </Text>
              <View style={styles.rolesGrid}>
                {ROLES.map((role) => {
                  const isSelected = selectedRole === role;
                  return (
                    <TouchableOpacity
                      key={role}
                      style={[styles.roleOption, isSelected && styles.roleOptionSelected]}
                      onPress={() => setSelectedRole(role)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.roleOptionText,
                          isSelected && styles.roleOptionTextSelected,
                        ]}
                      >
                        {isSelected ? '✓ ' : ''}
                        {role}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Duty Status */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.statusToggleRow}>
                <TouchableOpacity
                  style={[
                    styles.statusToggleBtn,
                    status === 'Active' && styles.statusToggleBtnActive,
                  ]}
                  onPress={() => setStatus('Active')}
                >
                  <Text
                    style={[
                      styles.statusToggleText,
                      status === 'Active' && styles.statusToggleTextActive,
                    ]}
                  >
                    ● Active on Duty
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.statusToggleBtn,
                    status === 'Inactive' && styles.statusToggleBtnInactive,
                  ]}
                  onPress={() => setStatus('Inactive')}
                >
                  <Text
                    style={[
                      styles.statusToggleText,
                      status === 'Inactive' && styles.statusToggleTextInactive,
                    ]}
                  >
                    ○ Inactive / On Leave
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitBtnText}>✓ Save & Register Teacher</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#064e3b',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#a7f3d0',
  },
  prefillBtn: {
    backgroundColor: '#d97706',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  prefillBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 36,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#047857',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  req: {
    color: '#dc2626',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 14,
    color: '#0f172a',
  },
  hint: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
  },
  rolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  roleOptionSelected: {
    backgroundColor: '#059669',
    borderColor: '#047857',
  },
  roleOptionText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  roleOptionTextSelected: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  statusToggleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statusToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  statusToggleBtnActive: {
    backgroundColor: '#d1fae5',
    borderColor: '#059669',
  },
  statusToggleBtnInactive: {
    backgroundColor: '#fee2e2',
    borderColor: '#dc2626',
  },
  statusToggleText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  statusToggleTextActive: {
    color: '#065f46',
    fontWeight: 'bold',
  },
  statusToggleTextInactive: {
    color: '#b91c1c',
    fontWeight: 'bold',
  },
  submitBtn: {
    marginTop: 20,
    backgroundColor: '#059669',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
