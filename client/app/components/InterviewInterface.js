'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSocket } from '../context/SocketContext'
import VoiceControls from './VoiceControls'
import ChatMessage from './ChatMessage'
import ProgressBar from './ProgressBar'
import InterviewStats from './InterviewStats'
import { Toaster } from 'react-hot-toast'
import { 
  PaperAirplaneIcon, 
  XMarkIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ChatBubbleLeftRightIcon,
  MicrophoneIcon,
  SparklesIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

export default function InterviewInterface({ candidateProfile, onEndInterview }) {
  const { 
    connected, 
    interviewSession, 
    messages, 
    interviewStatus, 
    startInterview, 
    sendMessage, 
    endInterview 
  } = useSocket()

  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showVoiceControls, setShowVoiceControls] = useState(true)
  const [autoSpeak, setAutoSpeak] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Initialize interview when component mounts
  useEffect(() => {
    if (connected && !interviewSession && !isInitialized) {
      startInterview(candidateProfile)
      setIsInitialized(true)
    }
  }, [connected, interviewSession, candidateProfile, startInterview, isInitialized])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-speak agent messages
  useEffect(() => {
    if (autoSpeak && messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.role === 'assistant' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(lastMessage.content)
        utterance.rate = 0.9
        utterance.pitch = 1
        utterance.volume = 0.8
        
        // Use a pleasant voice if available
        const voices = speechSynthesis.getVoices()
        const preferredVoice = voices.find(voice => 
          voice.name.includes('Google') || 
          voice.name.includes('Microsoft') ||
          voice.lang.startsWith('en')
        )
        if (preferredVoice) {
          utterance.voice = preferredVoice
        }
        
        speechSynthesis.speak(utterance)
      }
    }
  }, [messages, autoSpeak])

  const handleSendMessage = (e) => {
    e.preventDefault()
    
    if (!inputMessage.trim() || !connected || !interviewSession) {
      return
    }

    setIsThinking(true)
    sendMessage(inputMessage.trim())
    setInputMessage('')
    setIsTyping(false)
    
    // Simulate AI thinking time
    setTimeout(() => setIsThinking(false), 2000)
  }

  const handleVoiceMessage = (transcript) => {
    if (transcript && connected && interviewSession) {
      setIsThinking(true)
      sendMessage(transcript)
      setTimeout(() => setIsThinking(false), 2000)
    }
  }

  const handleEndInterview = () => {
    if (window.confirm('Are you sure you want to end the interview?')) {
      endInterview()
      onEndInterview()
    }
  }

  const toggleAutoSpeak = () => {
    setAutoSpeak(!autoSpeak)
    if (!autoSpeak) {
      speechSynthesis.cancel() // Stop any current speech
    }
  }

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <SparklesIcon className="w-8 h-8 text-purple-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Connecting to Interview Server</h2>
          <p className="text-gray-400">Preparing your AI-powered interview experience...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 flex flex-col">
      <Toaster 
        position="top-right" 
        toastOptions={{
          className: 'bg-white/10 backdrop-blur-md text-white border border-white/20',
          style: {
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(16px)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }
        }}
      />
      
      {/* Header */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/10 backdrop-blur-md border-b border-white/20 shadow-2xl"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center"
              >
                <SparklesIcon className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  AI Interview Session
                </h1>
                <p className="text-sm text-gray-400">Interviewing {candidateProfile.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${
                  connected 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
                <span>{connected ? 'Connected' : 'Disconnected'}</span>
              </motion.div>

              {/* Auto-speak Toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleAutoSpeak}
                className={`p-3 rounded-xl transition-all ${
                  autoSpeak 
                    ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                    : 'bg-gray-700/50 text-gray-400 border border-gray-600/30'
                }`}
                title={autoSpeak ? 'Disable auto-speak' : 'Enable auto-speak'}
              >
                {autoSpeak ? (
                  <SpeakerWaveIcon className="w-5 h-5" />
                ) : (
                  <SpeakerXMarkIcon className="w-5 h-5" />
                )}
              </motion.button>
              
              {/* End Interview Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleEndInterview}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-medium hover:bg-red-500/30 transition-all"
              >
                <XMarkIcon className="w-4 h-4" />
                <span>End Interview</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <ProgressBar 
          current={interviewStatus.questionCount} 
          max={interviewStatus.maxQuestions}
          phase={interviewStatus.phase}
        />
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            <AnimatePresence>
              {messages.map((message, index) => (
                <ChatMessage 
                  key={message.id || index} 
                  message={message}
                  isLatest={index === messages.length - 1}
                />
              ))}
            </AnimatePresence>
            
            {/* AI Thinking Indicator */}
            {isThinking && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-center space-x-3 text-gray-400"
              >
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm">AI is thinking...</span>
              </motion.div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="border-t border-white/10 bg-white/5 backdrop-blur-md p-6"
          >
            <div className="max-w-4xl mx-auto">
              {/* Voice Controls */}
              {showVoiceControls && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-6"
                >
                  <VoiceControls 
                    onVoiceMessage={handleVoiceMessage}
                    disabled={!connected || !interviewSession || interviewStatus.complete}
                  />
                </motion.div>
              )}

              {/* Text Input */}
              <form onSubmit={handleSendMessage} className="flex space-x-4">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => {
                      setInputMessage(e.target.value)
                      setIsTyping(e.target.value.length > 0)
                    }}
                    placeholder={
                      interviewStatus.complete 
                        ? "Interview completed" 
                        : "Type your response or use voice input..."
                    }
                    disabled={!connected || !interviewSession || interviewStatus.complete}
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all backdrop-blur-md"
                  />
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2"
                    >
                      <ChatBubbleLeftRightIcon className="w-5 h-5 text-purple-400" />
                    </motion.div>
                  )}
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={!inputMessage.trim() || !connected || !interviewSession || interviewStatus.complete}
                  className="px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-medium hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </motion.button>
              </form>

              {/* Quick Actions */}
              <div className="mt-4 flex flex-wrap gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleVoiceMessage("Can you repeat the question?")}
                  disabled={!connected || !interviewSession || interviewStatus.complete}
                  className="px-4 py-2 bg-white/10 text-gray-300 rounded-xl hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all backdrop-blur-md border border-white/10"
                >
                  Repeat Question
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleVoiceMessage("Can you clarify what you mean?")}
                  disabled={!connected || !interviewSession || interviewStatus.complete}
                  className="px-4 py-2 bg-white/10 text-gray-300 rounded-xl hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all backdrop-blur-md border border-white/10"
                >
                  Need Clarification
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowVoiceControls(!showVoiceControls)}
                  className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-xl hover:bg-purple-500/30 transition-all backdrop-blur-md border border-purple-500/30"
                >
                  <MicrophoneIcon className="w-4 h-4 inline mr-2" />
                  {showVoiceControls ? 'Hide' : 'Show'} Voice
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <motion.div 
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-80 bg-white/5 backdrop-blur-md border-l border-white/10 p-6 space-y-6 overflow-y-auto custom-scrollbar"
        >
          <InterviewStats 
            candidateProfile={candidateProfile}
            interviewStatus={interviewStatus}
            messages={messages}
          />
        </motion.div>
      </div>
    </div>
  )
}