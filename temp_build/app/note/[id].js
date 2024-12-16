import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  StyleSheet,
  Dimensions,
  Pressable,
  Alert
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../src/context/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import Slider from '@react-native-community/slider';

const { width } = Dimensions.get('window');

const TEXT_COLORS = [
  '#000000', // Black
  '#FFFFFF', // White
  '#2196F3', // Blue
  '#4CAF50', // Green
  '#E91E63', // Pink
  '#FF9800', // Orange
  '#9C27B0', // Purple
  '#F44336', // Red
  '#607D8B', // Blue Grey
  '#795548', // Brown
];

const PRIORITIES = [
  { id: 'high', name: 'High', color: '#FF0000', icon: 'alert-circle' },
  { id: 'medium', name: 'Medium', color: '#FFA500', icon: 'alert' },
  { id: 'low', name: 'Low', color: '#008000', icon: 'information-circle' },
  { id: 'none', name: 'None', color: '#808080', icon: 'remove-circle' }
];

const TAGS = [
  { id: 'work', name: 'Work', color: '#4A90E2' },
  { id: 'personal', name: 'Personal', color: '#50E3C2' },
  { id: 'ideas', name: 'Ideas', color: '#F5A623' },
  { id: 'todo', name: 'To-Do', color: '#D0021B' },
  { id: 'important', name: 'Important', color: '#7ED321' },
  { id: 'archive', name: 'Archive', color: '#9013FE' }
];

const COLORS = [
  '#FFFFFF', // White
  '#FFE4E1', // Light Pink
  '#E0FFFF', // Light Cyan
  '#F0FFF0', // Light Green
  '#FFF0F5', // Lavender
  '#FFFACD', // Light Yellow
  '#F5F5DC', // Beige
  '#E6E6FA', // Light Purple
  '#F0F8FF', // Light Blue
  '#F5FFFA', // Mint
];

const CATEGORIES = [
  { id: 'all', name: 'All Notes', color: '#808080' },
  { id: 'personal', name: 'Personal', color: '#4CAF50' },
  { id: 'work', name: 'Work', color: '#2196F3' },
  { id: 'ideas', name: 'Ideas', color: '#FF9800' },
  { id: 'tasks', name: 'Tasks', color: '#E91E63' },
  { id: 'archive', name: 'Archive', color: '#9013FE' }
];

