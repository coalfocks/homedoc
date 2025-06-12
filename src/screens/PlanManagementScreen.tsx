import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from '@rneui/themed';
import { initializeStripe, checkoutWithStripe } from '../utils/stripe';
import { theme } from '../utils/theme';

const PlanManagementScreen: React.FC = () => {
  const handleUpgrade = async () => {
    initializeStripe();
    // In a real app, checkoutWithStripe would open a Stripe checkout flow
    await checkoutWithStripe();
  };

  return (
    <View style={styles.container}>
      <Card containerStyle={styles.card}>
        <Card.Title style={styles.title}>Pro Plan</Card.Title>
        <Text style={styles.description}>Unlock advanced features for $9.99/month.</Text>
        <Button title="Upgrade with Stripe" onPress={handleUpgrade} containerStyle={styles.button} />
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
    justifyContent: 'center',
  },
  card: {
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background.paper,
  },
  title: {
    fontSize: theme.typography.h3.fontSize,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  description: {
    fontSize: theme.typography.body1.fontSize,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  button: {
    marginTop: theme.spacing.sm,
  },
});

export default PlanManagementScreen;
