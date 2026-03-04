import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    StyleSheet,
    StatusBar,
    Platform,
    FlatList,
    Dimensions,
    Modal,
    Pressable
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { COLORS } from '../utils/constants';
import IrrigationAPI from '../services/IrrigationAPI';
import api from '../services/api';
import BackIconSvg from '../../assets/svg/BackIconSvg';

// Safe import for expo-location
let Location;
try {
    Location = require('expo-location');
} catch (e) {
    console.warn('expo-location not available');
}

const { width } = Dimensions.get('window');

const CROPS = [
    { value: 'wheat', label: 'Wheat', hindi: 'गेहूं', icon: 'W' },
    { value: 'rice', label: 'Rice', hindi: 'धान', icon: 'R' },
    { value: 'cotton', label: 'Cotton', hindi: 'कपास', icon: 'C' },
    { value: 'sugarcane', label: 'Sugarcane', hindi: 'गन्ना', icon: 'S' },
    { value: 'maize', label: 'Maize', hindi: 'मक्का', icon: 'M' },
    { value: 'potato', label: 'Potato', hindi: 'आलू', icon: 'P' }
];

const CROP_STAGES = [
    { value: 'initial', label: 'Initial', hindi: 'शुरुआत', icon: '1' },
    { value: 'development', label: 'Growing', hindi: 'विकास', icon: '2' },
    { value: 'mid', label: 'Mid-Season', hindi: 'मध्य', icon: '3' },
    { value: 'late', label: 'Late', hindi: 'देर से', icon: '4' },
    { value: 'flowering', label: 'Flowering', hindi: 'फूल आना', icon: '5' },
    { value: 'grain_filling', label: 'Grain Fill', hindi: 'दाना भरना', icon: '6' },
    { value: 'maturity', label: 'Maturity', hindi: 'पकना', icon: '7' }
];

const LANGUAGES = [
    { value: 'hi', label: 'Hindi', hindi: 'हिंदी', icon: 'HI' },
    { value: 'en', label: 'English', hindi: 'English', icon: 'EN' }
];

const DISTRICTS = [
    "Karnal", "Panipat", "Sonipat", "Rohtak", "Hisar", "Sirsa",
    "Fatehabad", "Jind", "Kaithal", "Kurukshetra", "Ambala", "Yamunanagar"
];

