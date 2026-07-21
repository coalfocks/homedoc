import React, { useState } from 'react';
import { Keyboard, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Input, Text } from '@rneui/themed';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { supabase } from '../lib/supabase';
import {
  CreationCard,
  CreationIntro,
  CreationPrompt,
  ErrorPanel,
  SubmitFooter,
} from '../components/CreationFlow';
import { theme } from '../utils/theme';

type InviteContractorScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'InviteContractor'>;
  route: RouteProp<RootStackParamList, 'InviteContractor'>;
};

const InviteContractorScreen: React.FC<InviteContractorScreenProps> = ({
  navigation,
  route,
}) => {
  const { areaId } = route.params;
  const [contractorEmail, setContractorEmail] = useState('');
  const [contractorName, setContractorName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [trade, setTrade] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isReady = /\S+@\S+\.\S+/.test(contractorEmail.trim());
  const completedSteps =
    (isReady ? 1 : 0) +
    (contractorName.trim() ? 1 : 0) +
    (companyName.trim() ? 1 : 0) +
    (trade.trim() ? 1 : 0);

  const handleInvite = async () => {
    try {
      setLoading(true);
      setError(null);

      const { error: inviteError } = await supabase.functions.invoke(
        'invite-contractor',
        {
          body: {
            areaId,
            contractorEmail: contractorEmail.trim().toLowerCase(),
            contractorName: contractorName.trim() || undefined,
            companyName: companyName.trim() || undefined,
            trade: trade.trim() || undefined,
          },
        },
      );

      if (inviteError) {
        throw inviteError;
      }

      setSent(true);
      setTimeout(() => navigation.goBack(), 650);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not grant contractor access right now.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={Keyboard.dismiss}
      >
        <CreationIntro
          eyebrow="Contractor access"
          title="Let a contractor document the work"
          subtitle="Grant scoped access to this area so a trusted pro can add work notes without owning the whole property record."
          stepLabel={
            isReady
              ? 'Contractor email is ready.'
              : 'An existing HomeDoc account email is required.'
          }
          completedSteps={completedSteps}
          totalSteps={4}
        />

        <CreationPrompt
          icon="note"
          title="Scoped access only"
          body="The contractor can see this area and add notes here. They do not get ownership of the property."
        />

        <CreationCard>
          <Input
            label="Contractor email"
            value={contractorEmail}
            onChangeText={setContractorEmail}
            placeholder="contractor@example.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            containerStyle={styles.inputContainer}
            inputStyle={styles.input}
            labelStyle={styles.label}
          />
          <Input
            label="Contact name (optional)"
            value={contractorName}
            onChangeText={setContractorName}
            placeholder="Name shown on work notes"
            autoCapitalize="words"
            containerStyle={styles.inputContainer}
            inputStyle={styles.input}
            labelStyle={styles.label}
          />
          <Input
            label="Company (optional)"
            value={companyName}
            onChangeText={setCompanyName}
            placeholder="Company name"
            autoCapitalize="words"
            containerStyle={styles.inputContainer}
            inputStyle={styles.input}
            labelStyle={styles.label}
          />
          <Input
            label="Trade (optional)"
            value={trade}
            onChangeText={setTrade}
            placeholder="Plumbing, HVAC, roofing..."
            autoCapitalize="words"
            containerStyle={styles.inputContainer}
            inputStyle={styles.input}
            labelStyle={styles.label}
          />

          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>V1 limitation</Text>
            <Text style={styles.noticeBody}>
              The contractor needs a HomeDoc account first. Email delivery for
              invites comes next.
            </Text>
          </View>

          <ErrorPanel message={error} />
        </CreationCard>

        <SubmitFooter
          title="Grant Access"
          hint="Let this contractor add work notes"
          onPress={handleInvite}
          loading={loading}
          success={sent}
          disabled={loading || !isReady}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: 220,
  },
  inputContainer: {
    paddingHorizontal: 0,
  },
  input: {
    color: theme.colors.text.primary,
    fontSize: 16,
    paddingHorizontal: theme.spacing.md,
  },
  label: {
    color: theme.colors.text.primary,
    fontSize: 16,
    marginBottom: theme.spacing.sm,
  },
  notice: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(31, 77, 107, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(31, 77, 107, 0.14)',
  },
  noticeTitle: {
    color: theme.colors.primary.dark,
    fontWeight: '800',
    marginBottom: theme.spacing.xs,
  },
  noticeBody: {
    color: theme.colors.text.slate,
    lineHeight: theme.typography.body2.lineHeight,
  },
});

export default InviteContractorScreen;
