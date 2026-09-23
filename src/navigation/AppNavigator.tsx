import React from 'react';
import { Platform, TouchableOpacity, useWindowDimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from '@rneui/themed';
import { Icon } from '../components/Icon';
import { supabase } from '../utils/supabaseClient';
import { theme } from '../utils/theme';
import { isFreeBeta } from '../config/beta';
import { useAuth } from '../contexts/AuthContext';
import { openFeedbackEmail } from '../utils/feedback';

import HomeScreen from '../screens/HomeScreen';
import AreasScreen from '../screens/AreasScreen';
import NotesScreen from '../screens/NotesScreen';
import TodosScreen from '../screens/TodosScreen';
import PropertyScreen from '../screens/PropertyScreen';
import AreaScreen from '../screens/AreaScreen';
import AreaTodosScreen from '../screens/AreaTodosScreen';
import NoteScreen from '../screens/NoteScreen';
import TodoScreen from '../screens/TodoScreen';
import EditNoteScreen from '../screens/EditNoteScreen';
import EditTodoScreen from '../screens/EditTodoScreen';
import EditPropertyScreen from '../screens/EditPropertyScreen';
import EditAreaScreen from '../screens/EditAreaScreen';
import TransferPropertyScreen from '../screens/TransferPropertyScreen';
import CreatePropertyScreen from '../screens/CreatePropertyScreen';
import CreateAreaScreen from '../screens/CreateAreaScreen';
import CreateNoteScreen from '../screens/CreateNoteScreen';
import CreateTodoScreen from '../screens/CreateTodoScreen';
import UpgradeScreen from '../screens/UpgradeScreen';
import InviteContractorScreen from '../screens/InviteContractorScreen';

export type RootStackParamList = {
  Main: undefined;
  Property: { propertyId: string };
  Area: { areaId: string };
  AreaTodos: { areaId: string };
  Note: { noteId: string };
  Todo: { todoId: string };
  EditNote: { noteId: string };
  EditTodo: { todoId: string };
  EditProperty: { propertyId: string };
  EditArea: { areaId: string };
  TransferProperty: { propertyId: string; mode?: 'share' | 'transfer' };
  CreateProperty: undefined;
  CreateArea: { propertyId: string };
  CreateNote: { areaId: string };
  CreateTodo: { areaId?: string };
  InviteContractor: { areaId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const sharedHeader = {
  headerStyle: {
    backgroundColor: theme.colors.background.elevated,
  },
  headerShadowVisible: false,
  headerTitleAlign: 'center' as const,
  headerTintColor: theme.colors.text.primary,
  headerTitleStyle: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: '700' as const,
    color: theme.colors.text.primary,
  },
  headerBackTitleVisible: false,
};

// Every section owns a stack, so opening a record keeps the main navigation visible.
// Switching sections preserves the previous screen and unfinished forms in each stack.
const createSectionStack = (Home: React.ComponentType<any>) => {
  const SectionStack = () => {
    const { user } = useAuth();
    return (
      <Stack.Navigator
        screenOptions={({ navigation, route }) => ({
          ...sharedHeader,
          animation: 'none',
          presentation: 'card',
          headerBackVisible: false,
          headerLeft: () =>
            route.name === 'Main' ? (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => supabase.auth.signOut()}
                style={{
                  minHeight: 44,
                  justifyContent: 'center',
                  paddingHorizontal: 8,
                }}
              >
                <Text
                  style={{
                    color: theme.colors.text.secondary,
                    fontWeight: '700',
                  }}
                >
                  Sign out
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Back"
                onPress={() => {
                  if (navigation.getState().index > 0) navigation.goBack();
                  else navigation.navigate('Main');
                }}
                style={{
                  minHeight: 44,
                  justifyContent: 'center',
                  paddingHorizontal: 8,
                }}
              >
                <Text
                  style={{
                    color: theme.colors.primary.main,
                    fontWeight: '700',
                    fontSize: 16,
                  }}
                >
                  ‹ Back
                </Text>
              </TouchableOpacity>
            ),
          headerRight: () => (
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => openFeedbackEmail('Main navigation', user?.email)}
              style={{
                minHeight: 44,
                justifyContent: 'center',
                paddingHorizontal: 8,
              }}
            >
              <Text
                style={{ color: theme.colors.primary.main, fontWeight: '700' }}
              >
                Feedback
              </Text>
            </TouchableOpacity>
          ),
        })}
      >
        <Stack.Screen
          name="Main"
          component={Home}
          options={{ title: 'HomeDoc' }}
        />
        <Stack.Screen
          name="Property"
          component={PropertyScreen}
          options={{ title: 'Property' }}
        />
        <Stack.Screen
          name="Area"
          component={AreaScreen}
          options={{ title: 'Area' }}
        />
        <Stack.Screen
          name="AreaTodos"
          component={AreaTodosScreen}
          options={{ title: 'Area Todos' }}
        />
        <Stack.Screen
          name="Note"
          component={NoteScreen}
          options={{ title: 'Note' }}
        />
        <Stack.Screen
          name="Todo"
          component={TodoScreen}
          options={{ title: 'Todo' }}
        />
        <Stack.Screen
          name="EditNote"
          component={EditNoteScreen}
          options={{ title: 'Edit Note' }}
        />
        <Stack.Screen
          name="EditTodo"
          component={EditTodoScreen}
          options={{ title: 'Edit Todo' }}
        />
        <Stack.Screen
          name="EditProperty"
          component={EditPropertyScreen}
          options={{ title: 'Edit Property' }}
        />
        <Stack.Screen
          name="EditArea"
          component={EditAreaScreen}
          options={{ title: 'Edit Area' }}
        />
        <Stack.Screen
          name="TransferProperty"
          component={TransferPropertyScreen}
          options={({ route }) => ({
            title:
              route.params.mode === 'transfer'
                ? 'Transfer Property'
                : 'Share Property',
          })}
        />
        <Stack.Screen
          name="CreateProperty"
          component={CreatePropertyScreen}
          options={{ title: 'Add Property' }}
        />
        <Stack.Screen
          name="CreateArea"
          component={CreateAreaScreen}
          options={{ title: 'Add Area' }}
        />
        <Stack.Screen
          name="CreateNote"
          component={CreateNoteScreen}
          options={{ title: 'Add Note' }}
        />
        <Stack.Screen
          name="CreateTodo"
          component={CreateTodoScreen}
          options={{ title: 'Add Todo' }}
        />
        <Stack.Screen
          name="InviteContractor"
          component={InviteContractorScreen}
          options={{ title: 'Invite Contractor' }}
        />
      </Stack.Navigator>
    );
  };
  return SectionStack;
};

