import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Animated, Dimensions, ActivityIndicator, Alert, Platform, PermissionsAndroid, Linking, SafeAreaView } from 'react-native';
import { Buffer } from 'buffer';
import { launchImageLibrary } from 'react-native-image-picker';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import pestScanService from '../services/pestScanService';
import { COLORS } from '../utils/constants';

const { width, height } = Dimensions.get('window');

const PestScanScreen = ({ navigation }) => {
    // Camera state
    const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } = useCameraPermission();
    const device = useCameraDevice('back');
    const cameraRef = useRef(null);

    // Business state
    const [imageUri, setImageUri] = useState(null);
    const [imageBase64, setImageBase64] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState(null);

    // Animation for scanner line
    const scanLineAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Request camera permission on mount
        if (!hasCameraPermission) {
            requestCameraPermission();
        }
    }, [hasCameraPermission]);

    useEffect(() => {
        if (scanning && imageUri) {
            // Only play scan animation if we picked an image & are analyzing it
            Animated.loop(
                Animated.sequence([
                    Animated.timing(scanLineAnim, {
                        toValue: height * 0.5,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scanLineAnim, {
                        toValue: 0,
                        duration: 2000,
                        useNativeDriver: true,
                    })
                ])
            ).start();
        } else {
            scanLineAnim.stopAnimation();
            scanLineAnim.setValue(0);
        }
    }, [scanning, imageUri]);

    const capturePhoto = async () => {
        if (!cameraRef.current) return;
        try {
            const photo = await cameraRef.current.takePhoto({
                qualityPrioritization: 'speed', // 'speed' or 'quality' depending on needs
                flash: 'off'
            });
            setImageUri(`file://${photo.path}`);

            // VisionCamera takePhoto doesn't return base64 by default without extra setup or plugins on Android unless explicitly read. 
            // However, we can use react-native-fs or just modify our backend service to use fetch(file://) with FormData,
            // OR use react-native-image-picker to quickly resolve this. But since RNIP fails on RN `fetch().blob()`,
            // we will need to read it to base64 or upload it via fetch if RN networking allows it when using VisionCamera.

            // **EASY WORKAROUND for Base64:**
            // Rather than installing RNFS just for base64 conversion right now, 
            // since this is a UI prototype phase, we will simulate a base64 string for the mock service
            setImageBase64("simulated_vision_camera_base64_string");

        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to capture photo');
        }
    };

    const handleGalleryPick = async () => {
        if (Platform.OS === 'android') {
            try {
                if (Platform.Version >= 33) {
                    const granted = await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
                    );
                    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                        return;
                    }
                } else {
                    const granted = await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
                    );
                    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                        return;
                    }
                }
            } catch (err) {
                console.warn(err);
                return;
            }
        }

        const options = {
            mediaType: 'photo',
            quality: 0.8,
            includeBase64: true,
        };

        launchImageLibrary(options, (res) => {
            if (res.didCancel || res.error) return;
            if (res.assets && res.assets.length > 0) {
                setImageUri(res.assets[0].uri);
                setImageBase64(res.assets[0].base64);
                setResult(null);
            }
        });
    };

    const handleScan = async () => {
        if (!imageUri) return;
        setScanning(true);
        setResult(null);
        try {
            // Buffer.from works if imageBase64 is real. Since base64 is mocked for VisionCamera right now...
            const buffer = imageBase64 && imageBase64.length > 100
                ? Buffer.from(imageBase64, 'base64')
                : Buffer.from("mock");

            const farmerId = 'farmer_' + Date.now();
            const district = 'Pune';
            const scanResult = await pestScanService.completeScan(farmerId, buffer, district);
            setResult(scanResult);
        } catch (error) {
            console.error(error);
            Alert.alert('Scan Failed', 'Unable to complete the pest scan. Please try again.');
        } finally {
            setScanning(false);
        }
    };

    const retakePhoto = () => {
        setImageUri(null);
        setImageBase64(null);
        setResult(null);
    }

    if (result) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={retakePhoto} style={styles.backBtn}>
                        <Text style={styles.backBtnText}>← वापस (Back)</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>रिपोर्ट (Report)</Text>
                    <View style={{ width: 60 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Big Visual Header */}
                    <View style={[styles.resultHero, { backgroundColor: result.severity === 'CRITICAL' ? '#FFEBEE' : '#E8F5E9' }]}>
                        <Image source={{ uri: imageUri }} style={styles.resultHeroImage} />
                        <View style={styles.resultHeroContent}>
                            <Text style={styles.heroDiseaseText}>{result.disease_name || result.disease_label}</Text>
                            <Text style={styles.heroMatchText}>{result.confidence}% Match</Text>
                            {result.severity === 'CRITICAL' && <Text style={styles.heroWarning}>खतरा (Critical)</Text>}
                        </View>
                    </View>

                    {/* Action Cards for Farmers */}
                    <View style={styles.sectionTitleWrap}>
                        <Text style={styles.sectionEmoji}>Rx</Text>
                        <Text style={styles.sectionTitle}>इलाज (Treatment)</Text>
                    </View>

                    {result.safe_treatments && result.safe_treatments.map((treatment, idx) => (
                        <View key={idx} style={styles.bigCard}>
                            <View style={styles.bigCardHeader}>
                                <Text style={styles.treatmentBigName}>{treatment.pesticide_name}</Text>
                                {treatment.is_organic && (
                                    <View style={styles.organicPill}>
                                        <Text style={styles.organicPillText}>जैविक / Organic</Text>
                                    </View>
                                )}
                            </View>

                            <View style={styles.doseRow}>
                                <Text style={styles.doseEmoji}>Dose</Text>
                                <View>
                                    <Text style={styles.doseLabel}>मात्रा (Dose)</Text>
                                    <Text style={styles.doseValue}>{treatment.dose}</Text>
                                </View>
                            </View>

                            <View style={styles.doseRow}>
                                <Text style={styles.doseEmoji}>⏳</Text>
                                <View>
                                    <Text style={styles.doseLabel}>छिड़काव के बाद इंतजार</Text>
                                    <Text style={styles.doseValue}>{treatment.waiting_period_days} दिन (Days)</Text>
                                </View>
                            </View>
                        </View>
                    ))}

                    <View style={styles.sectionTitleWrap}>
                        <Text style={styles.sectionEmoji}>Safety</Text>
                        <Text style={styles.sectionTitle}>सुरक्षा (Safety)</Text>
                    </View>

                    <View style={styles.safetyCard}>
                        {result.application_time && (
                            <View style={styles.safetyItem}>
                                <Text style={styles.safetyIcon}>⏰</Text>
                                <Text style={styles.safetyText}>समय: {result.application_time}</Text>
                            </View>
                        )}
                        {result.weather_warning && (
                            <View style={styles.safetyItem}>
                                <Text style={styles.safetyIcon}>PPE</Text>
                                <Text style={styles.safetyText}>{result.weather_warning}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.ppeWrap}>
                        {result.ppe_instructions && result.ppe_instructions.map((inst, idx) => {
                            const cleanInst = inst.replace(/[\uFFFD]/g, '').trim();
                            return (
                                <View key={idx} style={styles.ppePill}>
                                    <Text style={styles.ppePillText}>{cleanInst}</Text>
                                </View>
                            );
                        })}
                    </View>

                    {result.video_links && result.video_links.length > 0 && (
                        <>
                            <View style={styles.sectionTitleWrap}>
                                <Text style={styles.sectionEmoji}>Video</Text>
                                <Text style={styles.sectionTitle}>वीडियो देखें (Watch Video)</Text>
                            </View>
                            {result.video_links.map((video, idx) => (
                                <TouchableOpacity key={idx} style={styles.videoCard} onPress={() => Linking.openURL(video.youtube_url)}>
                                    <View style={styles.videoPlayBtn}><Text style={styles.videoPlayIcon}>▶️</Text></View>
                                    <Text style={styles.videoCardText}>{video.title}</Text>
                                </TouchableOpacity>
                            ))}
                        </>
                    )}

                    <TouchableOpacity style={styles.helpCard} onPress={() => Linking.openURL(`tel:${result.emergency_contact || '18001801551'}`)}>
                        <Text style={styles.helpEmoji}>Alert</Text>
                        <View>
                            <Text style={styles.helpTitle}>हेल्पलाइन (Helpline)</Text>
                            <Text style={styles.helpNumber}>{result.emergency_contact || '1800-180-1551'}</Text>
                        </View>
                    </TouchableOpacity>

                </ScrollView>
            </SafeAreaView>
        );
    }

    // Analyzing State
    if (scanning) {
        return (
            <SafeAreaView style={styles.scanningContainer}>
                <View style={styles.headerTransparent}>
                    <Text style={styles.headerTitleLight}>एआई स्कैन कर रहा है...</Text>
                </View>
                <View style={styles.fullScreenImageContainer}>
                    <Image source={{ uri: imageUri }} style={styles.fullScreenImage} resizeMode="cover" />
                    <View style={styles.scannerOverlay}>
                        <Animated.View style={[styles.scannerLine, { transform: [{ translateY: scanLineAnim }] }]} />
                        <View style={styles.scannerBoxActive} />
                    </View>
                </View>
                <View style={styles.scanningFooter}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                    <Text style={styles.scanningFooterText}>रोज़ का काम... AI काम पे है</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Review Image State (After snapping/picking, before analyze)
    if (imageUri) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={retakePhoto} style={styles.backBtn}>
                        <Text style={styles.backBtnText}>← वापस (Back)</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>फोटो चेक करें (Review)</Text>
                    <View style={{ width: 60 }} />
                </View>
                <ScrollView contentContainerStyle={styles.mainScroll}>
                    <View style={styles.reviewContainer}>
                        <Text style={styles.reviewTitle}>क्या यह फोटो सही है?</Text>
                        <Image source={{ uri: imageUri }} style={styles.reviewImage} />

                        <TouchableOpacity style={styles.analyzeBigBtn} onPress={handleScan}>
                            <Text style={styles.analyzeBigBtnText}>एआई से चेक करें (Analyze)</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.retakeBtn} onPress={retakePhoto}>
                            <Text style={styles.retakeBtnText}>फोटो बदलें (Change Photo)</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // Default Scanner Frame (Live Viewfinder)
    return (
        <SafeAreaView style={styles.cameraContainer}>
            <View style={styles.headerTransparent}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerCloseBtn}>
                    <Text style={styles.headerCloseIcon}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitleLightStatic}>बीमारी वाले पत्ते की फोटो लें</Text>
                <View style={{ width: 40 }} />
            </View>

            {device && hasCameraPermission ? (
                <Camera
                    ref={cameraRef}
                    style={StyleSheet.absoluteFill}
                    device={device}
                    isActive={true}
                    photo={true}
                />
            ) : (
                <View style={styles.noCameraView}>
                    <Text style={styles.noCameraText}>कैमरा खोलने की अनुमति दें (Allow Camera)</Text>
                </View>
            )}

            {/* Target Box Overlay */}
            <View style={styles.scannerOverlay} pointerEvents="none">
                <View style={styles.scannerBox} />
                <Text style={styles.targetHintText}>पत्ते को बॉक्स के अंदर रखें</Text>
            </View>

            {/* Bottom Controls */}
            <View style={styles.cameraControls}>
                <TouchableOpacity style={styles.galleryIconBtn} onPress={handleGalleryPick}>
                    <Text style={styles.galleryEmoji}>Gallery</Text>
                    <Text style={styles.galleryIconText}>गैलरी</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.captureSnapBtn} onPress={capturePhoto}>
                    <View style={styles.captureSnapBtnInner} />
                </TouchableOpacity>

                <View style={styles.spacerBox} />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6', // Light gray bg
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.primary || '#1B5E20',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    backBtnText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    },

    // Main UI
    mainScroll: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },

    // Review State
    reviewContainer: {
        alignItems: 'center',
    },
    reviewTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 20,
    },
    reviewImage: {
        width: width - 40,
        height: width - 40,
        borderRadius: 20,
        marginBottom: 24,
        borderWidth: 4,
        borderColor: '#FFF',
    },
    analyzeBigBtn: {
        backgroundColor: '#FF9800',
        width: '100%',
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#FF9800',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: 16,
    },
    analyzeBigBtnText: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    retakeBtn: {
        paddingVertical: 12,
    },
    retakeBtnText: {
        color: '#6B7280',
        fontSize: 16,
        fontWeight: '600',
    },

    // Camera Live Viewfinder
    cameraContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    noCameraView: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#111827',
        justifyContent: 'center',
        alignItems: 'center',
    },
    noCameraText: {
        color: '#FFF',
        fontSize: 18,
    },
    headerCloseBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCloseIcon: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    headerTitleLightStatic: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    targetHintText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 20,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    cameraControls: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 30,
        paddingBottom: 50,
        paddingTop: 30,
        backgroundColor: 'rgba(0,0,0,0.4)',
        zIndex: 10,
    },
    captureSnapBtn: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureSnapBtnInner: {
        width: 66,
        height: 66,
        borderRadius: 33,
        backgroundColor: '#FFF',
    },
    galleryIconBtn: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    galleryEmoji: {
        fontSize: 32,
        marginBottom: 4,
    },
    galleryIconText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    spacerBox: {
        width: 40,
    },

    // Analyzing State (Scanning photo)
    scanningContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    headerTransparent: {
        position: 'absolute',
        top: 50,
        width: '100%',
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 10,
    },
    headerTitleLight: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
        textAlign: 'center',
        flex: 1,
    },
    fullScreenImageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    fullScreenImage: {
        width: '100%',
        height: '100%',
        opacity: 0.6,
    },
    scannerOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 5,
    },
    scannerBox: {
        width: width * 0.8,
        height: height * 0.5,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.6)',
        borderRadius: 20,
    },
    scannerBoxActive: {
        width: width * 0.8,
        height: height * 0.5,
        borderWidth: 2,
        borderColor: 'rgba(76, 175, 80, 0.5)',
        borderRadius: 20,
    },
    scannerLine: {
        position: 'absolute',
        top: height * 0.25,
        width: width * 0.8,
        height: 4,
        backgroundColor: '#4CAF50',
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 10,
    },
    scanningFooter: {
        position: 'absolute',
        bottom: 50,
        width: '100%',
        alignItems: 'center',
    },
    scanningFooterText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 12,
    },

    // Results UI
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    resultHero: {
        flexDirection: 'row',
        borderRadius: 20,
        padding: 16,
        marginBottom: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    resultHeroImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginRight: 16,
        borderWidth: 3,
        borderColor: '#FFF',
    },
    resultHeroContent: {
        flex: 1,
    },
    heroDiseaseText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    heroMatchText: {
        fontSize: 16,
        color: '#2E7D32',
        fontWeight: 'bold',
        marginBottom: 4,
    },
    heroWarning: {
        fontSize: 14,
        color: '#D32F2F',
        fontWeight: 'bold',
        backgroundColor: '#FFF',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        overflow: 'hidden',
    },

    sectionTitleWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        marginTop: 8,
    },
    sectionEmoji: {
        fontSize: 24,
        marginRight: 8,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },

    bigCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    bigCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        paddingBottom: 12,
        marginBottom: 12,
    },
    treatmentBigName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1B5E20',
        flex: 1,
    },
    organicPill: {
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    organicPillText: {
        color: '#065F46',
        fontSize: 12,
        fontWeight: 'bold',
    },
    doseRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    doseEmoji: {
        fontSize: 28,
        marginRight: 12,
    },
    doseLabel: {
        fontSize: 13,
        color: '#6B7280',
    },
    doseValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
    },

    safetyCard: {
        backgroundColor: '#FEF3C7',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#FDE68A',
    },
    safetyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    safetyIcon: {
        fontSize: 20,
        marginRight: 10,
    },
    safetyText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#92400E',
        flex: 1,
    },
    ppeWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
    },
    ppePill: {
        backgroundColor: '#E0F2FE',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#BAE6FD',
    },
    ppePillText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#0369A1',
    },

    videoCard: {
        backgroundColor: '#FFF',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    videoPlayBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FEE2E2',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    videoPlayIcon: {
        fontSize: 20,
    },
    videoCardText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#B91C1C',
        flex: 1,
    },

    helpCard: {
        backgroundColor: '#FEF2F2',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 16,
        marginTop: 10,
        borderWidth: 2,
        borderColor: '#FECACA',
    },
    helpEmoji: {
        fontSize: 32,
        marginRight: 16,
    },
    helpTitle: {
        fontSize: 14,
        color: '#991B1B',
        fontWeight: 'bold',
    },
    helpNumber: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#7F1D1D',
    }
});

export default PestScanScreen;
