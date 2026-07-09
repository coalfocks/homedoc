import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Keyboard,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Text, Input, Button } from '@rneui/themed';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { supabase } from '../lib/supabase';
import { theme } from '../utils/theme';
import { useTodo, useAllAreas } from '../hooks/useData';
import { useAuth } from '../contexts/AuthContext';

type EditTodoScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'EditTodo'>;
  route: RouteProp<RootStackParamList, 'EditTodo'>;
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

const EditTodoScreen: React.FC<EditTodoScreenProps> = ({
  navigation,
  route,
}) => {
  const { todo, loading, error } = useTodo(route.params.todoId);
  const { user } = useAuth();
  const { areas } = useAllAreas(user?.id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [status, setStatus] = useState<Status>('pending');
  const [areaId, setAreaId] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (todo) {
      setTitle(todo.title);
      setDescription(todo.description || '');
      setPriority(todo.priority);
      setStatus(todo.status);
      setAreaId(todo.area_id);
    }
  }, [todo]);

  const handleSave = async () => {
    if (!title.trim() || !areaId) return;
    try {
      setSaving(true);
      setSaveError(null);
      const { error: updateError } = await supabase
        .from('todos')
        .update({
          title: title.trim(),
          description: description.trim(),
          status,
          priority,
          area_id: areaId,
        })
        .eq('id', todo!.id);
      if (updateError) throw updateError;
      navigation.goBack();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete todo', `Delete "${todo?.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error: deleteError } = await supabase
            .from('todos')
            .delete()
            .eq('id', todo!.id);
          if (!deleteError) navigation.goBack();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.colors.primary.main} />
      </View>
    );
  }

  if (error || !todo) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          {error || 'Todo not found'}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      onScrollBeginDrag={Keyboard.dismiss}
    >
      <View style={styles.section}>
        <Text style={styles.label}>Title</Text>
        <Input
          value={title}
          onChangeText={setTitle}
          placeholder="Todo title"
          placeholderTextColor={theme.colors.text.hint}
          containerStyle={styles.inputContainer}
          inputStyle={styles.input}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Description</Text>
        <Input
          value={description}
          onChangeText={setDescription}
          placeholder="Add details"
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

      {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}

      <Button
        title="Save Changes"
        onPress={handleSave}
        loading={saving}
        disabled={saving || !title.trim()}
        containerStyle={styles.buttonContainer}
        buttonStyle={[
          styles.button,
          (saving || !title.trim()) && styles.disabledButton,
        ]}
        titleStyle={[
          styles.buttonText,
          (saving || !title.trim()) && styles.disabledButtonText,
        ]}
        disabledStyle={styles.disabledButton}
        disabledTitleStyle={styles.disabledButtonText}
      />
      <Button
        title="Cancel"
        onPress={() => navigation.goBack()}
        type="outline"
        containerStyle={styles.cancelButton}
        buttonStyle={styles.cancelButtonStyle}
        titleStyle={styles.cancelButtonText}
      />

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteButtonText}>Delete todo</Text>
      </TouchableOpacity>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.default,
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
  cancelButton: {
    marginTop: theme.spacing.sm,
  },
  cancelButtonStyle: {
    borderColor: theme.colors.primary.main,
    borderRadius: theme.borderRadius.sm,
    height: 50,
  },
  cancelButtonText: {
    color: theme.colors.primary.main,
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    alignSelf: 'center',
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.pill,
    backgroundColor: 'rgba(200, 85, 61, 0.10)',
  },
  deleteButtonText: {
    color: theme.colors.error.dark,
    fontWeight: '700',
  },
  errorText: {
    color: theme.colors.error.main,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
});

export default EditTodoScreen;
