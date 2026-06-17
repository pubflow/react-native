/**
 * React Native 2FA verification form.
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle
} from 'react-native';
import type { TwoFactorMethod, TwoFactorVerifyResult } from '@pubflow/core';

export interface TwoFactorVerificationFormProps {
  methods: TwoFactorMethod[];
  primaryColor?: string;
  error?: string;
  isLoading?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  onVerify: (methodId: string, code: string) => Promise<TwoFactorVerifyResult>;
  onResend?: (methodId: string, method: string) => Promise<void>;
  onCancel?: () => void;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

function getMethodLabel(method: TwoFactorMethod): string {
  const name = method.method.toUpperCase();
  return method.identifier ? `${name} - ${method.identifier}` : name;
}

export function TwoFactorVerificationForm({
  methods,
  primaryColor = '#006aff',
  error,
  isLoading = false,
  containerStyle,
  onVerify,
  onResend,
  onCancel,
  onSuccess,
  onError
}: TwoFactorVerificationFormProps) {
  const [code, setCode] = useState('');
  const [activeMethodId, setActiveMethodId] = useState<string | null>(methods[0]?.id ?? null);
  const [activeMethodName, setActiveMethodName] = useState<string>(methods[0]?.method ?? 'email');
  const [localError, setLocalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!activeMethodId && methods.length > 0) {
      setActiveMethodId(methods[0].id);
      setActiveMethodName(methods[0].method);
    }
  }, [methods, activeMethodId]);

  const submit = async () => {
    if (!activeMethodId) {
      setLocalError('No verification method is available.');
      return;
    }
    if (code.length < 6) {
      setLocalError('Enter the 6-digit verification code.');
      return;
    }

    setSubmitting(true);
    setLocalError('');

    try {
      const result = await onVerify(activeMethodId, code);
      if (result.verified || result.session_activated) {
        onSuccess?.();
        return;
      }

      const message = result.error ||
        (result.attempts_remaining !== undefined
          ? `Incorrect code. ${result.attempts_remaining} attempt(s) remaining.`
          : 'Incorrect code.');
      setLocalError(message);
      onError?.(message);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verification failed.';
      setLocalError(message);
      onError?.(message);
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    if (!activeMethodId || !onResend) return;

    setSubmitting(true);
    setLocalError('');
    try {
      await onResend(activeMethodId, activeMethodName);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not resend the code.';
      setLocalError(message);
      onError?.(message);
    } finally {
      setSubmitting(false);
    }
  };

  const busy = isLoading || submitting;
  const visibleError = localError || error;

  return (
    <View style={[styles.container, containerStyle]}>
      {visibleError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{visibleError}</Text>
        </View>
      ) : null}

      {methods.length > 1 ? (
        <View style={styles.methodList}>
          {methods.map(method => {
            const active = method.id === activeMethodId;
            return (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.methodButton,
                  active && { borderColor: primaryColor, backgroundColor: `${primaryColor}12` }
                ]}
                onPress={() => {
                  setActiveMethodId(method.id);
                  setActiveMethodName(method.method);
                  setCode('');
                }}
                disabled={busy}
              >
                <Text style={[styles.methodText, active && { color: primaryColor }]}>
                  {getMethodLabel(method)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Verification Code</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="000000"
            placeholderTextColor="#999"
            value={code}
            onChangeText={(value) => setCode(value.replace(/\D/g, ''))}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            maxLength={6}
            editable={!busy}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: primaryColor, shadowColor: primaryColor }, busy && styles.buttonLoading]}
        onPress={submit}
        disabled={busy || code.length < 6}
        activeOpacity={0.85}
      >
        {busy ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.buttonText}>Verifying...</Text>
          </View>
        ) : (
          <Text style={styles.buttonText}>Verify Code</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkButton} onPress={resend} disabled={busy || !onResend}>
        <Text style={[styles.linkText, { color: primaryColor }]}>Didn't receive a code? Resend</Text>
      </TouchableOpacity>

      {onCancel ? (
        <TouchableOpacity style={styles.linkButton} onPress={onCancel} disabled={busy}>
          <Text style={styles.secondaryLinkText}>Back to login</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '500',
  },
  methodList: {
    gap: 8,
    marginBottom: 20,
  },
  methodButton: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  methodText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingHorizontal: 16,
    height: 56,
  },
  input: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontSize: 22,
    letterSpacing: 8,
    color: '#333333',
    fontWeight: '600',
  },
  primaryButton: {
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
  linkButton: {
    padding: 12,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryLinkText: {
    color: '#666',
    fontSize: 13,
    fontWeight: '600',
  },
});
