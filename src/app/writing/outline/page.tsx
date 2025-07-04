'use client'
import { Suspense } from 'react'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getUserProfile, getProject, createProject, updateProject, transformCloudProject } from '@/services/supabaseService'
import { WritingProfile, Project } from '@/types'

type BeatType = 'act' | 'sequence' | 'scene' | 'beat'

interface OutlineElement {
  id: string
  type: BeatType
  title: string
  description: string
  sceneNumber?: string
  pageNumber?: string
  duration?: string
  parentId?: string
  children?: OutlineElement[]
  isExpanded?: boolean
}

function OutlinePageContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('id')
  
  const [profile, setProfile] = useState<WritingProfile | null>(null)
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [projectTitle, setProjectTitle] = useState('Untitled Outline')
  const [outlineElements, setOutlineElements] = useState<OutlineElement[]>([
    {
      id: '1',
      type: 'act',
      title: 'Act I - Setup',
      description: 'Establish the world, characters, and the inciting incident',
      isExpanded: true,
      children: []
    }
  ])
  const [selectedElement, setSelectedElement] = useState<OutlineElement | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [showStructureMenu, setShowStructureMenu] = useState(false)
  const [showAIAssistant, setShowAIAssistant] = useState(true)
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    const loadData = async () => {
      if (!user) return

      try {
        const userProfile = await getUserProfile()
        if (!userProfile?.assessment_data) {
          router.push('/assessment')
          return
        }
        setProfile(userProfile.assessment_data)

        if (projectId) {
          const cloudProject = await getProject(projectId)
          if (cloudProject) {
            const transformed = transformCloudProject(cloudProject)
            setCurrentProject(transformed)
            setProjectTitle(transformed.title)
            setOutlineElements(transformed.content as unknown as OutlineElement[])
          }
        } else {
          const newProject = await createProject({
            title: 'Untitled Outline',
            type: 'outline' as Project['type'],
            content: outlineElements as unknown as Record<string, unknown>,
            description: 'Story outline',
            wordCount: 0,
            pageCount: 0
          })
          
          if (newProject) {
            const transformed = transformCloudProject(newProject)
            setCurrentProject(transformed)
            router.push(`/writing/outline?id=${newProject.id}`)
          }
        }
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }

    if (user) {
      loadData()
    }
  }, [user, projectId, router])

  const saveProject = async () => {
    if (!currentProject || isSaving) return
    
    setIsSaving(true)
    setSaveStatus('saving')
    
    try {
      await updateProject(currentProject.id, {
        title: projectTitle,
        content: outlineElements as unknown as Record<string, unknown>,
      })
      
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      console.error('Failed to save:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
    
    setIsSaving(false)
  }

  // Auto-save
  useEffect(() => {
    if (!currentProject) return
    
    const timeoutId = setTimeout(() => {
      saveProject()
    }, 3000)
    
    return () => clearTimeout(timeoutId)
  }, [outlineElements, projectTitle, currentProject])

  const addElement = (type: BeatType, parentId?: string) => {
    const newElement: OutlineElement = {
      id: Date.now().toString(),
      type,
      title: `New ${type}`,
      description: '',
      isExpanded: true
    }

    if (parentId) {
      // Add as child
      const updateElements = (elements: OutlineElement[]): OutlineElement[] => {
        return elements.map(el => {
          if (el.id === parentId) {
            return {
              ...el,
              children: [...(el.children || []), newElement]
            }
          }
          if (el.children) {
            return {
              ...el,
              children: updateElements(el.children)
            }
          }
          return el
        })
      }
      setOutlineElements(updateElements(outlineElements))
    } else {
      // Add to root
      setOutlineElements([...outlineElements, newElement])
    }
  }

  const updateElement = (id: string, updates: Partial<OutlineElement>) => {
    const updateElements = (elements: OutlineElement[]): OutlineElement[] => {
      return elements.map(el => {
        if (el.id === id) {
          return { ...el, ...updates }
        }
        if (el.children) {
          return {
            ...el,
            children: updateElements(el.children)
          }
        }
        return el
      })
    }
    setOutlineElements(updateElements(outlineElements))
  }

  const deleteElement = (id: string) => {
    const deleteFromElements = (elements: OutlineElement[]): OutlineElement[] => {
      return elements.filter(el => el.id !== id).map(el => {
        if (el.children) {
          return {
            ...el,
            children: deleteFromElements(el.children)
          }
        }
        return el
      })
    }
    setOutlineElements(deleteFromElements(outlineElements))
    setSelectedElement(null)
  }

  const toggleExpand = (id: string) => {
    updateElement(id, { isExpanded: !outlineElements.find(el => el.id === id)?.isExpanded })
  }

  const generateAISuggestions = async (element: OutlineElement) => {
    if (!profile || isGenerating) return
    
    setIsGenerating(true)
    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'outline_suggestions',
          element: element,
          context: outlineElements,
          profile: profile
        })
      })
      
      const result = await response.json()
      if (result.success && result.suggestions) {
        setAiSuggestions(result.suggestions)
      }
    } catch (error) {
      console.error('Error generating suggestions:', error)
    }
    setIsGenerating(false)
  }

  const applyAISuggestion = (suggestion: string) => {
    if (selectedElement) {
      updateElement(selectedElement.id, { description: suggestion })
      setAiSuggestions([])
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!user) return null

  const renderElement = (element: OutlineElement, depth: number = 0) => {
    const hasChildren = element.children && element.children.length > 0
    const isSelected = selectedElement?.id === element.id

    return (
      <div key={element.id} className={`${depth > 0 ? 'ml-8' : ''}`}>
        <div
          className={`group flex items-start p-3 rounded-lg mb-2 cursor-pointer transition-all ${
            isSelected 
              ? 'bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200' 
              : 'bg-white hover:bg-gray-50 border border-gray-200'
          }`}
          onClick={() => setSelectedElement(element)}
        >
          {/* Expand/Collapse button */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleExpand(element.id)
              }}
              className="mr-2 text-gray-400 hover:text-gray-600"
            >
              <svg className={`w-4 h-4 transform transition-transform ${element.isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Type Badge */}
          <div className={`flex-shrink-0 px-2 py-1 rounded text-xs font-medium mr-3 ${
            element.type === 'act' ? 'bg-purple-100 text-purple-700' :
            element.type === 'sequence' ? 'bg-blue-100 text-blue-700' :
            element.type === 'scene' ? 'bg-green-100 text-green-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {element.type.toUpperCase()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900">{element.title}</h4>
            {element.description && (
              <p className="text-sm text-gray-600 mt-1">{element.description}</p>
            )}
            {(element.sceneNumber || element.duration) && (
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                {element.sceneNumber && <span>Scene {element.sceneNumber}</span>}
                {element.duration && <span>{element.duration}</span>}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                addElement('beat', element.id)
              }}
              className="p-1 text-gray-400 hover:text-gray-600"
              title="Add child"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                deleteElement(element.id)
              }}
              className="p-1 text-gray-400 hover:text-red-600"
              title="Delete"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Children */}
        {hasChildren && element.isExpanded && (
          <div className="mb-2">
            {element.children!.map(child => renderElement(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
        <div className="px-6 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/writing')}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back
            </button>
            
            {/* AI Assistant Toggle */}
            <button
              onClick={() => setShowAIAssistant(!showAIAssistant)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                showAIAssistant ? 'bg-white shadow-sm text-purple-600' : 'text-gray-600 hover:bg-white/50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span>AI Assistant</span>
            </button>
            
            {/* Structure Templates */}
            <div className="relative">
              <button
                onClick={() => setShowStructureMenu(!showStructureMenu)}
                className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:bg-white/50 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>Structure</span>
              </button>
              
              {showStructureMenu && (
                <div className="absolute left-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">Three Act Structure</button>
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">Save the Cat</button>
                  <button className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">Hero&apos;s Journey</button>
                </div>
              )}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            <div className="text-right mr-4">
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className="text-lg font-semibold text-gray-900 bg-transparent border-none outline-none text-right"
                placeholder="Untitled Outline"
              />
            </div>
            
            <button
              onClick={saveProject}
              disabled={isSaving}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                saveStatus === 'saved' 
                  ? 'bg-green-500 text-white' 
                  : saveStatus === 'error'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              } disabled:opacity-50 flex items-center`}
            >
              {isSaving ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Outline Tree */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            {/* Add buttons */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => addElement('act')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                + Add Act
              </button>
              <button
                onClick={() => addElement('sequence')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                + Add Sequence
              </button>
              <button
                onClick={() => addElement('scene')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                + Add Scene
              </button>
            </div>

            {/* Outline Elements */}
            <div className="space-y-2">
              {outlineElements.map(element => renderElement(element))}
            </div>

            {outlineElements.length === 0 && (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <p className="text-gray-500">Start building your outline</p>
                <p className="text-sm text-gray-400 mt-2">Add acts, sequences, scenes, and beats</p>
              </div>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        {selectedElement && (
          <div className="w-96 bg-white border-l border-gray-200 p-6 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit {selectedElement.type}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={selectedElement.title}
                  onChange={(e) => updateElement(selectedElement.id, { title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={selectedElement.description}
                  onChange={(e) => updateElement(selectedElement.id, { description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={4}
                />
              </div>

              {selectedElement.type === 'scene' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Scene Number</label>
                    <input
                      type="text"
                      value={selectedElement.sceneNumber || ''}
                      onChange={(e) => updateElement(selectedElement.id, { sceneNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                    <input
                      type="text"
                      value={selectedElement.duration || ''}
                      onChange={(e) => updateElement(selectedElement.id, { duration: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., 2 pages"
                    />
                  </div>
                </>
              )}

              {/* AI Suggestions */}
              {showAIAssistant && (
                <div className="mt-6 border-t pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-700">AI Suggestions</h4>
                    <button
                      onClick={() => generateAISuggestions(selectedElement)}
                      disabled={isGenerating}
                      className="text-xs bg-purple-600 text-white px-3 py-1 rounded-md hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
                    >
                      {isGenerating ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          Generate Ideas
                        </>
                      )}
                    </button>
                  </div>
                  
                  {aiSuggestions.length > 0 ? (
                    <div className="space-y-2">
                      {aiSuggestions.map((suggestion, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-purple-50 rounded-lg border border-purple-200 hover:border-purple-300 cursor-pointer transition-colors"
                          onClick={() => applyAISuggestion(suggestion)}
                        >
                          <p className="text-sm text-gray-700">{suggestion}</p>
                          <p className="text-xs text-purple-600 mt-1">Click to use this suggestion</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <p className="text-sm">Click &quot;Generate Ideas&quot; for AI suggestions</p>
                      <p className="text-xs mt-1">Based on your creative profile</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function OutlinePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <OutlinePageContent />
    </Suspense>
  )
}
