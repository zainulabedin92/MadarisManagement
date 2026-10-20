import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';

interface Props {
  navigation: NativeStackNavigationProp<RootStackParamList, any>;
  route?: RouteProp<RootStackParamList, any>;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 32 - 12) / 2;

export const SuperAdminDashboard: React.FC<Props> = ({ navigation, route }) => {
  const userName = route?.params?.userName || 'Hazrat Maulana Muhtamim Sahib';

  // Navigation and active states
  const [activeTab, setActiveTab] = useState<'Home' | 'Talaba' | 'Taleem' | 'Operations' | 'Hostel/Fees' | 'More'>('Home');

  // Modals
  const [institutionModalVisible, setInstitutionModalVisible] = useState(false);
  const [branchModalVisible, setBranchModalVisible] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [selectedCardDetail, setSelectedCardDetail] = useState<{
    title: string;
    value: string;
    subtitle: string;
    details: string[];
    actionTitle?: string;
    action?: () => void;
  } | null>(null);

  // Institution & Branch state
  const [selectedInstitution, setSelectedInstitution] = useState('Jamia Darul Ulo...');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState('Markaz-e-Noor (Main Cam...');
  const [branchCount, setBranchCount] = useState('4 Branches');

  const institutions = [
    { id: '1', name: 'Jamia Darul Uloom Karachi', short: 'Jamia Darul Ulo...' },
    { id: '2', name: 'Markaz-e-Noor Central Idara', short: 'Markaz-e-Noor...' },
    { id: '3', name: 'Jamia Ashrafia Lahore', short: 'Jamia Ashrafia...' },
  ];

  const branches = [
    { id: '1', name: 'Markaz-e-Noor (Main Campus)', code: 'Main Campus', talaba: '740' },
    { id: '2', name: 'Hifz Academy (Branch 2)', code: 'Branch 2', talaba: '380' },
    { id: '3', name: 'Banat Girls Campus (Branch 3)', code: 'Branch 3', talaba: '242' },
    { id: '4', name: 'Noor-ul-Quran Branch 4', code: 'Branch 4', talaba: '120' },
  ];

  const handleCardPress = (cardType: 'TALABA' | 'ASATEZA' | 'WALIDAIN' | 'DARJAAT') => {
    switch (cardType) {
      case 'TALABA':
        setSelectedCardDetail({
          title: 'Markazi Talaba (Students)',
          value: '1,482',
          subtitle: 'Active Registered Students across 4 Campuses',
          details: [
            '📖 Hifz-ul-Quran: 620 Talaba',
            '📚 Dars-e-Nizami (Aalim): 540 Talaba',
            '✨ Nazra & Tajweed: 322 Talaba',
            '⏳ New Pending Dakhla Applications: 18',
          ],
          actionTitle: 'View Complete Talaba Directory 📋',
          action: () => {
            setSelectedCardDetail(null);
            navigation.navigate('StudentsListScreen');
          },
        });
        break;

      case 'ASATEZA':
        setSelectedCardDetail({
          title: 'Asateza-e-Kiram (Faculty)',
          value: '64',
          subtitle: 'Active Faculty Members & Muallimeen',
          details: [
            '👳‍♂️ Shuyookh & Senior Muallimeen: 14',
            '📖 Hifz Muallimeen: 26',
            '📚 Dars-e-Nizami Lecturers: 18',
            '🟢 Present on Duty Today: 62 / 64 (97%)',
            '🟡 On Approved Leave: 2',
          ],
          actionTitle: 'View Faculty Roster',
          action: () => {
            setSelectedCardDetail(null);
            Alert.alert('Faculty Roster', '64 Faculty members are currently registered in the database.');
          },
        });
        break;

      case 'WALIDAIN':
        setSelectedCardDetail({
          title: 'Walidain (Guardians & Parents)',
          value: '1,120',
          subtitle: 'Registered Guardians in MMS Portal',
          details: [
            '📱 Active WhatsApp & SMS Alerts: 1,098',
            '🛡️ B-Form / CNIC Verified: 1,120 (100%)',
            '💬 Last Notice Broadcast: Ramadan Timetable Notice',
            '📩 Unread Guardian Inquiries: 5',
          ],
          actionTitle: 'Broadcast Notice to Guardians',
          action: () => {
            setSelectedCardDetail(null);
            Alert.alert('Notice Broadcast', 'Broadcast message module ready for 1,120 verified parents.');
          },
        });
        break;

      case 'DARJAAT':
        setSelectedCardDetail({
          title: 'Darjaat (Active Sections)',
          value: '36',
          subtitle: 'Classrooms & Sections currently operating',
          details: [
            '🏛️ Hifz Sections (Shoba-e-Tahfeez): 16 Classes',
            '📖 Dars-e-Nizami (Sanwiya, Aalia, Aalmiya): 12 Classes',
            '⭐ Tajweed & Qiraat: 5 Classes',
            '🌙 Ibtidaiyya (Prep): 3 Classes',
          ],
          actionTitle: 'View Class Schedules',
          action: () => {
            setSelectedCardDetail(null);
            Alert.alert('Darjaat Schedule', '36 active classes are on schedule today.');
          },
        });
        break;
    }
  };

  const handleOverviewPress = () => {
    Alert.alert(
      'Markazi Arkaan Overview',
      'Executive Summary for Muhtamim Sahib:\n\n• Talaba: 1,482 Active\n• Asateza: 64 Active\n• Walidain: 1,120 Registered\n• Darjaat: 36 Sections\n\nOverall Attendance: 98.4%\nDaily Operations: Normal'
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      {/* TOP HEADER BAR */}
      <View style={styles.headerBar}>
        {/* Left: Madaris Logo + Institution Dropdown */}
        <View style={styles.headerLeftGroup}>
          {/* Logo Badge */}
          <View style={styles.logoBadgeContainer}>
            <View style={styles.logoEmblemCircle}>
              <Text style={styles.logoEmblemIcon}>🕌</Text>
            </View>
            <Text style={styles.logoBadgeText}>Madaris Logo</Text>
          </View>

          {/* Institution Selector & Hijri Date */}
          <TouchableOpacity
            style={styles.institutionDropdownBtn}
            activeOpacity={0.7}
            onPress={() => setInstitutionModalVisible(true)}
          >
            <View style={styles.institutionNameRow}>
              <Text style={styles.institutionNameText} numberOfLines={1}>
                {selectedInstitution}
              </Text>
              {/* Up-Down Chevron */}
              <View style={styles.chevronCol}>
                <Text style={styles.chevronArrow}>▲</Text>
                <Text style={styles.chevronArrow}>▼</Text>
              </View>
            </View>

            {/* Hijri Date Pill */}
            <View style={styles.hijriPill}>
              <Text style={styles.hijriCalendarIcon}>📅</Text>
              <Text style={styles.hijriPillText}>14 Ramadan 1446 AH</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Right: Notification Bell & Profile Avatar */}
        <View style={styles.headerRightActions}>
          {/* Bell Icon with Red Dot */}
          <TouchableOpacity
            style={styles.bellButton}
            activeOpacity={0.7}
            onPress={() => setNotificationModalVisible(true)}
          >
            <Text style={styles.bellIconEmoji}>🔔</Text>
            <View style={styles.redBadgeDot} />
          </TouchableOpacity>

          {/* Profile Avatar */}
          <TouchableOpacity
            style={styles.profileAvatarBtn}
            activeOpacity={0.8}
            onPress={() => setProfileModalVisible(true)}
          >
            <View style={styles.profileAvatarCircle}>
              <Text style={styles.profileAvatarIcon}>👤</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* MAIN SCROLLABLE CONTENT */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* CONSOLE & ROLE PILL BADGES */}
        <View style={styles.badgeRow}>
          {/* Dark Forest Green Pill: Markazi Idara • Muhtamim Console */}
          <TouchableOpacity
            style={styles.markaziBadgePill}
            activeOpacity={0.85}
            onPress={() =>
              Alert.alert(
                'Markazi Idara Console',
                'You are in the Central SuperAdmin console for Hazrat Maulana Muhtamim Sahib.'
              )
            }
          >
            <Text style={styles.shieldIconWhite}>🛡️</Text>
            <Text style={styles.markaziBadgeText}>
              Markazi Idara • Muhtamim Console
            </Text>
          </TouchableOpacity>

          {/* Light Pill: SuperAdmin */}
          <View style={styles.superAdminPill}>
            <Text style={styles.superAdminIcon}>🛡️</Text>
            <Text style={styles.superAdminText}>SuperAdmin</Text>
          </View>
        </View>

        {/* GREETING SECTION */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingTitle}>Assalamu Alaikum</Text>
          <Text style={styles.greetingSubtitle}>{userName}</Text>
        </View>

        {/* ACTIVE JURISDICTION CARD */}
        <TouchableOpacity
          style={styles.jurisdictionCard}
          activeOpacity={0.8}
          onPress={() => setBranchModalVisible(true)}
        >
          {/* Left: Building Icon */}
          <View style={styles.jurisdictionIconBox}>
            <Text style={styles.jurisdictionIcon}>🏛️</Text>
          </View>

          {/* Middle: Jurisdiction Details */}
          <View style={styles.jurisdictionInfo}>
            <Text style={styles.jurisdictionLabel}>ACTIVE JURISDICTION</Text>
            <Text style={styles.jurisdictionValue} numberOfLines={1}>
              {selectedJurisdiction}
            </Text>
          </View>

          {/* Right: 4 Branches Pill */}
          <View style={styles.branchesBadge}>
            <Text style={styles.branchesBadgeText}>{branchCount}</Text>
          </View>
        </TouchableOpacity>

        {/* SECTION HEADER: Markazi Arkaan */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Markazi Arkaan</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={handleOverviewPress}>
            <Text style={styles.overviewLink}>Overview</Text>
          </TouchableOpacity>
        </View>

        {/* 2x2 GRID OF 4 ARKAAN CARDS */}
        <View style={styles.gridContainer}>
          {/* ROW 1 */}
          <View style={styles.gridRow}>
            {/* CARD 1: TALABA */}
            <TouchableOpacity
              style={styles.statCard}
              activeOpacity={0.75}
              onPress={() => navigation.navigate('StudentsListScreen')}
            >
              <View style={styles.cardTopRow}>
                {/* Mint Green Icon Box */}
                <View style={[styles.cardIconBox, { backgroundColor: '#E1F5EC' }]}>
                  <Text style={[styles.cardIconEmoji, { color: '#0D6E48' }]}>🎓</Text>
                </View>
                <Text style={styles.cardArrowIcon}>→</Text>
              </View>

              <Text style={styles.cardCategoryLabel}>TALABA</Text>
              <Text style={styles.cardBigNumber}>1,482</Text>
              <Text style={styles.cardSubtext}>Active Talaba</Text>
            </TouchableOpacity>

            {/* CARD 2: ASATEZA */}
            <TouchableOpacity
              style={styles.statCard}
              activeOpacity={0.75}
              onPress={() => handleCardPress('ASATEZA')}
            >
              <View style={styles.cardTopRow}>
                {/* Yellow Amber Icon Box */}
                <View style={[styles.cardIconBox, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.cardIconEmoji, { color: '#B45309' }]}>🧑‍🏫</Text>
                </View>
                <Text style={styles.cardArrowIcon}>→</Text>
              </View>

              <Text style={styles.cardCategoryLabel}>ASATEZA</Text>
              <Text style={styles.cardBigNumber}>64</Text>
              <Text style={styles.cardSubtext}>Faculty Members</Text>
            </TouchableOpacity>
          </View>

          {/* ROW 2 */}
          <View style={styles.gridRow}>
            {/* CARD 3: WALIDAIN */}
            <TouchableOpacity
              style={styles.statCard}
              activeOpacity={0.75}
              onPress={() => handleCardPress('WALIDAIN')}
            >
              <View style={styles.cardTopRow}>
                {/* Soft Mint / Teal Icon Box */}
                <View style={[styles.cardIconBox, { backgroundColor: '#D1FAE5' }]}>
                  <Text style={[styles.cardIconEmoji, { color: '#059669' }]}>👥</Text>
                </View>
                <Text style={styles.cardArrowIcon}>→</Text>
              </View>

              <Text style={styles.cardCategoryLabel}>WALIDAIN</Text>
              <Text style={styles.cardBigNumber}>1,120</Text>
              <Text style={styles.cardSubtext}>Registered Guardians</Text>
            </TouchableOpacity>

            {/* CARD 4: DARJAAT */}
            <TouchableOpacity
              style={styles.statCard}
              activeOpacity={0.75}
              onPress={() => handleCardPress('DARJAAT')}
            >
              <View style={styles.cardTopRow}>
                {/* Soft Peach / Amber Icon Box */}
                <View style={[styles.cardIconBox, { backgroundColor: '#FFEDD5' }]}>
                  <View style={styles.darjaatGridSymbol}>
                    <View style={styles.gridMiniRow}>
                      <View style={styles.gridMiniBox} />
                      <View style={styles.gridMiniBox} />
                    </View>
                    <View style={styles.gridMiniRow}>
                      <View style={styles.gridMiniBox} />
                      <View style={styles.gridMiniBox} />
                    </View>
                  </View>
                </View>
                <Text style={styles.cardArrowIcon}>→</Text>
              </View>

              <Text style={styles.cardCategoryLabel}>DARJAAT</Text>
              <Text style={styles.cardBigNumber}>36</Text>
              <Text style={styles.cardSubtext}>Active Sections</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* QUICK ADMINISTRATIVE SHORTCUTS */}
        <View style={styles.quickAccessSection}>
          {/* Card 1: Students Directory with Darjat Filter */}
          <TouchableOpacity
            style={[styles.adminActionCard, { marginBottom: 10 }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('StudentsListScreen')}
          >
            <View style={styles.adminActionLeft}>
              <View style={[styles.adminActionIconCircle, { backgroundColor: '#E1F5EC' }]}>
                <Text style={styles.adminActionEmoji}>🎓</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.adminActionTitle}>Talaba Directory & Darjaat</Text>
                <Text style={styles.adminActionSub}>View all students, filter by Darja & enroll new</Text>
              </View>
            </View>
            <View style={[styles.adminActionBadge, { backgroundColor: '#0F4433' }]}>
              <Text style={[styles.adminActionBadgeText, { color: '#86EFAC' }]}>Directory →</Text>
            </View>
          </TouchableOpacity>

          {/* Card 2: Pending Dakhla Approvals */}
          <TouchableOpacity
            style={styles.adminActionCard}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('AdminPendingPage')}
          >
            <View style={styles.adminActionLeft}>
              <View style={styles.adminActionIconCircle}>
                <Text style={styles.adminActionEmoji}>🛡️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.adminActionTitle}>Pending Dakhla Approvals</Text>
                <Text style={styles.adminActionSub}>18 New Applications waiting for Muhtamim sign-off</Text>
              </View>
            </View>
            <View style={styles.adminActionBadge}>
              <Text style={styles.adminActionBadgeText}>Review →</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* BOTTOM SPACING FOR FLOATING TAB BAR */}
        <View style={{ height: 90 }} />
      </ScrollView>

      {/* FIXED BOTTOM NAVIGATION BAR */}
      <View style={styles.bottomNavContainer}>
        {/* 1. Home Tab */}
        <TouchableOpacity
          style={styles.tabItem}
          activeOpacity={0.7}
          onPress={() => setActiveTab('Home')}
        >
          <View style={styles.tabGridIconBox}>
            <View style={styles.tabGridRow}>
              <View
                style={[
                  styles.tabMiniDot,
                  activeTab === 'Home' && styles.tabMiniDotActive,
                ]}
              />
              <View
                style={[
                  styles.tabMiniDot,
                  activeTab === 'Home' && styles.tabMiniDotActive,
                ]}
              />
            </View>
            <View style={styles.tabGridRow}>
              <View
                style={[
                  styles.tabMiniDot,
                  activeTab === 'Home' && styles.tabMiniDotActive,
                ]}
              />
              <View
                style={[
                  styles.tabMiniDot,
                  activeTab === 'Home' && styles.tabMiniDotActive,
                ]}
              />
            </View>
          </View>
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'Home' && styles.tabLabelActive,
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>

        {/* 2. Talaba Tab */}
        <TouchableOpacity
          style={styles.tabItem}
          activeOpacity={0.7}
          onPress={() => {
            navigation.navigate('StudentsListScreen');
          }}
        >
          <Text style={styles.tabEmojiIcon}>🎓</Text>
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'Talaba' && styles.tabLabelActive,
            ]}
          >
            Talaba
          </Text>
        </TouchableOpacity>

        {/* 3. Operations Tab */}
        <TouchableOpacity
          style={styles.tabItem}
          activeOpacity={0.7}
          onPress={() => {
            setActiveTab('Operations');
            Alert.alert(
              'Operations Module 👥',
              'Attendance monitoring, Staff shifts, and Campus logistics.'
            );
          }}
        >
          <Text style={styles.tabEmojiIcon}>👥</Text>
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'Operations' && styles.tabLabelActive,
            ]}
          >
            Operations
          </Text>
        </TouchableOpacity>

        {/* 4. Hostel/Fees Tab */}
        <TouchableOpacity
          style={styles.tabItem}
          activeOpacity={0.7}
          onPress={() => {
            setActiveTab('Hostel/Fees');
            Alert.alert(
              'Hostel & Fees Module 🏢',
              'Mahana Fee collection, Boarding & Lodging, and Mess accounts.'
            );
          }}
        >
          <Text style={styles.tabEmojiIcon}>🏢</Text>
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'Hostel/Fees' && styles.tabLabelActive,
            ]}
          >
            Hostel/Fees
          </Text>
        </TouchableOpacity>

        {/* 5. More Tab */}
        <TouchableOpacity
          style={styles.tabItem}
          activeOpacity={0.7}
          onPress={() => {
            setActiveTab('More');
            setProfileModalVisible(true);
          }}
        >
          <Text style={styles.tabDotsIcon}>•••</Text>
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'More' && styles.tabLabelActive,
            ]}
          >
            More
          </Text>
        </TouchableOpacity>

        {/* Native Home Indicator Bar */}
        <View style={styles.homeIndicatorBar} />
      </View>

      {/* DETAIL MODAL (Card Click) */}
      <Modal
        visible={!!selectedCardDetail}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedCardDetail(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalCard}>
            <View style={styles.detailHeader}>
              <View>
                <Text style={styles.detailTitle}>{selectedCardDetail?.title}</Text>
                <Text style={styles.detailBigValue}>{selectedCardDetail?.value}</Text>
                <Text style={styles.detailSubtitle}>{selectedCardDetail?.subtitle}</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseCircle}
                onPress={() => setSelectedCardDetail(null)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.detailList}>
              {selectedCardDetail?.details.map((item, index) => (
                <View key={index} style={styles.detailItemRow}>
                  <Text style={styles.detailItemText}>{item}</Text>
                </View>
              ))}
            </View>

            {selectedCardDetail?.actionTitle && (
              <TouchableOpacity
                style={styles.detailActionBtn}
                onPress={selectedCardDetail.action}
              >
                <Text style={styles.detailActionBtnText}>
                  {selectedCardDetail.actionTitle}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.detailDismissBtn}
              onPress={() => setSelectedCardDetail(null)}
            >
              <Text style={styles.detailDismissText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* INSTITUTION SWITCHER MODAL */}
      <Modal
        visible={institutionModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setInstitutionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheetCard}>
            <Text style={styles.sheetTitle}>Select Markazi Institution</Text>
            <Text style={styles.sheetSubtitle}>
              Switch institution console for Muhtamim Sahib
            </Text>

            {institutions.map((inst) => (
              <TouchableOpacity
                key={inst.id}
                style={[
                  styles.sheetOption,
                  selectedInstitution === inst.short && styles.sheetOptionActive,
                ]}
                onPress={() => {
                  setSelectedInstitution(inst.short);
                  setInstitutionModalVisible(false);
                }}
              >
                <Text style={styles.sheetOptionIcon}>🕌</Text>
                <Text style={styles.sheetOptionText}>{inst.name}</Text>
                {selectedInstitution === inst.short && (
                  <Text style={styles.sheetOptionCheck}>✓</Text>
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.sheetCloseBtn}
              onPress={() => setInstitutionModalVisible(false)}
            >
              <Text style={styles.sheetCloseBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* BRANCH SWITCHER MODAL */}
      <Modal
        visible={branchModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setBranchModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheetCard}>
            <Text style={styles.sheetTitle}>Active Jurisdiction Branches</Text>
            <Text style={styles.sheetSubtitle}>
              Select branch jurisdiction to filter statistics
            </Text>

            {branches.map((b) => (
              <TouchableOpacity
                key={b.id}
                style={[
                  styles.sheetOption,
                  selectedJurisdiction.includes(b.code) && styles.sheetOptionActive,
                ]}
                onPress={() => {
                  setSelectedJurisdiction(`${b.name.slice(0, 24)}...`);
                  setBranchCount(`${b.talaba} Talaba`);
                  setBranchModalVisible(false);
                }}
              >
                <Text style={styles.sheetOptionIcon}>🏛️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sheetOptionText}>{b.name}</Text>
                  <Text style={styles.sheetOptionSubtext}>{b.talaba} Enrolled Talaba</Text>
                </View>
                {selectedJurisdiction.includes(b.code) && (
                  <Text style={styles.sheetOptionCheck}>✓</Text>
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.sheetCloseBtn}
              onPress={() => setBranchModalVisible(false)}
            >
              <Text style={styles.sheetCloseBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* NOTIFICATIONS MODAL */}
      <Modal
        visible={notificationModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setNotificationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheetCard}>
            <Text style={styles.sheetTitle}>Markazi Notifications 🔔</Text>
            <Text style={styles.sheetSubtitle}>
              Priority alerts for Hazrat Maulana Muhtamim Sahib
            </Text>

            <View style={styles.notifItem}>
              <Text style={styles.notifDot}>🔴</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.notifTitle}>18 Pending Dakhla Applications</Text>
                <Text style={styles.notifBody}>Awaiting your final verification & admission approval.</Text>
                <Text style={styles.notifTime}>10 mins ago</Text>
              </View>
            </View>

            <View style={styles.notifItem}>
              <Text style={styles.notifDot}>🟢</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.notifTitle}>Daily Haziri: 98.4% Recorded</Text>
                <Text style={styles.notifBody}>All 36 Darjaat attendance marked by Nazim-e-Taleem.</Text>
                <Text style={styles.notifTime}>1 hour ago</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.detailActionBtn}
              onPress={() => {
                setNotificationModalVisible(false);
                navigation.navigate('AdminPendingPage');
              }}
            >
              <Text style={styles.detailActionBtnText}>Review Pending Approvals</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetCloseBtn}
              onPress={() => setNotificationModalVisible(false)}
            >
              <Text style={styles.sheetCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* PROFILE / LOGOUT MODAL */}
      <Modal
        visible={profileModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheetCard}>
            <View style={styles.profileSheetHeader}>
              <View style={styles.profileSheetAvatar}>
                <Text style={styles.profileSheetAvatarIcon}>👤</Text>
              </View>
              <View>
                <Text style={styles.profileSheetName}>{userName}</Text>
                <Text style={styles.profileSheetRole}>SuperAdmin • Muhtamim</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.profileActionRow}
              onPress={() => {
                setProfileModalVisible(false);
                navigation.navigate('AdminPendingPage');
              }}
            >
              <Text style={styles.profileActionEmoji}>🛡️</Text>
              <Text style={styles.profileActionLabel}>Admin Approvals Console</Text>
              <Text style={styles.profileActionArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.profileActionRow}
              onPress={() => {
                setProfileModalVisible(false);
                navigation.navigate('RegisterPage');
              }}
            >
              <Text style={styles.profileActionEmoji}>📝</Text>
              <Text style={styles.profileActionLabel}>New Dakhla Form (Register)</Text>
              <Text style={styles.profileActionArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.profileActionRow, { borderBottomWidth: 0 }]}
              onPress={() => {
                setProfileModalVisible(false);
                navigation.navigate('LoginPinPage');
              }}
            >
              <Text style={styles.profileActionEmoji}>🚪</Text>
              <Text style={[styles.profileActionLabel, { color: '#DC2626' }]}>
                Sign Out / Exit Console
              </Text>
              <Text style={styles.profileActionArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetCloseBtn}
              onPress={() => setProfileModalVisible(false)}
            >
              <Text style={styles.sheetCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F6F9F6',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 10,
    backgroundColor: '#F6F9F6',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  logoBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  logoEmblemCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E6F4EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  logoEmblemIcon: {
    fontSize: 16,
  },
  logoBadgeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D382C',
    letterSpacing: -0.2,
  },
  institutionDropdownBtn: {
    justifyContent: 'center',
  },
  institutionNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  institutionNameText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0A3326',
    maxWidth: 130,
  },
  chevronCol: {
    marginLeft: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevronArrow: {
    fontSize: 7,
    color: '#4B6358',
    lineHeight: 8,
  },
  hijriPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 10,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  hijriCalendarIcon: {
    fontSize: 9.5,
    marginRight: 3,
  },
  hijriPillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#92400E',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bellButton: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bellIconEmoji: {
    fontSize: 21,
  },
  redBadgeDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#F6F9F6',
  },
  profileAvatarBtn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#092F23',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarIcon: {
    fontSize: 17,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
    marginBottom: 16,
  },
  markaziBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F4433',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  shieldIconWhite: {
    fontSize: 13,
    marginRight: 6,
  },
  markaziBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
  superAdminPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DFE8E2',
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 20,
  },
  superAdminIcon: {
    fontSize: 12,
    marginRight: 5,
  },
  superAdminText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  greetingSection: {
    marginBottom: 16,
  },
  greetingTitle: {
    fontSize: 29,
    fontWeight: '800',
    color: '#083B2B',
    letterSpacing: -0.6,
  },
  greetingSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4B6256',
    marginTop: 3,
  },
  jurisdictionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F5F2',
    borderWidth: 1,
    borderColor: '#DFE8E2',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 22,
  },
  jurisdictionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#D7EFE2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  jurisdictionIcon: {
    fontSize: 22,
  },
  jurisdictionInfo: {
    flex: 1,
    marginRight: 8,
  },
  jurisdictionLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#5E7669',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  jurisdictionValue: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#0A2B1E',
  },
  branchesBadge: {
    backgroundColor: '#FDE68A',
    paddingHorizontal: 10,
    paddingVertical: 5.5,
    borderRadius: 12,
  },
  branchesBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#854D0E',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0A2B1E',
    letterSpacing: -0.3,
  },
  overviewLink: {
    fontSize: 13.5,
    fontWeight: '500',
    color: '#5C7467',
  },
  gridContainer: {
    gap: 12,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EBF1EC',
    padding: 16,
    shadowColor: '#0A3326',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIconEmoji: {
    fontSize: 22,
  },
  darjaatGridSymbol: {
    width: 22,
    height: 22,
    justifyContent: 'space-between',
  },
  gridMiniRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridMiniBox: {
    width: 9,
    height: 9,
    borderRadius: 2,
    backgroundColor: '#C2410C',
  },
  cardArrowIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#64748B',
  },
  cardCategoryLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#64748B',
    marginBottom: 2,
  },
  cardBigNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0A2B1E',
    letterSpacing: -0.5,
  },
  cardSubtext: {
    fontSize: 12.5,
    fontWeight: '500',
    color: '#596E63',
    marginTop: 3,
  },
  quickAccessSection: {
    marginTop: 20,
  },
  adminActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1E7DD',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  adminActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  adminActionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  adminActionEmoji: {
    fontSize: 19,
  },
  adminActionTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F4433',
  },
  adminActionSub: {
    fontSize: 11.5,
    color: '#526E60',
    marginTop: 2,
  },
  adminActionBadge: {
    backgroundColor: '#0F4433',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  adminActionBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 68,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EBF1EC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
  },
  tabGridIconBox: {
    width: 18,
    height: 18,
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  tabGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tabMiniDot: {
    width: 7,
    height: 7,
    borderRadius: 1.5,
    backgroundColor: '#64748B',
  },
  tabMiniDotActive: {
    backgroundColor: '#0A2B1E',
  },
  tabEmojiIcon: {
    fontSize: 18,
    marginBottom: 3,
  },
  tabDotsIcon: {
    fontSize: 16,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 4,
    letterSpacing: -1,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  tabLabelActive: {
    color: '#0A2B1E',
    fontWeight: '800',
  },
  homeIndicatorBar: {
    position: 'absolute',
    bottom: 4,
    alignSelf: 'center',
    width: 134,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  detailModalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  detailBigValue: {
    fontSize: 34,
    fontWeight: '800',
    color: '#083B2B',
    marginTop: 2,
  },
  detailSubtitle: {
    fontSize: 13,
    color: '#4B6358',
    marginTop: 2,
  },
  modalCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '700',
  },
  detailList: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    marginBottom: 16,
  },
  detailItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailItemText: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
  },
  detailActionBtn: {
    backgroundColor: '#0F4433',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  detailActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  detailDismissBtn: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  detailDismissText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  bottomSheetCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0A2B1E',
  },
  sheetSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 3,
    marginBottom: 16,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sheetOptionActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#0F4433',
  },
  sheetOptionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  sheetOptionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  sheetOptionSubtext: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  sheetOptionCheck: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F4433',
  },
  sheetCloseBtn: {
    marginTop: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  sheetCloseBtnText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  notifDot: {
    fontSize: 12,
    marginTop: 2,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A2B1E',
  },
  notifBody: {
    fontSize: 12.5,
    color: '#475569',
    marginTop: 2,
  },
  notifTime: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  profileSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  profileSheetAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#092F23',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  profileSheetAvatarIcon: {
    fontSize: 24,
  },
  profileSheetName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0A2B1E',
  },
  profileSheetRole: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '600',
    marginTop: 2,
  },
  profileActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  profileActionEmoji: {
    fontSize: 18,
    marginRight: 12,
  },
  profileActionLabel: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '600',
    color: '#1E293B',
  },
  profileActionArrow: {
    fontSize: 16,
    color: '#94A3B8',
  },
});
