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
} from "lucide-react";

export default function DocumentManagementPage() {
  const [activeTab, setActiveTab] = useState("upload");
  const [resumes, setResumes] = useState<any[]>([]);
  const [jobDescriptions, setJobDescriptions] = useState<any[]>([]);
  const [generatedDocs, setGeneratedDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [showJobForm, setShowJobForm] = useState(false);
  const [jobForm, setJobForm] = useState({ title: "", company: "", description: "" });
  const [uploadedFilePreviews, setUploadedFilePreviews] = useState<{[key: string]: string}>({});
  const [error, setError] = useState("");

  const fileInput = useRef<HTMLInputElement>(null);

  // File preview function
  const generateFilePreview = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const result = e.target?.result as string;
        
        if (file.type === 'text/plain') {
          resolve(result);
        } else if (file.type === 'application/pdf') {
          // For PDF files, we can't easily extract text client-side
          // But we can show file metadata
          resolve(`PDF Document: ${file.name}\nSize: ${(file.size / 1024).toFixed(2)} KB\nUploaded: ${new Date().toLocaleString()}\n\nNote: Full content extraction requires server processing.`);
        } else if (file.type.includes('word') || file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
          // For Word documents, show metadata
          resolve(`Word Document: ${file.name}\nSize: ${(file.size / 1024).toFixed(2)} KB\nUploaded: ${new Date().toLocaleString()}\n\nNote: Full content extraction requires server processing.`);
        } else {
          resolve(`File: ${file.name}\nType: ${file.type}\nSize: ${(file.size / 1024).toFixed(2)} KB\nUploaded: ${new Date().toLocaleString()}`);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      
      // Try to read as text first
      if (file.type === 'text/plain') {
        reader.readAsText(file);
      } else {
        // For binary files, just show metadata
        const metadata = `File: ${file.name}\nType: ${file.type}\nSize: ${(file.size / 1024).toFixed(2)} KB\nUploaded: ${new Date().toLocaleString()}`;
        resolve(metadata);
      }
    });
  };

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [rRes, jRes, gRes] = await Promise.all([
        fetch("https://weapply.onrender.com/api/v1/documents/resumes/").then(r => {
          if (!r.ok) throw new Error('Failed to fetch resumes');
          return r.json();
        }),
        fetch("https://weapply.onrender.com/api/v1/documents/job-descriptions/").then(r => {
          if (!r.ok) throw new Error('Failed to fetch job descriptions');
          return r.json();
        }),
        fetch("https://weapply.onrender.com/api/v1/documents/generated/").then(r => {
          if (!r.ok) throw new Error('Failed to fetch generated documents');
          return r.json();
        }),
      ]);
      setResumes(rRes);
      setJobDescriptions(jRes);
      setGeneratedDocs(gRes);
    } catch (err) {
      console.error(err);
      setError("Failed to load documents. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function uploadFiles(files: FileList) {
    if (!files.length) return;
    setLoading(true);
    setError("");
    
    try {
      const uploadPromises = [];
      const previewPromises = [];
      const newPreviews: {[key: string]: string} = {};
      
for (const file of Array.from(files)) {
  // Validate file type
  const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
  const validExtensions = ['.pdf', '.doc', '.docx', '.txt'];
  const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  
  if (!validTypes.includes(file.type) && !hasValidExtension) {
    throw new Error(`Invalid file type: ${file.name}. Please upload PDF, DOC, DOCX, or TXT files.`);
  }
  
  // Generate preview
  previewPromises.push(
    generateFilePreview(file).then(preview => {
      newPreviews[file.name] = preview;
      return preview;
    })
  );

  // Upload file
  const fd = new FormData();
  fd.append("file", file);
  uploadPromises.push(
    fetch("https://weapply.onrender.com/api/v1/documents/resumes/", {
      method: "POST",
      body: fd,
    }).then(r => {
      if (!r.ok) throw new Error(`Failed to upload ${file.name}`);
      return r.json();
    })
  );
}
      
      // Wait for previews to be generated
      await Promise.all(previewPromises);
      setUploadedFilePreviews(prev => ({ ...prev, ...newPreviews }));
      
      // Wait for uploads to complete
      await Promise.all(uploadPromises);
      
      // Reload data
      await loadData();
      
      // Show success message
      setError("");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to upload files. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function createJobDesc() {
    const { title, company, description } = jobForm;
    if (!title || !company || !description) {
      setError("Please fill in all job description fields.");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch("https://weapply.onrender.com/api/v1/documents/job-descriptions/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jobForm),
      });
      
      if (!response.ok) {
        throw new Error("Failed to create job description");
      }
      
      setShowJobForm(false);
      setJobForm({ title: "", company: "", description: "" });
      await loadData();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create job description.");
    } finally {
      setLoading(false);
    }
  }

  async function downloadDoc(id: string, type: 'resume' | 'generated' = 'generated') {
    try {
      const endpoint = type === 'resume' 
        ? `https://weapply.onrender.com/api/v1/documents/resumes/${id}/download`
        : `https://weapply.onrender.com/api/v1/documents/generated/${id}/download`;
        
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error('Download failed');
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `doc-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError("Failed to download document.");
    }
  }

  async function saveEdit() {
    if (!selectedDocument) return;
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch(`https://weapply.onrender.com/api/v1/documents/generated/${selectedDocument.id}/content`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to save changes");
      }
      
      setIsEditing(false);
      await loadData();
      
      // Update selected document
      setSelectedDocument((prev: any) => ({ ...prev, content: editContent }));
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to save changes.");
    } finally {
      setLoading(false);
    }
  }

  const filtered = (arr: any[]) =>
    arr.filter((d) =>
      Object.values(d).some((v: any) =>
        String(v).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

  const handleDocumentSelect = (doc: any) => {
    setSelectedDocument(doc);
    setEditContent(doc.content || doc.description || "");
    setActiveTab("viewer");
  };

  const getDocumentContent = (doc: any) => {
    // Try to get content from various sources
    if (doc.content) return doc.content;
    if (doc.description) return doc.description;
    if (uploadedFilePreviews[doc.filename]) return uploadedFilePreviews[doc.filename];
    return "No content available. Content extraction may require server-side processing for this file type.";
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <button onClick={() => window.history.back()} className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold">Document Management</h1>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-900/50 border border-red-500 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
          <p className="text-red-200">{error}</p>
          <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-300">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="mb-6 bg-blue-900/50 border border-blue-500 rounded-lg p-4 text-center">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full mr-3"></div>
          <span className="text-blue-200">Processing...</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 bg-gray-800 p-1 rounded-xl mb-6">
        {[
          { id: "upload", label: "Upload", icon: Upload },
          { id: "documents", label: "My Documents", icon: FileText },
          { id: "viewer", label: "Editor", icon: Eye },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg transition-all duration-200 ${
              activeTab === t.id
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                : "text-gray-400 hover:bg-gray-700 hover:text-white"
            }`}
          >
            <t.icon size={20} />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Upload Tab */}
      {activeTab === "upload" && (
        <div className="flex flex-col gap-6">
          <div 
            className="bg-gray-800 rounded-2xl border-2 border-dashed border-gray-600 p-8 text-center hover:border-blue-500 transition-all duration-300 cursor-pointer"
            onClick={() => fileInput.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add('border-blue-500');
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('border-blue-500');
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('border-blue-500');
              if (e.dataTransfer.files) {
                uploadFiles(e.dataTransfer.files);
              }
            }}
          >
            <Upload size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">Upload Resume</h3>
            <p className="text-gray-400 mb-4">Drag & drop your resume or click to select files</p>
            <p className="text-sm text-gray-500 mb-4">Supported formats: PDF, DOC, DOCX, TXT</p>
            <input
              ref={fileInput}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt"
              className="hidden"
              onChange={(e) => e.target.files && uploadFiles(e.target.files)}
            />
            <button
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Uploading..." : "Select Files"}
            </button>
          </div>

          {/* Job Description Form */}
          <div className="bg-gray-800 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Job Descriptions</h3>
              <button
                onClick={() => setShowJobForm(!showJobForm)}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus size={20} />
                <span>Add Job Description</span>
              </button>
            </div>
            
            {showJobForm && (
              <div className="bg-gray-700 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium">New Job Description</h4>
                  <button 
                    onClick={() => setShowJobForm(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      placeholder="Job Title"
                      value={jobForm.title}
                      onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                      className="bg-gray-600 p-3 rounded-lg border border-gray-500 focus:border-blue-500 focus:outline-none transition-colors"
                    />
                    <input
                      placeholder="Company Name"
                      value={jobForm.company}
                      onChange={(e) => setJobForm({ ...jobForm, company: e.target.value })}
                      className="bg-gray-600 p-3 rounded-lg border border-gray-500 focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>
                  <textarea
                    placeholder="Job Description"
                    value={jobForm.description}
                    onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                    rows={4}
                    className="w-full bg-gray-600 p-3 rounded-lg border border-gray-500 focus:border-blue-500 focus:outline-none transition-colors resize-vertical"
                  />
                  <div className="flex gap-3">
                    <button 
                      onClick={createJobDesc} 
                      disabled={loading || !jobForm.title || !jobForm.company || !jobForm.description}
                      className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? "Creating..." : "Create"}
                    </button>
                    <button 
                      onClick={() => setShowJobForm(false)}
                      className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* My Documents */}
      {activeTab === "documents" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search size={20} className="absolute left-3 top-3 text-gray-400" />
              <input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-800 pl-10 p-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>
            <button className="bg-gray-800 p-3 rounded-lg hover:bg-gray-700 border border-gray-700 hover:border-gray-600 transition-colors flex items-center justify-center">
              <Filter size={20} />
            </button>
          </div>

          {[
            { name: "Resumes", data: filtered(resumes), type: "resume" }, 
            { name: "Job Descriptions", data: filtered(jobDescriptions), type: "job" }, 
            { name: "Generated Documents", data: filtered(generatedDocs), type: "generated" }
          ].map(section => (
            <div key={section.name} className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h3 className="font-semibold text-gray-200 mb-4">
                {section.name} ({section.data.length})
              </h3>
              
              {section.data.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <FileText size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No {section.name.toLowerCase()} found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {section.data.map((doc) => (
                    <div key={doc.id} className="bg-gray-700 border border-gray-600 p-4 rounded-lg hover:bg-gray-650 transition-colors">
                      <div className="mb-3">
                        <h4 className="font-medium truncate text-white mb-1">
                          {doc.filename || doc.title || 'Untitled'}
                        </h4>
                        <p className="text-xs text-gray-400">
                          {doc.company && `${doc.company} • `}
                          {new Date(doc.uploadedAt || doc.createdAt || Date.now()).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleDocumentSelect(doc)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg transition-colors text-sm"
                        >
                          <Eye size={14} className="inline mr-1" />
                          View
                        </button>
                        <button 
                          onClick={() => downloadDoc(doc.id, section.type as any)}
                          className="bg-gray-600 hover:bg-gray-500 p-2 rounded-lg transition-colors"
                          title="Download"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Document Editor/Viewer */}
      {activeTab === "viewer" && (
        <div>
          {selectedDocument ? (
            <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
              <header className="bg-gray-750 p-6 border-b border-gray-700">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-1">
                      {selectedDocument.title || selectedDocument.filename || 'Document'}
                    </h3>
                    {selectedDocument.company && (
                      <p className="text-sm text-gray-400">{selectedDocument.company}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedDocument.uploadedAt || selectedDocument.createdAt 
                        ? `Created: ${new Date(selectedDocument.uploadedAt || selectedDocument.createdAt).toLocaleString()}`
                        : ''
                      }
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!isEditing ? (
                      <button 
                        onClick={() => {
                          setIsEditing(true);
                          setEditContent(getDocumentContent(selectedDocument));
                        }}
                        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                      >
                        <Edit size={18} />
                        <span>Edit</span>
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={saveEdit} 
                          disabled={loading}
                          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
                        >
                          {loading ? "Saving..." : "Save"}
                        </button>
                        <button 
                          onClick={() => {
                            setIsEditing(false);
                            setEditContent("");
                          }}
                          className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    <button 
                      onClick={() => downloadDoc(selectedDocument.id)}
                      className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <Download size={18} />
                      <span className="hidden sm:inline">Download</span>
                    </button>
                  </div>
                </div>
              </header>

              <div className="p-6">
                <div className="min-h-[400px] bg-gray-700 border border-gray-600 rounded-lg">
                  {isEditing ? (
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full h-96 bg-gray-600 border border-gray-500 p-4 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none resize-vertical"
                      placeholder="Enter document content..."
                    />
                  ) : (
                    <div className="p-4 h-96 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-gray-200 font-mono text-sm leading-relaxed">
                        {getDocumentContent(selectedDocument)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-800 border border-gray-700 p-12 rounded-lg text-center">
              <Eye size={64} className="mx-auto mb-6 text-gray-400 opacity-50" />
              <h3 className="text-xl font-semibold text-gray-300 mb-2">No Document Selected</h3>
              <p className="text-gray-400 mb-6">Select a document from the "My Documents" tab to view or edit it</p>
              <button 
                onClick={() => setActiveTab("documents")}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors"
              >
                Browse Documents
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}