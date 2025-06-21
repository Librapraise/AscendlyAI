"use client";

import { useState, useEffect, useCallback } from 'react';
import { 
  Upload, 
  FileText, 
  Briefcase, 
  MessageSquare, 
  Download, 
  Edit3, 
  Trash2, 
  Plus,
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Eye,
  LogIn,
  Shield,
  Clock,
  X
} from 'lucide-react';

interface Resume {
  id: number;
  file_record: {
    filename: string;
    content_type: string;
    upload_date: string;
    file_size: number;
  };
  extracted_text: string | null;
  created_at: string;
  updated_at: string;
}

interface JobDescription {
  id: number;
  title: string;
  company: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface GeneratedDocument {
  id: number;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  content: string | null;
  error_message: string | null;
  file: {
    filename: string;
    content_type: string;
  } | null;
  source_resume_id: number;
  source_job_description_id: number | null;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  loading: boolean;
}

// API configuration
const API_BASE_URL = 'https://weapply.onrender.com/api/v1';

export default function DocumentGenerationPage() {
  const [activeTab, setActiveTab] = useState('resume-rewriter');
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [generatedDocuments, setGeneratedDocuments] = useState<GeneratedDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [selectedResume, setSelectedResume] = useState<string>('');
  const [selectedJobDescription, setSelectedJobDescription] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    token: null,
    loading: true
  });
  const [retryCount, setRetryCount] = useState(0);

  // Mock router for demo purposes
  const router = {
    push: (path: string) => console.log('Navigate to:', path),
    back: () => console.log('Navigate back')
  };

  // Initialize auth state
  useEffect(() => {
    const initAuth = () => {
      try {
        // Simulate checking authentication
        // In real app, this would check localStorage for token
        const token = localStorage.getItem('access_token');
        setAuthState({
          isAuthenticated: !!token,
          token: token,
          loading: false
        });
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        setAuthState({
          isAuthenticated: false,
          token: null,
          loading: false
        });
      }
    };

    initAuth();
  }, []);

  // Load data when authenticated
  useEffect(() => {
    if (authState.isAuthenticated && !authState.loading) {
      loadAllData();
    }
  }, [authState.isAuthenticated, authState.loading]);

  const getAuthHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (authState.token) {
      headers['Authorization'] = `Bearer ${authState.token}`;
    }
    
    return headers;
  }, [authState.token]);

  const handleApiError = (error: any, context: string): string => {
    console.error(`API Error in ${context}:`, error);
    
    // Handle different types of errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return 'Network error. Please check your internet connection.';
    }
    
    if (error.response?.status === 401) {
      // Handle unauthorized - clear auth and redirect
      setAuthState({ isAuthenticated: false, token: null, loading: false });
      return 'Session expired. Please log in again.';
    }
    
    if (error.response?.status === 403) {
      return 'Access denied. You do not have permission to perform this action.';
    }
    
    if (error.response?.status >= 500) {
      return 'Server error. Please try again later.';
    }
    
    if (error.response?.data?.detail) {
      return error.response.data.detail;
    }
    
    return error.message || 'An unexpected error occurred';
  };

  const makeApiRequest = async (url: string, options: RequestInit = {}) => {
    // For demo purposes, simulate API responses
    console.log('API Request:', url, options);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock data based on URL
    if (url.endsWith('/documents/resumes/')) {
      return {
        ok: true,
        json: () => Promise.resolve([
          {
            id: 1,
            file_record: {
              filename: 'john_doe_resume.pdf',
              content_type: 'application/pdf',
              upload_date: '2024-01-15',
              file_size: 245760
            },
            extracted_text: 'Sample resume content...',
            created_at: '2024-01-15T10:30:00Z',
            updated_at: '2024-01-15T10:30:00Z'
          }
        ])
      };
    }
    
    if (url.endsWith('/documents/job-descriptions/')) {
      return {
        ok: true,
        json: () => Promise.resolve([
          {
            id: 1,
            title: 'Senior Software Engineer',
            company: 'Tech Corp',
            description: 'Looking for experienced software engineer...',
            created_at: '2024-01-10T09:00:00Z',
            updated_at: '2024-01-10T09:00:00Z'
          }
        ])
      };
    }
    
    if (url.endsWith('/documents/generated/')) {
      return {
        ok: true,
        json: () => Promise.resolve([
          {
            id: 1,
            type: 'resume_rewrite',
            status: 'completed',
            content: 'Generated content...',
            error_message: null,
            file: {
              filename: 'rewritten_resume.pdf',
              content_type: 'application/pdf'
            },
            source_resume_id: 1,
            source_job_description_id: null,
            created_at: '2024-01-16T14:00:00Z',
            updated_at: '2024-01-16T14:05:00Z'
          }
        ])
      };
    }
    
    // Default response
    return {
      ok: true,
      json: () => Promise.resolve({ success: true })
    };
  };

  const loadAllData = async () => {
    try {
      await Promise.allSettled([
        loadResumes(),
        loadJobDescriptions(),
        loadGeneratedDocuments()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const loadResumes = async () => {
    try {
      const response = await makeApiRequest(`${API_BASE_URL}/documents/resumes/`);
      const data = await response.json();
      setResumes(
        Array.isArray(data)
          ? data.filter(
              (item: any) =>
                item &&
                typeof item === 'object' &&
                'file_record' in item &&
                'extracted_text' in item &&
                'created_at' in item &&
                'updated_at' in item
            ).map((item: any) => item as Resume)
          : []
      );
    } catch (error) {
      const errorMessage = handleApiError(error, 'loadResumes');
      setError(errorMessage);
      setResumes([]);
    }
  };

  const loadJobDescriptions = async () => {
    try {
      const response = await makeApiRequest(`${API_BASE_URL}/documents/job-descriptions/`);
      const data = await response.json();
      setJobDescriptions(
        Array.isArray(data)
          ? data.filter(
              (item: any) =>
                item &&
                typeof item === 'object' &&
                typeof item.title === 'string' &&
                typeof item.company === 'string' &&
                typeof item.description === 'string' &&
                'created_at' in item &&
                'updated_at' in item
            ).map((item: any) => item as JobDescription)
          : []
      );
    } catch (error) {
      const errorMessage = handleApiError(error, 'loadJobDescriptions');
      setError(errorMessage);
      setJobDescriptions([]);
    }
  };

  const loadGeneratedDocuments = async () => {
    try {
      const response = await makeApiRequest(`${API_BASE_URL}/documents/generated/`);
      const data = await response.json();
      // Only keep items that match the GeneratedDocument shape
      setGeneratedDocuments(
        Array.isArray(data)
          ? data
              .filter(
                (item) =>
                  item &&
                  typeof item === 'object' &&
                  typeof (item as any).type === 'string' &&
                  typeof (item as any).status === 'string' &&
                  'content' in item &&
                  'error_message' in item &&
                  'file' in item &&
                  'source_resume_id' in item &&
                  'created_at' in item &&
                  'updated_at' in item
              )
              .map((item) => item as GeneratedDocument)
          : []
      );
    } catch (error) {
      const errorMessage = handleApiError(error, 'loadGeneratedDocuments');
      setError(errorMessage);
      setGeneratedDocuments([]);
    }
  };

const handleFileUpload = async (file: File) => {
  if (!authState.isAuthenticated) {
    setError('Please log in to upload files');
    return;
  }

  // Validate file type
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (!allowedTypes.includes(file.type)) {
    setError('Only PDF, DOC, and DOCX files are supported');
    return;
  }

  // Validate file size (e.g., 10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    setError('File size must be less than 10MB');
    return;
  }

  setUploadLoading(true);
  setError('');
  
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await makeApiRequest(`${API_BASE_URL}/documents/resumes/`, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    console.log('Upload successful:', result);
    
    // Refresh the resumes list immediately
    await loadResumes();
    
    // Reset file input
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    
  } catch (error) {
    const errorMessage = handleApiError(error, 'handleFileUpload');
    setError(errorMessage);
  } finally {
    setUploadLoading(false);
  }
};

  const handleGenerate = async () => {
    if (!authState.isAuthenticated) {
      setError('Please log in to generate documents');
      return;
    }

    if (!selectedResume) {
      setError('Please select a resume');
      return;
    }
    
    const needsJobDescription = ['cover-letter', 'tailored-resume', 'interview-questions'].includes(activeTab);
    if (needsJobDescription && !selectedJobDescription) {
      setError('Please select a job description');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      let endpoint = '';
      let requestBody: any = null;
      let method = 'POST';
      
      switch (activeTab) {
        case 'resume-rewriter':
          endpoint = `${API_BASE_URL}/documents/process/rewrite-resume/${selectedResume}`;
          break;
        case 'cover-letter':
          endpoint = `${API_BASE_URL}/documents/process/cover-letter/`;
          requestBody = { 
            resume_id: parseInt(selectedResume), 
            job_description_id: parseInt(selectedJobDescription) 
          };
          break;
        case 'tailored-resume':
          endpoint = `${API_BASE_URL}/documents/process/tailor-resume/`;
          requestBody = { 
            resume_id: parseInt(selectedResume), 
            job_description_id: parseInt(selectedJobDescription) 
          };
          break;
        case 'interview-questions':
          endpoint = `${API_BASE_URL}/documents/process/interview-questions/`;
          requestBody = { 
            resume_id: parseInt(selectedResume), 
            job_description_id: parseInt(selectedJobDescription) 
          };
          break;
        default:
          throw new Error('Invalid generation type');
      }
      
      const fetchOptions: RequestInit = { method };
      
      if (requestBody) {
        fetchOptions.body = JSON.stringify(requestBody);
      }
      
      const response = await makeApiRequest(endpoint, fetchOptions);
      const result = await response.json();
      
      console.log('Generation started:', result);
      
      // Refresh generated documents list
      setTimeout(loadGeneratedDocuments, 1000);
      
      // Reset selections
      setSelectedResume('');
      setSelectedJobDescription('');
      
    } catch (error) {
      const errorMessage = handleApiError(error, 'handleGenerate');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (docId: number) => {
    if (!authState.isAuthenticated) {
      setError('Please log in to download documents');
      return;
    }

    try {
      console.log('Downloading document:', docId);
      // In a real app, this would trigger a file download
      alert('Download started for document ' + docId);
    } catch (error) {
      const errorMessage = handleApiError(error, 'handleDownload');
      setError(errorMessage);
    }
  };

  const handleRetry = () => {
    setError('');
    setRetryCount(prev => prev + 1);
    loadAllData();
  };

  const handleLogin = () => {
    router.push('/login');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'resume_rewrite':
        return <FileText className="text-blue-400" size={18} />;
      case 'cover_letter':
        return <Edit3 className="text-green-400" size={18} />;
      case 'tailored_resume':
        return <Briefcase className="text-purple-400" size={18} />;
      case 'interview_questions':
        return <MessageSquare className="text-orange-400" size={18} />;
      default:
        return <FileText className="text-gray-400" size={18} />;
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'resume_rewrite':
        return 'Resume Rewrite';
      case 'cover_letter':
        return 'Cover Letter';
      case 'tailored_resume':
        return 'Tailored Resume';
      case 'interview_questions':
        return 'Interview Questions';
      default:
        return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-green-400" size={16} />;
      case 'processing':
      case 'pending':
        return <Clock className="text-yellow-400" size={16} />;
      case 'failed':
        return <AlertCircle className="text-red-400" size={16} />;
      default:
        return <Clock className="text-gray-400" size={16} />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'processing':
        return 'Processing';
      case 'pending':
        return 'Pending';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  const tabs = [
    { id: 'resume-rewriter', label: 'Resume Rewriter', shortLabel: 'Rewriter', icon: FileText },
    { id: 'cover-letter', label: 'Cover Letter Generator', shortLabel: 'Cover Letter', icon: Edit3 },
    { id: 'tailored-resume', label: 'Tailored Resume Creator', shortLabel: 'Tailored', icon: Briefcase },
    { id: 'interview-questions', label: 'Interview Questions Generator', shortLabel: 'Interview', icon: MessageSquare }
  ];

  // Show loading state while checking authentication
  if (authState.loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-4 text-blue-400 animate-spin" size={48} />
          <p className="text-gray-300 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!authState.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
          <Shield className="mx-auto mb-4 text-blue-400" size={48} />
          <h1 className="text-2xl font-bold text-white mb-4">Authentication Required</h1>
          <p className="text-gray-300 mb-6">
            Please log in to access the document generation features.
          </p>
          <button
            onClick={handleLogin}
            className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <LogIn size={20} />
            <span>Log In</span>
          </button>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    const needsJobDescription = ['cover-letter', 'tailored-resume', 'interview-questions'].includes(activeTab);
    
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="text-red-400" size={20} />
                <p className="text-red-400">{error}</p>
              </div>
              <button 
                onClick={() => setError('')}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="mt-3 flex space-x-2">
              <button 
                onClick={handleRetry}
                className="text-red-400 hover:text-red-300 text-sm underline"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Resume Selection */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Select Resume</h3>
          {resumes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto mb-3 text-gray-400" size={48} />
              <p className="text-gray-400 mb-4">No resumes uploaded yet</p>
              <p className="text-gray-500 text-sm">Upload a resume above to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              {resumes.map((resume) => (
                <div
                  key={resume.id}
                  className={`p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    selectedResume === resume.id.toString()
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-600 hover:border-gray-500 bg-gray-700/50'
                  }`}
                  onClick={() => setSelectedResume(resume.id.toString())}
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="text-blue-400 flex-shrink-0" size={20} />
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium truncate">{resume.file_record.filename}</p>
                      <p className="text-gray-400 text-sm">
                        {formatDate(resume.file_record.upload_date)} • {formatFileSize(resume.file_record.file_size)}
                        {!resume.extracted_text && <span className="text-yellow-400 ml-2">• Processing...</span>}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Job Description Selection (if needed) */}
        {needsJobDescription && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Select Job Description</h3>
            {jobDescriptions.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="mx-auto mb-3 text-gray-400" size={48} />
                <p className="text-gray-400 mb-4">No job descriptions available</p>
                <p className="text-gray-500 text-sm">Create a job description first</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {jobDescriptions.map((jd) => (
                  <div
                    key={jd.id}
                    className={`p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      selectedJobDescription === jd.id.toString()
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-600 hover:border-gray-500 bg-gray-700/50'
                    }`}
                    onClick={() => setSelectedJobDescription(jd.id.toString())}
                  >
                    <div className="flex items-center space-x-3">
                      <Briefcase className="text-green-400 flex-shrink-0" size={20} />
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-medium truncate">{jd.title}</p>
                        <p className="text-gray-400 text-sm">{jd.company} • {formatDate(jd.created_at)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Generate Button */}
        <div className="flex justify-center px-4">
          <button
            onClick={handleGenerate}
            disabled={loading || !selectedResume || (needsJobDescription && !selectedJobDescription)}
            className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <RefreshCw className="animate-spin" size={20} />
                <span className="hidden sm:inline">Generating...</span>
                <span className="sm:hidden">Processing...</span>
              </>
            ) : (
              <>
                <Plus size={20} />
                <span className="hidden sm:inline">Generate {tabs.find(t => t.id === activeTab)?.label}</span>
                <span className="sm:hidden">Generate {tabs.find(t => t.id === activeTab)?.shortLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <div className="flex items-center space-x-4 mb-4 sm:mb-6">
            <button 
              className="cursor-pointer text-gray-400 hover:text-white transition-colors"
              onClick={() => router.back()}
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Document Generation</h1>
          </div>
        </div>

        {/* Upload Zone */}
        <div className="animate-fade-in bg-gray-800 rounded-xl sm:rounded-2xl border border-gray-700 p-4 sm:p-8">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Upload New Resume</h2>
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 sm:p-8 text-center hover:border-gray-500 transition-colors duration-200">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              className="hidden"
              id="file-upload"
              disabled={uploadLoading}
            />
            <label htmlFor="file-upload" className={`cursor-pointer ${uploadLoading ? 'opacity-50' : ''}`}>
              {uploadLoading ? (
                <RefreshCw className="mx-auto mb-3 sm:mb-4 text-gray-400 animate-spin" size={40} />
              ) : (
                <Upload className="mx-auto mb-3 sm:mb-4 text-gray-400" size={40} />
              )}
              <p className="text-gray-300 text-base sm:text-lg mb-2">
                {uploadLoading ? 'Uploading...' : 'Upload your resume'}
              </p>
              <p className="text-gray-500 text-sm sm:text-base">PDF, DOC, or DOCX files supported</p>
            </label>
          </div>
        </div>

        {/* Tabs */}
        <div className="animate-fade-in">
          {/* Mobile Tab Selector */}
          <div className="sm:hidden mb-4">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {tabs.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.label}
                </option>
              ))}
            </select>
          </div>

          {/* Desktop Tabs */}
          <div className="hidden sm:flex space-x-1 bg-gray-800 p-1 rounded-lg mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 px-2 lg:px-4 py-3 rounded-md transition-all duration-200 text-sm lg:text-base ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <tab.icon size={16} className="lg:w-[18px] lg:h-[18px]" />
                <span className="font-medium hidden md:inline">{tab.label}</span>
                <span className="font-medium md:hidden">{tab.shortLabel}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {renderTabContent()}
        </div>

        {/* Generated Documents */}
        <div className="animate-fade-in bg-gray-800 rounded-xl sm:rounded-2xl border border-gray-700 p-4 sm:p-8">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Generated Documents</h2>
          {generatedDocuments.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="mx-auto mb-3 text-gray-400" size={48} />
              <p className="text-gray-400 mb-4">No documents generated yet</p>
              <p className="text-gray-500 text-sm">Generate your first document above!</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {generatedDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="animate-fade-in bg-gray-700/50 rounded-lg p-4 hover:bg-gray-700 transition-colors duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="p-2 bg-blue-500/20 rounded-lg flex-shrink-0">
                        {getDocumentTypeIcon(doc.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-white font-medium text-sm sm:text-base truncate">
                          {getDocumentTypeLabel(doc.type)}
                        </h3>
                        <p className="text-gray-400 text-xs sm:text-sm">{formatDate(doc.created_at)}</p>
                        {doc.error_message && (
                          <p className="text-red-400 text-xs mt-1 truncate">{doc.error_message}</p>)}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(doc.status)}
                        <span className="text-xs sm:text-sm text-gray-400">
                          {getStatusText(doc.status)}
                        </span>
                      </div>
                      
                      {doc.status === 'completed' && doc.file && (
                        <div className="flex space-x-1 sm:space-x-2">
                          <button
                            onClick={() => console.log('View document:', doc.id)}
                            className="p-1.5 sm:p-2 text-gray-400 hover:text-white bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors duration-200"
                            title="View document"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleDownload(doc.id)}
                            className="p-1.5 sm:p-2 text-gray-400 hover:text-white bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors duration-200"
                            title="Download document"
                          >
                            <Download size={16} />
                          </button>
                        </div>
                      )}
                      
                      {doc.status === 'processing' && (
                        <RefreshCw className="text-yellow-400 animate-spin" size={16} />
                      )}
                      
                      {doc.status === 'failed' && (
                        <button
                          onClick={() => console.log('Retry generation for document:', doc.id)}
                          className="p-1.5 sm:p-2 text-gray-400 hover:text-white bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors duration-200"
                          title="Retry generation"
                        >
                          <RefreshCw size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Progress indicator for processing documents */}
                  {doc.status === 'processing' && (
                    <div className="mt-3">
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full animate-pulse"
                          style={{ width: '60%' }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Processing document...</p>
                    </div>
                  )}
                  
                  {/* Document details */}
                  {doc.status === 'completed' && doc.file && (
                    <div className="mt-3 text-xs text-gray-400">
                      <span>{doc.file.filename}</span>
                      <span className="mx-2">•</span>
                      <span>{doc.file.content_type}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>© 2025 AscendlyAI. All rights reserved.</p>
        </div>
      </div>
      
      {/* Custom Styles */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        
        /* Custom scrollbar for webkit browsers */
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: #374151;
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #6b7280;
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
}