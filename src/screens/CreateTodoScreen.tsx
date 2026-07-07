import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Text, Input, Button } from '@rneui/themed';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { supabase } from '../lib/supabase';
import { theme } from '../utils/theme';
import { useAuth } from '../contexts/AuthContext';
import { useAllAreas } from '../hooks/useData';
import type { Todo } from '../lib/supabase';

type CreateTodoScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CreateTodo'>;
  route: RouteProp<RootStackParamList, 'CreateTodo'>;
};

type Priority = 'low' | 'medium' | 'high';
type Status = 'pending' | 'in_progress' | 'done';

const priorities: { label: string; value: Priority }[] = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
];

const statuses: { label: string; value: Status }[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Done', value: 'done' },
];

const CreateTodoScreen: React.FC<CreateTodoScreenProps> = ({
  navigation,
  route,
}) => {
  const { user } = useAuth();
  const { areas, loading: areasLoading } = useAllAreas(user?.id);
  const preselectedAreaId = route.params?.areaId;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [status, setStatus] = useState<Status>('pending');
  const [areaId, setAreaId] = useState<string | undefined>(preselectedAreaId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedAreaId) setAreaId(preselectedAreaId);
  }, [preselectedAreaId]);

  const handleCreate = async () => {
    if (!title.trim() || !areaId) return;
    try {
      setSaving(true);
      setError(null);
      const { error: insertError } = await supabase.from('todos').insert([
        {
          title: title.trim(),
          description: description.trim(),
          status,
          priority,
          area_id: areaId,
        },
      ]);
      if (insertError) throw insertError;
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.section}>
        <Text style={styles.label}>Title</Text>
        <Input
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Replace light fixture"
          placeholderTextColor={theme.colors.text.hint}
          containerStyle={styles.inputContainer}
          inputStyle={styles.input}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Description (optional)</Text>
        <Input
          value={description}
          onChangeText={setDescription}
          placeholder="Add details, parts needed, etc."
          placeholderTextColor={theme.colors.text.hint}
          multiline
          numberOfLines={4}
          containerStyle={styles.inputContainer}
          inputStyle={[styles.input, styles.textArea]}
        />
      </View>

      {/* Area picker */}
      <View style={styles.section}>
        <Text style={styles.label}>Area</Text>
        {areasLoading ? (
          <ActivityIndicator color={theme.colors.primary.main} />
        ) : preselectedAreaId ? (
          <View style={styles.areaSelected}>
            <Text style={styles.areaSelectedText}>
              {areas.find((a) => a.id === preselectedAreaId)?.name ||
                'Selected area'}
            </Text>
          </View>
        ) : (
          <View style={styles.areaList}>
            {areas.map((area) => (
              <TouchableOpacity
                key={area.id}
                style={[
                  styles.areaOption,
                  areaId === area.id && styles.areaOptionActive,
                ]}
                onPress={() => setAreaId(area.id)}
              >
                <Text
                  style={[
                    styles.areaOptionText,
                    areaId === area.id && styles.areaOptionTextActive,
                  ]}
                >
                  {(area as any).properties?.name
                    ? `${(area as any).properties.name} — `
                    : ''}
                  {area.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Priority picker */}
      <View style={styles.section}>
        <Text style={styles.label}>Priority</Text>
        <View style={styles.pillRow}>
          {priorities.map((p) => (
            <TouchableOpacity
              key={p.value}
              style={[
                styles.pill,
                priority === p.value && styles.pillActive,
              ]}
              onPress={() => setPriority(p.value)}
            >
              <Text
                style={[
                  styles.pillText,
                  priority === p.value && styles.pillTextActive,
                ]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Status picker */}
      <View style={styles.section}>
        <Text style={styles.label}>Status</Text>
        <View style={styles.pillRow}>
          {statuses.map((s) => (
            <TouchableOpacity
              key={s.value}
              style={[
                styles.pill,
                status === s.value && styles.pillActive,
              ]}
              onPress={() => setStatus(s.value)}
            >
              <Text
                style={[
                  styles.pillText,
                  status === s.value && styles.pillTextActive,
                ]}
              >
                {s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Button
        title="Create Todo"
        onPress={handleCreate}
        loading={saving}
        disabled={saving || !title.trim() || !areaId}
        containerStyle={styles.buttonContainer}
        buttonStyle={[
          styles.button,
          (saving || !title.trim() || !areaId) && styles.disabledButton,
        ]}
        titleStyle={[
          styles.buttonText,
          (saving || !title.trim() || !areaId) && styles.disabledButtonText,
        ]}
        disabledStyle={styles.disabledButton}
        disabledTitleStyle={styles.disabledButtonText}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.default,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 120,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  inputContainer: {
    paddingHorizontal: 0,
  },
  input: {
    color: theme.colors.text.primary,
    fontSize: 16,
    paddingHorizontal: theme.spacing.md,
  },
  textArea: {
    paddingTop: 12,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  areaSelected: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(31, 77, 107, 0.08)',
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  areaSelectedText: {
    color: theme.colors.primary.dark,
    fontWeight: '600',
  },
  areaList: {
    gap: theme.spacing.xs,
  },
  areaOption: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  areaOptionActive: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  areaOptionText: {
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  areaOptionTextActive: {
    color: theme.colors.primary.contrast,
  },
  pillRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    flexWrap: 'wrap',
  },
  pill: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: theme.colors.border.subtle,
  },
  pillActive: {
    backgroundColor: theme.colors.primary.main,
    borderColor: theme.colors.primary.main,
  },
  pillText: {
    color: theme.colors.text.secondary,
    fontWeight: '600',
    fontSize: 14,
  },
  pillTextActive: {
    color: theme.colors.primary.contrast,
  },
  buttonContainer: {
    marginTop: theme.spacing.lg,
  },
  button: {
    backgroundColor: theme.colors.primary.main,
    borderRadius: theme.borderRadius.sm,
    height: 50,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary.contrast,
  },
  disabledButton: {
    backgroundColor: theme.colors.background.paper,
    opacity: 0.7,
  },
  disabledButtonText: {
    color: theme.colors.text.disabled,
  },
  errorText: {
    color: theme.colors.error.main,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
});

export default CreateTodoScreen;
