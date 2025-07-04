import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from '../components/Icon';
import { Text } from '@rneui/themed';
import { supabase } from '../utils/supabaseClient';
import { theme } from '../utils/theme';
import { mockUser } from '../mock/data';

// Screens
import HomeScreen from '../screens/HomeScreen';
import AreasScreen from '../screens/AreasScreen';
import NotesScreen from '../screens/NotesScreen';
import PropertyScreen from '../screens/PropertyScreen';
import AreaScreen from '../screens/AreaScreen';
import NoteScreen from '../screens/NoteScreen';
import EditNoteScreen from '../screens/EditNoteScreen';
import EditPropertyScreen from '../screens/EditPropertyScreen';
import EditAreaScreen from '../screens/EditAreaScreen';
import TransferPropertyScreen from '../screens/TransferPropertyScreen';
import CreatePropertyScreen from '../screens/CreatePropertyScreen';
import CreateAreaScreen from '../screens/CreateAreaScreen';
import CreateNoteScreen from '../screens/CreateNoteScreen';

export type RootStackParamList = {
  Main: undefined;
  Property: { propertyId: string };
  Area: { areaId: string };
  Note: { noteId: string };
  EditNote: { noteId: string };
  EditProperty: { propertyId: string };
  EditArea: { areaId: string };
  TransferProperty: { propertyId: string };
  CreateProperty: undefined;
  CreateArea: { propertyId: string };
  CreateNote: { areaId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary.main,
        tabBarInactiveTintColor: theme.colors.text.secondary,
        tabBarStyle: {
          backgroundColor: theme.colors.background.default,
          borderTopColor: theme.colors.neutral[200],
          paddingBottom: theme.spacing.xs,
          paddingTop: theme.spacing.xs,
          height: 60,
        },
        headerStyle: {
          backgroundColor: theme.colors.primary.main,
        },
        headerTintColor: theme.colors.primary.contrast,
        headerTitleStyle: {
          fontSize: theme.typography.h3.fontSize,
          fontWeight: 'bold',
          color: theme.colors.primary.contrast,
        },
        headerRight: () => (
          <Text
            onPress={() => supabase.auth.signOut()}
            style={{
              color: theme.colors.primary.contrast,
              marginRight: theme.spacing.md,
            }}
          >
            Sign Out
          </Text>
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
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.primary.main,
          },
          headerTintColor: theme.colors.primary.contrast,
          headerTitleStyle: {
            fontSize: theme.typography.h3.fontSize,
            fontWeight: 'bold',
            color: theme.colors.primary.contrast,
          },
        }}
      >
        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Property"
          component={PropertyScreen}
          options={({ route }) => ({
            title: 'Property Details',
          })}
        />
        <Stack.Screen
          name="Area"
          component={AreaScreen}
          options={({ route }) => ({
            title: 'Area Details',
          })}
        />
        <Stack.Screen
          name="Note"
          component={NoteScreen}
          options={({ route }) => ({
            title: 'Note Details',
          })}
        />
        <Stack.Screen
          name="EditNote"
          component={EditNoteScreen}
          options={{
            title: 'Edit Note',
          }}
        />
        <Stack.Screen
          name="EditProperty"
          component={EditPropertyScreen}
          options={{
            title: 'Edit Property',
          }}
        />
        <Stack.Screen
          name="EditArea"
          component={EditAreaScreen}
          options={{
            title: 'Edit Area',
          }}
        />
        <Stack.Screen
          name="TransferProperty"
          component={TransferPropertyScreen}
          options={{
            title: 'Transfer Property',
          }}
        />
        <Stack.Screen
          name="CreateProperty"
          component={CreatePropertyScreen}
          options={{
            title: 'Add Property',
          }}
        />
        <Stack.Screen
          name="CreateArea"
          component={CreateAreaScreen}
          options={{
            title: 'Add Area',
          }}
        />
        <Stack.Screen
          name="CreateNote"
          component={CreateNoteScreen}
          options={{
            title: 'Add Note',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}; 