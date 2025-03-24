// src/components/UserBlock.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useBlockedUsers } from '../contexts/BlockedUsersContext';
import { useTheme } from '../theme/ThemeContext';
import { AnalyticsService } from '../services/AnalyticsService';

const REPORT_REASONS = [
  { id: 'spam', label: 'Spam', description: 'Posting unwanted or repetitive content' },
  { id: 'harassment', label: 'Harassment', description: 'Bullying, threatening, or intimidating behavior' },
  { id: 'inappropriate', label: 'Inappropriate content', description: 'Posting offensive, explicit, or harmful content' },
  { id: 'impersonation', label: 'Impersonation', description: 'Pretending to be someone else' },
  { id: 'misinformation', label: 'Misinformation', description: 'Sharing false or misleading information' },
  { id: 'other', label: 'Other', description: 'Any other reason not listed above' },
];

const UserBlock = ({ userId, userName, onComplete, fromContentId }) => {
  const { blockUser, isUserBlocked } = useBlockedUsers();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedReason, setSelectedReason] = useState(null);
  const { theme } = useTheme();

  const isBlocked = isUserBlocked(userId);

  const handleBlockPress = async () => {
    try {
      await blockUser(userId);
      Alert.alert('User Blocked', `${userName || 'This user'} has been blocked.`);
      if (onComplete) onComplete();
    } catch (error) {
      console.error('Error blocking user:', error);
      Alert.alert('Error', 'Failed to block user. Please try again later.');
    }
  };

  const handleBlockUser = async () => {
    if (!userId) return;
    
    // First ask for confirmation
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${userName || 'this user'}? You won't see their content anymore.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Block',
          onPress: handleBlockPress,
        },
      ],
    );
  };

  const submitReport = async () => {
    if (!selectedReason) {
      Alert.alert('Error', 'Please select a reason for reporting this user.');
      return;
    }
    
    setLoading(true);
    
    try {
      await logReport();
      await blockReportedUser();
      showSuccessMessage();
      if (onComplete) onComplete();
    } catch (error) {
      handleReportError(error);
    } finally {
      setLoading(false);
    }
  };

  const logReport = async () => {
    AnalyticsService.logEvent('user_reported', {
      reported_user_id: userId,
      from_content_id: fromContentId,
      report_reason: selectedReason,
    });
  };

  const blockReportedUser = async () => {
    await blockUser(userId);
  };

  const showSuccessMessage = () => {
    setIsModalVisible(false);
    Alert.alert(
      'Report Submitted',
      `Thank you for your report. ${userName || 'This user'} has also been blocked.`,
      [{ text: 'OK' }]
    );
  };

  const handleReportError = (error) => {
    console.error('Error reporting user:', error);
    Alert.alert(
      'Error',
      'Failed to submit report. Please try again later.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Retry', onPress: submitReport }
      ]
    );
    setLoading(false);
    if (onComplete) onComplete();
  };

  return (
    <>
      <ActionButtons
        isBlocked={isBlocked}
        loading={loading}
        handleBlockUser={handleBlockUser}
        handleReportUser={handleReportUser}
        theme={theme}
      />

      <ReportModal
        isModalVisible={isModalVisible}
        setIsModalVisible={setIsModalVisible}
        userName={userName}
        theme={theme}
        selectedReason={selectedReason}
        setSelectedReason={setSelectedReason}
        submitReport={submitReport}
        loading={loading}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 120,
    justifyContent: 'center',
  },
  blockButton: {
    backgroundColor: 'transparent',
  },
  reportButton: {
    backgroundColor: 'transparent',
  },
  disabledButton: {
    borderColor: '#CCCCCC',
    backgroundColor: '#F5F5F5',
  },
  buttonText: {
    marginLeft: 8,
    fontWeight: '500',
    fontSize: 14,
  },
  disabledText: {
    color: '#999999',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalDescription: {
    fontSize: 16,
    marginBottom: 16,
  },
  reasonsContainer: {
    maxHeight: 300,
  },
  reasonItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  reasonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reasonLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  reasonDescription: {
    fontSize: 14,
  },
  modalFooter: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666666',
  },
  submitButton: {
    padding: 12,
    borderRadius: 8,
    minWidth: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});

export default UserBlock;