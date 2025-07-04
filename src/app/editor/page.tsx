'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getUserProfile, createProject, getProject, updateProject, transformCloudProject } from '@/services/supabaseService'
import { ScriptElement, calculateWordCount, calculatePageCount } from '@/app/utils/storage'
import { exportScript, ExportFormat } from '@/app/utils/export'

// Define Project interface locally since we're using cloud storage
interface Project {
  id: string
  title: string
  type: 'screenplay' | 'character' | 'scene' | 'structure'
  content: ScriptElement[]
  description: string
  createdAt: string
  lastUpdated: string
  wordCount: number
  pageCount: number
}

type ElementType = 'scene_heading' | 'action' | 'character' | 'dialogue' | 'parenthetical' | 'transition' | 'shot'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AutoComplete {
  show: boolean
  options: string[]
  selectedIndex: number
  elementId: string
}

const ELEMENT_STYLES = {
  scene_heading: 'font-mono font-bold text-sm tracking-wide uppercase pl-0',
  action: 'font-mono text-sm pl-0 pr-16',
  character: 'font-mono font-bold text-sm uppercase pl-96 text-center w-32',
  dialogue: 'font-mono text-sm pl-64 pr-48',
  parenthetical: 'font-mono text-sm pl-80 pr-64 italic',
  transition: 'font-mono font-bold text-sm uppercase text-right pr-0',
  shot: 'font-mono font-bold text-sm uppercase pl-0'
}

const ELEMENT_PLACEHOLDERS = {
  scene_heading: 'INT./EXT. LOCATION - DAY/NIGHT',
  action: 'Scene description and action...',
  character: 'CHARACTER NAME',
  dialogue: 'Character dialogue...',
  parenthetical: '(beat)',
  transition: 'CUT TO:',
  shot: 'CLOSE-UP:'
}

