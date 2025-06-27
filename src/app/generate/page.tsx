"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Wand2,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  WifiOff,
  Key,
  LogIn,
  Download,
  Eye,
  Clock,
  X,
  FileEdit,
  MessageSquare,
  User,
  Building,
} from "lucide-react";

// API configuration
const API_BASE_URL = 'https://weapply.onrender.com/api/v1';

interface Resume {
  id: number;
  file?: {
    filename?: string;
    content_type: string;
    size: number;
  };
  upload_timestamp?: string;
  extracted_text?: string;
  created_at?: string;
}

interface JobDescription {
  id: number;
  title?: string;
  company?: string;
  description_text?: string;
  created_at?: string;
}

interface GeneratedDocument {
  id: number;
  type?: string;
  status?: string;
  content?: string | null;
  error_message?: string | null;
  file?: {
    filename?: string;
    content_type: string;
  } | null;
  source_resume_id?: number;
  source_job_description_id?: number | null;
  created_at?: string;
  updated_timestamp?: string;
}

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  user?: any;
}

interface GenerationRequest {
  id: number;
  type: string | 'rewrite-resume' | 'cover-letter' | 'tailor-resume' | 'interview-questions';
  source_resume_id?: number;
  source_job_description_id?: number | undefined;
  content?: string;
  status?: string | 'idle' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: GeneratedDocument;
  error_message?: string;
}

