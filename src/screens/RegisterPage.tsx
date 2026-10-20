import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, RegisterFormData } from '../types';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { DropdownSelect } from '../components/DropdownSelect';
import { ImagePickerModal } from '../components/ImagePickerModal';
import { apiService } from '../services/api';

type RegisterPageNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'RegisterPage'
>;

interface Props {
  navigation: RegisterPageNavigationProp;
}

const CITY_OPTIONS = [
  { label: 'Islamabad', value: 'Islamabad' },
  { label: 'Rawalpindi', value: 'Rawalpindi' },
  { label: 'Lahore', value: 'Lahore' },
  { label: 'Karachi', value: 'Karachi' },
  { label: 'Peshawar', value: 'Peshawar' },
  { label: 'Quetta', value: 'Quetta' },
  { label: 'Multan', value: 'Multan' },
  { label: 'Faisalabad', value: 'Faisalabad' },
  { label: 'Gujranwala', value: 'Gujranwala' },
  { label: 'Sialkot', value: 'Sialkot' },
  { label: 'Hyderabad', value: 'Hyderabad' },
  { label: 'Other', value: 'Other' },
];

const PROGRAM_OPTIONS = [
  { label: 'Hifz-ul-Quran (Memorisaton)', value: 'Hifz-ul-Quran' },
  { label: 'Nazra Quran (Recitation)', value: 'Nazra Quran' },
  { label: 'Dars-e-Nizami (Islamic Scholarship)', value: 'Dars-e-Nizami' },
  { label: 'Tajweed & Qirat', value: 'Tajweed & Qirat' },
  { label: 'Aalim Course', value: 'Aalim Course' },
  { label: 'Hifz & School Dual Program', value: 'Hifz & School Combo' },
];