const CardSelector = ({ data, selectedValue, onSelect, label, small = false }) => (
    <View style={styles.selectorGroup}>
        <Text style={styles.label}>{label}</Text>
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardScroll}
        >
            {data.map((item) => {
                const isSelected = selectedValue === item.value;
                return (
                    <TouchableOpacity
                        key={item.value}
                        onPress={() => onSelect(item.value)}
                        style={[
                            styles.optionCard,
                            small && styles.optionCardSmall,
                            isSelected && styles.optionCardSelected
                        ]}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.optionIcon, small && styles.optionIconSmall]}>{item.icon}</Text>
                        <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                            {item.label}
                        </Text>
                        <Text style={[styles.optionHindi, isSelected && styles.optionHindiSelected]}>
                            {item.hindi}
                        </Text>
                        {isSelected && (
                            <View style={styles.checkBadge}>
                                <Text style={styles.checkText}>✓</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
    </View>
);

const FormInput = ({ label, value, onChangeText, placeholder, keyboardType, icon, editable = true }) => (
    <View style={styles.inputGroup}>
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.inputContainer, !editable && styles.inputDisabledContainer]}>
            <Text style={styles.inputIcon}>{icon}</Text>
            <TextInput
                style={[styles.input, !editable && styles.inputDisabledText]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={COLORS.textExtraLight}
                keyboardType={keyboardType}
                editable={editable}
            />
        </View>
    </View>
);

const CalendarModal = ({ visible, onClose, onSelect, initialDate }) => {
    const [viewDate, setViewDate] = useState(new Date(initialDate || new Date()));
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const renderDays = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const days = [];

        // Empty slots for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(<View key={`empty-${i}`} style={styles.calendarDayEmpty} />);
        }

        const today = new Date();
        const selected = initialDate ? new Date(initialDate) : null;

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const isToday = date.toDateString() === today.toDateString();
            const isSelected = selected && date.toDateString() === selected.toDateString();

            days.push(
                <TouchableOpacity
                    key={day}
                    style={[
                        styles.calendarDay,
                        isToday && styles.calendarDayToday,
                        isSelected && styles.calendarDaySelected
                    ]}
                    onPress={() => {
                        const formatted = date.toISOString().split('T')[0];
                        onSelect(formatted);
                        onClose();
                    }}
                >
                    <Text style={[
                        styles.calendarDayText,
                        isToday && styles.calendarDayTextToday,
                        isSelected && styles.calendarDayTextSelected
                    ]}>{day}</Text>
                </TouchableOpacity>
            );
        }
        return days;
    };

    const changeMonth = (offset) => {
        const newDate = new Date(viewDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setViewDate(newDate);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable style={styles.modalOverlay} onPress={onClose}>
                <View style={styles.calendarContainer}>
                    <View style={styles.calendarHeader}>
                        <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navBtn}>
                            <Text style={styles.navBtnText}>←</Text>
                        </TouchableOpacity>
                        <Text style={styles.calendarMonthName}>
                            {months[viewDate.getMonth()]} {viewDate.getFullYear()}
                        </Text>
                        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navBtn}>
                            <Text style={styles.navBtnText}>→</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.daysOfWeekContainer}>
                        {daysOfWeek.map(day => (
                            <Text key={day} style={styles.dayOfWeekText}>{day}</Text>
                        ))}
                    </View>

                    <View style={styles.calendarGrid}>
                        {renderDays()}
                    </View>

                    <TouchableOpacity style={styles.calendarCloseBtn} onPress={onClose}>
                        <Text style={styles.calendarCloseText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </Pressable>
        </Modal>
    );
};

