"use client";

import { useState, useEffect, useRef } from "react";
import {
  Upload,
  FileText,
  Eye,
  Edit,
  Download,
  Plus,
  Search,
  Filter,
  X,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  WifiOff,
  Key,
  LogIn,
} from "lucide-react";

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

interface ApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  user?: any;
}

export default function DocumentManagementPage() {
  const [activeTab, setActiveTab] = useState("upload");
  const [resumes, setResumes] = useState<Document[]>([]);
  const [jobDescriptions, setJobDescriptions] = useState<Document[]>([]);
  const [generatedDocs, setGeneratedDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [showJobForm, setShowJobForm] = useState(false);
  const [jobForm, setJobForm] = useState({ title: "", company: "", description: "" });
  const [uploadedFilePreviews, setUploadedFilePreviews] = useState<{[key: string]: string}>({});
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [isOnline, setIsOnline] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [successMessage, setSuccessMessage] = useState("");
  
  // Authentication state
  const [auth, setAuth] = useState<AuthState>({ token: null, isAuthenticated: false });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authForm, setAuthForm] = useState({ email: "", password: "", apiKey: "" });
  const [authMode, setAuthMode] = useState<'login' | 'apikey'>('login');

  const fileInput = useRef<HTMLInputElement>(null);
  const maxRetries = 3;
  const requestTimeout = 30000; // 30 seconds

  // Authentication persistence
  useEffect(() => {
    const savedToken = localStorage.getItem('access_token');
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Login failed: ${response.statusText}`);
      }

      const data = await response.json();
      const token = data.token || data.access_token || data.accessToken;
      
      if (!token) {
        throw new Error("No authentication token received");
      }

      // Save auth data
      localStorage.setItem('access_token', token);
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      setAuth({
        token,
        isAuthenticated: true,
        user: data.user
      });

      setShowAuthModal(false);
      setSuccessMessage("Successfully logged in!");
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      setError(`Login failed: ${error.message}`);
      return false;
    }
  };

  const setApiKey = (apiKey: string) => {
    if (!apiKey.trim()) {
      setError("Please enter a valid API key");
      return false;
    }

    // Save API key as token
    localStorage.setItem('weapply_token', apiKey);
    
    setAuth({
      token: apiKey,
      isAuthenticated: true,
      user: { type: 'api_key' }
    });

    setShowAuthModal(false);
    setSuccessMessage("API key set successfully!");
    return true;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setAuth({ token: null, isAuthenticated: false });
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
      // Prepare headers with authentication
      const headers: Record<string, string> = {
        ...(options.headers as Record<string, string>),
      };

      // Add authentication header
      if (auth.token) {
        // Try different authentication methods
        if (auth.token.startsWith('Bearer ')) {
          headers['Authorization'] = auth.token;
        } else if (auth.token.includes('.')) {
          // Looks like a JWT token
          headers['Authorization'] = `Bearer ${auth.token}`;
        } else {
          // Could be an API key
          headers['Authorization'] = `Bearer ${auth.token}`;
          headers['X-API-Key'] = auth.token;
        }
      }

      // Only add Content-Type for non-FormData requests
      if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers,
      });

      clearTimeout(timeoutId);

      // Handle authentication errors
      if (response.status === 401) {
        setAuth({ token: null, isAuthenticated: false });
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        setError("Authentication failed. Please log in again.");
        setShowAuthModal(true);
        throw new Error("Authentication required");
      }

      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (retries < maxRetries && (error.name === 'AbortError' || error.name === 'TypeError')) {
        console.log(`Retrying request to ${url} (attempt ${retries + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1))); // Exponential backoff
        return apiRequest(url, options, retries + 1);
      }
      
      throw error;
    }
  };

  // File preview function with better error handling
  const generateFilePreview = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const result = e.target?.result as string;
          
          if (file.type === 'text/plain') {
            resolve(result);
          } else if (file.type === 'application/pdf') {
            resolve(`PDF Document: ${file.name}\nSize: ${(file.size / 1024).toFixed(2)} KB\nUploaded: ${new Date().toLocaleString()}\n\nNote: PDF content will be extracted on the server.`);
          } else if (file.type.includes('word') || file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
            resolve(`Word Document: ${file.name}\nSize: ${(file.size / 1024).toFixed(2)} KB\nUploaded: ${new Date().toLocaleString()}\n\nNote: Document content will be extracted on the server.`);
          } else {
            resolve(`File: ${file.name}\nType: ${file.type || 'Unknown'}\nSize: ${(file.size / 1024).toFixed(2)} KB\nUploaded: ${new Date().toLocaleString()}`);
          }
        } catch (error) {
          reject(new Error(`Failed to process file: ${file.name}`));
        }
      };
      
      reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
      reader.onabort = () => reject(new Error(`File reading was aborted: ${file.name}`));
      
      try {
        if (file.type === 'text/plain' && file.size < 1024 * 1024) { // Only read small text files
          reader.readAsText(file);
        } else {
          // For binary files or large files, just show metadata
          const metadata = `File: ${file.name}\nType: ${file.type || 'Unknown'}\nSize: ${(file.size / 1024).toFixed(2)} KB\nUploaded: ${new Date().toLocaleString()}`;
          resolve(metadata);
        }
      } catch (error) {
        reject(new Error(`Failed to process file: ${file.name}`));
      }
    });
  };

  // Enhanced data loading with better error handling
  async function loadData() {
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
    setRetryCount(0);
    
    try {
      const endpoints = [
        { url: "https://weapply.onrender.com/api/v1/documents/resumes/", name: "resumes" },
        { url: "https://weapply.onrender.com/api/v1/documents/job-descriptions/", name: "job descriptions" },
        { url: "https://weapply.onrender.com/api/v1/documents/generated/", name: "generated documents" }
      ];

      const results = await Promise.allSettled(
        endpoints.map(async (endpoint) => {
          try {
            const response = await apiRequest(endpoint.url);
            if (!response.ok) {
              if (response.status === 404) {
                console.warn(`Endpoint not found: ${endpoint.url}`);
                return [];
              }
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            return Array.isArray(data) ? data : (data.data || data.documents || []);
          } catch (error: any) {
            console.error(`Failed to fetch ${endpoint.name}:`, error);
            if (error.message.includes("Authentication required")) {
              throw error; // Re-throw auth errors
            }
            throw new Error(`Failed to load ${endpoint.name}: ${error.message}`);
          }
        })
      );

      // Process results
      const [resumesResult, jobDescResult, generatedResult] = results;
      
      setResumes(resumesResult.status === 'fulfilled' ? resumesResult.value : []);
      setJobDescriptions(jobDescResult.status === 'fulfilled' ? jobDescResult.value : []);
      setGeneratedDocs(generatedResult.status === 'fulfilled' ? generatedResult.value : []);

      // Show warnings for failed requests
      const failedRequests = results
        .map((result, index) => ({ result, name: endpoints[index].name }))
        .filter(({ result }) => result.status === 'rejected')
        .map(({ name }) => name);

      if (failedRequests.length > 0) {
        setError(`Warning: Could not load ${failedRequests.join(', ')}. Some features may not work properly.`);
      } else {
        setSuccessMessage("Documents loaded successfully!");
      }

    } catch (err: any) {
      console.error('Load data error:', err);
      if (err.message.includes("Authentication required")) {
        return; // Auth modal is already shown
      }
      setError("Failed to load documents. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (auth.isAuthenticated) {
      loadData();
    }
  }, [isOnline, auth.isAuthenticated]);

  // Enhanced file upload with progress tracking
  async function uploadFiles(files: FileList) {
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
      const previewPromises = [];
      const newPreviews: {[key: string]: string} = {};
      
      // Validate all files first
      for (const file of Array.from(files)) {
        // File size validation (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File too large: ${file.name}. Maximum size is 10MB.`);
        }

        // File type validation
        const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
        const validExtensions = ['.pdf', '.doc', '.docx', '.txt'];
        const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
        
        if (!validTypes.includes(file.type) && !hasValidExtension) {
          throw new Error(`Invalid file type: ${file.name}. Please upload PDF, DOC, DOCX, or TXT files.`);
        }

        // Generate preview
        try {
          const preview = await generateFilePreview(file);
          newPreviews[file.name] = preview;
        } catch (previewError) {
          console.warn(`Failed to generate preview for ${file.name}:`, previewError);
          newPreviews[file.name] = `File: ${file.name}\nPreview not available`;
        }
      }

      // Update previews
      setUploadedFilePreviews(prev => ({ ...prev, ...newPreviews }));

      // Upload files sequentially to avoid overwhelming the server
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
          console.error(`Upload failed for ${file.name}:`, error);
          uploadResults.push({ file: file.name, success: false, error: error.message });
          setUploadProgress(prev => ({ ...prev, [file.name]: -1 }));
        }
      }

      // Process results
      const successful = uploadResults.filter(r => r.success);
      const failed = uploadResults.filter(r => !r.success);

      if (successful.length > 0) {
        setSuccessMessage(`Successfully uploaded ${successful.length} file${successful.length > 1 ? 's' : ''}`);
        await loadData(); // Reload data to show new uploads
      }

      if (failed.length > 0) {
        const errorDetails = failed.map(f => `• ${f.file}: ${f.error}`).join('\n');
        setError(`Failed to upload ${failed.length} file${failed.length > 1 ? 's' : ''}:\n${errorDetails}`);
      }

    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || "Failed to upload files. Please try again.");
    } finally {
      setLoading(false);
      // Clear progress after a delay
      setTimeout(() => setUploadProgress({}), 3000);
    }
  }

  // Enhanced job description creation
  async function createJobDesc() {
    const { title, company, description } = jobForm;
    if (!title?.trim() || !company?.trim() || !description?.trim()) {
      setError("Please fill in all job description fields.");
      return;
    }

    if (!isOnline) {
      setError("You're offline. Please check your internet connection.");
      return;
    }

    if (!auth.isAuthenticated) {
      setError("Please log in to create job descriptions.");
      setShowAuthModal(true);
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccessMessage("");
    
    try {
      const response = await apiRequest("https://weapply.onrender.com/api/v1/documents/job-descriptions/", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          company: company.trim(),
          description: description.trim()
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Failed to create job description";
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage += `: ${errorData.message || errorData.error || response.statusText}`;
        } catch {
          errorMessage += `: ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }
      
      setShowJobForm(false);
      setJobForm({ title: "", company: "", description: "" });
      setSuccessMessage("Job description created successfully!");
      await loadData();
      
    } catch (err: any) {
      console.error('Create job description error:', err);
      setError(err.message || "Failed to create job description.");
    } finally {
      setLoading(false);
    }
  }

  // Enhanced download function
  async function downloadDoc(id: string, type: 'resume' | 'generated' = 'generated') {
    if (!isOnline) {
      setError("You're offline. Please check your internet connection.");
      return;
    }

    if (!auth.isAuthenticated) {
      setError("Please log in to download documents.");
      setShowAuthModal(true);
      return;
    }

    try {
      setError("");
      const endpoint = type === 'resume' 
        ? `https://weapply.onrender.com/api/v1/documents/resumes/${id}/download`
        : `https://weapply.onrender.com/api/v1/documents/generated/${id}/download`;
        
      const response = await apiRequest(endpoint);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }
      
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
      console.error('Download error:', err);
      setError(err.message || "Failed to download document.");
    }
  }

  // Enhanced save edit function
  async function saveEdit() {
    if (!selectedDocument) return;
    
    if (!isOnline) {
      setError("You're offline. Please check your internet connection.");
      return;
    }

    if (!auth.isAuthenticated) {
      setError("Please log in to save changes.");
      setShowAuthModal(true);
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");
    
    try {
      const response = await apiRequest(`https://weapply.onrender.com/api/v1/documents/generated/${selectedDocument.id}/content`, {
        method: "PATCH",
        body: JSON.stringify({ content: editContent }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Failed to save changes";
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage += `: ${errorData.message || errorData.error || response.statusText}`;
        } catch {
          errorMessage += `: ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }
      
      setIsEditing(false);
      setSuccessMessage("Document saved successfully!");
      await loadData();
      
      // Update selected document
      setSelectedDocument(prev => prev ? { ...prev, content: editContent } : null);
    } catch (err: any) {
      console.error('Save edit error:', err);
      setError(err.message || "Failed to save changes.");
    } finally {
      setLoading(false);
    }
  }

  const filtered = (arr: Document[]) =>
    arr.filter((d) =>
      Object.values(d).some((v: any) =>
        String(v || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

  const handleDocumentSelect = (doc: Document) => {
    setSelectedDocument(doc);
    setEditContent(doc.content || doc.description || "");
    setActiveTab("viewer");
  };

  const getDocumentContent = (doc: Document) => {
    if (doc.content) return doc.content;
    if (doc.description) return doc.description;
    if (doc.filename && uploadedFilePreviews[doc.filename]) return uploadedFilePreviews[doc.filename];
    return "No content available. Content extraction may require server-side processing for this file type.";
  };

  const dismissMessage = (type: 'error' | 'success') => {
    if (type === 'error') setError("");
    if (type === 'success') setSuccessMessage("");
  };

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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button onClick={() => window.history.back()} className="text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold">Document Management</h1>
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

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-800 pl-10 pr-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-700">
        {["upload", "resumes", "jobs", "generated", "viewer"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-t-lg transition-colors ${
              activeTab === tab
                ? "bg-blue-600 text-white border-b-2 border-blue-400"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            {tab === "upload" && "Upload Files"}
            {tab === "resumes" && `Resumes (${resumes.length})`}
            {tab === "jobs" && `Job Descriptions (${jobDescriptions.length})`}
            {tab === "generated" && `Generated Docs (${generatedDocs.length})`}
            {tab === "viewer" && "Document Viewer"}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-gray-800 rounded-lg p-6">
        {/* Upload Tab */}
        {activeTab === "upload" && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Upload size={24} />
              Upload Documents
            </h2>
            
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

            {/* File Previews */}
            {Object.keys(uploadedFilePreviews).length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">File Previews</h3>
                <div className="grid gap-4">
                  {Object.entries(uploadedFilePreviews).map(([filename, preview]) => (
                    <div key={filename} className="bg-gray-700 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">{filename}</h4>
                      <pre className="text-sm text-gray-300 whitespace-pre-wrap overflow-auto max-h-32">
                        {preview}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Resumes Tab */}
        {activeTab === "resumes" && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText size={24} />
              Resumes ({filtered(resumes).length})
            </h2>
            
            {loading && (
              <div className="text-center py-8">
                <RefreshCw size={32} className="animate-spin mx-auto mb-2 text-blue-400" />
                <p className="text-gray-400">Loading resumes...</p>
              </div>
            )}
            
            {!loading && filtered(resumes).length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <FileText size={48} className="mx-auto mb-4 opacity-50" />
                <p>No resumes found.</p>
                <p className="text-sm mt-2">Upload some resumes to get started!</p>
              </div>
            )}
            
            <div className="grid gap-4">
              {filtered(resumes).map((resume) => (
                <div key={resume.id} className="bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{resume.filename || resume.title || "Untitled"}</h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {resume.uploadedAt || resume.createdAt 
                          ? `Uploaded: ${new Date(resume.uploadedAt || resume.createdAt!).toLocaleDateString()}`
                          : "Date unknown"
                        }
                        {resume.size && ` • ${(resume.size / 1024).toFixed(2)} KB`}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleDocumentSelect(resume)}
                        className="p-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                        title="View"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => downloadDoc(resume.id, 'resume')}
                        className="p-2 bg-green-600 hover:bg-green-700 rounded transition-colors"
                        title="Download"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Job Descriptions Tab */}
        {activeTab === "jobs" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FileText size={24} />
                Job Descriptions ({filtered(jobDescriptions).length})
              </h2>
              <button
                onClick={() => setShowJobForm(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition-colors"
              >
                <Plus size={16} />
                Add Job Description
              </button>
            </div>

            {/* Job Form Modal */}
            {showJobForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <h3 className="text-xl font-bold mb-4">Create Job Description</h3>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Job Title"
                      value={jobForm.title}
                      onChange={(e) => setJobForm({...jobForm, title: e.target.value})}
                      className="w-full bg-gray-700 p-3 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Company Name"
                      value={jobForm.company}
                      onChange={(e) => setJobForm({...jobForm, company: e.target.value})}
                      className="w-full bg-gray-700 p-3 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                    />
                    <textarea
                      placeholder="Job Description"
                      value={jobForm.description}
                      onChange={(e) => setJobForm({...jobForm, description: e.target.value})}
                      rows={8}
                      className="w-full bg-gray-700 p-3 rounded border border-gray-600 focus:border-blue-500 focus:outline-none resize-vertical"
                    />
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={createJobDesc}
                      disabled={loading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 py-3 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "Creating..." : "Create Job Description"}
                    </button>
                    <button
                      onClick={() => setShowJobForm(false)}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 py-3 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {loading && (
              <div className="text-center py-8">
                <RefreshCw size={32} className="animate-spin mx-auto mb-2 text-blue-400" />
                <p className="text-gray-400">Loading job descriptions...</p>
              </div>
            )}
            
            {!loading && filtered(jobDescriptions).length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <FileText size={48} className="mx-auto mb-4 opacity-50" />
                <p>No job descriptions found.</p>
                <p className="text-sm mt-2">Create your first job description!</p>
              </div>
            )}
            
            <div className="grid gap-4">
              {filtered(jobDescriptions).map((job) => (
                <div key={job.id} className="bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{job.title}</h3>
                      <p className="text-blue-400 text-sm">{job.company}</p>
                      <p className="text-sm text-gray-400 mt-2 line-clamp-3">
                        {job.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {job.createdAt ? `Created: ${new Date(job.createdAt).toLocaleDateString()}` : ""}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleDocumentSelect(job)}
                        className="p-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                        title="View"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generated Documents Tab */}
        {activeTab === "generated" && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText size={24} />
              Generated Documents ({filtered(generatedDocs).length})
            </h2>
            
            {loading && (
              <div className="text-center py-8">
                <RefreshCw size={32} className="animate-spin mx-auto mb-2 text-blue-400" />
                <p className="text-gray-400">Loading generated documents...</p>
              </div>
            )}
            
            {!loading && filtered(generatedDocs).length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <FileText size={48} className="mx-auto mb-4 opacity-50" />
                <p>No generated documents found.</p>
                <p className="text-sm mt-2">Generated documents will appear here!</p>
              </div>
            )}
            
            <div className="grid gap-4">
              {filtered(generatedDocs).map((doc) => (
                <div key={doc.id} className="bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{doc.title || doc.filename || "Generated Document"}</h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {doc.createdAt 
                          ? `Generated: ${new Date(doc.createdAt).toLocaleDateString()}`
                          : "Date unknown"
                        }
                        {doc.type && ` • ${doc.type}`}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleDocumentSelect(doc)}
                        className="p-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                        title="View"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => downloadDoc(doc.id)}
                        className="p-2 bg-green-600 hover:bg-green-700 rounded transition-colors"
                        title="Download"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Document Viewer Tab */}
        {activeTab === "viewer" && (
          <div>
            {selectedDocument ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">
                    {selectedDocument.title || selectedDocument.filename || "Document Viewer"}
                  </h2>
                  <div className="flex gap-2">
                    {!isEditing ? (
                      <>
                        <button
                          onClick={() => {
                            setIsEditing(true);
                            setEditContent(getDocumentContent(selectedDocument));
                          }}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition-colors"
                        >
                          <Edit size={16} />
                          Edit
                        </button>
                        <button
                          onClick={() => downloadDoc(selectedDocument.id)}
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded transition-colors"
                        >
                          <Download size={16} />
                          Download
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={saveEdit}
                          disabled={loading}
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded transition-colors disabled:opacity-50"
                        >
                          <CheckCircle size={16} />
                          {loading ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setEditContent("");
                          }}
                          className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded transition-colors"
                        >
                          <X size={16} />
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Document Metadata */}
                <div className="bg-gray-700 p-4 rounded-lg mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {selectedDocument.company && (
                      <div>
                        <span className="text-gray-400">Company:</span>
                        <span className="ml-2">{selectedDocument.company}</span>
                      </div>
                    )}
                    {(selectedDocument.createdAt || selectedDocument.uploadedAt) && (
                      <div>
                        <span className="text-gray-400">Date:</span>
                        <span className="ml-2">
                          {new Date(selectedDocument.createdAt || selectedDocument.uploadedAt!).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {selectedDocument.size && (
                      <div>
                        <span className="text-gray-400">Size:</span>
                        <span className="ml-2">{(selectedDocument.size / 1024).toFixed(2)} KB</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Document Content */}
                <div className="bg-gray-700 rounded-lg">
                  {isEditing ? (
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full h-96 bg-transparent p-4 border-none resize-none focus:outline-none"
                      placeholder="Edit document content..."
                    />
                  ) : (
                    <div className="p-4">
                      <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                        {getDocumentContent(selectedDocument)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Eye size={48} className="mx-auto mb-4 opacity-50" />
                <p>Select a document to view its contents</p>
                <p className="text-sm mt-2">Choose from your resumes, job descriptions, or generated documents</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}