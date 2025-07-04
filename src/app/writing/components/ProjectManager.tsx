'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface ProjectManagerProps {
  projects: any[]
  onProjectsChange: () => void
  onDeleteProject?: (projectId: string) => Promise<void>
}

export default function ProjectManager({ projects, onProjectsChange, onDeleteProject }: ProjectManagerProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<any | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const router = useRouter()

  // Click outside handler to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.dropdown-container')) {
        setActiveDropdown(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleDelete = async (project: any) => {
    setSelectedProject(project)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!selectedProject) return
    
    setIsProcessing(true)
    try {
      if (onDeleteProject) {
        await onDeleteProject(selectedProject.id)
      }
      setShowDeleteModal(false)
      setSelectedProject(null)
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
    setIsProcessing(false)
  }

  const handleRename = async (project: any) => {
    setSelectedProject(project)
    setNewTitle(project.title)
    setShowRenameModal(true)
  }

  const confirmRename = async () => {
    if (!selectedProject || !newTitle.trim()) return
    
    setIsProcessing(true)
    try {
      const { updateProject } = await import('@/services/supabaseService')
      const success = await updateProject(selectedProject.id, { title: newTitle.trim() })
      if (success) {
        onProjectsChange()
        setShowRenameModal(false)
        setSelectedProject(null)
        setNewTitle('')
      }
    } catch (error) {
      console.error('Failed to rename project:', error)
    }
    setIsProcessing(false)
  }

  const handleDuplicate = async (project: any) => {
    setIsProcessing(true)
    try {
      const { createProject } = await import('@/services/supabaseService')
      const newProject = await createProject({
        ...project,
        title: `${project.title} (Copy)`,
        id: undefined // Let Supabase generate new ID
      })
      if (newProject) {
        onProjectsChange()
      }
    } catch (error) {
      console.error('Failed to duplicate project:', error)
    }
    setIsProcessing(false)
  }

  const openProject = (project: any) => {
    const routes: Record<string, string> = {
      screenplay: `/writing/screenplay?id=${project.id}`,
      outline: `/writing/outline?id=${project.id}`,
      bible: `/writing/bible?id=${project.id}`,
      synopsis: `/writing/synopsis?id=${project.id}`
    }
    
    const url = routes[project.type]
    if (url) {
      router.push(url)
    }
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    
    return date.toLocaleDateString()
  }

  const getProjectIcon = (type: string) => {
    switch (type) {
      case 'screenplay':
        return {
          icon: (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          bgColor: 'bg-gradient-to-br from-blue-400 to-blue-600'
        }
      case 'outline':
        return {
          icon: (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          ),
          bgColor: 'bg-gradient-to-br from-yellow-400 to-yellow-600'
        }
      case 'bible':
        return {
          icon: (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          ),
          bgColor: 'bg-gradient-to-br from-red-400 to-red-600'
        }
      case 'synopsis':
        return {
          icon: (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          bgColor: 'bg-gradient-to-br from-teal-400 to-teal-600'
        }
      default:
        return {
          icon: (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
          bgColor: 'bg-gradient-to-br from-gray-400 to-gray-600'
        }
    }
  }

  const getProjectTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      screenplay: 'Screenplay',
      outline: 'Outline',
      bible: 'Story Bible',
      synopsis: 'Synopsis'
    }
    return labels[type] || 'Document'
  }

  return (
    <div className="space-y-2">
      {projects.map((project) => {
        const projectIcon = getProjectIcon(project.type)
        return (
          <div
            key={project.id}
            className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
            onClick={() => openProject(project)}
          >
            <div className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-1 min-w-0">
                  <div className={`w-8 h-8 ${projectIcon.bgColor} rounded-lg flex items-center justify-center mr-3 flex-shrink-0 shadow-sm`}>
                    {projectIcon.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-800 text-sm truncate group-hover:text-blue-600 transition-colors">
                        {project.title}
                      </h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        project.type === 'screenplay' ? 'bg-blue-100 text-blue-700' :
                        project.type === 'outline' ? 'bg-yellow-100 text-yellow-700' :
                        project.type === 'bible' ? 'bg-red-100 text-red-700' :
                        project.type === 'synopsis' ? 'bg-teal-100 text-teal-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {getProjectTypeLabel(project.type)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatDate(project.lastUpdated)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity relative dropdown-container">
                {/* Action Menu Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveDropdown(activeDropdown === project.id ? null : project.id)
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  title="More options"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
                
                {/* Dropdown Menu */}
                {activeDropdown === project.id && (
                  <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[140px]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRename(project)
                        setActiveDropdown(null)
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Rename
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDuplicate(project)
                        setActiveDropdown(null)
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Duplicate
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(project)
                        setActiveDropdown(null)
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        )
      })}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Project</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete "<strong>{selectedProject.title}</strong>"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isProcessing}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rename Project</h3>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && confirmRename()}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              placeholder="Enter new project name"
              autoFocus
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRenameModal(false)
                  setNewTitle('')
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={confirmRename}
                disabled={isProcessing || !newTitle.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
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