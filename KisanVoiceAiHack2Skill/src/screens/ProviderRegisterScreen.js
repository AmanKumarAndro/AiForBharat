import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    ScrollView, StatusBar, ActivityIndicator, Alert, Animated,
} from 'react-native';
import farmServicesApi from '../services/farmServicesApi';
import api from '../services/api';
import Header from '../components/Header';
import TractorIcon from '../../assets/svg/TractorIcon';
import LeafIcon from '../../assets/svg/LeafIcon';
import ShopIcon from '../../assets/svg/ShopIcon';
import CheckIcon from '../../assets/svg/CheckIcon';

const SERVICE_OPTIONS = [
    { id: 'TRACTOR', label: 'Tractor', hindi: 'ट्रैक्टर', SvgIcon: TractorIcon, color: '#D97706', bg: '#FEF3C7' },
    { id: 'LABOUR', label: 'Labour', hindi: 'मज़दूर', SvgIcon: LeafIcon, color: '#059669', bg: '#D1FAE5' },
    { id: 'TRANSPORT', label: 'Transport', hindi: 'ट्रांसपोर्ट', SvgIcon: ShopIcon, color: '#2563EB', bg: '#DBEAFE' },
];

export default function ProviderRegisterScreen({ navigation }) {
    const [selectedService, setSelectedService] = useState(null);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [pincode, setPincode] = useState('');
    const [pricePerHour, setPricePerHour] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [registeredData, setRegisteredData] = useState(null);

    const successScale = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        loadProfile();
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }, []);

    const loadProfile = async () => {
        try {
            const ud = await api.getUserData();
            if (ud?.name) setName(ud.name);
            if (ud?.phone) setPhone(ud.phone);
            if (ud?.pincode) setPincode(ud.pincode);
        } catch (e) { }
    };

    const handleSubmit = async () => {
        if (!selectedService) { Alert.alert('Please select a service type'); return; }
        if (!name.trim()) { Alert.alert('Please enter your name'); return; }
        if (!phone.trim()) { Alert.alert('Please enter your phone number'); return; }
        if (!pincode.trim() || pincode.length !== 6) { Alert.alert('Please enter a valid 6-digit pincode'); return; }
        if (!pricePerHour || isNaN(Number(pricePerHour))) { Alert.alert('Please enter a valid price per hour'); return; }

        setLoading(true);
        const result = await farmServicesApi.registerProvider({
            phone: phone.trim(),
            name: name.trim(),
            serviceType: selectedService.id,
            pincode: pincode.trim(),
            pricePerHour: Number(pricePerHour),
        });
        setLoading(false);

        if (result.success) {
            setRegisteredData(result.data);
            setSuccess(true);
            Animated.spring(successScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }).start();
        } else {
            Alert.alert('Registration Failed', result.error || 'Could not register. Please try again.');
        }
    };

    // ── Success Screen ──
    if (success) {
        return (
            <View style={st.successRoot}>
                <StatusBar barStyle="dark-content" backgroundColor="#FAFBFC" />
                <Animated.View style={[st.successBody, { transform: [{ scale: successScale }] }]}>
                    <View style={[st.successIconWrap, { backgroundColor: selectedService?.bg }]}>
                        {selectedService?.SvgIcon && <selectedService.SvgIcon width={32} height={32} color={selectedService?.color} />}
                    </View>
                    <Text style={st.successTitle}>You're Registered!</Text>
                    <Text style={st.successSub}>
                        Welcome to KisanVoice Services, {name}!{'\n'}
                        You are now listed as a {selectedService?.label} provider.
                    </Text>

                    <View style={st.successCard}>
                        <SuccessRow label="Service" value={selectedService?.label} />
                        <SuccessRow label="Price" value={`₹${pricePerHour}/hr`} />
                        <SuccessRow label="Area" value={`Pincode ${pincode}`} />
                        <SuccessRow label="Provider ID" value={registeredData?.provider_id || '—'} mono />
                        <SuccessRow label="Rating" value={`⭐ ${registeredData?.rating || '5.0'} (New)`} />
                    </View>

                    <Text style={st.successNote}>
                        Farmers in your area will now be able to find and book you.{'\n'}
                        You'll receive an SMS when someone requests your service.
                    </Text>

                    <TouchableOpacity style={st.successBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                        <Text style={st.successBtnText}>← Back to Services</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        );
    }

    // ── Registration Form ──
    return (
        <Animated.View style={[st.root, { opacity: fadeAnim }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FAFBFC" />
            <Header title="Become a Provider" />

            <ScrollView contentContainerStyle={st.form} showsVerticalScrollIndicator={false}>

                {/* Service Type */}
                <Text style={st.sectionLabel}>WHAT SERVICE DO YOU OFFER?</Text>
                <View style={st.serviceRow}>
                    {SERVICE_OPTIONS.map(svc => {
                        const active = selectedService?.id === svc.id;
                        return (
                            <TouchableOpacity
                                key={svc.id}
                                style={[st.svcCard, active && { borderColor: svc.color, borderWidth: 2, backgroundColor: svc.bg }]}
                                onPress={() => setSelectedService(svc)}
                                activeOpacity={0.85}
                            >
                                <View style={[st.svcIconWrap, { backgroundColor: active ? 'rgba(255,255,255,0.7)' : svc.bg }]}>
                                    <svc.SvgIcon width={20} height={20} color={svc.color} />
                                </View>
                                <Text style={[st.svcLabel, active && { color: svc.color, fontWeight: '800' }]}>{svc.label}</Text>
                                <Text style={st.svcHindi}>{svc.hindi}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Personal Details */}
                <Text style={st.sectionLabel}>YOUR DETAILS</Text>

                <InputField label="Full Name" placeholder="e.g. Ramesh Kumar" value={name} onChangeText={setName} />
                <InputField label="Phone Number" placeholder="+91 XXXXX XXXXX" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                <InputField label="Pincode" placeholder="6-digit pincode" value={pincode} onChangeText={setPincode} keyboardType="numeric" maxLength={6} />
                <InputField label="Price Per Hour (₹)" placeholder="e.g. 500" value={pricePerHour} onChangeText={setPricePerHour} keyboardType="numeric" />

                {/* Info box */}
                <View style={st.infoBox}>
                    <Text style={st.infoTitle}>How it works</Text>
                    <Text style={st.infoText}>
                        1. Farmers near your pincode will see your profile{'\n'}
                        2. You'll receive an SMS when there's a new request{'\n'}
                        3. Accept requests in the app to start earning{'\n'}
                        4. Build your rating to get more bookings
                    </Text>
                </View>

                {/* Submit */}
                <TouchableOpacity
                    style={[st.submitBtn, selectedService && { backgroundColor: selectedService.color }]}
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.85}
                >
                    {loading
                        ? <ActivityIndicator color="#FFF" />
                        : <>
                            {selectedService?.SvgIcon && <selectedService.SvgIcon width={20} height={20} color="#FFF" />}
                            <Text style={st.submitText}>Register as Provider</Text>
                        </>}
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </Animated.View>
    );
}

const InputField = ({ label, ...props }) => (
    <View style={st.inputWrap}>
        <Text style={st.inputLabel}>{label}</Text>
        <TextInput style={st.textInput} placeholderTextColor="#D1D5DB" {...props} />
    </View>
);

const SuccessRow = ({ label, value, mono }) => (
    <View style={st.successRowWrap}>
        <Text style={st.successRowLabel}>{label}</Text>
        <Text style={[st.successRowValue, mono && st.successRowMono]}>{value}</Text>
    </View>
);

const st = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#FAFBFC' },
    form: { paddingHorizontal: 20, paddingBottom: 20 },

    sectionLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: '#9CA3AF',
        letterSpacing: 0.8,
        marginBottom: 12,
        marginTop: 8,
    },

    // Service Cards
    serviceRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
    svcCard: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 14,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    svcIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    svcLabel: { fontSize: 12, fontWeight: '700', color: '#374151' },
    svcHindi: { fontSize: 10, color: '#D1D5DB', marginTop: 2, fontWeight: '500' },

    // Inputs
    inputWrap: { marginBottom: 14 },
    inputLabel: { fontSize: 12, fontWeight: '700', color: '#374151', marginBottom: 6 },
    textInput: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
    },

    // Info Box
    infoBox: {
        backgroundColor: '#F0FDF4',
        borderRadius: 14,
        padding: 14,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#D1FAE5',
    },
    infoTitle: { fontSize: 13, fontWeight: '800', color: '#1B5E20', marginBottom: 6 },
    infoText: { fontSize: 12, color: '#374151', lineHeight: 20 },

    // Submit
    submitBtn: {
        flexDirection: 'row',
        backgroundColor: '#1B5E20',
        paddingVertical: 15,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    submitText: { fontSize: 16, fontWeight: '800', color: '#FFF' },

    // Success Screen
    successRoot: {
        flex: 1,
        backgroundColor: '#FAFBFC',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    successBody: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 28,
        width: '100%',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    successIconWrap: {
        width: 64,
        height: 64,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
    },
    successTitle: { fontSize: 22, fontWeight: '900', color: '#111827', marginBottom: 8 },
    successSub: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 20, marginBottom: 20, fontWeight: '600' },
    successCard: {
        backgroundColor: '#F9FAFB',
        borderRadius: 14,
        width: '100%',
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    successRowWrap: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 7,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    successRowLabel: { fontSize: 12, fontWeight: '700', color: '#9CA3AF' },
    successRowValue: { fontSize: 13, fontWeight: '700', color: '#111827' },
    successRowMono: { fontFamily: 'monospace', fontSize: 11, color: '#374151' },
    successNote: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', lineHeight: 19, marginBottom: 22, fontWeight: '600' },
    successBtn: {
        backgroundColor: '#1B5E20',
        paddingHorizontal: 28,
        paddingVertical: 14,
        borderRadius: 14,
        width: '100%',
        alignItems: 'center',
    },
    successBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
});
