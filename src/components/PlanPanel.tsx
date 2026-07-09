import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Linking,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text as RNEText } from '@rneui/themed';
import {
  GeneratedPlan,
  PlanChatMessage,
  supabase,
  supabaseAnonKey,
  supabaseUrl,
} from '../lib/supabase';
import { theme } from '../utils/theme';

type PlanPanelProps = {
  todoId: string;
  plan: GeneratedPlan | null | undefined;
  planStatus: string | null | undefined;
  planChat: PlanChatMessage[] | null | undefined;
  onPlanGenerated: () => void;
};

type Phase = 'idle' | 'questions' | 'plan';

export const PlanPanel: React.FC<PlanPanelProps> = ({
  todoId,
  plan,
  planStatus,
  planChat,
  onPlanGenerated,
}) => {
  const [phase, setPhase] = useState<Phase>(
    plan ? 'plan' : planStatus === 'questioning' ? 'questions' : 'idle',
  );
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startPlanning = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: session } = await supabase.auth.getSession();
      const res = await fetch(`${supabaseUrl}/functions/v1/plan-todo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.session?.access_token}`,
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify({ todoId, phase: 'questions' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get questions');
      setQuestions(data.questions);
      setAnswers({});
      setPhase('questions');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const generatePlan = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: session } = await supabase.auth.getSession();
      const formattedAnswers = questions.map((q, i) => ({
        question: q,
        answer: answers[i] || '',
      }));
      const res = await fetch(`${supabaseUrl}/functions/v1/plan-todo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.session?.access_token}`,
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify({
          todoId,
          phase: 'plan',
          answers: formattedAnswers,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate plan');
      setPhase('plan');
      onPlanGenerated();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingCard}>
        <ActivityIndicator size="large" color={theme.colors.primary.main} />
        <RNEText style={styles.loadingText}>
          {phase === 'idle'
            ? 'Thinking of the right questions...'
            : 'Creating your plan...'}
        </RNEText>
      </View>
    );
  }

  // ── Existing plan ──────────────────────────────────
  if (phase === 'plan' && plan) {
    return (
      <PlanDisplay
        todoId={todoId}
        plan={plan}
        planChat={planChat}
        onChatUpdated={onPlanGenerated}
        onRegenerate={() => setPhase('idle')}
      />
    );
  }

  // ── Questions phase ────────────────────────────────
  if (phase === 'questions') {
    return (
      <View style={styles.container}>
        <RNEText style={styles.heading}>Help me plan this</RNEText>
        <RNEText style={styles.subheading}>
          Answer a few questions and I'll build a detailed plan.
        </RNEText>
        {error && <RNEText style={styles.errorText}>{error}</RNEText>}
        <ScrollView
          scrollEnabled={false}
          style={styles.questionsList}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={Keyboard.dismiss}
        >
          {questions.map((q, i) => (
            <View key={i} style={styles.questionItem}>
              <RNEText style={styles.questionLabel}>
                {i + 1}. {q}
              </RNEText>
              <TextInput
                style={styles.answerInput}
                multiline
                placeholder="Your answer..."
                placeholderTextColor={theme.colors.text.hint}
                value={answers[i] || ''}
                onChangeText={(text) =>
                  setAnswers((prev) => ({ ...prev, [i]: text }))
                }
              />
            </View>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.primaryButton} onPress={generatePlan}>
          <RNEText style={styles.primaryButtonText}>Generate Plan</RNEText>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setPhase('idle')}
        >
          <RNEText style={styles.secondaryButtonText}>Cancel</RNEText>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Idle ───────────────────────────────────────────
  return (
    <View style={styles.container}>
      {error && <RNEText style={styles.errorText}>{error}</RNEText>}
      <TouchableOpacity style={styles.planButton} onPress={startPlanning}>
        <RNEText style={styles.planButtonIcon}>✨</RNEText>
        <View style={styles.planButtonTextContainer}>
          <RNEText style={styles.planButtonTitle}>Help me plan this</RNEText>
          <RNEText style={styles.planButtonSubtitle}>
            Get a step-by-step plan with materials, costs, and tips
          </RNEText>
        </View>
      </TouchableOpacity>
    </View>
  );
};

// ── Plan Display Component ──────────────────────────

const PlanDisplay: React.FC<{
  todoId: string;
  plan: GeneratedPlan;
  planChat: PlanChatMessage[] | null | undefined;
  onChatUpdated: () => void;
  onRegenerate: () => void;
}> = ({ todoId, plan, planChat, onChatUpdated, onRegenerate }) => {
  const [messages, setMessages] = useState<PlanChatMessage[]>(planChat ?? []);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const difficultyColors: Record<string, string> = {
    easy: '#2d8659',
    moderate: '#d4941a',
    hard: '#d45a1a',
    expert: '#c63838',
  };

  useEffect(() => {
    setMessages(planChat ?? []);
  }, [planChat]);

  const sendMessage = async () => {
    const message = draft.trim();
    if (!message || sending) return;

    const optimisticUserMessage: PlanChatMessage = {
      role: 'user',
      content: message,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticUserMessage]);
    setDraft('');
    setSending(true);
    setChatError(null);

    try {
      const { data: session } = await supabase.auth.getSession();
      const res = await fetch(`${supabaseUrl}/functions/v1/plan-todo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.session?.access_token}`,
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify({ todoId, phase: 'chat', message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to ask about plan');

      if (Array.isArray(data.chat)) {
        setMessages(data.chat);
      } else if (data.message) {
        setMessages((prev) => [...prev, data.message]);
      }
      onChatUpdated();
    } catch (e) {
      setChatError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setSending(false);
    }
  };

  const openProductLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      setChatError('Could not open that product link.');
    }
  };

  return (
    <View style={styles.planContainer}>
      <View style={styles.planHeader}>
        <RNEText style={styles.heading}>📋 Your Plan</RNEText>
        <TouchableOpacity onPress={onRegenerate}>
          <RNEText style={styles.regenerateText}>Redo</RNEText>
        </TouchableOpacity>
      </View>

      <RNEText style={styles.summary}>{plan.summary}</RNEText>

      {/* Quick stats */}
      <View style={styles.statsRow}>
        <View style={styles.statPill}>
          <RNEText style={styles.statLabel}>Difficulty</RNEText>
          <RNEText
            style={[
              styles.statValue,
              {
                color:
                  difficultyColors[plan.difficulty] ||
                  theme.colors.text.primary,
              },
            ]}
          >
            {plan.difficulty.charAt(0).toUpperCase() + plan.difficulty.slice(1)}
          </RNEText>
        </View>
        <View style={styles.statPill}>
          <RNEText style={styles.statLabel}>Time</RNEText>
          <RNEText style={styles.statValue}>{plan.estimatedTime}</RNEText>
        </View>
        <View style={styles.statPill}>
          <RNEText style={styles.statLabel}>Cost</RNEText>
          <RNEText style={styles.statValue}>
            {plan.estimatedCostRange.currency === 'USD' ? '$' : ''}
            {plan.estimatedCostRange.min}–{plan.estimatedCostRange.max}
          </RNEText>
        </View>
      </View>

      {/* Warnings */}
      {plan.warnings.length > 0 && (
        <View style={styles.section}>
          <RNEText style={styles.sectionTitle}>⚠️ Warnings</RNEText>
          {plan.warnings.map((w, i) => (
            <View key={i} style={styles.warningItem}>
              <RNEText style={styles.warningText}>• {w}</RNEText>
            </View>
          ))}
        </View>
      )}

      {/* Steps */}
      {plan.steps.length > 0 && (
        <View style={styles.section}>
          <RNEText style={styles.sectionTitle}>Steps</RNEText>
          {plan.steps.map((step, i) => (
            <View key={i} style={styles.stepCard}>
              <View style={styles.stepNumber}>
                <RNEText style={styles.stepNumberText}>{i + 1}</RNEText>
              </View>
              <View style={styles.stepBody}>
                <RNEText style={styles.stepTitle}>{step.title}</RNEText>
                <RNEText style={styles.stepDescription}>
                  {step.description}
                </RNEText>
                {step.tips && (
                  <RNEText style={styles.stepTip}>💡 {step.tips}</RNEText>
                )}
                {step.estimatedMinutes && (
                  <RNEText style={styles.stepMeta}>
                    ~{step.estimatedMinutes} min
                  </RNEText>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Materials */}
      {plan.materials.length > 0 && (
        <View style={styles.section}>
          <RNEText style={styles.sectionTitle}>Materials & Parts</RNEText>
          {plan.materials.map((m, i) => (
            <View key={i} style={styles.materialRow}>
              <View style={styles.materialInfo}>
                <RNEText style={styles.materialName}>{m.name}</RNEText>
                {m.notes && (
                  <RNEText style={styles.materialNotes}>{m.notes}</RNEText>
                )}
                {m.purchaseUrl ? (
                  <TouchableOpacity
                    style={styles.materialLink}
                    onPress={() => openProductLink(m.purchaseUrl!)}
                  >
                    <RNEText style={styles.materialLinkText}>
                      View product
                    </RNEText>
                  </TouchableOpacity>
                ) : null}
              </View>
              <RNEText style={styles.materialPrice}>
                ${m.estimatedPrice.toFixed(0)}
              </RNEText>
            </View>
          ))}
          <RNEText style={styles.materialTotal}>
            Estimated total: $
            {plan.materials
              .reduce((sum, m) => sum + m.estimatedPrice, 0)
              .toFixed(0)}
          </RNEText>
        </View>
      )}

      {/* Tools */}
      {plan.tools.length > 0 && (
        <View style={styles.section}>
          <RNEText style={styles.sectionTitle}>Tools Needed</RNEText>
          <View style={styles.toolsRow}>
            {plan.tools.map((t, i) => (
              <View key={i} style={styles.toolChip}>
                <RNEText style={styles.toolChipText}>{t}</RNEText>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Professional Help */}
      {plan.professionalHelp && plan.professionalHelp.length > 0 && (
        <View style={styles.section}>
          <RNEText style={styles.sectionTitle}>When to Call a Pro</RNEText>
          {plan.professionalHelp.map((p, i) => (
            <View key={i} style={styles.proCard}>
              <RNEText style={styles.proType}>{p.type}</RNEText>
              <RNEText style={styles.proWhen}>{p.when}</RNEText>
              {p.averageCost && (
                <RNEText style={styles.proCost}>~{p.averageCost}</RNEText>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Checkpoints */}
      {plan.checkpoints.length > 0 && (
        <View style={styles.section}>
          <RNEText style={styles.sectionTitle}>Checkpoints</RNEText>
          {plan.checkpoints.map((c, i) => (
            <View key={i} style={styles.checkpointRow}>
              <RNEText style={styles.checkpointIcon}>✓</RNEText>
              <RNEText style={styles.checkpointText}>{c}</RNEText>
            </View>
          ))}
        </View>
      )}

      <View style={styles.chatSection}>
        <View style={styles.chatHeader}>
          <RNEText style={styles.sectionTitle}>Ask About This Plan</RNEText>
          <RNEText style={styles.chatHint}>
            Follow-ups stay with this todo.
          </RNEText>
        </View>

        {messages.length > 0 && (
          <View style={styles.chatMessages}>
            {messages.map((message, i) => (
              <View
                key={`${message.createdAt}-${i}`}
                style={[
                  styles.chatBubble,
                  message.role === 'user'
                    ? styles.userBubble
                    : styles.assistantBubble,
                ]}
              >
                <RNEText
                  style={[
                    styles.chatBubbleText,
                    message.role === 'user'
                      ? styles.userBubbleText
                      : styles.assistantBubbleText,
                  ]}
                >
                  {message.content}
                </RNEText>
              </View>
            ))}
          </View>
        )}

        {chatError && <RNEText style={styles.errorText}>{chatError}</RNEText>}

        <View style={styles.chatInputRow}>
          <TextInput
            style={styles.chatInput}
            multiline
            placeholder="Ask a follow-up..."
            placeholderTextColor={theme.colors.text.hint}
            value={draft}
            onChangeText={setDraft}
            blurOnSubmit
            onSubmitEditing={Keyboard.dismiss}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!draft.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={!draft.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator
                size="small"
                color={theme.colors.primary.contrast}
              />
            ) : (
              <RNEText style={styles.sendButtonText}>Ask</RNEText>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
  },
  loadingCard: {
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  loadingText: {
    color: theme.colors.text.secondary,
    fontSize: 15,
  },
  heading: {
    color: theme.colors.text.primary,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  subheading: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    marginBottom: theme.spacing.md,
  },
  planButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: 'rgba(31, 77, 107, 0.06)',
    borderWidth: 1.5,
    borderColor: theme.colors.primary.main,
    borderStyle: 'dashed',
  },
  planButtonIcon: {
    fontSize: 28,
  },
  planButtonTextContainer: {
    flex: 1,
  },
  planButtonTitle: {
    color: theme.colors.primary.main,
    fontSize: 16,
    fontWeight: '800',
  },
  planButtonSubtitle: {
    color: theme.colors.text.secondary,
    fontSize: 13,
    marginTop: 2,
  },
  questionsList: {
    marginBottom: theme.spacing.md,
  },
  questionItem: {
    marginBottom: theme.spacing.md,
  },
  questionLabel: {
    color: theme.colors.text.primary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  answerInput: {
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    fontSize: 15,
    color: theme.colors.text.primary,
    backgroundColor: 'rgba(255,255,255,0.8)',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: theme.colors.primary.main,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  primaryButtonText: {
    color: theme.colors.primary.contrast,
    fontWeight: '800',
    fontSize: 16,
  },
  secondaryButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  errorText: {
    color: theme.colors.error.dark,
    fontSize: 14,
    marginBottom: theme.spacing.sm,
  },
  // Plan display styles
  planContainer: {
    marginBottom: theme.spacing.xl,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  regenerateText: {
    color: theme.colors.primary.main,
    fontWeight: '700',
    fontSize: 14,
  },
  summary: {
    color: theme.colors.text.primary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: theme.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  statPill: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    alignItems: 'center',
  },
  statLabel: {
    color: theme.colors.text.hint,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    color: theme.colors.text.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: theme.spacing.sm,
  },
  warningItem: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(200, 85, 61, 0.08)',
    marginBottom: 6,
  },
  warningText: {
    color: theme.colors.error.dark,
    fontSize: 14,
    lineHeight: 20,
  },
  stepCard: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    marginBottom: theme.spacing.sm,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: theme.colors.primary.contrast,
    fontWeight: '800',
    fontSize: 15,
  },
  stepBody: {
    flex: 1,
  },
  stepTitle: {
    color: theme.colors.text.primary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  stepDescription: {
    color: theme.colors.text.slate,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  stepTip: {
    color: theme.colors.text.secondary,
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 2,
  },
  stepMeta: {
    color: theme.colors.text.hint,
    fontSize: 12,
    fontWeight: '600',
  },
  materialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.subtle,
  },
  materialInfo: {
    flex: 1,
  },
  materialName: {
    color: theme.colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  materialNotes: {
    color: theme.colors.text.hint,
    fontSize: 12,
    marginTop: 2,
  },
  materialLink: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: 'rgba(31, 77, 107, 0.08)',
  },
  materialLinkText: {
    color: theme.colors.primary.main,
    fontSize: 12,
    fontWeight: '800',
  },
  materialPrice: {
    color: theme.colors.text.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  materialTotal: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: theme.spacing.sm,
  },
  toolsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  toolChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: 'rgba(63, 127, 104, 0.1)',
  },
  toolChipText: {
    color: theme.colors.accent.dark,
    fontSize: 13,
    fontWeight: '600',
  },
  proCard: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    marginBottom: theme.spacing.sm,
  },
  proType: {
    color: theme.colors.primary.dark,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  proWhen: {
    color: theme.colors.text.slate,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  proCost: {
    color: theme.colors.text.hint,
    fontSize: 13,
    fontWeight: '600',
  },
  checkpointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    marginBottom: 8,
  },
  checkpointIcon: {
    color: theme.colors.accent.dark,
    fontWeight: '800',
    fontSize: 16,
  },
  checkpointText: {
    color: theme.colors.text.primary,
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  chatSection: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    marginTop: theme.spacing.sm,
  },
  chatHeader: {
    marginBottom: theme.spacing.sm,
  },
  chatHint: {
    color: theme.colors.text.hint,
    fontSize: 12,
    fontWeight: '600',
  },
  chatMessages: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  chatBubble: {
    maxWidth: '92%',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.lg,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.primary.main,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(31, 77, 107, 0.08)',
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  chatBubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userBubbleText: {
    color: theme.colors.primary.contrast,
  },
  assistantBubbleText: {
    color: theme.colors.text.primary,
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
  },
  chatInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.colors.text.primary,
    backgroundColor: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    textAlignVertical: 'top',
  },
  sendButton: {
    minWidth: 58,
    height: 44,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  sendButtonDisabled: {
    opacity: 0.55,
  },
  sendButtonText: {
    color: theme.colors.primary.contrast,
    fontSize: 14,
    fontWeight: '800',
  },
});
