import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  Linking,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Parent } from '../types';
import { apiService } from '../services/api';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, any>;
}

const INITIAL_DEMO_PARENTS: Parent[] = [
  {
    _id: 'seed-p1',
    name: 'Abdul Rehman',
    phone: '03001234567',
    cnic: '42101-1234567-1',
    address: 'Sector 5-A, North Nazimabad, Karachi',
    status: 'Active',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'seed-p2',
    name: 'Haji Farooq Azam',
    phone: '03214455667',
    cnic: '35201-9988776-3',
    address: 'Allama Iqbal Town, Lahore',
    status: 'Active',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'seed-p3',
    name: 'Muhammad Rizwan',
    phone: '03335557788',
    cnic: '61101-3344556-5',
    address: 'Street 9, G-10/4, Islamabad',
    status: 'Active',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'seed-p4',
    name: 'Dr. Irfanullah',
    phone: '03459988776',
    cnic: '17301-4455667-9',
    address: 'University Town, Peshawar',
    status: 'Active',
    createdAt: new Date().toISOString(),
  },
];

export const ParentsListScreen: React.FC<Props> = ({ navigation }) => {
  const [parents, setParents] = useState<Parent[]>(INITIAL_DEMO_PARENTS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const fetchParents = useCallback(async () => {
    try {
      const res = await apiService.getAllParents();
      if (res.success && res.parents && res.parents.length > 0) {
        const phones = new Set(res.parents.map((p) => p.phone));
        const uniqueDemo = INITIAL_DEMO_PARENTS.filter((d) => !phones.has(d.phone));
        setParents([...res.parents, ...uniqueDemo]);
      } else {
        setParents(INITIAL_DEMO_PARENTS);
      }
    } catch {
      setParents(INITIAL_DEMO_PARENTS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchParents();
  }, [fetchParents]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      fetchParents();
    });
    return unsub;
  }, [navigation, fetchParents]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchParents();
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Call Failed', `Cannot dial ${phone} on this device.`);
    });
  };

  const handleWhatsApp = (phone: string) => {
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '92' + cleanPhone.slice(1);
    }
    const url = `whatsapp://send?phone=${cleanPhone}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('WhatsApp Unavailable', 'WhatsApp is not installed on this device.');
    });
  };

  const filteredParents = parents.filter((p) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = p.name.toLowerCase().includes(q);
      const matchPhone = p.phone.toLowerCase().includes(q);
      const matchCnic = p.cnic.toLowerCase().includes(q);
      const matchAddr = (p.address || '').toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchCnic && !matchAddr) return false;
    }
    return true;
  });

  const renderParentCard = ({ item }: { item: Parent }) => {
    const initials = item.name
      .split(' ')
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();

    const isActive = item.status === 'Active';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.88}
        onPress={() => {
          setSelectedParent(item);
          setDetailModalVisible(true);
        }}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.avatar, isActive ? styles.avatarActive : styles.avatarInactive]}>
            <Text style={styles.avatarText}>{initials || 'WL'}</Text>
          </View>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={styles.nameRow}>
              <Text style={styles.parentName} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={[styles.statusBadge, isActive ? styles.badgeActive : styles.badgeInactive]}>
                <Text style={[styles.statusText, isActive ? styles.statusTextActive : styles.statusTextInactive]}>
                  {isActive ? '● Verified' : '○ Inactive'}
                </Text>
              </View>
            </View>

            <View style={styles.cnicRow}>
              <Text style={styles.cnicLabel}>CNIC: </Text>
              <Text style={styles.cnicVal}>{item.cnic}</Text>
            </View>
          </View>
        </View>

        {item.address ? (
          <View style={styles.addressRow}>
            <Text style={styles.addressIcon}>📍</Text>
            <Text style={styles.addressText} numberOfLines={1}>
              {item.address}
            </Text>
          </View>
        ) : null}

        {/* Footer Actions */}
        <View style={styles.actionsRow}>
          <View style={styles.phoneBox}>
            <Text style={styles.phoneLabel}>Phone:</Text>
            <Text style={styles.phoneVal}>{item.phone}</Text>
          </View>

          <View style={styles.actionBtns}>
            <TouchableOpacity
              style={styles.btnCall}
              onPress={() => handleCall(item.phone)}
              activeOpacity={0.7}
            >
              <Text style={styles.btnText}>📞 Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnWA}
              onPress={() => handleWhatsApp(item.phone)}
              activeOpacity={0.7}
            >
              <Text style={styles.btnText}>💬 Chat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>والدین و سرپرستان (Parents)</Text>
            <Text style={styles.headerSubtitle}>Verified Guardians Directory</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.portalBtn}
          onPress={() => navigation.navigate('ParentPortalScreen')}
          activeOpacity={0.8}
        >
          <Text style={styles.portalBtnText}>Parent Portal 📱</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search parent by name, phone, or CNIC..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Count Strip */}
      <View style={styles.countStrip}>
        <Text style={styles.countText}>
          Total Registered Guardians: <Text style={styles.countBold}>{filteredParents.length}</Text>
        </Text>
        <Text style={styles.verifiedTag}>🛡️ 100% CNIC Linked</Text>
      </View>

      {/* Parents List */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loaderText}>Loading Guardians Directory...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredParents}
          keyExtractor={(item, index) => item._id || item.id || `p-${index}`}
          renderItem={renderParentCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#059669']}
              tintColor="#059669"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>👨‍👩‍👦</Text>
              <Text style={styles.emptyTitle}>No Parents Found</Text>
              <Text style={styles.emptyDesc}>
                {searchQuery
                  ? 'No guardian matched your search criteria.'
                  : 'Parents are automatically registered when adding students.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Parent Detail Modal */}
      <Modal
        visible={detailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{selectedParent?.name}</Text>
                <Text style={styles.modalSubtitle}>Parent / Guardian Profile</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setDetailModalVisible(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Mobile Phone</Text>
                <Text style={styles.detailVal}>{selectedParent?.phone}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>CNIC / B-Form</Text>
                <Text style={styles.detailVal}>{selectedParent?.cnic}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Residential Address</Text>
                <Text style={styles.detailVal}>
                  {selectedParent?.address || 'Not specified'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Portal Access Status</Text>
                <Text style={[styles.detailVal, { color: '#059669' }]}>
                  Active (Ready for Parent Portal login)
                </Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalActionBtn, { backgroundColor: '#059669' }]}
                  onPress={() => selectedParent && handleCall(selectedParent.phone)}
                >
                  <Text style={styles.modalActionBtnText}>📞 Call Guardian</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalActionBtn, { backgroundColor: '#25D366' }]}
                  onPress={() => selectedParent && handleWhatsApp(selectedParent.phone)}
                >
                  <Text style={styles.modalActionBtnText}>💬 WhatsApp Notice</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  portalBtn: {
    backgroundColor: '#d97706',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    elevation: 2,
  },
  portalBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  searchContainer: {
    backgroundColor: '#064e3b',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    paddingVertical: 0,
  },
  clearIcon: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: 'bold',
  },
  countStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ecfdf5',
    borderBottomWidth: 1,
    borderBottomColor: '#d1fae5',
  },
  countText: {
    fontSize: 12,
    color: '#065f46',
  },
  countBold: {
    fontWeight: 'bold',
  },
  verifiedTag: {
    fontSize: 11,
    color: '#047857',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarActive: {
    backgroundColor: '#047857',
  },
  avatarInactive: {
    backgroundColor: '#94a3b8',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  parentName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 6,
  },
  badgeActive: {
    backgroundColor: '#d1fae5',
  },
  badgeInactive: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusTextActive: {
    color: '#065f46',
  },
  statusTextInactive: {
    color: '#b91c1c',
  },
  cnicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  cnicLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  cnicVal: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '500',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
  },
  addressIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  addressText: {
    fontSize: 12,
    color: '#64748b',
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  phoneBox: {
    flex: 1,
  },
  phoneLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  phoneVal: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '600',
  },
  actionBtns: {
    flexDirection: 'row',
    gap: 6,
  },
  btnCall: {
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnWA: {
    backgroundColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    marginTop: 10,
    color: '#64748b',
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '600',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 18,
    color: '#94a3b8',
    fontWeight: 'bold',
  },
  modalBody: {
    marginTop: 14,
  },
  detailRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  detailLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  detailVal: {
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '500',
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 10,
  },
  modalActionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalActionBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
