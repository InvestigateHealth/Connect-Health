// src/screens/OnboardingScreen.js
// The initial welcome screen

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../constants/colors';
import Ionicons from 'react-native-vector-icons/Ionicons';

const OnboardingScreen = ({ navigation }) => {
  const handleLoginPress = () => {
    navigation.navigate('Login');
  };
  
  const handleGetStartedPress = () => {
    navigation.navigate('Signup');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="heart-circle" size={100} color={colors.primary} />
        </View>
        
        <Text style={styles.title}>HealthConnect</Text>
        
        <Text style={styles.subtitle}>
          Connect with others who share similar health experiences
        </Text>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={handleGetStartedPress}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={handleLoginPress}
        >
          <Text style={styles.secondaryButtonText}>I already have an account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    color: colors.secondary,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: colors.buttonBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    padding: 16,
    marginBottom: 15,
  },
  secondaryButton: {
    color: colors.primary,
    textAlign: 'center',
    borderRadius: 10,
    padding: 16,
    marginBottom: 15,
  },
  secondaryButtonText: {
    color: colors.primary,
  },
  primaryButtonText: {
    color: colors.white,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
export default OnboardingScreen;
