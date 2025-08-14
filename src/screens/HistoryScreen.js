import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { 
  Text, 
  Card, 
  Title, 
  Chip,
  Searchbar,
  List,
  Divider,
  Button,
  Banner,
  ActivityIndicator,
  Menu,
  IconButton
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useData } from '../contexts/DataContext';

const FILTER_OPTIONS = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 3 months' },
  { value: 'all', label: 'All time' }
];

export default function HistoryScreen({ navigation }) {
  const [workouts, setWorkouts] = useState([]);
  const [filteredWorkouts, setFilteredWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDays, setFilterDays] = useState('30');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  
  const { getWorkoutHistory, exportData } = useData();

  useFocusEffect(
    useCallback(() => {
      loadWorkouts();
    }, [filterDays])
  );

  const loadWorkouts = async () => {
    try {
      setLoading(true);
      const endDate = new Date().toISOString().split('T')[0];
      
      let startDate;
      if (filterDays === 'all') {
        startDate = '2020-01-01'; // Far enough back to get all workouts
      } else {
        const date = new Date();
        date.setDate(date.getDate() - parseInt(filterDays));
        startDate = date.toISOString().split('T')[0];
      }
      
      const workoutData = await getWorkoutHistory(startDate, endDate);
      setWorkouts(workoutData);
      setFilteredWorkouts(workoutData);
    } catch (error) {
      console.error('Error loading workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadWorkouts();
    setRefreshing(false);
  }, [filterDays]);

  // Filter workouts based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredWorkouts(workouts);
      return;
    }

    const filtered = workouts.filter(workout => {
      const exerciseNames = workout.sets.map(set => set.exercise?.name || '').join(' ');
      const searchable = `${workout.date} ${exerciseNames}`.toLowerCase();
      return searchable.includes(searchQuery.toLowerCase());
    });
    
    setFilteredWorkouts(filtered);
  }, [searchQuery, workouts]);

  const handleExport = async () => {
    try {
      const csvData = await exportData();
      // In a real app, you'd use a library like react-native-fs to save the file
      // or share it using react-native-share
      console.log('Export data:', csvData);
      // For now, just show an alert or snackbar
      alert('Export feature coming soon!');
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getWorkoutStats = (workout) => {
    const totalSets = workout.sets.length;
    const exerciseCount = new Set(workout.sets.map(set => set.exercise_id)).size;
    const totalReps = workout.sets.reduce((sum, set) => sum + set.reps, 0);
    const totalWeight = workout.sets.reduce((sum, set) => 
      sum + (set.weight ? set.weight * set.reps : 0), 0
    );
    
    return { totalSets, exerciseCount, totalReps, totalWeight };
  };

  // Group sets by exercise for display
  const groupSetsByExercise = (sets) => {
    return sets.reduce((groups, set) => {
      const exerciseName = set.exercise?.name || 'Unknown Exercise';
      if (!groups[exerciseName]) {
        groups[exerciseName] = [];
      }
      groups[exerciseName].push(set);
      return groups;
    }, {});
  };

  const selectedFilter = FILTER_OPTIONS.find(option => option.value === filterDays);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading workout history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Title>Workout History</Title>
        <Menu
          visible={showFilterMenu}
          onDismiss={() => setShowFilterMenu(false)}
          anchor={
            <IconButton
              icon="filter"
              onPress={() => setShowFilterMenu(true)}
            />
          }
        >
          {FILTER_OPTIONS.map((option) => (
            <Menu.Item
              key={option.value}
              onPress={() => {
                setFilterDays(option.value);
                setShowFilterMenu(false);
              }}
              title={option.label}
              leadingIcon={filterDays === option.value ? "check" : undefined}
            />
          ))}
        </Menu>
      </View>

      <View style={styles.controls}>
        <Searchbar
          placeholder="Search workouts..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        
        <View style={styles.filterRow}>
          <Chip 
            mode="outlined" 
            style={styles.filterChip}
            onPress={() => setShowFilterMenu(true)}
          >
            {selectedFilter?.label}
          </Chip>
          
          {workouts.length > 0 && (
            <Button 
              mode="text" 
              onPress={handleExport}
              compact
            >
              Export
            </Button>
          )}
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredWorkouts.length === 0 ? (
          <View style={styles.emptyState}>
            {workouts.length === 0 ? (
              <Banner
                visible={true}
                actions={[
                  {
                    label: 'Start Workout',
                    onPress: () => navigation.navigate('Today'),
                  },
                ]}
                icon="information"
              >
                No workout history yet. Start your first workout to see it here!
              </Banner>
            ) : (
              <Text style={styles.emptyText}>
                No workouts found matching your search.
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.workoutsList}>
            {filteredWorkouts.map((workout) => {
              const stats = getWorkoutStats(workout);
              const groupedSets = groupSetsByExercise(workout.sets);
              
              return (
                <Card key={workout.id} style={styles.workoutCard}>
                  <Card.Content>
                    <View style={styles.workoutHeader}>
                      <View>
                        <Text style={styles.workoutDate}>
                          {formatDate(workout.date)}
                        </Text>
                        <Text style={styles.workoutStats}>
                          {stats.exerciseCount} exercises • {stats.totalSets} sets • {stats.totalReps} reps
                          {stats.totalWeight > 0 && ` • ${stats.totalWeight.toFixed(1)}kg`}
                        </Text>
                      </View>
                    </View>
                    
                    <Divider style={styles.divider} />
                    
                    <View style={styles.exercisesList}>
                      {Object.entries(groupedSets).map(([exerciseName, sets]) => (
                        <View key={exerciseName} style={styles.exerciseItem}>
                          <Text style={styles.exerciseName}>{exerciseName}</Text>
                          <View style={styles.setsRow}>
                            {sets.map((set, index) => (
                              <Chip 
                                key={set.id}
                                mode="outlined" 
                                compact
                                style={styles.setChip}
                              >
                                {set.reps}{set.weight ? `@${set.weight}kg` : ''}
                              </Chip>
                            ))}
                          </View>
                        </View>
                      ))}
                    </View>
                    
                    {workout.note && (
                      <View style={styles.noteContainer}>
                        <Text style={styles.noteText}>Note: {workout.note}</Text>
                      </View>
                    )}
                  </Card.Content>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
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
  controls: {
    padding: 20,
    backgroundColor: 'white',
  },
  searchBar: {
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterChip: {
    alignSelf: 'flex-start',
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 40,
  },
  workoutsList: {
    padding: 20,
  },
  workoutCard: {
    marginBottom: 16,
    elevation: 2,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  workoutDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  workoutStats: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  divider: {
    marginVertical: 12,
  },
  exercisesList: {
    gap: 12,
  },
  exerciseItem: {
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  setsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  setChip: {
    height: 28,
  },
  noteContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});