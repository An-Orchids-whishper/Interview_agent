'use client'

import { motion } from 'framer-motion'
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline'

export default function ProgressBar({ current, max, phase }) {
  const percentage = Math.min((current / max) * 100, 100)
  
  const phaseInfo = {
    greeting: { label: 'Welcome', color: 'from-purple-500 to-pink-500', icon: '👋' },
    introduction: { label: 'Introduction', color: 'from-blue-500 to-indigo-500', icon: '💼' },
    technical: { label: 'Technical', color: 'from-green-500 to-teal-500', icon: '⚡' },
    behavioral: { label: 'Behavioral', color: 'from-orange-500 to-red-500', icon: '🧠' },
    closing: { label: 'Closing', color: 'from-purple-500 to-pink-500', icon: '🎯' }
  }

  const currentPhaseInfo = phaseInfo[phase] || phaseInfo.introduction

  return (
    <div className="bg-white/5 backdrop-blur-md border-b border-white/10 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`w-10 h-10 rounded-full bg-gradient-to-r ${currentPhaseInfo.color} flex items-center justify-center text-lg shadow-lg`}
            >
              {currentPhaseInfo.icon}
            </motion.div>
            <div>
              <motion.h3 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-lg font-semibold text-white"
              >
                {currentPhaseInfo.label} Phase
              </motion.h3>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-sm text-gray-400"
              >
                Question {current} of {max}
              </motion.p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-white">
            <ClockIcon className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium">{Math.round(percentage)}%</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative">
          <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden backdrop-blur-sm">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-full bg-gradient-to-r ${currentPhaseInfo.color} rounded-full relative overflow-hidden`}
            >
              {/* Shimmer effect */}
              <motion.div
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              />
            </motion.div>
          </div>

          {/* Milestone markers */}
          <div className="absolute top-0 w-full h-3 flex justify-between">
            {Array.from({ length: Math.floor(max / 3) }, (_, i) => {
              const milestone = (i + 1) * 3
              const isPassed = current >= milestone
              const position = (milestone / max) * 100

              return (
                <motion.div
                  key={milestone}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2"
                  style={{ left: `${position}%` }}
                >
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    isPassed 
                      ? 'bg-white border-white shadow-lg' 
                      : 'bg-gray-600 border-gray-500'
                  } transition-all duration-300`}>
                    {isPassed && (
                      <CheckCircleIcon className="w-3 h-3 text-green-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Phase indicators */}
        <div className="flex justify-between mt-4 px-2">
          {Object.entries(phaseInfo).map(([key, info], index) => {
            const isActive = key === phase
            const isPassed = Object.keys(phaseInfo).indexOf(phase) > index
            
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex flex-col items-center space-y-1 ${
                  isActive ? 'opacity-100' : isPassed ? 'opacity-80' : 'opacity-40'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-300 ${
                  isActive 
                    ? `bg-gradient-to-r ${info.color} text-white shadow-lg scale-110` 
                    : isPassed
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-600 text-gray-400'
                }`}>
                  {isPassed && !isActive ? (
                    <CheckCircleIcon className="w-5 h-5" />
                  ) : (
                    info.icon
                  )}
                </div>
                <span className={`text-xs font-medium transition-colors duration-300 ${
                  isActive ? 'text-white' : isPassed ? 'text-green-400' : 'text-gray-500'
                }`}>
                  {info.label}
                </span>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}