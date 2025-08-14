import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { database } from '../lib/supabase';

const DataContext = createContext({});

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const [exercises, setExercises] = useState([]);
  const [todayWorkout, setTodayWorkout] = useState(null);
  const [todaySets, setTodaySets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load from cache first
      const cachedExercises = await AsyncStorage.getItem('exercises');
      if (cachedExercises) {
        setExercises(JSON.parse(cachedExercises));
      }

      // Load from server
      await syncData();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncData = async () => {
    try {
      setSyncing(true);
      
      // Sync exercises
      const exercisesData = await database.getExercises();
      setExercises(exercisesData);
      await AsyncStorage.setItem('exercises', JSON.stringify(exercisesData));

      // Sync today's workout
      await loadTodayWorkout();
    } catch (error) {
      console.error('Error syncing data:', error);
    } finally {
      setSyncing(false);
    }
  };

  const loadTodayWorkout = async () => {
    try {
      const workout = await database.getTodaysWorkout();
      setTodayWorkout(workout);

      if (workout) {
        const sets = await database.getSetsForWorkout(workout.id);
        setTodaySets(sets);
      } else {
        setTodaySets([]);
      }
    } catch (error) {
      console.error('Error loading today workout:', error);
      setTodaySets([]);
    }
  };

  const createExercise = async (exerciseData) => {
    try {
      const newExercise = await database.createExercise(exerciseData);
      const updatedExercises = [...exercises, newExercise].sort((a, b) => 
        a.name.localeCompare(b.name)
      );
      setExercises(updatedExercises);
      await AsyncStorage.setItem('exercises', JSON.stringify(updatedExercises));
      return newExercise;
    } catch (error) {
      console.error('Error creating exercise:', error);
      throw error;
    }
  };

  const deleteExercise = async (exerciseId) => {
    try {
      await database.deleteExercise(exerciseId);
      const updatedExercises = exercises.filter(ex => ex.id !== exerciseId);
      setExercises(updatedExercises);
      await AsyncStorage.setItem('exercises', JSON.stringify(updatedExercises));
    } catch (error) {
      console.error('Error deleting exercise:', error);
      throw error;
    }
  };

  const addSet = async (exerciseId, reps, weight = null) => {
    try {
      // Ensure we have today's workout
      let workout = todayWorkout;
      if (!workout) {
        const today = new Date().toISOString().split('T')[0];
        workout = await database.createWorkout(today);
        setTodayWorkout(workout);
      }

      // Create the set
      const setData = {
        workout_id: workout.id,
        exercise_id: exerciseId,
        reps: parseInt(reps),
        weight: weight ? parseFloat(weight) : null,
        order_index: todaySets.length,
      };

      const newSet = await database.createSet(setData);
      
      // Add exercise name for display
      const exercise = exercises.find(ex => ex.id === exerciseId);
      const setWithExercise = {
        ...newSet,
        exercise: { name: exercise?.name || 'Unknown' }
      };

      setTodaySets([...todaySets, setWithExercise]);
      return newSet;
    } catch (error) {
      console.error('Error adding set:', error);
      throw error;
    }
  };

  const deleteSet = async (setId) => {
    try {
      await database.deleteSet(setId);
      setTodaySets(todaySets.filter(set => set.id !== setId));
    } catch (error) {
      console.error('Error deleting set:', error);
      throw error;
    }
  };

  const getWorkoutHistory = async (startDate, endDate) => {
    try {
      const workouts = await database.getWorkoutsByDateRange(startDate, endDate);
      const workoutsWithSets = await Promise.all(
        workouts.map(async (workout) => {
          const sets = await database.getSetsForWorkout(workout.id);
          return { ...workout, sets };
        })
      );
      return workoutsWithSets;
    } catch (error) {
      console.error('Error getting workout history:', error);
      throw error;
    }
  };

  const exportData = async () => {
    try {
      const data = await database.exportData();
      
      // Convert to CSV format
      const csvRows = ['Date,Exercise,Set,Reps,Weight'];
      
      data.forEach(workout => {
        workout.sets.forEach((set, index) => {
          csvRows.push(
            `${workout.date},${set.exercise.name},${index + 1},${set.reps},${set.weight || ''}`
          );
        });
      });

      return csvRows.join('\n');
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  };

  const getTodayStats = () => {
    const totalSets = todaySets.length;
    const exerciseCount = new Set(todaySets.map(set => set.exercise_id)).size;
    const totalReps = todaySets.reduce((sum, set) => sum + set.reps, 0);
    
    return {
      totalSets,
      exerciseCount,
      totalReps,
    };
  };

  const value = {
    exercises,
    todayWorkout,
    todaySets,
    loading,
    syncing,
    createExercise,
    deleteExercise,
    addSet,
    deleteSet,
    getWorkoutHistory,
    exportData,
    getTodayStats,
    syncData,
    loadTodayWorkout,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};