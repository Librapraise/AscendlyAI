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
  avatar?: string
}

export interface ActionCard {
  id: string
  title: string
  description: string
  icon: string
  route: string
  gradient: string
}