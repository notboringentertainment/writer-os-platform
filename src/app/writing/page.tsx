'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getUserProfile, getProjects, deleteProject, transformCloudProject } from '@/services/supabaseService'
import ProjectManager from './components/ProjectManager'
import { WritingProfile, Project } from '@/types'

export default function WritingDashboard() {
  const { user, loading } = useAuth()
  const [profile, setProfile] = useState<WritingProfile | null>(null)
  const [allProjects, setAllProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showFullPartnership, setShowFullPartnership] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  const refreshProjects = async () => {
    const cloudProjects = await getProjects()
    // Transform and sort by last updated (most recent first)
    const transformed = cloudProjects.map(p => transformCloudProject(p))
    const sortedProjects = transformed.sort((a, b) => 
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    )
    setAllProjects(sortedProjects)
  }

  useEffect(() => {
    const loadData = async () => {
      if (!user) return

      try {
        // Load user profile from cloud
        const userProfile = await getUserProfile()
        
        if (!userProfile?.assessment_data || !userProfile?.ai_partner_config) {
          // No assessment completed in cloud, redirect to assessment
          router.push('/assessment')
          return
        }

        setProfile({
          ...userProfile.assessment_data,
          finalPartnership: userProfile.ai_partner_config.finalPartnership,
          initialAnalysis: userProfile.ai_partner_config.initialAnalysis
        })
        
        await refreshProjects()
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      loadData()
    }
  }, [user, router])

  // Refresh projects when returning to dashboard
  useEffect(() => {
    const handleFocus = async () => {
      if (user) {
        await refreshProjects()
      }
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user])

  const handleDeleteProject = async (projectId: string) => {
    const success = await deleteProject(projectId)
    if (success) {
      await refreshProjects()
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your writing workspace...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const partnershipText = profile?.finalPartnership || profile?.initialAnalysis || 'No partnership profile found.'
  const hasLongPartnership = partnershipText.length > 500

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AuthenticVoice</h1>
              <p className="text-sm text-gray-600">Your Personalized Writing Partner</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => router.push('/profile')}
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                View Profile
              </button>
              <button
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Sidebar - Projects */}
        <aside className="w-64 bg-gradient-to-b from-gray-50 to-gray-100 border-r border-gray-200 flex flex-col shadow-lg">
          {/* Static Pink Header */}
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-4 flex-shrink-0 shadow-md">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-white font-bold text-lg">
                  Your Projects
                </h3>
                {allProjects.length > 0 && (
                  <div className="text-pink-100 text-xs mt-1">
                    {allProjects.length} active {allProjects.length === 1 ? 'project' : 'projects'}
                  </div>
                )}
              </div>
              <button
                onClick={() => router.push('/writing/screenplay')}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-2 transition-all duration-200 group"
                title="New Screenplay"
              >
                <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Scrollable Project List */}
          <div className="flex-1 overflow-y-auto">
            {allProjects.length > 0 ? (
              <div className="p-4 space-y-2">
                <ProjectManager 
                  projects={allProjects} 
                  onProjectsChange={refreshProjects}
                  onDeleteProject={handleDeleteProject}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6">
                <div className="bg-white rounded-2xl p-8 shadow-sm">
                  <svg className="w-20 h-20 mb-4 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                  <p className="text-sm font-semibold text-gray-600 mb-2">Start Writing</p>
                  <p className="text-xs text-gray-400 text-center mb-4">Create your first screenplay<br/>with AI assistance</p>
                  <button
                    onClick={() => router.push('/writing/screenplay')}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-medium py-2 px-4 rounded-lg hover:shadow-md transition-all duration-200"
                  >
                    New Screenplay
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-8 py-8">
            {/* Welcome Section */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome to Your Writing Studio
              </h2>
              <p className="text-lg text-gray-600">
                Your AI writing partner is ready to help you create screenplays that align with your unique creative psychology.
              </p>
            </div>

            {/* Writing Partnership Summary */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 mb-8 border border-purple-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">
                🤝 Your Writing Partnership Profile
              </h3>
              <div className="bg-white rounded-lg p-4 max-h-48 overflow-y-auto">
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {showFullPartnership 
                    ? partnershipText
                    : (hasLongPartnership ? partnershipText.substring(0, 500) + '...' : partnershipText)
                  }
                </p>
              </div>
              {hasLongPartnership && (
                <button 
                  onClick={() => setShowFullPartnership(!showFullPartnership)}
                  className="mt-3 text-purple-600 hover:text-purple-800 text-sm font-medium"
                >
                  {showFullPartnership ? '← Show Less' : 'View Full Partnership Analysis →'}
                </button>
              )}
            </div>

            {/* Writing Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* New Screenplay */}
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 rounded-lg p-3 mr-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">New Screenplay</h3>
                <p className="text-sm text-gray-600">Start a fresh script</p>
              </div>
            </div>
            <p className="text-gray-700 text-sm mb-4">
              Create a new screenplay with AI guidance tailored to your writing style and preferences.
            </p>
            <button 
              onClick={() => router.push('/writing/screenplay')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create New Script
            </button>
          </div>

          {/* Outline */}
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="bg-yellow-100 rounded-lg p-3 mr-4">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Outline</h3>
                <p className="text-sm text-gray-600">Structure your story</p>
              </div>
            </div>
            <p className="text-gray-700 text-sm mb-4">
              Create detailed outlines with beat sheets and scene breakdowns tailored to your style.
            </p>
            <button 
              onClick={() => router.push('/writing/outline')}
              className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Create Outline
            </button>
          </div>

          {/* Story Bible */}
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="bg-red-100 rounded-lg p-3 mr-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Story Bible</h3>
                <p className="text-sm text-gray-600">World building hub</p>
              </div>
            </div>
            <p className="text-gray-700 text-sm mb-4">
              Maintain consistency with a comprehensive guide to your story world and characters.
            </p>
            <button 
              onClick={() => router.push('/writing/bible')}
              className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
            >
              Build Bible
            </button>
          </div>

          {/* Synopsis */}
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="bg-teal-100 rounded-lg p-3 mr-4">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Synopsis</h3>
                <p className="text-sm text-gray-600">Distill your story</p>
              </div>
            </div>
            <p className="text-gray-700 text-sm mb-4">
              Craft compelling synopses and loglines that capture the essence of your screenplay.
            </p>
            <button 
              onClick={() => router.push('/writing/synopsis')}
              className="w-full bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors"
            >
              Write Synopsis
            </button>
          </div>

          {/* Character Development */}
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="bg-green-100 rounded-lg p-3 mr-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Character Builder</h3>
                <p className="text-sm text-gray-600">Develop compelling characters</p>
              </div>
            </div>
            <p className="text-gray-700 text-sm mb-4">
              Build characters that resonate with your creative psychology and storytelling instincts.
            </p>
            <button 
              onClick={() => router.push('/writing/characters')}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              Build Characters
            </button>
          </div>

          {/* Scene Workshop */}
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="bg-orange-100 rounded-lg p-3 mr-4">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Scene Workshop</h3>
                <p className="text-sm text-gray-600">Craft powerful scenes</p>
              </div>
            </div>
            <p className="text-gray-700 text-sm mb-4">
              Write scenes that match your dialogue style and conflict preferences.
            </p>
            <button className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors">
              Write Scenes
            </button>
          </div>

          {/* Story Structure */}
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="bg-purple-100 rounded-lg p-3 mr-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Story Structure</h3>
                <p className="text-sm text-gray-600">Plan your narrative</p>
              </div>
            </div>
            <p className="text-gray-700 text-sm mb-4">
              Structure your story using frameworks that align with your preferences.
            </p>
            <button 
              onClick={() => router.push('/writing/structure')}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Plan Structure
            </button>
          </div>

          {/* Pro Assessment */}
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="bg-indigo-100 rounded-lg p-3 mr-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Pro Assessment</h3>
                <p className="text-sm text-gray-600">Deep voice analysis</p>
              </div>
            </div>
            <p className="text-gray-700 text-sm mb-4">
              Take the comprehensive 3-module assessment for advanced AI partnership calibration.
            </p>
            <button 
              onClick={() => router.push('/writing/assessment-pro')}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Take Pro Assessment
            </button>
          </div>

          {/* Dialogue Lab */}
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="bg-pink-100 rounded-lg p-3 mr-4">
                <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Dialogue Lab</h3>
                <p className="text-sm text-gray-600">Perfect your dialogue</p>
              </div>
            </div>
            <p className="text-gray-700 text-sm mb-4">
              Write dialogue that matches your preferred conversation style and voice.
            </p>
            <button className="w-full bg-pink-600 text-white py-2 px-4 rounded-lg hover:bg-pink-700 transition-colors">
              Write Dialogue
            </button>
          </div>

          {/* Writing Assistant */}
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="bg-indigo-100 rounded-lg p-3 mr-4">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Writers Room</h3>
                <p className="text-sm text-gray-600">Creative collaboration space</p>
              </div>
            </div>
            <p className="text-gray-700 text-sm mb-4">
              Brainstorm ideas, debate character choices, and break down scenes with your AI partner.
            </p>
            <button 
              onClick={() => router.push('/writing/assistant')}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Enter Writers Room
            </button>
          </div>

          {/* Storyboard */}
          <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="bg-amber-100 rounded-lg p-3 mr-4">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Storyboard</h3>
                <p className="text-sm text-gray-600">Visual scene planning</p>
              </div>
            </div>
            <p className="text-gray-700 text-sm mb-4">
              Visualize your scenes and sequences with AI-powered storyboarding tools.
            </p>
            <button 
              onClick={() => alert('Storyboard feature coming soon!')}
              className="w-full bg-amber-600 text-white py-2 px-4 rounded-lg hover:bg-amber-700 transition-colors opacity-75 cursor-not-allowed"
              disabled
            >
              Storyboard
            </button>
          </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}