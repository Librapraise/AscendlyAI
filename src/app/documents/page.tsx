"use client";

import { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Eye, Edit, Download, Trash2, Plus, Search, Filter, X } from 'lucide-react';

// Mock API functions - replace with actual API calls
const api = {
  async uploadResume(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    // return fetch('/api/v1/documents/resumes/', { method: 'POST', body: formData });
    return new Promise(resolve => setTimeout(() => resolve({ id: Date.now(), filename: file.name }), 1000));
  },
  
  async getResumes() {
    // return fetch('/api/v1/documents/resumes/').then(r => r.json());
    return mockResumes;
  },
  
  async getJobDescriptions() {
    // return fetch('/api/v1/documents/job-descriptions/').then(r => r.json());
    return mockJobDescriptions;
  },
  
  async createJobDescription(data: any) {
    // return fetch('/api/v1/documents/job-descriptions/', { method: 'POST', body: JSON.stringify(data) });
    return new Promise(resolve => setTimeout(() => resolve({ id: Date.now(), ...data }), 500));
  },
  
  async getGeneratedDocuments() {
    // return fetch('/api/v1/documents/generated/').then(r => r.json());
    return mockGeneratedDocs;
  },
  
  async downloadDocument(docId: string) {
    // return fetch(`/api/v1/documents/generated/${docId}/download`);
    console.log('Downloading document:', docId);
  },
  
  async updateDocumentContent(docId: string, content: string) {
    // return fetch(`/api/v1/documents/generated/${docId}/content`, { method: 'PATCH', body: JSON.stringify({ content }) });
    return new Promise(resolve => setTimeout(() => resolve({ id: docId, content }), 500));
  }
};

// Mock data
const mockResumes = [
  { id: '1', filename: 'john_doe_resume.pdf', uploadedAt: '2024-01-15', status: 'processed', extractedText: 'Resume content...' },
  { id: '2', filename: 'jane_smith_cv.docx', uploadedAt: '2024-01-10', status: 'processing', extractedText: null },
];

const mockJobDescriptions = [
  { id: '1', title: 'Senior Frontend Developer', company: 'TechCorp', description: 'Looking for an experienced...', createdAt: '2024-01-12' },
  { id: '2', title: 'Product Manager', company: 'StartupXYZ', description: 'We need a product manager...', createdAt: '2024-01-08' },
];

const mockGeneratedDocs = [
  { id: '1', type: 'cover_letter', title: 'Cover Letter - TechCorp', status: 'completed', createdAt: '2024-01-16', content: 'Dear Hiring Manager...' },
  { id: '2', type: 'tailored_resume', title: 'Tailored Resume - StartupXYZ', status: 'completed', createdAt: '2024-01-14', content: 'Professional Summary...' },
];

