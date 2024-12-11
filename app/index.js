import { View, Text, TouchableOpacity, FlatList, StyleSheet, Dimensions, Alert, Animated, Modal } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/context/ThemeContext';
import { useColor } from '../src/context/ColorContext';
import SearchBar from '../src/components/SearchBar';
import { useState, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NOTE_COLORS, PRIORITIES, CATEGORIES } from './constants';
import * as Haptics from 'expo-haptics';

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const { getColorValue } = useColor();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notes, setNotes] = useState([]);
  const [showDevInfo, setShowDevInfo] = useState(false);
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      const storedNotes = await AsyncStorage.getItem('notes');
      if (storedNotes) {
        setNotes(JSON.parse(storedNotes));
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const getBorderColor = (priority) => {
    if (!priority) return '#2196F3'; // Default blue for no priority
    const priorityItem = PRIORITIES.find(p => p.id === priority);
    return priorityItem ? priorityItem.color : '#2196F3';
  };

  const handleDeleteNote = async (noteId) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const notesJson = await AsyncStorage.getItem('notes');
              const notes = notesJson ? JSON.parse(notesJson) : [];
              const updatedNotes = notes.filter(note => note.id !== noteId);
              await AsyncStorage.setItem('notes', JSON.stringify(updatedNotes));
              setNotes(updatedNotes);
            } catch (error) {
              console.error('Error deleting note:', error);
            }
          }
        }
      ]
    );
  };

  const handleToggleFavorite = async (noteId) => {
    try {
      const notesJson = await AsyncStorage.getItem('notes');
      const notes = notesJson ? JSON.parse(notesJson) : [];
      const updatedNotes = notes.map(note => {
        if (note.id === noteId) {
          return { ...note, isFavorite: !note.isFavorite };
        }
        return note;
      });
      await AsyncStorage.setItem('notes', JSON.stringify(updatedNotes));
      setNotes(updatedNotes);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };

  const filteredNotes = useCallback(() => {
    return notes
      .sort((a, b) => new Date(b.lastEdited) - new Date(a.lastEdited)) // Sort by latest first
      .filter(note => {
        const categoryMatch = selectedCategory === 'all' || note.category === selectedCategory;
        const searchMatch = !searchQuery || 
          note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.content.toLowerCase().includes(searchQuery.toLowerCase());
        return categoryMatch && searchMatch;
      });
  }, [notes, selectedCategory, searchQuery]);

  const renderNote = ({ item }) => {
    const noteColor = item.backgroundColor || '#FFFFFF';
    const borderColor = item.category ? 
      CATEGORIES.find(cat => cat.id === item.category)?.color || '#333333' : 
      theme.dark ? '#333333' : getBorderColor(item.priority);
    
    const handleNotePress = () => {
      console.log('Opening note with ID:', item.id);
      router.push({
        pathname: '/note/[id]',
        params: { id: String(item.id) }
      });
    };

    return (
      <TouchableOpacity
        style={[
          styles.noteCard,
          {
            backgroundColor: noteColor,
            borderWidth: 2,
            borderColor: borderColor,
          }
        ]}
        onPress={handleNotePress}
        activeOpacity={0.7}
      >
        <View style={styles.noteHeader}>
          <Text 
            style={[
              styles.noteTitle, 
              { color: theme.text }
            ]} 
            numberOfLines={1}
          >
            {item.title || 'Untitled Note'}
          </Text>
          <View style={styles.noteActions}>
            {item.category && (
              <View style={[styles.categoryIndicator, { backgroundColor: CATEGORIES.find(cat => cat.id === item.category)?.color }]} />
            )}
            <TouchableOpacity 
              onPress={() => handleToggleFavorite(item.id)}
              style={styles.actionButton}
            >
              <Ionicons 
                name={item.isFavorite ? "star" : "star-outline"} 
                size={20} 
                color={theme.dark ? '#FFFFFF' : (item.isFavorite ? "#FFC107" : '#000000')}
              />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleNotePress}
              style={styles.actionButton}
            >
              <Ionicons 
                name="pencil" 
                size={20} 
                color={theme.text}
              />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => handleDeleteNote(item.id)}
              style={styles.actionButton}
            >
              <Ionicons 
                name="trash-outline" 
                size={20} 
                color={theme.text}
              />
            </TouchableOpacity>
          </View>
        </View>
        <Text 
          style={[
            styles.noteContent,
            { 
              color: theme.text,
              opacity: theme.dark ? 0.8 : 0.6 
            }
          ]} 
          numberOfLines={2}
        >
          {item.content || 'No content'}
        </Text>
        <View style={styles.noteFooter}>
          <Text 
            style={[
              styles.noteDate,
              { 
                color: theme.text,
                opacity: theme.dark ? 0.6 : 0.4
              }
            ]}
          >
            {new Date(item.lastEdited).toLocaleString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        useNativeDriver: true,
      }),
      Animated.spring(rotateAnim, {
        toValue: 1,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.spring(rotateAnim, {
        toValue: 0,
        useNativeDriver: true,
      })
    ]).start();
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg']
  });

  const renderDevInfoModal = () => (
    <Modal
      visible={showDevInfo}
      transparent
      animationType="fade"
      onRequestClose={() => setShowDevInfo(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowDevInfo(false)}
      >
        <View style={[styles.modalContent, { 
          backgroundColor: theme.dark ? '#1E1E1E' : '#FFFFFF',
          padding: 24,
          borderRadius: 16,
          minWidth: 300,
        }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { 
              color: theme.text,
              fontSize: 24,
              fontWeight: 'bold',
              marginBottom: 16
            }]}>Developer Info</Text>
            <TouchableOpacity 
              onPress={() => setShowDevInfo(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.devInfoContent}>
            <View style={styles.devInfoItem}>
              <Ionicons name="code-slash" size={24} color={theme.primary} style={styles.devInfoIcon} />
              <Text style={[styles.devInfoText, { color: theme.text }]}>Developed by Simo Boss</Text>
            </View>
            <View style={styles.devInfoItem}>
              <Ionicons name="logo-github" size={24} color={theme.primary} style={styles.devInfoIcon} />
              <Text style={[styles.devInfoText, { color: theme.text }]}>github.com/simoboss</Text>
            </View>
            <View style={styles.devInfoItem}>
              <Ionicons name="mail" size={24} color={theme.primary} style={styles.devInfoIcon} />
              <Text style={[styles.devInfoText, { color: theme.text }]}>contact@simoboss.dev</Text>
            </View>
            <View style={styles.devInfoItem}>
              <Ionicons name="information-circle" size={24} color={theme.primary} style={styles.devInfoIcon} />
              <Text style={[styles.devInfoText, { color: theme.text }]}>Version 1.0.0</Text>
            </View>
          </View>

          <View style={styles.devFooter}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>
              Made with ❤️ in Morocco
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.dark ? '#1A1A1A' : '#FFFFFF' }]}>
        <View style={styles.headerContent}>
          <View style={styles.titleContainer}>
            <Ionicons
              name="document-text"
              size={28}
              color={theme.dark ? '#FFFFFF' : theme.primary}
              style={styles.titleIcon}
            />
            <Text style={[styles.title, { 
              color: theme.text,
              fontSize: 28,
              fontWeight: '600',
            }]}>My Notes</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              onPress={() => setShowDevInfo(true)}
              style={[styles.iconButton, { backgroundColor: theme.dark ? '#252525' : '#F5F5F5' }]}
            >
              <Ionicons
                name="information-circle"
                size={24}
                color={theme.dark ? '#FFFFFF' : theme.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={toggleTheme}
              style={[styles.iconButton, { backgroundColor: theme.dark ? '#252525' : '#F5F5F5' }]}
            >
              <Ionicons
                name={theme.dark ? 'sunny' : 'moon'}
                size={24}
                color={theme.dark ? '#FFFFFF' : theme.primary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <SearchBar 
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search notes..."
        style={{ backgroundColor: theme.cardBackground }}
        placeholderTextColor={theme.textSecondary}
        textColor={theme.text}
      />

      <View style={styles.categoriesContainer}>
        <View style={styles.categoriesRow}>
          {CATEGORIES.slice(0, 2).map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                {
                  backgroundColor: selectedCategory === category.id 
                    ? (theme.dark ? theme.cardBackground : category.color)
                    : (theme.dark ? theme.surface : category.lightColor),
                },
                selectedCategory === category.id && styles.selectedCategory,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <View style={styles.categoryIcon}>
                <Ionicons 
                  name={category.icon} 
                  size={24} 
                  color={theme.dark ? '#FFFFFF' : (selectedCategory === category.id ? '#FFFFFF' : category.color)} 
                />
              </View>
              <Text style={[
                styles.categoryText,
                { color: theme.dark ? '#FFFFFF' : (selectedCategory === category.id ? '#FFFFFF' : '#000000') }
              ]}>
                {category.name}
              </Text>
              <View style={[styles.categoryBadge, { backgroundColor: theme.dark ? theme.surface : '#FFFFFF' }]}>
                <Text style={[styles.categoryBadgeText, { color: theme.text }]}>
                  {notes.filter(note => category.id === 'all' || note.category === category.id).length}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.categoriesRow}>
          {CATEGORIES.slice(2, 4).map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                {
                  backgroundColor: selectedCategory === category.id 
                    ? (theme.dark ? theme.cardBackground : category.color)
                    : (theme.dark ? theme.surface : category.lightColor),
                },
                selectedCategory === category.id && styles.selectedCategory,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <View style={styles.categoryIcon}>
                <Ionicons 
                  name={category.icon} 
                  size={24} 
                  color={theme.dark ? '#FFFFFF' : (selectedCategory === category.id ? '#FFFFFF' : category.color)} 
                />
              </View>
              <Text style={[
                styles.categoryText,
                { color: theme.dark ? '#FFFFFF' : (selectedCategory === category.id ? '#FFFFFF' : '#000000') }
              ]}>
                {category.name}
              </Text>
              <View style={[styles.categoryBadge, { backgroundColor: theme.dark ? theme.surface : '#FFFFFF' }]}>
                <Text style={[styles.categoryBadgeText, { color: theme.text }]}>
                  {notes.filter(note => category.id === 'all' || note.category === category.id).length}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredNotes()}
        renderItem={renderNote}
        keyExtractor={(item) => item.id ? item.id.toString() : `note-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`}
        contentContainerStyle={styles.notesContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.text }]}>No notes found</Text>
          </View>
        )}
      />

      <Animated.View style={[
        styles.fabContainer,
        {
          transform: [
            { scale: scaleAnim },
            { rotate: spin }
          ]
        }
      ]}>
        <TouchableOpacity
          style={[
            styles.fab,
            { backgroundColor: theme.primary }
          ]}
          onPress={() => {
            console.log('Creating new note');
            router.push({
              pathname: '/note/[id]',
              params: { id: 'new' }
            });
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>

      {renderDevInfoModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    marginRight: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesContainer: {
    padding: 16,
  },
  categoriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 6,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  notesContainer: {
    padding: 16,
  },
  noteCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  noteTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
    letterSpacing: 0.5,
  },
  noteContent: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  noteDate: {
    fontSize: 12,
    marginRight: 8,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  categoryTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  priorityTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  noteActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButton: {
    padding: 8,
  },
  categoryIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  devInfoContent: {
    marginVertical: 16,
    gap: 16,
  },
  devInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  devInfoIcon: {
    width: 32,
  },
  devInfoText: {
    fontSize: 16,
    flex: 1,
  },
  devFooter: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
  },
  closeButton: {
    padding: 8,
    marginRight: -8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    minWidth: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
});
