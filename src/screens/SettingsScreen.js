import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Text, 
  List, 
  Card,
  Title,
  Button,
  Avatar,
  Divider,
  Dialog,
  Portal,
  TextInput,
  Snackbar,
  Switch,
  Paragraph
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

export default function SettingsScreen({ navigation }) {
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  const { user, profile, signOut, updateProfile, deleteAccount } = useAuth();
  const { syncData, exportData, exercises } = useData();

  const showSnackbar = (message) => {
    setSnackbar({ visible: true, message });
  };

  const hideSnackbar = () => {
    setSnackbar({ visible: false, message: '' });
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              showSnackbar('Failed to sign out');
            }
          }
        },
      ]
    );
  };

  const handleUpdateProfile = async () => {
    if (!displayName.trim()) {
      showSnackbar('Display name cannot be empty');
      return;
    }

    try {
      setLoading(true);
      await updateProfile({ display_name: displayName.trim() });
      showSnackbar('Profile updated successfully');
      setShowProfileDialog(false);
    } catch (error) {
      showSnackbar('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all workout data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => setShowDeleteDialog(true)
        },
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    try {
      setLoading(true);
      await deleteAccount();
      showSnackbar('Account deleted');
    } catch (error) {
      showSnackbar('Failed to delete account');
    } finally {
      setLoading(false);
      setShowDeleteDialog(false);
    }
  };

  const handleExportData = async () => {
    try {
      const csvData = await exportData();
      // In a real app, you'd use react-native-fs and react-native-share
      // to save/share the file
      console.log('Export data ready:', csvData);
      showSnackbar('Export feature coming soon!');
    } catch (error) {
      showSnackbar('Export failed');
    }
  };

  const handleSyncData = async () => {
    try {
      await syncData();
      showSnackbar('Data synced successfully');
    } catch (error) {
      showSnackbar('Sync failed');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const openProfileDialog = () => {
    setDisplayName(profile?.display_name || '');
    setShowProfileDialog(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Profile Section */}
        <Card style={styles.profileCard}>
          <Card.Content>
            <View style={styles.profileHeader}>
              <Avatar.Text 
                size={60} 
                label={getInitials(profile?.display_name)}
                style={styles.avatar}
              />
              <View style={styles.profileInfo}>
                <Title>{profile?.display_name || 'User'}</Title>
                <Text style={styles.email}>{user?.email}</Text>
                <Button 
                  mode="outlined" 
                  onPress={openProfileDialog}
                  compact
                  style={styles.editButton}
                >
                  Edit Profile
                </Button>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Stats Section */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <Title>Your Stats</Title>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{exercises.length}</Text>
                <Text style={styles.statLabel}>Exercises</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Total Workouts</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Days Active</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Data Section */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title>Data Management</Title>
            
            <List.Item
              title="Sync Data"
              description="Sync your data with the cloud"
              left={props => <List.Icon {...props} icon="sync" />}
              onPress={handleSyncData}
            />
            
            <Divider />
            
            <List.Item
              title="Export Data"
              description="Download your workout data as CSV"
              left={props => <List.Icon {...props} icon="download" />}
              onPress={handleExportData}
            />
            
            <Divider />
            
            <List.Item
              title="Backup & Restore"
              description="Coming soon"
              left={props => <List.Icon {...props} icon="backup-restore" />}
              disabled
            />
          </Card.Content>
        </Card>

        {/* Preferences Section */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title>Preferences</Title>
            
            <List.Item
              title="Push Notifications"
              description="Get reminders for workouts"
              left={props => <List.Icon {...props} icon="bell" />}
              right={() => (
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                />
              )}
            />
            
            <Divider />
            
            <List.Item
              title="Dark Mode"
              description="Switch to dark theme"
              left={props => <List.Icon {...props} icon="weather-night" />}
              right={() => (
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                />
              )}
            />
            
            <Divider />
            
            <List.Item
              title="Default Weight Unit"
              description="Kilograms (kg)"
              left={props => <List.Icon {...props} icon="weight-kilogram" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => showSnackbar('Unit preferences coming soon!')}
            />
          </Card.Content>
        </Card>

        {/* Support Section */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title>Support & Feedback</Title>
            
            <List.Item
              title="Help & FAQ"
              description="Get help with using the app"
              left={props => <List.Icon {...props} icon="help-circle" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => showSnackbar('Help section coming soon!')}
            />
            
            <Divider />
            
            <List.Item
              title="Send Feedback"
              description="Report bugs or suggest features"
              left={props => <List.Icon {...props} icon="message-text" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => showSnackbar('Feedback feature coming soon!')}
            />
            
            <Divider />
            
            <List.Item
              title="Rate the App"
              description="Leave a review in the app store"
              left={props => <List.Icon {...props} icon="star" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => showSnackbar('Rating feature coming soon!')}
            />
          </Card.Content>
        </Card>

        {/* Account Section */}
        <Card style={styles.sectionCard}>
          <Card.Content>
            <Title>Account</Title>
            
            <List.Item
              title="Privacy Policy"
              description="View our privacy policy"
              left={props => <List.Icon {...props} icon="shield-account" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => showSnackbar('Privacy policy coming soon!')}
            />
            
            <Divider />
            
            <List.Item
              title="Terms of Service"
              description="View terms and conditions"
              left={props => <List.Icon {...props} icon="file-document" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => showSnackbar('Terms of service coming soon!')}
            />
            
            <Divider />
            
            <List.Item
              title="Sign Out"
              description="Sign out of your account"
              left={props => <List.Icon {...props} icon="logout" />}
              onPress={handleSignOut}
            />
            
            <Divider />
            
            <List.Item
              title="Delete Account"
              description="Permanently delete your account"
              left={props => <List.Icon {...props} icon="delete-forever" />}
              titleStyle={styles.deleteText}
              onPress={handleDeleteAccount}
            />
          </Card.Content>
        </Card>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>GymTracker v1.0.0</Text>
          <Text style={styles.appInfoText}>Made with ❤️ for fitness enthusiasts</Text>
        </View>
      </ScrollView>

      {/* Profile Edit Dialog */}
      <Portal>
        <Dialog visible={showProfileDialog} onDismiss={() => setShowProfileDialog(false)}>
          <Dialog.Title>Edit Profile</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Display Name"
              mode="outlined"
              value={displayName}
              onChangeText={setDisplayName}
              autoFocus
              maxLength={50}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowProfileDialog(false)}>Cancel</Button>
            <Button 
              onPress={handleUpdateProfile}
              loading={loading}
              disabled={loading}
            >
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Delete Account Confirmation Dialog */}
      <Portal>
        <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
          <Dialog.Title>Confirm Account Deletion</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              Are you absolutely sure you want to delete your account? 
              This will permanently delete all your workout data and cannot be undone.
            </Paragraph>
            <Paragraph style={styles.warningText}>
              Type "DELETE" to confirm:
            </Paragraph>
            <TextInput
              mode="outlined"
              placeholder="Type DELETE to confirm"
              style={styles.confirmInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button 
              onPress={confirmDeleteAccount}
              loading={loading}
              disabled={loading}
              textColor="#d32f2f"
            >
              Delete Account
            </Button>
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
  scrollView: {
    flex: 1,
  },
  profileCard: {
    margin: 20,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#6750A4',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  email: {
    color: '#666',
    fontSize: 14,
    marginBottom: 8,
  },
  editButton: {
    alignSelf: 'flex-start',
  },
  statsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6750A4',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  sectionCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 2,
  },
  deleteText: {
    color: '#d32f2f',
  },
  appInfo: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 20,
  },
  appInfoText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 4,
  },
  warningText: {
    color: '#d32f2f',
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  confirmInput: {
    marginTop: 8,
  },
});