export default function IrrigationRegistrationScreen({ navigation }) {
    const [formData, setFormData] = useState({
        phone: '+91',
        name: '',
        crop: 'wheat',
        cropStage: 'flowering',
        district: 'Karnal',
        sowingDate: new Date().toISOString().split('T')[0],
        areaAcres: '',
        lat: null,
        lon: null,
        language: 'hi'
    });
    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [step, setStep] = useState(1);

    const checkNext = () => {
        const missingFields = [];
        if (step === 1) {
            if (!formData.name.trim()) missingFields.push('Name (नाम)');
            if (formData.phone.replace(/[^0-9]/g, '').length < 10) missingFields.push('Phone (फोन नंबर)');
        } else if (step === 2) {
            if (!formData.crop) missingFields.push('Crop (फसल)');
            if (!formData.cropStage) missingFields.push('Growth Stage (फसल की अवस्था)');
            if (!formData.sowingDate) missingFields.push('Sowing Date (बुवाई की तारीख)');
            if (!formData.areaAcres) missingFields.push('Farm Area (खेत का क्षेत्रफल)');
        }

        if (missingFields.length > 0) {
            Alert.alert(
                'Missing Information / जानकारी कम है',
                `Please fill the following / कृपया इन्हें भरें:\n\n• ${missingFields.join('\n• ')}`
            );
            return false;
        }
        return true;
    };

    const handleNext = () => {
        if (checkNext()) {
            setStep(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        setStep(prev => prev - 1);
    };

    useEffect(() => {
        const prefillData = async () => {
            let userData = await api.getUserData();

            // If cache is empty, try to fetch fresh from profile API
            if (!userData.name || !userData.phone) {
                try {
                    const profileRes = await api.getProfile();
                    if (profileRes.success && profileRes.farmer) {
                        userData = await api.getUserData(); // Re-fetch from updated cache
                    }
                } catch (e) {
                    console.warn('Failed to fetch profile fallback', e);
                }
            }

            setFormData(prev => {
                const updatedData = {
                    ...prev,
                    name: userData.name || prev.name,
                    phone: userData.phone || prev.phone,
                    lat: userData.lat || prev.lat,
                    lon: userData.lon || prev.lon,
                    language: userData.language || prev.language,
                    areaAcres: userData.landArea ? userData.landArea.toString() : prev.areaAcres
                };

                // Match district if possible, or use the one from profile
                if (userData.district) {
                    updatedData.district = userData.district;
                }

                return updatedData;
            });
        };
        prefillData();
    }, []);

    const getLocation = async () => {
        try {
            setLocationLoading(true);

            let coords = null;

            // Attempt 1: Real GPS if available
            if (Location && Location.requestForegroundPermissionsAsync) {
                try {
                    const { status } = await Location.requestForegroundPermissionsAsync();
                    if (status === 'granted') {
                        const location = await Location.getCurrentPositionAsync({
                            accuracy: Location.Accuracy.Balanced,
                            timeout: 5000
                        });
                        coords = location.coords;
                    }
                } catch (gpsError) {
                    console.warn('GPS failed, trying IP fallback:', gpsError.message);
                }
            }

            // Attempt 2: IP-based Fallback (reliable in this environment)
            if (!coords) {
                try {
                    const response = await fetch('https://ipapi.co/json/');
                    const data = await response.json();
                    if (data.latitude && data.longitude) {
                        coords = { latitude: data.latitude, longitude: data.longitude };
                        // Also auto-fill district if missing
                        if (data.city) {
                            const matchedDistrict = DISTRICTS.find(d => d.toLowerCase() === data.city.toLowerCase());
                            if (matchedDistrict) {
                                setFormData(prev => ({ ...prev, district: matchedDistrict }));
                            }
                        }
                    }
                } catch (ipError) {
                    console.error('IP Location also failed:', ipError);
                }
            }

            if (coords) {
                setFormData(prev => ({
                    ...prev,
                    lat: coords.latitude,
                    lon: coords.longitude
                }));
                Alert.alert('Success', 'Location updated successfully!');
            } else {
                Alert.alert('Error', 'Could not determine location. Please enter manually.');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to get location.');
        } finally {
            setLocationLoading(false);
        }
    };

    const handleRegister = async () => {
        // Validation for final step
        const missingFields = [];
        if (!formData.district) missingFields.push('District (ज़िला)');

        if (missingFields.length > 0) {
            Alert.alert(
                'Missing Information / जानकारी कम है',
                `Please fill the following / कृपया इन्हें भरें:\n\n• ${missingFields.join('\n• ')}`
            );
            return;
        }

        setLoading(true);
        try {
            // Robust Phone Formatting
            let phoneDigits = formData.phone.replace(/[^0-9]/g, '');
            let formattedPhone = '';

            if (phoneDigits.length === 10) {
                formattedPhone = '+91' + phoneDigits;
            } else if (phoneDigits.length === 12 && phoneDigits.startsWith('91')) {
                formattedPhone = '+' + phoneDigits;
            } else if (phoneDigits.length === 13 && phoneDigits.startsWith('91')) {
                // If it already has 91 but maybe user entered some extra digit? Just take last 10
                formattedPhone = '+91' + phoneDigits.slice(-10);
            } else {
                // Try to use it as is but with +
                formattedPhone = formData.phone.startsWith('+') ? formData.phone : '+' + formData.phone;
            }

            // Clean payload: Remove null/undefined lat or lon, and align with new API payload
            const cleanPayload = {
                phone: formattedPhone,
                name: formData.name,
                crop: formData.crop,
                district: formData.district,
                sowingDate: formData.sowingDate,
                areaAcres: parseFloat(formData.areaAcres) || 0,
                language: formData.language
            };

            if (formData.lat !== null && formData.lat !== undefined) cleanPayload.lat = formData.lat;
            if (formData.lon !== null && formData.lon !== undefined) cleanPayload.lon = formData.lon;

            console.log('Registering with clean payload:', cleanPayload);
            const result = await IrrigationAPI.registerFarmer(cleanPayload);

            Alert.alert(
                'Registration Successful!',
                `Welcome ${result.name}!\n\nYou will receive:\n• Daily irrigation alerts at 5:45 PM\n• Weather alerts 24/7\n• Weekly summary on Sunday`,
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.replace('IrrigationMainApp')
                    }
                ]
            );
        } catch (error) {
            console.error('Registration Catch Error:', error);
            Alert.alert(
                'Registration Failed / पंजीकरण विफल',
                error.message || 'Server error. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <TouchableOpacity
                        onPress={() => {
                            if (step > 1) handlePrev();
                            else navigation.goBack();
                        }}
                        style={styles.backButton}
                    >
                        <BackIconSvg width={24} height={24} stroke={COLORS.primary} strokeWidth={2.5} />
                    </TouchableOpacity>
                    <Text style={styles.logoText}>KisanVoice AI</Text>
                    <View style={styles.infoBadge}>
                        <Text style={styles.infoText}>STEP {step} OF 3</Text>
                    </View>
                </View>

                {/* Progress bar visually indicating step */}
                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${(step / 3) * 100}%` }]} />
                </View>

                <Text style={styles.subtitle}>
                    {step === 1 && "Start by entering your basic contact details."}
                    {step === 2 && "Tell us about your crop for accurate water alerts."}
                    {step === 3 && "Where is your farm located?"}
                </Text>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.formCard}>
                    {step === 1 && (
                        <View style={styles.stepContainer}>
                            <FormInput
                                label="Full Name / पूरा नाम"
                                value={formData.name}
                                onChangeText={(text) => setFormData({ ...formData, name: text })}
                                placeholder="Enter your name"
                                icon=""
                            />

                            <FormInput
                                label="Phone Number / फ़ोन नंबर"
                                value={formData.phone}
                                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                                placeholder="+919876543210"
                                keyboardType="phone-pad"
                                icon=""
                            />

                            <CardSelector
                                label="Preferred Language / आपकी भाषा"
                                data={LANGUAGES}
                                selectedValue={formData.language}
                                onSelect={(val) => setFormData({ ...formData, language: val })}
                                small
                            />
                        </View>
                    )}

                    {step === 2 && (
                        <View style={styles.stepContainer}>
                            <View style={styles.quoteCard}>
                                <Text style={styles.quoteIcon}></Text>
                                <Text style={styles.quoteText}>
                                    "Farmers employing smart irrigation see up to a 30% reduction in water usage, boosting yields!"
                                </Text>
                            </View>

                            <CardSelector
                                label="Select Your Crop / फसल चुनें"
                                data={CROPS}
                                selectedValue={formData.crop}
                                onSelect={(val) => setFormData({ ...formData, crop: val })}
                            />

                            <CardSelector
                                label="Current Growth Stage / फसल की अवस्था"
                                data={CROP_STAGES}
                                selectedValue={formData.cropStage}
                                onSelect={(val) => setFormData({ ...formData, cropStage: val })}
                            />

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Sowing Date (बुवाई की तारीख)</Text>
                                <TouchableOpacity
                                    style={styles.inputContainer}
                                    onPress={() => setShowCalendar(true)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.inputIcon}>�</Text>
                                    <Text style={styles.input}>
                                        {formData.sowingDate || 'Select Sowing Date'}
                                    </Text>
                                    <Text style={{ fontSize: 18, color: COLORS.primary, marginRight: 15 }}>▼</Text>
                                </TouchableOpacity>

                                <CalendarModal
                                    visible={showCalendar}
                                    onClose={() => setShowCalendar(false)}
                                    onSelect={(date) => setFormData({ ...formData, sowingDate: date })}
                                    initialDate={formData.sowingDate}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <FormInput
                                    label="Total Area in Acres (एकड़ में कुल क्षेत्र)"
                                    value={formData.areaAcres}
                                    onChangeText={(text) => setFormData({ ...formData, areaAcres: text })}
                                    placeholder="e.g. 5.5"
                                    keyboardType="decimal-pad"
                                    icon=""
                                />
                            </View>
                        </View>
                    )}

                    {step === 3 && (
                        <View style={styles.stepContainer}>
                            <View style={styles.quoteCard}>
                                <Text style={styles.quoteIcon}></Text>
                                <Text style={styles.quoteText}>
                                    "Location data helps us cross-reference local weather patterns to tell you exactly when to water."
                                </Text>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>District / ज़िला</Text>
                                <View style={styles.pickerWrapper}>
                                    <Text style={styles.inputIcon}>Loc</Text>
                                    <Picker
                                        selectedValue={formData.district}
                                        onValueChange={(val) => setFormData({ ...formData, district: val })}
                                        style={styles.picker}
                                    >
                                        {(() => {
                                            const items = [...DISTRICTS];
                                            if (formData.district && !DISTRICTS.some(d => d.toLowerCase() === formData.district.toLowerCase())) {
                                                items.push(formData.district);
                                            }
                                            return items.map(d => (
                                                <Picker.Item key={d} label={d} value={d} />
                                            ));
                                        })()}
                                    </Picker>
                                </View>
                            </View>

                            <View style={styles.coordinateRow}>
                                <View style={[styles.coordBox, { marginRight: 8 }]}>
                                    <Text style={styles.coordLabel}>Latitude</Text>
                                    <Text style={styles.coordValue}>{formData.lat?.toFixed(4) || 'Detecting...'}</Text>
                                </View>
                                <View style={[styles.coordBox, { marginLeft: 8 }]}>
                                    <Text style={styles.coordLabel}>Longitude</Text>
                                    <Text style={styles.coordValue}>{formData.lon?.toFixed(4) || 'Detecting...'}</Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.locationBtn, formData.lat && styles.locationBtnSuccess]}
                                onPress={getLocation}
                                disabled={locationLoading}
                            >
                                {locationLoading ? (
                                    <ActivityIndicator color={COLORS.primary} />
                                ) : (
                                    <>
                                        <Text style={styles.locationIcon}>GPS</Text>
                                        <Text style={styles.locationText}>
                                            {formData.lat ? 'Update GPS Position' : 'Capture GPS Coordinates'}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.wizardNavRow}>
                        {step > 1 && (
                            <TouchableOpacity style={styles.prevBtn} onPress={handlePrev}>
                                <Text style={styles.prevBtnText}>Back</Text>
                            </TouchableOpacity>
                        )}

                        {step < 3 ? (
                            <TouchableOpacity style={[styles.nextBtn, step === 1 && { flex: 1 }]} onPress={handleNext}>
                                <Text style={styles.nextBtnText}>Continue</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={[styles.registerBtn, loading && styles.btnDisabled]}
                                onPress={handleRegister}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.registerBtnText}>Submit</Text>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>

                    <Text style={styles.footerNote}>
                        Your data is securely stored and used only to provide smart agricultural advice.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        backgroundColor: COLORS.background,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 20,
        paddingHorizontal: 25,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    backButton: {
        marginRight: 12,
        padding: 4,
        marginLeft: -4,
    },
    logoText: {
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.primary,
        letterSpacing: 1,
        flex: 1,
    },
    infoBadge: {
        backgroundColor: COLORS.primaryExtraLight,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    infoText: {
        fontSize: 10,
        fontWeight: '900',
        color: COLORS.primary,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textLight,
        fontWeight: '600',
        lineHeight: 20,
    },
    scrollContent: {
        padding: 20,
    },
    formCard: {
        backgroundColor: '#fff',
        borderRadius: 28,
        padding: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        paddingBottom: 40,
    },
    label: {
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 12,
        marginLeft: 4,
        letterSpacing: 0.5,
    },
    inputGroup: {
        marginBottom: 25,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#F3F4F6',
        paddingHorizontal: 15,
    },
    inputDisabledContainer: {
        backgroundColor: '#F3F4F6',
        borderColor: '#E5E7EB',
    },
    inputIcon: {
        fontSize: 18,
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 55,
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
    },
    inputDisabledText: {
        color: COLORS.textExtraLight,
    },
    selectorGroup: {
        marginBottom: 25,
    },
    cardScroll: {
        paddingRight: 20,
    },
    optionCard: {
        width: 100,
        height: 120,
        backgroundColor: '#F9FAFB',
        borderRadius: 24,
        padding: 15,
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#F3F4F6',
        position: 'relative',
    },
    optionCardSmall: {
        width: 80,
        height: 90,
        borderRadius: 20,
        padding: 10,
    },
    optionCardSelected: {
        backgroundColor: COLORS.primaryExtraLight,
        borderColor: COLORS.primary,
    },
    optionIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    optionIconSmall: {
        fontSize: 24,
        marginBottom: 4,
    },
    optionLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: COLORS.textLight,
        textAlign: 'center',
    },
    optionLabelSelected: {
        color: COLORS.primary,
    },
    optionHindi: {
        fontSize: 10,
        color: COLORS.textExtraLight,
        marginTop: 2,
    },
    optionHindiSelected: {
        color: COLORS.primary,
        opacity: 0.8,
    },
    checkBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '900',
    },
    pickerWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#F3F4F6',
        paddingHorizontal: 15,
        height: 55,
    },
    picker: {
        flex: 1,
        height: 55,
        marginLeft: -5,
    },
    coordinateRow: {
        flexDirection: 'row',
        marginBottom: 15,
    },
    coordBox: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        borderRadius: 20,
        padding: 15,
        borderWidth: 1.5,
        borderColor: '#F3F4F6',
    },
    coordLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: COLORS.textExtraLight,
        letterSpacing: 1,
        marginBottom: 4,
    },
    coordValue: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.text,
    },
    locationBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 55,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        marginTop: 5,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    locationBtnSuccess: {
        backgroundColor: '#ECFDF5',
        borderColor: COLORS.primary,
    },
    locationIcon: {
        fontSize: 18,
        marginRight: 10,
    },
    locationText: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.textLight,
    },
    registerBtn: {
        flex: 1,
        backgroundColor: COLORS.primary,
        height: 60,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    btnDisabled: {
        opacity: 0.6,
    },
    registerBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    // Multi-Step Wizard Styles
    progressBarBg: {
        height: 6,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        marginTop: 15,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 3,
    },
    stepContainer: {
        paddingBottom: 20,
    },
    quoteCard: {
        backgroundColor: '#ECFDF5',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 25,
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
    },
    quoteIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    quoteText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.textLight,
        fontStyle: 'italic',
        lineHeight: 20,
    },
    wizardNavRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        gap: 15,
    },
    prevBtn: {
        flex: 1,
        height: 60,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
    },
    prevBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.textLight,
    },
    nextBtn: {
        flex: 1,
        height: 60,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    nextBtnText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#fff',
    },
    footerNote: {
        fontSize: 12,
        color: COLORS.textExtraLight,
        textAlign: 'center',
        marginTop: 25,
        lineHeight: 18,
        paddingHorizontal: 10,
    },
    // Calendar Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    calendarContainer: {
        width: width * 0.9,
        backgroundColor: '#fff',
        borderRadius: 28,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    calendarMonthName: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.text,
    },
    navBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    navBtnText: {
        fontSize: 20,
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    daysOfWeekContainer: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    dayOfWeekText: {
        flex: 1,
        textAlign: 'center',
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.textExtraLight,
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    calendarDay: {
        width: `${100 / 7}%`,
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        marginBottom: 4,
    },
    calendarDayEmpty: {
        width: `${100 / 7}%`,
        aspectRatio: 1,
    },
    calendarDayText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    calendarDayToday: {
        backgroundColor: COLORS.primaryExtraLight,
    },
    calendarDayTextToday: {
        color: COLORS.primary,
        fontWeight: '800',
    },
    calendarDaySelected: {
        backgroundColor: COLORS.primary,
    },
    calendarDayTextSelected: {
        color: '#fff',
        fontWeight: '800',
    },
    calendarCloseBtn: {
        marginTop: 20,
        alignItems: 'center',
        paddingVertical: 10,
    },
    calendarCloseText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.textLight,
    },
});
