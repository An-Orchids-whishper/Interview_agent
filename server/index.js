const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const { createSession, getSession, removeSession } = require('./graph/graph');
const { llmManager } = require('./graph/llm');

const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.io
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Interview Agent Server is running' });
});

// LLM health check endpoint
app.get('/health/llm', async (req, res) => {
  try {
    const healthStatus = await llmManager.healthCheck();
    res.json(healthStatus);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'LLM health check failed',
      error: error.message
    });
  }
});

// Initialize LLM on startup
llmManager.initialize().then(() => {
  console.log(`🧠 LLM Provider: ${llmManager.getProvider()}`);
}).catch(error => {
  console.error('❌ Failed to initialize LLM on startup:', error);
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  let currentSessionId = null;

  // Event: Start Interview
  socket.on('startInterview', async (data) => {
    try {
      // Create new session
      currentSessionId = uuidv4();
      const session = createSession(currentSessionId);
      
      // Update candidate profile if provided
      if (data.candidateProfile) {
        session.updateCandidateProfile(data.candidateProfile);
      }

      // Start the interview
      const result = await session.startInterview();
      
      if (result.success) {
        socket.emit('interviewStarted', {
          sessionId: currentSessionId,
          message: result.message,
          phase: result.phase,
          questionCount: result.questionCount,
          maxQuestions: result.maxQuestions
        });
        
        console.log(`Interview started for session: ${currentSessionId}`);
      } else {
        socket.emit('error', {
          message: 'Failed to start interview',
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error starting interview:', error);
      socket.emit('error', {
        message: 'Server error while starting interview',
        error: error.message
      });
    }
  });

  // Event: User Message (Answer)
  socket.on('userMessage', async (data) => {
    try {
      if (!currentSessionId) {
        socket.emit('error', { message: 'No active interview session' });
        return;
      }

      const session = getSession(currentSessionId);
      if (!session) {
        socket.emit('error', { message: 'Interview session not found' });
        return;
      }

      // Process the user's answer
      const result = await session.processAnswer(data.message);
      
      if (result.success) {
        // Send agent response
        socket.emit('agentResponse', {
          message: result.message,
          phase: result.phase,
          questionCount: result.questionCount,
          maxQuestions: result.maxQuestions,
          complete: result.complete,
          evaluation: result.evaluation
        });

        // If interview is complete, clean up
        if (result.complete) {
          console.log(`Interview completed for session: ${currentSessionId}`);
          socket.emit('interviewCompleted', {
            sessionId: currentSessionId,
            conversationHistory: session.getConversationHistory()
          });
          
          // Clean up session after a delay
          setTimeout(() => {
            removeSession(currentSessionId);
          }, 60000); // Keep for 1 minute for any final requests
        }
      } else {
        socket.emit('error', {
          message: 'Failed to process your response',
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error processing user message:', error);
      socket.emit('error', {
        message: 'Server error while processing your response',
        error: error.message
      });
    }
  });

  // Event: Get Interview Status
  socket.on('getInterviewStatus', () => {
    try {
      if (!currentSessionId) {
        socket.emit('interviewStatus', { hasActiveSession: false });
        return;
      }

      const session = getSession(currentSessionId);
      if (!session) {
        socket.emit('interviewStatus', { hasActiveSession: false });
        return;
      }

      const status = session.getCurrentState();
      socket.emit('interviewStatus', {
        hasActiveSession: true,
        ...status
      });
    } catch (error) {
      console.error('Error getting interview status:', error);
      socket.emit('error', {
        message: 'Failed to get interview status',
        error: error.message
      });
    }
  });

  // Event: Get Conversation History
  socket.on('getConversationHistory', () => {
    try {
      if (!currentSessionId) {
        socket.emit('conversationHistory', { history: [] });
        return;
      }

      const session = getSession(currentSessionId);
      if (!session) {
        socket.emit('conversationHistory', { history: [] });
        return;
      }

      const history = session.getConversationHistory();
      socket.emit('conversationHistory', { history });
    } catch (error) {
      console.error('Error getting conversation history:', error);
      socket.emit('error', {
        message: 'Failed to get conversation history',
        error: error.message
      });
    }
  });

  // Event: End Interview
  socket.on('endInterview', () => {
    try {
      if (currentSessionId) {
        const session = getSession(currentSessionId);
        if (session) {
          const history = session.getConversationHistory();
          socket.emit('interviewEnded', {
            sessionId: currentSessionId,
            conversationHistory: history
          });
        }
        
        removeSession(currentSessionId);
        console.log(`Interview ended for session: ${currentSessionId}`);
        currentSessionId = null;
      }
    } catch (error) {
      console.error('Error ending interview:', error);
      socket.emit('error', {
        message: 'Failed to end interview properly',
        error: error.message
      });
    }
  });

  // Event: Disconnect
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    
    // Clean up session if exists
    if (currentSessionId) {
      // Don't immediately remove - user might reconnect
      setTimeout(() => {
        const session = getSession(currentSessionId);
        if (session && !session.hasActiveConnection) {
          removeSession(currentSessionId);
          console.log(`Cleaned up abandoned session: ${currentSessionId}`);
        }
      }, 300000); // 5 minutes grace period
    }
  });

  // Handle connection errors
  socket.on('error', (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Express error:', error);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Interview Agent Server running on port ${PORT}`);
  console.log(`📡 Socket.io server ready for connections`);
  console.log(`🔗 Client URL: ${process.env.CLIENT_URL || "http://localhost:3000"}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});