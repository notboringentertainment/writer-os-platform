'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getUserProfile, updateUserProfile } from '@/services/supabaseService'
import { WritingProfile } from '../utils/storage'

// Validation function to ensure meaningful responses
const validateAssessment = (responses: Record<string, string>) => {
  // Check if at least 10 fields have meaningful content (more than 10 characters)
  const filledFields = Object.values(responses).filter(
    value => value && value.trim().length > 10
  );
  
  return filledFields.length >= 10;
};

export default function AssessmentPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') // 'edit' or 'retake'
  
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [analysis, setAnalysis] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showRefinement, setShowRefinement] = useState(false)
  const [refinementResponses, setRefinementResponses] = useState<Record<string, string>>({})
  const [finalPartnership, setFinalPartnership] = useState('')
  const [isRefining, setIsRefining] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [validationError, setValidationError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Load existing profile from cloud
  useEffect(() => {
    const loadCloudProfile = async () => {
      if (!user) return

      try {
        // If mode is 'retake', clear everything and start fresh
        if (mode === 'retake') {
          // Clear the assessment data in the cloud
          await updateUserProfile({
            assessment_data: {
              originalResponses: {},
              initialAnalysis: '',
              refinementResponses: {},
              finalPartnership: '',
              createdAt: new Date().toISOString(),
              lastUpdated: new Date().toISOString()
            },
            ai_partner_config: {
              initialAnalysis: '',
              finalPartnership: ''
            }
          })
          
          // Clear local state
          setResponses({})
          setAnalysis('')
          setRefinementResponses({})
          setFinalPartnership('')
          setShowRefinement(false)
        } else {
          // Load existing data for 'edit' mode or no mode
          const cloudProfile = await getUserProfile()
          
          if (cloudProfile?.assessment_data) {
            const assessmentData = cloudProfile.assessment_data as WritingProfile
            setResponses(assessmentData.originalResponses || {})
            setAnalysis(assessmentData.initialAnalysis || '')
            setRefinementResponses(assessmentData.refinementResponses || {})
            setFinalPartnership(assessmentData.finalPartnership || '')
            
            // Set UI state based on what's completed
            if (assessmentData.finalPartnership) {
              setShowRefinement(false)
            } else if (assessmentData.initialAnalysis) {
              setShowRefinement(true)
            }
          }
        }
      } catch (error) {
        console.error('Error loading cloud profile:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      loadCloudProfile()
    }
  }, [user, mode])

  // Auto-save to cloud as user types (with debouncing)
  useEffect(() => {
    if (!user || Object.keys(responses).length === 0) return

    const saveTimer = setTimeout(async () => {
      await saveToCloud()
    }, 2000) // Save after 2 seconds of no typing

    return () => clearTimeout(saveTimer)
  }, [responses, refinementResponses])

  const saveToCloud = async () => {
    if (isSaving) return
    
    setIsSaving(true)
    try {
      const profileData: WritingProfile = {
        originalResponses: responses,
        initialAnalysis: analysis,
        refinementResponses: refinementResponses,
        finalPartnership: finalPartnership,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      }

      await updateUserProfile({
        assessment_data: profileData,
        ai_partner_config: {
          finalPartnership: finalPartnership,
          initialAnalysis: analysis
        }
      })
    } catch (error) {
      console.error('Error saving to cloud:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    const newResponses = { ...responses, [field]: value }
    setResponses(newResponses)
    
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError('')
    }
  }

  const handleRefinementChange = (field: string, value: string) => {
    const newRefinementResponses = { ...refinementResponses, [field]: value }
    setRefinementResponses(newRefinementResponses)
  }

  const analyzeProfile = async () => {
    // Validate before submitting
    if (!validateAssessment(responses)) {
      setValidationError('Please fill out at least 10 fields with meaningful responses (10+ characters) before submitting your assessment.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setIsAnalyzing(true)
    setValidationError('')
    
    // Clear any existing analysis to force a fresh one
    setAnalysis('')
    setShowRefinement(false)
    setFinalPartnership('')
    setRefinementResponses({})
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(responses),
      })
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }
      
      const result = await response.json()
      if (result.success) {
        setAnalysis(result.analysis)
        setShowRefinement(true)
        
        // Save to cloud immediately
        const saveResult = await updateUserProfile({
          assessment_data: {
            originalResponses: responses,
            initialAnalysis: result.analysis,
            refinementResponses: {},
            finalPartnership: '',
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
          },
          ai_partner_config: {
            initialAnalysis: result.analysis,
            finalPartnership: ''
          }
        })
        
        if (!saveResult) {
          console.warn('Failed to save to cloud, but analysis completed')
        }
      } else {
        setAnalysis('Analysis failed. Please try again.')
      }
    } catch (error) {
      console.error('Error:', error)
      setAnalysis(`Error connecting to analysis service: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    setIsAnalyzing(false)
  }

  const refinePartnership = async () => {
    setIsRefining(true)
    try {
      const response = await fetch('/api/refine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalAnalysis: analysis,
          originalResponses: responses,
          refinementResponses: refinementResponses
        }),
      })
      
      const result = await response.json()
      if (result.success) {
        setFinalPartnership(result.analysis)
        
        // Save final partnership to cloud
        await updateUserProfile({
          assessment_data: {
            originalResponses: responses,
            initialAnalysis: analysis,
            refinementResponses: refinementResponses,
            finalPartnership: result.analysis,
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
          },
          ai_partner_config: {
            initialAnalysis: analysis,
            finalPartnership: result.analysis
          }
        })
      } else {
        setFinalPartnership('Refinement failed. Please try again.')
      }
    } catch (error) {
      console.error('Error:', error)
      setFinalPartnership('Error connecting to refinement service.')
    }
    setIsRefining(false)
  }

  const startWriting = () => {
    router.push('/writing')
  }

  // Show loading state while checking authentication and loading profile
  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your writing profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Back
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  AI Writing Partnership Assessment
                </h1>
                {mode === 'retake' && (
                  <p className="text-sm text-orange-600 font-medium">
                    🔄 Starting fresh (previous responses cleared)
                  </p>
                )}
                {mode === 'edit' && (
                  <p className="text-sm text-blue-600 font-medium">
                    ✏️ Editing mode (responses preserved)
                  </p>
                )}
              </div>
            </div>
            {isSaving && (
              <span className="text-sm text-gray-500 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
                Saving...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Let&apos;s Build Your Personalized Writing Partnership
          </h2>
          <p className="text-gray-600">
            Answer these questions to help us understand your unique creative voice and process
          </p>
        </div>

        {/* Validation Error Message */}
        {validationError && (
          <div className="max-w-4xl mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-red-700 font-medium">⚠️ {validationError}</p>
          </div>
        )}
        
        <div className="space-y-8">
          {/* Cinematic DNA Module */}
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                <span className="text-2xl">🎬</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Module 1: Cinematic DNA</h2>
            </div>
            
            <div className="space-y-6">
              {/* Your Creative Constellation */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Creative Constellation</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name 2-3 screenwriters whose work makes you lean forward in your seat. What specific technique of theirs do you find yourself reaching for when you&apos;re stuck?
                    </label>
                    <textarea 
                      className="w-full h-28 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="e.g., Aaron Sorkin's walk-and-talks, Charlie Kaufman's meta-structures, Taylor Sheridan's sparse dialogue..."
                      value={responses.screenwriterTechniques || ''}
                      onChange={(e) => handleInputChange('screenwriterTechniques', e.target.value)}
                    />
                  </div>
                    
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      When you read a brilliant script, what makes you stop and reread a section? Is it the economy of words, the rhythm of dialogue, the visual clarity, or something else entirely?
                    </label>
                    <textarea 
                      className="w-full h-28 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="What specific craft elements make you pause and study how it was done?"
                      value={responses.scriptRereadTriggers || ''}
                      onChange={(e) => handleInputChange('scriptRereadTriggers', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Your Writing North Stars */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Writing North Stars</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Which writers make dialogue look effortless? What&apos;s their Cinematic DNA that you&apos;ve tried to decode and make your own?
                    </label>
                    <textarea 
                      className="w-full h-28 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Who writes dialogue that feels both real and elevated? What's their secret sauce?"
                      value={responses.dialogueMasters || ''}
                      onChange={(e) => handleInputChange('dialogueMasters', e.target.value)}
                    />
                  </div>
                    
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Every writer has their &quot;break glass in case of emergency&quot; influence. Who do you summon for: Action scenes? Emotional moments? Sharp dialogue? Silent character reveals?
                    </label>
                    <textarea 
                      className="w-full h-28 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="List your go-to influences for different types of scenes..."
                      value={responses.emergencyInfluences || ''}
                      onChange={(e) => handleInputChange('emergencyInfluences', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Directors Who Shaped Your Page */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Directors Who Shaped Your Page</h3>
                  
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Which director's films taught you how to write visually? What specific sequence made you realize how much story can be told without words?
                    </label>
                    <textarea 
                      className="w-full h-28 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="e.g., The opening of UP, the diner scene in Heat, the processing sequence in There Will Be Blood..."
                      value={responses.visualDirectors || ''}
                      onChange={(e) => handleInputChange('visualDirectors', e.target.value)}
                    />
                  </div>
                    
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name a director whose style forced you to think differently about pacing and rhythm in your scripts.
                    </label>
                    <textarea 
                      className="w-full h-24 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Who changed how you think about time and tempo on the page?"
                      value={responses.pacingDirectors || ''}
                      onChange={(e) => handleInputChange('pacingDirectors', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* The Scene That Taught You */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">The Scene That Taught You</h3>
                  
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What scene do you return to when you need to remind yourself why you write? Not for inspiration - for craft.
                    </label>
                    <textarea 
                      className="w-full h-28 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="The scene that exemplifies everything you aspire to achieve technically..."
                      value={responses.craftScene || ''}
                      onChange={(e) => handleInputChange('craftScene', e.target.value)}
                    />
                  </div>
                    
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What moment of "perfect screenplay execution" do you see as the gold standard?
                    </label>
                    <textarea 
                      className="w-full h-24 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="A scene where every element - action, dialogue, subtext - works in perfect harmony..."
                      value={responses.goldStandardScene || ''}
                      onChange={(e) => handleInputChange('goldStandardScene', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Character Truths */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Character Truths</h3>
                  
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Which character's introduction made you rethink how to put people on the page?
                    </label>
                    <textarea 
                      className="w-full h-28 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="What character intro taught you something new about revealing character?"
                      value={responses.characterIntroduction || ''}
                      onChange={(e) => handleInputChange('characterIntroduction', e.target.value)}
                    />
                  </div>
                    
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name a character whose silence said more than pages of dialogue. How did the writer achieve that?
                    </label>
                    <textarea 
                      className="w-full h-28 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Describe the character and the techniques used to make their silence speak volumes..."
                      value={responses.silentCharacter || ''}
                      onChange={(e) => handleInputChange('silentCharacter', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Screenwriting Psychology Module */}
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center mr-4">
                <span className="text-2xl">🎭</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Module 2: Screenwriting Psychology</h2>
            </div>
            
            <div className="space-y-6">
              {/* Visual & Cinematic Thinking */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Visual & Cinematic Thinking</h3>
                  
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      When you write a scene, do you see it playing out visually in your mind? Describe your visualization process.
                    </label>
                    <textarea 
                      className="w-full h-28 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Do you see camera angles, actor movements, lighting? Or do you focus on dialogue and let directors handle visuals?"
                      value={responses.visualizationProcess || ''}
                      onChange={(e) => handleInputChange('visualizationProcess', e.target.value)}
                    />
                  </div>
                    
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      How do you approach writing action lines? Show me your style with a brief example.
                    </label>
                    <textarea 
                      className="w-full h-28 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Example: 'Sarah enters, scans the room' vs 'Sarah's eyes dart across shadows, her hand hovering near her weapon'"
                      value={responses.actionLineStyle || ''}
                      onChange={(e) => handleInputChange('actionLineStyle', e.target.value)}
                    />
                  </div>
                    
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      How do you convey emotion without dialogue? Describe your approach to "show don't tell."
                    </label>
                    <textarea 
                      className="w-full h-28 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Do you use body language, symbolism, environment? Give an example of how you'd show fear, love, or betrayal..."
                      value={responses.showDontTell || ''}
                      onChange={(e) => handleInputChange('showDontTell', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Technical Craft & Revision Process */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Technical Craft & Revision Process</h3>
                  
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      How do you handle exposition in your scripts? What's your philosophy on information delivery?
                    </label>
                    <textarea 
                      className="w-full h-28 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Do you weave it into conflict, use visual storytelling, drip-feed information? Describe your approach..."
                      value={responses.expositionApproach || ''}
                      onChange={(e) => handleInputChange('expositionApproach', e.target.value)}
                    />
                  </div>
                    
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Describe your revision process. Are you a "get it right the first time" writer or an "iterative refiner"?
                    </label>
                    <textarea 
                      className="w-full h-28 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Do you polish as you go, vomit draft then revise, focus on dialogue passes? What's your workflow?"
                      value={responses.revisionProcess || ''}
                      onChange={(e) => handleInputChange('revisionProcess', e.target.value)}
                    />
                  </div>
                    
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      How important is technical accuracy (technology, procedures, historical details) in your writing?
                    </label>
                    <textarea 
                      className="w-full h-24 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Do you research extensively, prioritize emotional truth over facts, or find a balance?"
                      value={responses.technicalAccuracy || ''}
                      onChange={(e) => handleInputChange('technicalAccuracy', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Dialogue & Subtext */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Dialogue & Subtext</h3>
                  
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      How do you approach subtext in dialogue? Give an example of how you'd write a breakup scene without using the word "breakup."
                    </label>
                    <textarea 
                      className="w-full h-28 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Show me how you'd have characters talk around the real issue..."
                      value={responses.subtextApproach || ''}
                      onChange={(e) => handleInputChange('subtextApproach', e.target.value)}
                    />
                  </div>
                    
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Do you write dialogue that sounds natural/conversational or heightened/stylized? What's your voice?
                    </label>
                    <textarea 
                      className="w-full h-24 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Tarantino-esque? Sorkin rapid-fire? Naturalistic mumblecore? Describe your dialogue style..."
                      value={responses.dialogueVoice || ''}
                      onChange={(e) => handleInputChange('dialogueVoice', e.target.value)}
                    />
                  </div>
                    
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      How do you make each character's voice distinct? What's your process for character-specific dialogue?
                    </label>
                    <textarea 
                      className="w-full h-28 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Do you use speech patterns, vocabulary, rhythm? How do you ensure characters don't all sound like you?"
                      value={responses.characterVoices || ''}
                      onChange={(e) => handleInputChange('characterVoices', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* World-Building & Continuity */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">World-Building & Continuity</h3>
                  
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      How do you approach world-building? Do you create extensive backstory or discover as you write?
                    </label>
                    <textarea 
                      className="w-full h-28 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Are you a detailed planner with bibles and timelines, or do you build the world through the story?"
                      value={responses.worldBuildingApproach || ''}
                      onChange={(e) => handleInputChange('worldBuildingApproach', e.target.value)}
                    />
                  </div>
                    
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      How do you track continuity across your scripts? What's your system for maintaining consistency?
                    </label>
                    <textarea 
                      className="w-full h-28 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Do you use spreadsheets, story bibles, character sheets? How do you track details, timelines, relationships?"
                      value={responses.continuitySystem || ''}
                      onChange={(e) => handleInputChange('continuitySystem', e.target.value)}
                    />
                  </div>
                    
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      When working within established worlds (adaptations, franchises), how do you balance canon respect with creative freedom?
                    </label>
                    <textarea 
                      className="w-full h-28 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Are you a purist who honors every detail, or do you reinterpret for your vision?"
                      value={responses.canonBalance || ''}
                      onChange={(e) => handleInputChange('canonBalance', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Creative Process & Collaboration Module */}
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-4">
                <span className="text-2xl">✨</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Module 3: Creative Process & Collaboration</h2>
            </div>
              
            <div className="space-y-6">
              {/* Writing Process */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Writing Process</h3>
                  
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Describe a scene you're proud of writing. What made it work? Walk me through your process.
                    </label>
                    <textarea 
                      className="w-full h-28 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Share a specific example - what was the scene, why did it work, how did you craft it?"
                      value={responses.proudScene || ''}
                      onChange={(e) => handleInputChange('proudScene', e.target.value)}
                    />
                  </div>
                    
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      How do you approach writing emotional moments without tipping into melodrama?
                    </label>
                    <textarea 
                      className="w-full h-28 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="What techniques do you use to keep emotion grounded and earned?"
                      value={responses.emotionalApproach || ''}
                      onChange={(e) => handleInputChange('emotionalApproach', e.target.value)}
                    />
                  </div>
                    
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      When you're stuck on a scene, what's your process for breaking through?
                    </label>
                    <textarea 
                      className="w-full h-24 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Do you outline alternatives, write through it, take breaks, change POV?"
                      value={responses.stuckProcess || ''}
                      onChange={(e) => handleInputChange('stuckProcess', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Collaborative Preferences */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Collaborative Preferences</h3>
                  
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      How do you prefer to receive feedback on your writing? What's helpful vs. harmful?
                    </label>
                    <textarea 
                      className="w-full h-28 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Do you want line edits, general notes, questions? What kind of feedback shuts you down vs. fires you up?"
                      value={responses.feedbackStyle || ''}
                      onChange={(e) => handleInputChange('feedbackStyle', e.target.value)}
                    />
                  </div>
                    
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Describe your ideal writing partner or assistant. What qualities matter most?
                    </label>
                    <textarea 
                      className="w-full h-28 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Someone who challenges you, supports you, offers alternatives? Technical expert or emotional guide?"
                      value={responses.idealPartner || ''}
                      onChange={(e) => handleInputChange('idealPartner', e.target.value)}
                    />
                  </div>
                    
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What kind of creative input is most valuable to you? (Examples: alternate dialogue, story logic checks, emotional beat tracking)
                    </label>
                    <textarea 
                      className="w-full h-28 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="What specific help moves your work forward? What do you struggle with that a partner could assist?"
                      value={responses.valuableInput || ''}
                      onChange={(e) => handleInputChange('valuableInput', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Pacing & Structure */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pacing & Structure</h3>
                  
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      How do you approach pacing in your scripts? Do you outline extensively or find it in the writing?
                    </label>
                    <textarea 
                      className="w-full h-28 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Are you a detailed outliner, beat sheet user, or intuitive writer? How do you control rhythm?"
                      value={responses.pacingApproach || ''}
                      onChange={(e) => handleInputChange('pacingApproach', e.target.value)}
                    />
                  </div>
                    
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      How do you handle intercutting between multiple storylines or timelines?
                    </label>
                    <textarea 
                      className="w-full h-24 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Do you write linearly then restructure, or weave as you go? How do you track momentum?"
                      value={responses.intercuttingApproach || ''}
                      onChange={(e) => handleInputChange('intercuttingApproach', e.target.value)}
                    />
                  </div>
                    
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What's your philosophy on scene length? When do you cut and when do you linger?
                    </label>
                    <textarea 
                      className="w-full h-24 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="How do you decide when a scene has said enough? What drives your cutting decisions?"
                      value={responses.sceneLengthPhilosophy || ''}
                      onChange={(e) => handleInputChange('sceneLengthPhilosophy', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
            
        {/* Submit Button */}
        <div className="mt-8 max-w-4xl mx-auto">
          <button 
            className="w-full py-4 px-6 rounded-lg text-lg font-semibold transition-all duration-200 shadow-lg disabled:opacity-50 bg-gradient-to-r from-blue-600 via-orange-600 to-purple-600 text-white hover:from-blue-700 hover:via-orange-700 hover:to-purple-700"
            onClick={analyzeProfile}
            disabled={isAnalyzing}
          >
            {isAnalyzing 
              ? 'Building Your AI Writing Partnership...'
              : 'Start My AI Writing Partnership'
            }
          </button>
        </div>

        {/* Initial Analysis Results */}
        {analysis && !finalPartnership && (
          <div className="mt-8 bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">My Initial Understanding of You as a Writer</h3>
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed mb-6">
              {analysis}
            </div>

            {/* Refinement Section */}
            {showRefinement && (
              <div className="mt-8 bg-gray-50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Help Me Understand You Better</h4>
                <p className="text-gray-600 mb-6">Please answer these questions so I can refine my understanding and become a better writing partner for you:</p>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What parts of my analysis felt accurate? What resonated with you?
                    </label>
                    <textarea 
                      className="w-full h-24 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Tell me what I got right about your creative psychology..."
                      value={refinementResponses.accurate || ''}
                      onChange={(e) => handleRefinementChange('accurate', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What did I miss or get wrong? Where was I off the mark?
                    </label>
                    <textarea 
                      className="w-full h-24 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Help me understand where my analysis missed the mark..."
                      value={refinementResponses.corrections || ''}
                      onChange={(e) => handleRefinementChange('corrections', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What aspects of your writing process or creative psychology should I know more about?
                    </label>
                    <textarea 
                      className="w-full h-28 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Tell me more about how you actually create and what drives your writing..."
                      value={refinementResponses.additional || ''}
                      onChange={(e) => handleRefinementChange('additional', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      How would you like me to help you as your AI writing partner?
                    </label>
                    <textarea 
                      className="w-full h-24 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="What kind of writing assistance would be most valuable to you..."
                      value={refinementResponses.assistance || ''}
                      onChange={(e) => handleRefinementChange('assistance', e.target.value)}
                    />
                  </div>
                </div>

                <button 
                  className="w-full mt-6 bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-6 rounded-lg text-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-200 shadow-lg disabled:opacity-50"
                  onClick={refinePartnership}
                  disabled={isRefining}
                >
                  {isRefining ? 'Refining Our Partnership...' : 'Refine My AI Writing Partner'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Final Partnership Analysis */}
        {finalPartnership && (
          <div className="mt-8 bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Personalized AI Writing Partnership</h3>
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed mb-6">
              {finalPartnership}
            </div>
            
            {/* Transition Bridge - Start Writing Button */}
            <div className="mt-6 bg-gray-50 rounded-xl p-6">
              <p className="text-center text-gray-600 mb-4">
                🎉 <strong>Partnership Established!</strong> Your writing profile is now saved to the cloud and ready to power your personalized writing experience.
              </p>
              
              <button
                onClick={startWriting}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-lg text-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg transform hover:scale-105"
              >
                🚀 Start Writing Together
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}