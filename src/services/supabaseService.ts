import { supabase } from '@/lib/supabase'
import { WritingProfile, Project } from '@/app/utils/storage'

// User Profile Functions
export const getUserProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching profile:', error)
  }
  
  return data
}

export const updateUserProfile = async (profile: {
  assessment_data: WritingProfile | null,
  ai_partner_config: any
}) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({
      user_id: user.id,
      email: user.email,
      assessment_data: profile.assessment_data,
      ai_partner_config: profile.ai_partner_config,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    })
    .select()
    .single()

  if (error) {
    console.error('Error updating profile:', error)
    return null
  }
  
  return data
}

// Project Functions
export const getProjects = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching projects:', error)
    return []
  }
  
  console.log('Raw projects from Supabase:', data)
  return data || []
}

export const getProject = async (projectId: string) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (error) {
    console.error('Error fetching project:', error)
    return null
  }

  // Update last opened timestamp
  await supabase
    .from('projects')
    .update({ last_opened_at: new Date().toISOString() })
    .eq('id', projectId)
  
  return data
}

export const createProject = async (project: Omit<Project, 'id' | 'createdAt' | 'lastUpdated'>) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      title: project.title,
      content: JSON.stringify(project.content), // Store as JSON string
      metadata: {
        type: project.type,
        description: project.description,
        wordCount: project.wordCount,
        pageCount: project.pageCount,
        shadowContent: (project as any).shadowContent ? JSON.stringify((project as any).shadowContent) : null
      }
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating project:', error)
    return null
  }
  
  return data
}

export const updateProject = async (projectId: string, updates: Partial<Project>) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const updateData: any = {
    updated_at: new Date().toISOString()
  }

  if (updates.title) updateData.title = updates.title
  if (updates.content) updateData.content = JSON.stringify(updates.content)
  
  // Always get existing metadata first to preserve fields we're not updating
  const { data: existingProject } = await supabase
    .from('projects')
    .select('metadata')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()
  
  const existingMetadata = existingProject?.metadata || {}
  
  updateData.metadata = {
    ...existingMetadata,
    ...(updates.type && { type: updates.type }),
    ...(updates.description && { description: updates.description }),
    ...(updates.wordCount !== undefined && { wordCount: updates.wordCount }),
    ...(updates.pageCount !== undefined && { pageCount: updates.pageCount }),
    ...((updates as any).shadowContent !== undefined && { shadowContent: JSON.stringify((updates as any).shadowContent) })
  }

  const { data, error } = await supabase
    .from('projects')
    .update(updateData)
    .eq('id', projectId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating project:', error)
    return null
  }
  
  return data
}

export const deleteProject = async (projectId: string) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting project:', error)
    return false
  }
  
  return true
}

// Enhanced Migration with proper data structure
export const migrateLocalStorageToSupabase = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  try {
    // Migrate WritingProfile
    const profileData = localStorage.getItem('authenticvoice_profile')
    if (profileData) {
      const writingProfile: WritingProfile = JSON.parse(profileData)
      
      await updateUserProfile({
        assessment_data: writingProfile,
        ai_partner_config: {
          finalPartnership: writingProfile.finalPartnership,
          initialAnalysis: writingProfile.initialAnalysis
        }
      })
    }

    // Migrate Projects
    const projectsData = localStorage.getItem('authenticvoice_projects')
    if (projectsData) {
      const localProjects: Project[] = JSON.parse(projectsData)
      
      for (const project of localProjects) {
        await createProject({
          title: project.title,
          type: project.type,
          content: project.content,
          description: project.description,
          wordCount: project.wordCount,
          pageCount: project.pageCount
        })
      }
    }

    console.log('Migration complete!')
  } catch (error) {
    console.error('Migration error:', error)
    throw error
  }
}

// Helper to transform cloud data back to local format
export const transformCloudProject = (cloudProject: any): Project => {
  console.log('Transforming cloud project:', cloudProject)
  console.log('Cloud project metadata:', cloudProject.metadata)
  
  const transformed = {
    id: cloudProject.id,
    title: cloudProject.title,
    type: cloudProject.metadata?.type || 'screenplay',
    content: typeof cloudProject.content === 'string' 
      ? JSON.parse(cloudProject.content) 
      : cloudProject.content,
    description: cloudProject.metadata?.description || '',
    createdAt: cloudProject.created_at,
    lastUpdated: cloudProject.updated_at,
    wordCount: cloudProject.metadata?.wordCount || 0,
    pageCount: cloudProject.metadata?.pageCount || 0,
    shadowContent: cloudProject.metadata?.shadowContent 
      ? (typeof cloudProject.metadata.shadowContent === 'string' 
        ? JSON.parse(cloudProject.metadata.shadowContent) 
        : cloudProject.metadata.shadowContent)
      : null
  }
  
  console.log('Transformed project:', transformed)
  return transformed
}

// Conversation management functions
export interface Conversation {
  id?: string
  title: string
  messages: Array<{
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
  }>
  created_at?: string
  updated_at?: string
}

export const getConversations = async (): Promise<Conversation[]> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching conversations:', error)
    return []
  }
  
  return data?.map(conv => ({
    ...conv,
    messages: Array.isArray(conv.messages) 
      ? conv.messages 
      : typeof conv.messages === 'string' 
        ? JSON.parse(conv.messages) 
        : []
  })) || []
}

export const getConversation = async (conversationId: string): Promise<Conversation | null> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .eq('user_id', user.id)
    .single()

  if (error) {
    console.error('Error fetching conversation:', error)
    return null
  }
  
  return data ? {
    ...data,
    messages: Array.isArray(data.messages) 
      ? data.messages 
      : typeof data.messages === 'string' 
        ? JSON.parse(data.messages) 
        : []
  } : null
}

export const createConversation = async (title: string, messages: Conversation['messages'] = []): Promise<Conversation | null> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('conversations')
    .insert({
      user_id: user.id,
      title,
      messages: messages
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating conversation:', error)
    return null
  }
  
  return data ? {
    ...data,
    messages: Array.isArray(data.messages) 
      ? data.messages 
      : typeof data.messages === 'string' 
        ? JSON.parse(data.messages) 
        : []
  } : null
}

export const updateConversation = async (
  conversationId: string, 
  updates: { title?: string; messages?: Conversation['messages'] }
): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const updateData: any = {}
  if (updates.title) updateData.title = updates.title
  if (updates.messages) updateData.messages = updates.messages

  const { error } = await supabase
    .from('conversations')
    .update(updateData)
    .eq('id', conversationId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error updating conversation:', error)
    return false
  }
  
  return true
}

export const deleteConversation = async (conversationId: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting conversation:', error)
    return false
  }
  
  return true
}