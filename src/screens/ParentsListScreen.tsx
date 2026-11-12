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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Parent } from '../types';
import { apiService } from '../services/api';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, any>;
}

export const ParentsListScreen: React.FC<Props> = ({ navigation }) => {
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParent, setSelectedParent] = useState<Parent | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // 3-dots Menu & Edit Parent State
  const [menuParent, setMenuParent] = useState<Parent | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [editParent, setEditParent] = useState<Parent | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCnic, setEditCnic] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editStatus, setEditStatus] = useState('Active');
  const [editPin, setEditPin] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchParents = useCallback(async () => {
    try {
      const res = await apiService.getAllParents();
      if (res.success && Array.isArray(res.parents)) {
        setParents(res.parents);
      } else {
        setParents([]);
      }
    } catch {
      setParents([]);
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

  const handleOpenMenu = (parent: Parent) => {
    setMenuParent(parent);
    setMenuVisible(true);
  };

  const handleOpenEdit = (parent: Parent) => {
    setMenuVisible(false);
    setEditParent(parent);
    setEditName(parent.name || '');
    setEditPhone(parent.phone || '');
    setEditCnic(parent.cnic || '');
    setEditAddress(parent.address || '');
    setEditStatus(parent.status || 'Active');
    setEditPin('');
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editParent) return;
    if (!editName.trim() || !editPhone.trim() || !editCnic.trim()) {
      Alert.alert('Required Fields', 'Parent Name, Phone, and CNIC are required.');
      return;
    }

    const targetId = editParent._id || editParent.id;
    if (!targetId) {
      Alert.alert('Error', 'Invalid parent identifier.');
      return;
    }

    setActionLoading(true);
    const updatedData: Partial<Parent> & { password?: string; pin?: string } = {
      name: editName.trim(),
      phone: editPhone.trim(),
      cnic: editCnic.trim(),
      address: editAddress.trim() || undefined,
      status: editStatus,
    };
    if (editPin.trim()) {
      updatedData.pin = editPin.trim();
      updatedData.password = editPin.trim();
    }

    try {
      const res = await apiService.updateParent(targetId, updatedData);
      setActionLoading(false);
      if (res.success) {
        Alert.alert('Success', 'Parent profile updated successfully.');
        setEditModalVisible(false);
        setParents((prev) =>
          prev.map((p) => ((p._id || p.id) === targetId ? { ...p, ...updatedData } : p))
        );
      } else {
        Alert.alert('Update Failed', res.message || 'Could not update parent.');
      }
    } catch (err: any) {
      setActionLoading(false);
      Alert.alert('Error', err.message || 'Failed to update parent.');
    }
  };

  const handleDeleteParent = (parent: Parent) => {
    setMenuVisible(false);
    const targetId = parent._id || parent.id;
    const parentName = parent.name || 'this guardian';

    Alert.alert(
      'Delete Parent Record?',
      `Are you sure you want to delete "${parentName}"? Note: Parents with active enrolled children cannot be deleted until those children are re-assigned or removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!targetId) return;
            try {
              setActionLoading(true);
              const res = await apiService.deleteParent(targetId);
              setActionLoading(false);
              if (res.success) {
                Alert.alert('Deleted', `Parent "${parentName}" deleted successfully.`);
                setParents((prev) => prev.filter((p) => (p._id || p.id) !== targetId));
              } else {
                Alert.alert('Delete Blocked', res.message || 'Could not delete parent.');
              }
            } catch (err: any) {
              setActionLoading(false);
              Alert.alert('Error', err.message || 'Failed to delete parent.');
            }
          },
        },
      ]
    );
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
              {/* 3 dots menu button */}
              <TouchableOpacity
                style={styles.moreOptionsBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                onPress={() => handleOpenMenu(item)}
              >
                <Text style={styles.moreOptionsIcon}>⋮</Text>
              </TouchableOpacity>
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

      {/* 3-DOTS ACTION SHEET MODAL */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.actionSheetOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.actionSheetContent}>
            <View style={styles.actionSheetHeader}>
              <View style={styles.actionSheetIndicator} />
              <Text style={styles.actionSheetTitle} numberOfLines={1}>
                {menuParent?.name}
              </Text>
              <Text style={styles.actionSheetSub}>
                CNIC: {menuParent?.cnic} • {menuParent?.phone}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.actionSheetBtn}
              activeOpacity={0.7}
              onPress={() => {
                if (menuParent) handleOpenEdit(menuParent);
              }}
            >
              <Text style={styles.actionSheetBtnIcon}>✏️</Text>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.actionSheetBtnText}>Edit Guardian (سرپرست کی معلومات تبدیل کریں)</Text>
                <Text style={styles.actionSheetBtnDesc}>Update name, phone, CNIC, address, or 4-digit PIN</Text>
              </View>
              <Text style={styles.actionSheetArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionSheetBtn, styles.actionSheetBtnDanger]}
              activeOpacity={0.7}
              onPress={() => {
                if (menuParent) handleDeleteParent(menuParent);
              }}
            >
              <Text style={styles.actionSheetBtnIcon}>🗑️</Text>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.actionSheetBtnText, { color: '#DC2626' }]}>
                  Delete Parent (حذف کریں)
                </Text>
                <Text style={styles.actionSheetBtnDesc}>Remove profile (only if no students linked)</Text>
              </View>
              <Text style={[styles.actionSheetArrow, { color: '#DC2626' }]}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionSheetCancelBtn}
              activeOpacity={0.8}
              onPress={() => setMenuVisible(false)}
            >
              <Text style={styles.actionSheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* EDIT PARENT MODAL */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Edit Guardian Profile</Text>
                <Text style={styles.modalSubtitle}>سرپرست کی معلومات اور ۴ ہندسی پن تبدیل کریں</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ maxHeight: 460, paddingHorizontal: 16 }}
              contentContainerStyle={{ paddingVertical: 10 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.fieldLabel}>Guardian Full Name *</Text>
              <TextInput
                style={styles.formInput}
                value={editName}
                onChangeText={setEditName}
                placeholder="e.g. Abdul Rehman"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.fieldLabel}>Mobile Phone *</Text>
              <TextInput
                style={styles.formInput}
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
                placeholder="0300-1234567"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.fieldLabel}>CNIC Number *</Text>
              <TextInput
                style={styles.formInput}
                value={editCnic}
                onChangeText={setEditCnic}
                placeholder="42101-1234567-1"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.fieldLabel}>Residential Address</Text>
              <TextInput
                style={styles.formInput}
                value={editAddress}
                onChangeText={setEditAddress}
                placeholder="e.g. Sector 5-A, North Nazimabad, Karachi"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.fieldLabel}>Reset 4-Digit Portal PIN (Optional)</Text>
              <TextInput
                style={styles.formInput}
                value={editPin}
                onChangeText={setEditPin}
                secureTextEntry
                keyboardType="numeric"
                maxLength={4}
                placeholder="Leave blank to keep existing PIN (e.g. 1234)"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.fieldLabel}>Account Status</Text>
              <View style={styles.statusToggleRow}>
                <TouchableOpacity
                  style={[styles.statusToggleBtn, editStatus === 'Active' && styles.statusToggleBtnActive]}
                  onPress={() => setEditStatus('Active')}
                >
                  <Text style={[styles.statusToggleText, editStatus === 'Active' && styles.statusToggleTextActive]}>
                    ● Active
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.statusToggleBtn, editStatus === 'Inactive' && styles.statusToggleBtnInactive]}
                  onPress={() => setEditStatus('Inactive')}
                >
                  <Text style={[styles.statusToggleText, editStatus === 'Inactive' && styles.statusToggleTextInactive]}>
                    ○ Inactive
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 10, padding: 16 }}>
              <TouchableOpacity
                style={[styles.modalActionBtn, { flex: 1, backgroundColor: '#E2E8F0' }]}
                onPress={() => setEditModalVisible(false)}
                disabled={actionLoading}
              >
                <Text style={[styles.modalActionBtnText, { color: '#475569' }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalActionBtn, { flex: 2, backgroundColor: '#059669' }]}
                onPress={handleSaveEdit}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.modalActionBtnText}>💾 Save Guardian</Text>
                )}
              </TouchableOpacity>
            </View>
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
  moreOptionsBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  moreOptionsIcon: {
    fontSize: 18,
    fontWeight: '900',
    color: '#475569',
    lineHeight: 20,
  },
  actionSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  actionSheetContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 32 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  actionSheetHeader: {
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  actionSheetIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    marginBottom: 10,
  },
  actionSheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  actionSheetSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  actionSheetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  actionSheetBtnDanger: {
    borderBottomColor: '#FEE2E2',
  },
  actionSheetBtnIcon: {
    fontSize: 20,
  },
  actionSheetBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  actionSheetBtnDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  actionSheetArrow: {
    fontSize: 20,
    color: '#94A3B8',
    fontWeight: '600',
  },
  actionSheetCancelBtn: {
    marginTop: 14,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionSheetCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginTop: 8,
    marginBottom: 4,
  },
  formInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: '#0F172A',
  },
  statusToggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  statusToggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  statusToggleBtnActive: {
    backgroundColor: '#D1FAE5',
    borderColor: '#059669',
  },
  statusToggleBtnInactive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#DC2626',
  },
  statusToggleText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  statusToggleTextActive: {
    color: '#065F46',
    fontWeight: 'bold',
  },
  statusToggleTextInactive: {
    color: '#B91C1C',
    fontWeight: 'bold',
  },
});
