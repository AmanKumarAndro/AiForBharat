import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Platform,
} from 'react-native';
import { COLORS } from '../utils/constants';
import CROP_IRRIGATION_MAP from '../data/cropIrrigationMap';
import BackIconSvg from '../../assets/svg/BackIconSvg';

const IrrigationSetupScreen = ({ navigation }) => {
    const [selectedCrop, setSelectedCrop] = useState(null);
    const [sowingDate, setSowingDate] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const crops = Object.entries(CROP_IRRIGATION_MAP).map(([key, value]) => ({
        key,
        ...value,
    }));

    // Generate recent date options (last 30 days + today)
    const dateOptions = [];
    for (let i = 30; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        dateOptions.push(d);
    }

    const formatDate = (date) => {
        if (!date) return '';
        const day = date.getDate();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${day} ${months[date.getMonth()]}`;
    };

    const formatDateFull = (date) => {
        if (!date) return '';
        const day = date.getDate();
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return `${day} ${months[date.getMonth()]} ${date.getFullYear()}`;
    };

    const handleGenerateSchedule = () => {
        if (!selectedCrop || !sowingDate) return;

        navigation.navigate('IrrigationSchedule', {
            cropKey: selectedCrop,
            sowingDate: sowingDate.toISOString(),
        });
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <BackIconSvg width={26} height={26} stroke="#FFF" strokeWidth={2.5} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>सिंचाई कैलेंडर</Text>
                <Text style={styles.headerSubtitle}>Irrigation Calendar</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Step 1: Select Crop */}
                <View style={styles.section}>
                    <View style={styles.stepBadge}>
                        <Text style={styles.stepNum}>1</Text>
                    </View>
                    <Text style={styles.sectionTitle}>फसल चुनें / Select Crop</Text>
                    <View style={styles.cropGrid}>
                        {crops.map(crop => (
                            <TouchableOpacity
                                key={crop.key}
                                style={[
                                    styles.cropCard,
                                    selectedCrop === crop.key && styles.cropCardSelected,
                                ]}
                                onPress={() => setSelectedCrop(crop.key)}>
                                <Text style={styles.cropIcon}>{crop.icon}</Text>
                                <Text style={[
                                    styles.cropName,
                                    selectedCrop === crop.key && styles.cropNameSelected
                                ]}>{crop.nameHi}</Text>
                                <Text style={[
                                    styles.cropNameEn,
                                    selectedCrop === crop.key && styles.cropNameEnSelected
                                ]}>{crop.nameEn}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Step 2: Select Sowing Date */}
                <View style={styles.section}>
                    <View style={styles.stepBadge}>
                        <Text style={styles.stepNum}>2</Text>
                    </View>
                    <Text style={styles.sectionTitle}>बुवाई की तारीख / Sowing Date</Text>

                    {sowingDate && (
                        <View style={styles.selectedDateCard}>
                            <Text style={styles.selectedDateIcon}>Date:</Text>
                            <Text style={styles.selectedDateText}>{formatDateFull(sowingDate)}</Text>
                            <TouchableOpacity onPress={() => setSowingDate(null)}>
                                <Text style={styles.changeDateText}>Change</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
                        {dateOptions.map((date, idx) => {
                            const isToday = idx === dateOptions.length - 1;
                            const isSelected = sowingDate && date.toDateString() === sowingDate.toDateString();
                            return (
                                <TouchableOpacity
                                    key={idx}
                                    style={[
                                        styles.dateChip,
                                        isSelected && styles.dateChipSelected,
                                        isToday && !isSelected && styles.dateChipToday,
                                    ]}
                                    onPress={() => setSowingDate(date)}>
                                    <Text style={[
                                        styles.dateChipText,
                                        isSelected && styles.dateChipTextSelected,
                                    ]}>
                                        {isToday ? 'Today' : formatDate(date)}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Summary Preview */}
                {selectedCrop && sowingDate && (
                    <View style={styles.previewCard}>
                        <Text style={styles.previewIcon}>{CROP_IRRIGATION_MAP[selectedCrop].icon}</Text>
                        <Text style={styles.previewTitle}>
                            {CROP_IRRIGATION_MAP[selectedCrop].nameHi} — {CROP_IRRIGATION_MAP[selectedCrop].nameEn}
                        </Text>
                        <Text style={styles.previewDetail}>
                            बुवाई: {formatDateFull(sowingDate)}
                        </Text>
                        <Text style={styles.previewDetail}>
                            कुल अवधि: {CROP_IRRIGATION_MAP[selectedCrop].totalDuration} दिन
                        </Text>
                        <Text style={styles.previewDetail}>
                            सिंचाई चरण: {CROP_IRRIGATION_MAP[selectedCrop].stages.length} stages
                        </Text>
                    </View>
                )}

                {/* Generate Button */}
                <TouchableOpacity
                    style={[
                        styles.generateBtn,
                        (!selectedCrop || !sowingDate) && styles.generateBtnDisabled,
                    ]}
                    onPress={handleGenerateSchedule}
                    disabled={!selectedCrop || !sowingDate}>
                    <Text style={styles.generateBtnText}>
                        सिंचाई शेड्यूल देखें / View Schedule
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFBFC',
    },
    header: {
        backgroundColor: '#1B5E20',
        paddingTop: 16,
        paddingBottom: 20,
        paddingHorizontal: 16,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    backBtn: {
        marginBottom: 8,
    },
    backText: {
        fontSize: 24,
        color: '#FFF',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFF',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#B3E5FC',
        marginTop: 2,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 24,
    },
    stepBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#1B5E20',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    stepNum: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFF',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 12,
    },
    cropGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    cropCard: {
        width: '30%',
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 14,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    cropCardSelected: {
        borderColor: '#1B5E20',
        backgroundColor: '#E8F5E9',
    },
    cropIcon: {
        fontSize: 32,
        marginBottom: 6,
    },
    cropName: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    cropNameSelected: {
        color: '#1B5E20',
    },
    cropNameEn: {
        fontSize: 10,
        color: COLORS.textLight,
        marginTop: 2,
    },
    cropNameEnSelected: {
        color: '#1B5E20',
    },
    selectedDateCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    selectedDateIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    selectedDateText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1B5E20',
        flex: 1,
    },
    changeDateText: {
        fontSize: 13,
        color: '#0288D1',
        fontWeight: '600',
    },
    dateScroll: {
        marginTop: 4,
    },
    dateChip: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#FFF',
        marginRight: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    dateChipSelected: {
        backgroundColor: '#1B5E20',
        borderColor: '#1B5E20',
    },
    dateChipToday: {
        borderColor: '#1B5E20',
    },
    dateChipText: {
        fontSize: 13,
        color: COLORS.text,
        fontWeight: '500',
    },
    dateChipTextSelected: {
        color: '#FFF',
    },
    previewCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        marginBottom: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    previewIcon: {
        fontSize: 48,
        marginBottom: 8,
    },
    previewTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 8,
    },
    previewDetail: {
        fontSize: 14,
        color: COLORS.textLight,
        marginBottom: 4,
    },
    generateBtn: {
        backgroundColor: '#1B5E20',
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
        marginTop: 8,
    },
    generateBtnDisabled: {
        backgroundColor: '#B0BEC5',
    },
    generateBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
});

export default IrrigationSetupScreen;
