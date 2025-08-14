import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  Card, 
  Title, 
  Paragraph,
  Snackbar,
  Divider
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  const { signIn, signUp, signInWithGoogle, signInWithApple, resetPassword } = useAuth();
  
  const { control, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const showSnackbar = (message) => {
    setSnackbar({ visible: true, message });
  };

  const hideSnackbar = () => {
    setSnackbar({ visible: false, message: '' });
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      if (showForgotPassword) {
        await resetPassword(data.email);
        showSnackbar('Password reset email sent!');
        setShowForgotPassword(false);
        reset();
      } else if (isSignUp) {
        await signUp(data.email, data.password);
        showSnackbar('Account created! Please check your email to verify.');
      } else {
        await signIn(data.email, data.password);
      }
    } catch (error) {
      showSnackbar(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (error) {
      showSnackbar(error.message || 'Google sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithApple();
    } catch (error) {
      showSnackbar(error.message || 'Apple sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setShowForgotPassword(false);
    reset();
  };

  const toggleForgotPassword = () => {
    setShowForgotPassword(!showForgotPassword);
    setIsSignUp(false);
    reset();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Title style={styles.title}>GymTracker</Title>
            <Paragraph style={styles.subtitle}>
              Track your workouts simply and efficiently
            </Paragraph>
          </View>

          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>
                {showForgotPassword 
                  ? 'Reset Password' 
                  : isSignUp 
                    ? 'Create Account' 
                    : 'Welcome Back'
                }
              </Title>

              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Email"
                    mode="outlined"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={!!errors.email}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.input}
                  />
                )}
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email.message}</Text>
              )}

              {!showForgotPassword && (
                <>
                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        label="Password"
                        mode="outlined"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={!!errors.password}
                        secureTextEntry
                        style={styles.input}
                      />
                    )}
                  />
                  {errors.password && (
                    <Text style={styles.errorText}>{errors.password.message}</Text>
                  )}
                </>
              )}

              <Button
                mode="contained"
                onPress={handleSubmit(onSubmit)}
                loading={loading}
                disabled={loading}
                style={styles.button}
              >
                {showForgotPassword 
                  ? 'Send Reset Email' 
                  : isSignUp 
                    ? 'Sign Up' 
                    : 'Sign In'
                }
              </Button>

              {!showForgotPassword && (
                <>
                  <View style={styles.dividerContainer}>
                    <Divider style={styles.divider} />
                    <Text style={styles.dividerText}>or</Text>
                    <Divider style={styles.divider} />
                  </View>

                  <Button
                    mode="outlined"
                    onPress={handleGoogleSignIn}
                    loading={loading}
                    disabled={loading}
                    style={styles.button}
                    icon="google"
                  >
                    Continue with Google
                  </Button>

                  {Platform.OS === 'ios' && (
                    <Button
                      mode="outlined"
                      onPress={handleAppleSignIn}
                      loading={loading}
                      disabled={loading}
                      style={styles.button}
                      icon="apple"
                    >
                      Continue with Apple
                    </Button>
                  )}
                </>
              )}

              <View style={styles.linkContainer}>
                {!showForgotPassword && (
                  <Button
                    mode="text"
                    onPress={toggleForgotPassword}
                    disabled={loading}
                  >
                    Forgot Password?
                  </Button>
                )}
                
                <Button
                  mode="text"
                  onPress={showForgotPassword ? () => setShowForgotPassword(false) : toggleMode}
                  disabled={loading}
                >
                  {showForgotPassword 
                    ? 'Back to Sign In'
                    : isSignUp 
                      ? 'Already have an account? Sign In' 
                      : "Don't have an account? Sign Up"
                  }
                </Button>
              </View>
            </Card.Content>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={hideSnackbar}
        duration={4000}
      >
        {snackbar.message}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6750A4',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    color: '#666',
  },
  card: {
    elevation: 4,
    borderRadius: 12,
  },
  cardTitle: {
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    marginBottom: 8,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 12,
    marginBottom: 16,
    marginLeft: 12,
  },
  button: {
    marginTop: 16,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666',
  },
  linkContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
});