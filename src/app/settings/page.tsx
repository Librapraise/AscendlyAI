"use client";

import React, { useState, useEffect } from 'react';
import { 
  Settings, Shield, Bell, Palette, Globe, Eye, EyeOff, 
  Moon, Sun, Monitor, Smartphone, Lock, Key, Trash2, 
  Download, Upload, AlertTriangle, CheckCircle, Loader,
  Zap, Volume2, VolumeX, Mail, MessageSquare, Heart,
  CreditCard, Crown, Star, Users, Activity, BarChart3,
  Fingerprint, Wifi, HardDrive, Battery, Cpu
} from 'lucide-react';

interface UserData {
  id?: string;
  email?: string;
  name?: string;
  profilePicture?: string;
  accountType?: 'free' | 'pro' | 'enterprise';
  createdAt?: string;
  preferences?: {
    theme?: 'light' | 'dark' | 'auto';
    accentColor?: string;
    fontSize?: 'small' | 'medium' | 'large';
    animations?: boolean;
    profileVisibility?: 'public' | 'private' | 'friends';
    twoFactorEnabled?: boolean;
    dataCollection?: boolean;
    locationSharing?: boolean;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    soundEnabled?: boolean;
    marketingEmails?: boolean;
    autoSave?: boolean;
    offlineMode?: boolean;
  };
}

interface SettingsData {
  // Appearance
  theme: 'light' | 'dark' | 'auto';
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  animations: boolean;
  
  // Privacy & Security
  profileVisibility: 'public' | 'private' | 'friends';
  twoFactorEnabled: boolean;
  dataCollection: boolean;
  locationSharing: boolean;
  
  // Notifications
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
  marketingEmails: boolean;
  
  // Performance
  autoSave: boolean;
  offlineMode: boolean;
  cacheSize: number;
  
  // Account
  accountType: 'free' | 'pro' | 'enterprise';
  storageUsed: number;
  storageLimit: number;
}

