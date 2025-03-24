// src/screens/RegistrationScreen.js
// User registration screen

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { TextInput } from 'react-native';
import { AuthService } from '../services/FirebaseService';
import { useTheme } from '../theme/ThemeContext';
import { Button } from '../components/Button';
/**
 * RegistrationScreen component allows users to create a new account.
 * 
 * @param {object} props - The component props
 * @param {object} props.navigation - The navigation object provided by React Navigation
 */
const RegistrationScreen = ({ navigation }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { theme } = useTheme();

  const validateForm = () => {
    return validateFields() && validatePassword() && validateEmail();
  };

  const validateFields = () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setErrorMessage('Please fill in all fields');
      return false;
    }
    return true;
  };

  const validatePassword = () => {
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return false;
    }
    return true;
  };

  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleRegistration = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setErrorMessage('');

    try {
      // Create user authentication
      const userCredential = await authService.signUp(email.trim(), password);

      // The UserContext will handle the rest when auth state changes,
      // including creating the user document in Firestore

      // When the user document is created in UserContext.js,
      // it will include firstName and lastName from the form
      await authService.updateProfile(userCredential.user, {
        firstName: firstName.trim(),
        lastName: lastName.trim()
      });

      Alert.alert(
        'Registration Successful',
        'Your account has been created. Please complete your profile to get the most out of HealthConnect.',
        [{ text: 'OK' }]
      );

      // The app navigator will automatically redirect to the main app
      // once the user is authenticated
    } catch (error) {
      console.error('Registration error:', error);
      let message = 'Failed to create account. Please try again.';

      // Handle specific Firebase auth errors
      if (error.code === 'auth/email-already-in-use') {
        message = 'This email address is already in use';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address format';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password is too weak. Choose a stronger password.';
      } else {
        message = 'An unexpected error occurred. Please try again later.';
      }

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background.default }]}
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Header theme={theme} />
        <Form
          firstName={firstName}
          setFirstName={setFirstName}
          lastName={lastName}
          setLastName={setLastName}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          confirmPassword={confirmPassword}
          setConfirmPassword={setConfirmPassword}
          errorMessage={errorMessage}
          theme={theme}
          handleRegistration={handleRegistration}
          loading={loading}
          navigation={navigation}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

/**
 * Header component displays the title and subtitle of the registration screen.
 * 
 * @param {object} props - The component props
 * @param {object} props.theme - The theme object provided by the ThemeContext
 */
const Header = ({ theme }) => (
  <View>
    <Text style={[styles.title, { color: theme.colors.text.primary }]}>
      Create Account
    </Text>
    <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
      Join HealthConnect to connect with others on similar health journeys
    </Text>
  </View>
);

/**
 * Form component for user registration.
 * 
 * @param {object} props - The component props
 * @param {string} props.firstName - The user's first name
 * @param {function} props.setFirstName - Function to set the user's first name
 * @param {string} props.lastName - The user's last name
 * @param {function} props.setLastName - Function to set the user's last name
 * @param {string} props.email - The user's email address
 * @param {function} props.setEmail - Function to set the user's email address
 * @param {string} props.password - The user's password
 * @param {function} props.setPassword - Function to set the user's password
 * @param {string} props.confirmPassword - The user's password confirmation
 * @param {function} props.setConfirmPassword - Function to set the user's password confirmation
 * @param {string} props.errorMessage - Error message to display
 * @param {object} props.theme - The theme object
 * @param {function} props.handleRegistration - Function to handle user registration
 * @param {boolean} props.loading - Loading state
 * @param {object} props.navigation - The navigation object provided by React Navigation
 */
const Form = ({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  errorMessage,
  theme,
  handleRegistration,
  loading,
  navigation
}) => (
  <View style={styles.formContainer}>
    <View style={styles.nameRow}>
      <TextInput
        label="First Name"
        value={firstName}
        onChangeText={setFirstName}
        placeholder="First Name"
        style={styles.nameInput}
      />

      <TextInput
        label="Last Name"
        value={lastName}
        onChangeText={setLastName}
        placeholder="Last Name"
        style={styles.nameInput}
      />
    </View>

    <TextInput
      label="Email"
      value={email}
      onChangeText={setEmail}
      placeholder="Enter your email"
      keyboardType="email-address"
      autoCapitalize="none"
      icon="mail-outline"
    />

    <TextInput
      label="Password"
      value={password}
      onChangeText={setPassword}
      placeholder="Create a password"
      secureTextEntry
      icon="lock-closed-outline"
    />

    <TextInput
      label="Confirm Password"
      value={confirmPassword}
      onChangeText={setConfirmPassword}
      placeholder="Confirm your password"
      secureTextEntry
      icon="shield-checkmark-outline"
    />

    {errorMessage ? (
      <Text style={[styles.errorText, { color: theme.colors.error.main }]}>
        {errorMessage}
      </Text>
    ) : null}

    <Text style={[styles.termsText, { color: theme.colors.text.secondary }]}>
      By registering, you agree to our Terms of Service and Privacy Policy
    </Text>

    <Button
      title="Create Account"
      onPress={handleRegistration}
      loading={loading}
      style={styles.registerButton}
    />

    <Button
      title="Already have an account? Log in"
      onPress={() => navigation.navigate('Login')}
      variant="text"
      style={styles.loginButton}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  formContainer: {
    width: '100%',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  nameInput: {
    flex: 0.48,
  },
    flex: 0.48,
  },
  errorText: {
    fontSize: 14,
    marginVertical: 16,
    textAlign: 'center',
  },
  termsText: {
    fontSize: 12,
    textAlign: 'center',
    marginVertical: 16,
  },
  registerButton: {
    marginBottom: 16,
  },
  loginButton: {
    marginBottom: 30,
  },
});

export default RegistrationScreen;
