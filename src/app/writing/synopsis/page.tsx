'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getUserProfile, getProject, createProject, updateProject, transformCloudProject } from '@/services/supabaseService'

type SynopsisType = 'logline' | 'short' | 'one-page' | 'treatment'

interface SynopsisContent {
  logline: string
  tagline: string
  shortSynopsis: string
  onePageSynopsis: string
  treatment: string
  genre: string
  themes: string[]
  targetAudience: string
  comparisons: string
  uniqueSellingPoints: string
}

export default function SynopsisPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('id')
  
  const [profile, setProfile] = useState<any>(null)
  const [currentProject, setCurrentProject] = useState<any | null>(null)
  const [projectTitle, setProjectTitle] = useState('Untitled Synopsis')
  const [activeType, setActiveType] = useState<SynopsisType>('logline')
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [showAIAssistant, setShowAIAssistant] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const [wordCounts, setWordCounts] = useState<Record<string, number>>({})
  
  const [synopsisContent, setSynopsisContent] = useState<SynopsisContent>({
    logline: '',
    tagline: '',
    shortSynopsis: '',
    onePageSynopsis: '',
    treatment: '',
    genre: '',
    themes: [],
    targetAudience: '',
    comparisons: '',
    uniqueSellingPoints: ''
  })

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
            setSynopsisContent(transformed.content as SynopsisContent)
          }
        } else {
          const newProject = await createProject({
            title: 'Untitled Synopsis',
            type: 'synopsis' as any,
            content: synopsisContent,
            description: 'Synopsis and loglines',
            wordCount: 0,
            pageCount: 0
          })
          
          if (newProject) {
            const transformed = transformCloudProject(newProject)
            setCurrentProject(transformed)
            router.push(`/writing/synopsis?id=${newProject.id}`)
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

  // Calculate word counts
  useEffect(() => {
    const counts = {
      logline: synopsisContent.logline.split(/\s+/).filter(word => word.length > 0).length,
      tagline: synopsisContent.tagline.split(/\s+/).filter(word => word.length > 0).length,
      shortSynopsis: synopsisContent.shortSynopsis.split(/\s+/).filter(word => word.length > 0).length,
      onePageSynopsis: synopsisContent.onePageSynopsis.split(/\s+/).filter(word => word.length > 0).length,
      treatment: synopsisContent.treatment.split(/\s+/).filter(word => word.length > 0).length
    }
    setWordCounts(counts)
  }, [synopsisContent])

  const saveProject = async () => {
    if (!currentProject || isSaving) return
    
    setIsSaving(true)
    setSaveStatus('saving')
    
    try {
      await updateProject(currentProject.id, {
        title: projectTitle,
        content: synopsisContent,
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
  }, [synopsisContent, projectTitle, currentProject])

  const generateAISuggestion = async (type: string) => {
    if (!profile || isGenerating) return
    
    setIsGenerating(true)
    setAiSuggestions([])
    
    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'synopsis_generation',
          type: type,
          currentContent: synopsisContent,
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
    switch (activeType) {
      case 'logline':
        setSynopsisContent({ ...synopsisContent, logline: suggestion })
        break
      case 'short':
        setSynopsisContent({ ...synopsisContent, shortSynopsis: suggestion })
        break
      case 'one-page':
        setSynopsisContent({ ...synopsisContent, onePageSynopsis: suggestion })
        break
      case 'treatment':
        setSynopsisContent({ ...synopsisContent, treatment: suggestion })
        break
    }
    setAiSuggestions([])
  }

  const exportSynopsis = () => {
    // Create a formatted text version
    let content = `${projectTitle}\n${'='.repeat(projectTitle.length)}\n\n`
    
    if (synopsisContent.logline) {
      content += `LOGLINE\n-------\n${synopsisContent.logline}\n\n`
    }
    
    if (synopsisContent.tagline) {
      content += `TAGLINE\n-------\n${synopsisContent.tagline}\n\n`
    }
    
    if (synopsisContent.genre) {
      content += `GENRE: ${synopsisContent.genre}\n\n`
    }
    
    if (synopsisContent.targetAudience) {
      content += `TARGET AUDIENCE: ${synopsisContent.targetAudience}\n\n`
    }
    
    if (synopsisContent.themes.length > 0) {
      content += `THEMES: ${synopsisContent.themes.join(', ')}\n\n`
    }
    
    if (synopsisContent.shortSynopsis) {
      content += `SHORT SYNOPSIS\n--------------\n${synopsisContent.shortSynopsis}\n\n`
    }
    
    if (synopsisContent.onePageSynopsis) {
      content += `ONE-PAGE SYNOPSIS\n-----------------\n${synopsisContent.onePageSynopsis}\n\n`
    }
    
    if (synopsisContent.uniqueSellingPoints) {
      content += `UNIQUE SELLING POINTS\n--------------------\n${synopsisContent.uniqueSellingPoints}\n\n`
    }
    
    if (synopsisContent.comparisons) {
      content += `COMPARISONS\n-----------\n${synopsisContent.comparisons}\n\n`
    }
    
    if (synopsisContent.treatment) {
      content += `TREATMENT\n---------\n${synopsisContent.treatment}\n\n`
    }

    // Create and download file
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_synopsis.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!user) return null

  const synopsisTypes = {
    logline: { name: 'Logline', icon: '📝', maxWords: 50, description: 'One sentence that captures your story' },
    short: { name: 'Short Synopsis', icon: '📄', maxWords: 300, description: 'A paragraph overview' },
    'one-page': { name: 'One-Page Synopsis', icon: '📋', maxWords: 500, description: 'Detailed single page summary' },
    treatment: { name: 'Treatment', icon: '📚', maxWords: 5000, description: 'Full narrative breakdown' }
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
            
            {/* Export Button */}
            <button
              onClick={exportSynopsis}
              className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:bg-white/50 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Export</span>
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
                placeholder="Untitled Synopsis"
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
        {/* Type Selector */}
        <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Synopsis Types</h3>
            <nav className="space-y-2">
              {(Object.keys(synopsisTypes) as SynopsisType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveType(type)}
                  className={`w-full text-left px-3 py-3 rounded-lg transition-colors ${
                    activeType === type
                      ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-xl mt-0.5">{synopsisTypes[type].icon}</span>
                    <div className="flex-1">
                      <div className="font-medium">{synopsisTypes[type].name}</div>
                      <div className="text-xs text-gray-500 mt-1">{synopsisTypes[type].description}</div>
                      {wordCounts[type === 'short' ? 'shortSynopsis' : type === 'one-page' ? 'onePageSynopsis' : type] > 0 && (
                        <div className="text-xs text-gray-400 mt-1">
                          {wordCounts[type === 'short' ? 'shortSynopsis' : type === 'one-page' ? 'onePageSynopsis' : type]} / {synopsisTypes[type].maxWords} words
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </nav>

            {/* Additional Info Section */}
            <div className="mt-8 border-t pt-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Story Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Genre</label>
                  <input
                    type="text"
                    value={synopsisContent.genre}
                    onChange={(e) => setSynopsisContent({ ...synopsisContent, genre: e.target.value })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Thriller"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Target Audience</label>
                  <input
                    type="text"
                    value={synopsisContent.targetAudience}
                    onChange={(e) => setSynopsisContent({ ...synopsisContent, targetAudience: e.target.value })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., 18-35 adults"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Themes</label>
                  <input
                    type="text"
                    value={synopsisContent.themes.join(', ')}
                    onChange={(e) => setSynopsisContent({ 
                      ...synopsisContent, 
                      themes: e.target.value.split(',').map(t => t.trim()).filter(t => t) 
                    })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Comma-separated"
                  />
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Editor Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            {/* Logline */}
            {activeType === 'logline' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Logline</h2>
                  <p className="text-gray-600 mb-6">
                    A single sentence that captures the essence of your story. Include the protagonist, 
                    the central conflict, and what's at stake.
                  </p>
                  
                  <div className="relative">
                    <textarea
                      value={synopsisContent.logline}
                      onChange={(e) => setSynopsisContent({ ...synopsisContent, logline: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                      rows={3}
                      placeholder="When [inciting incident occurs], a [character description] must [objective] or else [consequences]."
                    />
                    <div className={`absolute bottom-2 right-2 text-xs ${
                      wordCounts.logline > synopsisTypes.logline.maxWords ? 'text-red-500' : 'text-gray-400'
                    }`}>
                      {wordCounts.logline} / {synopsisTypes.logline.maxWords} words
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Tagline</h3>
                  <p className="text-gray-600 mb-4">
                    A catchy marketing phrase that captures the mood or theme.
                  </p>
                  <input
                    type="text"
                    value={synopsisContent.tagline}
                    onChange={(e) => setSynopsisContent({ ...synopsisContent, tagline: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., 'In space, no one can hear you scream.'"
                  />
                </div>

                {/* Logline Tips */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">📘 Logline Tips</h4>
                  <ul className="space-y-1 text-sm text-blue-800">
                    <li>• Keep it under 50 words</li>
                    <li>• Focus on the main character and central conflict</li>
                    <li>• Include what's at stake</li>
                    <li>• Make it specific and visual</li>
                    <li>• Avoid character names - use descriptions</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Short Synopsis */}
            {activeType === 'short' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Short Synopsis</h2>
                  <p className="text-gray-600 mb-6">
                    A paragraph-length summary that expands on your logline. Include the setup, 
                    main conflict, and hint at the resolution without spoiling the ending.
                  </p>
                  
                  <div className="relative">
                    <textarea
                      value={synopsisContent.shortSynopsis}
                      onChange={(e) => setSynopsisContent({ ...synopsisContent, shortSynopsis: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={8}
                      placeholder="Start with your protagonist and their world, introduce the inciting incident, describe the main conflict and obstacles, and hint at what's at stake..."
                    />
                    <div className={`absolute bottom-2 right-2 text-xs ${
                      wordCounts.shortSynopsis > synopsisTypes.short.maxWords ? 'text-red-500' : 'text-gray-400'
                    }`}>
                      {wordCounts.shortSynopsis} / {synopsisTypes.short.maxWords} words
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* One-Page Synopsis */}
            {activeType === 'one-page' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">One-Page Synopsis</h2>
                  <p className="text-gray-600 mb-6">
                    A complete summary that covers all major plot points, character arcs, 
                    and reveals the ending. This is typically what producers and agents want to see.
                  </p>
                  
                  <div className="relative">
                    <textarea
                      value={synopsisContent.onePageSynopsis}
                      onChange={(e) => setSynopsisContent({ ...synopsisContent, onePageSynopsis: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={20}
                      placeholder="Act 1: Setup and inciting incident...&#10;&#10;Act 2: Rising action and complications...&#10;&#10;Act 3: Climax and resolution..."
                    />
                    <div className={`absolute bottom-2 right-2 text-xs ${
                      wordCounts.onePageSynopsis > synopsisTypes['one-page'].maxWords ? 'text-red-500' : 'text-gray-400'
                    }`}>
                      {wordCounts.onePageSynopsis} / {synopsisTypes['one-page'].maxWords} words
                    </div>
                  </div>
                </div>

                {/* Structure Guide */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">📗 One-Page Structure</h4>
                  <ul className="space-y-1 text-sm text-green-800">
                    <li>• Opening (1 paragraph): Setup and protagonist introduction</li>
                    <li>• Act 1 (1-2 paragraphs): Inciting incident and first turning point</li>
                    <li>• Act 2 (2-3 paragraphs): Complications and character development</li>
                    <li>• Act 3 (1-2 paragraphs): Climax and resolution</li>
                    <li>• Include the ending - no cliffhangers in synopses!</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Treatment */}
            {activeType === 'treatment' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Treatment</h2>
                  <p className="text-gray-600 mb-6">
                    A detailed narrative prose version of your screenplay. Write it like a short story, 
                    present tense, focusing on what we see and hear.
                  </p>
                  
                  <div className="relative">
                    <textarea
                      value={synopsisContent.treatment}
                      onChange={(e) => setSynopsisContent({ ...synopsisContent, treatment: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={30}
                      placeholder="Write your treatment in present tense, focusing on visual storytelling..."
                    />
                    <div className={`absolute bottom-2 right-2 text-xs ${
                      wordCounts.treatment > synopsisTypes.treatment.maxWords ? 'text-red-500' : 'text-gray-400'
                    }`}>
                      {wordCounts.treatment} / {synopsisTypes.treatment.maxWords} words
                    </div>
                  </div>
                </div>

                {/* Additional Fields */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Unique Selling Points</h3>
                    <textarea
                      value={synopsisContent.uniqueSellingPoints}
                      onChange={(e) => setSynopsisContent({ ...synopsisContent, uniqueSellingPoints: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={4}
                      placeholder="What makes your story unique and marketable?"
                    />
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Comparisons</h3>
                    <textarea
                      value={synopsisContent.comparisons}
                      onChange={(e) => setSynopsisContent({ ...synopsisContent, comparisons: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      rows={3}
                      placeholder="e.g., 'It's like The Social Network meets Black Mirror'"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* AI Suggestions Panel */}
            {showAIAssistant && (
              <div className="mt-8 border-t pt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
                  <button
                    onClick={() => generateAISuggestion(activeType)}
                    disabled={isGenerating}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Generate {synopsisTypes[activeType].name}
                      </>
                    )}
                  </button>
                </div>

                {aiSuggestions.length > 0 ? (
                  <div className="space-y-3">
                    {aiSuggestions.map((suggestion, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-purple-50 rounded-lg border border-purple-200 hover:border-purple-300 cursor-pointer transition-all"
                        onClick={() => applyAISuggestion(suggestion)}
                      >
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{suggestion}</p>
                        <p className="text-xs text-purple-600 mt-2">Click to use this suggestion</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <p className="text-gray-500">Click "Generate" for AI-powered suggestions</p>
                    <p className="text-sm text-gray-400 mt-2">Based on your creative profile and story context</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}