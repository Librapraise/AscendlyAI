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
  Activity,
  Menu,
  Filter,
  FileEdit,
  MessageSquare,
  User,
  Building,
  Clock,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import path from 'path';

interface Document {
  id: string;
  file?: {
    filename?: string;
    size: number;
    content_type: string;
  };
  title?: string;
  company?: string;
  content?: string;
  extracted_text?: string;
  description_text?: string;
  upload_timestamp?: string;
  created_at?: string;
  size?: number;
  type?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
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

    // State for fade out effect
    const [isFadingOut, setIsFadingOut] = useState(false);
    
    // Handle success message fade out
    useEffect(() => {
      if (successMessage) {
        const fadeTimer = setTimeout(() => {
          setIsFadingOut(true); // start fade out
        }, 4000); // fade starts at 4s
  
        const removeTimer = setTimeout(() => {
          dismissMessage('success'); // remove message
          setIsFadingOut(false); // reset for future messages
        }, 5000); // removed at 5s
  
        return () => {
          clearTimeout(fadeTimer);
          clearTimeout(removeTimer);
        };
      }
    }, [successMessage]);

  // Authentication state
  const [auth, setAuth] = useState<AuthState>({ token: null, isAuthenticated: false });
  const [showMobileFilter, setShowMobileFilter] = useState(false);

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

