'use client'
import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getUserProfile, getProject, createProject, updateProject, transformCloudProject } from '@/services/supabaseService'
import { Project } from '@/types'
import { 
  Brain, MessageSquare, Sparkles, Network, 
  Plus, 
  Eye, Heart, Zap, TrendingUp, MapPin, 
  ChevronLeft, Trash2, Swords
} from 'lucide-react'

interface Skill {
  name: string
  category: 'professional' | 'life' | 'specialized' | 'combat'
  proficiency: 'novice' | 'intermediate' | 'advanced' | 'expert'
  howAcquired: string
  lastUsed: string
}

interface Conflict {
  type: 'internal' | 'external'
  category: 'want' | 'need' | 'fear' | 'obstacle'
  description: string
  intensity: number // 0-100
  opposingForce: string
}

interface ConflictLayer {
  personal: string[]
  interpersonal: string[]
  professional: string[]
  societal: string[]
  philosophical: string[]
}

interface Character {
  id: string
  name: string
  role: string
  age: string
  zodiac: string
  // Quick Essence
  coreDesire: string
  coreFear: string
  theLie: string
  theTruth: string
  // Physical
  appearance: string
  distinguishingFeatures: string
  style: string
  // Background
  backstory: string
  family: string
  education: string
  career: string
  // Psychology
  mbti: string
  enneagram: string
  bigFive: {
    openness: number
    conscientiousness: number
    extraversion: number
    agreeableness: number
    neuroticism: number
  }
  coreWounds: string[]
  copingMechanisms: string[]
  valuesBeliefs: string
  // Motivations
  coreMotivation: string
  publicGoals: string
  privateGoals: string
  // Voice
  speakingStyle: string
  vocabularyLevel: string
  verbalTics: string[]
  dialogueSamples: Array<{
    context: string
    dialogue: string
    subtext: string
  }>
  // Relationships
  relationships: Array<{
    characterName: string
    relationshipType: string
    description: string
  }>
  // Arc
  characterArc: string
  growthPoints: string[]
  // Abilities
  coreStrengths: string[]
  coreWeaknesses: string[]
  skills: Skill[]
  hiddenAbilities: string[]
  limitations: string[]
  abilitiesGrowth: Array<{
    episode: string
    skillGained: string
    skillLost: string
  }>
  // Conflicts
  conflicts: Conflict[]
  conflictLayers: ConflictLayer
  conflictIntersections: Array<{
    scene: string
    conflictsTriggers: string[]
    result: string
  }>
  // Meta
  notes: string
}

