import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, Alert, KeyboardAvoidingView, Platform, Keyboard, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../src/context/ThemeContext';
import { useColor } from '../../src/context/ColorContext';
import { Stack } from 'expo-router';

export default function NoteLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
