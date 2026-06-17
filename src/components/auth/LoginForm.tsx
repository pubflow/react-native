/**
 * React Native login form with login-time 2FA.
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle
} from 'react-native';
import type { TwoFactorMethod } from '@pubflow/core';
import { useAuth } from '../../hooks/useAuth';
import { TwoFactorVerificationForm } from './TwoFactorVerificationForm';

export interface LoginFormConfig {
  primaryColor?: string;
  appName?: string;
  logo?: string | ImageSourcePropType | React.ReactNode;
  subtitle?: string;
  twoFactorSubtitle?: string;
  showPasswordReset?: boolean;
  showAccountCreation?: boolean;
  passwordResetText?: string;
  accountCreationText?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export interface LoginFormProps {
  config?: LoginFormConfig;
  instanceId?: string;
  onSuccess?: (user: any) => void;
  onError?: (error: string) => void;
  onPasswordReset?: () => void;
  onAccountCreation?: () => void;
  onTwoFactorRequired?: (methods: TwoFactorMethod[]) => void;
  onTwoFactorSuccess?: () => void;
  onTwoFactorCancel?: () => void;
}

function getEnv(key: string): string | undefined {
  return typeof process !== 'undefined' ? process.env?.[key] : undefined;
}

function renderLogo(logo?: LoginFormConfig['logo']) {
  if (!logo) return null;
  if (React.isValidElement(logo)) return logo;
  if (typeof logo === 'string') return <Image source={{ uri: logo }} style={styles.logo} resizeMode="contain" />;
  return <Image source={logo as ImageSourcePropType} style={styles.logo} resizeMode="contain" />;
}

export function LoginForm({
  config = {},
  instanceId,
  onSuccess,
  onError,
  onPasswordReset,
  onAccountCreation,
  onTwoFactorRequired,
  onTwoFactorSuccess,
  onTwoFactorCancel
}: LoginFormProps) {
  const {
    login,
    startTwoFactor,
    verifyTwoFactor,
    isLoading,
    twoFactorPending,
    twoFactorMethods
  } = useAuth(instanceId);

  const primaryColor = config.primaryColor || getEnv('EXPO_PUBLIC_MAIN_COLOR') || '#006aff';
  const appName = config.appName || getEnv('EXPO_PUBLIC_BUSINESS_NAME') || 'Pubflow';
  const logo = config.logo || getEnv('EXPO_PUBLIC_LOGO');
  const subtitle = config.subtitle || 'Sign in to your account';
  const twoFactorSubtitle = config.twoFactorSubtitle || 'Enter the verification code we sent you.';
  const showPasswordReset = config.showPasswordReset ?? true;
  const showAccountCreation = config.showAccountCreation ?? true;
  const passwordResetText = config.passwordResetText || 'Forgot Password?';
  const accountCreationText = config.accountCreationText || 'Create New Account';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [pendingMethods, setPendingMethods] = useState<TwoFactorMethod[]>([]);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (!twoFactorPending) return;
    const methods = twoFactorMethods ?? [];
    setPendingMethods(methods);
    setStep('otp');
  }, [twoFactorPending, twoFactorMethods]);

  const handleLogin = async () => {
    setError('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    setIsLoggingIn(true);
    try {
      const result = await login({ email: email.toLowerCase().trim(), password });

      if (result.requires2fa) {
        const methods = result.availableMethods ?? [];
        setPendingMethods(methods);
        setStep('otp');
        onTwoFactorRequired?.(methods);
        return;
      }

      if (result.success) {
        onSuccess?.(result.user);
        return;
      }

      const message = result.error || 'Invalid credentials';
      setError(message);
      onError?.(message);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection error. Please try again.';
      setError(message);
      onError?.(message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleTwoFactorSuccess = () => {
    onTwoFactorSuccess?.();
    onSuccess?.(null);
  };

  const busy = isLoading || isLoggingIn;

  return (
    <View style={[styles.formContainer, config.containerStyle]}>
      <View style={styles.logoSection}>
        {renderLogo(logo)}
        <Text style={styles.welcomeText}>Welcome to {appName}</Text>
        <Text style={styles.subtitleText}>{step === 'otp' ? twoFactorSubtitle : subtitle}</Text>
      </View>

      {step === 'otp' ? (
        <TwoFactorVerificationForm
          methods={pendingMethods}
          primaryColor={primaryColor}
          error={error}
          isLoading={busy}
          onVerify={verifyTwoFactor}
          onResend={async (methodId, method) => {
            await startTwoFactor(methodId, method);
          }}
          onCancel={() => {
            setStep('credentials');
            setError('');
            onTwoFactorCancel?.();
          }}
          onSuccess={handleTwoFactorSuccess}
          onError={onError}
        />
      ) : (
        <>
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputPrefix}>@</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                editable={!busy}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.inputPrefix}>*</Text>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Enter your password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={secureTextEntry}
                autoComplete="password"
                editable={!busy}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setSecureTextEntry(!secureTextEntry)}
                disabled={busy}
              >
                <Text style={styles.eyeText}>{secureTextEntry ? 'Show' : 'Hide'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: primaryColor, shadowColor: primaryColor }, busy && styles.buttonLoading]}
            onPress={handleLogin}
            disabled={busy}
            activeOpacity={0.85}
          >
            {busy ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.buttonText}>Signing in...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {(showPasswordReset || showAccountCreation) && (
            <View style={styles.accountActions}>
              {showPasswordReset && (
                <TouchableOpacity style={styles.linkButton} onPress={onPasswordReset} disabled={busy}>
                  <Text style={[styles.linkText, { color: primaryColor }]}>{passwordResetText}</Text>
                </TouchableOpacity>
              )}

              {showPasswordReset && showAccountCreation ? (
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>
              ) : null}

              {showAccountCreation && (
                <TouchableOpacity style={styles.linkButton} onPress={onAccountCreation} disabled={busy}>
                  <Text style={[styles.linkText, { color: primaryColor }]}>{accountCreationText}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    padding: 32,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 240,
    height: 60,
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    fontWeight: '400',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingHorizontal: 16,
    height: 56,
  },
  inputPrefix: {
    width: 22,
    marginRight: 10,
    color: '#666',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    height: '100%',
    fontWeight: '400',
  },
  passwordInput: {
    paddingRight: 0,
  },
  eyeButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  eyeText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '600',
  },
  loginButton: {
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonLoading: {
    opacity: 0.8,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  accountActions: {
    marginTop: 24,
    marginBottom: 16,
  },
  linkButton: {
    padding: 12,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e9ecef',
  },
  dividerText: {
    color: '#666666',
    fontSize: 14,
    marginHorizontal: 16,
    fontWeight: '500',
  },
});