export default function ScreenplayEditor() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project')
  
  const [profile, setProfile] = useState<any>(null)
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [projectTitle, setProjectTitle] = useState('Untitled Screenplay')
  const [scriptElements, setScriptElements] = useState<ScriptElement[]>([
    { id: '1', type: 'scene_heading', content: '' }
  ])
  const [currentElementIndex, setCurrentElementIndex] = useState(0)
  const [autoComplete, setAutoComplete] = useState<AutoComplete>({
    show: false,
    options: [],
    selectedIndex: 0,
    elementId: ''
  })
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isChatSending, setIsChatSending] = useState(false)
  const [showChat, setShowChat] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [showExportMenu, setShowExportMenu] = useState(false)
  
  const elementRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({})
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Load user profile and project
  useEffect(() => {
    const loadData = async () => {
      if (!user) return

      try {
        // Load user profile
        const userProfile = await getUserProfile()
        if (!userProfile?.assessment_data) {
          router.push('/assessment')
          return
        }
        setProfile(userProfile.assessment_data)

        // Load or create project
        if (projectId) {
          const cloudProject = await getProject(projectId)
          if (cloudProject) {
            const transformed = transformCloudProject(cloudProject)
            setCurrentProject(transformed)
            setProjectTitle(transformed.title)
            setScriptElements(transformed.content as ScriptElement[])
            setLastSaved(new Date(transformed.lastUpdated))
          }
        } else {
          // Create new project
          console.log('Creating new project...')
          const newProject = await createProject({
            title: 'Untitled Screenplay',
            type: 'screenplay',
            content: [{ id: '1', type: 'scene_heading', content: '' }],
            description: 'A new screenplay',
            wordCount: 0,
            pageCount: 1
          })
          
          console.log('New project created:', newProject)
          
          if (newProject) {
            const transformed = transformCloudProject(newProject)
            setCurrentProject(transformed)
            setProjectTitle(transformed.title)
            setScriptElements(transformed.content as ScriptElement[])
            setIsLoading(false)
            // Don't redirect, just update the URL
            window.history.replaceState({}, '', `/editor?project=${newProject.id}`)
            return
          }
        }

        // Set up welcome message
        const welcomeMessage: ChatMessage = {
          id: '1',
          role: 'assistant',
          content: `Ready to write your screenplay! I'm here to help with personalized suggestions based on your creative psychology.

I can assist with:
• Scene development that matches your tension preferences
• Character dialogue in your preferred style
• Story structure aligned with your instincts
• Formatting and industry standards

Start writing, and I'll offer suggestions as you go. What's your screenplay about?`,
          timestamp: new Date()
        }
        
        setChatMessages([welcomeMessage])
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      loadData()
    }
  }, [user, projectId, router])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showExportMenu) {
        const target = event.target as Element
        if (!target.closest('.export-menu-container')) {
          setShowExportMenu(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showExportMenu])

  const saveCurrentProject = async () => {
    if (isSaving || !currentProject) return
    
    setIsSaving(true)
    setSaveStatus('saving')
    
    try {
      const wordCount = calculateWordCount(scriptElements)
      const pageCount = calculatePageCount(scriptElements)
      
      const updated = await updateProject(currentProject.id, {
        title: projectTitle,
        content: scriptElements,
        wordCount,
        pageCount,
      })
      
      if (updated) {
        setLastSaved(new Date())
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } else {
        setSaveStatus('error')
        setTimeout(() => setSaveStatus('idle'), 3000)
      }
    } catch (error) {
      console.error('Failed to save project:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
    
    setIsSaving(false)
  }

  // Auto-save functionality
  useEffect(() => {
    if (!currentProject) return
    
    const hasContent = scriptElements.some(el => el.content.trim() !== '')
    
    if (hasContent) {
      const timeoutId = setTimeout(() => {
        saveCurrentProject()
      }, 3000)
      
      return () => clearTimeout(timeoutId)
    }
  }, [scriptElements, projectTitle, currentProject])

  const formatLastSaved = (date: Date | null): string => {
    if (!date) return 'Not saved'
    
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just saved'
    if (diffInMinutes < 60) return `Saved ${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `Saved ${diffInHours}h ago`
    
    return `Saved ${date.toLocaleDateString()}`
  }

  const handleExport = (format: ExportFormat) => {
    exportScript(scriptElements, projectTitle, format)
    setShowExportMenu(false)
  }

  const getAutoCompleteOptions = (content: string): string[] => {
    const upperContent = content.toUpperCase()
    
    if (upperContent === 'I' || upperContent === 'IN') {
      return ['INT. ']
    }
    if (upperContent === 'E' || upperContent === 'EX') {
      return ['EXT. ']
    }
    
    if (upperContent.includes(' - ')) {
      const afterDash = upperContent.split(' - ').pop() || ''
      if (afterDash === '' || afterDash === 'D') {
        return ['DAY', 'DAWN', 'DUSK']
      }
      if (afterDash === 'N') {
        return ['NIGHT']
      }
      if (afterDash === 'M') {
        return ['MORNING']
      }
      if (afterDash === 'A') {
        return ['AFTERNOON']
      }
      if (afterDash === 'E') {
        return ['EVENING']
      }
    }
    
    if (upperContent.match(/^(INT\.|EXT\.)\s+.+[^-\s]$/)) {
      const lastChar = content.trim().slice(-1).toLowerCase()
      if (lastChar === 'd') {
        return ['DAY', 'DAWN', 'DUSK']
      }
      if (lastChar === 'n') {
        return ['NIGHT']
      }
      if (lastChar === 'm') {
        return ['MORNING']
      }
      if (lastChar === 'a') {
        return ['AFTERNOON']
      }
      if (lastChar === 'e') {
        return ['EVENING']
      }
    }
    
    if (upperContent === 'C') return ['CUT TO:']
    if (upperContent === 'F') return ['FADE IN:', 'FADE OUT:']
    if (upperContent === 'D' && !upperContent.includes('INT.') && !upperContent.includes('EXT.')) {
      return ['DISSOLVE TO:']
    }
    
    return []
  }

  const addNewElement = (type: ElementType, index: number) => {
    const newElement: ScriptElement = {
      id: Date.now().toString(),
      type,
      content: ''
    }
    
    const newElements = [...scriptElements]
    newElements.splice(index + 1, 0, newElement)
    setScriptElements(newElements)
    setCurrentElementIndex(index + 1)
    
    setTimeout(() => {
      elementRefs.current[newElement.id]?.focus()
    }, 0)
  }

  const updateElement = (id: string, content: string) => {
    setScriptElements(prev => 
      prev.map(el => el.id === id ? { ...el, content } : el)
    )
    
    const options = getAutoCompleteOptions(content)
    if (options.length > 0) {
      setAutoComplete({
        show: true,
        options,
        selectedIndex: 0,
        elementId: id
      })
    } else {
      setAutoComplete(prev => ({ ...prev, show: false }))
    }
  }

  const applyAutoComplete = (option: string) => {
    const element = scriptElements.find(el => el.id === autoComplete.elementId)
    if (!element) return
    
    const content = element.content
    let newContent = ''
    
    if (option === 'INT. ' && (content === 'I' || content === 'IN')) {
      newContent = 'INT. '
    } else if (option === 'EXT. ' && (content === 'E' || content === 'EX')) {
      newContent = 'EXT. '
    } else if (['DAY', 'NIGHT', 'MORNING', 'AFTERNOON', 'EVENING', 'DAWN', 'DUSK'].includes(option)) {
      if (content.includes(' - ')) {
        const beforeDash = content.substring(0, content.lastIndexOf(' - ') + 3)
        newContent = beforeDash + option
      } else {
        newContent = content + ' - ' + option
      }
    } else {
      newContent = content + option
    }
    
    updateElement(autoComplete.elementId, newContent)
    setAutoComplete(prev => ({ ...prev, show: false }))
    
    setTimeout(() => {
      const textarea = elementRefs.current[autoComplete.elementId]
      if (textarea) {
        textarea.focus()
        textarea.setSelectionRange(newContent.length, newContent.length)
      }
    }, 0)
  }

  const getNextElementType = (currentType: ElementType): ElementType => {
    switch (currentType) {
      case 'scene_heading': return 'action'
      case 'action': return 'action'
      case 'character': return 'dialogue'
      case 'dialogue': return 'action'
      case 'parenthetical': return 'dialogue'
      case 'transition': return 'scene_heading'
      case 'shot': return 'action'
      default: return 'action'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, elementId: string, index: number) => {
    const element = scriptElements[index]
    
    if (autoComplete.show && autoComplete.elementId === elementId) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setAutoComplete(prev => ({
          ...prev,
          selectedIndex: Math.min(prev.selectedIndex + 1, prev.options.length - 1)
        }))
        return
      }
      
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setAutoComplete(prev => ({
          ...prev,
          selectedIndex: Math.max(prev.selectedIndex - 1, 0)
        }))
        return
      }
      
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault()
        applyAutoComplete(autoComplete.options[autoComplete.selectedIndex])
        return
      }
      
      if (e.key === 'Escape') {
        e.preventDefault()
        setAutoComplete(prev => ({ ...prev, show: false }))
        return
      }
    }
    
    if (e.key === 'Enter') {
      e.preventDefault()
      const nextType = getNextElementType(element.type)
      addNewElement(nextType, index)
    }
    
    if (e.key === 'Tab') {
      e.preventDefault()
      const typeOrder: ElementType[] = ['scene_heading', 'action', 'character', 'dialogue', 'parenthetical', 'transition', 'shot']
      const currentIndex = typeOrder.indexOf(element.type)
      const nextType = typeOrder[(currentIndex + 1) % typeOrder.length]
      
      setScriptElements(prev => 
        prev.map(el => el.id === elementId ? { ...el, type: nextType } : el)
      )
    }
    
    if (e.key === 'Backspace' && element.content === '' && scriptElements.length > 1) {
      e.preventDefault()
      const newElements = scriptElements.filter(el => el.id !== elementId)
      setScriptElements(newElements)
      
      if (index > 0) {
        const prevElement = newElements[index - 1]
        setTimeout(() => {
          elementRefs.current[prevElement.id]?.focus()
        }, 0)
      }
    }
  }

  const sendChatMessage = async () => {
    if (!chatInput.trim() || isChatSending) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')
    setIsChatSending(true)

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: chatInput,
          profile: profile,
          conversationHistory: chatMessages.slice(-6)
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.response,
          timestamp: new Date()
        }
        
        setChatMessages(prev => [...prev, assistantMessage])
      }
    } catch (error) {
      console.error('Error:', error)
    }

    setIsChatSending(false)
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading screenplay editor...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-white flex">
      <div className={`${showChat ? 'w-2/3' : 'w-full'} flex flex-col`}>
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/writing')}
                className="text-gray-600 hover:text-gray-900 mr-4"
              >
                ← Back to Dashboard
              </button>
              <div>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className="text-xl font-bold text-gray-900 bg-transparent border-none outline-none"
                  placeholder="Untitled Screenplay"
                />
                <p className="text-sm text-gray-600">
                  {formatLastSaved(lastSaved)} • {calculateWordCount(scriptElements)} words • {calculatePageCount(scriptElements)} pages
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowChat(!showChat)}
                className={`px-3 py-1 rounded text-sm ${showChat ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
              >
                AI Assistant
              </button>
              
              <div className="relative export-menu-container">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Export</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showExportMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="py-2">
                      <button
                        onClick={() => handleExport('pdf')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-3"
                      >
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <div className="font-medium text-gray-900">PDF</div>
                          <div className="text-xs text-gray-500">Professional format</div>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => handleExport('fdx')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-3"
                      >
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <div className="font-medium text-gray-900">Final Draft (.fdx)</div>
                          <div className="text-xs text-gray-500">Industry standard</div>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => handleExport('fountain')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-3"
                      >
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                        <div>
                          <div className="font-medium text-gray-900">Fountain</div>
                          <div className="text-xs text-gray-500">Open format</div>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => handleExport('txt')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-3"
                      >
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <div className="font-medium text-gray-900">Plain Text</div>
                          <div className="text-xs text-gray-500">Simple backup</div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={saveCurrentProject}
                disabled={isSaving || !currentProject}
                className={`px-4 py-2 rounded-lg font-medium flex items-center transition-all duration-200 ${
                  saveStatus === 'saved' 
                    ? 'bg-green-600 text-white' 
                    : saveStatus === 'error'
                    ? 'bg-red-600 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : saveStatus === 'saved' ? (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Saved!
                  </>
                ) : saveStatus === 'error' ? (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Error
                  </>
                ) : (
                  'Save Script'
                )}
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 bg-white p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto bg-white">
            <div className="space-y-4">
              {scriptElements.map((element, index) => (
                <div key={element.id} className="relative">
                  <textarea
                    ref={(el) => (elementRefs.current[element.id] = el)}
                    value={element.content}
                    onChange={(e) => updateElement(element.id, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, element.id, index)}
                    onFocus={() => setCurrentElementIndex(index)}
                    placeholder={ELEMENT_PLACEHOLDERS[element.type]}
                    className={`w-full resize-none border-none outline-none bg-transparent ${ELEMENT_STYLES[element.type]}`}
                    style={{
                      minHeight: '24px',
                      lineHeight: '24px',
                    }}
                    rows={1}
                  />
                  <div className="absolute left-0 top-0 -ml-20 text-xs text-gray-400 uppercase">
                    {element.type.replace('_', ' ')}
                  </div>
                  
                  {autoComplete.show && autoComplete.elementId === element.id && (
                    <div className="absolute top-6 left-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-w-xs">
                      {autoComplete.options.map((option, optionIndex) => (
                        <div
                          key={option}
                          className={`px-3 py-2 cursor-pointer text-sm font-mono ${
                            optionIndex === autoComplete.selectedIndex
                              ? 'bg-blue-100 text-blue-800'
                              : 'hover:bg-gray-100'
                          }`}
                          onMouseDown={(e) => {
                            e.preventDefault() // Prevent blur
                            applyAutoComplete(option)
                          }}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showChat && (
        <div className="w-1/3 bg-gray-50 border-l border-gray-200 flex flex-col">
          <div className="bg-white border-b border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900">AI Writing Partner</h3>
            <p className="text-sm text-gray-600">Personalized screenplay assistance</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`${message.role === 'user' ? 'text-right' : 'text-left'}`}
              >
                <div
                  className={`inline-block max-w-xs p-3 rounded-lg text-sm ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            
            {isChatSending && (
              <div className="text-left">
                <div className="inline-block bg-white border border-gray-200 p-3 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          <div className="bg-white border-t border-gray-200 p-4">
            <div className="flex space-x-2">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendChatMessage()
                  }
                }}
                placeholder="Ask about your screenplay..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg resize-none text-sm"
                rows={2}
                disabled={isChatSending}
              />
              <button
                onClick={sendChatMessage}
                disabled={!chatInput.trim() || isChatSending}
                className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}