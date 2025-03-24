// src/screens/EditProfileScreen.js
// Screen for editing user profile information

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { useUser } from '../contexts/UserContext';
import { processImage } from '../utils/mediaProcessing';
import debounce from 'lodash/debounce';
import { medicalConditions } from '../constants/medicalConditions';

/**
 * EditProfileScreen component allows users to edit their profile information.
 * Users can update their first name, last name, gender, bio, profile image, and medical conditions.
 * 
 * @param {object} navigation - The navigation object provided by React Navigation.
 */
const EditProfileScreen = ({ navigation }) => {
  const { userData, updateUserData } = useUser();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageURL, setProfileImageURL] = useState(null);
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [imageUploading, setImageUploading] = useState(false);
  
  // Available medical conditions

  // Load user data when component mounts
  // Load user data when component mounts
  useEffect(() => {
    if (userData) {
      setFirstName(userData.firstName || '');
      setLastName(userData.lastName || '');
      setGender(userData.gender || 'Prefer not to say');
      setBio(userData.bio || '');
      setProfileImageURL(userData.profileImageURL);
      setSelectedConditions(userData.medicalConditions || []);
    }
  }, [userData]);

  // Function to toggle a condition selection
  const toggleCondition = (condition) => {
    if (selectedConditions.includes(condition)) {
      setSelectedConditions(selectedConditions.filter(c => c !== condition));
    } else {
      setSelectedConditions([...selectedConditions, condition]);
    }
  };

  // Function to select profile image
  const selectProfileImage = async () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 500,
      maxHeight: 500,
    };
    // Request permission to access the image library
    const requestPermission = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Permission to access gallery',
            message: 'We need your permission to access your gallery to select a profile image.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true;
    };

    const hasPermission = await requestPermission();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'You need to grant permission to access the gallery.');
      return;
    }

    try {
      const result = await launchImageLibrary(options);
      
      if (result.didCancel) {
        return;
      }
  
      if (result.errorCode) {
        throw new Error(result.errorMessage || 'Error selecting image');
      }

      if (result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        const processedImage = await processImage(selectedImage);
        setProfileImage(processedImage);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  // Function to upload profile image to Firebase Storage
  const uploadProfileImage = async () => {
    if (!profileImage) return null;

    try {
      setImageUploading(true);
      
      const filename = profileImage.uri.substring(profileImage.uri.lastIndexOf('/') + 1);
      const extension = filename.split('.').pop();
      const storagePath = `profiles/${userData.id}_${Date.now()}.${extension}`;
      const reference = storage().ref(storagePath);
      
      // Delete old profile image if exists
      if (profileImageURL) {
        try {
          const oldImageRef = storage().refFromURL(profileImageURL);
          await oldImageRef.delete();
        } catch (error) {
          console.error('Error deleting old profile image:', error);
          // Continue even if deletion fails
        }
      }
      
      // Upload new image
      await reference.putFile(profileImage.uri);
      
      // Get download URL
      const url = await reference.getDownloadURL();
      setProfileImageURL(url);
      
      return url;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      Alert.alert('Error', 'Failed to upload profile image. Please try again.');
      return null;
    } finally {
      setImageUploading(false);
    }
  };

  // Function to save profile changes
  const saveProfile = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Missing Information', 'Please enter your first and last name');
      return;
    }

    setIsLoading(true);

    try {
      // Upload profile image if changed
      let imageURL = profileImageURL;
      if (profileImage) {
        imageURL = await uploadProfileImage();
      }

      // Update user data in Firestore
      const updatedData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        gender,
        bio: bio.trim(),
        medicalConditions: selectedConditions,
      };

      if (imageURL) {
        updatedData.profileImageURL = imageURL;
      }

      await updateUserData(updatedData);
      
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Edit Profile</Text>
      </View>
      
      <View style={styles.imageSection}>
        <View style={styles.profileImageContainer}>
          {profileImage ? (
            <Image source={{ uri: profileImage.uri }} style={styles.profileImage} />
          ) : profileImageURL ? (
            <Image source={{ uri: profileImageURL }} style={styles.profileImage} />
          ) : (
            <View style={[styles.profileImage, styles.placeholderImage]}>
              <Icon name="person" size={50} color="#B0BEC5" />
            </View>
          )}
          
          {imageUploading && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator color="white" size="small" />
            </View>
          )}
        </View>
        
        <TouchableOpacity style={styles.changePhotoButton} onPress={selectProfileImage}>
          <Icon name="camera-outline" size={20} color="#2196F3" />
          <Text style={styles.changePhotoText}>Change Photo</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Enter first name"
            placeholderTextColor="#90A4AE"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Enter last name"
            placeholderTextColor="#90A4AE"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={gender}
              onValueChange={(itemValue) => setGender(itemValue)}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              <Picker.Item label="Prefer not to say" value="Prefer not to say" />
              <Picker.Item label="Male" value="Male" />
              <Picker.Item label="Female" value="Female" />
              <Picker.Item label="Non-binary" value="Non-binary" />
            </Picker>
          </View>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself..."
            placeholderTextColor="#90A4AE"
            multiline
            numberOfLines={4}
            maxLength={300}
          />
          <Text style={styles.charCount}>{bio.length}/300</Text>
        </View>
      </View>
      
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Health Conditions</Text>
        <Text style={styles.sectionDescription}>
          Select the health conditions you have experience with. This helps us connect you with relevant users and content.
        </Text>
        
        <View style={styles.conditionsContainer}>
          {medicalConditions.map((condition) => (
            <TouchableOpacity
              key={condition}
              style={[
                styles.conditionTag,
                selectedConditions.includes(condition) && styles.selectedConditionTag
              ]}
              onPress={() => toggleCondition(condition)}
            >
              <Text
                style={[
                  styles.conditionText,
                  selectedConditions.includes(condition) && styles.selectedConditionText
                ]}
              >
                {condition}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={isLoading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={debounce(saveProfile, 300)}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

import styles from '../styles/EditProfileScreenStyles';

export default EditProfileScreen;
