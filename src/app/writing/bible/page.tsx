'use client'
import { Suspense } from 'react'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getUserProfile, getProject, createProject, updateProject, transformCloudProject } from '@/services/supabaseService'
import { WritingProfile, Project } from '@/types'

type BibleSection = 'titlePage' | 'world' | 'characters' | 'locations' | 'timeline' | 'rules' | 'themes'

interface CharacterEntry {
  id: string
  name: string
  ageRole: string
  shortSummary: string
  backstory: string
  coreMotivation: string
  internalConflict: string
  externalConflict: string
  strengths: string
  flaws: string
  seasonOneArc: string
  longTermArc: string
}

interface LocationEntry {
  id: string
  name: string
  type: 'interior' | 'exterior' | 'both'
  description: string
  atmosphere: string
  significance: string
  visualDetails: string
  soundscape: string
}

interface TimelineEvent {
  id: string
  date: string
  event: string
  significance: string
  charactersInvolved: string[]
}

interface WorldRule {
  id: string
  category: string
  rule: string
  explanation: string
  examples: string
}

interface ThemeEntry {
  id: string
  theme: string
  description: string
  symbolism: string
  manifestations: string
  characterConnections: string
}

interface TitlePageInfo {
  seriesTitle: string
  genre: string
  format: string
  createdBy: string
  contactInfo: string
}

interface SeriesOverview {
  description: string
  corePremise: string
  worldSetting: string
  toneStyle: string
  keyConflicts: string
  showEngine: string
  comparableShows: string
  whyNow?: string
  whyYou?: string
}

interface ThemesSection {
  coreThemes: string[]
  sampleQuestions: string[]
}

interface BibleContent {
  titlePage: TitlePageInfo
  worldOverview: string
  tone: string
  genre: string
  logline: string
  seriesOverview: SeriesOverview
  themesSection: ThemesSection
  characters: CharacterEntry[]
  locations: LocationEntry[]
  timeline: TimelineEvent[]
  rules: WorldRule[]
  themes: ThemeEntry[]
}

function StoryBiblePageContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('id')
  
  const [profile, setProfile] = useState<WritingProfile | null>(null)
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [projectTitle, setProjectTitle] = useState('Untitled Story Bible')
  const [activeSection, setActiveSection] = useState<BibleSection>('titlePage')
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [showAIAssistant, setShowAIAssistant] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [isAskingAI, setIsAskingAI] = useState(false)
  
  const [bibleContent, setBibleContent] = useState<BibleContent>({
    titlePage: {
      seriesTitle: '',
      genre: '',
      format: '',
      createdBy: '',
      contactInfo: ''
    },
    worldOverview: '',
    tone: '',
    genre: '',
    logline: '',
    seriesOverview: {
      description: '',
      corePremise: '',
      worldSetting: '',
      toneStyle: '',
      keyConflicts: '',
      showEngine: '',
      comparableShows: ''
    },
    themesSection: {
      coreThemes: [''],
      sampleQuestions: ['']
    },
    characters: [],
    locations: [],
    timeline: [],
    rules: [],
    themes: []
  })

  const [selectedItem, setSelectedItem] = useState<{id: string; name: string; [key: string]: unknown} | null>(null)
  const [selectedType, setSelectedType] = useState<string>('')

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
            setBibleContent(transformed.content as unknown as BibleContent)
          }
        } else {
          const newProject = await createProject({
            title: 'Untitled Story Bible',
            type: 'bible' as Project['type'],
            content: bibleContent as unknown as Record<string, unknown>,
            description: 'Story bible for world building',
            wordCount: 0,
            pageCount: 0
          })
          
          if (newProject) {
            const transformed = transformCloudProject(newProject)
            setCurrentProject(transformed)
            router.push(`/writing/bible?id=${newProject.id}`)
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
      const success = await updateProject(currentProject.id, {
        title: projectTitle,
        content: bibleContent as unknown as Record<string, unknown>,
      })

      if (success) {
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus('idle'), 2000)
      } else {
        throw new Error('Update failed')
      }
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
  }, [bibleContent, projectTitle, currentProject])

  const addCharacter = () => {
    const newCharacter: CharacterEntry = {
      id: Date.now().toString(),
      name: 'New Character',
      ageRole: '',
      shortSummary: '',
      backstory: '',
      coreMotivation: '',
      internalConflict: '',
      externalConflict: '',
      strengths: '',
      flaws: '',
      seasonOneArc: '',
      longTermArc: ''
    }
    setBibleContent({
      ...bibleContent,
      characters: [...bibleContent.characters, newCharacter]
    })
    setSelectedItem(newCharacter as unknown as { id: string; name: string; [key: string]: unknown })
    setSelectedType('character')
  }

  const addLocation = () => {
    const newLocation: LocationEntry = {
      id: Date.now().toString(),
      name: 'New Location',
      type: 'interior',
      description: '',
      atmosphere: '',
      significance: '',
      visualDetails: '',
      soundscape: ''
    }
    setBibleContent({
      ...bibleContent,
      locations: [...bibleContent.locations, newLocation]
    })
    setSelectedItem(newLocation as unknown as { id: string; name: string; [key: string]: unknown })
    setSelectedType('location')
  }

  const addTimelineEvent = () => {
    const newEvent: TimelineEvent = {
      id: Date.now().toString(),
      date: '',
      event: 'New Event',
      significance: '',
      charactersInvolved: []
    }
    setBibleContent({
      ...bibleContent,
      timeline: [...bibleContent.timeline, newEvent]
    })
    setSelectedItem(newEvent as unknown as { id: string; name: string; [key: string]: unknown })
    setSelectedType('timeline')
  }

  const addWorldRule = () => {
    const newRule: WorldRule = {
      id: Date.now().toString(),
      category: '',
      rule: 'New Rule',
      explanation: '',
      examples: ''
    }
    setBibleContent({
      ...bibleContent,
      rules: [...bibleContent.rules, newRule]
    })
    setSelectedItem(newRule as unknown as { id: string; name: string; [key: string]: unknown })
    setSelectedType('rule')
  }

  const addTheme = () => {
    const newTheme: ThemeEntry = {
      id: Date.now().toString(),
      theme: 'New Theme',
      description: '',
      symbolism: '',
      manifestations: '',
      characterConnections: ''
    }
    setBibleContent({
      ...bibleContent,
      themes: [...bibleContent.themes, newTheme]
    })
    setSelectedItem(newTheme as unknown as { id: string; name: string; [key: string]: unknown })
    setSelectedType('theme')
  }

  const getItemValue = (field: string): string => {
    if (!selectedItem) return ''
    return (selectedItem as Record<string, unknown>)[field] as string || ''
  }

  const updateItem = (field: string, value: string | number | boolean | string[]) => {
    if (!selectedItem || !selectedType) return

    const updatedItem = { ...selectedItem, [field]: value }
    setSelectedItem(updatedItem)

    switch (selectedType) {
      case 'character':
        setBibleContent({
          ...bibleContent,
          characters: bibleContent.characters.map(c => 
            c.id === updatedItem.id ? updatedItem as unknown as CharacterEntry : c
          )
        })
        break
      case 'location':
        setBibleContent({
          ...bibleContent,
          locations: bibleContent.locations.map(l => 
            l.id === updatedItem.id ? updatedItem as unknown as LocationEntry : l
          )
        })
        break
      case 'timeline':
        setBibleContent({
          ...bibleContent,
          timeline: bibleContent.timeline.map(t => 
            t.id === updatedItem.id ? updatedItem as unknown as TimelineEvent : t
          )
        })
        break
      case 'rule':
        setBibleContent({
          ...bibleContent,
          rules: bibleContent.rules.map(r => 
            r.id === updatedItem.id ? updatedItem as unknown as WorldRule : r
          )
        })
        break
      case 'theme':
        setBibleContent({
          ...bibleContent,
          themes: bibleContent.themes.map(t => 
            t.id === updatedItem.id ? updatedItem as unknown as ThemeEntry : t
          )
        })
        break
    }
  }

  const deleteItem = () => {
    if (!selectedItem || !selectedType) return

    switch (selectedType) {
      case 'character':
        setBibleContent({
          ...bibleContent,
          characters: bibleContent.characters.filter(c => c.id !== selectedItem.id)
        })
        break
      case 'location':
        setBibleContent({
          ...bibleContent,
          locations: bibleContent.locations.filter(l => l.id !== selectedItem.id)
        })
        break
      case 'timeline':
        setBibleContent({
          ...bibleContent,
          timeline: bibleContent.timeline.filter(t => t.id !== selectedItem.id)
        })
        break
      case 'rule':
        setBibleContent({
          ...bibleContent,
          rules: bibleContent.rules.filter(r => r.id !== selectedItem.id)
        })
        break
      case 'theme':
        setBibleContent({
          ...bibleContent,
          themes: bibleContent.themes.filter(t => t.id !== selectedItem.id)
        })
        break
    }
    
    setSelectedItem(null)
    setSelectedType('')
  }

  const generateAISuggestions = async () => {
    if (!profile || isGenerating || !selectedItem) return
    
    setIsGenerating(true)
    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'bible_suggestions',
          item: selectedItem,
          type: selectedType,
          context: bibleContent,
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

  const askAIQuestion = async () => {
    if (!aiPrompt.trim() || isAskingAI) return
    
    setIsAskingAI(true)
    setAiResponse('')
    
    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'general-assistant',
          messages: [{ role: 'user', content: aiPrompt }],
          context: {
            currentPage: 'story-bible',
            currentSection: activeSection,
            selectedItem: selectedItem,
            selectedType: selectedType,
            userProfile: profile
          }
        })
      })
      
      const result = await response.json()
      if (result.success) {
        setAiResponse(result.response)
      }
    } catch (error) {
      console.error('Error asking AI:', error)
      setAiResponse('Sorry, I encountered an error. Please try again.')
    }
    setIsAskingAI(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!user) return null

  const sectionIcons = {
    titlePage: '📄',
    world: '🌍',
    characters: '👥',
    locations: '📍',
    timeline: '📅',
    rules: '📋',
    themes: '💡'
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
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            <div className="text-right mr-4">
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className="text-lg font-semibold text-gray-900 bg-transparent border-none outline-none text-right"
                placeholder="Untitled Story Bible"
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
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Story Bible Sections</h3>
            <nav className="space-y-1">
              {(['titlePage', 'world', 'characters', 'locations', 'timeline', 'rules', 'themes'] as BibleSection[]).map((section) => (
                <button
                  key={section}
                  onClick={() => {
                    setActiveSection(section)
                    setSelectedItem(null)
                    setSelectedType('')
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                    activeSection === section
                      ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-lg">{sectionIcons[section]}</span>
                  <span className="capitalize">{section === 'titlePage' ? 'Title Page' : section === 'world' ? 'World Overview' : section}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 flex">
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              {/* Title Page Section */}
              {activeSection === 'titlePage' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Title Page</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Series Title</label>
                    <input
                      type="text"
                      value={bibleContent.titlePage.seriesTitle}
                      onChange={(e) => setBibleContent({ 
                        ...bibleContent, 
                        titlePage: { ...bibleContent.titlePage, seriesTitle: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter the title of your series"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
                    <input
                      type="text"
                      value={bibleContent.titlePage.genre}
                      onChange={(e) => setBibleContent({ 
                        ...bibleContent, 
                        titlePage: { ...bibleContent.titlePage, genre: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., Drama, Comedy, Thriller, Sci-Fi, Fantasy"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                    <input
                      type="text"
                      value={bibleContent.titlePage.format}
                      onChange={(e) => setBibleContent({ 
                        ...bibleContent, 
                        titlePage: { ...bibleContent.titlePage, format: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., 1-hour drama, 30-min comedy, limited series (8 episodes)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Created by</label>
                    <input
                      type="text"
                      value={bibleContent.titlePage.createdBy}
                      onChange={(e) => setBibleContent({ 
                        ...bibleContent, 
                        titlePage: { ...bibleContent.titlePage, createdBy: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Info (optional)</label>
                    <textarea
                      value={bibleContent.titlePage.contactInfo}
                      onChange={(e) => setBibleContent({ 
                        ...bibleContent, 
                        titlePage: { ...bibleContent.titlePage, contactInfo: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={3}
                      placeholder="Email, phone number, agent/manager info"
                    />
                  </div>
                </div>
              )}

              {/* World Overview Section */}
              {activeSection === 'world' && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">World Overview</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Logline</label>
                    <textarea
                      value={bibleContent.logline}
                      onChange={(e) => setBibleContent({ ...bibleContent, logline: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={2}
                      placeholder="A one- or two-sentence pitch that captures the hook of the show. Include protagonist, conflict, and unique world/tone."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
                    <input
                      type="text"
                      value={bibleContent.genre}
                      onChange={(e) => setBibleContent({ ...bibleContent, genre: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Drama, Thriller, Comedy, etc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tone/Style</label>
                    <input
                      type="text"
                      value={bibleContent.tone}
                      onChange={(e) => setBibleContent({ ...bibleContent, tone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., gritty, surreal, stylized, naturalistic, dark comedy, heightened reality"
                    />
                  </div>

                  {/* Series Overview Section */}
                  <div className="bg-gray-50 rounded-lg p-6 space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Series Overview</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        What&apos;s the big picture? Give an executive-level pitch of your series concept.
                      </label>
                      <textarea
                        value={bibleContent.seriesOverview.description}
                        onChange={(e) => setBibleContent({ 
                          ...bibleContent, 
                          seriesOverview: { ...bibleContent.seriesOverview, description: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        rows={4}
                        placeholder="The elevator pitch that captures why this show needs to exist..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        What is the core premise or hook of the show?
                      </label>
                      <textarea
                        value={bibleContent.seriesOverview.corePremise}
                        onChange={(e) => setBibleContent({ 
                          ...bibleContent, 
                          seriesOverview: { ...bibleContent.seriesOverview, corePremise: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        rows={3}
                        placeholder="The central concept that drives everything..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        What kind of world does this take place in? (Setting/Time/Location)
                      </label>
                      <textarea
                        value={bibleContent.seriesOverview.worldSetting}
                        onChange={(e) => setBibleContent({ 
                          ...bibleContent, 
                          seriesOverview: { ...bibleContent.seriesOverview, worldSetting: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        rows={3}
                        placeholder="Contemporary New York, 1970s rural Texas, near-future London..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        What are the key conflicts the show explores?
                      </label>
                      <textarea
                        value={bibleContent.seriesOverview.keyConflicts}
                        onChange={(e) => setBibleContent({ 
                          ...bibleContent, 
                          seriesOverview: { ...bibleContent.seriesOverview, keyConflicts: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        rows={3}
                        placeholder="Central tensions that drive the drama..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        What is the engine of the show? (episodic case-of-the-week vs. serialized arc)
                      </label>
                      <textarea
                        value={bibleContent.seriesOverview.showEngine}
                        onChange={(e) => setBibleContent({ 
                          ...bibleContent, 
                          seriesOverview: { ...bibleContent.seriesOverview, showEngine: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        rows={2}
                        placeholder="How episodes work and stories unfold..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Comparable Shows (if helpful):
                      </label>
                      <p className="text-xs text-gray-500 mb-2">Think: &quot;X meets Y&quot; or &quot;For fans of…&quot;</p>
                      <textarea
                        value={bibleContent.seriesOverview.comparableShows}
                        onChange={(e) => setBibleContent({ 
                          ...bibleContent, 
                          seriesOverview: { ...bibleContent.seriesOverview, comparableShows: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        rows={2}
                        placeholder="Breaking Bad meets The Good Place..."
                      />
                    </div>
                  </div>

                  {/* Themes Section */}
                  <div className="bg-gray-50 rounded-lg p-6 space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Themes</h3>
                    <p className="text-sm text-gray-600 mb-4">What larger ideas or emotional questions drive the series?</p>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Core Themes (3–5):</label>
                      <div className="space-y-2">
                        {bibleContent.themesSection.coreThemes.map((theme, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={theme}
                              onChange={(e) => {
                                const newThemes = [...bibleContent.themesSection.coreThemes];
                                newThemes[index] = e.target.value;
                                setBibleContent({ 
                                  ...bibleContent, 
                                  themesSection: { ...bibleContent.themesSection, coreThemes: newThemes }
                                });
                              }}
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder={`Theme ${index + 1}`}
                            />
                            <button
                              onClick={() => {
                                const newThemes = bibleContent.themesSection.coreThemes.filter((_, i) => i !== index);
                                setBibleContent({ 
                                  ...bibleContent, 
                                  themesSection: { ...bibleContent.themesSection, coreThemes: newThemes }
                                });
                              }}
                              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        {bibleContent.themesSection.coreThemes.length < 5 && (
                          <button
                            onClick={() => {
                              setBibleContent({ 
                                ...bibleContent, 
                                themesSection: { 
                                  ...bibleContent.themesSection, 
                                  coreThemes: [...bibleContent.themesSection.coreThemes, '']
                                }
                              });
                            }}
                            className="px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors text-sm"
                          >
                            + Add Theme
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sample Questions Explored by the Show:</label>
                      <div className="space-y-2">
                        {bibleContent.themesSection.sampleQuestions.map((question, index) => (
                          <div key={index} className="flex gap-2">
                            <textarea
                              value={question}
                              onChange={(e) => {
                                const newQuestions = [...bibleContent.themesSection.sampleQuestions];
                                newQuestions[index] = e.target.value;
                                setBibleContent({ 
                                  ...bibleContent, 
                                  themesSection: { ...bibleContent.themesSection, sampleQuestions: newQuestions }
                                });
                              }}
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              rows={2}
                              placeholder={index === 0 ? "What happens when..." : index === 1 ? "Can love survive..." : "What is the cost of..."}
                            />
                            <button
                              onClick={() => {
                                const newQuestions = bibleContent.themesSection.sampleQuestions.filter((_, i) => i !== index);
                                setBibleContent({ 
                                  ...bibleContent, 
                                  themesSection: { ...bibleContent.themesSection, sampleQuestions: newQuestions }
                                });
                              }}
                              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            setBibleContent({ 
                              ...bibleContent, 
                              themesSection: { 
                                ...bibleContent.themesSection, 
                                sampleQuestions: [...bibleContent.themesSection.sampleQuestions, '']
                              }
                            });
                          }}
                          className="px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors text-sm"
                        >
                          + Add Question
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Why Now / Why You Section */}
                  <div className="bg-gray-50 rounded-lg p-6 space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Why Now / Why You</h3>
                    <p className="text-sm text-gray-600 mb-4">Communicate urgency and personal stake.</p>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Why this story now? (Cultural relevance, timing):
                      </label>
                      <textarea
                        value={bibleContent.seriesOverview.whyNow || ''}
                        onChange={(e) => setBibleContent({ 
                          ...bibleContent, 
                          seriesOverview: { ...bibleContent.seriesOverview, whyNow: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        rows={3}
                        placeholder="What makes this story timely and necessary? What cultural moment does it speak to?"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Why you? (What personal connection do you have to this world?)
                      </label>
                      <textarea
                        value={bibleContent.seriesOverview.whyYou || ''}
                        onChange={(e) => setBibleContent({ 
                          ...bibleContent, 
                          seriesOverview: { ...bibleContent.seriesOverview, whyYou: e.target.value }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        rows={3}
                        placeholder="Your unique perspective, experience, or passion that makes you the right person to tell this story..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Characters Section */}
              {activeSection === 'characters' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Characters</h2>
                    <button
                      onClick={addCharacter}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      + Add Character
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bibleContent.characters.map((character) => (
                      <div
                        key={character.id}
                        onClick={() => {
                          setSelectedItem(character as unknown as { id: string; name: string; [key: string]: unknown })
                          setSelectedType('character')
                        }}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedItem?.id === character.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <h3 className="font-semibold text-gray-900">{character.name}</h3>
                        {character.ageRole && (
                          <p className="text-sm text-gray-600">{character.ageRole}</p>
                        )}
                        {character.shortSummary && (
                          <p className="text-sm text-gray-500 mt-2 line-clamp-2">{character.shortSummary}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {bibleContent.characters.length === 0 && (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-gray-500">No characters yet</p>
                      <p className="text-sm text-gray-400 mt-2">Add your first character to get started</p>
                    </div>
                  )}
                </div>
              )}

              {/* Locations Section */}
              {activeSection === 'locations' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Locations</h2>
                    <button
                      onClick={addLocation}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      + Add Location
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bibleContent.locations.map((location) => (
                      <div
                        key={location.id}
                        onClick={() => {
                          setSelectedItem(location as unknown as { id: string; name: string; [key: string]: unknown })
                          setSelectedType('location')
                        }}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedItem?.id === location.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <h3 className="font-semibold text-gray-900">{location.name}</h3>
                        <p className="text-sm text-gray-600 uppercase">{location.type}</p>
                        {location.description && (
                          <p className="text-sm text-gray-500 mt-2 line-clamp-2">{location.description}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {bibleContent.locations.length === 0 && (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-gray-500">No locations yet</p>
                      <p className="text-sm text-gray-400 mt-2">Add your first location to get started</p>
                    </div>
                  )}
                </div>
              )}

              {/* Timeline Section */}
              {activeSection === 'timeline' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Timeline</h2>
                    <button
                      onClick={addTimelineEvent}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      + Add Event
                    </button>
                  </div>

                  <div className="space-y-4">
                    {bibleContent.timeline.map((event) => (
                      <div
                        key={event.id}
                        onClick={() => {
                          setSelectedItem(event as unknown as { id: string; name: string; [key: string]: unknown })
                          setSelectedType('timeline')
                        }}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedItem?.id === event.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-900">{event.event}</h3>
                            {event.date && <p className="text-sm text-gray-600">{event.date}</p>}
                            {event.significance && (
                              <p className="text-sm text-gray-500 mt-2">{event.significance}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {bibleContent.timeline.length === 0 && (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-gray-500">No timeline events yet</p>
                      <p className="text-sm text-gray-400 mt-2">Add your first event to get started</p>
                    </div>
                  )}
                </div>
              )}

              {/* Rules Section */}
              {activeSection === 'rules' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">World Rules</h2>
                    <button
                      onClick={addWorldRule}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      + Add Rule
                    </button>
                  </div>

                  <div className="space-y-4">
                    {bibleContent.rules.map((rule) => (
                      <div
                        key={rule.id}
                        onClick={() => {
                          setSelectedItem(rule as unknown as { id: string; name: string; [key: string]: unknown })
                          setSelectedType('rule')
                        }}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedItem?.id === rule.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <h3 className="font-semibold text-gray-900">{rule.rule}</h3>
                        {rule.category && <p className="text-sm text-gray-600">{rule.category}</p>}
                        {rule.explanation && (
                          <p className="text-sm text-gray-500 mt-2">{rule.explanation}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {bibleContent.rules.length === 0 && (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      <p className="text-gray-500">No world rules yet</p>
                      <p className="text-sm text-gray-400 mt-2">Add your first rule to get started</p>
                    </div>
                  )}
                </div>
              )}

              {/* Themes Section */}
              {activeSection === 'themes' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Themes</h2>
                    <button
                      onClick={addTheme}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      + Add Theme
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {bibleContent.themes.map((theme) => (
                      <div
                        key={theme.id}
                        onClick={() => {
                          setSelectedItem(theme as unknown as { id: string; name: string; [key: string]: unknown })
                          setSelectedType('theme')
                        }}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedItem?.id === theme.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <h3 className="font-semibold text-gray-900">{theme.theme}</h3>
                        {theme.description && (
                          <p className="text-sm text-gray-500 mt-2 line-clamp-3">{theme.description}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {bibleContent.themes.length === 0 && (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <p className="text-gray-500">No themes yet</p>
                      <p className="text-sm text-gray-400 mt-2">Add your first theme to get started</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Detail Panel */}
          {selectedItem && (
            <div className="w-96 bg-white border-l border-gray-200 p-6 overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Edit {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}
                </h3>
                <button
                  onClick={() => {
                    setSelectedItem(null)
                    setSelectedType('')
                    setAiSuggestions([])
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Character Fields */}
              {selectedType === 'character' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={getItemValue('name')}
                      onChange={(e) => updateItem('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age / Role</label>
                    <input
                      type="text"
                      value={getItemValue('ageRole')}
                      onChange={(e) => updateItem('ageRole', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., 35 / Lead Detective"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Short Summary (1–2 sentences)</label>
                    <textarea
                      value={getItemValue('shortSummary')}
                      onChange={(e) => updateItem('shortSummary', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={2}
                      placeholder="Brief character description that captures their essence"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Backstory</label>
                    <textarea
                      value={getItemValue('backstory')}
                      onChange={(e) => updateItem('backstory', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={3}
                      placeholder="Their history and what shaped them"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Core Motivation</label>
                    <textarea
                      value={getItemValue('coreMotivation')}
                      onChange={(e) => updateItem('coreMotivation', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={2}
                      placeholder="What drives this character above all else"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Internal Conflict</label>
                    <textarea
                      value={getItemValue('internalConflict')}
                      onChange={(e) => updateItem('internalConflict', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={2}
                      placeholder="Their inner struggle or contradiction"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">External Conflict</label>
                    <textarea
                      value={getItemValue('externalConflict')}
                      onChange={(e) => updateItem('externalConflict', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={2}
                      placeholder="What obstacles they face in the world"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Strengths</label>
                    <textarea
                      value={getItemValue('strengths')}
                      onChange={(e) => updateItem('strengths', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={2}
                      placeholder="Skills, qualities, and advantages"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Flaws</label>
                    <textarea
                      value={getItemValue('flaws')}
                      onChange={(e) => updateItem('flaws', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={2}
                      placeholder="Weaknesses, blind spots, and vulnerabilities"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Season 1 Arc</label>
                    <textarea
                      value={getItemValue('seasonOneArc')}
                      onChange={(e) => updateItem('seasonOneArc', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={3}
                      placeholder="How this character changes throughout the first season"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Long-Term Arc (Optional)</label>
                    <textarea
                      value={getItemValue('longTermArc')}
                      onChange={(e) => updateItem('longTermArc', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={3}
                      placeholder="Potential character journey beyond season 1"
                    />
                  </div>
                </div>
              )}

              {/* Location Fields */}
              {selectedType === 'location' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={getItemValue('name')}
                      onChange={(e) => updateItem('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={getItemValue('type')}
                      onChange={(e) => updateItem('type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="interior">Interior</option>
                      <option value="exterior">Exterior</option>
                      <option value="both">Both</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={getItemValue('description')}
                      onChange={(e) => updateItem('description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Atmosphere</label>
                    <textarea
                      value={getItemValue('atmosphere')}
                      onChange={(e) => updateItem('atmosphere', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Significance</label>
                    <textarea
                      value={getItemValue('significance')}
                      onChange={(e) => updateItem('significance', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Visual Details</label>
                    <textarea
                      value={getItemValue('visualDetails')}
                      onChange={(e) => updateItem('visualDetails', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Soundscape</label>
                    <textarea
                      value={getItemValue('soundscape')}
                      onChange={(e) => updateItem('soundscape', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={2}
                    />
                  </div>
                </div>
              )}

              {/* Timeline Fields */}
              {selectedType === 'timeline' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date/Time</label>
                    <input
                      type="text"
                      value={getItemValue('date')}
                      onChange={(e) => updateItem('date', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., 10 years ago, Summer 1985"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Event</label>
                    <textarea
                      value={getItemValue('event')}
                      onChange={(e) => updateItem('event', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Significance</label>
                    <textarea
                      value={getItemValue('significance')}
                      onChange={(e) => updateItem('significance', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Characters Involved</label>
                    <textarea
                      value={getItemValue('charactersInvolved') || ''}
                      onChange={(e) => updateItem('charactersInvolved', e.target.value.split(',').map(s => s.trim()))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={2}
                      placeholder="Comma-separated character names"
                    />
                  </div>
                </div>
              )}

              {/* Rule Fields */}
              {selectedType === 'rule' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <input
                      type="text"
                      value={getItemValue('category')}
                      onChange={(e) => updateItem('category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., Magic System, Technology, Society"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rule</label>
                    <textarea
                      value={getItemValue('rule')}
                      onChange={(e) => updateItem('rule', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Explanation</label>
                    <textarea
                      value={getItemValue('explanation')}
                      onChange={(e) => updateItem('explanation', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Examples</label>
                    <textarea
                      value={getItemValue('examples')}
                      onChange={(e) => updateItem('examples', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {/* Theme Fields */}
              {selectedType === 'theme' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
                    <input
                      type="text"
                      value={getItemValue('theme')}
                      onChange={(e) => updateItem('theme', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={getItemValue('description')}
                      onChange={(e) => updateItem('description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Symbolism</label>
                    <textarea
                      value={getItemValue('symbolism')}
                      onChange={(e) => updateItem('symbolism', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Manifestations in Story</label>
                    <textarea
                      value={getItemValue('manifestations')}
                      onChange={(e) => updateItem('manifestations', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Character Connections</label>
                    <textarea
                      value={getItemValue('characterConnections')}
                      onChange={(e) => updateItem('characterConnections', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {/* AI Assistant Section */}
              {showAIAssistant && (
                <div className="mt-6 border-t pt-6 space-y-6">
                  {/* Ask AI Question */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Ask AI Assistant</h4>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && askAIQuestion()}
                          placeholder="e.g., What date was the first World's Fair?"
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <button
                          onClick={askAIQuestion}
                          disabled={isAskingAI || !aiPrompt.trim()}
                          className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                        >
                          {isAskingAI ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            'Ask'
                          )}
                        </button>
                      </div>
                      
                      {aiResponse && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{aiResponse}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Generate Ideas */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-700">Generate Ideas</h4>
                      <button
                        onClick={generateAISuggestions}
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
                    
                    {aiSuggestions.length > 0 && (
                      <div className="space-y-2">
                        {aiSuggestions.map((suggestion, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-purple-50 rounded-lg border border-purple-200 hover:border-purple-300 cursor-pointer transition-colors"
                            onClick={() => {
                              // Apply suggestion based on type
                              if (selectedType === 'character' && idx === 0) updateItem('shortSummary', suggestion)
                              else if (selectedType === 'location' && idx === 0) updateItem('description', suggestion)
                              else if (selectedType === 'theme' && idx === 0) updateItem('description', suggestion)
                              // Add more mapping as needed
                            }}
                          >
                            <p className="text-sm text-gray-700">{suggestion}</p>
                            <p className="text-xs text-purple-600 mt-1">Click to use this suggestion</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Delete Button */}
              <button
                onClick={deleteItem}
                className="w-full mt-6 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function BiblePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <StoryBiblePageContent />
    </Suspense>
  )
}
