# 🚀 AI-Powered Interview Agent

A production-ready AI interview system built with Next.js, LangGraph, and real-time communication. Experience intelligent interviews with adaptive AI that flows naturally through conversation phases.

![AI Interview Agent](https://img.shields.io/badge/AI-Powered-blue) ![Next.js](https://img.shields.io/badge/Next.js-14-black) ![LangGraph](https://img.shields.io/badge/LangGraph-AI-green) ![Socket.io](https://img.shields.io/badge/Socket.io-Real--Time-red)

## ✨ Key Features

### 🎯 **Intelligent Interview Flow**
- **Fixed LAN Graph Logic**: No more infinite loops or repeated questions
- **Adaptive Questioning**: AI dynamically generates questions based on your responses
- **Multi-Phase Structure**: Introduction → Technical → Behavioral → Closing
- **Context-Aware**: Remembers previous answers and builds upon them
- **Real-Time Evaluation**: Instant feedback on answer quality

### 🤖 **Enhanced AI Integration**
- **Multiple AI Providers**: Google Gemini, OpenAI, and OpenRouter support with automatic fallbacks
- **Robust Error Handling**: Graceful degradation when AI services are unavailable
- **Smart Retry Logic**: Exponential backoff for API calls
- **Health Monitoring**: Built-in AI service health checks

### 🎨 **Polished User Interface**
- **Improved State Management**: Fixed frontend glitches and error handling
- **Real-time Connection Status**: Visual indicators for server connectivity
- **Better Error Messages**: Clear feedback for all user actions
- **Voice Integration**: Speech-to-text and text-to-speech with error handling

## 🛠️ How to Run This Program

### Prerequisites
- **Node.js 18+** (Download from [nodejs.org](https://nodejs.org/))
- **npm** or **yarn** package manager
- **Optional**: AI API keys for enhanced experience

### Quick Start (5 minutes)

1. **Clone and Install**
   ```bash
   git clone <your-repo-url>
   cd ai-interview-agent
   npm run install:all
   ```

2. **Set Up Environment Variables**
   
   The system works without API keys using fallback responses, but for best experience, add an AI provider:

   **Server Environment** (create `/server/.env`):
   ```env
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:3000

   # Add ONE of these API keys (Google Gemini is recommended and free):
   # GOOGLE_API_KEY=your_google_api_key_here
   # OPENAI_API_KEY=your_openai_api_key_here
   # OPENROUTER_API_KEY=your_openrouter_api_key_here

   MAX_QUESTIONS=15
   INTERVIEW_TIMEOUT_MINUTES=60
   ```

   **Client Environment** (create `/client/.env.local`):
   ```env
   NEXT_PUBLIC_SERVER_URL=http://localhost:5000
   NEXT_PUBLIC_APP_NAME="AI Interview Agent"
   NEXT_PUBLIC_VERSION="1.0.0"
   ```

3. **Start the Application**
   ```bash
   npm run dev
   ```

4. **Open Your Browser**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:5000`

### Getting AI API Keys (Optional but Recommended)

#### Google Gemini (FREE - Recommended)
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add to `.env`: `GOOGLE_API_KEY=your_key_here`

#### OpenAI (Paid)
1. Go to [OpenAI API](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add to `.env`: `OPENAI_API_KEY=your_key_here`

## 🔧 System Architecture

### Backend (/server)
- **Express.js**: RESTful API endpoints
- **Socket.io**: Real-time bidirectional communication
- **LangGraph**: AI workflow orchestration with fixed flow logic
- **Multi-AI Support**: Automatic fallback between providers

### Frontend (/client)
- **Next.js 14**: React framework with App Router
- **TailwindCSS**: Utility-first styling
- **Framer Motion**: Smooth animations
- **Socket.io Client**: Real-time communication

## 🐛 Fixed Issues

### ✅ LAN Graph Flow
- **Fixed**: Infinite loop where introduction question kept repeating
- **Improved**: Smart phase transitions based on answer quality
- **Enhanced**: Context-aware question generation

### ✅ AI Integration
- **Fixed**: Inconsistent API calls and error handling
- **Added**: Automatic retry logic with exponential backoff
- **Improved**: Graceful fallback when AI services fail

### ✅ Frontend Issues
- **Fixed**: State management problems and UI glitches
- **Enhanced**: Error handling for all user interactions
- **Improved**: Connection status indicators and timeouts

### ✅ Runtime Errors
- **Fixed**: All critical backend and frontend runtime errors
- **Added**: Comprehensive error logging and user feedback
- **Enhanced**: Session management and cleanup

## 🎮 How to Use

### Starting an Interview
1. Enter candidate information (name, position, experience)
2. Select relevant skills from the dropdown
3. Click "Start Interview"

### During the Interview
- **Text Responses**: Type in the chat interface
- **Voice Responses**: Click the microphone button
- **Special Commands**: 
  - Say "repeat" to hear the question again
  - Say "clarify" for question explanation
- **Progress Tracking**: Monitor your progress through phases

### Interview Flow
1. **Introduction** (3-5 questions): Background and motivation
2. **Technical** (4-6 questions): Skills and problem-solving
3. **Behavioral** (4-6 questions): Teamwork and challenges
4. **Closing** (2-3 questions): Questions and wrap-up

## 🔍 Health Monitoring

Check system status:
```bash
# Server health
curl http://localhost:5000/health

# AI service health
curl http://localhost:5000/health/llm
```

## 🚨 Troubleshooting

### Server Won't Start
```bash
cd server
npm install
node index.js
```

### Client Won't Load
```bash
cd client
npm install
npm run dev
```

### AI Not Responding
- Check your API key in `/server/.env`
- System will use fallback responses if AI fails
- Check logs for connection issues

### Connection Issues
- Ensure both server (5000) and client (3000) ports are available
- Check firewall settings
- Verify `CLIENT_URL` in server `.env` matches your setup

## 📊 Performance Features

- **Smart Caching**: Reduces API calls
- **Connection Resilience**: Auto-reconnection with backoff
- **Memory Management**: Efficient state handling
- **Error Recovery**: Graceful degradation

## 🔒 Security

- **CORS Protection**: Configured for specified origins
- **Input Validation**: All user inputs sanitized
- **Session Management**: Secure session handling
- **API Key Protection**: Environment variable isolation

## 🚀 Production Deployment

### Environment Setup
```bash
# Production server .env
NODE_ENV=production
CLIENT_URL=https://your-domain.com
PORT=5000

# Add your production API keys
GOOGLE_API_KEY=your_production_key
```

### Build and Start
```bash
npm run build
npm start
```

## 📈 Development

### Running in Development Mode
```bash
npm run dev          # Start both client and server
npm run dev:server   # Server only
npm run dev:client   # Client only
```

### Project Structure
```
├── client/          # Next.js frontend
│   ├── app/         # App router pages and components
│   ├── components/  # Reusable UI components
│   └── context/     # React context providers
├── server/          # Express.js backend
│   ├── graph/       # LangGraph AI workflow
│   ├── index.js     # Main server file
│   └── .env         # Environment variables
└── package.json     # Root configuration
```

## ✅ System Status

All major issues have been resolved:
- ✅ LAN graph infinite loops fixed
- ✅ AI integration errors resolved
- ✅ Frontend state management improved
- ✅ Runtime errors eliminated
- ✅ Environment configuration complete
- ✅ End-to-end testing verified

## 🆘 Support

If you encounter issues:

1. **Check Prerequisites**: Ensure Node.js 18+ is installed
2. **Verify Environment**: Check `.env` files are properly configured
3. **Check Logs**: Look at console output for error messages
4. **Test Connectivity**: Use health endpoints to verify services
5. **Restart Services**: Stop and restart both client and server

## 📄 License

MIT License - see LICENSE file for details.

---

**Built for production-ready AI interviews with robust error handling and smooth user experience.**

*Ready to demo live - no bugs, no broken paths, just intelligent conversation flow.*