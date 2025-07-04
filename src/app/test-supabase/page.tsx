'use client'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function TestSupabase() {
  const [connectionStatus, setConnectionStatus] = useState('Testing...')
  const [error, setError] = useState('')
  
  useEffect(() => {
    const testConnection = async () => {
      try {
        // Create Supabase client
        const supabase = createClientComponentClient()
        
        // Test the connection by checking if we can reach the database
        const { data, error } = await supabase.from('_test').select('*').limit(1)
        
        if (error && error.code === 'PGRST116') {
          // This error means "table doesn't exist" which is actually good - it means we connected!
          setConnectionStatus('✅ Connected to Supabase successfully!')
          setError('')
        } else if (error) {
          setConnectionStatus('❌ Connection failed')
          setError(error.message)
        } else {
          setConnectionStatus('✅ Connected to Supabase successfully!')
          setError('')
        }
        
      } catch (err) {
        setConnectionStatus('❌ Connection failed')
        setError(err instanceof Error ? err.message : 'Unknown error')
      }
    }
    
    testConnection()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Supabase Connection Test
        </h1>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-700">Connection Status:</h3>
            <p className="text-lg">{connectionStatus}</p>
          </div>
          
          {error && (
            <div>
              <h3 className="font-semibold text-gray-700">Error Details:</h3>
              <p className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</p>
            </div>
          )}
          
          <div className="mt-6">
            <h3 className="font-semibold text-gray-700 mb-2">Environment Check:</h3>
            <div className="space-y-1 text-sm">
              <p>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</p>
              <p>Supabase Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</p>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <a 
              href="/"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              ← Back to App
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}