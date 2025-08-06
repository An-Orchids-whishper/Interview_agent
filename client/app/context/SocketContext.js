'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'

const SocketContext = createContext()

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const [interviewSession, setInterviewSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [interviewStatus, setInterviewStatus] = useState({
    phase: 'greeting',
    questionCount: 0,
    maxQuestions: 15,
    complete: false
  })
  const [connectionAttempts, setConnectionAttempts] = useState(0)
  const [isReconnecting, setIsReconnecting] = useState(false)

  useEffect(() => {
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000'
    
    const socketInstance = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    })

    // Connection events
    socketInstance.on('connect', () => {
      console.log('Connected to server')
      setConnected(true)
      setConnectionAttempts(0)
      setIsReconnecting(false)
      toast.success('Connected to interview server')
    })

    socketInstance.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason)
      setConnected(false)
      
      if (reason === 'io server disconnect') {
        // Server disconnected us, try to reconnect
        setIsReconnecting(true)
        toast.error('Server disconnected. Attempting to reconnect...')
      } else {
        toast.error('Disconnected from server')
      }
    })

    socketInstance.on('connect_error', (error) => {
      console.error('Connection error:', error)
      setConnected(false)
      setConnectionAttempts(prev => prev + 1)
      
      if (connectionAttempts < 3) {
        setIsReconnecting(true)
        toast.error(`Connection failed. Attempt ${connectionAttempts + 1}/3`)
      } else {
        setIsReconnecting(false)
        toast.error('Failed to connect to server. Please check your connection.')
      }
    })

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log('Reconnected after', attemptNumber, 'attempts')
      setIsReconnecting(false)
      setConnectionAttempts(0)
      toast.success('Reconnected to server')
    })

    socketInstance.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error)
      setIsReconnecting(true)
    })

    // Interview events
    socketInstance.on('interviewStarted', (data) => {
      console.log('Interview started:', data)
      setInterviewSession({
        sessionId: data.sessionId,
        active: true
      })
      setInterviewStatus({
        phase: data.phase,
        questionCount: data.questionCount,
        maxQuestions: data.maxQuestions,
        complete: false
      })
      
      // Add initial message
      setMessages([{
        id: Date.now(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString()
      }])
      
      toast.success('Interview started successfully!')
    })

    socketInstance.on('agentResponse', (data) => {
      console.log('Agent response:', data)
      
      setInterviewStatus({
        phase: data.phase,
        questionCount: data.questionCount,
        maxQuestions: data.maxQuestions,
        complete: data.complete
      })

      // Add agent message
      setMessages(prev => [...prev, {
        id: Date.now() + Math.random(), // Ensure unique ID
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString(),
        evaluation: data.evaluation
      }])

      if (data.complete) {
        toast.success('Interview completed!')
        setInterviewStatus(prev => ({ ...prev, complete: true }))
      }
    })

    socketInstance.on('interviewCompleted', (data) => {
      console.log('Interview completed:', data)
      setInterviewStatus(prev => ({ ...prev, complete: true }))
      toast.success('Interview completed successfully!')
    })

    socketInstance.on('interviewEnded', (data) => {
      console.log('Interview ended:', data)
      setInterviewSession(null)
      setMessages([])
      setInterviewStatus({
        phase: 'greeting',
        questionCount: 0,
        maxQuestions: 15,
        complete: false
      })
      toast.info('Interview session ended')
    })

    socketInstance.on('error', (data) => {
      console.error('Socket error:', data)
      toast.error(data.message || 'An error occurred')
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  const startInterview = (candidateProfile) => {
    if (!socket) {
      toast.error('Socket not initialized')
      return
    }
    
    if (!connected) {
      toast.error('Not connected to server')
      return
    }
    
    if (interviewSession && interviewSession.active) {
      toast.error('Interview is already active')
      return
    }
    
    if (!candidateProfile || !candidateProfile.name) {
      toast.error('Please provide candidate profile information')
      return
    }
    
    console.log('Starting interview with profile:', candidateProfile)
    socket.emit('startInterview', { candidateProfile })
  }

  const sendMessage = (message) => {
    if (!socket) {
      toast.error('Socket not initialized')
      return
    }
    
    if (!connected) {
      toast.error('Not connected to server')
      return
    }
    
    if (!interviewSession || !interviewSession.active) {
      toast.error('No active interview session')
      return
    }
    
    if (!message || !message.trim()) {
      toast.error('Please provide a message')
      return
    }

    // Add user message immediately
    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: message.trim(),
      timestamp: new Date().toISOString()
    }
    
    setMessages(prev => [...prev, userMessage])
    
    // Send to server
    socket.emit('userMessage', { message: message.trim() })
  }

  const endInterview = () => {
    if (!socket) {
      toast.error('Socket not initialized')
      return
    }
    
    if (!connected) {
      toast.error('Not connected to server')
      return
    }
    
    socket.emit('endInterview')
  }

  const getInterviewStatus = () => {
    if (!socket) {
      console.warn('Socket not initialized')
      return
    }
    
    if (!connected) {
      console.warn('Not connected to server')
      return
    }
    
    socket.emit('getInterviewStatus')
  }

  const value = {
    socket,
    connected,
    interviewSession,
    messages,
    interviewStatus,
    connectionAttempts,
    isReconnecting,
    startInterview,
    sendMessage,
    endInterview,
    getInterviewStatus
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}