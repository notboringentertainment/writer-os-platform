'use client'
import { Suspense } from 'react'
import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getUserProfile, getConversations, getConversation, createConversation, updateConversation, deleteConversation, Conversation } from '@/services/supabaseService'
import { WritingProfile } from '@/types'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

function AIAssistantContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const conversationId = searchParams.get('id')
  
  const [profile, setProfile] = useState<WritingProfile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [showConversationList, setShowConversationList] = useState(true)
  const [isSavingConversation, setIsSavingConversation] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

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
        
        // Load conversations
        const allConversations = await getConversations()
        setConversations(allConversations)
        
        // Load specific conversation if ID provided
        if (conversationId) {
          const conversation = await getConversation(conversationId)
          if (conversation) {
            setCurrentConversation(conversation)
            // Ensure timestamps are Date objects
            const messagesWithDates = Array.isArray(conversation.messages) 
              ? conversation.messages.map(msg => ({
                  ...msg,
                  timestamp: new Date(msg.timestamp)
                }))
              : []
            setMessages(messagesWithDates)
          }
        } else {
          // Start new conversation with welcome message
          setCurrentConversation(null) // Clear current conversation
          const welcomeMessage: Message = {
            id: '1',
            role: 'assistant',
            content: `Hello! I'm your personalized AI writing partner. I've studied your creative psychology from our assessment together, and I'm here to help you write in a way that feels authentically *you*.

I know about your taste preferences, the writers who inspire you, your approach to character development, and your storytelling instincts. Every suggestion I make will be tailored specifically to your creative DNA.

What would you like to work on today? I can help with:
• Character development that matches your psychology
• Scene writing that fits your dialogue style  
• Story structure that aligns with your preferences
• Plot development based on your conflict interests
• Or anything else you'd like to explore!

What's on your creative mind?`,
            timestamp: new Date()
          }
          
          setMessages([welcomeMessage])
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      loadData()
    }
  }, [user, router, conversationId])

  useEffect(() => {
    scrollToBottom()
    
    // Auto-save conversation when messages change
    if (messages.length > 1 && user) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        saveCurrentConversation()
      }, 2000)
    }
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [messages, currentConversation, user])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  const saveCurrentConversation = async () => {
    if (messages.length <= 1) return // Don't save if only welcome message
    
    setIsSavingConversation(true)
    try {
      if (currentConversation?.id) {
        // Update existing conversation
        await updateConversation(currentConversation.id, {
          messages: messages
        })
        // Refresh conversation list to update timestamps
        const allConversations = await getConversations()
        setConversations(allConversations)
      } else {
        // Create new conversation
        const title = messages[1]?.content.substring(0, 50) + '...' || 'New Conversation'
        const newConversation = await createConversation(title, messages)
        if (newConversation) {
          setCurrentConversation(newConversation)
          // Update URL without reload
          window.history.replaceState({}, '', `/writing/assistant?id=${newConversation.id}`)
          // Refresh conversation list immediately
          const allConversations = await getConversations()
          setConversations(allConversations)
        }
      }
    } catch (error) {
      console.error('Error saving conversation:', error)
    }
    setIsSavingConversation(false)
  }
  
  const loadConversation = async (conversation: Conversation) => {
    // Save current conversation before switching
    if (currentConversation?.id && messages.length > 1) {
      await saveCurrentConversation()
    }
    router.push(`/writing/assistant?id=${conversation.id}`)
  }
  
  const startNewConversation = async () => {
    // Save current conversation before starting new
    if (currentConversation?.id && messages.length > 1) {
      await saveCurrentConversation()
    }
    router.push('/writing/assistant')
  }
  
  const deleteConversationHandler = async (convId: string) => {
    if (confirm('Are you sure you want to delete this conversation?')) {
      const success = await deleteConversation(convId)
      if (success) {
        const allConversations = await getConversations()
        setConversations(allConversations)
        
        if (currentConversation?.id === convId) {
          startNewConversation()
        }
      }
    }
  }

  const sendMessage = async () => {
    if (!inputValue.trim() || isSending) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsSending(true)

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputValue,
          profile: profile,
          conversationHistory: messages.slice(-6) // Send last 6 messages for context
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.response,
          timestamp: new Date()
        }
        
        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error('Failed to get response')
      }
    } catch (error) {
      console.error('Error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    }

    setIsSending(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to your AI writing partner...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Conversation History Sidebar - Always visible on far left */}
      {showConversationList && (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-gray-900">Conversation History</h3>
              <p className="text-sm text-gray-600 mt-1">{conversations.length} conversations</p>
            </div>
            <button
              onClick={startNewConversation}
              className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100"
              title="New Chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>No conversations yet</p>
                <p className="text-sm mt-1">Start a new conversation to begin</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      currentConversation?.id === conv.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                    onClick={() => loadConversation(conv)}
                  >
                    <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-1">
                      {conv.title}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {new Date(conv.updated_at || conv.created_at || '').toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteConversationHandler(conv.id!)
                        }}
                        className="text-red-600 hover:text-red-800 text-xs"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b flex-shrink-0">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <button
                  onClick={() => setShowConversationList(!showConversationList)}
                  className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 mr-4"
                  title="Toggle History"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <button
                  onClick={() => router.push('/writing')}
                  className="text-gray-600 hover:text-gray-900 mr-4"
                >
                  ← Back to Dashboard
                </button>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Writers Room</h1>
                  <p className="text-sm text-gray-600">Brainstorm, debate & develop with your AI partner</p>
                </div>
              </div>
              <div className="flex items-center text-green-600">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                <span className="text-sm">Connected</span>
              </div>
            </div>
          </div>
        </header>

        {/* Chat Container */}
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto py-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-3xl ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                <div
                  className={`px-4 py-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white shadow-sm border border-gray-200'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </p>
                </div>
                <p className={`text-xs text-gray-500 mt-1 ${
                  message.role === 'user' ? 'text-right' : 'text-left'
                }`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
              
              <div className={`flex-shrink-0 ${
                message.role === 'user' ? 'order-1 mr-3' : 'order-2 ml-3'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-purple-100 text-purple-600'
                }`}>
                  {message.role === 'user' ? 'Y' : 'AI'}
                </div>
              </div>
            </div>
          ))}
          
          {isSending && (
            <div className="flex justify-start">
              <div className="order-2 ml-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-medium">
                  AI
                </div>
              </div>
              <div className="max-w-3xl order-1">
                <div className="bg-white shadow-sm border border-gray-200 px-4 py-3 rounded-2xl">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="flex-shrink-0 bg-white border-t border-gray-200 p-4">
          <div className="flex items-end space-x-3">
            <div className="flex-1">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your writing project..."
                className="w-full px-4 py-3 border border-gray-300 rounded-2xl resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={1}
                style={{ minHeight: '44px', maxHeight: '120px' }}
                disabled={isSending}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isSending}
              className="bg-purple-600 text-white p-3 rounded-2xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          {isSavingConversation && (
            <div className="text-xs text-gray-500 mt-2">
              Saving conversation...
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function WritingAssistantPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <AIAssistantContent />
    </Suspense>
  )
}
