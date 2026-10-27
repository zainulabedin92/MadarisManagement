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
import { RootStackParamList, Teacher } from '../types';
import { apiService } from '../services/api';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, any>;
}

const CLASS_PRESETS = [
  'Shoba-e-Tahfeez (Hifz) - Batch C',
  'Dars-e-Nizami (Sanwiya Aama)',
  'Dars-e-Nizami (Aalia)',
  'Tajweed & Qiraat - Advanced',
  'Nazra Quran - Primary',
];

const SECTIONS = ['A', 'B', 'C', 'Banat (Girls)', 'Morning'];

export const ClassAddScreen: React.FC<Props> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [section, setSection] = useState('A');
  const [roomNumber, setRoomNumber] = useState('');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadTeachers() {
      try {
        const res = await apiService.getTeachers({ status: 'Active' });
        if (res.success && res.teachers) {
          setTeachers(res.teachers);
          if (res.teachers.length > 0) {
            setSelectedTeacherId(res.teachers[0]._id || null);
          }
        }
      } catch {
        // Fallback
      } finally {
        setLoadingTeachers(false);
      }
    }
    loadTeachers();
  }, []);

  const handleDemoFill = () => {
    const randomBatch = String.fromCharCode(65 + Math.floor(Math.random() * 5));
    const randomRoom = Math.floor(100 + Math.random() * 200);
    setName(`Hifz-ul-Quran - Batch ${randomBatch}`);
    setSection(randomBatch);
    setRoomNumber(`${randomRoom}`);
    setAcademicYear('2026-2027');
    setStatus('Active');
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter class or darja name.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiService.createClass({
        name: name.trim(),
        section: section.trim() || 'A',
        roomNumber: roomNumber.trim() || undefined,
        classTeacher: selectedTeacherId || null,
        academicYear: academicYear.trim() || '2026-2027',
        status,
      });

      if (res.success) {
        Alert.alert(
          'Class Created!',
          `Darja "${name}" (Section ${section}) has been registered successfully.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Failed to Create Class', res.message || 'Could not save class.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Network error while creating class.');
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
          <Text style={styles.headerTitle}>Create New Class</Text>
          <Text style={styles.headerSubtitle}>درجہ / شعبہ کی نئی تشکیل</Text>
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
          <View style={styles.card}>
            <Text style={styles.sectionHeading}>CLASSROOM SPECIFICATION (تفصیلاتِ درجہ)</Text>

            {/* Quick Presets */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Suggested Darjat Presets</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetScroll}>
                {CLASS_PRESETS.map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    style={[styles.presetChip, name === preset && styles.presetChipActive]}
                    onPress={() => setName(preset)}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        name === preset && styles.presetChipTextActive,
                      ]}
                    >
                      {preset}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Class Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Class Name <Text style={styles.req}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Shoba-e-Tahfeez - Batch A"
                placeholderTextColor="#94a3b8"
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Section Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Section</Text>
              <View style={styles.sectionsRow}>
                {SECTIONS.map((sec) => {
                  const isSelected = section === sec;
                  return (
                    <TouchableOpacity
                      key={sec}
                      style={[styles.sectionBtn, isSelected && styles.sectionBtnActive]}
                      onPress={() => setSection(sec)}
                    >
                      <Text
                        style={[
                          styles.sectionBtnText,
                          isSelected && styles.sectionBtnTextActive,
                        ]}
                      >
                        {sec}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Room Number & Academic Year Row */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Room Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 104"
                  placeholderTextColor="#94a3b8"
                  value={roomNumber}
                  onChangeText={setRoomNumber}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.label}>Academic Year</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2026-2027"
                  placeholderTextColor="#94a3b8"
                  value={academicYear}
                  onChangeText={setAcademicYear}
                />
              </View>
            </View>

            {/* Assigned Teacher Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Assign Class Teacher (نگران استاذ)</Text>
              {loadingTeachers ? (
                <ActivityIndicator size="small" color="#059669" />
              ) : teachers.length === 0 ? (
                <Text style={styles.hint}>No active teachers found. Register teachers first.</Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.teachersScroll}>
                  {teachers.map((t) => {
                    const isSelected = selectedTeacherId === t._id;
                    return (
                      <TouchableOpacity
                        key={t._id || t.name}
                        style={[styles.teacherCard, isSelected && styles.teacherCardSelected]}
                        onPress={() => setSelectedTeacherId(t._id || null)}
                      >
                        <Text style={styles.teacherIcon}>👳‍♂️</Text>
                        <Text
                          style={[
                            styles.teacherCardName,
                            isSelected && styles.teacherCardNameSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {t.name}
                        </Text>
                        <Text style={styles.teacherCardRole}>{t.role}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {/* Status */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Class Status</Text>
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
                    ● Active Class
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
                    ○ Inactive / Archive
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
              <Text style={styles.submitBtnText}>✓ Save & Activate Class</Text>
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
  presetScroll: {
    marginBottom: 4,
  },
  presetChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  presetChipActive: {
    backgroundColor: '#d1fae5',
    borderColor: '#059669',
  },
  presetChipText: {
    fontSize: 11,
    color: '#475569',
  },
  presetChipTextActive: {
    color: '#065f46',
    fontWeight: 'bold',
  },
  sectionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  sectionBtnActive: {
    backgroundColor: '#059669',
    borderColor: '#047857',
  },
  sectionBtnText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  sectionBtnTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  teachersScroll: {
    paddingVertical: 4,
  },
  teacherCard: {
    width: 140,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 10,
    marginRight: 8,
    alignItems: 'center',
  },
  teacherCardSelected: {
    backgroundColor: '#ecfdf5',
    borderColor: '#059669',
    borderWidth: 2,
  },
  teacherIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  teacherCardName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
  },
  teacherCardNameSelected: {
    color: '#065f46',
  },
  teacherCardRole: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'center',
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