export default function CharacterBuilderPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('id')
  
  // Remove unused profile state
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [projectTitle, setProjectTitle] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedCharacter, setSelectedCharacter] = useState<number>(0)
  const [activeTab, setActiveTab] = useState<'essence' | 'physical' | 'background' | 'psychology' | 'voice' | 'relationships' | 'arc' | 'abilities' | 'conflicts'>('essence')

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
        // Profile data loaded but not used in this component

        if (projectId) {
          const cloudProject = await getProject(projectId)
          if (cloudProject) {
            const transformed = transformCloudProject(cloudProject)
            setCurrentProject(transformed)
            setProjectTitle(transformed.title)
            setCharacters((transformed.content as { characters?: Character[] })?.characters || [])
          }
        } else {
          const newCharacter: Character = createNewCharacter()
          const newProject = await createProject({
            title: 'Untitled Characters',
            type: 'characters' as Project['type'],
            content: { characters: [newCharacter] },
            description: 'Character development',
            wordCount: 0,
            pageCount: 0
          })
          
          if (newProject) {
            const transformed = transformCloudProject(newProject)
            setCurrentProject(transformed)
            setCharacters([newCharacter])
            router.push(`/writing/characters?id=${newProject.id}`)
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

  const createNewCharacter = (): Character => ({
    id: Date.now().toString(),
    name: 'New Character',
    role: 'Protagonist',
    age: '',
    zodiac: '',
    coreDesire: '',
    coreFear: '',
    theLie: '',
    theTruth: '',
    appearance: '',
    distinguishingFeatures: '',
    style: '',
    backstory: '',
    family: '',
    education: '',
    career: '',
    mbti: '',
    enneagram: '',
    bigFive: {
      openness: 50,
      conscientiousness: 50,
      extraversion: 50,
      agreeableness: 50,
      neuroticism: 50
    },
    coreWounds: [],
    copingMechanisms: [],
    valuesBeliefs: '',
    coreMotivation: '',
    publicGoals: '',
    privateGoals: '',
    speakingStyle: '',
    vocabularyLevel: 'Average',
    verbalTics: [],
    dialogueSamples: [],
    relationships: [],
    characterArc: '',
    growthPoints: [],
    // Abilities
    coreStrengths: [],
    coreWeaknesses: [],
    skills: [],
    hiddenAbilities: [],
    limitations: [],
    abilitiesGrowth: [],
    // Conflicts
    conflicts: [],
    conflictLayers: {
      personal: [],
      interpersonal: [],
      professional: [],
      societal: [],
      philosophical: []
    },
    conflictIntersections: [],
    notes: ''
  })

  const saveProject = async () => {
    if (!currentProject || isSaving) return
    
    setIsSaving(true)
    setSaveStatus('saving')
    
    try {
      await updateProject(currentProject.id, {
        title: projectTitle,
        content: { characters },
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
  }, [characters, projectTitle, currentProject])

  const updateCharacter = (updates: Partial<Character>) => {
    const newCharacters = [...characters]
    newCharacters[selectedCharacter] = { ...newCharacters[selectedCharacter], ...updates }
    setCharacters(newCharacters)
  }

  const addCharacter = () => {
    const newCharacter = createNewCharacter()
    setCharacters([...characters, newCharacter])
    setSelectedCharacter(characters.length)
  }

  const deleteCharacter = (index: number) => {
    if (characters.length === 1) return // Don't delete last character
    
    const newCharacters = characters.filter((_, i) => i !== index)
    setCharacters(newCharacters)
    
    // Adjust selected character if needed
    if (selectedCharacter >= newCharacters.length) {
      setSelectedCharacter(newCharacters.length - 1)
    }
  }

  const currentCharacter = characters[selectedCharacter] || createNewCharacter()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
        <div className="px-6 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/writing')}
              className="text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
            <div className="h-6 w-px bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-gray-900">Character Builder</h1>
              <span className="text-gray-400">—</span>
              <input 
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="Enter show or film title"
                className="text-lg font-medium text-gray-700 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-purple-500 focus:outline-none transition-colors placeholder-gray-400"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={saveProject}
              disabled={isSaving}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                saveStatus === 'saved' 
                  ? 'bg-green-500 text-white' 
                  : saveStatus === 'error'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              } disabled:opacity-50`}
            >
              {isSaving ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Character Selector */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Characters</h2>
            <button
              onClick={addCharacter}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Character
            </button>
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-3">
            {characters.map((char, idx) => (
              <button
                key={char.id}
                onClick={() => setSelectedCharacter(idx)}
                className={`flex-shrink-0 px-6 py-3 rounded-lg transition-all ${
                  selectedCharacter === idx
                    ? 'bg-white shadow-md border-2 border-purple-500'
                    : 'bg-white shadow-sm border border-gray-200 hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                    selectedCharacter === idx ? 'bg-purple-600' : 'bg-gray-400'
                  }`}>
                    {char.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">{char.name}</div>
                    <div className="text-sm text-gray-500">{char.role}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Character Details */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Character Header */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {currentCharacter.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div>
                <input 
                  className="text-3xl font-bold text-gray-900 bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-purple-500 focus:outline-none transition-colors mb-2"
                  value={currentCharacter.name}
                  onChange={(e) => updateCharacter({ name: e.target.value })}
                  placeholder="Character Name"
                />
                <div className="flex items-center gap-4">
                  <select 
                    className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-md"
                    value={currentCharacter.role}
                    onChange={(e) => updateCharacter({ role: e.target.value })}
                  >
                    <option>Protagonist</option>
                    <option>Antagonist</option>
                    <option>Mentor</option>
                    <option>Sidekick</option>
                    <option>Love Interest</option>
                    <option>Supporting</option>
                  </select>
                  <input 
                    type="text"
                    placeholder="Age"
                    className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-md w-20"
                    value={currentCharacter.age}
                    onChange={(e) => updateCharacter({ age: e.target.value })}
                  />
                  <input 
                    type="text"
                    placeholder="Zodiac Sign"
                    className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-md w-32"
                    value={currentCharacter.zodiac}
                    onChange={(e) => updateCharacter({ zodiac: e.target.value })}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                <Sparkles className="w-5 h-5" />
              </button>
              {characters.length > 1 && (
                <button 
                  onClick={() => deleteCharacter(selectedCharacter)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-8">
            <nav className="flex space-x-8" aria-label="Tabs">
              {[
                { id: 'essence', label: 'Core Essence', icon: Heart },
                { id: 'physical', label: 'Physical', icon: Eye },
                { id: 'background', label: 'Background', icon: MapPin },
                { id: 'psychology', label: 'Psychology', icon: Brain },
                { id: 'voice', label: 'Voice & Dialogue', icon: MessageSquare },
                { id: 'relationships', label: 'Relationships', icon: Network },
                { id: 'arc', label: 'Character Arc', icon: TrendingUp },
                { id: 'abilities', label: 'Abilities', icon: Zap },
                { id: 'conflicts', label: 'Conflict Matrix', icon: Swords }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === 'essence' && (
              <>
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-purple-600" />
                    Core Essence
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Core Desire</label>
                      <input 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                        placeholder="What do they want most?"
                        value={currentCharacter.coreDesire}
                        onChange={(e) => updateCharacter({ coreDesire: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Core Fear</label>
                      <input 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                        placeholder="What terrifies them?"
                        value={currentCharacter.coreFear}
                        onChange={(e) => updateCharacter({ coreFear: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">The Lie They Believe</label>
                      <input 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                        placeholder="What false belief drives them?"
                        value={currentCharacter.theLie}
                        onChange={(e) => updateCharacter({ theLie: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">The Truth They Need</label>
                      <input 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                        placeholder="What must they learn?"
                        value={currentCharacter.theTruth}
                        onChange={(e) => updateCharacter({ theTruth: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Core Motivation</label>
                  <textarea 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none" 
                    rows={3}
                    placeholder="What drives this character throughout the story?"
                    value={currentCharacter.coreMotivation}
                    onChange={(e) => updateCharacter({ coreMotivation: e.target.value })}
                  />
                </div>
              </>
            )}

            {activeTab === 'physical' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Physical Appearance</label>
                  <textarea 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none" 
                    rows={3}
                    placeholder="Describe their overall appearance..."
                    value={currentCharacter.appearance}
                    onChange={(e) => updateCharacter({ appearance: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Distinguishing Features</label>
                  <input 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                    placeholder="Scars, tattoos, unique traits..."
                    value={currentCharacter.distinguishingFeatures}
                    onChange={(e) => updateCharacter({ distinguishingFeatures: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Style & Fashion</label>
                  <input 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                    placeholder="How do they dress?"
                    value={currentCharacter.style}
                    onChange={(e) => updateCharacter({ style: e.target.value })}
                  />
                </div>
              </>
            )}

            {activeTab === 'background' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Backstory</label>
                  <textarea 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none" 
                    rows={4}
                    placeholder="Their history and how they got here..."
                    value={currentCharacter.backstory}
                    onChange={(e) => updateCharacter({ backstory: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Family</label>
                    <input 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                      placeholder="Family background..."
                      value={currentCharacter.family}
                      onChange={(e) => updateCharacter({ family: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Education</label>
                    <input 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                      placeholder="Educational background..."
                      value={currentCharacter.education}
                      onChange={(e) => updateCharacter({ education: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Career</label>
                    <input 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                      placeholder="Work history..."
                      value={currentCharacter.career}
                      onChange={(e) => updateCharacter({ career: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}

            {activeTab === 'psychology' && (
              <>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">MBTI Type</label>
                    <select 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      value={currentCharacter.mbti}
                      onChange={(e) => updateCharacter({ mbti: e.target.value })}
                    >
                      <option value="">Select MBTI Type</option>
                      <option>INTJ - The Architect</option>
                      <option>INTP - The Thinker</option>
                      <option>ENTJ - The Commander</option>
                      <option>ENTP - The Debater</option>
                      <option>INFJ - The Advocate</option>
                      <option>INFP - The Mediator</option>
                      <option>ENFJ - The Protagonist</option>
                      <option>ENFP - The Campaigner</option>
                      <option>ISTJ - The Logistician</option>
                      <option>ISFJ - The Defender</option>
                      <option>ESTJ - The Executive</option>
                      <option>ESFJ - The Consul</option>
                      <option>ISTP - The Virtuoso</option>
                      <option>ISFP - The Adventurer</option>
                      <option>ESTP - The Entrepreneur</option>
                      <option>ESFP - The Entertainer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Enneagram</label>
                    <select 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      value={currentCharacter.enneagram}
                      onChange={(e) => updateCharacter({ enneagram: e.target.value })}
                    >
                      <option value="">Select Enneagram Type</option>
                      <option>Type 1 - The Perfectionist</option>
                      <option>Type 2 - The Helper</option>
                      <option>Type 3 - The Achiever</option>
                      <option>Type 4 - The Individualist</option>
                      <option>Type 5 - The Investigator</option>
                      <option>Type 6 - The Loyalist</option>
                      <option>Type 7 - The Enthusiast</option>
                      <option>Type 8 - The Challenger</option>
                      <option>Type 9 - The Peacemaker</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Core Wounds</label>
                  <div className="space-y-2">
                    {currentCharacter.coreWounds.map((wound, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input 
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                          value={wound}
                          onChange={(e) => {
                            const newWounds = [...currentCharacter.coreWounds]
                            newWounds[idx] = e.target.value
                            updateCharacter({ coreWounds: newWounds })
                          }}
                          placeholder="Describe a core wound..."
                        />
                        <button 
                          onClick={() => {
                            const newWounds = currentCharacter.coreWounds.filter((_, i) => i !== idx)
                            updateCharacter({ coreWounds: newWounds })
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => updateCharacter({ coreWounds: [...currentCharacter.coreWounds, ''] })}
                      className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                    >
                      + Add Core Wound
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Values & Beliefs</label>
                  <textarea 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none" 
                    rows={3}
                    placeholder="What do they believe in? What are their core values?"
                    value={currentCharacter.valuesBeliefs}
                    onChange={(e) => updateCharacter({ valuesBeliefs: e.target.value })}
                  />
                </div>
              </>
            )}

            {activeTab === 'voice' && (
              <>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Speaking Style</label>
                    <input 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                      placeholder="Formal, casual, poetic..."
                      value={currentCharacter.speakingStyle}
                      onChange={(e) => updateCharacter({ speakingStyle: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vocabulary Level</label>
                    <select 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      value={currentCharacter.vocabularyLevel}
                      onChange={(e) => updateCharacter({ vocabularyLevel: e.target.value })}
                    >
                      <option>Simple</option>
                      <option>Average</option>
                      <option>Educated</option>
                      <option>Highly Educated</option>
                      <option>Technical/Professional</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Verbal Tics & Catchphrases</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {currentCharacter.verbalTics.map((tic, idx) => (
                      <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center gap-1">
                        {tic}
                        <button 
                          onClick={() => {
                            const newTics = currentCharacter.verbalTics.filter((_, i) => i !== idx)
                            updateCharacter({ verbalTics: newTics })
                          }}
                          className="ml-1 text-purple-500 hover:text-purple-700"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <button 
                    onClick={() => {
                      const tic = prompt('Add verbal tic or catchphrase:')
                      if (tic) {
                        updateCharacter({ verbalTics: [...currentCharacter.verbalTics, tic] })
                      }
                    }}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    + Add Verbal Tic
                  </button>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Dialogue Samples</h4>
                  <div className="space-y-4">
                    {currentCharacter.dialogueSamples.map((sample, idx) => (
                      <div key={idx} className="border-l-4 border-purple-500 pl-4 space-y-2">
                        <input 
                          className="w-full text-sm text-gray-600 bg-transparent"
                          placeholder="Context..."
                          value={sample.context}
                          onChange={(e) => {
                            const newSamples = [...currentCharacter.dialogueSamples]
                            newSamples[idx] = { ...sample, context: e.target.value }
                            updateCharacter({ dialogueSamples: newSamples })
                          }}
                        />
                        <input 
                          className="w-full font-medium bg-transparent"
                          placeholder="What they say..."
                          value={sample.dialogue}
                          onChange={(e) => {
                            const newSamples = [...currentCharacter.dialogueSamples]
                            newSamples[idx] = { ...sample, dialogue: e.target.value }
                            updateCharacter({ dialogueSamples: newSamples })
                          }}
                        />
                        <input 
                          className="w-full text-sm text-gray-500 italic bg-transparent"
                          placeholder="Subtext..."
                          value={sample.subtext}
                          onChange={(e) => {
                            const newSamples = [...currentCharacter.dialogueSamples]
                            newSamples[idx] = { ...sample, subtext: e.target.value }
                            updateCharacter({ dialogueSamples: newSamples })
                          }}
                        />
                      </div>
                    ))}
                    <button 
                      onClick={() => {
                        updateCharacter({ 
                          dialogueSamples: [...currentCharacter.dialogueSamples, { context: '', dialogue: '', subtext: '' }]
                        })
                      }}
                      className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                    >
                      + Add Dialogue Sample
                    </button>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'relationships' && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Character Relationships</h4>
                <div className="space-y-3">
                  {currentCharacter.relationships.map((rel, idx) => (
                    <div key={idx} className="flex gap-3">
                      <input 
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Character name"
                        value={rel.characterName}
                        onChange={(e) => {
                          const newRels = [...currentCharacter.relationships]
                          newRels[idx] = { ...rel, characterName: e.target.value }
                          updateCharacter({ relationships: newRels })
                        }}
                      />
                      <input 
                        className="w-40 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Relationship type"
                        value={rel.relationshipType}
                        onChange={(e) => {
                          const newRels = [...currentCharacter.relationships]
                          newRels[idx] = { ...rel, relationshipType: e.target.value }
                          updateCharacter({ relationships: newRels })
                        }}
                      />
                      <input 
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Description"
                        value={rel.description}
                        onChange={(e) => {
                          const newRels = [...currentCharacter.relationships]
                          newRels[idx] = { ...rel, description: e.target.value }
                          updateCharacter({ relationships: newRels })
                        }}
                      />
                      <button 
                        onClick={() => {
                          const newRels = currentCharacter.relationships.filter((_, i) => i !== idx)
                          updateCharacter({ relationships: newRels })
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => {
                      updateCharacter({ 
                        relationships: [...currentCharacter.relationships, {
                          characterName: '',
                          relationshipType: '',
                          description: ''
                        }]
                      })
                    }}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    + Add Relationship
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'arc' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Character Arc</label>
                  <textarea 
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none" 
                    rows={4}
                    placeholder="How does this character change throughout the story?"
                    value={currentCharacter.characterArc}
                    onChange={(e) => updateCharacter({ characterArc: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Key Growth Points</label>
                  <div className="space-y-2">
                    {currentCharacter.growthPoints.map((point, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input 
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                          value={point}
                          onChange={(e) => {
                            const newPoints = [...currentCharacter.growthPoints]
                            newPoints[idx] = e.target.value
                            updateCharacter({ growthPoints: newPoints })
                          }}
                          placeholder="Describe a moment of growth..."
                        />
                        <button 
                          onClick={() => {
                            const newPoints = currentCharacter.growthPoints.filter((_, i) => i !== idx)
                            updateCharacter({ growthPoints: newPoints })
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => updateCharacter({ growthPoints: [...currentCharacter.growthPoints, ''] })}
                      className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                    >
                      + Add Growth Point
                    </button>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'abilities' && (
              <>
                {/* Core Strengths & Weaknesses */}
                <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-600" />
                    Core Abilities
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Natural Strengths</label>
                      <div className="space-y-2">
                        {currentCharacter.coreStrengths.map((strength, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input 
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                              value={strength}
                              onChange={(e) => {
                                const newStrengths = [...currentCharacter.coreStrengths]
                                newStrengths[idx] = e.target.value
                                updateCharacter({ coreStrengths: newStrengths })
                              }}
                              placeholder="What comes naturally..."
                            />
                            <button 
                              onClick={() => {
                                const newStrengths = currentCharacter.coreStrengths.filter((_, i) => i !== idx)
                                updateCharacter({ coreStrengths: newStrengths })
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button 
                          onClick={() => updateCharacter({ coreStrengths: [...currentCharacter.coreStrengths, ''] })}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          + Add Strength
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Fundamental Weaknesses</label>
                      <div className="space-y-2">
                        {currentCharacter.coreWeaknesses.map((weakness, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input 
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                              value={weakness}
                              onChange={(e) => {
                                const newWeaknesses = [...currentCharacter.coreWeaknesses]
                                newWeaknesses[idx] = e.target.value
                                updateCharacter({ coreWeaknesses: newWeaknesses })
                              }}
                              placeholder="What they struggle with..."
                            />
                            <button 
                              onClick={() => {
                                const newWeaknesses = currentCharacter.coreWeaknesses.filter((_, i) => i !== idx)
                                updateCharacter({ coreWeaknesses: newWeaknesses })
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button 
                          onClick={() => updateCharacter({ coreWeaknesses: [...currentCharacter.coreWeaknesses, ''] })}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          + Add Weakness
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Skills Inventory */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Skills Inventory</label>
                  <div className="space-y-3">
                    {currentCharacter.skills.map((skill, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <input 
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                            value={skill.name}
                            onChange={(e) => {
                              const newSkills = [...currentCharacter.skills]
                              newSkills[idx] = { ...skill, name: e.target.value }
                              updateCharacter({ skills: newSkills })
                            }}
                            placeholder="Skill name..."
                          />
                          <div className="flex gap-2">
                            <select 
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              value={skill.category}
                              onChange={(e) => {
                                const newSkills = [...currentCharacter.skills]
                                newSkills[idx] = { ...skill, category: e.target.value as 'professional' | 'life' | 'specialized' | 'combat' }
                                updateCharacter({ skills: newSkills })
                              }}
                            >
                              <option value="professional">Professional</option>
                              <option value="life">Life Skills</option>
                              <option value="specialized">Specialized</option>
                              <option value="combat">Combat</option>
                            </select>
                            <select 
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              value={skill.proficiency}
                              onChange={(e) => {
                                const newSkills = [...currentCharacter.skills]
                                newSkills[idx] = { ...skill, proficiency: e.target.value as 'novice' | 'intermediate' | 'advanced' | 'expert' }
                                updateCharacter({ skills: newSkills })
                              }}
                            >
                              <option value="novice">Novice</option>
                              <option value="intermediate">Intermediate</option>
                              <option value="advanced">Advanced</option>
                              <option value="expert">Expert</option>
                            </select>
                            <button 
                              onClick={() => {
                                const newSkills = currentCharacter.skills.filter((_, i) => i !== idx)
                                updateCharacter({ skills: newSkills })
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <input 
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                            value={skill.howAcquired}
                            onChange={(e) => {
                              const newSkills = [...currentCharacter.skills]
                              newSkills[idx] = { ...skill, howAcquired: e.target.value }
                              updateCharacter({ skills: newSkills })
                            }}
                            placeholder="How they learned this..."
                          />
                          <input 
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                            value={skill.lastUsed}
                            onChange={(e) => {
                              const newSkills = [...currentCharacter.skills]
                              newSkills[idx] = { ...skill, lastUsed: e.target.value }
                              updateCharacter({ skills: newSkills })
                            }}
                            placeholder="Last demonstrated..."
                          />
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={() => updateCharacter({ 
                        skills: [...currentCharacter.skills, {
                          name: '',
                          category: 'professional',
                          proficiency: 'intermediate',
                          howAcquired: '',
                          lastUsed: ''
                        }]
                      })}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      + Add Skill
                    </button>
                  </div>
                </div>

                {/* Hidden Abilities */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hidden Abilities</label>
                    <div className="space-y-2">
                      {currentCharacter.hiddenAbilities.map((ability, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input 
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                            value={ability}
                            onChange={(e) => {
                              const newAbilities = [...currentCharacter.hiddenAbilities]
                              newAbilities[idx] = e.target.value
                              updateCharacter({ hiddenAbilities: newAbilities })
                            }}
                            placeholder="Skills they don't know they have..."
                          />
                          <button 
                            onClick={() => {
                              const newAbilities = currentCharacter.hiddenAbilities.filter((_, i) => i !== idx)
                              updateCharacter({ hiddenAbilities: newAbilities })
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => updateCharacter({ hiddenAbilities: [...currentCharacter.hiddenAbilities, ''] })}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        + Add Hidden Ability
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Limitations</label>
                    <div className="space-y-2">
                      {currentCharacter.limitations.map((limitation, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input 
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                            value={limitation}
                            onChange={(e) => {
                              const newLimitations = [...currentCharacter.limitations]
                              newLimitations[idx] = e.target.value
                              updateCharacter({ limitations: newLimitations })
                            }}
                            placeholder="Skills they SHOULD have but don't..."
                          />
                          <button 
                            onClick={() => {
                              const newLimitations = currentCharacter.limitations.filter((_, i) => i !== idx)
                              updateCharacter({ limitations: newLimitations })
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => updateCharacter({ limitations: [...currentCharacter.limitations, ''] })}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        + Add Limitation
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'conflicts' && (
              <>
                {/* Active Conflicts */}
                <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Swords className="w-5 h-5 text-red-600" />
                    Active Conflicts
                  </h3>
                  <div className="space-y-4">
                    {currentCharacter.conflicts.map((conflict, idx) => (
                      <div key={idx} className="bg-white rounded-lg p-4 border border-red-200">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-4">
                            <select 
                              className="px-3 py-1 text-sm border border-gray-300 rounded-lg"
                              value={conflict.type}
                              onChange={(e) => {
                                const newConflicts = [...currentCharacter.conflicts]
                                newConflicts[idx] = { ...conflict, type: e.target.value as 'internal' | 'external' }
                                updateCharacter({ conflicts: newConflicts })
                              }}
                            >
                              <option value="internal">Internal</option>
                              <option value="external">External</option>
                            </select>
                            <select 
                              className="px-3 py-1 text-sm border border-gray-300 rounded-lg"
                              value={conflict.category}
                              onChange={(e) => {
                                const newConflicts = [...currentCharacter.conflicts]
                                newConflicts[idx] = { ...conflict, category: e.target.value as 'want' | 'need' | 'fear' | 'obstacle' }
                                updateCharacter({ conflicts: newConflicts })
                              }}
                            >
                              <option value="want">Want</option>
                              <option value="need">Need</option>
                              <option value="fear">Fear</option>
                              <option value="obstacle">Obstacle</option>
                            </select>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">Intensity:</span>
                              <input 
                                type="range"
                                min="0"
                                max="100"
                                value={conflict.intensity}
                                onChange={(e) => {
                                  const newConflicts = [...currentCharacter.conflicts]
                                  newConflicts[idx] = { ...conflict, intensity: parseInt(e.target.value) }
                                  updateCharacter({ conflicts: newConflicts })
                                }}
                                className="w-24"
                              />
                              <span className="text-sm font-medium text-gray-700 w-10">{conflict.intensity}%</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => {
                              const newConflicts = currentCharacter.conflicts.filter((_, i) => i !== idx)
                              updateCharacter({ conflicts: newConflicts })
                            }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <input 
                          className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" 
                          value={conflict.description}
                          onChange={(e) => {
                            const newConflicts = [...currentCharacter.conflicts]
                            newConflicts[idx] = { ...conflict, description: e.target.value }
                            updateCharacter({ conflicts: newConflicts })
                          }}
                          placeholder="Describe the conflict..."
                        />
                        <input 
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" 
                          value={conflict.opposingForce}
                          onChange={(e) => {
                            const newConflicts = [...currentCharacter.conflicts]
                            newConflicts[idx] = { ...conflict, opposingForce: e.target.value }
                            updateCharacter({ conflicts: newConflicts })
                          }}
                          placeholder="What opposes this? (person, belief, circumstance...)"
                        />
                      </div>
                    ))}
                    <button 
                      onClick={() => updateCharacter({ 
                        conflicts: [...currentCharacter.conflicts, {
                          type: 'internal',
                          category: 'want',
                          description: '',
                          intensity: 50,
                          opposingForce: ''
                        }]
                      })}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      + Add Conflict
                    </button>
                  </div>
                </div>

                {/* Conflict Layers */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Conflict Layers</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(currentCharacter.conflictLayers).map(([layer, conflicts]) => (
                      <div key={layer} className="bg-gray-50 rounded-lg p-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">{layer} Conflicts</label>
                        <div className="space-y-2">
                          {conflicts.map((conflict: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-2">
                              <input 
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm" 
                                value={conflict}
                                onChange={(e) => {
                                  const newLayers = { ...currentCharacter.conflictLayers }
                                  newLayers[layer as keyof ConflictLayer][idx] = e.target.value
                                  updateCharacter({ conflictLayers: newLayers })
                                }}
                                placeholder={`${layer} conflict...`}
                              />
                              <button 
                                onClick={() => {
                                  const newLayers = { ...currentCharacter.conflictLayers }
                                  newLayers[layer as keyof ConflictLayer] = conflicts.filter((_: string, i: number) => i !== idx)
                                  updateCharacter({ conflictLayers: newLayers })
                                }}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          <button 
                            onClick={() => {
                              const newLayers = { ...currentCharacter.conflictLayers }
                              newLayers[layer as keyof ConflictLayer] = [...conflicts, '']
                              updateCharacter({ conflictLayers: newLayers })
                            }}
                            className="text-xs text-red-600 hover:text-red-700 font-medium"
                          >
                            + Add {layer} conflict
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Conflict Intersections */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Conflict Intersections</label>
                  <p className="text-xs text-gray-500 mb-3">Map scenes where multiple conflicts collide for maximum drama</p>
                  <div className="space-y-3">
                    {currentCharacter.conflictIntersections.map((intersection, idx) => (
                      <div key={idx} className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                        <div className="grid grid-cols-3 gap-3 mb-2">
                          <input 
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent" 
                            value={intersection.scene}
                            onChange={(e) => {
                              const newIntersections = [...currentCharacter.conflictIntersections]
                              newIntersections[idx] = { ...intersection, scene: e.target.value }
                              updateCharacter({ conflictIntersections: newIntersections })
                            }}
                            placeholder="Scene/Episode..."
                          />
                          <input 
                            className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent" 
                            value={intersection.conflictsTriggers.join(', ')}
                            onChange={(e) => {
                              const newIntersections = [...currentCharacter.conflictIntersections]
                              newIntersections[idx] = { ...intersection, conflictsTriggers: e.target.value.split(',').map(s => s.trim()) }
                              updateCharacter({ conflictIntersections: newIntersections })
                            }}
                            placeholder="Conflicts that collide (comma-separated)..."
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input 
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent" 
                            value={intersection.result}
                            onChange={(e) => {
                              const newIntersections = [...currentCharacter.conflictIntersections]
                              newIntersections[idx] = { ...intersection, result: e.target.value }
                              updateCharacter({ conflictIntersections: newIntersections })
                            }}
                            placeholder="Result: explosive scene, revelation, breakdown..."
                          />
                          <button 
                            onClick={() => {
                              const newIntersections = currentCharacter.conflictIntersections.filter((_, i) => i !== idx)
                              updateCharacter({ conflictIntersections: newIntersections })
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={() => updateCharacter({ 
                        conflictIntersections: [...currentCharacter.conflictIntersections, {
                          scene: '',
                          conflictsTriggers: [],
                          result: ''
                        }]
                      })}
                      className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
                    >
                      + Add Conflict Intersection
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Notes Section (always visible at bottom) */}
            <div className="border-t pt-6 mt-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
              <textarea 
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none" 
                rows={3}
                placeholder="Any other important information about this character..."
                value={currentCharacter.notes}
                onChange={(e) => updateCharacter({ notes: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}