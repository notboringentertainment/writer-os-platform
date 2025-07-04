'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { getProjects, deleteProject as deleteCloudProject, updateProject as updateCloudProject, transformCloudProject } from '@/services/supabaseService'
import { Project } from '@/types'

export default function ProjectsPage() {
  const { user, loading } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      loadProjects()
    }
  }, [user])

  const loadProjects = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const cloudProjects = await getProjects()
      console.log('Projects page - raw cloud projects:', cloudProjects)
      const transformed = cloudProjects.map(p => transformCloudProject(p))
      console.log('Projects page - transformed projects:', transformed)
      const sortedProjects = transformed.sort((a, b) => 
        new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      )
      setProjects(sortedProjects)
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (project: Project) => {
    setSelectedProject(project)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!selectedProject) return
    
    setIsProcessing(true)
    try {
      const success = await deleteCloudProject(selectedProject.id)
      if (success) {
        await loadProjects()
        setShowDeleteModal(false)
        setSelectedProject(null)
      }
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
    setIsProcessing(false)
  }

  const handleRename = async (project: Project) => {
    setSelectedProject(project)
    setNewTitle(project.title)
    setShowRenameModal(true)
  }

  const confirmRename = async () => {
    if (!selectedProject || !newTitle.trim()) return
    
    setIsProcessing(true)
    try {
      const success = await updateCloudProject(selectedProject.id, { title: newTitle.trim() })
      if (success) {
        await loadProjects()
        setShowRenameModal(false)
        setSelectedProject(null)
        setNewTitle('')
      }
    } catch (error) {
      console.error('Failed to rename project:', error)
    }
    setIsProcessing(false)
  }

  const handleDuplicate = async (project: Project) => {
    setIsProcessing(true)
    try {
      // For now, we'll create a new project with the same content
      const { createProject } = await import('@/services/supabaseService')
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, createdAt, lastUpdated, ...projectData } = project
      const newProject = await createProject({
        ...projectData,
        title: `${project.title} (Copy)`
      })
      if (newProject) {
        await loadProjects()
      }
    } catch (error) {
      console.error('Failed to duplicate project:', error)
    }
    setIsProcessing(false)
  }

  const handleNavigateToProject = (project: Project) => {
    console.log('Projects page - navigating to project:', project)
    console.log('Project ID:', project.id)
    console.log('Project type:', project.type)
    
    const routes: Record<string, string> = {
      screenplay: `/writing/screenplay?id=${project.id}`,
      outline: `/writing/outline?id=${project.id}`,
      bible: `/writing/bible?id=${project.id}`,
      synopsis: `/writing/synopsis?id=${project.id}`
    }
    
    const url = routes[project.type]
    if (url) {
      console.log('Navigating to:', url)
      router.push(url)
    } else {
      router.push(`/writing?projectId=${project.id}`)
    }
  }

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your projects...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link 
            href="/"
            className="text-indigo-600 hover:text-indigo-800 mb-4 inline-block"
          >
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Projects</h1>
          <p className="text-gray-600">Manage all your writing projects in one place</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-semibold text-gray-900">All Projects</span>
              <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
                {projects.length} total
              </span>
            </div>
            
            <div className="flex gap-4 w-full md:w-auto">
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => router.push('/writing')}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                New Project
              </button>
            </div>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              {searchQuery ? (
                <p className="text-gray-500">No projects found matching &quot;{searchQuery}&quot;</p>
              ) : (
                <>
                  <p className="text-gray-500 mb-4">You don&apos;t have any projects yet</p>
                  <button
                    onClick={() => router.push('/writing')}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Create Your First Project
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="border border-gray-200 rounded-lg p-5 hover:border-indigo-300 hover:shadow-md transition-all"
                >
                  <div 
                    className="cursor-pointer"
                    onClick={() => handleNavigateToProject(project)}
                  >
                    <h3 className="font-semibold text-gray-900 text-lg mb-2">{project.title}</h3>
                    <p className="text-sm text-gray-500 mb-3">
                      Last updated: {new Date(project.lastUpdated).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                      {project.wordCount || 0} words • {project.pageCount || 0} pages
                    </p>
                  </div>
                  
                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleNavigateToProject(project)
                      }}
                      className="flex-1 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Open
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRename(project)
                      }}
                      className="flex-1 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Rename
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDuplicate(project)
                      }}
                      className="flex-1 text-sm text-gray-600 hover:text-gray-800"
                      disabled={isProcessing}
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(project)
                      }}
                      className="flex-1 text-sm text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Delete Project</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete &quot;{selectedProject.title}&quot;? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setSelectedProject(null)
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                disabled={isProcessing}
              >
                {isProcessing ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {showRenameModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Rename Project</h3>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter new title"
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRenameModal(false)
                  setSelectedProject(null)
                  setNewTitle('')
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={confirmRename}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                disabled={isProcessing || !newTitle.trim()}
              >
                {isProcessing ? 'Renaming...' : 'Rename'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}