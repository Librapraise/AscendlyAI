import {
  Sparkles,
  Mail,
  Target,
  MessageCircle,
} from 'lucide-react'

// Types
export interface Document {
  id: string
  name: string
  type: 'resume' | 'cover-letter' | 'interview-questions' | 'tailored-resume'
  createdAt: Date
  updatedAt: Date
  content?: string
  originalFileName?: string
}

export interface User {
  id: string
  email: string
  name: string
}

// Mock data
export const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'Software Engineer Resume v2',
    type: 'resume',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    id: '2',
    name: 'Google Cover Letter',
    type: 'cover-letter',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
  },
  {
    id: '3',
    name: 'Frontend Interview Prep',
    type: 'interview-questions',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  },
  {
    id: '4',
    name: 'Data Analyst Resume',
    type: 'tailored-resume',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  }
]

export const actionCards = [
  {
    id: 'resume-rewrite',
    title: 'Rewrite Resume',
    description: 'Transform your existing resume with AI-powered improvements and professional formatting',
    icon: Sparkles,
    route: '/resume/rewrite',
    lightColor: 'bg-blue-50',
    textColor: 'text-blue-600'
  },
  {
    id: 'cover-letter',
    title: 'Generate Cover Letter',
    description: 'Create compelling, personalized cover letters tailored to specific job postings',
    icon: Mail,
    route: '/cover-letter/generate',
    lightColor: 'bg-green-50',
    textColor: 'text-green-600'
  },
  {
    id: 'tailor-resume',
    title: 'Tailor Resume',
    description: 'Customize your resume to match specific job descriptions and requirements',
    icon: Target,
    route: '/resume/tailor',
    lightColor: 'bg-orange-50',
    textColor: 'text-orange-600'
  },
  {
    id: 'interview-questions',
    title: 'Interview Questions',
    description: 'Generate targeted interview questions and practice answers for your target role',
    icon: MessageCircle,
    route: '/interview/questions',
    lightColor: 'bg-purple-50',
    textColor: 'text-purple-600'
  }
]