import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

function normalizePhone(raw) {
  const digits = raw.replace(/[\s\-\.]/g, '');
  if (/^\+33[67]\d{8}$/.test(digits)) return digits;
  if (/^0[67]\d{8}$/.test(digits)) return '+33' + digits.slice(1);
  return null;
}

export default function EnvoyerScreen() {
  const [clientName, setClientName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const normalizedPhone = normalizePhone(phone);
  const phoneValid = normalizedPhone !== null;
  const phoneError = phone.length > 3 && !phoneValid;

  async function handleSend() {
    if (!phoneValid || loading) return;
    setLoading(true);
    setError('');

    try {
      const sendSMS = httpsCallable(functions, 'sendSMS');
      await sendSMS({
        clientName: clientName.trim() || 'Cher client',
        phoneNumber: normalizedPhone,
      });
      setSuccess(true);
    } catch (e) {
      if (e.code === 'functions/permission-denied') {
        setError('Vous devez être abonné pour envoyer des SMS.');
      } else if (e.code === 'functions/unauthenticated') {
        setError('Session expirée. Veuillez vous reconnecter.');
      } else {
        setError('Envoi échoué. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setClientName('');
    setPhone('');
    setError('');
    setSuccess(false);
  }

  if (success) {
    return (
      <View style={styles.container}>
        <View style={styles.successBox}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.successTitle}>SMS envoyé !</Text>
          <Text style={styles.successSub}>
            {clientName.trim() || 'Le client'} va recevoir le lien de notation dans quelques instants.
          </Text>
          <TouchableOpacity style={styles.button} onPress={handleReset}>
            <Text style={styles.buttonText}>Envoyer un autre</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Demander un avis</Text>
        <Text style={styles.subtitle}>
          Le client reçoit un SMS avec un lien pour noter votre prestation.
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.label}>Prénom du client (optionnel)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex : Marie"
          placeholderTextColor="#555"
          value={clientName}
          onChangeText={setClientName}
          returnKeyType="next"
        />

        <Text style={styles.label}>Numéro de téléphone</Text>
        <TextInput
          style={[styles.input, phoneError && styles.inputError]}
          placeholder="06 12 34 56 78"
          placeholderTextColor="#555"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          returnKeyType="done"
          onSubmitEditing={handleSend}
        />
        {phoneError && (
          <Text style={styles.fieldError}>Format invalide — 06 ou 07, 10 chiffres</Text>
        )}

        <TouchableOpacity
          style={[styles.button, (!phoneValid || loading) && styles.buttonDisabled]}
          onPress={handleSend}
          disabled={!phoneValid || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Envoyer le SMS</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  inner: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#555',
    marginBottom: 40,
    lineHeight: 22,
  },
  error: {
    color: '#ff4444',
    fontSize: 14,
    marginBottom: 20,
    backgroundColor: '#1a0000',
    borderRadius: 8,
    padding: 12,
  },
  label: {
    fontSize: 13,
    color: '#888',
    marginBottom: 6,
    marginLeft: 2,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 10,
    padding: 16,
    color: '#fff',
    fontSize: 15,
    marginBottom: 6,
  },
  inputError: {
    borderColor: '#ff4444',
  },
  fieldError: {
    color: '#ff4444',
    fontSize: 12,
    marginBottom: 14,
    marginLeft: 2,
  },
  button: {
    backgroundColor: '#4f6ef7',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  successBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  successIcon: {
    fontSize: 56,
    color: '#4ade80',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  successSub: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
});
