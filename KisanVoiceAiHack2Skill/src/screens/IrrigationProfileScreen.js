import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Alert,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    StatusBar,
    Animated,
    Dimensions,
    Platform,
} from 'react-native';
import { COLORS } from '../utils/constants';
import IrrigationAPI from '../services/IrrigationAPI';
import BackIconSvg from '../../assets/svg/BackIconSvg';
import CameraIcon from '../../assets/svg/CameraIcon';
import LeafIcon from '../../assets/svg/LeafIcon';
import MapPinIcon from '../../assets/svg/MapPinIcon';
import DropletIcon from '../../assets/svg/DropletIcon';
import BellIcon from '../../assets/svg/BellIcon';
import UserIcon from '../../assets/svg/UserIcon';
import ToolIcon from '../../assets/svg/ToolIcon';
import ChevronRightIcon from '../../assets/svg/ChevronRightIcon';

const { width } = Dimensions.get('window');

const ProfileInfoCard = ({ label, value, IconComponent, delay = 0 }) => {
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

export default function IrrigationProfileScreen({ navigation }) {
    const [farmerData, setFarmerData] = useState(null);
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
            const data = await IrrigationAPI.getStoredFarmerData();
            setFarmerData(data);
            setTimeout(startAnimations, 100);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to sign out?', [
            { text: 'Stay', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: async () => { await IrrigationAPI.clearFarmerData(); navigation.replace('IrrigationRegistration'); } }
        ]);
    };

    const handleUnregister = () => {
        Alert.alert('Unregister Profile', 'This will permanently delete your crop data and stop all future alerts. This action cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Yes, Delete', style: 'destructive',
                onPress: async () => {
                    try {
                        setLoading(true);
                        await IrrigationAPI.unregisterFarmer(farmerData.farmerId);
                        await IrrigationAPI.clearFarmerData();
                        Alert.alert('Success', 'Your profile and data have been deleted.');
                        navigation.replace('Home');
                    } catch (error) {
                        setLoading(false);
                        Alert.alert('Error', error.message);
                    }
                }
            }
        ]);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1B5E20" />
            </View>
        );
    }

    if (!farmerData) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.errorText}>No profile data found.</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.replace('IrrigationRegistration')}>
                    <Text style={styles.retryBtnText}>Go to Registration</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const initials = farmerData.name?.charAt(0).toUpperCase() || 'U';

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
                        <View style={styles.editAvatarBtn}>
                            <CameraIcon width={14} height={14} color="#FFF" />
                        </View>
                    </Animated.View>
                    <Animated.View style={{ opacity: nameFade, transform: [{ translateY: nameSlide }] }}>
                        <Text style={styles.profileName}>{farmerData.name}</Text>
                        <Text style={styles.profilePhone}>{farmerData.phone}</Text>
                    </Animated.View>
                </View>
            </Animated.View>

            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                style={{ opacity: contentFade, transform: [{ translateY: contentSlide }] }}
            >
                {/* Farming Profile */}
                <View style={styles.sectionWrap}>
                    <Text style={styles.sectionTitle}>FARMING PROFILE</Text>
                    <View style={styles.infoGrid}>
                        <ProfileInfoCard label="Current Crop" value={farmerData.crop} IconComponent={LeafIcon} delay={50} />
                        <ProfileInfoCard label="Growth Stage" value={farmerData.cropStage} IconComponent={LeafIcon} delay={80} />
                        <ProfileInfoCard label="District" value={farmerData.district} IconComponent={MapPinIcon} delay={110} />
                        <ProfileInfoCard label="Language" value={farmerData.language === 'hi' ? 'Hindi' : 'English'} IconComponent={ToolIcon} delay={140} />
                        <ProfileInfoCard label="GPS Sync" value={farmerData.coordinates?.source === 'gps' ? 'Enabled' : 'District'} IconComponent={MapPinIcon} delay={170} />
                    </View>
                </View>

                {/* Active Insights */}
                <View style={styles.sectionWrap}>
                    <Text style={styles.sectionTitle}>ACTIVE INSIGHTS</Text>
                    <ActionButton label="Daily Irrigation · 5:45 PM IST" IconComponent={DropletIcon} onPress={() => { }} delay={180} />
                    <ActionButton label="Extreme Weather · 24/7" IconComponent={BellIcon} onPress={() => { }} delay={210} />
                    <ActionButton label="Weekly Progress · Sunday AM" IconComponent={LeafIcon} onPress={() => { }} delay={240} />
                </View>

                {/* Account */}
                <View style={styles.sectionWrap}>
                    <Text style={styles.sectionTitle}>ACCOUNT</Text>
                    <ActionButton label="Sign Out" IconComponent={UserIcon} onPress={handleLogout} isDestructive delay={260} />
                    <ActionButton label="Delete Farmer Profile" IconComponent={ToolIcon} onPress={handleUnregister} isDestructive delay={280} />
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
    errorText: {
        fontSize: 14,
        color: '#9CA3AF',
        marginBottom: 20,
        fontWeight: '600',
    },
    retryBtn: {
        backgroundColor: '#1B5E20',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    retryBtnText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 14,
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
        paddingBottom: 90,
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
