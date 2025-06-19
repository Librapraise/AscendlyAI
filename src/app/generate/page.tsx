"use client";

import { useState, useEffect } from 'react';
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
  Eye
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Resume {
  id: string;
  name: string;
  uploadDate: string;
  fileSize: string;
}

interface JobDescription {
  id: string;
  title: string;
  company: string;
  createdDate: string;
}

interface GeneratedDocument {
  id: string;
  type: 'resume-rewrite' | 'cover-letter' | 'tailored-resume' | 'interview-questions';
  title: string;
  createdDate: string;
  status: 'completed' | 'processing' | 'failed';
}

export default function DocumentGenerationPage() {
  const [activeTab, setActiveTab] = useState('resume-rewriter');
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [generatedDocuments, setGeneratedDocuments] = useState<GeneratedDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedResume, setSelectedResume] = useState<string>('');
  const [selectedJobDescription, setSelectedJobDescription] = useState<string>('');

  // Mock data for demonstration
  useEffect(() => {
    setResumes([
      { id: '1', name: 'John_Doe_Resume.pdf', uploadDate: '2024-06-15', fileSize: '245 KB' },
      { id: '2', name: 'Software_Engineer_Resume.pdf', uploadDate: '2024-06-10', fileSize: '189 KB' }
    ]);

    setJobDescriptions([
      { id: '1', title: 'Senior Software Engineer', company: 'TechCorp', createdDate: '2024-06-14' },
      { id: '2', title: 'Product Manager', company: 'InnovateCo', createdDate: '2024-06-12' }
    ]);

    setGeneratedDocuments([
      { id: '1', type: 'resume-rewrite', title: 'Rewritten Resume - John Doe', createdDate: '2024-06-18', status: 'completed' },
      { id: '2', type: 'cover-letter', title: 'Cover Letter - TechCorp Application', createdDate: '2024-06-17', status: 'completed' }
    ]);
  }, []);

  const tabs = [
    { id: 'resume-rewriter', label: 'Resume Rewriter', icon: FileText },
    { id: 'cover-letter', label: 'Cover Letter Generator', icon: Edit3 },
    { id: 'tailored-resume', label: 'Tailored Resume Creator', icon: Briefcase },
    { id: 'interview-questions', label: 'Interview Questions Generator', icon: MessageSquare }
  ];

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('https://weapply.onrender.com/api/v1/documents/resumes/', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const newResume = await response.json();
        setResumes(prev => [...prev, newResume]);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedResume) return;
    
    setLoading(true);
    try {
      let endpoint = '';
      let payload = {};
      
      switch (activeTab) {
        case 'resume-rewriter':
          endpoint = `https://weapply.onrender.com/api/v1/documents/process/rewrite-resume/${selectedResume}`;
          break;
        case 'cover-letter':
          endpoint = 'https://weapply.onrender.com/api/v1/documents/process/cover-letter/';
          payload = { resume_id: selectedResume, job_description_id: selectedJobDescription };
          break;
        case 'tailored-resume':
          endpoint = 'https://weapply.onrender.com/api/v1/documents/process/tailor-resume/';
          payload = { resume_id: selectedResume, job_description_id: selectedJobDescription };
          break;
        case 'interview-questions':
          endpoint = 'https://weapply.onrender.com/api/v1/documents/process/interview-questions/';
          payload = { resume_id: selectedResume, job_description_id: selectedJobDescription };
          break;
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: Object.keys(payload).length ? JSON.stringify(payload) : undefined
      });
      
      if (response.ok) {
        const result = await response.json();
        // Refresh generated documents list
        fetchGeneratedDocuments();
      }
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGeneratedDocuments = async () => {
    try {
      const response = await fetch('https://weapply.onrender.com/api/v1/documents/generated/');
      if (response.ok) {
        const documents = await response.json();
        setGeneratedDocuments(documents);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  };

  const handleDownload = async (docId: string) => {
    try {
      const response = await fetch(`https://weapply.onrender.com/api/v1/documents/generated/${docId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `document-${docId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const renderTabContent = () => {
    const needsJobDescription = ['cover-letter', 'tailored-resume', 'interview-questions'].includes(activeTab);
    
    return (
      <div className="space-y-6">
        {/* Resume Selection */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Select Resume</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resumes.map((resume) => (
              <div
                key={resume.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  selectedResume === resume.id
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-600 hover:border-gray-500 bg-gray-700/50'
                }`}
                onClick={() => setSelectedResume(resume.id)}
              >
                <div className="flex items-center space-x-3">
                  <FileText className="text-blue-400" size={20} />
                  <div>
                    <p className="text-white font-medium">{resume.name}</p>
                    <p className="text-gray-400 text-sm">{resume.uploadDate} • {resume.fileSize}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Job Description Selection (if needed) */}
        {needsJobDescription && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Select Job Description</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jobDescriptions.map((jd) => (
                <div
                  key={jd.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    selectedJobDescription === jd.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-600 hover:border-gray-500 bg-gray-700/50'
                  }`}
                  onClick={() => setSelectedJobDescription(jd.id)}
                >
                  <div className="flex items-center space-x-3">
                    <Briefcase className="text-green-400" size={20} />
                    <div>
                      <p className="text-white font-medium">{jd.title}</p>
                      <p className="text-gray-400 text-sm">{jd.company} • {jd.createdDate}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generate Button */}
        <div className="flex justify-center">
          <button
            onClick={handleGenerate}
            disabled={loading || !selectedResume || (needsJobDescription && !selectedJobDescription)}
            className="px-8 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
          >
            {loading ? (
              <>
                <RefreshCw className="animate-spin" size={20} />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Plus size={20} />
                <span>Generate {tabs.find(t => t.id === activeTab)?.label}</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  };


  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="opacity-0 animate-fade-in" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
          <div className="flex items-center space-x-4 mb-6">
            <button 
              className="cursor-pointer text-gray-400 hover:text-white transition-colors"
              onClick={() => router.back()}
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-3xl font-bold text-white">Document Generation</h1>
          </div>
        </div>

        {/* Upload Zone */}
        <div className="opacity-0 animate-fade-in bg-gray-800 rounded-2xl border border-gray-700 p-8" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
          <h2 className="text-xl font-bold text-white mb-6">Upload New Resume</h2>
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-gray-500 transition-colors duration-200">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-gray-300 text-lg mb-2">Upload your resume</p>
              <p className="text-gray-500">PDF, DOC, or DOCX files supported</p>
            </label>
          </div>
        </div>

        {/* Tabs */}
        <div className="opacity-0 animate-fade-in" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
          <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-md transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <tab.icon size={18} />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="opacity-0 animate-fade-in" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
          {renderTabContent()}
        </div>

        {/* Generated Documents */}
        <div className="opacity-0 animate-fade-in bg-gray-800 rounded-2xl border border-gray-700 p-8" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
          <h2 className="text-xl font-bold text-white mb-6">Generated Documents</h2>
          <div className="space-y-4">
            {generatedDocuments.map((doc, index) => (
              <div
                key={doc.id}
                className="opacity-0 animate-fade-in bg-gray-700/50 rounded-lg p-4 flex items-center justify-between hover:bg-gray-700 transition-colors duration-200"
                style={{ animationDelay: `${0.5 + index * 0.1}s`, animationFillMode: 'forwards' }}
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    {doc.type === 'resume-rewrite' && <FileText className="text-blue-400" size={20} />}
                    {doc.type === 'cover-letter' && <Edit3 className="text-green-400" size={20} />}
                    {doc.type === 'tailored-resume' && <Briefcase className="text-purple-400" size={20} />}
                    {doc.type === 'interview-questions' && <MessageSquare className="text-orange-400" size={20} />}
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{doc.title}</h3>
                    <p className="text-gray-400 text-sm">{doc.createdDate}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    {doc.status === 'completed' && <CheckCircle className="text-green-400" size={16} />}
                    {doc.status === 'processing' && <RefreshCw className="text-yellow-400 animate-spin" size={16} />}
                    {doc.status === 'failed' && <AlertCircle className="text-red-400" size={16} />}
                    <span className={`text-sm capitalize ${
                      doc.status === 'completed' ? 'text-green-400' :
                      doc.status === 'processing' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {doc.status}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => console.log('View document:', doc.id)}
                      className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleDownload(doc.id)}
                      className="p-2 text-gray-400 hover:text-green-400 transition-colors"
                      disabled={doc.status !== 'completed'}
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
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