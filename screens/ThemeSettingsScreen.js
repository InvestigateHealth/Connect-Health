// src/screens/ThemeSettingsScreen.js
// This screen allows users to change the theme settings of the application.
// Users can choose between Light, Dark, and System themes.
// The selected theme will be applied throughout the app to enhance user experience.

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  Switch,
  TouchableOpacity
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme, ThemeMode } from '../theme/ThemeContext';
const ThemeSettingsScreen = ({ navigation }) => {
  const { theme, themeMode, changeThemeMode } = useTheme();

  const handleThemeChange = (mode) => {
    changeThemeMode(mode);
  };
  return (
    <View style={[styles.container, styles.backgroundDefault(theme.colors.background.default)]}>
      <View style={[styles.header, styles.backgroundPaper(theme.colors.background.paper)]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
          Appearance
        </Text>
      </View>

      <ScrollView>
        <View style={[styles.section, styles.backgroundPaper(theme.colors.background.paper)]}>
          <Text style={[styles.sectionTitle, styles.textPrimary(theme.colors.text.primary)]}>
            Theme
          </Text>

          <TouchableOpacity
            style={[
              styles.option,
              themeMode === ThemeMode.LIGHT && styles.selectedOption,
              styles.borderColor(theme.colors.divider)
            ]}
            onPress={() => handleThemeChange(ThemeMode.LIGHT)}
          >
            <View style={styles.optionContent}>
              <View style={[styles.themePreview, styles.lightThemePreview]}>
                <Icon name="sunny" size={20} color="#263238" />
              </View>
              <Text style={[styles.optionText, styles.textPrimary(theme.colors.text.primary)]}>
                Light
              </Text>
            </View>
            {themeMode === ThemeMode.LIGHT && (
              <Icon name="checkmark-circle" size={24} color={theme.colors.primary.main} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.option,
              themeMode === ThemeMode.DARK && styles.selectedOption,
              styles.borderColor(theme.colors.divider)
            ]}
            onPress={() => handleThemeChange(ThemeMode.DARK)}
          >
            <View style={styles.optionContent}>
              <View style={[styles.themePreview, styles.darkThemePreview]}>
                <Icon name="moon" size={20} color="#FFFFFF" />
              </View>
              <Text style={[styles.optionText, { color: theme.colors.text.primary }]}>
                Dark
              </Text>
            </View>
            {themeMode === ThemeMode.DARK && (
              <Icon name="checkmark-circle" size={24} color={theme.colors.primary.main} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.option,
              themeMode === ThemeMode.SYSTEM && styles.selectedOption,
              styles.borderColor(theme.colors.divider)
            ]}
            onPress={() => handleThemeChange(ThemeMode.SYSTEM)}
          >
            <View style={styles.optionContent}>
              <View style={[styles.themePreview, styles.systemThemePreview]}>
                <Icon name="settings-outline" size={20} color="#455A64" />
              </View>
              <View>
                <Text style={[styles.optionText, { color: theme.colors.text.primary }]}>
                  System
                </Text>
                <Text style={[styles.optionSubtext, styles.textSecondary(theme.colors.text.secondary)]}>
                  Follow system theme settings
                </Text>
              </View>
            </View>
            {themeMode === ThemeMode.SYSTEM && (
              <Icon name="checkmark-circle" size={24} color={theme.colors.primary.main} />
            )}
          </TouchableOpacity>
        </View>
        
        <View style={[styles.infoCard, styles.backgroundPaper(theme.colors.background.paper)]}>
          <Icon name="information-circle-outline" size={24} color={theme.colors.info.main} style={styles.infoIcon} />
          <Text style={[styles.infoText, styles.textSecondary(theme.colors.text.secondary)]}>
            Changing the theme affects how the app looks. Choose the option that's most comfortable for your eyes.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const textPrimary = (color) => ({
  color: color,
});

const textSecondary = (color) => ({
  color: color,
});

const borderColor = (color) => ({
  borderColor: color,
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    marginRight: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  infoCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  lightThemePreview: {
    backgroundColor: theme.colors.background.light,
  },
  darkThemePreview: {
    backgroundColor: theme.colors.background.dark,
  },
  systemThemePreview: {
    backgroundColor: theme.colors.background.system,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionSubtext: {
    fontSize: 14,
    marginTop: 2,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  section: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 16,
  },
  selectedOption: {
    backgroundColor: 'rgba(33, 150, 243, 0.08)',
  },
  themePreview: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
});
export default ThemeSettingsScreen;
