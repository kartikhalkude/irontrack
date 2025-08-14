import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  Card, 
  Title, 
  Snackbar,
  HelperText,
  List,
  Divider,
  Searchbar,
  Chip
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useData } from '../contexts/DataContext';

const exerciseSchema = z.object({
  name: z.string().min(1, 'Exercise name is required').max(100, 'Name too long'),
  category: z.string().optional(),
  notes: z.string().optional().refine(val => !val || val.length <= 500, 'Notes too long'),
});

const EXERCISE_CATEGORIES = [
  'Chest',
  'Back', 
  'Shoulders',
  'Arms',
  'Legs',
  'Core',
  'Cardio',
  'Full Body',
  'Other'
];

const POPULAR_EXERCISES = [
  { name: 'Push-ups', category: 'Chest' },
  { name: 'Pull-ups', category: 'Back' },
  { name: 'Squats', category: 'Legs' },
  { name: 'Deadlifts', category: 'Legs' },
  { name: 'Bench Press', category: 'Chest' },
  { name: 'Overhead Press', category: 'Shoulders' },
  { name: 'Rows', category: 'Back' },
  { name: 'Lunges', category: 'Legs' },
  { name: 'Plank', category: 'Core' },
  { name: 'Dips', category: 'Arms' },
  { name: 'Burpees', category: 'Full Body' },
  { name: 'Mountain Climbers', category: 'Cardio' }
];

export default function CreateExerciseScreen({ navigation, route }) {
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  
  const { createExercise, exercises } = useData();
  const { fromAddSet } = route?.params || {};
  
  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    resolver: zodResolver(exerciseSchema),
    defaultValues: {
      name: '',
      category: '',
      notes: '',
    },
  });

  const watchedName = watch('name');
  const watchedCategory = watch('category');

  const showSnackbar = (message) => {
    setSnackbar({ visible: true, message });
  };

  const hideSnackbar = () => {
    setSnackbar({ visible: false, message: '' });
  };

  const filteredSuggestions = POPULAR_EXERCISES.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase());
    const notAlreadyExists = !exercises.some(existing => 
      existing.name.toLowerCase() === exercise.name.toLowerCase()
    );
    return matchesSearch && notAlreadyExists;
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      // Check if exercise already exists
      const existingExercise = exercises.find(ex => 
        ex.name.toLowerCase() === data.name.toLowerCase()
      );
      
      if (existingExercise) {
        showSnackbar('Exercise with this name already exists');
        return;
      }

      const newExercise = await createExercise({
        name: data.name.trim(),
        category: data.category || null,
        notes: data.notes?.trim() || null,
      });
      
      showSnackbar('Exercise created successfully!');
      
      // If we came from AddSet screen, navigate to AddSet with this exercise
      if (fromAddSet) {
        navigation.replace('AddSet', { selectedExercise: newExercise });
      } else {
        navigation.goBack();
      }
    } catch (error) {
      showSnackbar('Failed to create exercise');
      console.error('Create exercise error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionPress = (suggestion) => {
    setValue('name', suggestion.name);
    setValue('category', suggestion.category);
    setShowSuggestions(false);
  };

  const handleCategoryPress = (category) => {
    setValue('category', category);
  };

  const clearCategory = () => {
    setValue('category', '');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Title>Create Exercise</Title>
          <Button mode="text" onPress={() => navigation.goBack()}>
            Cancel
          </Button>
        </View>

        <ScrollView 
          style={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.formCard}>
            <Card.Content>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Exercise Name *"
                    mode="outlined"
                    value={value}
                    onChangeText={(text) => {
                      onChange(text);
                      setSearchQuery(text);
                      setShowSuggestions(text.length > 0);
                    }}
                    onBlur={onBlur}
                    error={!!errors.name}
                    style={styles.input}
                    autoFocus
                    maxLength={100}
                  />
                )}
              />
              {errors.name && (
                <HelperText type="error">{errors.name.message}</HelperText>
              )}

              {/* Exercise Suggestions */}
              {showSuggestions && filteredSuggestions.length > 0 && watchedName.length > 0 && (
                <Card style={styles.suggestionsCard}>
                  <Card.Content>
                    <Text style={styles.suggestionsTitle}>Popular exercises:</Text>
                    {filteredSuggestions.slice(0, 5).map((suggestion, index) => (
                      <List.Item
                        key={suggestion.name}
                        title={suggestion.name}
                        description={suggestion.category}
                        onPress={() => handleSuggestionPress(suggestion)}
                        left={props => <List.Icon {...props} icon="dumbbell" />}
                      />
                    ))}
                  </Card.Content>
                </Card>
              )}

              {/* Category Selection */}
              <Text style={styles.sectionTitle}>Category</Text>
              <View style={styles.categoryContainer}>
                {EXERCISE_CATEGORIES.map((category) => (
                  <Chip
                    key={category}
                    mode={watchedCategory === category ? 'flat' : 'outlined'}
                    onPress={() => 
                      watchedCategory === category ? clearCategory() : handleCategoryPress(category)
                    }
                    style={styles.categoryChip}
                    selected={watchedCategory === category}
                  >
                    {category}
                  </Chip>
                ))}
              </View>

              <Controller
                control={control}
                name="notes"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Notes (optional)"
                    mode="outlined"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={!!errors.notes}
                    multiline
                    numberOfLines={3}
                    style={styles.input}
                    placeholder="Add any notes about this exercise..."
                    maxLength={500}
                  />
                )}
              />
              {errors.notes && (
                <HelperText type="error">{errors.notes.message}</HelperText>
              )}

              <Button
                mode="contained"
                onPress={handleSubmit(onSubmit)}
                loading={loading}
                disabled={loading || !watchedName.trim()}
                style={styles.submitButton}
              >
                Create Exercise
              </Button>
            </Card.Content>
          </Card>

          {/* Quick Add Popular Exercises */}
          {!watchedName && (
            <Card style={styles.popularCard}>
              <Card.Content>
                <Title style={styles.popularTitle}>Popular Exercises</Title>
                <Text style={styles.popularSubtitle}>Tap to add quickly</Text>
                {POPULAR_EXERCISES.filter(ex => 
                  !exercises.some(existing => 
                    existing.name.toLowerCase() === ex.name.toLowerCase()
                  )
                ).slice(0, 6).map((exercise) => (
                  <List.Item
                    key={exercise.name}
                    title={exercise.name}
                    description={exercise.category}
                    onPress={() => handleSuggestionPress(exercise)}
                    left={props => <List.Icon {...props} icon="plus-circle-outline" />}
                    right={props => <List.Icon {...props} icon="chevron-right" />}
                  />
                ))}
              </Card.Content>
            </Card>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={hideSnackbar}
        duration={3000}
        action={{
          label: 'OK',
          onPress: hideSnackbar,
        }}
      >
        {snackbar.message}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'white',
    elevation: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formCard: {
    elevation: 2,
    marginBottom: 20,
  },
  input: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 12,
    color: '#333',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    gap: 8,
  },
  categoryChip: {
    marginRight: 4,
    marginBottom: 4,
  },
  submitButton: {
    marginTop: 20,
    backgroundColor: '#6750A4',
  },
  suggestionsCard: {
    marginTop: 8,
    marginBottom: 16,
    elevation: 1,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#666',
  },
  popularCard: {
    elevation: 2,
  },
  popularTitle: {
    fontSize: 18,
    marginBottom: 4,
  },
  popularSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
});