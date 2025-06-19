import { useState } from 'react'
import { Upload, CheckCircle } from 'lucide-react'

interface UploadZoneProps {
  onFileUpload: (file: File) => void;
}

export default function UploadZone({ onFileUpload }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = Array.from(e.dataTransfer.files)[0]
    if (file && (file.type === 'application/pdf' || file.type.includes('document'))) {
      setIsUploading(true)
      setTimeout(() => {
        onFileUpload(file)
        setIsUploading(false)
      }, 1500)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIsUploading(true)
      setTimeout(() => {
        onFileUpload(file)
        setIsUploading(false)
      }, 1500)
    }
  }

  return (
    <div
      className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 hover:border-blue-400 bg-gray-800 ${isDragOver ? 'border-blue-500 scale-105' : 'border-gray-600'}`}
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
    >
      <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileSelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
      <div className="flex flex-col items-center space-y-4">
        <div className="text-gray-400">
          {isUploading ? <CheckCircle size={64} className="text-green-500 animate-pulse" /> : <Upload size={64} />}
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">{isUploading ? 'Processing...' : 'Drop your resume here or click to upload'}</h3>
          <p className="text-gray-300 text-sm">{isUploading ? 'Your file is being processed' : 'Support for PDF and DOCX files'}</p>
        </div>
      </div>
    </div>
  )
}