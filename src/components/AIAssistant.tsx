'use client'
import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getUserProfile } from '@/services/supabaseService'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function AIAssistant() {
  const { user } = useAuth()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [showWelcome, setShowWelcome] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const [showPulse, setShowPulse] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        const profile = await getUserProfile()
        setUserProfile(profile)
      }
    }
    loadProfile()
  }, [user])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Keyboard shortcut to open/close (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(prev => !prev)
        if (!isOpen) {
          setTimeout(() => inputRef.current?.focus(), 100)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Hide welcome message after delay
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('aiAssistantWelcomeShown')
    if (hasSeenWelcome) {
      setShowWelcome(false)
      setShowPulse(false)
    } else {
      const timer = setTimeout(() => {
        setShowWelcome(false)
        localStorage.setItem('aiAssistantWelcomeShown', 'true')
      }, 10000) // Show for 10 seconds
      
      // Stop pulsing after 30 seconds
      const pulseTimer = setTimeout(() => {
        setShowPulse(false)
      }, 30000)
      
      return () => {
        clearTimeout(timer)
        clearTimeout(pulseTimer)
      }
    }
  }, [])

  // Get current context
  const getCurrentContext = () => {
    const context: any = {
      currentPath: pathname,
      currentPage: 'unknown',
      currentSection: null
    }

    // Determine current page and section
    if (pathname === '/') {
      context.currentPage = 'home'
    } else if (pathname === '/assessment') {
      context.currentPage = 'assessment'
    } else if (pathname === '/writing') {
      context.currentPage = 'writing-dashboard'
    } else if (pathname.includes('/writing/screenplay')) {
      context.currentPage = 'screenplay'
    } else if (pathname.includes('/writing/outline')) {
      context.currentPage = 'outline'
    } else if (pathname.includes('/writing/bible')) {
      context.currentPage = 'story-bible'
      // Could parse URL params or state to get specific section
    } else if (pathname.includes('/writing/synopsis')) {
      context.currentPage = 'synopsis'
    }

    return context
  }

  // Get context-aware prompt
  const getContextPrompt = () => {
    const context = getCurrentContext()
    switch (context.currentPage) {
      case 'home':
        return 'Ready to start writing?'
      case 'assessment':
        return 'Need help with your assessment?'
      case 'writing-dashboard':
        return 'What would you like to write today?'
      case 'screenplay':
        return 'Need help with your screenplay?'
      case 'outline':
        return 'Questions about structuring your story?'
      case 'story-bible':
        return 'Building your world? Ask me anything!'
      case 'synopsis':
        return 'Need help crafting your synopsis?'
      default:
        return 'How can I help you write?'
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, newMessage])
    setInput('')
    setIsLoading(true)

    try {
      const context = getCurrentContext()
      
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, newMessage],
          context: {
            ...context,
            userProfile: userProfile,
            mode: 'general-assistant'
          }
        })
      })

      const data = await response.json()
      
      if (data.success) {
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        throw new Error(data.error || 'Failed to get response')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Don't show on login page
  if (!user || pathname === '/login') return null

  return (
    <>
      {/* AI Assistant Button with Welcome */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Welcome Message */}
        {showWelcome && !isOpen && (
          <div className="absolute bottom-full right-0 mb-2 animate-fade-in">
            <div className="bg-white rounded-lg shadow-lg p-3 max-w-xs border border-purple-200">
              <p className="text-sm text-gray-700 font-medium">
                👋 Hi! I'm your AI writing partner
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Click here or press Cmd+K to chat
              </p>
              <button
                onClick={() => setShowWelcome(false)}
                className="absolute -top-2 -right-2 bg-gray-100 rounded-full p-1 hover:bg-gray-200"
              >
                <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Main Button */}
        <button
          onClick={() => {
            setIsOpen(!isOpen)
            setShowWelcome(false)
            setShowPulse(false)
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`relative group transition-all duration-300 ${
            isOpen 
              ? 'bg-gray-600 hover:bg-gray-700 rounded-full p-4' 
              : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105'
          } ${!isOpen && showPulse ? 'animate-pulse-glow' : ''}`}
          title="AI Assistant (Cmd+K)"
        >
          <div className={`flex items-center gap-2 ${isOpen ? '' : 'px-4 py-3'}`}>
            {isOpen ? (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span className="text-white font-medium text-sm whitespace-nowrap">
                  AI Assistant
                </span>
              </>
            )}
          </div>
          
          {/* Context Prompt on Hover */}
          {!isOpen && isHovered && (
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
                {getContextPrompt()}
              </div>
            </div>
          )}
        </button>
      </div>

      {/* Assistant Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">AI Writing Assistant</h3>
                <p className="text-sm text-purple-100">Your personalized writing partner</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <p className="text-gray-600 font-semibold mb-3 text-lg">Hi! I'm your AI writing partner.</p>
                <p className="text-sm text-gray-500 mb-3">How can I help you today?</p>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => {
                      setInput('How do I use the Story Bible?')
                      setTimeout(() => inputRef.current?.focus(), 100)
                    }}
                    className="text-xs bg-purple-50 text-purple-700 px-3 py-2 rounded-lg hover:bg-purple-100 transition-colors text-left"
                  >
                    📚 Story Bible Help
                  </button>
                  <button 
                    onClick={() => {
                      setInput('What makes a good logline?')
                      setTimeout(() => inputRef.current?.focus(), 100)
                    }}
                    className="text-xs bg-purple-50 text-purple-700 px-3 py-2 rounded-lg hover:bg-purple-100 transition-colors text-left"
                  >
                    ✏️ Writing Tips
                  </button>
                  <button 
                    onClick={() => {
                      setInput('How do I create characters?')
                      setTimeout(() => inputRef.current?.focus(), 100)
                    }}
                    className="text-xs bg-purple-50 text-purple-700 px-3 py-2 rounded-lg hover:bg-purple-100 transition-colors text-left"
                  >
                    👥 Character Help
                  </button>
                  <button 
                    onClick={() => {
                      setInput('Where can I find my projects?')
                      setTimeout(() => inputRef.current?.focus(), 100)
                    }}
                    className="text-xs bg-purple-50 text-purple-700 px-3 py-2 rounded-lg hover:bg-purple-100 transition-colors text-left"
                  >
                    📁 Navigation
                  </button>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-3 rounded-lg">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about AuthenticVoice or screenwriting..."
                className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={1}
                style={{ minHeight: '44px', maxHeight: '120px' }}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}