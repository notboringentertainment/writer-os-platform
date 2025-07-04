'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { signOut } from '@/lib/supabase'
import { getUserProfile, getProjects, migrateLocalStorageToSupabase } from '@/services/supabaseService'
import { hasCompletedAssessment } from './utils/storage'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [migrating, setMigrating] = useState(false)
  const [hasMigrated, setHasMigrated] = useState(false)
  const [hasLocalAssessment, setHasLocalAssessment] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      loadUserData()
      checkLocalAssessment()
    }
  }, [user])

  const loadUserData = async () => {
    const userProfile = await getUserProfile()
    const userProjects = await getProjects()
    
    setProfile(userProfile)
    setProjects(userProjects)

    // Check if user has data in localStorage but not in Supabase
    const hasLocalData = localStorage.getItem('assessmentResults') || localStorage.getItem('projects')
    const hasCloudData = userProfile?.assessment_data || userProjects.length > 0
    
    if (hasLocalData && !hasCloudData) {
      setHasMigrated(false)
    } else {
      setHasMigrated(true)
    }
  }

  const checkLocalAssessment = () => {
    setHasLocalAssessment(hasCompletedAssessment())
  }

  const handleMigration = async () => {
    setMigrating(true)
    try {
      await migrateLocalStorageToSupabase()
      await loadUserData()
      setHasMigrated(true)
      alert('Migration successful! Your data is now in the cloud.')
    } catch (error) {
      console.error('Migration error:', error)
      alert('Migration failed. Please try again.')
    }
    setMigrating(false)
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const navigateToAssessment = () => {
    router.push('/assessment')
  }

  const navigateToWriting = () => {
    router.push('/writing')
  }

  const navigateToProjects = () => {
    router.push('/projects')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const hasCompletedCloudAssessment = profile?.assessment_data && profile?.ai_partner_config

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome to AuthenticVoice
              </h1>
              <p className="text-gray-600 mt-1">
                Your AI-Powered Screenwriting Platform
              </p>
            </div>
            <div className="flex items-center gap-4">
              {hasCompletedCloudAssessment && (
                <button
                  onClick={navigateToWriting}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
                >
                  📝 Writing Dashboard
                </button>
              )}
              <div className="text-right">
                <p className="text-sm text-gray-500">Signed in as</p>
                <p className="font-medium text-gray-900">{user.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Migration Alert */}
        {!hasMigrated && (hasLocalAssessment || localStorage.getItem('projects')) && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 mb-8">
            <div className="flex items-start">
              <span className="text-2xl mr-3">⚠️</span>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-800 mb-2">
                  Migrate Your Local Data to Cloud
                </h3>
                <p className="text-yellow-700 mb-4">
                  We found writing data stored locally on this device. Move it to your cloud account to access it from anywhere and never lose your work.
                </p>
                <button
                  onClick={handleMigration}
                  disabled={migrating}
                  className="bg-yellow-600 text-white px-6 py-2 rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors"
                >
                  {migrating ? 'Migrating...' : 'Migrate to Cloud Storage'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Writing Journey Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Your Writing Journey
            </h2>
            
            {hasCompletedCloudAssessment ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-medium">
                    ✅ AI Partnership Established
                  </p>
                  <p className="text-green-700 text-sm mt-1">
                    Your personalized writing partner is ready
                  </p>
                </div>
                
                <button
                  onClick={navigateToWriting}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-xl text-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg transform hover:scale-105"
                >
                  🚀 Start Writing
                </button>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const assessmentType = profile?.assessment_data?.assessmentType
                      if (assessmentType === 'pro' || !assessmentType) {
                        // If pro or no type specified (legacy), go to pro assessment
                        router.push('/writing/assessment-pro?mode=edit')
                      } else {
                        router.push('/assessment?mode=edit')
                      }
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    ✏️ Edit Assessment
                  </button>
                  
                  <button
                    onClick={() => {
                      const assessmentType = profile?.assessment_data?.assessmentType
                      if (assessmentType === 'pro' || !assessmentType) {
                        // If pro or no type specified (legacy), go to pro assessment
                        router.push('/writing/assessment-pro?mode=retake')
                      } else {
                        router.push('/assessment?mode=retake')
                      }
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    🔄 Retake Assessment
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <p className="text-indigo-800 font-medium">
                    🎯 Ready to Begin?
                  </p>
                  <p className="text-indigo-700 text-sm mt-1">
                    Complete your writing assessment to unlock your personalized AI partner
                  </p>
                </div>
                
                <button
                  onClick={navigateToAssessment}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg"
                >
                  📝 Start Writing Assessment
                </button>
              </div>
            )}
          </div>

          {/* Projects Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Your Projects
              </h2>
              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                {projects.length} {projects.length === 1 ? 'project' : 'projects'}
              </span>
            </div>
            
            {projects.length > 0 ? (
              <div className="space-y-3 mb-6">
                {projects.slice(0, 3).map((project) => (
                  <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors cursor-pointer">
                    <h3 className="font-medium text-gray-900">{project.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Last updated: {new Date(project.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
                {projects.length > 3 && (
                  <p className="text-sm text-gray-500 text-center">
                    And {projects.length - 3} more...
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">No projects yet</p>
                <p className="text-sm text-gray-400">
                  Complete your assessment to start writing
                </p>
              </div>
            )}
            
            <button
              onClick={navigateToProjects}
              className="w-full bg-gray-600 text-white py-3 px-6 rounded-xl hover:bg-gray-700 transition-colors"
            >
              View All Projects
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <div className="text-3xl font-bold text-indigo-600">
              {hasCompletedCloudAssessment ? '✅' : '⏳'}
            </div>
            <p className="text-gray-600 mt-2">Assessment Status</p>
          </div>
          
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <div className="text-3xl font-bold text-purple-600">
              {projects.length}
            </div>
            <p className="text-gray-600 mt-2">Total Projects</p>
          </div>
          
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <div className="text-3xl font-bold text-pink-600">
              {hasMigrated ? '☁️' : '💾'}
            </div>
            <p className="text-gray-600 mt-2">
              {hasMigrated ? 'Cloud Storage' : 'Local Storage'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}