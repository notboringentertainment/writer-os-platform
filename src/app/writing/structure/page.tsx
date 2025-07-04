'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getProject, updateProject, createProject } from '@/services/supabaseService'
import { storyFrameworks, Framework, Beat } from './frameworks'
import { movieExamples } from './movieExamples'

interface StructureData {
  selectedFramework: string
  beats: { [key: string]: string }
  completedBeats: string[]
  notes: string
}

export default function StoryStructurePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('id')
  
  const [project, setProject] = useState<any>(null)
  const [selectedFramework, setSelectedFramework] = useState<Framework>(storyFrameworks[0])
  const [structureData, setStructureData] = useState<StructureData>({
    selectedFramework: storyFrameworks[0].id,
    beats: {},
    completedBeats: [],
    notes: ''
  })
  const [viewMode, setViewMode] = useState<'visual' | 'list'>('visual')
  const [showComparison, setShowComparison] = useState(false)
  const [comparisonFramework, setComparisonFramework] = useState<Framework | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showExamples, setShowExamples] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (projectId && user) {
      loadProject()
    }
  }, [projectId, user])

  const loadProject = async () => {
    const loadedProject = await getProject(projectId!)
    if (loadedProject) {
      setProject(loadedProject)
      if (loadedProject.structureData) {
        setStructureData(loadedProject.structureData)
        const framework = storyFrameworks.find(f => f.id === loadedProject.structureData.selectedFramework)
        if (framework) setSelectedFramework(framework)
      }
    }
  }

  const handleFrameworkChange = (framework: Framework) => {
    setSelectedFramework(framework)
    setStructureData(prev => ({
      ...prev,
      selectedFramework: framework.id
    }))
  }

  const handleBeatChange = (beatId: string, value: string) => {
    setStructureData(prev => ({
      ...prev,
      beats: {
        ...prev.beats,
        [beatId]: value
      }
    }))
  }

  const toggleBeatComplete = (beatId: string) => {
    setStructureData(prev => ({
      ...prev,
      completedBeats: prev.completedBeats.includes(beatId)
        ? prev.completedBeats.filter(id => id !== beatId)
        : [...prev.completedBeats, beatId]
    }))
  }

  const calculateProgress = () => {
    const totalBeats = selectedFramework.beats.length
    const completedBeats = structureData.completedBeats.filter(beatId => 
      selectedFramework.beats.some(beat => beat.id === beatId)
    ).length
    return Math.round((completedBeats / totalBeats) * 100)
  }

  const saveStructure = async () => {
    setIsSaving(true)
    try {
      if (projectId) {
        await updateProject(projectId, {
          structureData,
          lastUpdated: new Date().toISOString()
        })
      } else {
        const newProject = await createProject({
          title: `${selectedFramework.name} Structure`,
          type: 'structure',
          structureData,
          content: '',
          description: `Story structure using ${selectedFramework.name}`,
          wordCount: 0,
          pageCount: 0
        })
        if (newProject) {
          router.push(`/writing/structure?id=${newProject.id}`)
        }
      }
    } catch (error) {
      console.error('Error saving structure:', error)
    }
    setIsSaving(false)
  }

  const exportStructure = () => {
    const content = selectedFramework.beats.map(beat => {
      const userContent = structureData.beats[beat.id] || ''
      const status = structureData.completedBeats.includes(beat.id) ? '✓' : '○'
      return `${status} ${beat.name} (${beat.pageRange}):\n${userContent}\n`
    }).join('\n')
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedFramework.name}-structure.txt`
    a.click()
  }

  const loadMovieExample = (movieId: string) => {
    const example = movieExamples.find(m => m.id === movieId)
    if (example) {
      setStructureData(prev => ({
        ...prev,
        beats: example.beats,
        completedBeats: Object.keys(example.beats)
      }))
      setShowExamples(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/writing')}
                className="text-gray-600 hover:text-gray-900 mr-4"
              >
                ← Back
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Story Structure</h1>
                <p className="text-sm text-gray-600">
                  {project ? project.title : 'Plan your story beats'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Progress Indicator */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Progress:</span>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${calculateProgress()}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {calculateProgress()}%
                </span>
              </div>
              
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('visual')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    viewMode === 'visual' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600'
                  }`}
                >
                  Visual
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600'
                  }`}
                >
                  List
                </button>
              </div>
              
              <button
                onClick={saveStructure}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Framework Selector */}
          <div className="col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-24">
              <h3 className="font-semibold text-gray-900 mb-4">Story Frameworks</h3>
              <div className="space-y-2">
                {storyFrameworks.map(framework => (
                  <button
                    key={framework.id}
                    onClick={() => handleFrameworkChange(framework)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedFramework.id === framework.id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="text-sm">{framework.name}</div>
                    <div className="text-xs text-gray-500">{framework.beats.length} beats</div>
                  </button>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t">
                <button
                  onClick={() => setShowExamples(!showExamples)}
                  className="w-full px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 text-sm font-medium"
                >
                  {showExamples ? 'Hide' : 'Show'} Examples
                </button>
                
                <button
                  onClick={() => setShowComparison(!showComparison)}
                  className="w-full mt-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-sm font-medium"
                >
                  Compare Structures
                </button>
                
                <button
                  onClick={exportStructure}
                  className="w-full mt-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                >
                  Export Beat Sheet
                </button>
                
                <button
                  onClick={() => {
                    setStructureData(prev => ({
                      ...prev,
                      beats: {},
                      completedBeats: []
                    }))
                  }}
                  className="w-full mt-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 text-sm font-medium"
                >
                  Clear All Content
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="col-span-9">
            {/* Framework Info */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {selectedFramework.name}
              </h2>
              <p className="text-gray-600 mb-4">{selectedFramework.description}</p>
              
              {showExamples && selectedFramework.examples && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-3">Movie Examples:</h4>
                  <p className="text-sm text-blue-700 mb-3">Click a movie to load its beat breakdown:</p>
                  <div className="space-y-2">
                    {movieExamples
                      .filter(movie => movie.framework === selectedFramework.id)
                      .map((movie) => (
                        <button
                          key={movie.id}
                          onClick={() => loadMovieExample(movie.id)}
                          className="block w-full text-left px-4 py-3 bg-white rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
                        >
                          <span className="font-medium text-blue-900">{movie.title}</span>
                          <span className="text-blue-600 text-sm ml-2">→ Click to load</span>
                        </button>
                      ))}
                  </div>
                  {movieExamples.filter(m => m.framework === selectedFramework.id).length === 0 && (
                    <p className="text-sm text-blue-600 italic">No examples available for this framework yet.</p>
                  )}
                </div>
              )}
            </div>

            {/* Beat Sheet View */}
            {viewMode === 'visual' ? (
              <VisualBeatSheet
                framework={selectedFramework}
                structureData={structureData}
                onBeatChange={handleBeatChange}
                onToggleComplete={toggleBeatComplete}
              />
            ) : (
              <ListBeatSheet
                framework={selectedFramework}
                structureData={structureData}
                onBeatChange={handleBeatChange}
                onToggleComplete={toggleBeatComplete}
              />
            )}

            {/* Comparison Mode */}
            {showComparison && (
              <ComparisonView
                primaryFramework={selectedFramework}
                structureData={structureData}
                onClose={() => setShowComparison(false)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Visual Beat Sheet Component
function VisualBeatSheet({ framework, structureData, onBeatChange, onToggleComplete }: any) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="relative">
        {/* Timeline */}
        <div className="absolute left-0 right-0 top-12 h-1 bg-gray-200 rounded-full" />
        
        {/* Beats */}
        <div className="relative grid grid-cols-1 gap-6">
          {framework.beats.map((beat: Beat, index: number) => {
            const isCompleted = structureData.completedBeats.includes(beat.id)
            const progress = (index / (framework.beats.length - 1)) * 100
            
            return (
              <div key={beat.id} className="relative">
                {/* Beat Marker */}
                <div 
                  className="absolute top-0 w-6 h-6 rounded-full bg-white border-4 transition-colors"
                  style={{ 
                    left: `${progress}%`,
                    transform: 'translateX(-50%)',
                    borderColor: isCompleted ? '#10b981' : beat.type === 'internal' ? '#6366f1' : '#f59e0b'
                  }}
                />
                
                {/* Beat Card */}
                <div className={`mt-12 p-4 rounded-lg border-2 transition-all ${
                  isCompleted 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-300 bg-white'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{beat.name}</h4>
                      <p className="text-sm text-gray-600">{beat.pageRange}</p>
                    </div>
                    <button
                      onClick={() => onToggleComplete(beat.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        isCompleted 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {isCompleted ? '✓' : '○'}
                    </button>
                  </div>
                  
                  <p className="text-sm text-gray-500 mb-3">{beat.description}</p>
                  
                  <textarea
                    value={structureData.beats[beat.id] || ''}
                    onChange={(e) => onBeatChange(beat.id, e.target.value)}
                    placeholder="Describe how this beat plays out in your story..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// List Beat Sheet Component
function ListBeatSheet({ framework, structureData, onBeatChange, onToggleComplete }: any) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="space-y-4">
        {framework.beats.map((beat: Beat) => {
          const isCompleted = structureData.completedBeats.includes(beat.id)
          
          return (
            <div key={beat.id} className={`p-4 rounded-lg border transition-all ${
              isCompleted 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-200 bg-white'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onToggleComplete(beat.id)}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                      isCompleted 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {isCompleted && '✓'}
                  </button>
                  <div>
                    <h4 className="font-semibold text-gray-900">{beat.name}</h4>
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        beat.type === 'internal' 
                          ? 'bg-indigo-100 text-indigo-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {beat.type}
                      </span>
                      <span className="text-gray-500">{beat.pageRange}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-3 ml-9">{beat.description}</p>
              
              <textarea
                value={structureData.beats[beat.id] || ''}
                onChange={(e) => onBeatChange(beat.id, e.target.value)}
                placeholder="Describe how this beat plays out in your story..."
                className="w-full ml-9 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={2}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Comparison View Component
function ComparisonView({ primaryFramework, structureData, onClose }: any) {
  const [secondaryFramework, setSecondaryFramework] = useState<Framework>(
    storyFrameworks.find(f => f.id !== primaryFramework.id) || storyFrameworks[0]
  )
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-6xl w-full max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Structure Comparison</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Compare with:
          </label>
          <select
            value={secondaryFramework.id}
            onChange={(e) => {
              const framework = storyFrameworks.find(f => f.id === e.target.value)
              if (framework) setSecondaryFramework(framework)
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {storyFrameworks
              .filter(f => f.id !== primaryFramework.id)
              .map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))
            }
          </select>
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">{primaryFramework.name}</h4>
            <div className="space-y-2">
              {primaryFramework.beats.map((beat: Beat) => (
                <div key={beat.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium text-sm">{beat.name}</div>
                  <div className="text-xs text-gray-500">{beat.pageRange}</div>
                  {structureData.beats[beat.id] && (
                    <div className="mt-1 text-sm text-gray-700">
                      {structureData.beats[beat.id]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">{secondaryFramework.name}</h4>
            <div className="space-y-2">
              {secondaryFramework.beats.map((beat: Beat) => (
                <div key={beat.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium text-sm">{beat.name}</div>
                  <div className="text-xs text-gray-500">{beat.pageRange}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}