export const RegisterPage: React.FC<Props> = ({ navigation }) => {
  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: '',
    lastName: '',
    fatherName: '',
    cnic: '',
    guardianMobile: '',
    guardianEmail: '',
    pin: '',
    confirmPin: '',
    address: '',
    city: 'Islamabad',
    enrollmentProgram: 'Hifz-ul-Quran',
    picture: null,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({});
  const [loading, setLoading] = useState(false);

  const updateField = (field: keyof RegisterFormData, value: string | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // CNIC Mask / Auto-formatter (12345-6789012-3)
  const handleCnicChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    let formatted = cleaned;
    if (cleaned.length > 5 && cleaned.length <= 12) {
      formatted = `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
    } else if (cleaned.length > 12) {
      formatted = `${cleaned.slice(0, 5)}-${cleaned.slice(5, 12)}-${cleaned.slice(12, 13)}`;
    }
    updateField('cnic', formatted);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof RegisterFormData, string>> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First Name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last Name is required';
    }
    if (!formData.fatherName.trim()) {
      newErrors.fatherName = "Father's Name is required";
    }

    // B-Form / CNIC Validation
    const rawCnic = formData.cnic.replace(/\D/g, '');
    if (!formData.cnic.trim()) {
      newErrors.cnic = 'B-Form / CNIC is required';
    } else if (rawCnic.length !== 13) {
      newErrors.cnic = 'CNIC / B-Form must be 13 digits (e.g. 12345-6789012-3)';
    }

    // Guardian Mobile
    const rawMobile = formData.guardianMobile.replace(/\D/g, '');
    if (!formData.guardianMobile.trim()) {
      newErrors.guardianMobile = 'Guardian Mobile No is required';
    } else if (rawMobile.length < 10) {
      newErrors.guardianMobile = 'Please enter a valid mobile number (min 10 digits)';
    }

    // Guardian Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.guardianEmail.trim()) {
      newErrors.guardianEmail = 'Guardian Email is required';
    } else if (!emailRegex.test(formData.guardianEmail.trim())) {
      newErrors.guardianEmail = 'Please enter a valid email address';
    }

    // 4-Digit PIN Validation
    if (!formData.pin) {
      newErrors.pin = '4-Digit PIN is required';
    } else if (!/^\d{4}$/.test(formData.pin)) {
      newErrors.pin = 'PIN must be exactly 4 numeric digits';
    }

    // Confirm PIN Validation
    if (!formData.confirmPin) {
      newErrors.confirmPin = 'Please confirm your 4-Digit PIN';
    } else if (formData.confirmPin !== formData.pin) {
      newErrors.confirmPin = 'PIN and Confirm PIN do not match';
    }

    // Address
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    // City & Program
    if (!formData.city) {
      newErrors.city = 'City selection is required';
    }
    if (!formData.enrollmentProgram) {
      newErrors.enrollmentProgram = 'Enrollment Program selection is required';
    }

    // Picture
    if (!formData.picture) {
      newErrors.picture = 'Please upload a student picture';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please correct the highlighted errors in the form.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.register(formData);
      setLoading(false);

      if (response.success) {
        Alert.alert(
          'Registration Successful! 🎉',
          'Student registration submitted successfully. Your 4-digit PIN is set up for app logins.',
          [
            {
              text: 'Login with PIN Now',
              onPress: () => navigation.navigate('LoginPinPage'),
            },
          ]
        );
      } else {
        Alert.alert(
          'Registration Failed',
          response.message || 'Unable to register student. Please check your backend connection.'
        );
      }
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Error', err.message || 'An unexpected error occurred.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Text style={styles.backBtnText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Student Registration</Text>
          </View>

          <Text style={styles.subTitle}>
            Please fill in all student details accurately for Madaris Enrollment.
          </Text>

          {/* Form Fields */}
          <View style={styles.formCard}>
            {/* First Name */}
            <CustomInput
              label="First Name"
              placeholder="e.g. Muhammad"
              value={formData.firstName}
              onChangeText={(txt) => updateField('firstName', txt)}
              error={errors.firstName}
              required
            />

            {/* Last Name */}
            <CustomInput
              label="Last Name"
              placeholder="e.g. Ali"
              value={formData.lastName}
              onChangeText={(txt) => updateField('lastName', txt)}
              error={errors.lastName}
              required
            />

            {/* Father Name */}
            <CustomInput
              label="Father Name"
              placeholder="e.g. Tariq Mahmood"
              value={formData.fatherName}
              onChangeText={(txt) => updateField('fatherName', txt)}
              error={errors.fatherName}
              required
            />

            {/* B-Form / CNIC */}
            <CustomInput
              label="B-Form / CNIC"
              placeholder="e.g. 12345-6789012-3"
              value={formData.cnic}
              onChangeText={handleCnicChange}
              keyboardType="number-pad"
              maxLength={15}
              error={errors.cnic}
              required
            />

            {/* Guardian Mobile No */}
            <CustomInput
              label="Guardian Mobile No"
              placeholder="e.g. 03001234567"
              value={formData.guardianMobile}
              onChangeText={(txt) => updateField('guardianMobile', txt)}
              keyboardType="phone-pad"
              maxLength={15}
              error={errors.guardianMobile}
              required
            />

            {/* Guardian Email */}
            <CustomInput
              label="Guardian Email"
              placeholder="e.g. guardian@example.com"
              value={formData.guardianEmail}
              onChangeText={(txt) => updateField('guardianEmail', txt)}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.guardianEmail}
              required
            />

            {/* 4-Digit PIN */}
            <CustomInput
              label="Pin (4-Digit PIN for App Login)"
              placeholder="Enter 4-digit numeric PIN"
              value={formData.pin}
              onChangeText={(txt) => {
                const numeric = txt.replace(/\D/g, '').slice(0, 4);
                updateField('pin', numeric);
              }}
              keyboardType="number-pad"
              maxLength={4}
              isPin
              error={errors.pin}
              required
            />

            {/* Confirm PIN */}
            <CustomInput
              label="Confirm Pin"
              placeholder="Re-enter 4-digit PIN"
              value={formData.confirmPin}
              onChangeText={(txt) => {
                const numeric = txt.replace(/\D/g, '').slice(0, 4);
                updateField('confirmPin', numeric);
              }}
              keyboardType="number-pad"
              maxLength={4}
              isPin
              error={errors.confirmPin}
              required
            />

            {/* Address */}
            <CustomInput
              label="Address"
              placeholder="Street address, House No, Sector/Area"
              value={formData.address}
              onChangeText={(txt) => updateField('address', txt)}
              multiline
              numberOfLines={3}
              style={{ height: 75, textAlignVertical: 'top' }}
              error={errors.address}
              required
            />

            {/* City */}
            <DropdownSelect
              label="City"
              options={CITY_OPTIONS}
              selectedValue={formData.city}
              onSelect={(val) => updateField('city', val)}
              placeholder="Select City"
              error={errors.city}
              required
            />

            {/* Enrollment Program */}
            <DropdownSelect
              label="Enrollment Program"
              options={PROGRAM_OPTIONS}
              selectedValue={formData.enrollmentProgram}
              onSelect={(val) => updateField('enrollmentProgram', val)}
              placeholder="Select Program"
              error={errors.enrollmentProgram}
              required
            />

            {/* Upload Picture Button */}
            <ImagePickerModal
              imageUri={formData.picture}
              onImageSelected={(img) => updateField('picture', img)}
              error={errors.picture}
            />

            {/* Submit Button */}
            <CustomButton
              title="Submit Registration"
              onPress={handleSubmit}
              loading={loading}
              style={styles.submitBtn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  backBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  subTitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 20,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  submitBtn: {
    marginTop: 10,
  },
});
