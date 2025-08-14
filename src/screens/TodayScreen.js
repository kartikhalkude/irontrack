import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { 
  Text, 
  Card, 
  Title, 
  FAB,
  Chip,
  List,
  IconButton,
  Banner,
  Snackbar
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useData } from '../contexts/DataContext';

export default function TodayScreen({ navigation }) {
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });
  const { 
    todaySets, 
    loading, 
    syncing, 
    getTodayStats, 
    deleteSet,
    syncData,
    loadTodayWorkout,
    exercises
  } = useData();

  useFocusEffect(
    useCallback(() => {
      loadTodayWorkout();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await syncData();
    } catch (error) {
      showSnackbar('Failed to sync data');
    }
    setRefreshing(false);
  }, [syncData]);

  const showSnackbar = (message) => {
    setSnackbar({ visible: true, message });
  };

  const hideSnackbar = () => {
    setSnackbar({ visible: false, message: '' });
  };

  const handleDeleteSet = async (setId) => {
    try {
      await deleteSet(setId);
      showSnackbar('Set deleted');
    } catch (error) {
      showSnackbar('Failed to delete set');
    }
  };

  const handleAddSet = () => {
    if (exercises.length === 0) {
      navigation.navigate('CreateExercise', { fromAddSet: true });
    } else {
      navigation.navigate('AddSet');
    }
  };

  const stats = getTodayStats();
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Group sets by exercise
  const groupedSets = todaySets.reduce((groups, set) => {
    const exerciseName = set.exercise?.name || 'Unknown Exercise';
    if (!groups[exerciseName]) {
      groups[exerciseName] = [];
    }
    groups[exerciseName].push(set);
    return groups;
  }, {});

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Title style={styles.date}>{today}</Title>
          {syncing && <Text style={styles.syncingText}>Syncing...</Text>}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Text style={styles.statNumber}>{stats.totalSets}</Text>
              <Text style={styles.statLabel}>Sets</Text>
            </Card.Content>
          </Card>
          
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Text style={styles.statNumber}>{stats.exerciseCount}</Text>
              <Text style={styles.statLabel}>Exercises</Text>
            </Card.Content>
          </Card>
          
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Text style={styles.statNumber}>{stats.totalReps}</Text>
              <Text style={styles.statLabel}>Reps</Text>
            </Card.Content>
          </Card>
        </View>

        {/* No exercises banner */}
        {exercises.length === 0 && (
          <Banner
            visible={true}
            actions={[
              {
                label: 'Create Exercise',
                onPress: () => navigation.navigate('CreateExercise'),
              },
            ]}
            icon="information"
          >
            Create your first exercise to start tracking workouts!
          </Banner>
        )}

        {/* Today's workout */}
        <Card style={styles.workoutCard}>
          <Card.Content>
            <Title>Today's Workout</Title>
            
            {todaySets.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  {exercises.length === 0 
                    ? "Create an exercise to get started" 
                    : "No sets logged yet. Tap + to add your first set!"
                  }
                </Text>
              </View>
            ) : (
              <View style={styles.setsContainer}>
                {Object.entries(groupedSets).map(([exerciseName, sets]) => (
                  <View key={exerciseName} style={styles.exerciseGroup}>
                    <Text style={styles.exerciseName}>{exerciseName}</Text>
                    {sets.map((set, index) => (
                      <View key={set.id} style={styles.setRow}>
                        <View style={styles.setInfo}>
                          <Chip mode="outlined" style={styles.setChip}>
                            Set {index + 1}
                          </Chip>
                          <Text style={styles.setDetails}>
                            {set.reps} reps
                            {set.weight && ` @ ${set.weight}kg`}
                          </Text>
                        </View>
                        <IconButton
                          icon="delete"
                          size={20}
                          onPress={() => handleDeleteSet(set.id)}
                        />
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleAddSet}
        label={todaySets.length === 0 ? "Add Set" : undefined}
      />

      <Snackbar
        visible={snackbar.visible}
        onDismiss={hideSnackbar}
        duration={3000}
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
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  date: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  syncingText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    elevation: 2,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6750A4',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  workoutCard: {
    margin: 20,
    elevation: 2,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  setsContainer: {
    marginTop: 16,
  },
  exerciseGroup: {
    marginBottom: 20,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 4,
  },
  setInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  setChip: {
    marginRight: 12,
  },
  setDetails: {
    fontSize: 16,
    color: '#333',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#6750A4',
  },
});