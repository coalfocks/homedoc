import { useRoute, useIsFocused } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import { Text } from '@rneui/themed';
import { theme } from '../utils/theme';
import { Icon } from './Icon';

type ScreenProps = {
  children: React.ReactNode;
  scroll?: boolean;
  contentContainerStyle?: ViewStyle;
  style?: ViewStyle;
};

const scrollOffsets = new Map<string, number>();

export const Screen: React.FC<ScreenProps> = ({
  children,
  scroll = false,
  contentContainerStyle,
  style,
}) => {
  const route = useRoute();
  const isFocused = useIsFocused();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const routeKey = route.key;
  const horizontalPadding = width < 420 ? theme.spacing.md : theme.spacing.lg;

  const restoreScrollOffset = useCallback(() => {
    if (!scroll || !isFocused) return;

    const savedOffset = scrollOffsets.get(routeKey);
    if (!savedOffset) return;

    scrollRef.current?.scrollTo({ y: savedOffset, animated: false });
  }, [isFocused, routeKey, scroll]);

  useEffect(() => {
    if (!scroll || !isFocused) return;

    const restoreTimer = setTimeout(() => {
      restoreScrollOffset();
    }, 0);

    return () => clearTimeout(restoreTimer);
  }, [isFocused, restoreScrollOffset, scroll]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollOffsets.set(routeKey, event.nativeEvent.contentOffset.y);
  };

  if (scroll) {
    return (
      <KeyboardAvoidingView
        style={[styles.screen, style]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <BackgroundWash />
        <ScrollView
          ref={scrollRef}
          nativeID={
            Platform.OS === 'web' ? `app-screen-scroll-${routeKey}` : undefined
          }
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: horizontalPadding },
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          contentInsetAdjustmentBehavior="automatic"
          keyboardDismissMode={
            Platform.OS === 'ios' ? 'interactive' : 'on-drag'
          }
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={restoreScrollOffset}
          onScrollBeginDrag={Keyboard.dismiss}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={[styles.screen, style]} removeClippedSubviews>
      <BackgroundWash />
      <View
        style={[
          styles.content,
          { paddingHorizontal: horizontalPadding },
          contentContainerStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
};

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export const PageHeader: React.FC<PageHeaderProps> = ({
  eyebrow,
  title,
  subtitle,
  actionLabel,
  onActionPress,
}) => {
  const { width } = useWindowDimensions();
  const isNarrow = width < 520;

  return (
    <View style={styles.headerBlock}>
      <View style={[styles.headerRow, isNarrow && styles.headerRowNarrow]}>
        <View style={styles.headerText}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle ? (
            <Text style={styles.headerSubtitle}>{subtitle}</Text>
          ) : null}
        </View>
        {actionLabel && onActionPress ? (
          <TouchableOpacity
            style={[styles.headerAction, isNarrow && styles.headerActionNarrow]}
            onPress={onActionPress}
          >
            <Text style={styles.headerActionText}>{actionLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

type MetricPillProps = {
  label: string;
  value: string;
};

export const MetricPill: React.FC<MetricPillProps> = ({ label, value }) => (
  <View style={styles.metricPill}>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

type EmptyStateCardProps = {
  icon: 'home' | 'area' | 'note' | 'todo';
  title: string;
  description: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export const EmptyStateCard: React.FC<EmptyStateCardProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onActionPress,
}) => (
  <View style={styles.emptyCard}>
    <View style={styles.emptyIconWrap}>
      <Icon name={icon} size={28} color={theme.colors.primary.main} />
    </View>
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptyDescription}>{description}</Text>
    {actionLabel && onActionPress ? (
      <TouchableOpacity style={styles.emptyButton} onPress={onActionPress}>
        <Text style={styles.emptyButtonText}>{actionLabel}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

type LoadingStateCardProps = {
  title?: string;
};

export const LoadingStateCard: React.FC<LoadingStateCardProps> = ({
  title = 'Loading...',
}) => (
  <View style={styles.loadingCard}>
    <ActivityIndicator size="small" color={theme.colors.primary.main} />
    <Text style={styles.loadingText}>{title}</Text>
  </View>
);

type SectionTitleProps = {
  title: string;
  subtitle?: string;
};

export const SectionTitle: React.FC<SectionTitleProps> = ({
  title,
  subtitle,
}) => (
  <View style={styles.sectionTitleWrap}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
  </View>
);

type FloatingActionProps = {
  label: string;
  onPress: () => void;
};

export const FloatingAction: React.FC<FloatingActionProps> = ({
  label,
  onPress,
}) => (
  <TouchableOpacity style={styles.fab} onPress={onPress} activeOpacity={0.9}>
    <Icon name="add" size={18} color={theme.colors.primary.contrast} />
    <Text style={styles.fabLabel}>{label}</Text>
  </TouchableOpacity>
);

type StatusBannerProps = {
  title: string;
  body: string;
};

export const StatusBanner: React.FC<StatusBannerProps> = ({ title, body }) => (
  <View style={styles.banner}>
    <Text style={styles.bannerTitle}>{title}</Text>
    <Text style={styles.bannerBody}>{body}</Text>
  </View>
);

type PriorityBadgeProps = {
  priority: 'low' | 'medium' | 'high';
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const config = {
    low: {
      bg: 'rgba(46, 111, 149, 0.12)',
      color: theme.colors.info.dark,
      label: 'Low',
    },
    medium: {
      bg: 'rgba(217, 164, 65, 0.14)',
      color: theme.colors.warning.dark,
      label: 'Medium',
    },
    high: {
      bg: 'rgba(200, 85, 61, 0.12)',
      color: theme.colors.error.dark,
      label: 'High',
    },
  };
  const c = config[priority];
  return (
    <View style={[styles.priorityBadge, { backgroundColor: c.bg }]}>
      <Text style={[styles.priorityBadgeText, { color: c.color }]}>
        {c.label}
      </Text>
    </View>
  );
};

type StatusBadgeProps = {
  status: 'pending' | 'in_progress' | 'done';
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = {
    pending: {
      bg: 'rgba(107, 114, 128, 0.12)',
      color: '#4B5563',
      label: 'Pending',
    },
    in_progress: {
      bg: 'rgba(217, 164, 65, 0.14)',
      color: theme.colors.warning.dark,
      label: 'In Progress',
    },
    done: {
      bg: 'rgba(47, 133, 90, 0.12)',
      color: theme.colors.success.dark,
      label: 'Done',
    },
  };
  const c = config[status];
  return (
    <View style={[styles.statusBadge, { backgroundColor: c.bg }]}>
      <Text style={[styles.statusBadgeText, { color: c.color }]}>
        {c.label}
      </Text>
    </View>
  );
};

const BackgroundWash = () => (
  <>
    <View style={styles.washTop} pointerEvents="none" />
    <View style={styles.washBottom} pointerEvents="none" />
  </>
);

type AddButtonProps = {
  label: string;
  onPress: () => void;
};

export const AddButton: React.FC<AddButtonProps> = ({ label, onPress }) => (
  <TouchableOpacity
    style={addButtonStyles.container}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Icon name="add" size={18} color={theme.colors.primary.main} />
    <Text style={addButtonStyles.label}>{label}</Text>
  </TouchableOpacity>
);

type SortControlOption<T extends string> = {
  label: string;
  value: T;
};

type SortControlProps<T extends string> = {
  value: T;
  options: SortControlOption<T>[];
  onChange: (value: T) => void;
};

export const SortControl = <T extends string>({
  value,
  options,
  onChange,
}: SortControlProps<T>) => (
  <View style={sortControlStyles.container}>
    <Text style={sortControlStyles.label}>Sort</Text>
    <View style={sortControlStyles.optionRow}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[
              sortControlStyles.option,
              selected ? sortControlStyles.optionSelected : null,
            ]}
            onPress={() => onChange(option.value)}
            activeOpacity={0.82}
          >
            <Text
              style={[
                sortControlStyles.optionText,
                selected ? sortControlStyles.optionTextSelected : null,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

const addButtonStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    minHeight: 44,
    paddingVertical: 11,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(40, 80, 106, 0.06)',
    borderWidth: 1,
    borderColor: theme.colors.primary.main,
    marginBottom: theme.spacing.md,
  },
  label: {
    color: theme.colors.primary.main,
    fontWeight: '700',
    fontSize: 15,
  },
});

const sortControlStyles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    color: theme.colors.text.secondary,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  optionRow: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(40, 80, 106, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(40, 80, 106, 0.12)',
  },
  option: {
    flex: 1,
    alignItems: 'center',
    minHeight: 34,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.xs,
  },
  optionSelected: {
    backgroundColor: theme.colors.background.paper,
    ...theme.shadows.sm,
  },
  optionText: {
    color: theme.colors.text.slate,
    fontSize: theme.typography.body2.fontSize,
    fontWeight: '700',
  },
  optionTextSelected: {
    color: theme.colors.primary.dark,
  },
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    paddingBottom: 96,
  },
  scrollContent: {
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    paddingBottom: 120,
  },
  washTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 84,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  washBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: 'rgba(40, 80, 106, 0.03)',
  },
  headerBlock: {
    marginBottom: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  headerRowNarrow: {
    flexDirection: 'column',
    gap: theme.spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  eyebrow: {
    color: theme.colors.text.secondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0,
    marginBottom: theme.spacing.xs,
  },
  headerTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.h1.fontSize,
    lineHeight: theme.typography.h1.lineHeight,
    fontWeight: '800',
  },
  headerSubtitle: {
    marginTop: 6,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.body2.fontSize,
    lineHeight: theme.typography.body2.lineHeight,
    maxWidth: 620,
  },
  headerAction: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.background.elevated,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  headerActionNarrow: {
    width: '100%',
    alignItems: 'center',
  },
  headerActionText: {
    color: theme.colors.primary.main,
    fontWeight: '700',
  },
  metricPill: {
    minWidth: 92,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.background.elevated,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  metricValue: {
    color: theme.colors.text.primary,
    fontSize: 20,
    fontWeight: '800',
  },
  metricLabel: {
    marginTop: 2,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '600',
  },
  emptyCard: {
    alignItems: 'flex-start',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background.elevated,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  emptyIconWrap: {
    width: 42,
    height: 42,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(40, 80, 106, 0.09)',
    marginBottom: theme.spacing.sm,
  },
  emptyTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.h3.fontSize,
    fontWeight: '700',
    textAlign: 'left',
  },
  emptyDescription: {
    marginTop: theme.spacing.xs,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.body2.fontSize,
    lineHeight: theme.typography.body2.lineHeight,
    textAlign: 'left',
  },
  emptyButton: {
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.primary.main,
  },
  emptyButtonText: {
    color: theme.colors.primary.contrast,
    fontWeight: '700',
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.background.elevated,
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
    marginBottom: theme.spacing.lg,
  },
  loadingText: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitleWrap: {
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.h4.fontSize,
    fontWeight: '700',
  },
  sectionSubtitle: {
    marginTop: 4,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.body2.fontSize,
    lineHeight: theme.typography.body2.lineHeight,
  },
  fab: {
    position: 'absolute',
    right: theme.spacing.lg,
    bottom: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: theme.colors.primary.main,
    ...theme.shadows.lg,
  },
  fabLabel: {
    color: theme.colors.primary.contrast,
    fontWeight: '700',
  },
  banner: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(40, 80, 106, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(40, 80, 106, 0.14)',
    marginBottom: theme.spacing.lg,
  },
  bannerTitle: {
    color: theme.colors.text.primary,
    fontWeight: '700',
    marginBottom: 2,
  },
  bannerBody: {
    color: theme.colors.text.slate,
    lineHeight: 20,
  },
  priorityBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.pill,
    alignSelf: 'flex-start',
  },
  priorityBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.pill,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0,
  },
});
