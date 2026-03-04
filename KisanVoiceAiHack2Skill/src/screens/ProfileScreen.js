import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Platform,
} from 'react-native';
import { COLORS } from '../utils/constants';
import api from '../services/api';
import BackIconSvg from '../../assets/svg/BackIconSvg';
import CameraIcon from '../../assets/svg/CameraIcon';
import TractorIcon from '../../assets/svg/TractorIcon';
import MapPinIcon from '../../assets/svg/MapPinIcon';
import LeafIcon from '../../assets/svg/LeafIcon';
import UserIcon from '../../assets/svg/UserIcon';
import ClipboardIcon from '../../assets/svg/ClipboardIcon';
import ToolIcon from '../../assets/svg/ToolIcon';
import ChevronRightIcon from '../../assets/svg/ChevronRightIcon';
import BellIcon from '../../assets/svg/BellIcon';

const { width } = Dimensions.get('window');

const ProfileInfoCard = ({ label, value, IconComponent, HindiLabel, delay = 0 }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 200, delay, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, friction: 8, delay, useNativeDriver: true }),
        ]).start();
    }, []);

    return (
        <Animated.View style={[styles.infoCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.infoIconWrap}>
                {IconComponent ? <IconComponent width={18} height={18} color="#1B5E20" /> : <UserIcon width={18} height={18} color="#1B5E20" />}
            </View>
            <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{label}</Text>
                {HindiLabel && <Text style={styles.infoHindi}>{HindiLabel}</Text>}
                <Text style={styles.infoValue}>{value || 'Not provided'}</Text>
            </View>
        </Animated.View>
    );
};

const ActionButton = ({ label, IconComponent, onPress, isDestructive = false, delay = 0 }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(15)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 180, delay, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, friction: 8, delay, useNativeDriver: true }),
        ]).start();
    }, []);

    return (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <TouchableOpacity
                style={[styles.actionBtn, isDestructive && styles.destructiveBtn]}
                onPress={onPress}
                activeOpacity={0.7}
            >
                <View style={[styles.actionIconWrap, isDestructive && { backgroundColor: '#FEE2E2' }]}>
                    {IconComponent ? <IconComponent width={18} height={18} color={isDestructive ? '#D32F2F' : '#1B5E20'} /> : <ToolIcon width={18} height={18} color="#1B5E20" />}
                </View>
                <Text style={[styles.actionText, isDestructive && { color: '#D32F2F' }]}>{label}</Text>
                <ChevronRightIcon width={16} height={16} color={isDestructive ? '#D32F2F' : '#D1D5DB'} />
            </TouchableOpacity>
        </Animated.View>
    );
};

