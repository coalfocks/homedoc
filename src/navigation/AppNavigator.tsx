import React from 'react';
import { TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from '@rneui/themed';
import { Icon } from '../components/Icon';
import { supabase } from '../utils/supabaseClient';
import { theme } from '../utils/theme';

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
  TransferProperty: { propertyId: string };
  CreateProperty: undefined;
  CreateArea: { propertyId: string };
  CreateNote: { areaId: string };
  CreateTodo: { areaId?: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const sharedHeader = {
  headerStyle: {
    backgroundColor: theme.colors.background.elevated,
  },
  headerShadowVisible: false,
  headerTintColor: theme.colors.text.primary,
  headerTitleStyle: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: '700' as const,
    color: theme.colors.text.primary,
  },
  headerBackTitleVisible: false,
};

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: theme.colors.primary.main,
      tabBarInactiveTintColor: theme.colors.text.secondary,
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
      },
      tabBarStyle: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderTopColor: theme.colors.border.subtle,
        height: 68,
        paddingTop: 8,
      },
      sceneStyle: {
        backgroundColor: theme.colors.background.default,
      },
      headerStyle: {
        backgroundColor: theme.colors.background.default,
      },
      headerShadowVisible: false,
      headerTitleStyle: {
        fontSize: theme.typography.h4.fontSize,
        fontWeight: '700',
        color: theme.colors.text.primary,
      },
      headerRight: () => (
        <TouchableOpacity onPress={() => supabase.auth.signOut()}>
          <Text
            style={{
              color: theme.colors.primary.main,
              fontWeight: '700',
              marginRight: theme.spacing.md,
            }}
          >
            Sign out
          </Text>
        </TouchableOpacity>
      ),
    }}
  >
    <Tab.Screen
      name="Properties"
      component={HomeScreen}
      options={{
        tabBarIcon: ({ color, size }) => (
          <Icon name="home" color={color} size={size} />
        ),
      }}
    />
    <Tab.Screen
      name="Areas"
      component={AreasScreen}
      options={{
        tabBarIcon: ({ color, size }) => (
          <Icon name="area" color={color} size={size} />
        ),
      }}
    />
    <Tab.Screen
      name="Notes"
      component={NotesScreen}
      options={{
        tabBarIcon: ({ color, size }) => (
          <Icon name="note" color={color} size={size} />
        ),
      }}
    />
    <Tab.Screen
      name="Todos"
      component={TodosScreen}
      options={{
        tabBarIcon: ({ color, size }) => (
          <Icon name="todo" color={color} size={size} />
        ),
      }}
    />
  </Tab.Navigator>
);

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
      screenOptions={{
        ...sharedHeader,
        animation: 'none',
        presentation: 'card',
      }}
    >
        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={{ headerShown: false }}
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
          options={{ title: 'Transfer Property' }}
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
      </Stack.Navigator>
    </NavigationContainer>
  );
};
