import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    StatusBar,
} from 'react-native';
import { COLORS } from '../utils/constants';
import api from '../services/api';

const ProfileFormScreen = ({ navigation }) => {
    const [formData, setFormData] = useState({
        name: '',
        userType: 'farmer',
        totalLandArea: '',
        latitude: '28.4595', // Default mocks
        longitude: '77.0266',
        city: '',
        state: '',
        language: 'hi'
    });
    const [loading, setLoading] = useState(false);

    React.useEffect(() => {
        const detectLocation = async () => {
            try {
                const response = await fetch('https://ipapi.co/json/');
                const data = await response.json();
                if (data.latitude && data.longitude) {
                    setFormData(prev => ({
                        ...prev,
                        city: data.city || prev.city,
                        latitude: data.latitude.toString(),
                        longitude: data.longitude.toString()
                    }));
                }
            } catch (e) {
                console.warn('Location detection failed');
            }
        };
        detectLocation();
    }, []);

    const handleSubmit = async () => {
        if (!formData.name || !formData.totalLandArea || !formData.city || !formData.state) {
            Alert.alert('त्रुटि / Error', 'कृपया सभी जानकारी भरें / Please fill all fields');
            return;
        }

        setLoading(true);
        try {
            const result = await api.onboardUser({
                ...formData,
                totalLandArea: parseFloat(formData.totalLandArea),
                latitude: parseFloat(formData.latitude),
                longitude: parseFloat(formData.longitude),
            });

            if (result.success) {
                Alert.alert('सफलता / Success', 'प्रोफाइल पूरी हो गई है / Profile completed successfully');
                navigation.replace('Home');
            } else {
                Alert.alert('त्रुटि / Error', result.message || 'Failed to complete profile');
            }
        } catch (error) {
            Alert.alert('त्रुटि / Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1B5E20" />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>प्रोफ़ाइल पूरी करें / Complete Profile</Text>
                <Text style={styles.headerSubtitle}>अपनी जानकारी साझा करें / Share your details</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>नाम / Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="आपका नाम / Your Name"
                            value={formData.name}
                            onChangeText={(text) => setFormData({ ...formData, name: text })}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>उपयोगकर्ता प्रकार / User Type</Text>
                        <View style={styles.typeSelector}>
                            <TouchableOpacity
                                style={[styles.typeBtn, formData.userType === 'farmer' && styles.typeBtnActive]}
                                onPress={() => setFormData({ ...formData, userType: 'farmer' })}>
                                <Text style={[styles.typeBtnText, formData.userType === 'farmer' && styles.typeBtnTextActive]}>किसान / Farmer</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.typeBtn, formData.userType === 'provider' && styles.typeBtnActive]}
                                onPress={() => setFormData({ ...formData, userType: 'provider' })}>
                                <Text style={[styles.typeBtnText, formData.userType === 'provider' && styles.typeBtnTextActive]}>प्रदाता / Provider</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>कुल भूमि क्षेत्र (एकड़) / Total Land Area (Acres)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="जैसे: 5.5"
                            keyboardType="decimal-pad"
                            value={formData.totalLandArea}
                            onChangeText={(text) => setFormData({ ...formData, totalLandArea: text })}
                        />
                    </View>

                    <View style={styles.inputRow}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                            <Text style={styles.inputLabel}>शहर / City</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="शहर / City"
                                value={formData.city}
                                onChangeText={(text) => setFormData({ ...formData, city: text })}
                            />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                            <Text style={styles.inputLabel}>राज्य / State</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="राज्य / State"
                                value={formData.state}
                                onChangeText={(text) => setFormData({ ...formData, state: text })}
                            />
                        </View>
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>भाषा / Language</Text>
                        <View style={styles.typeSelector}>
                            <TouchableOpacity
                                style={[styles.typeBtn, formData.language === 'hi' && styles.typeBtnActive]}
                                onPress={() => setFormData({ ...formData, language: 'hi' })}>
                                <Text style={[styles.typeBtnText, formData.language === 'hi' && styles.typeBtnTextActive]}>हिंदी / Hindi</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.typeBtn, formData.language === 'en' && styles.typeBtnActive]}
                                onPress={() => setFormData({ ...formData, language: 'en' })}>
                                <Text style={[styles.typeBtnText, formData.language === 'en' && styles.typeBtnTextActive]}>English / अंग्रेज़ी</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.submitBtn, loading && styles.btnDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                        activeOpacity={0.85}>
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.submitBtnText}>प्रोफ़ाइल सहेजें / Save Profile</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FFF8',
    },
    header: {
        backgroundColor: '#1B5E20',
        paddingTop: 48,
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFF',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#A5D6A7',
        marginTop: 4,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingTop: 24,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#424242',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#FFF',
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#E0E0E0',
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#212121',
    },
    inputRow: {
        flexDirection: 'row',
    },
    typeSelector: {
        flexDirection: 'row',
        backgroundColor: '#E8E8E8',
        borderRadius: 14,
        padding: 4,
    },
    typeBtn: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 10,
    },
    typeBtnActive: {
        backgroundColor: '#1B5E20',
    },
    typeBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
    },
    typeBtnTextActive: {
        color: '#FFF',
    },
    submitBtn: {
        backgroundColor: '#1B5E20',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 20,
        elevation: 3,
        shadowColor: '#1B5E20',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
    },
    btnDisabled: {
        opacity: 0.7,
    },
    submitBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
});

export default ProfileFormScreen;
