import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Animated,
  Alert,
  TextInput,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const categories = [
  { id: 'all', name: 'All Notes', icon: 'documents' },
  { id: 'work', name: 'Work Ideas', icon: 'briefcase' },
  { id: 'personal', name: 'Personal', icon: 'person' },
  { id: 'projects', name: 'Future Projects', icon: 'rocket' },
];

export default function HomeScreen() {
  const { theme, toggleTheme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notes, setNotes] = useState([]);

  // Animation values
  const fabAnim = useRef(new Animated.Value(0)).current;
  const categoriesAnim = useRef(new Animated.Value(0)).current;
  const fabRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadNotes();
    startAnimations();
  }, []);

  const startAnimations = () => {
    Animated.parallel([
      Animated.spring(fabAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(categoriesAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadNotes = async () => {
    try {
      const notesJson = await AsyncStorage.getItem('notes');
      if (notesJson) {
        setNotes(JSON.parse(notesJson));
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const updatedNotes = notes.filter(note => note.id !== id);
      await AsyncStorage.setItem('notes', JSON.stringify(updatedNotes));
      setNotes(updatedNotes);
    } catch (error) {
      console.error('Error deleting note:', error);
      Alert.alert('Error', 'Failed to delete note');
    }
  };

  const confirmDelete = (id) => {
    Alert.alert(
      "Delete Note",
      "Are you sure you want to delete this note?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", onPress: () => handleDelete(id), style: "destructive" }
      ]
    );
  };

  const spinFab = () => {
    Animated.timing(fabRotation, {
      toValue: 1,
      duration: 200,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(() => {
      fabRotation.setValue(0);
      router.push('/note');
    });
  };

  const renderCategory = ({ item, index }) => {
    const translateX = categoriesAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [100 * (index + 1), 0],
    });

    const isSelected = selectedCategory === item.id;
    return (
      <Animated.View style={{ transform: [{ translateX }] }}>
        <TouchableOpacity
          style={[
            styles.categoryButton,
            {
              backgroundColor: isSelected ? theme.primary : theme.cardBackground,
              borderColor: theme.border,
            },
          ]}
          onPress={() => setSelectedCategory(item.id)}
        >
          <Ionicons
            name={item.icon}
            size={20}
            color={isSelected ? '#FFFFFF' : theme.text}
            style={styles.categoryIcon}
          />
          <Text
            style={[
              styles.categoryText,
              { color: isSelected ? '#FFFFFF' : theme.text },
            ]}
          >
            {item.name}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const filteredNotes = notes.filter(note => {
    const matchesCategory = selectedCategory === 'all' || note.category === selectedCategory;
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // FAB animations
  const fabScale = fabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const fabRotateStr = fabRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>My Notes</Text>
        <TouchableOpacity onPress={toggleTheme}>
          <Ionicons
            name={theme.dark ? 'sunny' : 'moon'}
            size={24}
            color={theme.text}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { 
            color: theme.text,
            backgroundColor: theme.cardBackground,
            borderColor: theme.border,
          }]}
          placeholder="Search notes..."
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      </View>

      <FlatList
        data={filteredNotes}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.noteCard,
              { 
                backgroundColor: theme.cardBackground,
                borderColor: theme.border,
              }
            ]}
            onPress={() => router.push(`/note?id=${item.id}`)}
          >
            <View style={styles.noteHeader}>
              <Text style={[styles.noteTitle, { color: theme.text }]} numberOfLines={1}>
                {item.title}
              </Text>
              <View style={styles.noteActions}>
                {item.isFavorite && (
                  <Ionicons name="star" size={16} color="#FFC107" style={styles.favoriteIcon} />
                )}
                <TouchableOpacity
                  onPress={() => confirmDelete(item.id)}
                  style={styles.deleteButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="trash-outline" size={16} color="#FF5252" />
                </TouchableOpacity>
              </View>
            </View>

            <Text
              style={[styles.notePreview, { color: theme.textSecondary }]}
              numberOfLines={2}
            >
              {item.content}
            </Text>

            <Text style={[styles.noteDate, { color: theme.textSecondary }]}>
              {new Date(item.lastEdited).toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.notesList}
      />

      <Animated.View
        style={[
          styles.fab,
          {
            backgroundColor: theme.primary,
            transform: [
              { scale: fabScale },
              { rotate: fabRotateStr }
            ],
          },
        ]}
      >
        <TouchableOpacity
          onPress={spinFab}
          style={styles.fabTouchable}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  categoryIcon: {
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  notesList: {
    padding: 16,
  },
  noteCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  noteActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    padding: 4,
  },
  favoriteIcon: {
    marginRight: 4,
  },
  notePreview: {
    fontSize: 14,
    marginBottom: 8,
  },
  noteDate: {
    fontSize: 12,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
