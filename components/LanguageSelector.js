// src/components/LanguageSelector.js
// Reusable language selector component

import React from 'react';
import {
  FlatList, Modal, SafeAreaView, StyleSheet, Text, TouchableOpacity, View
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LanguageList from './LanguageList';
import Header from './Header';

const LanguageSelector = ({ visible, onClose }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { currentLanguage, changeLanguage, availableLanguages } = useLanguage();

  const handleSelectLanguage = useCallback(async (languageCode) => {
    try {
      await changeLanguage(languageCode);
      onClose();
    } catch (error) {
      console.error(error);
    }
  }, [changeLanguage, onClose]);
  // Render language item
  const renderLanguageItem = ({ item }) => {
    const isSelected = item.code === currentLanguage;
    
    const languageItemStyle = [
      styles.languageItem,
      { backgroundColor: isSelected ? theme.colors.primary.light : theme.colors.background.paper }
    ];

    const languageNameStyle = [
      styles.languageName,
        { 
          color: isSelected ? theme.colors.primary.contrastText : theme.colors.text.primary,
          fontWeight: isSelected ? 'bold' : 'normal'
        }
      ];
  
      return (
        <TouchableOpacity 
          style={languageItemStyle}
          onPress={() => handleSelectLanguage(item.code)}
        >
          <Text style={languageNameStyle}>
            {item.name}
          </Text>
          
          {isSelected && (
            <Icon 
              name="check" 
              size={20} 
              color={theme.colors.primary.contrastText} 
            />
          )}
        </TouchableOpacity>
      );
    };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Header onClose={onClose} theme={theme} t={t} />
          <LanguageList
            availableLanguages={availableLanguages}
            renderLanguageItem={renderLanguageItem}
            theme={theme}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const createStyles = (theme) => StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: theme.colors.modalBackground,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 30,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginVertical: 4,
  },
  languageName: {
    fontSize: 16,
  },
  separator: {
    height: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
});

const Header = ({ onClose, theme, t }) => (
  <View style={styles.header}>
    <Text style={[
      styles.title,
      { color: theme.colors.text.primary }
    ]}>
      {t('select_language')}
    </Text>
    <TouchableOpacity
      style={styles.closeButton}
      onPress={onClose}
    >
      <Icon 
        name="close"
        size={24}
        color={theme.colors.text.primary}
      />
    </TouchableOpacity>
  </View>
);

const LanguageList = ({ availableLanguages, renderLanguageItem, theme }) => (
  <FlatList
    data={availableLanguages}
    renderItem={renderLanguageItem}
    keyExtractor={(item) => item.code}
    ItemSeparatorComponent={() => (
      <View 
        style={[
          styles.separator,
          { backgroundColor: theme.colors.divider }
        ]} 
      />
    )}
    contentContainerStyle={styles.listContent}
  />
);

export default LanguageSelector;