export default function NoteScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { theme } = useTheme();
  const scrollViewRef = useRef(null);

  const [note, setNote] = useState({
    id: '',
    title: '',
    content: '',
    images: [],
    tags: [],
    priority: 'none',
    textColor: '#000000',
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    category: 'all',
    isFavorite: false,
    createdAt: new Date().toISOString(),
    lastEdited: new Date().toISOString()
  });

  // UI state
  const [showFormatting, setShowFormatting] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showPriority, setShowPriority] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Undo/Redo state
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const handleSave = async () => {
    try {
      if (!note.title.trim()) {
        Alert.alert('Error', 'Please enter a title for your note');
        return;
      }

      const notesJson = await AsyncStorage.getItem('notes');
      const notes = notesJson ? JSON.parse(notesJson) : [];
      
      const currentTime = new Date().toISOString();
      const uniqueId = `note-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      const updatedNote = {
        ...note,
        id: id === 'new' ? uniqueId : note.id,
        lastEdited: currentTime,
        createdAt: note.createdAt || currentTime
      };

      if (id === 'new') {
        notes.unshift(updatedNote);
      } else {
        const index = notes.findIndex(n => n.id === id);
        if (index !== -1) {
          notes[index] = updatedNote;
        } else {
          notes.unshift(updatedNote);
        }
      }

      await AsyncStorage.setItem('notes', JSON.stringify(notes));
      router.replace('/');
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert(
        'Error',
        'Failed to save the note. Please try again.'
      );
    }
  };

  const handleTextFormat = (format) => {
    // Save current state for undo
    setUndoStack(prev => [...prev, note]);
    setRedoStack([]);

    switch (format) {
      case 'bold':
        setNote(prev => ({
          ...prev,
          content: prev.content + '**bold text**'
        }));
        break;
      case 'italic':
        setNote(prev => ({
          ...prev,
          content: prev.content + '_italic text_'
        }));
        break;
      case 'underline':
        setNote(prev => ({
          ...prev,
          content: prev.content + '__underlined text__'
        }));
        break;
      case 'strikethrough':
        setNote(prev => ({
          ...prev,
          content: prev.content + '~~strikethrough text~~'
        }));
        break;
      case 'list':
        setNote(prev => ({
          ...prev,
          content: prev.content + '\n- List item'
        }));
        break;
      case 'checklist':
        setNote(prev => ({
          ...prev,
          content: prev.content + '\n[ ] Checklist item'
        }));
        break;
    }
  };

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setNote(prev => ({
          ...prev,
          images: [...prev.images, result.assets[0].uri]
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const handleUndo = () => {
    if (undoStack.length > 0) {
      const previousState = undoStack[undoStack.length - 1];
      setRedoStack(prev => [...prev, note]);
      setNote(previousState);
      setUndoStack(prev => prev.slice(0, -1));
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack[redoStack.length - 1];
      setUndoStack(prev => [...prev, note]);
      setNote(nextState);
      setRedoStack(prev => prev.slice(0, -1));
    }
  };

  const handleFavorite = () => {
    setUndoStack(prev => [...prev, note]);
    setRedoStack([]);
    setIsFavorite(!isFavorite);
    setNote(prev => ({
      ...prev,
      isFavorite: !prev.isFavorite
    }));
  };

  useEffect(() => {
    const loadNote = async () => {
      try {
        const notesJson = await AsyncStorage.getItem('notes');
        const notes = notesJson ? JSON.parse(notesJson) : [];
        console.log('Current ID:', id);
        console.log('Available notes:', notes);

        if (id === 'new') {
          // Initialize new note with default values
          const newNote = {
            id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            title: '',
            content: '',
            images: [],
            tags: [],
            priority: 'none',
            textColor: '#000000',
            fontSize: 16,
            backgroundColor: '#FFFFFF',
            category: 'all',
            isFavorite: false,
            createdAt: new Date().toISOString(),
            lastEdited: new Date().toISOString()
          };
          console.log('Creating new note:', newNote);
          setNote(newNote);
        } else {
          // Find existing note
          const existingNote = notes.find(n => String(n.id) === String(id));
          console.log('Found note:', existingNote);
          
          if (existingNote) {
            setNote(existingNote);
            setIsFavorite(existingNote.isFavorite || false);
          } else {
            console.warn('Note not found with ID:', id);
            Alert.alert(
              'Error',
              'Note not found',
              [
                {
                  text: 'OK',
                  onPress: () => router.replace('/')
                }
              ]
            );
          }
        }
      } catch (error) {
        console.error('Error loading note:', error);
        Alert.alert(
          'Error',
          'Failed to load the note. Please try again.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/')
            }
          ]
        );
      }
    };

    loadNote();
  }, [id]);

  const renderToolbar = () => {
    const tools = [
      {
        id: 'color-picker',
        icon: 'color-palette-outline',
        onPress: () => setShowColorPicker(true),
        label: 'Color'
      },
      {
        id: 'format',
        icon: 'text',
        onPress: () => setShowFormatting(true),
        label: 'Format'
      },
      {
        id: 'image',
        icon: 'image',
        onPress: handleImagePick,
        label: 'Image'
      },
      {
        id: 'priority',
        icon: 'flag',
        onPress: () => setShowPriority(true),
        label: 'Priority'
      },
      {
        id: 'tags',
        icon: 'pricetag',
        onPress: () => setShowTags(true),
        label: 'Tags'
      },
      {
        id: 'category',
        icon: 'folder-outline',
        onPress: () => setShowCategoryPicker(true),
        label: 'Category'
      },
      {
        id: 'undo',
        icon: 'arrow-undo',
        onPress: handleUndo,
        disabled: undoStack.length === 0,
        label: 'Undo'
      },
      {
        id: 'redo',
        icon: 'arrow-redo',
        onPress: handleRedo,
        disabled: redoStack.length === 0,
        label: 'Redo'
      },
      {
        id: 'preview',
        icon: isPreview ? 'create' : 'eye',
        onPress: () => setIsPreview(!isPreview),
        label: isPreview ? 'Edit' : 'Preview'
      },
      {
        id: 'list',
        icon: 'list',
        onPress: () => handleTextFormat('list'),
        label: 'List'
      }
    ];

    const rows = [];
    for (let i = 0; i < tools.length; i += 5) {
      rows.push(tools.slice(i, i + 5));
    }

    return (
      <View style={[styles.toolbarContainer, { backgroundColor: theme.surface }]}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.toolbarRow}>
            {row.map((tool) => (
              <TouchableOpacity
                key={tool.id}
                style={[
                  styles.toolButton,
                  tool.disabled && styles.toolButtonDisabled
                ]}
                onPress={tool.onPress}
                disabled={tool.disabled}
              >
                <Ionicons
                  name={tool.icon}
                  size={24}
                  color={tool.disabled ? theme.textSecondary : theme.text}
                />
                <Text
                  style={[
                    styles.toolButtonLabel,
                    { color: tool.disabled ? theme.textSecondary : theme.text }
                  ]}
                >
                  {tool.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    );
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: theme.surface }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
        <Ionicons name="arrow-back" size={24} color={theme.text} />
      </TouchableOpacity>
      
      <View style={styles.headerRight}>
        <TouchableOpacity 
          style={styles.headerButton} 
          onPress={handleFavorite}
        >
          <Ionicons 
            name={isFavorite ? "star" : "star-outline"} 
            size={24} 
            color={isFavorite ? "#FFD700" : theme.text} 
          />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: theme.primary }]}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const ColorPickerModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showColorPicker}
      onRequestClose={() => setShowColorPicker(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.colorPickerContainer}>
          <Text style={styles.colorPickerTitle}>Choose Colors</Text>
          
          <Text style={styles.colorSectionTitle}>Background Color</Text>
          <View style={styles.colorGrid}>
            {COLORS.map((color, index) => (
              <TouchableOpacity
                key={`bg-${index}`}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  note?.backgroundColor === color && styles.selectedColor
                ]}
                onPress={() => {
                  setNote(prev => ({ ...prev, backgroundColor: color }));
                }}
              />
            ))}
          </View>

          <Text style={styles.colorSectionTitle}>Text Color</Text>
          <View style={styles.colorGrid}>
            {TEXT_COLORS.map((color, index) => (
              <TouchableOpacity
                key={`text-${index}`}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  note?.textColor === color && styles.selectedColor
                ]}
                onPress={() => {
                  setNote(prev => ({ ...prev, textColor: color }));
                }}
              />
            ))}
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowColorPicker(false)}
          >
            <Text style={styles.closeButtonText}>Apply Colors</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const CategoryPickerModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showCategoryPicker}
      onRequestClose={() => setShowCategoryPicker(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.colorPickerContainer}>
          <Text style={styles.colorPickerTitle}>Choose Category</Text>
          <ScrollView style={styles.categoryList}>
            {CATEGORIES.filter(cat => cat.id !== 'all').map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryOption,
                  note?.category === category.id && styles.selectedCategory,
                  { borderLeftColor: category.color }
                ]}
                onPress={() => {
                  setNote(prev => ({ ...prev, category: category.id }));
                  setShowCategoryPicker(false);
                }}
              >
                <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
                <Text style={[
                  styles.categoryText,
                  note?.category === category.id && styles.selectedCategoryText
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowCategoryPicker(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      {renderHeader()}

      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          style={[
            styles.titleInput,
            { color: note?.textColor || '#000000' }
          ]}
          value={note?.title || ''}
          onChangeText={(text) => setNote(prev => ({ ...prev, title: text }))}
          placeholder="Note Title"
          placeholderTextColor="#999999"
        />

        {renderToolbar()}

        {isPreview ? (
          <View style={styles.previewContainer}>
            <Text style={[styles.previewTitle, { color: theme.text }]}>{note.title}</Text>
            <Text 
              style={[
                styles.previewContent,
                {
                  color: note.textColor,
                  fontSize: note.fontSize,
                }
              ]}
            >
              {note.content}
            </Text>
            {note.images.length > 0 && (
              <View style={styles.imagesContainer}>
                {note.images.map((uri, index) => (
                  <Image
                    key={index}
                    source={{ uri }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                ))}
              </View>
            )}
            {note.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {note.tags.map(tagId => {
                  const tag = TAGS.find(t => t.id === tagId);
                  return tag ? (
                    <View
                      key={tag.id}
                      style={[
                        styles.tag,
                        { backgroundColor: tag.color + '20' }
                      ]}
                    >
                      <Text style={[styles.tagText, { color: tag.color }]}>
                        {tag.name}
                      </Text>
                    </View>
                  ) : null;
                })}
              </View>
            )}
          </View>
        ) : (
          <>
            <TextInput
              style={[
                styles.contentInput,
                { color: note?.textColor || '#000000' }
              ]}
              value={note?.content || ''}
              onChangeText={(text) => setNote(prev => ({ ...prev, content: text }))}
              placeholder="Start typing..."
              placeholderTextColor="#999999"
              multiline
              textAlignVertical="top"
            />

            {note.images.length > 0 && (
              <View style={styles.imagesContainer}>
                {note.images.map((uri, index) => (
                  <View key={index} style={styles.imageWrapper}>
                    <Image
                      source={{ uri }}
                      style={styles.image}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => {
                        setNote(prev => ({
                          ...prev,
                          images: prev.images.filter((_, i) => i !== index)
                        }));
                      }}
                    >
                      <Ionicons name="close-circle" size={24} color={theme.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {note.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {note.tags.map(tagId => {
                  const tag = TAGS.find(t => t.id === tagId);
                  return tag ? (
                    <TouchableOpacity
                      key={tag.id}
                      style={[
                        styles.tag,
                        { backgroundColor: tag.color + '20' }
                      ]}
                      onPress={() => {
                        setNote(prev => ({
                          ...prev,
                          tags: prev.tags.filter(t => t !== tag.id)
                        }));
                      }}
                    >
                      <Text style={[styles.tagText, { color: tag.color }]}>
                        {tag.name}
                      </Text>
                      <Ionicons name="close" size={16} color={tag.color} />
                    </TouchableOpacity>
                  ) : null;
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Modals */}
      <Modal
        visible={showFormatting}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFormatting(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFormatting(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Text Formatting</Text>
              <TouchableOpacity onPress={() => setShowFormatting(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.formattingOptions}>
              <TouchableOpacity
                style={styles.formatButton}
                onPress={() => handleTextFormat('bold')}
              >
                <Ionicons name="text" size={24} color={theme.text} />
                <Text style={[styles.formatText, { color: theme.text }]}>Bold</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.formatButton}
                onPress={() => handleTextFormat('italic')}
              >
                <Ionicons name="text" size={24} color={theme.text} />
                <Text style={[styles.formatText, { color: theme.text }]}>Italic</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.formatButton}
                onPress={() => handleTextFormat('underline')}
              >
                <Ionicons name="text" size={24} color={theme.text} />
                <Text style={[styles.formatText, { color: theme.text }]}>Underline</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.formatButton}
                onPress={() => handleTextFormat('strikethrough')}
              >
                <Ionicons name="text" size={24} color={theme.text} />
                <Text style={[styles.formatText, { color: theme.text }]}>Strikethrough</Text>
              </TouchableOpacity>
              <View style={styles.sliderContainer}>
                <Text style={[styles.sliderLabel, { color: theme.text }]}>Font Size</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={12}
                  maximumValue={32}
                  step={1}
                  value={note.fontSize}
                  onValueChange={(value) => setNote(prev => ({ ...prev, fontSize: value }))}
                  minimumTrackTintColor={theme.primary}
                  maximumTrackTintColor={theme.border}
                />
                <Text style={[styles.sliderValue, { color: theme.text }]}>{note.fontSize}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showColorPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowColorPicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowColorPicker(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Text Color</Text>
              <TouchableOpacity onPress={() => setShowColorPicker(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.colorGrid}>
              {TEXT_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorItem,
                    { backgroundColor: color },
                    note.textColor === color && styles.selectedColor
                  ]}
                  onPress={() => {
                    setNote(prev => ({ ...prev, textColor: color }));
                    setShowColorPicker(false);
                  }}
                />
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showPriority}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPriority(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPriority(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Set Priority</Text>
              <TouchableOpacity onPress={() => setShowPriority(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.priorityList}>
              {PRIORITIES.map((priority) => (
                <TouchableOpacity
                  key={priority.id}
                  style={[
                    styles.priorityItem,
                    note.priority === priority.id && { backgroundColor: priority.color + '20' }
                  ]}
                  onPress={() => {
                    setNote(prev => ({ ...prev, priority: priority.id }));
                    setShowPriority(false);
                  }}
                >
                  <Ionicons name={priority.icon} size={24} color={priority.color} />
                  <Text style={[styles.priorityText, { color: theme.text }]}>{priority.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showTags}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTags(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowTags(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Select Tags</Text>
              <TouchableOpacity onPress={() => setShowTags(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.tagsList}>
              {TAGS.map((tag) => (
                <TouchableOpacity
                  key={tag.id}
                  style={[
                    styles.tagItem,
                    { backgroundColor: tag.color + '20' },
                    note.tags.includes(tag.id) && styles.selectedTag
                  ]}
                  onPress={() => {
                    setNote(prev => ({
                      ...prev,
                      tags: prev.tags.includes(tag.id)
                        ? prev.tags.filter(t => t !== tag.id)
                        : [...prev.tags, tag.id]
                    }));
                  }}
                >
                  <Text style={[styles.tagItemText, { color: tag.color }]}>{tag.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showCategoryPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryPicker(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.tagsList}>
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.tagItem,
                    { backgroundColor: category.color + '20' },
                    note.category === category.id && styles.selectedTag
                  ]}
                  onPress={() => {
                    setNote(prev => ({ ...prev, category: category.id }));
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text style={[styles.tagItemText, { color: category.color }]}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <ColorPickerModal />
      <CategoryPickerModal />
    </KeyboardAvoidingView>
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
    padding: 16,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  toolbarContainer: {
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  toolbarRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
  },
  toolButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8,
  },
  toolButtonDisabled: {
    opacity: 0.5,
  },
  toolButtonLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 12,
    letterSpacing: 0.5,
  },
  contentInput: {
    flex: 1,
    textAlignVertical: 'top',
    minHeight: 200,
    padding: 8,
  },
  imagesContainer: {
    marginVertical: 16,
  },
  imageWrapper: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 200,
    marginVertical: 8,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxHeight: '80%',
    borderRadius: 16,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  formattingOptions: {
    gap: 12,
  },
  formatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderRadius: 8,
  },
  formatText: {
    fontSize: 16,
  },
  sliderContainer: {
    marginTop: 16,
    padding: 12,
  },
  sliderLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderValue: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  colorItem: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: '#000',
  },
  priorityList: {
    gap: 8,
  },
  priorityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  priorityText: {
    fontSize: 16,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedTag: {
    borderColor: '#000',
  },
  tagItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  previewContainer: {
    padding: 16,
  },
  previewTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  previewContent: {
    fontSize: 16,
    marginBottom: 16,
  },
  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  colorPickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  colorPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    color: '#000000',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    margin: 5,
    borderWidth: 1,
    borderColor: '#CCCCCC',
  },
  selectedColor: {
    borderWidth: 3,
    borderColor: '#2196F3',
  },
  closeButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  categoryList: {
    maxHeight: 300,
    width: '100%',
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginVertical: 4,
    backgroundColor: '#F5F5F5',
    borderLeftWidth: 4,
  },
  selectedCategory: {
    backgroundColor: '#E3F2FD',
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryText: {
    fontSize: 16,
    color: '#333333',
  },
  selectedCategoryText: {
    fontWeight: '600',
    color: '#2196F3',
  },
  colorSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
});
