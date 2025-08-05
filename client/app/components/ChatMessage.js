'use client'

import { motion } from 'framer-motion'
import { UserIcon, SparklesIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export default function ChatMessage({ message, isLatest }) {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'

  const messageVariants = {
    hidden: { 
      opacity: 0, 
      y: 20, 
      scale: 0.95 
    },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25
      }
    }
  }

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <motion.div
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`flex max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2`}>
        {/* Avatar */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            isUser 
              ? 'bg-gradient-to-r from-blue-500 to-purple-500' 
              : 'bg-gradient-to-r from-purple-500 to-pink-500'
          } ${isUser ? 'ml-2' : 'mr-2'} shadow-lg`}
        >
          {isUser ? (
            <UserIcon className="w-5 h-5 text-white" />
          ) : (
            <SparklesIcon className="w-5 h-5 text-white" />
          )}
        </motion.div>

        {/* Message Content */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className={`relative px-6 py-4 rounded-2xl shadow-lg backdrop-blur-md border ${
            isUser
              ? 'bg-gradient-to-r from-blue-500/80 to-purple-500/80 text-white border-blue-400/30'
              : 'bg-white/10 text-white border-white/20'
          } ${isLatest ? 'animate-pulse-slow' : ''}`}
        >
          {/* Message Text */}
          <div className="text-sm sm:text-base leading-relaxed">
            {message.content || message.message}
          </div>

          {/* Evaluation Badge */}
          {message.evaluation && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-3 p-3 bg-white/10 rounded-xl border border-white/20"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-300">AI Evaluation</span>
                <div className="flex items-center space-x-1">
                  {message.evaluation.quality === 'good' && (
                    <CheckCircleIcon className="w-4 h-4 text-green-400" />
                  )}
                  {message.evaluation.quality === 'needs_clarification' && (
                    <ExclamationTriangleIcon className="w-4 h-4 text-yellow-400" />
                  )}
                  <span className="text-xs text-gray-400">
                    Score: {message.evaluation.score}/10
                  </span>
                </div>
              </div>
              
              {message.evaluation.feedback && (
                <p className="text-xs text-gray-300 mb-2">
                  {message.evaluation.feedback}
                </p>
              )}
              
              {message.evaluation.keyPoints && message.evaluation.keyPoints.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs font-medium text-gray-400">Key Points:</span>
                  <ul className="space-y-1">
                    {message.evaluation.keyPoints.map((point, index) => (
                      <li key={index} className="text-xs text-gray-300 flex items-start">
                        <span className="w-1 h-1 bg-purple-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}

          {/* Timestamp */}
          <div className={`mt-2 text-xs opacity-60 ${isUser ? 'text-right' : 'text-left'}`}>
            {formatTimestamp(message.timestamp)}
          </div>

          {/* Message Tail */}
          <div
            className={`absolute top-4 w-0 h-0 ${
              isUser
                ? 'right-0 transform translate-x-2 border-l-8 border-l-blue-500/80 border-t-4 border-t-transparent border-b-4 border-b-transparent'
                : 'left-0 transform -translate-x-2 border-r-8 border-r-white/10 border-t-4 border-t-transparent border-b-4 border-b-transparent'
            }`}
          />
        </motion.div>
      </div>
    </motion.div>
  )
}