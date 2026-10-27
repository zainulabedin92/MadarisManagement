import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Student } from '../types';
import { CustomButton } from '../components/CustomButton';
import { apiService } from '../services/api';

type AdminPendingPageNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'AdminPendingPage'
>;

interface Props {
  navigation: AdminPendingPageNavigationProp;
}

export const AdminPendingPage: React.FC<Props> = ({ navigation }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const fetchPendingStudents = async () => {
    try {
      const res = await apiService.getPendingStudents();
      setLoading(false);
      setRefreshing(false);

      if (res.success) {
        const fetchedList = res.students || res.data || [];
        setStudents(Array.isArray(fetchedList) ? fetchedList : []);
      } else {
        setStudents([]);
        Alert.alert(
          'Notice',
          res.message || 'Unable to load pending registrations.'
        );
      }
    } catch (err: any) {
      setLoading(false);
      setRefreshing(false);
      setStudents([]);
    }
  };

  useEffect(() => {
    fetchPendingStudents();
  }, []);

  const handleApprove = async (id: string, name: string) => {
    Alert.alert(
      'Confirm Approval',
      `Are you sure you want to approve registration for ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            setApprovingId(id);
            const res = await apiService.approveStudent(id);
            setApprovingId(null);

            if (res.success) {
              Alert.alert('Approved! ✅', `${name}'s enrollment is now approved.`);
              fetchPendingStudents();
            } else {
              Alert.alert('Approval Failed', res.message || 'Failed to approve student');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Pending Approvals</Text>
          <Text style={styles.headerSub}>Admin Portal</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchPendingStudents}>
          <Text style={styles.refreshIcon}>🔄</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Fetching pending registrations...</Text>
        </View>
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item, index) => item._id || item.id || String(index)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchPendingStudents();
              }}
              colors={['#059669']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No Pending Registrations</Text>
              <Text style={styles.emptySub}>
                All student registrations have been reviewed or no pending submissions exist.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const studentId = item._id || item.id || '';
            const fullName = `${item.firstName} ${item.lastName}`.trim();
            const isApproving = approvingId === studentId;

            return (
              <View style={styles.studentCard}>
                <View style={styles.cardHeader}>
                  {item.picture ? (
                    <Image
                      source={{ uri: item.picture }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarInitial}>
                        {item.firstName?.[0] || 'S'}
                      </Text>
                    </View>
                  )}

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.studentName}>{fullName}</Text>
                    <Text style={styles.fatherName}>Father: {item.fatherName}</Text>
                    <Text style={styles.programBadge}>
                      {item.enrollmentProgram || 'Madaris Program'}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailsGrid}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>B-Form / CNIC:</Text>
                    <Text style={styles.detailValue}>{item.cnic}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Guardian Mobile:</Text>
                    <Text style={styles.detailValue}>{item.guardianMobile}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Guardian Email:</Text>
                    <Text style={styles.detailValue}>{item.guardianEmail}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>City / Address:</Text>
                    <Text style={styles.detailValue}>
                      {item.city} - {item.address}
                    </Text>
                  </View>
                </View>

                <CustomButton
                  title="Approve Student"
                  onPress={() => handleApprove(studentId, fullName)}
                  loading={isApproving}
                  style={styles.approveBtn}
                />
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    marginRight: 14,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  headerSub: {
    fontSize: 12,
    color: '#6B7280',
  },
  refreshBtn: {
    padding: 6,
  },
  refreshIcon: {
    fontSize: 20,
  },
  listContent: {
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#4B5563',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
  },
  emptySub: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 260,
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 14,
    marginBottom: 14,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: '#059669',
  },
  avatarPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#A7F3D0',
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '800',
    color: '#059669',
  },
  studentName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },
  fatherName: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  programBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    color: '#D97706',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  detailsGrid: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    width: 120,
  },
  detailValue: {
    fontSize: 13,
    color: '#1F2937',
    flex: 1,
  },
  approveBtn: {
    height: 44,
  },
});
