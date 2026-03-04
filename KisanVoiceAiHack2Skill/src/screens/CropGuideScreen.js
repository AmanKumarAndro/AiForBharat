import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import Header from '../components/Header';
import { COLORS } from '../utils/constants';

const CropGuideScreen = () => {
  const steps = [
    {
      number: 1,
      title: 'बीज का चयन करें',
      description: 'बेहतर अनाज उत्पादन के लिए उच्च गुणवत्ता वाली किस्में चुनें। गुणवत्ता की बारीकी से जाँच करें।',
    },
    {
      number: 2,
      title: 'मिट्टी तैयार करें',
      description: 'मिट्टी को नहीं जुताई करें और पानी का स्तर ठीक रखें।',
    },
    {
      number: 3,
      title: 'खाद और पोषक',
      description: '',
    },
  ];

  const safetyItems = [
    { icon: '', label: 'मास्क पहनें' },
    { icon: '', label: 'दस्ताने पहनें' },
    { icon: '', label: 'चश्मा लगाएं' },
    { icon: '', label: 'सुरक्षात्मक कपड़े' },
  ];

  return (
    <View style={styles.container}>
      <Header title="कृषि सलाह" />

      <ScrollView style={styles.content}>
        {/* Source Badge */}
        <View style={styles.sourceBadge}>
          <Text style={styles.sourceIcon}>✓</Text>
          <View style={styles.sourceInfo}>
            <Text style={styles.sourceTitle}>ICAR/सरकार द्वारा सत्यापित</Text>
            <Text style={styles.sourceDate}>अंतिम अपडेट: 24 Oct 2023</Text>
          </View>
          <View style={styles.statusDot} />
        </View>

        {/* Video Tutorial */}
        <View style={styles.videoCard}>
          <View style={styles.videoThumbnail}>
            <Text style={styles.videoEmoji}></Text>
            <View style={styles.playButton}>
              <Text style={styles.playIcon}>▶️</Text>
            </View>
          </View>
          <Text style={styles.videoTitle}>वीडियो ट्यूटोरियल देखें</Text>
        </View>

        {/* Step by Step Instructions */}
        <Text style={styles.sectionTitle}>चरण-दर-चरण निर्देश</Text>

        {steps.map((step, index) => (
          <View key={index} style={styles.stepCard}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{step.number}</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              {step.description ? (
                <Text style={styles.stepDescription}>{step.description}</Text>
              ) : null}
            </View>
          </View>
        ))}

        {/* Action Buttons */}
        <TouchableOpacity style={styles.offlineButton}>
          <Text style={styles.offlineIcon}>Save</Text>
          <Text style={styles.offlineText}>ऑफलाइन सेव करें</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.whatsappButton}>
          <Text style={styles.whatsappIcon}>Share</Text>
          <Text style={styles.whatsappText}>WhatsApp</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.audioButton}>
          <Text style={styles.audioIcon}>Audio</Text>
          <Text style={styles.audioText}>ऑडियो ट्यूटोरियल देखें</Text>
        </TouchableOpacity>

        <Text style={styles.timeNote}>का समय लगता है।</Text>

        {/* Safety Section */}
        <View style={styles.safetySection}>
          <Text style={styles.safetyTitle}>सुरक्षा चेकलिस्ट (Safety)</Text>

          <View style={styles.safetyGrid}>
            {safetyItems.map((item, index) => (
              <View key={index} style={styles.safetyCard}>
                <Text style={styles.safetyIcon}>{item.icon}</Text>
                <Text style={styles.safetyLabel}>{item.label}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.safetyNote}>
            * इस्तेमाल से पहले हमेशा सुरक्षा उपकरण पहनें
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  sourceIcon: {
    fontSize: 20,
    color: COLORS.primary,
    marginRight: 12,
  },
  sourceInfo: {
    flex: 1,
  },
  sourceTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  sourceDate: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  videoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  videoThumbnail: {
    height: 180,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  videoEmoji: {
    fontSize: 80,
  },
  playButton: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 24,
    marginLeft: 4,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    padding: 16,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 18,
  },
  offlineButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  offlineIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  offlineText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  whatsappButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  whatsappIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  whatsappText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
  audioButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  audioIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  audioText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.white,
  },
  timeNote: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 24,
  },
  safetySection: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  safetyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  safetyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  safetyCard: {
    width: '47%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  safetyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  safetyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  safetyNote: {
    fontSize: 11,
    color: COLORS.textLight,
    fontStyle: 'italic',
  },
});

export default CropGuideScreen;
