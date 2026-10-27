import React, { useState, useEffect } from 'react';
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
import { RootStackParamList, ClassItem } from '../types';
import { apiService } from '../services/api';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, any>;
}

export const StudentAddScreen: React.FC<Props> = ({ navigation }) => {
  // Student Details
  const [fullName, setFullName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [bFormNo, setBFormNo] = useState('');
  const [dob, setDob] = useState('2014-05-10');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  // Parent Details
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentCnic, setParentCnic] = useState('');
  const [parentAddress, setParentAddress] = useState('');
  const [parentPassword, setParentPassword] = useState('password123');

  // Classes list & loading
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadClasses() {
      try {
        const res = await apiService.getClasses();
        if (res.success && res.classes && res.classes.length > 0) {
          setClasses(res.classes);
          setSelectedClassId(res.classes[0]._id || null);
        }
      } catch {
        // Fallback
      } finally {
        setLoadingClasses(false);
      }
    }
    loadClasses();
  }, []);

  // Format phone: 03XX-XXXXXXX
  const handleParentPhoneChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 11);
    if (raw.length > 4) {
      setParentPhone(`${raw.slice(0, 4)}-${raw.slice(4)}`);
    } else {
      setParentPhone(raw);
    }
  };

  // Format CNIC: XXXXX-XXXXXXX-X
  const handleParentCnicChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 13);
    if (raw.length > 12) {
      setParentCnic(`${raw.slice(0, 5)}-${raw.slice(5, 12)}-${raw.slice(12)}`);
    } else if (raw.length > 5) {
      setParentCnic(`${raw.slice(0, 5)}-${raw.slice(5)}`);
    } else {
      setParentCnic(raw);
    }
  };

  const handleBFormChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 13);
    if (raw.length > 12) {
      setBFormNo(`${raw.slice(0, 5)}-${raw.slice(5, 12)}-${raw.slice(12)}`);
    } else if (raw.length > 5) {
      setBFormNo(`${raw.slice(0, 5)}-${raw.slice(5)}`);
    } else {
      setBFormNo(raw);
    }
  };

  const handleDemoFill = () => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    setFullName(`Muhammad Talha ${rand}`);
    setFatherName(`Hafiz Tariq Mahmood`);
    setGender('Male');
    setBFormNo(`42101-${rand}567-1`);
    setDob('2013-08-15');
    setParentName('Hafiz Tariq Mahmood');
    setParentPhone(`0300-${rand}55`);
    setParentCnic(`42101-${rand}567-1`);
    setParentAddress('House 45, Street 12, Gulshan-e-Iqbal, Karachi');
    setParentPassword('password123');
  };

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      Alert.alert('Required Field', 'Please enter student full name.');
      return;
    }
    if (!fatherName.trim()) {
      Alert.alert('Required Field', 'Please enter father name.');
      return;
    }
    if (!selectedClassId) {
      Alert.alert('Class Required', 'Please assign a class / darja to the student.');
      return;
    }
    const cleanPhone = parentPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 11-digit guardian mobile number.');
      return;
    }
    const cleanCnic = parentCnic.replace(/\D/g, '');
    if (!cleanCnic || cleanCnic.length < 13) {
      Alert.alert('Invalid CNIC', 'Please enter a valid 13-digit guardian CNIC.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiService.registerStudentAdminFlow({
        fullName: fullName.trim(),
        fatherName: fatherName.trim(),
        dob: dob.trim() || undefined,
        gender,
        bFormNo: bFormNo.trim() || undefined,
        classId: selectedClassId,
        status: 'Enrolled',
        parentName: (parentName.trim() || fatherName.trim()),
        parentPhone: parentPhone.trim(),
        parentCnic: parentCnic.trim(),
        parentAddress: parentAddress.trim() || undefined,
        parentPassword: parentPassword.trim() || 'password123',
      });

      if (res.success && res.student) {
        Alert.alert(
          'Student Enrolled Successfully!',
          `Roll Number: ${res.student.rollNo || 'MMS-2026'}\n\nParent Portal Credentials:\nPhone: ${parentPhone}\nPassword: ${parentPassword}\n\nPlease note down credentials for parent portal login.`,
          [{ text: 'View Students List', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Registration Error', res.message || 'Could not enroll student.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Network error while enrolling student.');
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
          <Text style={styles.headerTitle}>New Student Admission</Text>
          <Text style={styles.headerSubtitle}>طالب علم کا باقاعدہ داخلہ</Text>
        </View>

        <TouchableOpacity style={styles.prefillBtn} onPress={handleDemoFill}>
          <Text style={styles.prefillBtnText}>⚡ Demo Fill</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Section 1: Student Details */}
          <View style={styles.card}>
            <Text style={styles.sectionHeading}>1. TALIB-E-ILM INFORMATION (معلوماتِ طالب علم)</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Student Full Name (پورا نام) <Text style={styles.req}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Muhammad Abdullah"
                placeholderTextColor="#94a3b8"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Father Name (والد کا نام) <Text style={styles.req}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Abdul Rehman"
                placeholderTextColor="#94a3b8"
                value={fatherName}
                onChangeText={setFatherName}
              />
            </View>

            {/* Gender Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender (جنس)</Text>
              <View style={styles.genderRow}>
                <TouchableOpacity
                  style={[styles.genderBtn, gender === 'Male' && styles.genderBtnActive]}
                  onPress={() => setGender('Male')}
                >
                  <Text style={[styles.genderText, gender === 'Male' && styles.genderTextActive]}>
                    👦 Male (طالب علم)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.genderBtn, gender === 'Female' && styles.genderBtnActive]}
                  onPress={() => setGender('Female')}
                >
                  <Text style={[styles.genderText, gender === 'Female' && styles.genderTextActive]}>
                    👧 Female (طالبہ)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* B-Form & DOB Row */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>B-Form / CNIC</Text>
                <TextInput
                  style={styles.input}
                  placeholder="XXXXX-XXXXXXX-X"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={bFormNo}
                  onChangeText={handleBFormChange}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Date of Birth</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#94a3b8"
                  value={dob}
                  onChangeText={setDob}
                />
              </View>
            </View>

            {/* Class Assignment */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Assign Class / Darja (شعبہ / درجہ) <Text style={styles.req}>*</Text>
              </Text>
              {loadingClasses ? (
                <ActivityIndicator size="small" color="#059669" />
              ) : classes.length === 0 ? (
                <Text style={styles.hint}>No active classes found. Please create a class first.</Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.classesScroll}>
                  {classes.map((c) => {
                    const isSelected = selectedClassId === c._id;
                    return (
                      <TouchableOpacity
                        key={c._id || c.name}
                        style={[styles.classChip, isSelected && styles.classChipSelected]}
                        onPress={() => setSelectedClassId(c._id || null)}
                      >
                        <Text style={styles.classChipIcon}>🏛️</Text>
                        <Text
                          style={[styles.classChipTitle, isSelected && styles.classChipTitleSelected]}
                          numberOfLines={1}
                        >
                          {c.name}
                        </Text>
                        <Text style={styles.classChipSub}>Sec {c.section} • Rm {c.roomNumber || 'N/A'}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          </View>

          {/* Section 2: Parent / Guardian Details */}
          <View style={[styles.card, { marginTop: 16 }]}>
            <Text style={styles.sectionHeading}>2. WALID / GUARDIAN LINKING (والد / سرپرست)</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Guardian Name (نامِ سرپرست)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Abdul Rehman"
                placeholderTextColor="#94a3b8"
                value={parentName}
                onChangeText={setParentName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Guardian Mobile Phone <Text style={styles.req}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="0300-1234567"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                value={parentPhone}
                onChangeText={handleParentPhoneChange}
              />
              <Text style={styles.hint}>Used for SMS reports & parent portal sign in</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Guardian CNIC Number <Text style={styles.req}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="XXXXX-XXXXXXX-X"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={parentCnic}
                onChangeText={handleParentCnicChange}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Residential Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Sector 5-A, North Nazimabad, Karachi"
                placeholderTextColor="#94a3b8"
                value={parentAddress}
                onChangeText={setParentAddress}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Initial Portal Password</Text>
              <TextInput
                style={styles.input}
                placeholder="password123"
                placeholderTextColor="#94a3b8"
                value={parentPassword}
                onChangeText={setParentPassword}
              />
              <Text style={styles.hint}>Guardian will use this password to access the MMS Parent App</Text>
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
              <Text style={styles.submitBtnText}>✓ Confirm Admission & Generate Roll No</Text>
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
  row: {
    flexDirection: 'row',
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
  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  genderBtnActive: {
    backgroundColor: '#d1fae5',
    borderColor: '#059669',
  },
  genderText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  genderTextActive: {
    color: '#065f46',
    fontWeight: 'bold',
  },
  classesScroll: {
    paddingVertical: 4,
  },
  classChip: {
    width: 150,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 10,
    marginRight: 8,
  },
  classChipSelected: {
    backgroundColor: '#ecfdf5',
    borderColor: '#059669',
    borderWidth: 2,
  },
  classChipIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  classChipTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  classChipTitleSelected: {
    color: '#065f46',
  },
  classChipSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  submitBtn: {
    marginTop: 24,
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