export default function GeneratePage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isOnline, setIsOnline] = useState(true);
    
  // Authentication state
  const [auth, setAuth] = useState<AuthState>({ token: null, isAuthenticated: false });

  // Generation state
  const [selectedResume, setSelectedResume] = useState<number | null>(null);
  const [selectedJobDescription, setSelectedJobDescription] = useState<number | null>(null);
  const [activeGenerations, setActiveGenerations] = useState<Map<string, GenerationRequest>>(new Map());
  const [selectedDocument, setSelectedDocument] = useState<GeneratedDocument | null>(null);
  const [showViewer, setShowViewer] = useState(false);

  // Fade out effect for success message
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

  const requestTimeout = 30000; // 30 seconds
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
  const makeApiRequest = async (url: string, options: RequestInit = {}, retries = 0): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), requestTimeout);

    try {
      const headers: Record<string, string> = {
        ...(options.headers as Record<string, string>),
      };

      if (auth.token) {
        if (auth.token.startsWith('Bearer ')) {
          headers['Authorization'] = auth.token;
        } else if (auth.token.includes('.')) {
          headers['Authorization'] = `Bearer ${auth.token}`;
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
        console.log(`Retrying request to ${url} (attempt ${retries + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1)));
        return makeApiRequest(url, options, retries + 1);
      }
      
      throw error;
    }
  };

  // Load data from API
  const loadData = async () => {
    if (!isOnline) {
      setError("You're offline. Please check your internet connection.");
      return;
    }

    if (!auth.isAuthenticated) {
      setError("Please log in to access documents.");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const endpoints = [
        { url: `${API_BASE_URL}/documents/resumes/`, name: "resumes" },
        { url: `${API_BASE_URL}/documents/job-descriptions/`, name: "job descriptions" },
        { url: `${API_BASE_URL}/documents/generated/`, name: "generated documents" }
      ];

      const results = await Promise.allSettled(
        endpoints.map(async (endpoint) => {
          try {
            const response = await makeApiRequest(endpoint.url);
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
              throw error;
            }
            throw new Error(`Failed to load ${endpoint.name}: ${error.message}`);
          }
        })
      );

      const [resumesResult, jobDescResult, generatedResult] = results;
      
      setResumes(resumesResult.status === 'fulfilled' ? resumesResult.value : []);
      setJobDescriptions(jobDescResult.status === 'fulfilled' ? jobDescResult.value : []);
      setGeneratedDocs(generatedResult.status === 'fulfilled' ? generatedResult.value : []);

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
        return;
      }
      setError("Failed to load documents. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth.isAuthenticated) {
      loadData();
    }
  }, [auth.isAuthenticated, isOnline]);

  // Generation functions
  const generateDocument = async (type: GenerationRequest['type']) => {
    if (!selectedResume) {
      setError("Please select a resume first.");
      return;
    }

    if ((type === 'cover-letter' || type === 'tailor-resume' || type === 'interview-questions') && !selectedJobDescription) {
      setError("Please select a job description for this type of generation.");
      return;
    }

    if (!isOnline) {
      setError("You're offline. Please check your internet connection.");
      return;
    }

    if (!auth.isAuthenticated) {
      setError("Please log in to generate documents.");
      return;
    }

    const requestId = `${type}-${selectedResume}-${selectedJobDescription || 'none'}`;
    
    // Check if already processing
    if (activeGenerations.has(requestId)) {
      setError("This generation is already in progress.");
      return;
    }

    setError("");
    setSuccessMessage("");

    // Initialize generation request
    const generationRequest: GenerationRequest = {
      id: Date.now(), 
      type,
      source_resume_id: selectedResume,
      source_job_description_id: selectedJobDescription || undefined,
      content: "",
      status: 'processing',
      progress: 0,
    };

    setActiveGenerations(prev => new Map(prev.set(requestId, generationRequest)));

    try {
      let endpoint: string;
      let body: any = {};

    switch (type) {
      case 'rewrite-resume':
        endpoint = `${API_BASE_URL}/documents/process/rewrite-resume/${selectedResume}`;
        break;
      case 'cover-letter':
        endpoint = `${API_BASE_URL}/documents/process/cover-letter/?resume_id=${selectedResume}&job_description_id=${selectedJobDescription}`;
        break;
      case 'tailor-resume':
        endpoint = `${API_BASE_URL}/documents/process/tailor-resume/?resume_id=${selectedResume}&job_description_id=${selectedJobDescription}`;
        break;
      case 'interview-questions':
        endpoint = `${API_BASE_URL}/documents/process/interview-questions/?resume_id=${selectedResume}&job_description_id=${selectedJobDescription}`;
        break;
      default:
        throw new Error(`Unknown generation type: ${type}`);
    }

      // Update progress
      setActiveGenerations(prev => {
        const newMap = new Map(prev);
        const request = newMap.get(requestId);
        if (request) {
          request.progress = 25;
          newMap.set(requestId, request);
        }
        return newMap;
      });

      const response = await makeApiRequest(endpoint, {
        method: "POST",
        body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
      });

      // Update progress
      setActiveGenerations(prev => {
        const newMap = new Map(prev);
        const request = newMap.get(requestId);
        if (request) {
          request.progress = 75;
          newMap.set(requestId, request);
        }
        return newMap;
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to generate ${type.replace('-', ' ')}`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage += `: ${errorData.message || errorData.error || response.statusText}`;
        } catch {
          errorMessage += `: ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      // Update progress to completion
      setActiveGenerations(prev => {
        const newMap = new Map(prev);
        const request = newMap.get(requestId);
        if (request) {
          request.status = 'completed';
          request.progress = 100;
          request.result = result;
          newMap.set(requestId, request);
        }
        return newMap;
      });

      setSuccessMessage(`Successfully generated ${type.replace('-', ' ')}!`);
      
      // Reload generated documents
      await loadData();

      // Remove from active generations after a delay
      setTimeout(() => {
        setActiveGenerations(prev => {
          const newMap = new Map(prev);
          newMap.delete(requestId);
          return newMap;
        });
      }, 5000);

    } catch (error: any) {
      console.error(`Generation error for ${type}:`, error);
      
      // Update generation request with error
      setActiveGenerations(prev => {
        const newMap = new Map(prev);
        const request = newMap.get(requestId);
        if (request) {
          request.status = 'failed';
          request.error_message = error.message;
          newMap.set(requestId, request);
        }
        return newMap;
      });

      setError(error.message || `Failed to generate ${type.replace('-', ' ')}.`);

      // Remove from active generations after a delay
      setTimeout(() => {
        setActiveGenerations(prev => {
          const newMap = new Map(prev);
          newMap.delete(requestId);
          return newMap;
        });
      }, 5000);
    }
  };

  const downloadDocument = async (doc: GeneratedDocument) => {
    if (!isOnline) {
      setError("You're offline. Please check your internet connection.");
      return;
    }

    if (!auth.isAuthenticated) {
      setError("Please log in to download documents.");
      return;
    }

    try {
      setError("");
      const endpoint = `${API_BASE_URL}/documents/generated/${doc.id}/download`;
        
      const response = await makeApiRequest(endpoint);
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.file?.filename || `generated-document-${doc.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSuccessMessage("Document downloaded successfully!");
    } catch (err: any) {
      console.error('Download error:', err);
      setError(err.message || "Failed to download document.");
    }
  };

  const viewDocument = (doc: GeneratedDocument) => {
    setSelectedDocument(doc);
    setShowViewer(true);
  };

  const dismissMessage = (type: 'error' | 'success') => {
    if (type === 'error') setError("");
    if (type === 'success') setSuccessMessage("");
  };

  const getGenerationTypeIcon = (type: string) => {
    switch (type) {
      case 'rewrite-resume': return <FileEdit size={20} />;
      case 'cover-letter': return <MessageSquare size={20} />;
      case 'tailor-resume': return <User size={20} />;
      case 'interview-questions': return <Building size={20} />;
      default: return <FileText size={20} />;
    }
  };

  const getGenerationTypeLabel = (type: string) => {
    switch (type) {
      case 'rewrite-resume': return 'Rewrite Resume';
      case 'cover-letter': return 'Cover Letter';
      case 'tailor-resume': return 'Tailor Resume';
      case 'interview-questions': return 'Interview Questions';
      default: return type;
    }
  };

  const getStatusColor = (status: GeneratedDocument['status']) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'processing': return 'text-blue-400';
      case 'pending': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: GeneratedDocument['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} />;
      case 'processing': return <RefreshCw size={16} className="animate-spin" />;
      case 'pending': return <Clock size={16} />;
      case 'failed': return <AlertCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 md:p-8 lg:pl-80">
      {/* Document Viewer Modal */}
      {showViewer && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold">
                {getGenerationTypeLabel(selectedDocument.type || 'Document')}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadDocument(selectedDocument)}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded transition-colors"
                >
                  <Download size={16} />
                  Download
                </button>
                <button
                  onClick={() => setShowViewer(false)}
                  className="text-gray-400 hover:text-white p-2"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {selectedDocument.status === 'completed' && selectedDocument.content ? (
                <div className="bg-gray-700 rounded-lg p-4">
                  <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                    {selectedDocument.content}
                  </pre>
                </div>
              ) : selectedDocument.status === 'failed' ? (
                <div className="text-center py-8 text-red-400">
                  <AlertCircle size={48} className="mx-auto mb-4" />
                  <p>Generation failed</p>
                  {selectedDocument.error_message && (
                    <p className="text-sm mt-2">{selectedDocument.error_message}</p>
                  )}
                </div>
              ) : selectedDocument.status === 'processing' ? (
                <div className="text-center py-8 text-blue-400">
                  <RefreshCw size={48} className="animate-spin mx-auto mb-4" />
                  <p>Processing document...</p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Clock size={48} className="mx-auto mb-4" />
                  <p>Document is pending</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Generate Documents</h1>
        </div>
        
        {/* Network Status & Auth */}
        <div className="flex items-center gap-3">

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

      {!auth.isAuthenticated ? (
        <div className="text-center py-12">
          <Key size={48} className="mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-gray-400 mb-6">Please log in to access document generation features</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Selection Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Resume Selection */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User size={20} />
                Select Resume ({resumes.length})
                </h2>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw size={24} className="animate-spin text-blue-400" />
                </div>
              ) : resumes.length > 0 ? (
                <div className="space-y-2">
                  {resumes.map((resume) => (
                    <div
                      key={resume.id}
                      onClick={() => setSelectedResume(resume.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedResume === resume.id
                          ? 'border-blue-500 bg-blue-900/30'
                          : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <FileText size={16} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {resume.file?.filename || `Resume ${resume.id}`}
                          </p>
                          {resume.upload_timestamp && (
                            <p className="text-xs text-gray-400">
                              {new Date(resume.upload_timestamp).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <FileText size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No resumes found</p>
                  <p className="text-sm mt-1">Upload a resume to get started</p>
                </div>
              )}
            </div>

            {/* Job Description Selection */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Building size={20} />
                Select Job Description ({jobDescriptions.length})
              </h2>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw size={24} className="animate-spin text-blue-400" />
                </div>
              ) : jobDescriptions.length > 0 ? (
                <div className="space-y-2">
                  {jobDescriptions.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJobDescription(job.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedJobDescription === job.id
                          ? 'border-blue-500 bg-blue-900/30'
                          : 'border-gray-600 hover:border-gray-500 hover:bg-gray-700/50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Building size={16} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {job.title || `Job ${job.id}`}
                          </p>
                          {job.company && (
                            <p className="text-sm text-gray-400 truncate">
                              {job.company}
                            </p>
                          )}
                          {job.created_at && (
                            <p className="text-xs text-gray-400">
                              {new Date(job.created_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Building size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No job descriptions found</p>
                  <p className="text-sm mt-1">Add job descriptions to generate targeted content</p>
                </div>
              )}
            </div>
          </div>

          {/* Generation Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Generation Actions */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Wand2 size={20} />
                Generate Documents
              </h2>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Rewrite Resume */}
                <button
                  onClick={() => generateDocument('rewrite-resume')}
                  disabled={!selectedResume || loading || Array.from(activeGenerations.values()).some(g => g.type === 'rewrite-resume' && g.status === 'processing')}
                  className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <div className="flex items-center gap-3">
                    <FileEdit size={24} />
                    <div className="text-left">
                      <p className="font-semibold">Rewrite Resume</p>
                      <p className="text-sm text-blue-100">Improve and enhance your resume</p>
                    </div>
                  </div>
                </button>

                {/* Cover Letter */}
                <button
                  onClick={() => generateDocument('cover-letter')}
                  disabled={!selectedResume || !selectedJobDescription || loading || Array.from(activeGenerations.values()).some(g => g.type === 'cover-letter' && g.status === 'processing')}
                  className="p-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 rounded-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare size={24} />
                    <div className="text-left">
                      <p className="font-semibold">Cover Letter</p>
                      <p className="text-sm text-green-100">Create a targeted cover letter</p>
                    </div>
                  </div>
                </button>

                {/* Tailor Resume */}
                <button
                  onClick={() => generateDocument('tailor-resume')}
                  disabled={!selectedResume || !selectedJobDescription || loading || Array.from(activeGenerations.values()).some(g => g.type === 'tailor-resume' && g.status === 'processing')}
                  className="p-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <div className="flex items-center gap-3">
                    <User size={24} />
                    <div className="text-left">
                      <p className="font-semibold">Tailor Resume</p>
                      <p className="text-sm text-purple-100">Customize resume for job</p>
                    </div>
                  </div>
                </button>

                {/* Interview Questions */}
                <button
                  onClick={() => generateDocument('interview-questions')}
                  disabled={!selectedResume || !selectedJobDescription || loading || Array.from(activeGenerations.values()).some(g => g.type === 'interview-questions' && g.status === 'processing')}
                  className="p-4 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 rounded-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <div className="flex items-center gap-3">
                    <Building size={24} />
                    <div className="text-left">
                      <p className="font-semibold">Interview Questions</p>
                      <p className="text-sm text-orange-100">Get likely interview questions</p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Active Generations */}
              {activeGenerations.size > 0 && (
                <div className="mt-6 space-y-3">
                  <h3 className="font-medium text-gray-300">Active Generations</h3>
                  {Array.from(activeGenerations.entries()).map(([requestId, generation]) => (
                    <div key={requestId} className="bg-gray-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getGenerationTypeIcon(generation.type)}
                          <span className="font-medium">
                            {getGenerationTypeLabel(generation.type)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {generation.status === 'processing' ? (
                            <>
                              <RefreshCw size={16} className="animate-spin text-blue-400" />
                              <span className="text-sm text-blue-400">Processing...</span>
                            </>
                          ) : generation.status === 'completed' ? (
                            <>
                              <CheckCircle size={16} className="text-green-400" />
                              <span className="text-sm text-green-400">Completed</span>
                            </>
                          ) : generation.status === 'failed' ? (
                            <>
                              <AlertCircle size={16} className="text-red-400" />
                              <span className="text-sm text-red-400">Failed</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-gray-600 rounded-full h-2 mb-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            generation.status === 'completed' ? 'bg-green-500' :
                            generation.status === 'failed' ? 'bg-red-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${generation.progress}%` }}
                        />
                      </div>
                      
                      {generation.error_message && (
                        <p className="text-sm text-red-400 mt-1">{generation.error_message}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Generated Documents */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText size={20} />
                Generated Documents ({generatedDocs.length})
              </h2>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw size={24} className="animate-spin text-blue-400" />
                </div>
              ) : generatedDocs.length > 0 ? (
                <div className="space-y-3">
                  {generatedDocs
                    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
                    .map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-gray-700/50 rounded-lg p-4 hover:bg-gray-700/70 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getGenerationTypeIcon(doc.type || 'document')}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {getGenerationTypeLabel(doc.type || 'Document')}
                              </p>
                              <div className={`flex items-center gap-1 ${getStatusColor(doc.status)}`}>
                                {getStatusIcon(doc.status)}
                                <span className="text-xs capitalize">
                                  {doc.status || 'unknown'}
                                </span>
                              </div>
                            </div>
                            
                            {doc.created_at && (
                              <p className="text-sm text-gray-400">
                                Created: {new Date(doc.created_at).toLocaleString()}
                              </p>
                            )}
                            
                            {doc.error_message && (
                              <p className="text-sm text-red-400 mt-1">
                                Error: {doc.error_message}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {doc.status === 'completed' && (
                            <>
                              <button
                                onClick={() => viewDocument(doc)}
                                className="p-2 text-blue-400 hover:text-blue-300 hover:bg-gray-600 rounded transition-colors"
                                title="View document"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => downloadDocument(doc)}
                                className="p-2 text-green-400 hover:text-green-300 hover:bg-gray-600 rounded transition-colors"
                                title="Download document"
                              >
                                <Download size={16} />
                              </button>
                            </>
                          )}
                          
                          {doc.status === 'processing' && (
                            <div className="p-2">
                              <RefreshCw size={16} className="animate-spin text-blue-400" />
                            </div>
                          )}
                          
                          {doc.status === 'failed' && (
                            <div className="p-2">
                              <AlertCircle size={16} className="text-red-400" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <FileText size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No generated documents yet</p>
                  <p className="text-sm mt-1">
                    Select a resume and generate your first document
                  </p>
                </div>
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