// Storage utilities for AuthenticVoice writing profiles and projects

export interface WritingProfile {
    originalResponses: Record<string, string>;
    initialAnalysis: string;
    refinementResponses: Record<string, string>;
    finalPartnership: string;
    assessmentType?: 'free' | 'pro';
    createdAt: string;
    lastUpdated: string;
  }
  
  export interface ScriptElement {
    id: string;
    type: 'scene_heading' | 'action' | 'character' | 'dialogue' | 'parenthetical' | 'transition' | 'shot';
    content: string;
  }
  
  export interface Project {
    id: string;
    title: string;
    type: 'screenplay' | 'character' | 'scene' | 'structure';
    content: ScriptElement[] | any; // Will be typed more specifically per project type
    shadowContent?: ScriptElement[]; // Shadow writer's alternative versions
    description: string;
    createdAt: string;
    lastUpdated: string;
    wordCount: number;
    pageCount: number;
  }
  
  export const STORAGE_KEY = 'authenticvoice_profile';
  export const PROJECTS_KEY = 'authenticvoice_projects';
  
  // Save writing profile to localStorage
  export function saveWritingProfile(profile: Partial<WritingProfile>): void {
    try {
      const existingProfile = getWritingProfile();
      const updatedProfile: WritingProfile = {
        ...existingProfile,
        ...profile,
        lastUpdated: new Date().toISOString(),
        createdAt: existingProfile?.createdAt || new Date().toISOString(),
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile));
    } catch (error) {
      console.error('Failed to save writing profile:', error);
    }
  }
  
  // Load writing profile from localStorage
  export function getWritingProfile(): WritingProfile | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      
      return JSON.parse(stored) as WritingProfile;
    } catch (error) {
      console.error('Failed to load writing profile:', error);
      return null;
    }
  }
  
  // Check if user has completed assessment
  export function hasCompletedAssessment(): boolean {
    const profile = getWritingProfile();
    return !!(profile?.finalPartnership);
  }
  
  // Clear writing profile (for reset/logout)
  export function clearWritingProfile(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear writing profile:', error);
    }
  }
  
  // Get just the final partnership analysis
  export function getFinalPartnership(): string | null {
    const profile = getWritingProfile();
    return profile?.finalPartnership || null;
  }
  
  // PROJECT MANAGEMENT FUNCTIONS
  
  // Save a project
  export function saveProject(project: Omit<Project, 'id' | 'createdAt' | 'lastUpdated'>): Project {
    try {
      const projects = getAllProjects();
      const newProject: Project = {
        ...project,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      };
      
      const updatedProjects = [...projects, newProject];
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(updatedProjects));
      
      return newProject;
    } catch (error) {
      console.error('Failed to save project:', error);
      throw new Error('Failed to save project');
    }
  }
  
  // Update an existing project
  export function updateProject(projectId: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>): Project | null {
    try {
      const projects = getAllProjects();
      const projectIndex = projects.findIndex(p => p.id === projectId);
      
      if (projectIndex === -1) {
        throw new Error('Project not found');
      }
      
      const updatedProject: Project = {
        ...projects[projectIndex],
        ...updates,
        lastUpdated: new Date().toISOString(),
      };
      
      projects[projectIndex] = updatedProject;
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
      
      return updatedProject;
    } catch (error) {
      console.error('Failed to update project:', error);
      return null;
    }
  }
  
  // Get all projects
  export function getAllProjects(): Project[] {
    try {
      const stored = localStorage.getItem(PROJECTS_KEY);
      if (!stored) return [];
      
      return JSON.parse(stored) as Project[];
    } catch (error) {
      console.error('Failed to load projects:', error);
      return [];
    }
  }
  
  // Get a specific project by ID
  export function getProject(projectId: string): Project | null {
    try {
      const projects = getAllProjects();
      return projects.find(p => p.id === projectId) || null;
    } catch (error) {
      console.error('Failed to load project:', error);
      return null;
    }
  }
  
  // Delete a project
  export function deleteProject(projectId: string): boolean {
    try {
      const projects = getAllProjects();
      const filteredProjects = projects.filter(p => p.id !== projectId);
      
      if (filteredProjects.length === projects.length) {
        return false; // Project not found
      }
      
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(filteredProjects));
      return true;
    } catch (error) {
      console.error('Failed to delete project:', error);
      return false;
    }
  }
  
  // Duplicate a project
  export function duplicateProject(projectId: string): Project | null {
    try {
      const originalProject = getProject(projectId);
      if (!originalProject) return null;
      
      const duplicatedProject = saveProject({
        title: `${originalProject.title} (Copy)`,
        type: originalProject.type,
        content: JSON.parse(JSON.stringify(originalProject.content)), // Deep copy
        description: originalProject.description,
        wordCount: originalProject.wordCount,
        pageCount: originalProject.pageCount,
      });
      
      return duplicatedProject;
    } catch (error) {
      console.error('Failed to duplicate project:', error);
      return null;
    }
  }
  
  // Get projects by type
  export function getProjectsByType(type: Project['type']): Project[] {
    try {
      const projects = getAllProjects();
      return projects.filter(p => p.type === type);
    } catch (error) {
      console.error('Failed to load projects by type:', error);
      return [];
    }
  }
  
  // Calculate word count for screenplay content
  export function calculateWordCount(content: ScriptElement[]): number {
    return content.reduce((count, element) => {
      const words = element.content.trim().split(/\s+/).filter(word => word.length > 0);
      return count + words.length;
    }, 0);
  }
  
  // Calculate page count for screenplay (rough estimate: 1 page = ~250 words)
  export function calculatePageCount(content: ScriptElement[]): number {
    const wordCount = calculateWordCount(content);
    return Math.max(1, Math.ceil(wordCount / 250));
  }
  
  // Get recent projects (last 5)
  export function getRecentProjects(): Project[] {
    try {
      const projects = getAllProjects();
      return projects
        .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
        .slice(0, 5);
    } catch (error) {
      console.error('Failed to load recent projects:', error);
      return [];
    }
  }
  
  // Clear all projects (for reset)
  export function clearAllProjects(): void {
    try {
      localStorage.removeItem(PROJECTS_KEY);
    } catch (error) {
      console.error('Failed to clear projects:', error);
    }
  }