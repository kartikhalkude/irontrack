import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  Card, 
  Title, 
  Searchbar,
  List,
  Divider,
  Snackbar,
  Portal,
  Dialog
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useData } from '../contexts/DataContext';

const setSchema = z.object({
  reps: z.string().min(1, 'Reps required').transform(val => parseInt(val)).refine(val => val > 0 && val <= 999, 'Reps must be 1-999'),
  weight: z.string().optional().transform(val => val === '' ? null : parseFloat(val)).refine(val => val === null || (val >= 0 && val <= 9999), 'Weight must be 0-9999kg'),
});

export default function AddSetScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  
  const { exercises, addSet, createExercise } = useData();
  
  const { control, handleSubmit, formState: { errors }, reset, watch } = useForm({
    resolver: zodResolver(setSchema),
    defaultValues: {
      reps: '',
      weight: '',
    },
  });

  // Auto-focus on reps when exercise is selected
  const repsValue = watch('reps');

  const filteredExercises = exercises.filter(exercise =>
    exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showSnackbar = (message) => {
    setSnackbar({ visible: true, message });
  };

  const hideSnackbar = () => {
    setSnackbar({ visible: false, message: '' });
  };

  const onSubmit = async (data) => {
    if (!selectedExercise) {
      showSnackbar('Please select an exercise');
      return;
    }

    try {
      setLoading(true);
      await addSet(selectedExercise.id, data.reps, data.weight);
      showSnackbar('Set added successfully!');
      
      // Reset form but keep exercise selected for quick entry
      reset({ reps: '', weight: data.weight }); // Keep weight for convenience
    } catch (error) {
      showSnackbar('Failed to add set');
      console.error('Add set error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExercise = async () => {
    if (!newExerciseName.trim()) {
      showSnackbar('Exercise name required');
      return;
    }

    try {
      const exercise = await createExercise({ name: newExerciseName.trim() });
      setSelectedExercise(exercise);
      setNewExerciseName('');
      setShowCreateDialog(false);
      showSnackbar('Exercise created!');
    } catch (error) {
      showSnackbar('Failed to create exercise');
    }
  };

  const handleQuickAdd = () => {
    if (selectedExercise && repsValue) {
      handleSubmit(onSubmit)();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Title>Add Set</Title>
        <Button mode="text" onPress={() => navigation.goBack()}>
          Cancel
        </Button>
      </View>

      <ScrollView style={styles.content}>
        {!selectedExercise ? (
          <Card style={styles.exerciseCard}>
            <Card.Content>
              <Title>Select Exercise</Title>
              
              <Searchbar
                placeholder="Search exercises..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchBar}
              />

              {filteredExercises.length === 0 && searchQuery ? (
                <View style={styles.noResults}>
                  <Text style={styles.noResultsText}>
                    No exercises found for "{searchQuery}"
                  </Text>
                  <Button
                    mode="outlined"
                    onPress={() => {
                      setNewExerciseName(searchQuery);
                      setShowCreateDialog(true);
                    }}
                    style={styles.createButton}
                  >
                    Create "{searchQuery}"
                  </Button>
                </View>
              ) : (
                <View style={styles.exerciseList}>
                  {filteredExercises.map((exercise, index) => (
                    <React.Fragment key={exercise.id}>
                      <List.Item
                        title={exercise.name}
                        onPress={() => setSelectedExercise(exercise)}
                        right={props => <List.Icon {...props} icon="chevron-right" />}
                      />
                      {index < filteredExercises.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </View>
              )}

              {exercises.length > 0 && (
                <Button
                  mode="text"
                  onPress={() => setShowCreateDialog(true)}
                  style={styles.newExerciseButton}
                >
                  + Create New Exercise
                </Button>
              )}
            </Card.Content>
          </Card>
        ) : (
          <Card style={styles.setCard}>
            <Card.Content>
              <View style={styles.selectedExercise}>
                <Title>{selectedExercise.name}</Title>
                <Button
                  mode="text"
                  onPress={() => setSelectedExercise(null)}
                  compact
                >
                  Change
                </Button>
              </View>

              <Controller
                control={control}
                name="reps"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Reps *"
                    mode="outlined"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={!!errors.reps}
                    keyboardType="numeric"
                    style={styles.input}
                    autoFocus
                  />
                )}
              />
              {errors.reps && (
                <Text style={styles.errorText}>{errors.reps.message}</Text>
              )}

              <Controller
                control={control}
                name="weight"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    label="Weight (kg)"
                    mode="outlined"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={!!errors.weight}
                    keyboardType="decimal-pad"
                    style={styles.input}
                    right={<TextInput.Affix text="kg" />}
                  />
                )}
              />
              {errors.weight && (
                <Text style={styles.errorText}>{errors.weight.message}</Text>
              )}

              <View style={styles.buttonContainer}>
                <Button
                  mode="contained"
                  onPress={handleSubmit(onSubmit)}
                  loading={loading}
                  disabled={loading}
                  style={styles.addButton}
                >
                  Add Set
                </Button>
                
                <Button
                  mode="outlined"
                  onPress={() => navigation.goBack()}
                  disabled={loading}
                >
                  Done
                </Button>
              </View>

              {repsValue && (
                <Text style={styles.hint}>
                  Tip: Tap "Add Set" or fill weight and tap again for quick entry
                </Text>
              )}
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Create Exercise Dialog */}
      <Portal>
        <Dialog visible={showCreateDialog} onDismiss={() => setShowCreateDialog(false)}>
          <Dialog.Title>Create Exercise</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Exercise Name"
              mode="outlined"
              value={newExerciseName}
              onChangeText={setNewExerciseName}
              autoFocus
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onPress={handleCreateExercise}>Create</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

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
  exerciseCard: {
    elevation: 2,
  },
  setCard: {
    elevation: 2,
  },
  searchBar: {
    marginVertical: 16,
  },
  exerciseList: {
    marginTop: 8,
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  createButton: {
    marginBottom: 8,
  },
  newExerciseButton: {
    marginTop: 16,
  },
  selectedExercise: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  input: {
    marginBottom: 8,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 12,
    marginBottom: 16,
    marginLeft: 12,
  },
  buttonContainer: {
    gap: 12,
    marginTop: 20,
  },
  addButton: {
    backgroundColor: '#6750A4',
  },
  hint: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
});