export default function SettingsPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [settings, setSettings] = useState<SettingsData>({
    theme: 'dark',
    accentColor: '#3B82F6',
    fontSize: 'medium',
    animations: true,
    profileVisibility: 'public',
    twoFactorEnabled: false,
    dataCollection: true,
    locationSharing: false,
    emailNotifications: true,
    pushNotifications: true,
    soundEnabled: true,
    marketingEmails: false,
    autoSave: true,
    offlineMode: false,
    cacheSize: 2.3,
    accountType: 'pro',
    storageUsed: 4.2,
    storageLimit: 10
  });

  const [activeSection, setActiveSection] = useState('appearance');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingUser, setIsFetchingUser] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showDangerZone, setShowDangerZone] = useState(false);
  const [glowEffect, setGlowEffect] = useState(false);

  const accentColors = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Orange', value: '#F59E0B' },
    { name: 'Red', value: '#EF4444' }
  ];

  const sections = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'performance', label: 'Performance', icon: Zap },
    { id: 'account', label: 'Account', icon: Settings }
  ];

  // Get access token from localStorage
  const getAccessToken = () => {
    return localStorage.getItem('access_token');
  };

  // API call to fetch user data
  const fetchUserData = async () => {
    try {
      setIsFetchingUser(true);
      setError('');
      
      const token = getAccessToken();
      if (!token) {
        throw new Error('No access token found. Please log in.');
      }

      const response = await fetch('https://weapply.onrender.com/api/v1/users/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error(`Failed to fetch user data: ${response.status}`);
      }

      const data = await response.json();
      setUserData(data);
      
      // Update settings with user preferences if available
      if (data.preferences) {
        setSettings(prev => ({
          ...prev,
          ...data.preferences,
          accountType: data.accountType || prev.accountType,
        }));
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user data');
      console.error('Error fetching user data:', err);
    } finally {
      setIsFetchingUser(false);
    }
  };

  // API call to update user preferences
  const updateUserPreferences = async (newSettings: Partial<SettingsData>) => {
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error('No access token found. Please log in.');
      }

      const response = await fetch('https://weapply.onrender.com/api/v1/users/me', {
        method: 'PATCH', // or PUT depending on your API
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferences: newSettings
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error(`Failed to update preferences: ${response.status}`);
      }

      const updatedData = await response.json();
      setUserData(updatedData);
      return true;
      
    } catch (err) {
      console.error('Error updating preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
      return false;
    }
  };

  // Load user data on component mount
  useEffect(() => {
    fetchUserData();
  }, []);

  const updateSetting = async (key: keyof SettingsData, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setGlowEffect(true);
    setTimeout(() => setGlowEffect(false), 300);

    // Auto-save to API (you can also make this manual with a save button)
    const success = await updateUserPreferences({ [key]: value });
    if (success) {
      setSuccess('Setting updated successfully!');
      setTimeout(() => setSuccess(''), 2000);
    }
  };

  const saveAllSettings = async () => {
    setIsLoading(true);
    setError('');
    
    const success = await updateUserPreferences(settings);
    
    if (success) {
      setSuccess('All settings saved successfully!');
    }
    
    setIsLoading(false);
    setTimeout(() => setSuccess(''), 3000);
  };

  const resetSettings = async () => {
    const defaultSettings = {
      theme: 'dark' as const,
      accentColor: '#3B82F6',
      fontSize: 'medium' as const,
      animations: true,
      profileVisibility: 'public' as const,
      twoFactorEnabled: false,
      dataCollection: true,
      locationSharing: false,
      emailNotifications: true,
      pushNotifications: true,
      soundEnabled: true,
      marketingEmails: false,
      autoSave: true,
      offlineMode: false,
      cacheSize: 2.3,
      accountType: 'pro' as const,
      storageUsed: 4.2,
      storageLimit: 10
    };
    
    setSettings(defaultSettings);
    const success = await updateUserPreferences(defaultSettings);
    
    if (success) {
      setSuccess('Settings reset successfully!');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setSuccess('Logged out successfully!');
    setTimeout(() => {
      // Redirect to login page or refresh
      window.location.reload();
    }, 1500);
  };

  const ToggleSwitch = ({ enabled, onChange, label, description }: any) => (
    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-700/30 backdrop-blur-sm border border-gray-600/50 hover:border-gray-500/50 transition-all duration-300">
      <div>
        <h4 className="text-white font-medium">{label}</h4>
        {description && <p className="text-gray-400 text-sm mt-1">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
          enabled 
            ? 'bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg shadow-blue-500/25' 
            : 'bg-gray-600'
        }`}
      >
        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 ${
          enabled ? 'transform translate-x-6' : ''
        }`} />
      </button>
    </div>
  );

  const ProgressBar = ({ value, max, color = 'blue' }: any) => (
    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
      <div 
        className={`h-full bg-gradient-to-r from-${color}-500 to-${color}-400 transition-all duration-700 ease-out`}
        style={{ width: `${(value / max) * 100}%` }}
      />
    </div>
  );

  // Show loading state while fetching user data
  if (isFetchingUser) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-white">Loading your settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-purple-900/10 to-pink-900/10 animate-pulse" />
      
      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      
      <div className="relative z-10 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="opacity-0 animate-fade-in mb-8" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
            <div className="bg-gray-800/60 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-8 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 ${glowEffect ? 'animate-pulse shadow-2xl shadow-blue-500/50' : ''} transition-all duration-300`}>
                    <Settings className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">Settings</h1>
                    <p className="text-gray-400">
                      {userData?.name ? `Welcome back, ${userData.name}` : 'Customize your experience'}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={saveAllSettings}
                    disabled={isLoading}
                    className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-blue-500/25 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                    <span>{isLoading ? 'Saving...' : 'Save All'}</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/50 px-4 py-3 rounded-xl transition-all duration-300"
                  >
                    <Lock className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className="opacity-0 animate-fade-in mb-6 p-4 bg-green-900/30 backdrop-blur-sm border border-green-700/50 rounded-xl flex items-center space-x-3" style={{ animationDelay: '0.15s', animationFillMode: 'forwards' }}>
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              <p className="text-green-300">{success}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="opacity-0 animate-fade-in mb-6 p-4 bg-red-900/30 backdrop-blur-sm border border-red-700/50 rounded-xl flex items-center space-x-3" style={{ animationDelay: '0.15s', animationFillMode: 'forwards' }}>
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-300">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="opacity-0 animate-fade-in lg:col-span-1" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
              <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-6 sticky top-8">
                {/* User Info */}
                {userData && (
                  <div className="mb-6 p-4 rounded-xl bg-gray-700/30 border border-gray-600/50">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {userData.name ? userData.name.charAt(0).toUpperCase() : 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{userData.name || 'User'}</p>
                        <p className="text-gray-400 text-sm">{userData.email}</p>
                      </div>
                    </div>
                  </div>
                )}
                <nav className="space-y-2">
                  {sections.map((section, index) => {
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                          activeSection === section.id
                            ? 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 text-white border border-blue-500/30'
                            : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                        }`}
                        style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{section.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-8">
              {/* Appearance Settings */}
              {activeSection === 'appearance' && (
                <div className="opacity-0 animate-fade-in space-y-6" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
                  <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                      <Palette className="w-6 h-6 mr-3" />
                      Appearance
                    </h2>
                    
                    {/* Theme Selection */}
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-white mb-4">Theme</h3>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { id: 'light', label: 'Light', icon: Sun },
                          { id: 'dark', label: 'Dark', icon: Moon },
                          { id: 'auto', label: 'Auto', icon: Monitor }
                        ].map(theme => {
                          const Icon = theme.icon;
                          return (
                            <button
                              key={theme.id}
                              onClick={() => updateSetting('theme', theme.id)}
                              className={`p-4 rounded-xl border transition-all duration-300 ${
                                settings.theme === theme.id
                                  ? 'border-blue-500 bg-blue-500/10 text-white'
                                  : 'border-gray-600 bg-gray-700/30 text-gray-400 hover:border-gray-500 hover:text-white'
                              }`}
                            >
                              <Icon className="w-6 h-6 mx-auto mb-2" />
                              <div className="text-sm font-medium">{theme.label}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Accent Color */}
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-white mb-4">Accent Color</h3>
                      <div className="flex space-x-3">
                        {accentColors.map(color => (
                          <button
                            key={color.value}
                            onClick={() => updateSetting('accentColor', color.value)}
                            className={`w-12 h-12 rounded-full transition-all duration-300 ${
                              settings.accentColor === color.value ? 'ring-4 ring-white/50 shadow-lg' : 'hover:scale-110'
                            }`}
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Font Size */}
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-white mb-4">Font Size</h3>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { id: 'small', label: 'Small' },
                          { id: 'medium', label: 'Medium' },
                          { id: 'large', label: 'Large' }
                        ].map(size => (
                          <button
                            key={size.id}
                            onClick={() => updateSetting('fontSize', size.id)}
                            className={`p-3 rounded-xl border transition-all duration-300 ${
                              settings.fontSize === size.id
                                ? 'border-blue-500 bg-blue-500/10 text-white'
                                : 'border-gray-600 bg-gray-700/30 text-gray-400 hover:border-gray-500 hover:text-white'
                            }`}
                          >
                            {size.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <ToggleSwitch
                      enabled={settings.animations}
                      onChange={(value: boolean) => updateSetting('animations', value)}
                      label="Enable Animations"
                      description="Add smooth transitions and visual effects"
                    />
                  </div>
                </div>
              )}

              {/* Privacy & Security Settings */}
              {activeSection === 'privacy' && (
                <div className="opacity-0 animate-fade-in space-y-6" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
                  <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                      <Shield className="w-6 h-6 mr-3" />
                      Privacy & Security
                    </h2>
                    
                    <div className="space-y-6">
                      <div className="p-4 rounded-xl bg-gray-700/30 backdrop-blur-sm border border-gray-600/50">
                        <h3 className="text-lg font-semibold text-white mb-4">Profile Visibility</h3>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { id: 'public', label: 'Public', icon: Globe },
                            { id: 'friends', label: 'Friends', icon: Users },
                            { id: 'private', label: 'Private', icon: Lock }
                          ].map(visibility => {
                            const Icon = visibility.icon;
                            return (
                              <button
                                key={visibility.id}
                                onClick={() => updateSetting('profileVisibility', visibility.id)}
                                className={`p-3 rounded-lg border transition-all duration-300 ${
                                  settings.profileVisibility === visibility.id
                                    ? 'border-blue-500 bg-blue-500/10 text-white'
                                    : 'border-gray-600 bg-gray-700/30 text-gray-400 hover:border-gray-500 hover:text-white'
                                }`}
                              >
                                <Icon className="w-5 h-5 mx-auto mb-2" />
                                <div className="text-sm">{visibility.label}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <ToggleSwitch
                        enabled={settings.twoFactorEnabled}
                        onChange={(value: boolean) => updateSetting('twoFactorEnabled', value)}
                        label="Two-Factor Authentication"
                        description="Add an extra layer of security to your account"
                      />

                      <ToggleSwitch
                        enabled={settings.dataCollection}
                        onChange={(value: boolean) => updateSetting('dataCollection', value)}
                        label="Analytics & Data Collection"
                        description="Help us improve by sharing anonymous usage data"
                      />

                      <ToggleSwitch
                        enabled={settings.locationSharing}
                        onChange={(value: boolean) => updateSetting('locationSharing', value)}
                        label="Location Sharing"
                        description="Allow location-based features and recommendations"
                      />

                      <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-6">
                        <div className="flex items-center space-x-3 mb-4">
                          <AlertTriangle className="w-6 h-6 text-red-400" />
                          <h3 className="text-lg font-semibold text-red-300">Danger Zone</h3>
                        </div>
                        <button
                          onClick={() => setShowDangerZone(!showDangerZone)}
                          className="text-red-400 hover:text-red-300 text-sm transition-colors duration-200"
                        >
                          {showDangerZone ? 'Hide' : 'Show'} dangerous actions
                        </button>
                        {showDangerZone && (
                          <div className="mt-4 space-y-3">
                            <button 
                              onClick={resetSettings}
                              className="w-full p-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-300 transition-colors duration-200"
                            >
                              Reset All Settings
                            </button>
                            <button className="w-full p-3 bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 rounded-lg text-red-300 transition-colors duration-200">
                              Delete Account
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Settings */}
              {activeSection === 'notifications' && (
                <div className="opacity-0 animate-fade-in space-y-6" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
                  <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                      <Bell className="w-6 h-6 mr-3" />
                      Notifications
                    </h2>
                    
                    <div className="space-y-6">
                      <ToggleSwitch
                        enabled={settings.emailNotifications}
                        onChange={(value: boolean) => updateSetting('emailNotifications', value)}
                        label="Email Notifications"
                        description="Receive important updates via email"
                      />

                      <ToggleSwitch
                        enabled={settings.pushNotifications}
                        onChange={(value: boolean) => updateSetting('pushNotifications', value)}
                        label="Push Notifications"
                        description="Get real-time notifications in your browser"
                      />

                      <ToggleSwitch
                        enabled={settings.soundEnabled}
                        onChange={(value: boolean) => updateSetting('soundEnabled', value)}
                        label="Sound Effects"
                        description="Play sounds for notifications and interactions"
                      />

                      <ToggleSwitch
                        enabled={settings.marketingEmails}
                        onChange={(value: boolean) => updateSetting('marketingEmails', value)}
                        label="Marketing Communications"
                        description="Receive updates about new features and promotions"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Settings */}
              {activeSection === 'performance' && (
                <div className="opacity-0 animate-fade-in space-y-6" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
                  <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                      <Zap className="w-6 h-6 mr-3" />
                      Performance
                    </h2>
                    
                    <div className="space-y-6">
                      <ToggleSwitch
                        enabled={settings.autoSave}
                        onChange={(value: boolean) => updateSetting('autoSave', value)}
                        label="Auto-Save"
                        description="Automatically save your work as you type"
                      />

                      <ToggleSwitch
                        enabled={settings.offlineMode}
                        onChange={(value: boolean) => updateSetting('offlineMode', value)}
                        label="Offline Mode"
                        description="Cache content for offline access"
                      />

                      <div className="p-4 rounded-xl bg-gray-700/30 backdrop-blur-sm border border-gray-600/50">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="text-white font-medium">Cache Size</h4>
                            <p className="text-gray-400 text-sm">Current cache: {settings.cacheSize} GB</p>
                          </div>
                          <button 
                            onClick={() => updateSetting('cacheSize', 0)}
                            className="flex items-center space-x-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/50 px-4 py-2 rounded-lg transition-all duration-300"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Clear Cache</span>
                          </button>
                        </div>
                        <ProgressBar value={settings.cacheSize} max={10} color="yellow" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl bg-gray-700/30 border border-gray-600/50 text-center">
                          <Cpu className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                          <p className="text-white font-medium">CPU Usage</p>
                          <p className="text-gray-400 text-sm">12%</p>
                        </div>
                        <div className="p-4 rounded-xl bg-gray-700/30 border border-gray-600/50 text-center">
                          <HardDrive className="w-8 h-8 text-green-400 mx-auto mb-2" />
                          <p className="text-white font-medium">Memory</p>
                          <p className="text-gray-400 text-sm">2.1 GB</p>
                        </div>
                        <div className="p-4 rounded-xl bg-gray-700/30 border border-gray-600/50 text-center">
                          <Wifi className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                          <p className="text-white font-medium">Network</p>
                          <p className="text-gray-400 text-sm">Connected</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Settings */}
              {activeSection === 'account' && (
                <div className="opacity-0 animate-fade-in space-y-6" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
                  <div className="bg-gray-800/60 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-8">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                      <Settings className="w-6 h-6 mr-3" />
                      Account
                    </h2>
                    
                    <div className="space-y-6">
                      {/* Account Type */}
                      <div className="p-6 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-600/10 border border-blue-500/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
                              {settings.accountType === 'enterprise' ? (
                                <Crown className="w-6 h-6 text-white" />
                              ) : settings.accountType === 'pro' ? (
                                <Star className="w-6 h-6 text-white" />
                              ) : (
                                <Users className="w-6 h-6 text-white" />
                              )}
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-white capitalize">
                                {settings.accountType} Account
                              </h3>
                              <p className="text-gray-400 text-sm">
                                {settings.accountType === 'enterprise' && 'Advanced features for teams'}
                                {settings.accountType === 'pro' && 'Enhanced features and priority support'}
                                {settings.accountType === 'free' && 'Basic features with limitations'}
                              </p>
                            </div>
                          </div>
                          <button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg transition-all duration-300">
                            Upgrade
                          </button>
                        </div>
                      </div>

                      {/* Storage Usage */}
                      <div className="p-4 rounded-xl bg-gray-700/30 backdrop-blur-sm border border-gray-600/50">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="text-white font-medium">Storage Usage</h4>
                            <p className="text-gray-400 text-sm">
                              {settings.storageUsed} GB of {settings.storageLimit} GB used
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-400">
                            <HardDrive className="w-5 h-5" />
                            <span className="text-sm">
                              {Math.round((settings.storageUsed / settings.storageLimit) * 100)}%
                            </span>
                          </div>
                        </div>
                        <ProgressBar 
                          value={settings.storageUsed} 
                          max={settings.storageLimit} 
                          color={settings.storageUsed / settings.storageLimit > 0.8 ? 'red' : 'blue'} 
                        />
                      </div>

                      {/* Account Actions */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button className="flex items-center justify-center space-x-3 p-4 rounded-xl bg-gray-700/30 border border-gray-600/50 hover:border-gray-500/50 text-gray-300 hover:text-white transition-all duration-300">
                          <Download className="w-5 h-5" />
                          <span>Export Data</span>
                        </button>
                        <button className="flex items-center justify-center space-x-3 p-4 rounded-xl bg-gray-700/30 border border-gray-600/50 hover:border-gray-500/50 text-gray-300 hover:text-white transition-all duration-300">
                          <Upload className="w-5 h-5" />
                          <span>Import Data</span>
                        </button>
                      </div>

                      {/* Billing Information */}
                      {(settings.accountType === 'pro' || settings.accountType === 'enterprise') && (
                        <div className="p-4 rounded-xl bg-gray-700/30 backdrop-blur-sm border border-gray-600/50">
                          <h4 className="text-white font-medium mb-3 flex items-center">
                            <CreditCard className="w-5 h-5 mr-2" />
                            Billing Information
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Plan:</span>
                              <span className="text-white capitalize">{settings.accountType} Plan</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Next billing:</span>
                              <span className="text-white">July 22, 2025</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Payment method:</span>
                              <span className="text-white">•••• •••• •••• 4242</span>
                            </div>
                          </div>
                          <button className="mt-4 w-full bg-gray-600/50 hover:bg-gray-600/70 text-white py-2 rounded-lg transition-colors duration-200">
                            Manage Billing
                          </button>
                        </div>
                      )}

                      {/* Account Statistics */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl bg-gray-700/30 border border-gray-600/50 text-center">
                          <Activity className="w-8 h-8 text-green-400 mx-auto mb-2" />
                          <p className="text-white font-medium">Active Days</p>
                          <p className="text-gray-400 text-sm">127 days</p>
                        </div>
                        <div className="p-4 rounded-xl bg-gray-700/30 border border-gray-600/50 text-center">
                          <BarChart3 className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                          <p className="text-white font-medium">Projects</p>
                          <p className="text-gray-400 text-sm">23 total</p>
                        </div>
                        <div className="p-4 rounded-xl bg-gray-700/30 border border-gray-600/50 text-center">
                          <Heart className="w-8 h-8 text-red-400 mx-auto mb-2" />
                          <p className="text-white font-medium">Member Since</p>
                          <p className="text-gray-400 text-sm">
                            {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'Jan 2025'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}