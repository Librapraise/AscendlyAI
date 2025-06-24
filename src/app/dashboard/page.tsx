"use client";

import { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Upload, 
  FileText, 
  Eye, 
  Edit, 
  Download, 
  Search, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  X, 
  WifiOff, 
  Key, 
  LogIn,
  Trash2,
  Calendar,
  TrendingUp,
  Users,
  Activity
} from 'lucide-react';

interface Document {
  id: string;
  filename?: string;
  title?: string;
  company?: string;
  content?: string;
  description?: string;
  uploadedAt?: string;
  createdAt?: string;
  size?: number;
  type?: string;
}

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  user?: any;
}

interface Stats {
  totalDocuments: number;
  recentUploads: number;
  generatedDocs: number;
  activeJobs: number;
}

export default function DashboardPage() {
  // State management
  const [documents, setDocuments] = useState<Document[]>([]);
  const [resumes, setResumes] = useState<Document[]>([]);
  const [jobDescriptions, setJobDescriptions] = useState<Document[]>([]);
  const [generatedDocs, setGeneratedDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState<Stats>({
    totalDocuments: 0,
    recentUploads: 0,
    generatedDocs: 0,
    activeJobs: 0
  });

  // Authentication state
  const [auth, setAuth] = useState<AuthState>({ token: null, isAuthenticated: false });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authForm, setAuthForm] = useState({ email: "", password: "", apiKey: "" });
  const [authMode, setAuthMode] = useState<'login' | 'apikey'>('login');

  const fileInput = useRef<HTMLInputElement>(null);
  const requestTimeout = 30000;
  const maxRetries = 3;

  // Authentication persistence
  useEffect(() => {
    const savedToken = localStorage.getItem('access_token') || localStorage.getItem('weapply_token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken) {
      setAuth({
        token: savedToken,
        isAuthenticated: true,
        user: savedUser ? JSON.parse(savedUser) : null
      });
    }
  }, []);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Authentication functions
  const login = async (email: string, password: string) => {
    try {
      const response = await fetch("https://weapply.onrender.com/api/v1/users/login", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Login failed: ${response.statusText}`);
      }

      const data = await response.json();
      const token = data.token || data.access_token || data.accessToken;
      
      if (!token) throw new Error("No authentication token received");

      localStorage.setItem('access_token', token);
      if (data.user) localStorage.setItem('user', JSON.stringify(data.user));

      setAuth({ token, isAuthenticated: true, user: data.user });
      setShowAuthModal(false);
      setSuccessMessage("Successfully logged in!");
      return true;
    } catch (error: any) {
      setError(`Login failed: ${error.message}`);
      return false;
    }
  };

  const setApiKey = (apiKey: string) => {
    if (!apiKey.trim()) {
      setError("Please enter a valid API key");
      return false;
    }

    localStorage.setItem('weapply_token', apiKey);
    setAuth({ token: apiKey, isAuthenticated: true, user: { type: 'api_key' } });
    setShowAuthModal(false);
    setSuccessMessage("API key set successfully!");
    return true;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('weapply_token');
    localStorage.removeItem('user');
    setAuth({ token: null, isAuthenticated: false });
    setDocuments([]);
    setResumes([]);
    setJobDescriptions([]);
    setGeneratedDocs([]);
    setSuccessMessage("Logged out successfully");
  };

  // Enhanced API request with authentication
  const apiRequest = async (url: string, options: RequestInit = {}, retries = 0): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), requestTimeout);

    try {
      const headers: Record<string, string> = {
        ...(options.headers as Record<string, string>),
      };

      if (auth.token) {
        if (auth.token.startsWith('Bearer ')) {
          headers['Authorization'] = auth.token;
        } else {
          headers['Authorization'] = `Bearer ${auth.token}`;
          headers['X-API-Key'] = auth.token;
        }
      }

      if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers,
      });

      clearTimeout(timeoutId);

      if (response.status === 401) {
        setAuth({ token: null, isAuthenticated: false });
        localStorage.removeItem('access_token');
        localStorage.removeItem('weapply_token');
        localStorage.removeItem('user');
        setError("Authentication failed. Please log in again.");
        setShowAuthModal(true);
        throw new Error("Authentication required");
      }

      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (retries < maxRetries && (error.name === 'AbortError' || error.name === 'TypeError')) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1)));
        return apiRequest(url, options, retries + 1);
      }
      
      throw error;
    }
  };

  // Data loading with comprehensive error handling
  const loadData = async () => {
    if (!isOnline) {
      setError("You're offline. Please check your internet connection.");
      return;
    }

    if (!auth.isAuthenticated) {
      setError("Please log in to access your documents.");
      setShowAuthModal(true);
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const endpoints = [
        { url: "https://weapply.onrender.com/api/v1/documents/resumes/", key: "resumes" },
        { url: "https://weapply.onrender.com/api/v1/documents/job-descriptions/", key: "jobDescriptions" },
        { url: "https://weapply.onrender.com/api/v1/documents/generated/", key: "generatedDocs" }
      ];

      const results = await Promise.allSettled(
        endpoints.map(async (endpoint) => {
          try {
            const response = await apiRequest(endpoint.url);
            if (!response.ok) {
              if (response.status === 404) return [];
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            return Array.isArray(data) ? data : (data.data || data.documents || []);
          } catch (error: any) {
            if (error.message.includes("Authentication required")) throw error;
            throw new Error(`Failed to load ${endpoint.key}: ${error.message}`);
          }
        })
      );

      const [resumesResult, jobDescResult, generatedResult] = results;
      
      const resumesData = resumesResult.status === 'fulfilled' ? resumesResult.value : [];
      const jobDescData = jobDescResult.status === 'fulfilled' ? jobDescResult.value : [];
      const generatedData = generatedResult.status === 'fulfilled' ? generatedResult.value : [];

      setResumes(resumesData);
      setJobDescriptions(jobDescData);
      setGeneratedDocs(generatedData);

      // Combine all documents for recent documents view
      const allDocs = [...resumesData, ...jobDescData, ...generatedData]
        .sort((a, b) => new Date(b.createdAt || b.uploadedAt || 0).getTime() - new Date(a.createdAt || a.uploadedAt || 0).getTime())
        .slice(0, 6);
      
      setDocuments(allDocs);

      // Calculate stats
      const now = new Date();
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const recentUploads = allDocs.filter(doc => 
        new Date(doc.createdAt || doc.uploadedAt || 0) > last7Days
      ).length;

      setStats({
        totalDocuments: allDocs.length,
        recentUploads,
        generatedDocs: generatedData.length,
        activeJobs: jobDescData.length
      });

      // Show warnings for failed requests
      const failedRequests = results
        .map((result, index) => ({ result, name: endpoints[index].key }))
        .filter(({ result }) => result.status === 'rejected')
        .map(({ name }) => name);

      if (failedRequests.length > 0) {
        setError(`Warning: Could not load ${failedRequests.join(', ')}. Some features may not work properly.`);
      } else {
        setSuccessMessage("Dashboard loaded successfully!");
      }

    } catch (err: any) {
      if (err.message.includes("Authentication required")) return;
      setError("Failed to load dashboard data. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth.isAuthenticated) {
      loadData();
    }
  }, [auth.isAuthenticated, isOnline]);

  // File upload with progress tracking
  const uploadFiles = async (files: FileList) => {
    if (!files.length) return;
    
    if (!isOnline) {
      setError("You're offline. Please check your internet connection.");
      return;
    }

    if (!auth.isAuthenticated) {
      setError("Please log in to upload files.");
      setShowAuthModal(true);
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");
    
    try {
      const uploadResults = [];
      
      // Validate all files first
      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File too large: ${file.name}. Maximum size is 10MB.`);
        }

        const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
        const validExtensions = ['.pdf', '.doc', '.docx', '.txt'];
        const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
        
        if (!validTypes.includes(file.type) && !hasValidExtension) {
          throw new Error(`Invalid file type: ${file.name}. Please upload PDF, DOC, DOCX, or TXT files.`);
        }
      }

      // Upload files sequentially
      for (const file of Array.from(files)) {
        try {
          setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
          
          const formData = new FormData();
          formData.append("file", file);
          
          const response = await apiRequest("https://weapply.onrender.com/api/v1/documents/resumes/", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `Failed to upload ${file.name}`;
            
            try {
              const errorData = JSON.parse(errorText);
              errorMessage += `: ${errorData.message || errorData.error || response.statusText}`;
            } catch {
              errorMessage += `: ${response.statusText}`;
            }
            
            throw new Error(errorMessage);
          }

          const result = await response.json();
          uploadResults.push({ file: file.name, success: true, data: result });
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
          
        } catch (error: any) {
          uploadResults.push({ file: file.name, success: false, error: error.message });
          setUploadProgress(prev => ({ ...prev, [file.name]: -1 }));
        }
      }

      // Process results
      const successful = uploadResults.filter(r => r.success);
      const failed = uploadResults.filter(r => !r.success);

      if (successful.length > 0) {
        setSuccessMessage(`Successfully uploaded ${successful.length} file${successful.length > 1 ? 's' : ''}`);
        await loadData();
      }

      if (failed.length > 0) {
        const errorDetails = failed.map(f => `• ${f.file}: ${f.error}`).join('\n');
        setError(`Failed to upload ${failed.length} file${failed.length > 1 ? 's' : ''}:\n${errorDetails}`);
      }

    } catch (err: any) {
      setError(err.message || "Failed to upload files. Please try again.");
    } finally {
      setLoading(false);
      setTimeout(() => setUploadProgress({}), 3000);
    }
  };

  // Navigation handlers
  const handleNavigation = (route: string) => {
    window.location.href = route;
  };

  const handleDocumentEdit = (id: string) => {
    window.location.href = `/documents?view=${id}`;
  };

  const handleDocumentDownload = async (id: string) => {
    if (!auth.isAuthenticated) {
      setError("Please log in to download documents.");
      return;
    }

    try {
      const response = await apiRequest(`https://weapply.onrender.com/api/v1/documents/generated/${id}/download`);
      if (!response.ok) throw new Error(`Download failed: ${response.statusText}`);
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `document-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSuccessMessage("Document downloaded successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to download document.");
    }
  };

  const handleDocumentDelete = async (id: string) => {
    if (!auth.isAuthenticated) {
      setError("Please log in to delete documents.");
      return;
    }

    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const response = await apiRequest(`https://weapply.onrender.com/api/v1/documents/${id}`, {
        method: "DELETE"
      });
      
      if (!response.ok) throw new Error(`Delete failed: ${response.statusText}`);
      
      setSuccessMessage("Document deleted successfully!");
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to delete document.");
    }
  };

  const dismissMessage = (type: 'error' | 'success') => {
    if (type === 'error') setError("");
    if (type === 'success') setSuccessMessage("");
  };

  const filteredDocuments = documents.filter(doc =>
    Object.values(doc).some(value =>
      String(value || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 md:p-8">
      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Authentication Required</h2>
            
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-2 px-4 rounded ${authMode === 'login' ? 'bg-blue-600' : 'bg-gray-700'}`}
              >
                Login
              </button>
              <button
                onClick={() => setAuthMode('apikey')}
                className={`flex-1 py-2 px-4 rounded ${authMode === 'apikey' ? 'bg-blue-600' : 'bg-gray-700'}`}
              >
                API Key
              </button>
            </div>

            {authMode === 'login' ? (
              <div className="space-y-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                  className="w-full bg-gray-700 p-3 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                  className="w-full bg-gray-700 p-3 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
                <button
                  onClick={() => login(authForm.email, authForm.password)}
                  disabled={loading || !authForm.email || !authForm.password}
                  className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Logging in..." : "Login"}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <input
                  type="password"
                  placeholder="Enter your API Key"
                  value={authForm.apiKey}
                  onChange={(e) => setAuthForm({...authForm, apiKey: e.target.value})}
                  className="w-full bg-gray-700 p-3 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
                <p className="text-sm text-gray-400">
                  Enter your WeApply API key or JWT token to access the API
                </p>
                <button
                  onClick={() => setApiKey(authForm.apiKey)}
                  disabled={!authForm.apiKey}
                  className="w-full bg-green-600 hover:bg-green-700 py-3 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Set API Key
                </button>
              </div>
            )}

            <button
              onClick={() => setShowAuthModal(false)}
              className="w-full mt-4 bg-gray-600 hover:bg-gray-700 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-400 mt-2">Welcome to your document management center</p>
        </div>
        
        {/* Network Status & Auth */}
        <div className="flex items-center gap-3">
          {!isOnline && (
            <div className="flex items-center gap-2 text-red-400">
              <WifiOff size={20} />
              <span className="text-sm">Offline</span>
            </div>
          )}
          
          {auth.isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-green-400">●</span>
              <span className="text-sm text-gray-300">Authenticated</span>
              <button 
                onClick={logout}
                className="text-gray-400 hover:text-white transition-colors p-1"
                title="Logout"
              >
                <LogIn size={16} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800"
              title="Login"
            >
              <Key size={20} />
              <span className="text-sm">Login</span>
            </button>
          )}
          
          <button 
            onClick={loadData} 
            disabled={loading}
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800"
            title="Refresh data"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 bg-green-900/50 border border-green-700 p-4 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle size={20} className="text-green-400" />
            <span>{successMessage}</span>
          </div>
          <button 
            onClick={() => dismissMessage('success')}
            className="text-green-400 hover:text-green-300"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-900/50 border border-red-700 p-4 rounded-lg flex items-start justify-between">
          <div className="flex items-start gap-2">
            <AlertCircle size={20} className="text-red-400 mt-0.5 flex-shrink-0" />
            <span className="whitespace-pre-line">{error}</span>
          </div>
          <button 
            onClick={() => dismissMessage('error')}
            className="text-red-400 hover:text-red-300 ml-2 flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Documents</p>
              <p className="text-2xl font-bold text-white">{stats.totalDocuments}</p>
            </div>
            <FileText className="text-blue-200" size={32} />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-600 to-green-800 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Recent Uploads</p>
              <p className="text-2xl font-bold text-white">{stats.recentUploads}</p>
            </div>
            <TrendingUp className="text-green-200" size={32} />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Generated Docs</p>
              <p className="text-2xl font-bold text-white">{stats.generatedDocs}</p>
            </div>
            <Activity className="text-purple-200" size={32} />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-600 to-orange-800 p-6 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Active Jobs</p>
              <p className="text-2xl font-bold text-white">{stats.activeJobs}</p>
            </div>
            <Users className="text-orange-200" size={32} />
          </div>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="bg-gray-800 rounded-xl p-8 mb-8 border border-gray-700">
        <h2 className="text-xl font-bold mb-4">Quick Upload</h2>
        <div
          onClick={() => fileInput.current?.click()}
          className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
        >
          <Upload size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-lg mb-2">Drop files here or click to browse</p>
          <p className="text-sm text-gray-400">
            Supports PDF, DOC, DOCX, and TXT files (max 10MB each)
          </p>
        </div>
        
        <input
          ref={fileInput}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
          className="hidden"
        />

        {/* Upload Progress */}
        {Object.keys(uploadProgress).length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Upload Progress</h3>
            {Object.entries(uploadProgress).map(([filename, progress]) => (
              <div key={filename} className="mb-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm truncate">{filename}</span>
                  <span className="text-sm">
                    {progress === -1 ? "Failed" : progress === 100 ? "Complete" : `${progress}%`}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      progress === -1 ? "bg-red-500" : progress === 100 ? "bg-green-500" : "bg-blue-500"
                    }`}
                    style={{ width: `${Math.max(0, progress)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <button
            onClick={() => handleNavigation('/documents')}
            className="bg-gray-800 hover:bg-gray-700 p-6 rounded-xl transition-all duration-300 hover:scale-105 border border-gray-700 hover:border-blue-500"
          >
            <FileText size={32} className="text-blue-400 mb-3" />
            <h3 className="font-semibold mb-2">Manage Documents</h3>
            <p className="text-sm text-gray-400">View and organize all your documents</p>
          </button>
          
          <button
            onClick={() => handleNavigation('/generate')}
            className="bg-gray-800 hover:bg-gray-700 p-6 rounded-xl transition-all duration-300 hover:scale-105 border border-gray-700 hover:border-purple-500"
          >
            <Activity size={32} className="text-purple-400 mb-3" />
            <h3 className="font-semibold mb-2">Generate Resume</h3>
            <p className="text-sm text-gray-400">Create tailored resumes and cover letters</p>
          </button>
          
          <button
            onClick={() => handleNavigation('/jobs')}
            className="bg-gray-800 hover:bg-gray-700 p-6 rounded-xl transition-all duration-300 hover:scale-105 border border-gray-700 hover:border-green-500"
          >
            <Users size={32} className="text-green-400 mb-3" />
            <h3 className="font-semibold mb-2">Job Descriptions</h3>
            <p className="text-sm text-gray-400">Manage your job opportunities</p>
          </button>
          
          <button
            onClick={() => handleNavigation('/analytics')}
            className="bg-gray-800 hover:bg-gray-700 p-6 rounded-xl transition-all duration-300 hover:scale-105 border border-gray-700 hover:border-orange-500"
          >
            <TrendingUp size={32} className="text-orange-400 mb-3" />
            <h3 className="font-semibold mb-2">Analytics</h3>
            <p className="text-sm text-gray-400">View your application insights</p>
          </button>
        </div>
      </div>

      {/* Recent Documents */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Recent Documents</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none text-white placeholder-gray-400"
              />
            </div>
            <button
              onClick={() => handleNavigation('/documents')}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium"
            >
              View All
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw size={32} className="animate-spin text-gray-400" />
            <span className="ml-3 text-gray-400">Loading documents...</span>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-gray-400 mb-2">
              {searchTerm ? "No documents match your search" : "No documents found"}
            </p>
            <p className="text-sm text-gray-500">
              {searchTerm ? "Try adjusting your search terms" : "Upload some documents to get started"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 font-medium text-gray-300">Document</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-300">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-300">Company</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-300">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-300">Size</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <FileText size={20} className="text-blue-400" />
                        <div>
                          <p className="font-medium text-white truncate max-w-[200px]">
                            {doc.title || doc.filename || 'Untitled Document'}
                          </p>
                          {doc.description && (
                            <p className="text-sm text-gray-400 truncate max-w-[200px]">
                              {doc.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        doc.type === 'resume' ? 'bg-blue-900 text-blue-200' :
                        doc.type === 'job_description' ? 'bg-green-900 text-green-200' :
                        doc.type === 'cover_letter' ? 'bg-purple-900 text-purple-200' :
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {doc.type ? doc.type.replace('_', ' ').toUpperCase() : 'DOCUMENT'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-300">
                        {doc.company || '-'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1 text-gray-400">
                        <Calendar size={14} />
                        <span className="text-sm">
                          {doc.createdAt || doc.uploadedAt ? 
                            new Date(doc.createdAt || doc.uploadedAt!).toLocaleDateString() : 
                            'Unknown'
                          }
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-400">
                        {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : '-'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDocumentEdit(doc.id)}
                          className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-gray-600/50"
                          title="View document"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleDocumentEdit(doc.id)}
                          className="text-green-400 hover:text-green-300 p-1 rounded hover:bg-gray-600/50"
                          title="Edit document"
                        >
                          <Edit size={16} />
                        </button>
                        {doc.type === 'generated' && (
                          <button
                            onClick={() => handleDocumentDownload(doc.id)}
                            className="text-purple-400 hover:text-purple-300 p-1 rounded hover:bg-gray-600/50"
                            title="Download document"
                          >
                            <Download size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDocumentDelete(doc.id)}
                          className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-gray-600/50"
                          title="Delete document"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Document Categories */}
      {auth.isAuthenticated && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Resumes */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-400">Resumes</h3>
              <span className="bg-blue-900 text-blue-200 px-2 py-1 rounded-full text-xs">
                {resumes.length}
              </span>
            </div>
            <div className="space-y-3">
              {resumes.slice(0, 3).map((resume) => (
                <div key={resume.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-blue-400" />
                    <span className="text-sm truncate max-w-[150px]">
                      {resume.title || resume.filename || 'Untitled Resume'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDocumentEdit(resume.id)}
                    className="text-gray-400 hover:text-white"
                  >
                    <Eye size={14} />
                  </button>
                </div>
              ))}
              {resumes.length === 0 && (
                <p className="text-gray-400 text-sm py-4 text-center">No resumes uploaded yet</p>
              )}
              {resumes.length > 3 && (
                <button
                  onClick={() => handleNavigation('/documents?filter=resumes')}
                  className="w-full text-blue-400 hover:text-blue-300 text-sm py-2"
                >
                  View all {resumes.length} resumes
                </button>
              )}
            </div>
          </div>

          {/* Job Descriptions */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-green-400">Job Descriptions</h3>
              <span className="bg-green-900 text-green-200 px-2 py-1 rounded-full text-xs">
                {jobDescriptions.length}
              </span>
            </div>
            <div className="space-y-3">
              {jobDescriptions.slice(0, 3).map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-green-400" />
                    <div>
                      <p className="text-sm truncate max-w-[120px]">
                        {job.title || 'Untitled Job'}
                      </p>
                      {job.company && (
                        <p className="text-xs text-gray-400 truncate max-w-[120px]">
                          {job.company}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDocumentEdit(job.id)}
                    className="text-gray-400 hover:text-white"
                  >
                    <Eye size={14} />
                  </button>
                </div>
              ))}
              {jobDescriptions.length === 0 && (
                <p className="text-gray-400 text-sm py-4 text-center">No job descriptions yet</p>
              )}
              {jobDescriptions.length > 3 && (
                <button
                  onClick={() => handleNavigation('/documents?filter=jobs')}
                  className="w-full text-green-400 hover:text-green-300 text-sm py-2"
                >
                  View all {jobDescriptions.length} jobs
                </button>
              )}
            </div>
          </div>

          {/* Generated Documents */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-purple-400">Generated Documents</h3>
              <span className="bg-purple-900 text-purple-200 px-2 py-1 rounded-full text-xs">
                {generatedDocs.length}
              </span>
            </div>
            <div className="space-y-3">
              {generatedDocs.slice(0, 3).map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Activity size={16} className="text-purple-400" />
                    <div>
                      <p className="text-sm truncate max-w-[120px]">
                        {doc.title || 'Generated Document'}
                      </p>
                      {doc.type && (
                        <p className="text-xs text-gray-400">
                          {doc.type.toUpperCase()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDocumentDownload(doc.id)}
                      className="text-gray-400 hover:text-white"
                      title="Download"
                    >
                      <Download size={14} />
                    </button>
                    <button
                      onClick={() => handleDocumentEdit(doc.id)}
                      className="text-gray-400 hover:text-white"
                      title="View"
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {generatedDocs.length === 0 && (
                <p className="text-gray-400 text-sm py-4 text-center">No generated documents yet</p>
              )}
              {generatedDocs.length > 3 && (
                <button
                  onClick={() => handleNavigation('/documents?filter=generated')}
                  className="w-full text-purple-400 hover:text-purple-300 text-sm py-2"
                >
                  View all {generatedDocs.length} documents
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-gray-700">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <p>© 2024 WeApply Dashboard. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Version 1.0.0</span>
            {/*
            <span>•</span>
             Footer Links
            <button
              onClick={() => handleNavigation('/help')}
              className="hover:text-white transition-colors"
            >
              Help & Support
            </button>
            */}
          </div>
        </div>
      </div>
    </div>
  );
}