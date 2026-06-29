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
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

export default function RegisterScreen({ navigation }) {
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleRegister() {
    if (!businessName.trim() || !email || !password || !confirmPassword) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    if (businessName.trim().length < 2) {
      setError('Le nom du commerce doit comporter au moins 2 caractères.');
      return;
    }
    if (password.length < 8) {
      setError('Mot de passe trop court (8 caractères minimum).');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        businessName: businessName.trim(),
        googleReviewUrl: '',
        plan: 'free',
        stripeCustomerId: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      // RootNavigator redirige automatiquement via onAuthStateChanged
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') {
        setError('Ce compte existe déjà. Essayez de vous connecter.');
      } else if (e.code === 'auth/invalid-email') {
        setError('Adresse email invalide.');
      } else {
        setError('Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
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
        <Text style={styles.logo}>RepView</Text>
        <Text style={styles.subtitle}>Créez votre espace commerçant</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.label}>Nom du commerce</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex : Plomberie Martin"
          placeholderTextColor="#555"
          value={businessName}
          onChangeText={setBusinessName}
          returnKeyType="next"
        />

        <Text style={styles.label}>Email professionnel</Text>
        <TextInput
          style={styles.input}
          placeholder="votre@email.com"
          placeholderTextColor="#555"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          returnKeyType="next"
        />

        <Text style={styles.label}>Mot de passe</Text>
        <TextInput
          style={styles.input}
          placeholder="8 caractères minimum"
          placeholderTextColor="#555"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          returnKeyType="next"
        />

        <Text style={styles.label}>Confirmer le mot de passe</Text>
        <TextInput
          style={styles.input}
          placeholder="Répétez le mot de passe"
          placeholderTextColor="#555"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          returnKeyType="done"
          onSubmitEditing={handleRegister}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Créer mon compte</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginLinkText}>
            Déjà un compte ?{' '}
            <Text style={styles.loginLinkAccent}>Se connecter</Text>
          </Text>
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
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  logo: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#888',
    marginBottom: 40,
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
    marginBottom: 18,
  },
  button: {
    backgroundColor: '#4f6ef7',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginLink: {
    marginTop: 28,
    alignItems: 'center',
  },
  loginLinkText: {
    color: '#888',
    fontSize: 14,
  },
  loginLinkAccent: {
    color: '#4f6ef7',
    fontWeight: '600',
  },
});
