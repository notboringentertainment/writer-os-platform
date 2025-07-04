// Common types used across the application

export type ElementType = 'scene_heading' | 'action' | 'character' | 'dialogue' | 'parenthetical' | 'transition' | 'shot'

export interface ScriptElement {
  id: string
  type: ElementType
  content: string
}

export interface WritingProfile {
  originalResponses: Record<string, string>
  refinementResponses?: Record<string, string>
  initialAnalysis?: string
  finalPartnership?: string
  timestamp: string
  assessmentType?: 'free' | 'pro'
}

export interface Project {
  id: string
  title: string
  type: 'screenplay' | 'character' | 'scene' | 'structure' | 'bible' | 'outline' | 'synopsis' | 'characters'
  content: ScriptElement[] | Record<string, unknown> // Can be ScriptElement[] for screenplays or other content types
  description: string
  createdAt: string
  lastUpdated: string
  wordCount: number
  pageCount: number
}