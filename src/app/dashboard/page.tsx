"use client";

import { useState } from 'react';
import { Plus } from 'lucide-react';

import UploadZone from '@/components/ui/UploadZone';
import ActionCard from '@/components/ui/ActionCard';
import DocumentCard from '@/components/ui/DocumentCard';
import { Document, mockDocuments, actionCards } from '@/lib/data';

export default function DashboardPage() {
  const [documents] = useState<Document[]>(mockDocuments);

  // Handlers
  const handleNavigation = (route: string) => console.log('Navigate to:', route);
  const handleFileUpload = (file: File) => console.log('File uploaded:', file.name);
  const handleDocumentEdit = (id: string) => console.log('Edit document:', id);
  const handleDocumentDownload = (id: string) => console.log('Download document:', id);
  const handleDocumentDelete = (id: string) => console.log('Delete document:', id);

  return (
    <div className="space-y-8">
        {/* Upload Zone */}
        <div className="opacity-0 animate-fade-in" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
            <UploadZone onFileUpload={handleFileUpload} />
        </div>

        {/* Action Cards */}
        <div className="opacity-0 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
            <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {actionCards.map((card, index) => (
                <div key={card.id} className="opacity-0 animate-fade-in" style={{ animationDelay: `${0.2 + index * 0.1}s`, animationFillMode: 'forwards' }}>
                    <ActionCard {...card} onClick={() => handleNavigation(card.route)} />
                </div>
            ))}
            </div>
        </div>

        {/* Recent Documents */}
        <div className="opacity-0 animate-fade-in bg-gray-800 rounded-2xl border border-gray-700 p-8" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Recent Documents</h2>
                <button className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200">
                    View All
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {documents.map((doc, index) => (
                    <div key={doc.id} className="opacity-0 animate-fade-in" style={{ animationDelay: `${0.4 + index * 0.1}s`, animationFillMode: 'forwards' }}>
                        <DocumentCard document={doc} onEdit={handleDocumentEdit} onDownload={handleDocumentDownload} onDelete={handleDocumentDelete} />
                    </div>
                ))}
            </div>
        </div>

        {/* Floating Action Button */}
        <button
            className="fixed bottom-8 right-8 w-14 h-14 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all duration-300 z-40 hover:scale-110"
            onClick={() => console.log('Quick action')}
        >
            <Plus size={24} />
        </button>

        {/* Footer */}
      <div className="text-center text-gray-500 text-sm mt-12">
        <p>© 2025 AscendlyAI. All rights reserved.</p>
      </div>
    </div>
  );
}