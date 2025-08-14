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

// Database functions
export const database = {
  // Profile functions
  async getProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user');

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async createProfile(profile) {
    const { data, error } = await supabase
      .from('profiles')
      .insert([profile])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateProfile(id, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Exercise functions
  async getExercises() {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('is_archived', false)
      .order('name');

    if (error) throw error;
    return data;
  },

  async createExercise(exercise) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user');

    const { data, error } = await supabase
      .from('exercises')
      .insert([{ ...exercise, user_id: user.id }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteExercise(id) {
    const { error } = await supabase
      .from('exercises')
      .update({ is_archived: true })
      .eq('id', id);

    if (error) throw error;
  },

  // Workout functions
  async getTodaysWorkout() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user');

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async createWorkout(date, note = null) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user');

    const { data, error } = await supabase
      .from('workouts')
      .insert([{ user_id: user.id, date, note }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getWorkoutsByDateRange(startDate, endDate) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user');

    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Set functions
  async getSetsForWorkout(workoutId) {
    const { data, error } = await supabase
      .from('sets')
      .select(`
        *,
        exercise:exercises(name)
      `)
      .eq('workout_id', workoutId)
      .order('order_index');

    if (error) throw error;
    return data;
  },

  async createSet(set) {
    const { data, error } = await supabase
      .from('sets')
      .insert([set])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateSet(id, updates) {
    const { data, error } = await supabase
      .from('sets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteSet(id) {
    const { error } = await supabase
      .from('sets')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Export functions
  async exportData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user');

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

    if (workoutsError) throw workoutsError;
    return workouts;
  }
};