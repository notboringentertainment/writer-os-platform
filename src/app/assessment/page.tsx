'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getUserProfile, updateUserProfile } from '@/services/supabaseService'

// Validation function for free assessment
const validateAssessment = (responses: Record<string, string>) => {
  // Check if at least 5 fields have meaningful content (more than 10 characters)
  const filledFields = Object.values(responses).filter(
    value => value && value.trim().length > 10
  );
  
  return filledFields.length >= 5;
};

export default function FreeAssessmentPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [analysis, setAnalysis] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [isNewUser, setIsNewUser] = useState(false)

  // Check if user needs assessment
  useEffect(() => {
    const checkAssessmentStatus = async () => {
      if (!loading && user) {
        const profile = await getUserProfile()
        if (profile?.assessment_data?.initialAnalysis) {
          // Already has assessment, redirect to writing
          router.push('/writing')
        }
      }
      
      // If not logged in, they can still take the free assessment
      setIsLoading(false)
    }

    checkAssessmentStatus()
  }, [user, loading, router])

  const handleResponseChange = (field: string, value: string) => {
    setResponses(prev => ({ ...prev, [field]: value }))
    setValidationError('')
  }

  const analyzeProfile = async () => {
    if (!validateAssessment(responses)) {
      setValidationError('Please provide meaningful responses to at least 5 questions (minimum 10 characters each)')
      return
    }

    setIsAnalyzing(true)
    setValidationError('')

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses, assessmentType: 'free' })
      })

      const data = await response.json()
      
      if (data.success) {
        setAnalysis(data.analysis)
        
        // Save to localStorage for non-authenticated users
        if (!user) {
          localStorage.setItem('free_assessment', JSON.stringify({
            responses,
            analysis: data.analysis,
            timestamp: new Date().toISOString()
          }))
          setIsNewUser(true)
        } else {
          // Save to cloud for authenticated users
          await updateUserProfile({
            assessment_data: {
              originalResponses: responses,
              initialAnalysis: data.analysis,
              refinementResponses: {},
              finalPartnership: data.analysis, // For free users, initial is final
              assessmentType: 'free',
              createdAt: new Date().toISOString(),
              lastUpdated: new Date().toISOString()
            },
            ai_partner_config: {
              initialAnalysis: data.analysis,
              finalPartnership: data.analysis
            }
          })
        }
      }
    } catch (error) {
      console.error('Analysis error:', error)
      setValidationError('Failed to analyze responses. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleContinue = async () => {
    if (user) {
      router.push('/writing')
    } else {
      // Store assessment and redirect to signup
      router.push('/signup?from=assessment')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AuthenticVoice</h1>
              <p className="text-sm text-gray-600">Discover Your Writing Voice</p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-gray-900 text-sm font-medium"
            >
              Back to Home
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!analysis ? (
          <>
            {/* Introduction */}
            <div className="bg-white rounded-xl shadow-md p-8 mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Free Voice Assessment
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-4">
                {"Let's explore your creative influences and discover what makes your writing voice unique. This quick assessment helps our AI understand your storytelling preferences."}
              </p>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-purple-800">
                  <strong>Pro tip:</strong> Be specific and authentic in your responses. The more detail you provide, the better we can understand your creative voice.
                </p>
              </div>
            </div>

            {/* Assessment Questions */}
            <div className="space-y-6">
              {/* Literary Influences */}
              <div className="bg-white rounded-xl shadow-md p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  📚 Your Literary Influences
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Who are 3 writers you admire and what specifically draws you to their work?
                    </label>
                    <textarea
                      value={responses.favoriteWriters || ''}
                      onChange={(e) => handleResponseChange('favoriteWriters', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      rows={4}
                      placeholder="e.g., Aaron Sorkin for his rapid-fire dialogue, Phoebe Waller-Bridge for her dark humor..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {"When you read a book or watch something that feels like 'home' - whose voice is that?"}
                    </label>
                    <textarea
                      value={responses.voiceHome || ''}
                      onChange={(e) => handleResponseChange('voiceHome', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      rows={3}
                      placeholder="The writer whose style feels most natural to you..."
                    />
                  </div>
                </div>
              </div>

              {/* Stories That Shaped You */}
              <div className="bg-white rounded-xl shadow-md p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  🌟 Stories That Shaped You
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What book or film fundamentally changed how you see the world?
                    </label>
                    <textarea
                      value={responses.worldChangingBook || ''}
                      onChange={(e) => handleResponseChange('worldChangingBook', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      rows={3}
                      placeholder="The story that shifted your perspective..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {"What's the book/movie you obsessively recommend to others?"}
                    </label>
                    <textarea
                      value={responses.obsessiveRecommendation || ''}
                      onChange={(e) => handleResponseChange('obsessiveRecommendation', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      rows={3}
                      placeholder="The one you can't stop talking about..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What story do you wish you had written?
                    </label>
                    <textarea
                      value={responses.wishIWrote || ''}
                      onChange={(e) => handleResponseChange('wishIWrote', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      rows={3}
                      placeholder="The story that makes you think 'I wish that was mine'..."
                    />
                  </div>
                </div>
              </div>

              {/* Characters That Resonate */}
              <div className="bg-white rounded-xl shadow-md p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  👥 Characters That Resonate
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Which character do you relate to on an uncomfortable level?
                    </label>
                    <textarea
                      value={responses.relatableCharacter || ''}
                      onChange={(e) => handleResponseChange('relatableCharacter', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      rows={3}
                      placeholder="The character who feels like looking in a mirror..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What villain or morally complex character do you actually understand?
                    </label>
                    <textarea
                      value={responses.understandableVillain || ''}
                      onChange={(e) => handleResponseChange('understandableVillain', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      rows={3}
                      placeholder="The antagonist whose motivations make sense to you..."
                    />
                  </div>
                </div>
              </div>

              {/* Moments That Move You */}
              <div className="bg-white rounded-xl shadow-md p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  ✨ Moments That Move You
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Describe a scene from any story that still gives you chills.
                    </label>
                    <textarea
                      value={responses.chillsScene || ''}
                      onChange={(e) => handleResponseChange('chillsScene', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      rows={3}
                      placeholder="That moment that never fails to affect you..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      What line of dialogue lives rent-free in your head?
                    </label>
                    <textarea
                      value={responses.hauntingLine || ''}
                      onChange={(e) => handleResponseChange('hauntingLine', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      rows={2}
                      placeholder="The quote you find yourself thinking about..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Validation Error */}
            {validationError && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{validationError}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="mt-8 text-center">
              <button
                onClick={analyzeProfile}
                disabled={isAnalyzing}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-8 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing Your Voice...
                  </span>
                ) : (
                  'Discover My Voice'
                )}
              </button>
            </div>
          </>
        ) : (
          /* Analysis Results */
          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Your Creative Voice Analysis
            </h2>
            
            <div className="prose prose-lg max-w-none mb-8">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {analysis}
              </div>
            </div>

            {isNewUser && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 mb-6 border border-purple-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  🎉 Ready to Start Writing?
                </h3>
                <p className="text-gray-700 mb-4">
                  Create your free account to save your voice profile and start working with your personalized AI writing partner.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Unlock Pro Features:</strong> Get access to the comprehensive 3-module assessment, advanced AI analysis, and all professional writing tools.
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <button
                onClick={handleContinue}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-8 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                {user ? 'Continue to Writing Studio' : 'Create Free Account'}
              </button>
              
              {user && (
                <button
                  onClick={() => router.push('/writing/assessment-pro')}
                  className="bg-white text-purple-600 border-2 border-purple-600 py-3 px-8 rounded-lg font-semibold hover:bg-purple-50 transition-all duration-200"
                >
                  Take Pro Assessment
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}