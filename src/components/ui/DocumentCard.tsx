import { FileText, Download, Edit, Trash2 } from 'lucide-react'
import { Document } from '../../lib/data'

interface DocumentCardProps {
  document: Document;
  onEdit?: (id: string) => void;
  onDownload?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function DocumentCard({ document, onEdit, onDownload, onDelete }: DocumentCardProps) {
  const getTypeIcon = (type: Document['type']) => <FileText size={20} />;
  
  const getTypeLabel = (type: Document['type']) => ({
    'resume': 'Resume',
    'cover-letter': 'Cover Letter',
    'interview-questions': 'Interview Questions',
    'tailored-resume': 'Tailored Resume'
  })[type];

  const getTypeColor = (type: Document['type']) => ({
    'resume': 'bg-blue-900 text-blue-300',
    'cover-letter': 'bg-green-900 text-green-300',
    'interview-questions': 'bg-purple-900 text-purple-300',
    'tailored-resume': 'bg-orange-900 text-orange-300'
  })[type];

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 group hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${getTypeColor(document.type)}`}>{getTypeIcon(document.type)}</div>
          <div>
            <h3 className="font-semibold text-white truncate">{document.name}</h3>
            <p className="text-sm text-gray-300">{getTypeLabel(document.type)}</p>
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center text-sm text-gray-400 mb-4">
        <span>{document.createdAt.toLocaleDateString()}</span>
        <span>{document.updatedAt.toLocaleTimeString()}</span>
      </div>
      <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {onEdit && <button onClick={() => onEdit(document.id)} className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 bg-blue-900 hover:bg-blue-800 text-blue-300 rounded-lg transition-colors duration-200"><Edit size={16} /><span>Edit</span></button>}
        {onDownload && <button onClick={() => onDownload(document.id)} className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 bg-green-900 hover:bg-green-800 text-green-300 rounded-lg transition-colors duration-200"><Download size={16} /><span>Download</span></button>}
        {onDelete && <button onClick={() => onDelete(document.id)} className="flex items-center justify-center p-2 bg-red-900 hover:bg-red-800 text-red-300 rounded-lg transition-colors duration-200"><Trash2 size={16} /></button>}
      </div>
    </div>
  );
}