export default function DocumentManagementPage() {
  const [activeTab, setActiveTab] = useState('upload');
  type Resume = { id: string; filename: string; uploadedAt: string; status: string; extractedText: string | null };
  type JobDescription = { id: string; title: string; company: string; description: string; createdAt: string };
  type GeneratedDoc = { id: string; type: string; title: string; status: string; createdAt: string; content: string };

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  type DocumentType = Resume | JobDescription | GeneratedDoc | null;
  const [selectedDocument, setSelectedDocument] = useState<DocumentType>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [showJobDescriptionForm, setShowJobDescriptionForm] = useState(false);
  const [jobDescriptionForm, setJobDescriptionForm] = useState({
    title: '',
    company: '',
    description: ''
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resumesData, jobDescData, generatedData] = await Promise.all([
        api.getResumes(),
        api.getJobDescriptions(),
        api.getGeneratedDocuments()
      ]);
      setResumes(resumesData);
      setJobDescriptions(jobDescData);
      setGeneratedDocs(generatedData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;
    
    setLoading(true);
    try {
      for (const file of Array.from(files)) {
        await api.uploadResume(file);
      }
      await loadData();
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJobDescription = async () => {
    if (!jobDescriptionForm.title || !jobDescriptionForm.company || !jobDescriptionForm.description) {
      return;
    }
    
    setLoading(true);
    try {
      await api.createJobDescription(jobDescriptionForm);
      setJobDescriptionForm({ title: '', company: '', description: '' });
      setShowJobDescriptionForm(false);
      await loadData();
    } catch (error) {
      console.error('Error creating job description:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentView = (doc: any) => {
    setSelectedDocument(doc);
    setEditContent(doc.content || doc.description || '');
    setIsEditing(false);
  };

  const handleDocumentEdit = async () => {
    if (!selectedDocument) return;
    
    setLoading(true);
    try {
      await api.updateDocumentContent(selectedDocument.id, editContent);
      await loadData();
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating document:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredResumes = resumes.filter(resume => 
    resume.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredJobDescriptions = jobDescriptions.filter(jd => 
    jd.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    jd.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGeneratedDocs = generatedDocs.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Document Management</h1>
          <p className="text-gray-400">Upload, organize, and manage your career documents</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-gray-800 p-1 rounded-xl mb-8">
          {[
            { id: 'upload', label: 'Upload Resume', icon: Upload },
            { id: 'documents', label: 'My Documents', icon: FileText },
            { id: 'viewer', label: 'Document Viewer/Editor', icon: Eye }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all duration-200 ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <tab.icon size={20} />
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Upload Resume Tab */}
        {activeTab === 'upload' && (
          <div className="space-y-6 animate-fade-in">
            {/* Upload Zone */}
            <div className="bg-gray-800 rounded-2xl border-2 border-dashed border-gray-600 p-12 text-center hover:border-blue-500 transition-colors duration-300">
              <Upload size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">Upload Your Resume</h3>
              <p className="text-gray-400 mb-6">Drag and drop your resume or click to browse</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  if (e.target.files) {
                    handleFileUpload(e.target.files);
                  }
                }}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50"
              >
                {loading ? 'Uploading...' : 'Choose Files'}
              </button>
              <p className="text-sm text-gray-500 mt-4">Supported formats: PDF, DOC, DOCX</p>
            </div>

            {/* Create Job Description */}
            <div className="bg-gray-800 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Job Descriptions</h3>
                <button
                  onClick={() => setShowJobDescriptionForm(true)}
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
                >
                  <Plus size={20} />
                  <span>Add Job Description</span>
                </button>
              </div>
              
              {showJobDescriptionForm && (
                <div className="space-y-4 bg-gray-700 p-6 rounded-xl">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium">New Job Description</h4>
                    <button
                      onClick={() => setShowJobDescriptionForm(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Job Title"
                      value={jobDescriptionForm.title}
                      onChange={(e) => setJobDescriptionForm({...jobDescriptionForm, title: e.target.value})}
                      className="bg-gray-600 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Company Name"
                      value={jobDescriptionForm.company}
                      onChange={(e) => setJobDescriptionForm({...jobDescriptionForm, company: e.target.value})}
                      className="bg-gray-600 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <textarea
                    placeholder="Job Description"
                    value={jobDescriptionForm.description}
                    onChange={(e) => setJobDescriptionForm({...jobDescriptionForm, description: e.target.value})}
                    rows={6}
                    className="w-full bg-gray-600 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  />
                  <div className="flex space-x-3">
                    <button
                      onClick={handleCreateJobDescription}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50"
                    >
                      {loading ? 'Creating...' : 'Create Job Description'}
                    </button>
                    <button
                      onClick={() => setShowJobDescriptionForm(false)}
                      className="bg-gray-600 hover:bg-gray-500 px-6 py-2 rounded-lg transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* My Documents Tab */}
        {activeTab === 'documents' && (
          <div className="space-y-6 animate-fade-in">
            {/* Search and Filter */}
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-800 pl-10 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <button className="bg-gray-800 p-3 rounded-lg hover:bg-gray-700 transition-colors duration-200">
                <Filter size={20} />
              </button>
            </div>

            {/* Document Categories */}
            <div className="grid gap-8">
              {/* Resumes */}
              <div className="bg-gray-800 rounded-2xl p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                  <FileText className="text-blue-400" />
                  <span>Resumes ({filteredResumes.length})</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredResumes.map(resume => (
                    <div key={resume.id} className="bg-gray-700 p-4 rounded-xl hover:bg-gray-600 transition-colors duration-200">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium truncate">{resume.filename}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          resume.status === 'processed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {resume.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-3">Uploaded: {resume.uploadedAt}</p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDocumentView(resume)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 px-3 rounded-lg text-sm transition-colors duration-200"
                        >
                          View
                        </button>
                        <button
                          onClick={() => api.downloadDocument(resume.id)}
                          className="bg-gray-600 hover:bg-gray-500 p-2 rounded-lg transition-colors duration-200"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Job Descriptions */}
              <div className="bg-gray-800 rounded-2xl p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                  <FileText className="text-green-400" />
                  <span>Job Descriptions ({filteredJobDescriptions.length})</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredJobDescriptions.map(jd => (
                    <div key={jd.id} className="bg-gray-700 p-4 rounded-xl hover:bg-gray-600 transition-colors duration-200">
                      <h4 className="font-medium mb-1">{jd.title}</h4>
                      <p className="text-sm text-blue-400 mb-2">{jd.company}</p>
                      <p className="text-sm text-gray-400 mb-3">Created: {jd.createdAt}</p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDocumentView(jd)}
                          className="flex-1 bg-green-600 hover:bg-green-700 py-2 px-3 rounded-lg text-sm transition-colors duration-200"
                        >
                          View
                        </button>
                        <button className="bg-gray-600 hover:bg-gray-500 p-2 rounded-lg transition-colors duration-200">
                          <Edit size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Generated Documents */}
              <div className="bg-gray-800 rounded-2xl p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center space-x-2">
                  <FileText className="text-purple-400" />
                  <span>Generated Documents ({filteredGeneratedDocs.length})</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredGeneratedDocs.map(doc => (
                    <div key={doc.id} className="bg-gray-700 p-4 rounded-xl hover:bg-gray-600 transition-colors duration-200">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{doc.title}</h4>
                        <span className="px-2 py-1 text-xs rounded-full bg-purple-500/20 text-purple-400">
                          {doc.type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-3">Created: {doc.createdAt}</p>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDocumentView(doc)}
                          className="flex-1 bg-purple-600 hover:bg-purple-700 py-2 px-3 rounded-lg text-sm transition-colors duration-200"
                        >
                          View
                        </button>
                        <button
                          onClick={() => api.downloadDocument(doc.id)}
                          className="bg-gray-600 hover:bg-gray-500 p-2 rounded-lg transition-colors duration-200"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Document Viewer/Editor Tab */}
        {activeTab === 'viewer' && (
          <div className="animate-fade-in">
            {selectedDocument ? (
              <div className="bg-gray-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {'title' in selectedDocument
                        ? selectedDocument.title
                        : 'filename' in selectedDocument
                        ? selectedDocument.filename
                        : ''}
                    </h3>
                    <p className="text-gray-400">
                      {'company' in selectedDocument ? selectedDocument.company : 'Document'}
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
                      >
                        <Edit size={20} />
                        <span>Edit</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={handleDocumentEdit}
                          disabled={loading}
                          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50"
                        >
                          {loading ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg transition-colors duration-200"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => api.downloadDocument(selectedDocument.id)}
                      className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
                    >
                      <Download size={20} />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
                
                <div className="bg-gray-700 rounded-xl p-6">
                  {isEditing ? (
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full h-96 bg-gray-600 p-4 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-sm"
                      placeholder="Document content..."
                    />
                  ) : (
                    <div className="prose prose-invert max-w-none">
                      <pre className="whitespace-pre-wrap text-sm text-gray-200">
                        {editContent || 'No content available'}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-2xl p-12 text-center">
                <Eye size={48} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">No Document Selected</h3>
                <p className="text-gray-400">Select a document from the "My Documents" tab to view or edit it</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}