const PropertiesStack = createSectionStack(HomeScreen);
const AreasStack = createSectionStack(AreasScreen);
const NotesStack = createSectionStack(NotesScreen);
const TodosStack = createSectionStack(TodosScreen);
const BetaStack = createSectionStack(UpgradeScreen);

const MainTabs = () => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isWideWeb = Platform.OS === 'web' && width >= 900;

  return (
    <Tab.Navigator
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarPosition: isWideWeb ? 'left' : 'bottom',
        tabBarLabelPosition: isWideWeb ? 'beside-icon' : 'below-icon',
        tabBarActiveTintColor: theme.colors.primary.dark,
        tabBarInactiveTintColor: theme.colors.text.secondary,
        tabBarActiveBackgroundColor: isWideWeb
          ? 'rgba(23, 59, 53, 0.07)'
          : 'transparent',
        tabBarInactiveBackgroundColor: 'transparent',
        tabBarLabelStyle: {
          fontSize: isWideWeb ? 14 : 12,
          fontWeight: isWideWeb ? '700' : '600',
          marginBottom: isWideWeb ? 0 : 4,
        },
        tabBarStyle: {
          backgroundColor: isWideWeb
            ? theme.colors.neutral[100]
            : 'rgba(255,255,255,0.95)',
          borderTopColor: isWideWeb
            ? 'transparent'
            : theme.colors.border.subtle,
          borderRightColor: isWideWeb ? 'rgba(191, 175, 158, 0.55)' : undefined,
          borderRightWidth: isWideWeb ? 1 : 0,
          height: isWideWeb ? '100%' : 68 + insets.bottom,
          width: isWideWeb ? 196 : undefined,
          paddingTop: isWideWeb ? 56 : 8,
          paddingBottom: isWideWeb ? theme.spacing.xl : insets.bottom,
          paddingHorizontal: isWideWeb ? theme.spacing.md : 0,
        },
        tabBarItemStyle: {
          borderRadius: isWideWeb ? theme.borderRadius.sm : 0,
          minHeight: isWideWeb ? 50 : undefined,
          marginBottom: isWideWeb ? 6 : 0,
          paddingHorizontal: isWideWeb ? theme.spacing.sm : 0,
        },
        tabBarIconStyle: {
          marginRight: isWideWeb ? theme.spacing.xs : 0,
        },
        sceneStyle: {
          backgroundColor: theme.colors.background.default,
        },
      }}
    >
      <Tab.Screen
        name="Properties"
        component={PropertiesStack}
        options={{
          tabBarLabel: 'Properties',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Areas"
        component={AreasStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="area" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Notes"
        component={NotesStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="note" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Todos"
        component={TodosStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="todo" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Pro"
        component={BetaStack}
        options={{
          title: isFreeBeta ? 'Beta' : 'Pro',
          tabBarLabel: isFreeBeta ? 'Beta' : 'Pro',
          tabBarIcon: ({ color, size }) => (
            <Icon name="priority" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => (
  <NavigationContainer>
    <MainTabs />
  </NavigationContainer>
);
