"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, 
  Bell, 
  Globe, 
  Moon, 
  Sun, 
  Smartphone, 
  Mail, 
  Lock, 
  Trash2, 
  Download, 
  Upload, 
  AlertTriangle, 
  CheckCircle, 
  Loader, 
  Eye, 
  EyeOff,
  Key,
  Database
} from 'lucide-react';

interface SettingsData {
  notifications: {
    email: boolean;
    push: boolean;
    marketing: boolean;
    security: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'connections';
    showEmail: boolean;
    showPhone: boolean;
    indexProfile: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    loginAlerts: boolean;
    sessionTimeout: number;
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
    dateFormat: string;
  };
}

export default function SettingsPage() {
  const { user: authUser, isAuthenticated, signOut } = useAuth();
  const [settings, setSettings] = useState<SettingsData>({
    notifications: {
      email: true,
      push: false,
      marketing: false,
      security: true,
    },
    privacy: {
      profileVisibility: 'public',
      showEmail: false,
      showPhone: false,
      indexProfile: true,
    },
    security: {
      twoFactorEnabled: false,
      loginAlerts: true,
      sessionTimeout: 30,
    },
    preferences: {
      theme: 'dark',
      language: 'en',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const getAuthToken = (): string => {
    return localStorage.getItem('access_token') || '';
  };

  const updateSetting = (section: keyof SettingsData, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      setError('');
      setSuccess('');

      const token = getAuthToken();
      if (!token) {
        setError('Authentication required. Please log in again.');
        signOut();
        return;
      }

      // Simulate API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const changePassword = async () => {
    try {
      setIsSaving(true);
      setError('');
      
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError('New passwords do not match.');
        return;
      }

      if (passwordData.newPassword.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }

      const token = getAuthToken();
      if (!token) {
        setError('Authentication required. Please log in again.');
        signOut();
        return;
      }

      // Simulate API call - replace with actual endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSuccess('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordChange(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Failed to change password. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const exportData = async () => {
    try {
      setIsLoading(true);
      // Simulate data export
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const data = {
        profile: authUser,
        settings: settings,
        exportDate: new Date().toISOString(),
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `account-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSuccess('Data exported successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to export data.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-lg p-8 max-w-md w-full text-center">
          <Shield className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Authentication Required</h2>
          <p className="text-gray-300 mb-6">Please log in to access settings.</p>
          <button
            onClick={() => window.location.href = '/signin'}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 w-full"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4 lg:pl-72">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="opacity-0 animate-fade-in bg-gray-800 rounded-2xl border border-gray-700 p-6 md:p-8" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Settings</h1>
              <p className="text-gray-300 mt-2">Manage your account preferences and security</p>
            </div>
            <Shield className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        {/* Success/Error Messages */}
        {error && (
          <div className="opacity-0 animate-fade-in p-4 bg-red-900/20 border border-red-700 rounded-lg flex items-center space-x-3" style={{ animationDelay: '0.15s', animationFillMode: 'forwards' }}>
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {success && (
          <div className="opacity-0 animate-fade-in p-4 bg-green-900/20 border border-green-700 rounded-lg flex items-center space-x-3" style={{ animationDelay: '0.15s', animationFillMode: 'forwards' }}>
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
            <p className="text-green-300">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Notifications */}
          <div className="opacity-0 animate-fade-in bg-gray-800 rounded-2xl border border-gray-700 p-8" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
            <div className="flex items-center space-x-3 mb-6">
              <Bell className="w-6 h-6 text-blue-400" />
              <h2 className="text-xl font-bold text-white">Notifications</h2>
            </div>
            <div className="space-y-4">
              {Object.entries(settings.notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <span className="text-white capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <p className="text-sm text-gray-400">
                      {key === 'email' && 'Receive notifications via email'}
                      {key === 'push' && 'Receive push notifications'}
                      {key === 'marketing' && 'Receive marketing communications'}
                      {key === 'security' && 'Receive security alerts'}
                    </p>
                  </div>
                  <button
                    onClick={() => updateSetting('notifications', key, !value)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      value ? 'bg-blue-500' : 'bg-gray-600'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      value ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy */}
          <div className="opacity-0 animate-fade-in bg-gray-800 rounded-2xl border border-gray-700 p-8" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
            <div className="flex items-center space-x-3 mb-6">
              <Eye className="w-6 h-6 text-green-400" />
              <h2 className="text-xl font-bold text-white">Privacy</h2>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Profile Visibility</label>
                <select
                  value={settings.privacy.profileVisibility}
                  onChange={(e) => updateSetting('privacy', 'profileVisibility', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="public">Public</option>
                  <option value="connections">Connections Only</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white">Show Email</span>
                  <button
                    onClick={() => updateSetting('privacy', 'showEmail', !settings.privacy.showEmail)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.privacy.showEmail ? 'bg-blue-500' : 'bg-gray-600'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.privacy.showEmail ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white">Show Phone</span>
                  <button
                    onClick={() => updateSetting('privacy', 'showPhone', !settings.privacy.showPhone)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.privacy.showPhone ? 'bg-blue-500' : 'bg-gray-600'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.privacy.showPhone ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white">Index Profile</span>
                  <button
                    onClick={() => updateSetting('privacy', 'indexProfile', !settings.privacy.indexProfile)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.privacy.indexProfile ? 'bg-blue-500' : 'bg-gray-600'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.privacy.indexProfile ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="opacity-0 animate-fade-in bg-gray-800 rounded-2xl border border-gray-700 p-8" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
            <div className="flex items-center space-x-3 mb-6">
              <Lock className="w-6 h-6 text-red-400" />
              <h2 className="text-xl font-bold text-white">Security</h2>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-white">Two-Factor Authentication</span>
                  <p className="text-sm text-gray-400">Add extra security to your account</p>
                </div>
                <button
                  onClick={() => updateSetting('security', 'twoFactorEnabled', !settings.security.twoFactorEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.security.twoFactorEnabled ? 'bg-blue-500' : 'bg-gray-600'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.security.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Session Timeout (minutes)</label>
                <select
                  value={settings.security.sessionTimeout}
                  onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>

              <button
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 w-full justify-center"
              >
                <Key className="w-4 h-4" />
                <span>Change Password</span>
              </button>

              {showPasswordChange && (
                <div className="border border-gray-600 rounded-lg p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      >
                        {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      >
                        {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      >
                        {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowPasswordChange(false)}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={changePassword}
                      disabled={isSaving}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50"
                    >
                      {isSaving ? <Loader className="w-4 h-4 animate-spin mx-auto" /> : 'Update Password'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preferences */}
          <div className="opacity-0 animate-fade-in bg-gray-800 rounded-2xl border border-gray-700 p-8" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
            <div className="flex items-center space-x-3 mb-6">
              <Globe className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-bold text-white">Preferences</h2>
            </div>
            <div className="space-y-6">

              {/* Theme, Language, Date Format 
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Theme</label>
                <div className="flex space-x-3">
                  {['light', 'dark', 'system'].map((theme) => (
                    <button
                      key={theme}
                      onClick={() => updateSetting('preferences', 'theme', theme)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                        settings.preferences.theme === theme
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {theme === 'light' && <Sun className="w-4 h-4" />}
                      {theme === 'dark' && <Moon className="w-4 h-4" />}
                      {theme === 'system' && <Smartphone className="w-4 h-4" />}
                      <span className="capitalize">{theme}</span>
                    </button>
                  ))}
                </div>
              </div>
              */}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Language</label>
                <select
                  value={settings.preferences.language}
                  onChange={(e) => updateSetting('preferences', 'language', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Date Format</label>
                <select
                  value={settings.preferences.dateFormat}
                  onChange={(e) => updateSetting('preferences', 'dateFormat', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Data & Account Management */}
        <div className="opacity-0 animate-fade-in bg-gray-800 rounded-2xl border border-gray-700 p-8" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
          <div className="flex items-center space-x-3 mb-6">
            <Database className="w-6 h-6 text-yellow-400" />
            <h2 className="text-xl font-bold text-white">Data & Account</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={exportData}
              disabled={isLoading}
              className="flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg transition-colors duration-200 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
              <span>Export Data</span>
            </button>
            
            <button className="flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg transition-colors duration-200">
              <Upload className="w-5 h-5" />
              <span>Import Data</span>
            </button>
            
            <button
              onClick={() => setShowDeleteAccount(true)}
              className="flex items-center justify-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg transition-colors duration-200"
            >
              <Trash2 className="w-5 h-5" />
              <span>Delete Account</span>
            </button>
          </div>

          {showDeleteAccount && (
            <div className="mt-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-red-400" />
                <h3 className="text-lg font-semibold text-red-300">Delete Account</h3>
              </div>
              <p className="text-red-200 mb-4">
                This action cannot be undone. This will permanently delete your account and remove all your data.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteAccount(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200">
                  I understand, delete my account
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="opacity-0 animate-fade-in flex justify-end" style={{ animationDelay: '0.7s', animationFillMode: 'forwards' }}>
          <button
            onClick={saveSettings}
            disabled={isSaving}
            className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors duration-200 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
            <span>{isSaving ? 'Saving...' : 'Save All Settings'}</span>
          </button>
        </div>
      </div>

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