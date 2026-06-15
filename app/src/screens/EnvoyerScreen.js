import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function EnvoyerScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Envoyer une demande</Text>
      <Text style={styles.placeholder}>Saisissez le numéro du client pour lui envoyer un SMS de notation.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  placeholder: {
    fontSize: 15,
    color: '#555',
  },
});
