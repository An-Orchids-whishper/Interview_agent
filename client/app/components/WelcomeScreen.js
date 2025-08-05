'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  UserIcon, 
  BriefcaseIcon, 
  AcademicCapIcon, 
  ChipIcon,
  PlayIcon,
  SparklesIcon,
  MicrophoneIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline'

export default function WelcomeScreen({ onStartInterview }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    experience: '',
    skills: []
  })
  const [isLoading, setIsLoading] = useState(false)

  const steps = [
    {
      title: "Welcome to AI Interview",
      subtitle: "Your intelligent interview partner",
      icon: SparklesIcon,
      color: "from-purple-500 to-pink-500"
    },
    {
      title: "Personal Information",
      subtitle: "Tell us about yourself",
      icon: UserIcon,
      color: "from-blue-500 to-indigo-500"
    },
    {
      title: "Professional Details",
      subtitle: "Your career information",
      icon: BriefcaseIcon,
      color: "from-green-500 to-teal-500"
    },
    {
      title: "Skills & Experience",
      subtitle: "What makes you unique",
      icon: ChipIcon,
      color: "from-orange-500 to-red-500"
    }
  ]

  const skillSuggestions = [
    'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'SQL', 'AWS', 'Docker', 
    'Git', 'HTML/CSS', 'MongoDB', 'PostgreSQL', 'Express.js', 'Next.js', 'Vue.js', 
    'Angular', 'Redux', 'GraphQL', 'REST APIs', 'Microservices', 'Kubernetes', 'CI/CD'
  ]

  const handleSkillToggle = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }))
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleStartInterview = () => {
    if (!formData.name || !formData.position) {
      alert('Please fill in at least your name and position')
      return
    }
    
    setIsLoading(true)
    setTimeout(() => {
      onStartInterview(formData)
    }, 1500)
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1: return formData.name.trim().length > 0
      case 2: return formData.position.trim().length > 0
      case 3: return true // Skills are optional
      default: return true
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r ${steps[currentStep].color} mb-6 shadow-2xl`}
          >
            {React.createElement(steps[currentStep].icon, { className: "w-10 h-10 text-white" })}
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold text-white mb-2"
          >
            {steps[currentStep].title}
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-gray-300"
          >
            {steps[currentStep].subtitle}
          </motion.p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Step {currentStep + 1} of {steps.length}</span>
            <span className="text-sm text-gray-400">{Math.round((currentStep / (steps.length - 1)) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div 
              className={`h-2 rounded-full bg-gradient-to-r ${steps[currentStep].color}`}
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Content Card */}
        <motion.div 
          key={currentStep}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20"
        >
          <AnimatePresence mode="wait">
            {currentStep === 0 && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-6"
              >
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="flex items-center space-x-3 text-white">
                    <MicrophoneIcon className="w-6 h-6 text-green-400" />
                    <span>Voice Integration</span>
                  </div>
                  <div className="flex items-center space-x-3 text-white">
                    <ChatBubbleLeftRightIcon className="w-6 h-6 text-blue-400" />
                    <span>Real-time Chat</span>
                  </div>
                  <div className="flex items-center space-x-3 text-white">
                    <SparklesIcon className="w-6 h-6 text-purple-400" />
                    <span>AI-Powered</span>
                  </div>
                  <div className="flex items-center space-x-3 text-white">
                    <AcademicCapIcon className="w-6 h-6 text-yellow-400" />
                    <span>Smart Evaluation</span>
                  </div>
                </div>
                <p className="text-gray-300 text-lg leading-relaxed">
                  Experience the future of interviews with our AI-powered system. 
                  Get instant feedback, practice with real scenarios, and boost your confidence.
                </p>
              </motion.div>
            )}

            {currentStep === 1 && (
              <motion.div
                key="personal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="Enter your full name"
                    autoFocus
                  />
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="professional"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Position Applying For *
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="e.g., Frontend Developer, Product Manager"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Years of Experience
                  </label>
                  <select
                    value={formData.experience}
                    onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="" className="text-gray-900">Select experience level</option>
                    <option value="0-1" className="text-gray-900">0-1 years (Entry Level)</option>
                    <option value="2-3" className="text-gray-900">2-3 years (Junior)</option>
                    <option value="4-6" className="text-gray-900">4-6 years (Mid Level)</option>
                    <option value="7-10" className="text-gray-900">7-10 years (Senior)</option>
                    <option value="10+" className="text-gray-900">10+ years (Lead/Expert)</option>
                  </select>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="skills"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-white text-sm font-medium mb-4">
                    Select Your Skills (Optional)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto custom-scrollbar">
                    {skillSuggestions.map((skill) => (
                      <motion.button
                        key={skill}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSkillToggle(skill)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          formData.skills.includes(skill)
                            ? 'bg-purple-500 text-white'
                            : 'bg-white/10 text-gray-300 hover:bg-white/20'
                        }`}
                      >
                        {skill}
                      </motion.button>
                    ))}
                  </div>
                  {formData.skills.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-400 mb-2">Selected skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.skills.map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-1 bg-purple-500 text-white text-xs rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBack}
              disabled={currentStep === 0}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                currentStep === 0
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              Back
            </motion.button>

            {currentStep < steps.length - 1 ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNext}
                disabled={!isStepValid()}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  isStepValid()
                    ? `bg-gradient-to-r ${steps[currentStep].color} text-white hover:shadow-lg`
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                Next
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: isLoading ? 1 : 1.05 }}
                whileTap={{ scale: isLoading ? 1 : 0.95 }}
                onClick={handleStartInterview}
                disabled={isLoading || !isStepValid()}
                className={`px-8 py-3 rounded-lg font-medium transition-all flex items-center space-x-2 ${
                  isStepValid() && !isLoading
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Preparing Interview...</span>
                  </>
                ) : (
                  <>
                    <PlayIcon className="w-5 h-5" />
                    <span>Start Interview</span>
                  </>
                )}
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-8"
        >
          <p className="text-gray-400 text-sm">
            Powered by AI • Built for Success • Your Future Starts Here
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}