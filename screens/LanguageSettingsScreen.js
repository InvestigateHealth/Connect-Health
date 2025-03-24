// src/screens/LanguageSettingsScreen.js
// Language settings screen for HealthConnect

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { getAvailableLanguages, changeLanguage } from '../i18n';
import { AnalyticsService } from '../services/AnalyticsService';

/**
 * LanguageSettingsScreen component allows users to select and change the app's language.
 */
const LanguageSettingsScreen = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [languages, setLanguages] = useState([]);
  const [currentLanguage, setCurrentLanguage] = useState('');
  const [loading, setLoading] = useState(false);

  // Get available languages and current language on component mount
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const availableLanguages = await getAvailableLanguages();
        setLanguages(availableLanguages);
      } catch (error) {
        console.error('Error fetching languages:', error);
    } finally {
      setCurrentLanguage(i18n.language);
    }
  };
  fetchLanguages();
  }, [i18n.language]);

  // Memoize keyExtractor to avoid unnecessary re-renders
  const keyExtractor = (item) => item.code;

  // Handle language selection
  const handleSelectLanguage = async (languageCode) => {
    if (languageCode === currentLanguage) return;
    
    setLoading(true);
    try {
      const previousLanguage = currentLanguage;
      const success = await changeLanguage(languageCode);
      if (success) {
        setCurrentLanguage(languageCode);
        
        // Log language change analytics
        AnalyticsService.logEvent('language_changed', {
          previous_language: previousLanguage,
          new_language: languageCode,
        });
  
        // Show success message
        Alert.alert(
          t('success'),
          t('language_changed'),
          [{ text: t('ok') }]
        );
      }
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert(
        t('error'),
        t('unknown_error'),
        [{ text: t('ok') }]
      );
    } finally {
      setLoading(false);
    }
  };
  
  // Render each language item
  const renderLanguageItem = ({ item }) => {
    const isSelected = item.code === currentLanguage;
    return (
      <TouchableOpacity
        style={[
          styles.languageItem,
          { backgroundColor: theme.colors.background }
        ]}
        onPress={() => handleSelectLanguage(item.code)}
      >
        <Text style={[styles.languageText, { color: theme.colors.text.primary }]}>{item.name}</Text>
        {isSelected && (
          <Icon 
            name="check" 
            size={24} 
            style={styles.icon} 
            color={theme.colors.primary.main}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary.main} />
        ) : (
          <FlatList
            data={languages}
            renderItem={renderLanguageItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.list}
            ItemSeparatorComponent={() => (
              <View 
                style={[
                  styles.separator,
                  { backgroundColor: theme.colors.divider }
                ]} 
              />
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

// Styles for the LanguageSettingsScreen component
import styles from '../styles/LanguageSettingsScreenStyles';

export default LanguageSettingsScreen;
