import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { SuperAdminDashboard } from './SuperAdminDashboard';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, any>;
  route?: RouteProp<RootStackParamList, any>;
}

const { width } = Dimensions.get('window');

interface QuickActionItem {
  id: string;
  title: string;
  code: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  badgeColor: string;
  action: () => void;
}

export const DashboardScreen: React.FC<Props> = ({ navigation, route }) => {
  const userName = route?.params?.userName || 'Maulana Abdul Rahman';
  const roleTitle = route?.params?.role || 'NAZIM-E-TALEEM PORTAL';

  // If SuperAdmin, render SuperAdminDashboard
  const isSuperAdmin =
    roleTitle?.toLowerCase().includes('superadmin') ||
    roleTitle?.toLowerCase().includes('muhtamim') ||
    route?.params?.role?.toLowerCase() === 'superadmin';

  if (isSuperAdmin) {
    return <SuperAdminDashboard navigation={navigation} route={route} />;
  }

  const [selectedBranch, setSelectedBranch] = useState('Branch 1');
  const [selectedInstitution, setSelectedInstitution] = useState('Jamia Darul Uloom');
  const [branchModalVisible, setBranchModalVisible] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  const branches = [
    { id: '1', name: 'Branch 1 — Markaz Campus', code: 'Branch 1' },
    { id: '2', name: 'Branch 2 — Hifz Academy', code: 'Branch 2' },
    { id: '3', name: 'Branch 3 — Banat (Girls) Campus', code: 'Branch 3' },
  ];

  const quickActions: QuickActionItem[] = [
    {
      id: 'haziri',
      title: 'Mark Haziri',
      code: 'UC-05',
      icon: '☑',
      iconBg: '#D1FAE5',
      iconColor: '#065F46',
      badgeBg: '#E0F2FE',
      badgeColor: '#0369A1',
      action: () => {
        navigation.navigate('AttendanceScreen', { initialTab: 'mark' });
      },
    },
    {
      id: 'sabaq',
      title: 'Sabaq Log',
      code: 'Hifz',
      icon: '📖',
      iconBg: '#FEF3C7',
      iconColor: '#D97706',
      badgeBg: '#FEF3C7',
      badgeColor: '#B45309',
      action: () => {
        Alert.alert('Sabaq Log', 'Opening Daily Sabaq, Sabqi & Manzil tracking ledger.');
      },
    },
    {
      id: 'dakhla',
      title: 'New Dakhla',
      code: 'UC-02',
      icon: '👤+',
      iconBg: '#E0F2FE',
      iconColor: '#0284C7',
      badgeBg: '#F1F5F9',
      badgeColor: '#475569',
      action: () => {
        navigation.navigate('RegisterPage');
      },
    },
    {
      id: 'fee',
      title: 'Fee Wasool',
      code: 'UC-11',
      icon: '💳',
      iconBg: '#FFEDD5',
      iconColor: '#EA580C',
      badgeBg: '#FFEDD5',
      badgeColor: '#C2410C',
      action: () => {
        Alert.alert('Fee Wasool', 'Opening Monthly Mahana Fee Collection & Receipts.');
      },
    },
    {
      id: 'imtihan',
      title: 'Imtihanat',
      code: 'UC-08',
      icon: '📊',
      iconBg: '#F3E8FF',
      iconColor: '#9333EA',
      badgeBg: '#F3E8FF',
      badgeColor: '#7E22CE',
      action: () => {
        Alert.alert('Imtihanat', 'Opening Quarterly & Annual Examination Records.');
      },
    },
    {
      id: 'pending',
      title: 'Dakhla Approvals',
      code: 'Admin',
      icon: '🛡️',
      iconBg: '#DCFCE7',
      iconColor: '#15803D',
      badgeBg: '#DCFCE7',
      badgeColor: '#15803D',
      action: () => {
        navigation.navigate('AdminPendingPage');
      },
    },
  ];

  const prayers = [
    { name: 'Fajr', time: '5:15 AM', active: false },
    { name: 'Dhuhr', time: '1:15 PM', active: false },
    { name: 'Asr', time: '4:45 PM', active: true },
    { name: 'Maghrib', time: '6:28 PM', active: false },
    { name: 'Isha', time: '7:45 PM', active: false },
  ];

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      {/* TOP HEADER BAR */}
      <View style={styles.topHeader}>
        {/* Institution Branding */}
        <TouchableOpacity
          style={styles.institutionSelector}
          activeOpacity={0.8}
          onPress={() => setBranchModalVisible(true)}
        >
          <View style={styles.institutionLogoBox}>
            <Text style={styles.institutionLogoIcon}>🕌</Text>
          </View>

          <View style={styles.institutionTextCol}>
            <View style={styles.institutionTitleRow}>
              <Text style={styles.institutionName} numberOfLines={1}>
                {selectedInstitution}
              </Text>
              <Text style={styles.arrowIcon}>⇅</Text>
            </View>

            {/* Hijri Pill */}
            <View style={styles.hijriPill}>
              <Text style={styles.hijriPillText}>📅 14 Ramadan 1446 AH</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Right Action Icons: Notification Bell & Profile Avatar */}
        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => setNotificationModalVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.bellIcon}>🔔</Text>
            <View style={styles.unreadBadgeDot} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.userAvatarBtn}
            onPress={() => setProfileModalVisible(true)}
            activeOpacity={0.8}
          >
            <View style={styles.userAvatarInner}>
              <Text style={styles.userAvatarIcon}>👤</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* USER WELCOME & BRANCH ROW */}
        <View style={styles.welcomeRow}>
          <View style={styles.welcomeLeft}>
            {/* Nazim-e-Taleem Portal Tag */}
            <View style={styles.portalTagRow}>
              <Text style={styles.portalSealIcon}>✪</Text>
              <Text style={styles.portalTagText}>{roleTitle}</Text>
            </View>

            {/* Main Greeting */}
            <Text style={styles.greetingTitle}>Assalamu Alaikum</Text>
            <Text style={styles.userNameSubtitle}>{userName}</Text>
          </View>

          {/* Branch Selector Chip */}
          <TouchableOpacity
            style={styles.branchChip}
            onPress={() => setBranchModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.branchChipIcon}>🕌</Text>
            <Text style={styles.branchChipText}>{selectedBranch}</Text>
            <Text style={styles.branchChevron}>⌵</Text>
          </TouchableOpacity>
        </View>

        {/* HERO PRAYER & ISLAMIC CALENDAR CARD */}
        <View style={styles.heroCard}>
          {/* Card Top Row */}
          <View style={styles.heroTopRow}>
            <View style={styles.heroDateLeft}>
              <Text style={styles.heroCalIcon}>📅</Text>
              <Text style={styles.heroDateHijri}>14 Ramadan 1446 AH</Text>
            </View>
            <View style={styles.heroDateGregorianPill}>
              <Text style={styles.heroDateGregorianText}>Fri, 14 Mar 2025</Text>
            </View>
          </View>

          {/* Card Divider Line */}
          <View style={styles.heroDivider} />

          {/* Card Bottom Row: Next Jama'at */}
          <View style={styles.heroBottomRow}>
            <View style={styles.prayerLeft}>
              <View style={styles.clockCircle}>
                <Text style={styles.clockEmoji}>🕒</Text>
              </View>
              <View style={styles.prayerInfo}>
                <Text style={styles.nextJamaatLabel}>NEXT JAMA'AT</Text>
                <Text style={styles.nextJamaatTime}>Asr • 4:45 PM</Text>
              </View>
            </View>

            <View style={styles.remainingRight}>
              <Text style={styles.remainingLabel}>Remaining</Text>
              <Text style={styles.remainingCounter}>1h 18m</Text>
            </View>
          </View>
        </View>

        {/* QUICK ACTIONS SECTION */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <Text style={styles.sectionSublabel}>TALEEM & IDARA</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickActionsScroll}
        >
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.actionCard}
              activeOpacity={0.7}
              onPress={action.action}
            >
              <View
                style={[
                  styles.actionIconContainer,
                  { backgroundColor: action.iconBg },
                ]}
              >
                <Text style={[styles.actionIconText, { color: action.iconColor }]}>
                  {action.icon}
                </Text>
              </View>

              <Text style={styles.actionTitle} numberOfLines={1}>
                {action.title}
              </Text>

              <View
                style={[
                  styles.actionBadgePill,
                  { backgroundColor: action.badgeBg },
                ]}
              >
                <Text
                  style={[
                    styles.actionBadgeText,
                    { color: action.badgeColor },
                  ]}
                >
                  {action.code}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* EXECUTIVE METRICS SECTION */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Executive Metrics</Text>
          <View style={styles.liveSummaryRow}>
            <Text style={styles.liveSummaryText}>Live Summary</Text>
            <View style={styles.liveGreenDot} />
          </View>
        </View>

        <View style={styles.metricsGrid}>
          {/* Card 1: Total Talaba */}
          <TouchableOpacity
            style={styles.metricCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('StudentsListScreen')}
          >
            <View style={styles.metricCardTop}>
              <View style={[styles.metricIconBox, { backgroundColor: '#D1FAE5' }]}>
                <Text style={styles.metricIconEmoji}>🎓</Text>
              </View>
              <View style={[styles.metricDeltaBadge, { backgroundColor: '#D1FAE5' }]}>
                <Text style={[styles.metricDeltaText, { color: '#047857' }]}>
                  View All →
                </Text>
              </View>
            </View>

            <Text style={styles.metricBigNumber}>482</Text>
            <Text style={styles.metricSubtitle}>Total Talaba (Hifz & Dars)</Text>
          </TouchableOpacity>

          {/* Card 2: Asateza & Muallimeen */}
          <View style={styles.metricCard}>
            <View style={styles.metricCardTop}>
              <View style={[styles.metricIconBox, { backgroundColor: '#FEF3C7' }]}>
                <Text style={styles.metricIconEmoji}>🪪</Text>
              </View>
              <View style={[styles.metricDeltaBadge, { backgroundColor: '#FEF3C7' }]}>
                <Text style={[styles.metricDeltaText, { color: '#B45309' }]}>
                  100% Present
                </Text>
              </View>
            </View>

            <Text style={styles.metricBigNumber}>28</Text>
            <Text style={styles.metricSubtitle}>Asateza & Muallimeen</Text>
          </View>
        </View>

        {/* TODAY'S ATTENDANCE BREAKDOWN */}
        <TouchableOpacity
          style={styles.departmentCard}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('AttendanceScreen', { initialTab: 'monthly' })}
        >
          <View style={styles.deptHeaderRow}>
            <Text style={styles.deptHeaderTitle}>Departmental Haziri Pulse</Text>
            <Text style={styles.deptHeaderDate}>View Monthly Report →</Text>
          </View>

          {/* Hifz Dept */}
          <View style={styles.deptProgressItem}>
            <View style={styles.deptInfoRow}>
              <Text style={styles.deptName}>Hifz-ul-Quran</Text>
              <Text style={styles.deptStats}>184 / 188 (98%)</Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: '98%', backgroundColor: '#059669' }]} />
            </View>
          </View>

          {/* Nazra Dept */}
          <View style={styles.deptProgressItem}>
            <View style={styles.deptInfoRow}>
              <Text style={styles.deptName}>Nazra Quran</Text>
              <Text style={styles.deptStats}>142 / 148 (96%)</Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: '96%', backgroundColor: '#0284C7' }]} />
            </View>
          </View>

          {/* Dars-e-Nizami Dept */}
          <View style={styles.deptProgressItem}>
            <View style={styles.deptInfoRow}>
              <Text style={styles.deptName}>Dars-e-Nizami (Aalim)</Text>
              <Text style={styles.deptStats}>156 / 156 (100%)</Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: '100%', backgroundColor: '#D97706' }]} />
            </View>
          </View>
        </TouchableOpacity>

        {/* PRAYER TIMETABLE HORIZONTAL STRIP */}
        <View style={styles.prayerStripContainer}>
          <Text style={styles.prayerStripTitle}>Daily Jama'at Timetable</Text>
          <View style={styles.prayerPillRow}>
            {prayers.map((p) => (
              <View
                key={p.name}
                style={[
                  styles.prayerPill,
                  p.active && styles.prayerPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.prayerPillName,
                    p.active && styles.prayerPillNameActive,
                  ]}
                >
                  {p.name}
                </Text>
                <Text
                  style={[
                    styles.prayerPillTime,
                    p.active && styles.prayerPillTimeActive,
                  ]}
                >
                  {p.time}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* BOTTOM QUICK BUTTONS */}
        <View style={styles.bottomNavRow}>
          <TouchableOpacity
            style={styles.navBtnSecondary}
            onPress={() => navigation.navigate('LoginPinPage')}
          >
            <Text style={styles.navBtnSecondaryText}>← Sign In / Exit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navBtnPrimary}
            onPress={() => navigation.navigate('AdminPendingPage')}
          >
            <Text style={styles.navBtnPrimaryText}>Admin Portal 🛡️</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* BRANCH SWITCHER MODAL */}
      <Modal
        visible={branchModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setBranchModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setBranchModalVisible(false)}
        >
          <View style={styles.modalSheet}>
            <Text style={styles.modalSheetTitle}>Select Campus / Branch</Text>
            <Text style={styles.modalSheetSubtitle}>
              Switch institution view to manage records for specific branches.
            </Text>

            {branches.map((b) => (
              <TouchableOpacity
                key={b.id}
                style={[
                  styles.branchOptionItem,
                  selectedBranch === b.code && styles.branchOptionActive,
                ]}
                onPress={() => {
                  setSelectedBranch(b.code);
                  setBranchModalVisible(false);
                }}
              >
                <Text style={styles.branchOptionEmoji}>🕌</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.branchOptionName}>{b.name}</Text>
                  <Text style={styles.branchOptionSub}>Live sync active</Text>
                </View>
                {selectedBranch === b.code && (
                  <Text style={styles.branchOptionCheck}>✓</Text>
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setBranchModalVisible(false)}
            >
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* NOTIFICATIONS MODAL */}
      <Modal
        visible={notificationModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setNotificationModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setNotificationModalVisible(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.notifHeaderRow}>
              <Text style={styles.modalSheetTitle}>Notifications & Alerts</Text>
              <Text style={styles.notifBadgeCount}>2 New</Text>
            </View>

            <View style={styles.notifItem}>
              <Text style={styles.notifIcon}>📢</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.notifTitle}>Monthly Taleemi Meeting</Text>
                <Text style={styles.notifBody}>
                  Meeting scheduled after Asr prayer with all Muallimeen in Library.
                </Text>
                <Text style={styles.notifTime}>35 mins ago</Text>
              </View>
            </View>

            <View style={styles.notifItem}>
              <Text style={styles.notifIcon}>🎉</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.notifTitle}>Hifz Milestone Achieved</Text>
                <Text style={styles.notifBody}>
                  Talib-e-Ilm Muhammad Zaid completed 15 Parahs today.
                </Text>
                <Text style={styles.notifTime}>2 hours ago</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setNotificationModalVisible(false)}
            >
              <Text style={styles.modalCloseBtnText}>Mark as Read & Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* PROFILE MODAL */}
      <Modal
        visible={profileModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setProfileModalVisible(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.profileModalHeader}>
              <View style={styles.profileModalAvatar}>
                <Text style={styles.profileModalAvatarText}>👤</Text>
              </View>
              <Text style={styles.profileModalName}>{userName}</Text>
              <Text style={styles.profileModalRole}>{roleTitle}</Text>
            </View>

            <View style={styles.profileDetailsCard}>
              <View style={styles.profileDetailRow}>
                <Text style={styles.profileDetailLabel}>Institution:</Text>
                <Text style={styles.profileDetailVal}>{selectedInstitution}</Text>
              </View>
              <View style={styles.profileDetailRow}>
                <Text style={styles.profileDetailLabel}>Branch:</Text>
                <Text style={styles.profileDetailVal}>{selectedBranch}</Text>
              </View>
              <View style={styles.profileDetailRow}>
                <Text style={styles.profileDetailLabel}>Access Level:</Text>
                <Text style={styles.profileDetailVal}>Executive / Nazim</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => {
                setProfileModalVisible(false);
                navigation.navigate('LoginPinPage');
              }}
            >
              <Text style={styles.logoutBtnText}>Switch Account / Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F8FAF9',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 40,
  },

  /* TOP HEADER BAR */
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 12,
    backgroundColor: '#F8FAF9',
    borderBottomWidth: 1,
    borderBottomColor: '#EBEFEA',
  },
  institutionSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  institutionLogoBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#064E3B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  institutionLogoIcon: {
    fontSize: 22,
  },
  institutionTextCol: {
    marginLeft: 10,
    justifyContent: 'center',
    flex: 1,
  },
  institutionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  institutionName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#064E3B',
  },
  arrowIcon: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '700',
  },
  hijriPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 3,
  },
  hijriPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  bellIcon: {
    fontSize: 18,
  },
  unreadBadgeDot: {
    position: 'absolute',
    top: 6,
    right: 7,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  userAvatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#064E3B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  userAvatarInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarIcon: {
    fontSize: 20,
  },

  /* USER WELCOME & BRANCH ROW */
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 16,
  },
  welcomeLeft: {
    flex: 1,
    marginRight: 10,
  },
  portalTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  portalSealIcon: {
    fontSize: 12,
    color: '#B45309',
  },
  portalTagText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.6,
  },
  greetingTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#064E3B',
    letterSpacing: -0.5,
  },
  userNameSubtitle: {
    fontSize: 17,
    fontWeight: '500',
    color: '#374151',
    marginTop: 2,
  },
  branchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F4EE',
    borderWidth: 1,
    borderColor: '#E7E0D3',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 5,
    marginTop: 8,
  },
  branchChipIcon: {
    fontSize: 14,
  },
  branchChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  branchChevron: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '700',
  },

  /* HERO CARD */
  heroCard: {
    backgroundColor: '#044E3A',
    borderRadius: 22,
    padding: 18,
    marginBottom: 24,
    shadowColor: '#044E3A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroDateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroCalIcon: {
    fontSize: 15,
  },
  heroDateHijri: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  heroDateGregorianPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  heroDateGregorianText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginVertical: 14,
  },
  heroBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  prayerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clockCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FDE047',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockEmoji: {
    fontSize: 22,
  },
  prayerInfo: {
    justifyContent: 'center',
  },
  nextJamaatLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A7F3D0',
    letterSpacing: 0.8,
  },
  nextJamaatTime: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  remainingRight: {
    alignItems: 'flex-end',
  },
  remainingLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A7F3D0',
    letterSpacing: 0.4,
  },
  remainingCounter: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FDE047',
    marginTop: 2,
  },

  /* SECTION HEADERS */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#064E3B',
    letterSpacing: -0.3,
  },
  sectionSublabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
    letterSpacing: 0.8,
  },
  liveSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveSummaryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  liveGreenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },

  /* QUICK ACTIONS */
  quickActionsScroll: {
    paddingRight: 10,
    gap: 12,
    paddingBottom: 4,
    marginBottom: 24,
  },
  actionCard: {
    width: 94,
    height: 122,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionIconText: {
    fontSize: 22,
    fontWeight: '700',
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 6,
  },
  actionBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  actionBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },

  /* EXECUTIVE METRICS GRID */
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 22,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  metricCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricIconEmoji: {
    fontSize: 18,
  },
  metricDeltaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  metricDeltaText: {
    fontSize: 10,
    fontWeight: '700',
  },
  metricBigNumber: {
    fontSize: 30,
    fontWeight: '800',
    color: '#064E3B',
    letterSpacing: -0.5,
  },
  metricSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginTop: 4,
  },

  /* DEPARTMENT PROGRESS CARD */
  departmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  deptHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  deptHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#064E3B',
  },
  deptHeaderDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  deptProgressItem: {
    marginBottom: 12,
  },
  deptInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  deptName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  deptStats: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  /* PRAYER STRIP */
  prayerStripContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 24,
  },
  prayerStripTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#064E3B',
    marginBottom: 10,
  },
  prayerPillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  prayerPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F8FAF9',
    marginHorizontal: 2,
  },
  prayerPillActive: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#059669',
  },
  prayerPillName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  prayerPillNameActive: {
    color: '#047857',
    fontWeight: '700',
  },
  prayerPillTime: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 2,
  },
  prayerPillTimeActive: {
    color: '#047857',
  },

  /* BOTTOM NAVIGATION BUTTONS */
  bottomNavRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  navBtnSecondary: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnSecondaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },
  navBtnPrimary: {
    flex: 1,
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  navBtnPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* MODALS */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
  modalSheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#064E3B',
    marginBottom: 4,
  },
  modalSheetSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  branchOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  branchOptionActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#059669',
  },
  branchOptionEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  branchOptionName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  branchOptionSub: {
    fontSize: 11,
    color: '#6B7280',
  },
  branchOptionCheck: {
    fontSize: 16,
    fontWeight: '800',
    color: '#059669',
    marginLeft: 8,
  },
  modalCloseBtn: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  modalCloseBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },

  /* NOTIFICATIONS */
  notifHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  notifBadgeCount: {
    backgroundColor: '#EF4444',
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  notifItem: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  notifIcon: {
    fontSize: 22,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  notifBody: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 2,
    lineHeight: 17,
  },
  notifTime: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
  },

  /* PROFILE MODAL */
  profileModalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  profileModalAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#064E3B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  profileModalAvatarText: {
    fontSize: 28,
  },
  profileModalName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#064E3B',
  },
  profileModalRole: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
    marginTop: 2,
  },
  profileDetailsCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  profileDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  profileDetailLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  profileDetailVal: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '700',
  },
  logoutBtn: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
});
