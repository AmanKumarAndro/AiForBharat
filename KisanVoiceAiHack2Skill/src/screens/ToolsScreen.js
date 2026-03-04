import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {COLORS} from '../utils/constants';

const ToolsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>उपकरण / Tools</Text>
      <Text style={styles.subtitle}>Coming Soon...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textLight,
  },
});

export default ToolsScreen;
