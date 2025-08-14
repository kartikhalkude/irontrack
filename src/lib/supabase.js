import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://qbdgfirhebxlqquzqkss.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiZGdmaXJoZWJ4bHFxdXpxa3NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxODkyMjcsImV4cCI6MjA3MDc2NTIyN30.rs2DDIx2v4VjsT6-jmcAWl5llS0AlhptsrJXLCgus_Q';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Enhanced database functions with better error handling
export const database = {
  // Profile functions
  async getProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error getting profile:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getProfile:', error);
      throw error;
    }
  },

  async createProfile(profile) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([profile])
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in createProfile:', error);
      throw error;
    }
  },

  async updateProfile(id, updates) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in updateProfile:', error);
      throw error;
    }
  },

  // Exercise functions
  async getExercises() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('name');

      if (error) {
        console.error('Error getting exercises:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getExercises:', error);
      throw error;
    }
  },

  async createExercise(exercise) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('exercises')
        .insert([{ ...exercise, user_id: user.id }])
        .select()
        .single();

      if (error) {
        console.error('Error creating exercise:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in createExercise:', error);
      throw error;
    }
  },

  async deleteExercise(id) {
    try {
      const { error } = await supabase
        .from('exercises')
        .update({ is_archived: true })
        .eq('id', id);

      if (error) {
        console.error('Error deleting exercise:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteExercise:', error);
      throw error;
    }
  },

  // Workout functions
  async getTodaysWorkout() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error getting today workout:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getTodaysWorkout:', error);
      throw error;
    }
  },

  async createWorkout(date, note = null) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('workouts')
        .insert([{ user_id: user.id, date, note }])
        .select()
        .single();

      if (error) {
        console.error('Error creating workout:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in createWorkout:', error);
      throw error;
    }
  },

  async getWorkoutsByDateRange(startDate, endDate) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error getting workouts by date range:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getWorkoutsByDateRange:', error);
      throw error;
    }
  },

  // Set functions
  async getSetsForWorkout(workoutId) {
    try {
      const { data, error } = await supabase
        .from('sets')
        .select(`
          *,
          exercise:exercises(name)
        `)
        .eq('workout_id', workoutId)
        .order('order_index');

      if (error) {
        console.error('Error getting sets for workout:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getSetsForWorkout:', error);
      throw error;
    }
  },

  async createSet(set) {
    try {
      const { data, error } = await supabase
        .from('sets')
        .insert([set])
        .select()
        .single();

      if (error) {
        console.error('Error creating set:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in createSet:', error);
      throw error;
    }
  },

  async updateSet(id, updates) {
    try {
      const { data, error } = await supabase
        .from('sets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating set:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in updateSet:', error);
      throw error;
    }
  },

  async deleteSet(id) {
    try {
      const { error } = await supabase
        .from('sets')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting set:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteSet:', error);
      throw error;
    }
  },

  // Export functions
  async exportData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data: workouts, error: workoutsError } = await supabase
        .from('workouts')
        .select(`
          *,
          sets(
            *,
            exercise:exercises(name)
          )
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (workoutsError) {
        console.error('Error exporting data:', workoutsError);
        throw workoutsError;
      }
      
      return workouts || [];
    } catch (error) {
      console.error('Error in exportData:', error);
      throw error;
    }
  }}