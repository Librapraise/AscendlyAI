"use client";

import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Edit3, Save, X, Camera, Briefcase, GraduationCap, AlertCircle, CheckCircle, Loader, Plus } from 'lucide-react';
import axios from 'axios';

interface UserData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  title?: string;
  company?: string;
  bio?: string;
  education?: string;
  experience?: string;
  skills?: string[];
  linkedIn?: string;
  github?: string;
  website?: string;
  avatar?: string | null;
  joinedDate: string;
  documentsGenerated: number;
  lastActive: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [editData, setEditData] = useState<Partial<UserData>>({});

  // Mock data for demonstration - remove this and use real API
  const mockUserData: UserData = {
    id: '123',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    title: 'Senior Software Developer',
    company: 'Tech Corp Inc.',
    bio: 'Experienced software developer with 5+ years in full-stack development. Passionate about creating efficient and scalable solutions.',
    education: 'B.S. Computer Science - Stanford University',
    experience: '5+ years',
    skills: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS'],
    linkedIn: 'https://linkedin.com/in/johndoe',
    github: 'https://github.com/johndoe',
    website: 'https://johndoe.dev',
    avatar: null,
    joinedDate: '2023-01-15',
    documentsGenerated: 23,
    lastActive: '2024-06-17'
  };

  const fetchUserProfile = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError('');
      
      // Get auth token (in real app, get from localStorage or auth context)
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        setError('Authentication required. Please log in again.');
        return;
      }

      // For demo purposes, simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      setUser(mockUserData);
      setEditData(mockUserData);

      
      const response = await axios.get('https://weapply.onrender.com/api/v1/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setUser(response.data.data);
        setEditData(response.data.data);
      } else {
        setError('Failed to load profile data');
      }
      

    } catch (err: any) {
      console.error('Error fetching profile:', err);
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again.');
      } else if (err.response?.status === 404) {
        setError('Profile not found.');
      } else {
        setError('Failed to load profile. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async (): Promise<void> => {
    try {
      setIsSaving(true);
      setError('');
      setSuccess('');

      const token = localStorage.getItem('access_token');

      // For demo purposes, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setUser(editData as UserData);
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);

      
      const response = await axios.put('https://weapply.onrender.com/api/v1/users/me', 
        editData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setUser(editData as UserData);
        setIsEditing(false);
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to update profile');
      }
      
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof UserData, value: string): void => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSkillsChange = (value: string): void => {
    const skillsArray = value.split(',').map(skill => skill.trim()).filter(skill => skill);
    setEditData(prev => ({
      ...prev,
      skills: skillsArray
    }));
  };

  const cancelEdit = (): void => {
    setEditData(user || {});
    setIsEditing(false);
    setError('');
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader className="animate-spin h-6 w-6 text-blue-400" />
          <span className="text-gray-300">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Error Loading Profile</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={fetchUserProfile}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="opacity-0 animate-fade-in bg-gray-800 rounded-2xl border border-gray-700 p-6 md:p-8" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            {/* Left Section: Avatar + Info */}
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Profile" className="w-24 h-24 rounded-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-white" />
                  )}
                </div>
                <button className="absolute -bottom-1 -right-1 bg-gray-700 hover:bg-gray-600 rounded-full p-2 shadow-lg border border-gray-600 transition-colors duration-200">
                  <Camera className="w-4 h-4 text-gray-300" />
                </button>
              </div>
              
              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{user?.name || 'User'}</h1>
                <p className="text-gray-300 text-base sm:text-lg">{user?.title || 'Professional'}</p>
                <div className="flex items-center justify-center sm:justify-start text-sm text-gray-400 mt-2">
                  <Calendar className="w-4 h-4 mr-2" />
                  Joined {user?.joinedDate ? new Date(user.joinedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently'}
                </div>
              </div>
            </div>

            {/* Right Section: Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg transition-colors duration-200 w-full sm:w-auto"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={cancelEdit}
                    className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 w-full sm:w-auto"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50 w-full sm:w-auto"
                  >
                    {isSaving ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>


        {/* Success/Error Messages */}
        {error && (
          <div className="opacity-0 animate-fade-in mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg flex items-center space-x-3" style={{ animationDelay: '0.15s', animationFillMode: 'forwards' }}>
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {success && (
          <div className="opacity-0 animate-fade-in mb-6 p-4 bg-green-900/20 border border-green-700 rounded-lg flex items-center space-x-3" style={{ animationDelay: '0.15s', animationFillMode: 'forwards' }}>
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
            <p className="text-green-300">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Personal Information */}
            <div className="opacity-0 animate-fade-in bg-gray-800 rounded-2xl border border-gray-700 p-8" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
              <h2 className="text-xl font-bold text-white mb-6">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.name || ''}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                    />
                  ) : (
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <span className="text-white">{user?.name || 'Not provided'}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Email</label>
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-white">{user?.email || 'Not provided'}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Phone</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editData.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                    />
                  ) : (
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <span className="text-white">{user?.phone || 'Not provided'}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Location</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.location || ''}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                    />
                  ) : (
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <span className="text-white">{user?.location || 'Not provided'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="opacity-0 animate-fade-in bg-gray-800 rounded-2xl border border-gray-700 p-8" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
              <h2 className="text-xl font-bold text-white mb-6">Professional Information</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Job Title</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.title || ''}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                    />
                  ) : (
                    <div className="flex items-center space-x-3">
                      <Briefcase className="w-5 h-5 text-gray-400" />
                      <span className="text-white">{user?.title || 'Not provided'}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Company</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.company || ''}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                    />
                  ) : (
                    <span className="text-white">{user?.company || 'Not provided'}</span>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Bio</label>
                  {isEditing ? (
                    <textarea
                      value={editData.bio || ''}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                      placeholder="Tell us about yourself..."
                    />
                  ) : (
                    <p className="text-white">{user?.bio || 'No bio provided'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Skills</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.skills?.join(', ') || ''}
                      onChange={(e) => handleSkillsChange(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                      placeholder="e.g. JavaScript, React, Node.js (comma separated)"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {user?.skills?.map((skill, index) => (
                        <span key={index} className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-lg text-sm border border-blue-500/30">
                          {skill}
                        </span>
                      )) || <span className="text-gray-400">No skills added</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="opacity-0 animate-fade-in bg-gray-800 rounded-2xl border border-gray-700 p-8" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
              <h2 className="text-xl font-bold text-white mb-6">Social Links</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">LinkedIn</label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={editData.linkedIn || ''}
                      onChange={(e) => handleInputChange('linkedIn', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  ) : (
                    <span className="text-blue-400 hover:text-blue-300 transition-colors duration-200">{user?.linkedIn || 'Not provided'}</span>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">GitHub</label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={editData.github || ''}
                      onChange={(e) => handleInputChange('github', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                      placeholder="https://github.com/yourusername"
                    />
                  ) : (
                    <span className="text-blue-400 hover:text-blue-300 transition-colors duration-200">{user?.github || 'Not provided'}</span>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Website</label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={editData.website || ''}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                      placeholder="https://yourwebsite.com"
                    />
                  ) : (
                    <span className="text-blue-400 hover:text-blue-300 transition-colors duration-200">{user?.website || 'Not provided'}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Account Stats */}
            <div className="opacity-0 animate-fade-in bg-gray-800 rounded-2xl border border-gray-700 p-8" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
              <h3 className="text-xl font-bold text-white mb-6">Account Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Documents Generated</span>
                  <span className="font-semibold text-blue-400">{user?.documentsGenerated || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Account Status</span>
                  <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-lg text-sm border border-green-500/30">Active</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Last Active</span>
                  <span className="text-sm text-gray-400">
                    {user?.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Today'}
                  </span>
                </div>
              </div>
            </div>

            {/* Education */}
            <div className="opacity-0 animate-fade-in bg-gray-800 rounded-2xl border border-gray-700 p-8" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
              <h3 className="text-xl font-bold text-white mb-6">Education</h3>
              {isEditing ? (
                <textarea
                  value={editData.education || ''}
                  onChange={(e) => handleInputChange('education', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  placeholder="Your education details..."
                />
              ) : (
                <div className="flex items-start space-x-3">
                  <GraduationCap className="w-5 h-5 text-gray-400 mt-0.5" />
                  <p className="text-white">{user?.education || 'No education details provided'}</p>
                </div>
              )}
            </div>

            {/* Experience */}
            <div className="opacity-0 animate-fade-in bg-gray-800 rounded-2xl border border-gray-700 p-8" style={{ animationDelay: '0.7s', animationFillMode: 'forwards' }}>
              <h3 className="text-xl font-bold text-white mb-6">Experience</h3>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.experience || ''}
                  onChange={(e) => handleInputChange('experience', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  placeholder="e.g. 5+ years"
                />
              ) : (
                <p className="text-white">{user?.experience || 'Not provided'}</p>
              )}
            </div>
          </div>
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