export default function ProfileScreen({ navigation }) {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Animations
    const headerFade = useRef(new Animated.Value(0)).current;
    const avatarScale = useRef(new Animated.Value(0.5)).current;
    const nameFade = useRef(new Animated.Value(0)).current;
    const nameSlide = useRef(new Animated.Value(20)).current;
    const contentFade = useRef(new Animated.Value(0)).current;
    const contentSlide = useRef(new Animated.Value(30)).current;

    useEffect(() => { loadProfile(); }, []);

    const startAnimations = () => {
        Animated.parallel([
            Animated.timing(headerFade, { toValue: 1, duration: 200, useNativeDriver: true }),
            Animated.spring(avatarScale, { toValue: 1, friction: 6, useNativeDriver: true }),
            Animated.timing(nameFade, { toValue: 1, duration: 200, delay: 80, useNativeDriver: true }),
            Animated.spring(nameSlide, { toValue: 0, friction: 8, delay: 80, useNativeDriver: true }),
            Animated.timing(contentFade, { toValue: 1, duration: 200, delay: 150, useNativeDriver: true }),
            Animated.spring(contentSlide, { toValue: 0, friction: 8, delay: 150, useNativeDriver: true }),
        ]).start();
    };

    const loadProfile = async () => {
        try {
            setLoading(true);
            let data = await api.getUserData();
            if (!data.name || !data.userType) {
                const profileRes = await api.getProfile();
                if (profileRes.success && profileRes.farmer) {
                    data = await api.getUserData();
                }
            }
            setUserData(data);
            setTimeout(startAnimations, 100);
        } catch (error) {
            console.error('Error loading profile:', error);
            Alert.alert('Error', 'Could not load profile details');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        Alert.alert('लॉगआउट / Logout', 'क्या आप लॉगआउट करना चाहते हैं?\nAre you sure you want to logout?', [
            { text: 'नहीं / No', style: 'cancel' },
            { text: 'हाँ / Yes', style: 'destructive', onPress: async () => { await api.logout(); navigation.replace('Onboarding'); } }
        ]);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1B5E20" />
            </View>
        );
    }

    const initials = userData?.name ? userData.name.charAt(0).toUpperCase() : 'U';

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1B5E20" />

            {/* Animated Header */}
            <Animated.View style={[styles.headerBackdrop, { opacity: headerFade }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <BackIconSvg width={24} height={24} stroke="#FFF" strokeWidth={2.5} />
                </TouchableOpacity>

                <View style={styles.profileHero}>
                    <Animated.View style={[styles.avatarWrap, { transform: [{ scale: avatarScale }] }]}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{initials}</Text>
                        </View>
                        <TouchableOpacity style={styles.editAvatarBtn} activeOpacity={0.8}>
                            <CameraIcon width={14} height={14} color="#FFF" />
                        </TouchableOpacity>
                    </Animated.View>
                    <Animated.View style={{ opacity: nameFade, transform: [{ translateY: nameSlide }] }}>
                        <Text style={styles.profileName}>{userData?.name || 'User'}</Text>
                        <Text style={styles.profilePhone}>{userData?.phone || 'No phone'}</Text>
                    </Animated.View>
                </View>
            </Animated.View>

            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                style={{ opacity: contentFade, transform: [{ translateY: contentSlide }] }}
            >
                {/* Details Section */}
                <View style={styles.sectionWrap}>
                    <Text style={styles.sectionTitle}>विवरण / Details</Text>
                    <View style={styles.infoGrid}>
                        <ProfileInfoCard label="User Type" HindiLabel="उपयोगकर्ता प्रकार" value={userData?.userType === 'farmer' ? 'Farmer / किसान' : 'Provider / प्रदाता'} IconComponent={TractorIcon} delay={50} />
                        <ProfileInfoCard label="Land Area" HindiLabel="भूमि क्षेत्र" value={`${userData?.landArea || '0'} Acres`} IconComponent={MapPinIcon} delay={80} />
                        <ProfileInfoCard label="City" HindiLabel="शहर" value={userData?.district} IconComponent={MapPinIcon} delay={110} />
                        <ProfileInfoCard label="State" HindiLabel="राज्य" value={userData?.state} IconComponent={MapPinIcon} delay={140} />
                        <ProfileInfoCard label="Language" HindiLabel="भाषा" value={userData?.language === 'hi' ? 'Hindi / हिंदी' : 'English / अंग्रेज़ी'} IconComponent={LeafIcon} delay={170} />
                    </View>
                </View>

                {/* Settings Section */}
                <View style={styles.sectionWrap}>
                    <Text style={styles.sectionTitle}>सेटिंग्स और सहायता / Settings & Support</Text>
                    <ActionButton label="Edit Profile / प्रोफ़ाइल संपादित करें" IconComponent={UserIcon} onPress={() => navigation.navigate('ProfileForm')} delay={180} />
                    <ActionButton label="My Subscriptions / मेरी सदस्यता" IconComponent={ClipboardIcon} onPress={() => Alert.alert('Coming Soon', 'Subscription management coming soon!')} delay={210} />
                    <ActionButton label="Notifications / सूचना" IconComponent={BellIcon} onPress={() => Alert.alert('Notifications', 'Notification settings coming soon!')} delay={240} />
                    <ActionButton label="Help & Support / सहायता" IconComponent={ToolIcon} onPress={() => Alert.alert('Support', 'Contact: support@kisanvoice.ai')} delay={270} />
                    <ActionButton label="Logout / लॉगआउट" IconComponent={UserIcon} onPress={handleLogout} isDestructive delay={300} />
                </View>

                <View style={styles.footer}>
                    <Text style={styles.versionText}>KisanVoice AI v2.4.0</Text>
                    <Text style={styles.footerInfo}>Made for Indian Farmers</Text>
                </View>
            </Animated.ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFBFC',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FAFBFC',
    },

    // Header
    headerBackdrop: {
        backgroundColor: '#1B5E20',
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
        paddingBottom: 30,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        alignItems: 'center',
    },
    backButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        left: 20,
        zIndex: 10,
    },
    profileHero: {
        alignItems: 'center',
        marginTop: 20,
    },
    avatarWrap: {
        position: 'relative',
        marginBottom: 15,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.25)',
    },
    avatarText: {
        fontSize: 40,
        fontWeight: '900',
        color: '#1B5E20',
    },
    editAvatarBtn: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        backgroundColor: '#4CAF50',
        width: 34,
        height: 34,
        borderRadius: 17,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#1B5E20',
    },
    profileName: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FFF',
        textAlign: 'center',
    },
    profilePhone: {
        fontSize: 14,
        color: '#A5D6A7',
        marginTop: 4,
        fontWeight: '700',
        textAlign: 'center',
    },

    // Content
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    sectionWrap: {
        marginBottom: 25,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#9CA3AF',
        marginBottom: 14,
        marginLeft: 4,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },

    // Info Cards
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    infoCard: {
        width: (width - 50) / 2,
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    infoIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#F0FDF4',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#9CA3AF',
    },
    infoHindi: {
        fontSize: 9,
        color: '#D1D5DB',
    },
    infoValue: {
        fontSize: 13,
        fontWeight: '800',
        color: '#111827',
        marginTop: 2,
    },

    // Action Buttons
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 14,
        padding: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    destructiveBtn: {
        backgroundColor: '#FFF5F5',
        borderColor: '#FEE2E2',
    },
    actionIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#F0FDF4',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    actionText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
    },

    // Footer
    footer: {
        alignItems: 'center',
        marginTop: 10,
    },
    versionText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#D1D5DB',
    },
    footerInfo: {
        fontSize: 11,
        color: '#E5E7EB',
        marginTop: 2,
    },
});
