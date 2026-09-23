import React, { useRef, useState } from 'react';
import {
  GestureResponderEvent,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Text } from '@rneui/themed';
import { setTodoArchived } from '../utils/todoArchive';
import { theme } from '../utils/theme';

type TodoArchiveActionProps = {
  todoId: string;
  archived: boolean;
  compact?: boolean;
  onChanged: () => void | Promise<void>;
};

export const TodoArchiveAction: React.FC<TodoArchiveActionProps> = ({
  todoId,
  archived,
  compact = false,
  onChanged,
}) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const handlePress = async (event: GestureResponderEvent) => {
    event.stopPropagation();
    if (inFlight.current) return;

    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      await setTodoArchived(todoId, !archived);
      await onChanged();
    } catch (archiveError) {
      const errorCode =
        typeof archiveError === 'object' && archiveError !== null
          ? String((archiveError as { code?: unknown }).code || '')
          : '';
      setError(
        errorCode === 'PGRST204' || errorCode === '42703'
          ? `Archiving is not available yet. Your todo has not changed.`
          : archived
            ? 'Could not restore this todo. Please try again.'
            : 'Could not archive this todo. Please try again.',
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.button,
          archived && styles.restoreButton,
          compact && styles.compactButton,
          busy && styles.buttonDisabled,
        ]}
        onPress={handlePress}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={archived ? 'Restore todo' : 'Archive todo'}
        accessibilityState={{ disabled: busy, busy }}
      >
        <Text
          style={[
            styles.buttonText,
            archived && styles.restoreButtonText,
            compact && styles.compactButtonText,
          ]}
        >
          {busy ? 'Saving...' : archived ? 'Restore' : 'Archive todo'}
        </Text>
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: 'rgba(23, 59, 53, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(23, 59, 53, 0.14)',
  },
  restoreButton: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  compactButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: theme.colors.primary.dark,
    fontWeight: '700',
  },
  restoreButtonText: {
    color: theme.colors.primary.contrast,
  },
  compactButtonText: {
    fontSize: theme.typography.caption.fontSize,
  },
  error: {
    color: theme.colors.error.dark,
    fontSize: theme.typography.caption.fontSize,
    marginTop: theme.spacing.xs,
  },
});