  const router = useRouter();
  const navLinks = [
    { path: '/documents' },
    { path: '/generate' },
  ];
  // Navigation handlers
  const handleNavigation = (path: string) => {
    router.push(path);
    if (window.innerWidth < 1024) {
      setShowMobileFilter(false);
    }
  };


  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'rewrite-resume': return <FileEdit size={20} />;
      case 'cover-letter': return <MessageSquare size={20} />;
      case 'tailor-resume': return <User size={20} />;
      case 'interview-questions': return <Building size={20} />;
      default: return <FileText size={20} />;
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'rewrite-resume': return 'Rewrite Resume';
      case 'cover-letter': return 'Cover Letter';
      case 'tailor-resume': return 'Tailor Resume';
      case 'interview-questions': return 'Interview Questions';
      default: return type;
    }
  };

  // Document actions //Edit
  const handleDocumentEdit = (id: string) => {
    window.location.href = `/documents?view=${id}`;
  };

  // Document viewer state
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showViewer, setShowViewer] = useState(false);

  // View document in a modal
  const viewDocument = (doc: Document) => {
    console.log('Viewing document:', doc);
    setSelectedDocument(doc);
    setShowViewer(true);
  };
  

  // Handle document download with filename extraction
  const handleDocumentDownload = async (id: string) => {
    if (!auth.isAuthenticated) {
      setError("Please log in to download documents.");
      return;
    }

    try {
      setLoading(true);
      const response = await apiRequest(`https://weapply.onrender.com/api/v1/documents/generated/${id}/download`);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      
      // Try to get filename from response headers or use the document title
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `document-${id}.pdf`;
      
      if (contentDisposition) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      } else if (selectedDocument?.title) {
        filename = `${selectedDocument.title}.pdf`;
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSuccessMessage("Document downloaded successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to download document.");
    } finally {
      setLoading(false);
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
    <div className="min-h-screen bg-gray-900 text-white lg:pl-72">
      <div className="p-3 sm:p-4 md:p-6 lg:p-8">

        {/* Document Viewer Modal */}
        {showViewer && selectedDocument && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 lg:pl-50">
            <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h2 className="text-xl font-bold">
                  {selectedDocument.title || selectedDocument.file?.filename || getDocumentTypeLabel(selectedDocument.type || 'Document')}
                </h2>
                <div className="flex items-center gap-2">
                  {selectedDocument.status === 'completed' && (
                    <button
                      onClick={() => handleDocumentDownload(selectedDocument.id)}
                      className="cursor-pointer flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded transition-colors"
                    >
                      <Download size={16} />
                      Download
                    </button>
                  )}
                  <button
                    onClick={() => setShowViewer(false)}
                    className="cursor-pointer text-gray-400 hover:text-white p-2"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {(() => {
                  // Determine what content to show
                  const content = selectedDocument.content || 
                                selectedDocument.extracted_text || 
                                selectedDocument.description_text;
                  
                  if (selectedDocument.status === 'failed') {
                    return (
                      <div className="text-center py-8 text-red-400">
                        <AlertCircle size={48} className="mx-auto mb-4" />
                        <p className="text-lg mb-2">Generation failed</p>
                        {selectedDocument.error_message && (
                          <p className="text-sm text-gray-400">{selectedDocument.error_message}</p>
                        )}
                      </div>
                    );
                  }
                  
                  if (selectedDocument.status === 'processing') {
                    return (
                      <div className="text-center py-8 text-blue-400">
                        <RefreshCw size={48} className="animate-spin mx-auto mb-4" />
                        <p className="text-lg">Processing document...</p>
                      </div>
                    );
                  }
                  
                  if (selectedDocument.status === 'pending') {
                    return (
                      <div className="text-center py-8 text-yellow-400">
                        <Clock size={48} className="mx-auto mb-4" />
                        <p className="text-lg">Document is pending</p>
                      </div>
                    );
                  }
                  
                  if (content) {
                    return (
                      <div className="bg-gray-700 rounded-lg p-4">
                        <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-gray-100">
                          {content}
                        </pre>
                      </div>
                    );
                  }
                  
                  // Fallback for documents without text content
                  return (
                    <div className="text-center py-8 text-gray-400">
                      <FileText size={48} className="mx-auto mb-4" />
                      <p className="text-lg mb-2">Preview not available</p>
                      <p className="text-sm">This document type cannot be previewed in the browser.</p>
                      {selectedDocument.status === 'completed' && (
                        <button
                          onClick={() => handleDocumentDownload(selectedDocument.id)}
                          className="mt-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition-colors mx-auto"
                        >
                          <Download size={16} />
                          Download to view
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}


        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent truncate">
              Dashboard
            </h1>
            <p className="text-gray-400 mt-1 sm:mt-2 text-sm sm:text-base hidden sm:block">
              Welcome to your document management center
            </p>
          </div>
          
          {/* Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={loadData} 
              disabled={loading}
              className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800"
              title="Refresh data"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div
            className={`mb-6 bg-green-900/50 border border-green-700 p-4 rounded-lg flex items-center justify-between transition-opacity duration-1000 ${
              isFadingOut ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle size={20} className="text-green-400" />
              <span>{successMessage}</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 sm:mb-6 bg-red-900/50 border border-red-700 p-3 sm:p-4 rounded-lg flex items-start justify-between">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
              <span className="whitespace-pre-line text-sm sm:text-base break-words">{error}</span>
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-3 sm:p-4 lg:p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-blue-100 text-xs sm:text-sm truncate">Total Documents</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{stats.totalDocuments}</p>
              </div>
              <FileText className="text-blue-200 flex-shrink-0" size={20} />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-600 to-green-800 p-3 sm:p-4 lg:p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-green-100 text-xs sm:text-sm truncate">Recent Uploads</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{stats.recentUploads}</p>
              </div>
              <TrendingUp className="text-green-200 flex-shrink-0" size={20} />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-3 sm:p-4 lg:p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-purple-100 text-xs sm:text-sm truncate">Generated Docs</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{stats.generatedDocs}</p>
              </div>
              <Activity className="text-purple-200 flex-shrink-0" size={20} />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-600 to-orange-800 p-3 sm:p-4 lg:p-6 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-orange-100 text-xs sm:text-sm truncate">Active Jobs</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{stats.activeJobs}</p>
              </div>
              <Users className="text-orange-200 flex-shrink-0" size={20} />
            </div>
          </div>
        </div>

        {/* Upload Zone */}
        <div className="bg-gray-800 rounded-xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 border border-gray-700">
          <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Quick Upload</h2>
          <div
            onClick={() => fileInput.current?.click()}
            className="border-2 border-dashed border-gray-600 rounded-lg p-4 sm:p-6 lg:p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
          >
            <Upload size={32} className="mx-auto mb-2 sm:mb-4 text-gray-400" />
            <p className="text-sm sm:text-base lg:text-lg mb-1 sm:mb-2">Drop files here or click to browse</p>
            <p className="text-xs sm:text-sm text-gray-400">
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
            <div className="mt-4 sm:mt-6">
              <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3">Upload Progress</h3>
              {Object.entries(uploadProgress).map(([filename, progress]) => (
                <div key={filename} className="mb-2 sm:mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs sm:text-sm truncate max-w-[60%] sm:max-w-[70%]">{filename}</span>
                    <span className="text-xs sm:text-sm">
                      {progress === -1 ? "Failed" : progress === 100 ? "Complete" : `${progress}%`}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5 sm:h-2">
                    <div
                      className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
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
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <button
              onClick={() => handleNavigation(path.join('/documents'))}
              className="cursor-pointer bg-gray-800 hover:bg-gray-700 p-4 sm:p-6 rounded-xl transition-all duration-300 hover:scale-105 border border-gray-700 hover:border-blue-500 text-left"
            >
              <FileText size={24} className="text-blue-400 mb-2 sm:mb-3" />
              <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Manage Documents</h3>
              <p className="text-xs sm:text-sm text-gray-400">View and organize all your documents</p>
            </button>
            
            <button
              onClick={() => handleNavigation('/generate')}
              className="cursor-pointer bg-gray-800 hover:bg-gray-700 p-4 sm:p-6 rounded-xl transition-all duration-300 hover:scale-105 border border-gray-700 hover:border-purple-500 text-left"
            >
              <Activity size={24} className="text-purple-400 mb-2 sm:mb-3" />
              <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Generate Resume</h3>
              <p className="text-xs sm:text-sm text-gray-400">Create tailored resumes and cover letters</p>
            </button>
          </div>
        </div>

        {/* Recent Documents */}
        <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold">Recent Uploads</h2>
            
            {/* Mobile Search & Filter */}
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="relative flex-1 sm:flex-none">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none text-white placeholder-gray-400 text-sm sm:text-base w-full sm:w-auto"
                />
              </div>
              
              <button
                onClick={() => setShowMobileFilter(!showMobileFilter)}
                className="sm:hidden p-2 bg-gray-700 rounded-lg"
              >
                <Filter size={16} />
              </button>
              
              <button
                onClick={() => handleNavigation('/documents')}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium whitespace-nowrap"
              >
                View All
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8 sm:py-12">
                <RefreshCw size={24} className="animate-spin text-gray-400" />
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <FileText size={32} className="mx-auto mb-4 text-gray-400" />
              <p className="text-gray-400 text-sm sm:text-base">
                {searchTerm ? "No documents match your search" : "No documents found. Upload some files to get started!"}
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {filteredDocuments.slice(0, 5).map((doc, index) => (
                <div key={`${doc.type || 'unknown'}-${doc.id}-${index}`} className="bg-gray-700 p-3 sm:p-4 rounded-lg hover:bg-gray-600 transition-colors">
                  <div className="flex items-center justify-between gap-2 sm:gap-4">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="flex-shrink-0">
                        {doc.type === 'resume' && <FileText size={16} className="text-blue-400" />}
                        {doc.type === 'job_description' && <FileText size={16} className="text-green-400" />}
                        {doc.type === 'generated' && <Activity size={16} className="text-purple-400" />}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-sm sm:text-base truncate">
                          {doc.title || doc.file?.filename || 'Untitled Document'}
                        </h3>
                        <div className="flex items-center gap-2 sm:gap-4 mt-1">
                          <span className="text-xs text-gray-400">
                            {doc.company && `${doc.company} • `}
                            {doc.created_at && new Date(doc.created_at).toLocaleDateString()}
                          </span>
                          {doc.size && (
                            <span className="text-xs text-gray-400">
                              {(doc.size / 1024).toFixed(1)} KB
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      <button
                        onClick={() => viewDocument(doc)}
                        className="cursor-pointer p-1.5 sm:p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-600 rounded transition-colors"
                        title="View document"
                      >
                        <Eye size={14} />
                      </button>
                      
                      <button
                        onClick={() => handleDocumentDelete(doc.id)}
                        className="cursor-pointer p-1.5 sm:p-2 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded transition-colors"
                        title="Delete document"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mobile Filter Modal */}
        {showMobileFilter && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-40 sm:hidden">
            <div className="bg-gray-800 w-full max-w-md rounded-t-xl p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Filter Documents</h3>
                <button onClick={() => setShowMobileFilter(false)}>
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Document Type</label>
                  <select className="w-full bg-gray-700 p-3 rounded border border-gray-600 focus:border-blue-500 focus:outline-none">
                    <option value="">All Types</option>
                    <option value="resume">Resumes</option>
                    <option value="job_description">Job Descriptions</option>
                    <option value="generated">Generated Documents</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Date Range</label>
                  <select className="w-full bg-gray-700 p-3 rounded border border-gray-600 focus:border-blue-500 focus:outline-none">
                    <option value="">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => setShowMobileFilter(false)}
                    className="cursor-pointer flex-1 bg-blue-600 hover:bg-blue-700 py-3 rounded"
                  >
                    Apply Filters
                  </button>
                  <button
                    onClick={() => setShowMobileFilter(false)}
                    className="cursor-pointer flex-1 bg-gray-600 hover:bg-gray-700 py-3 rounded"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Document Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8">
          {/* Resumes */}
          <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-blue-400">Resumes</h3>
              <span className="text-xs sm:text-sm text-gray-400">{resumes.length} files</span>
            </div>
            
            {resumes.length === 0 ? (
              <p className="text-gray-400 text-xs sm:text-sm">No resumes uploaded yet</p>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {resumes.slice(0, 3).map((resume) => (
                  <div key={resume.id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-700 rounded-lg">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium truncate">{resume.title || resume.file?.filename || 'Untitled Resume'}</p>
                      <p className="text-xs text-gray-400">{resume.company}</p>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={() => viewDocument(resume)}
                        className="cursor-pointer p-1 text-gray-400 hover:text-blue-400 transition-colors"
                      >
                        <Eye size={12} />
                      </button>
                    </div>
                  </div>
                ))}
                {resumes.length > 3 && (
                  <button
                    onClick={() => handleNavigation('/documents?type=resume')}
                    className="cursor-pointer w-full text-xs sm:text-sm text-blue-400 hover:text-blue-300 p-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    View all {resumes.length} resumes
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Job Descriptions */}
          <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-green-400">Job Descriptions</h3>
              <span className="text-xs sm:text-sm text-gray-400">{jobDescriptions.length} files</span>
            </div>
            
            {jobDescriptions.length === 0 ? (
              <p className="text-gray-400 text-xs sm:text-sm">No job descriptions uploaded yet</p>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {jobDescriptions.slice(0, 3).map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-700 rounded-lg">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium truncate">{job.title}</p>
                      <p className="text-xs text-gray-400">{job.company}</p>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={() => viewDocument(job)}
                        className="cursor-pointer p-1 text-gray-400 hover:text-green-400 transition-colors"
                      >
                        <Eye size={12} />
                      </button>
                    </div>
                  </div>
                ))}
                {jobDescriptions.length > 3 && (
                  <button
                    onClick={() => handleNavigation('/documents?type=job_description')}
                    className="cursor-pointer w-full text-xs sm:text-sm text-green-400 hover:text-green-300 p-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    View all {jobDescriptions.length} job descriptions
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Generated Documents */}
          <div className="bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-purple-400">Generated</h3>
              <span className="text-xs sm:text-sm text-gray-400">{generatedDocs.length} files</span>
            </div>
            
            {generatedDocs.length === 0 ? (
              <p className="text-gray-400 text-xs sm:text-sm">No generated documents yet</p>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {generatedDocs.slice(0, 3).map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-2 sm:p-3 bg-gray-700 rounded-lg">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium truncate">{doc.title || 'Generated Document'}</p>
                      <p className="text-xs text-gray-400">
                        {doc.created_at && new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={() => viewDocument(doc)}
                        className="cursor-pointer p-1 text-gray-400 hover:text-purple-400 transition-colors"
                      >
                        <Eye size={12} />
                      </button>
                      <button
                        onClick={() => handleDocumentDownload(doc.id)}
                        className="cursor-pointer p-1 text-gray-400 hover:text-green-400 transition-colors"
                      >
                        <Download size={12} />
                      </button>
                    </div>
                  </div>
                ))}
                {generatedDocs.length > 3 && (
                  <button
                    onClick={() => handleNavigation('/documents?type=generated')}
                    className="w-full text-xs sm:text-sm text-purple-400 hover:text-purple-300 p-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    View all {generatedDocs.length} generated documents
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

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
    </div>
  );
}