const { StateGraph, END, START } = require('@langchain/langgraph');
const { InterviewState, createInitialState, INTERVIEW_PHASES, ANSWER_QUALITY, NODES } = require('./types');
const {
  startInterviewNode,
  askIntroductionNode,
  analyzeAnswerNode,
  generateFollowUpNode,
  generateNextQuestionNode,
  repeatQuestionNode,
  clarifyQuestionNode,
  concludeInterviewNode,
  handleClosingNode
} = require('./nodes');

// Routing Functions
function shouldRepeatQuestion(state) {
  return state.userRequestedRepeat ? NODES.REPEAT_QUESTION : NODES.ANALYZE_ANSWER;
}

function shouldClarifyQuestion(state) {
  return state.userRequestedClarification ? NODES.CLARIFY_QUESTION : shouldGenerateFollowUp(state);
}

function shouldGenerateFollowUp(state) {
  if (state.needsFollowUp || state.lastAnswerQuality === ANSWER_QUALITY.INSUFFICIENT) {
    return NODES.GENERATE_FOLLOW_UP;
  }
  return shouldMoveToNextQuestion(state);
}

function shouldMoveToNextQuestion(state) {
  if (state.questionCount >= state.maxQuestions) {
    return NODES.CONCLUDE_INTERVIEW;
  }
  
  if (state.currentPhase === INTERVIEW_PHASES.CLOSING) {
    return NODES.HANDLE_CLOSING;
  }
  
  return NODES.GENERATE_NEXT_QUESTION;
}

function shouldConcludeInterview(state) {
  if (state.interviewComplete || state.questionCount >= state.maxQuestions) {
    return END;
  }
  return NODES.ANALYZE_ANSWER;
}

// Create the StateGraph
function createInterviewGraph() {
  const workflow = new StateGraph({
    channels: InterviewState
  });

  // Add all nodes (minimal working set)
  workflow.addNode(NODES.START_INTERVIEW, startInterviewNode);

  // Add edges - simple linear flow for now
  workflow.addEdge(START, NODES.START_INTERVIEW);
  workflow.addEdge(NODES.START_INTERVIEW, END);

  return workflow.compile();
}

// Interview Session Manager
class InterviewSession {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.state = createInitialState();
    this.state.sessionId = sessionId;
    this.graph = createInterviewGraph();
  }

  async startInterview() {
    try {
      const result = await this.graph.invoke(this.state);
      this.state = { ...this.state, ...result };
      
      return {
        success: true,
        message: this.getLastMessage(),
        phase: this.state.currentPhase,
        questionCount: this.state.questionCount,
        maxQuestions: this.state.maxQuestions,
        complete: this.state.interviewComplete
      };
    } catch (error) {
      console.error('Error starting interview:', error);
      return {
        success: false,
        error: 'Failed to start interview'
      };
    }
  }

  async processAnswer(answer) {
    try {
      // Update state with user's answer
      this.state.lastAnswer = answer;
      
      // Process through the graph
      const result = await this.graph.invoke(this.state);
      this.state = { ...this.state, ...result };
      
      return {
        success: true,
        message: this.getLastMessage(),
        phase: this.state.currentPhase,
        questionCount: this.state.questionCount,
        maxQuestions: this.state.maxQuestions,
        complete: this.state.interviewComplete,
        evaluation: this.state.lastEvaluation || null
      };
    } catch (error) {
      console.error('Error processing answer:', error);
      return {
        success: false,
        error: 'Failed to process answer'
      };
    }
  }

  getLastMessage() {
    const history = this.state.conversationHistory;
    if (history && history.length > 0) {
      const lastAssistantMessage = history
        .slice()
        .reverse()
        .find(msg => msg.role === 'assistant');
      return lastAssistantMessage?.message || this.state.lastQuestion;
    }
    return this.state.lastQuestion;
  }

  getConversationHistory() {
    return this.state.conversationHistory || [];
  }

  getCurrentState() {
    return {
      sessionId: this.state.sessionId,
      phase: this.state.currentPhase,
      questionCount: this.state.questionCount,
      maxQuestions: this.state.maxQuestions,
      complete: this.state.interviewComplete,
      lastQuestion: this.state.lastQuestion
    };
  }

  updateCandidateProfile(profile) {
    this.state.candidateProfile = { ...this.state.candidateProfile, ...profile };
  }
}

// Session storage (in production, use Redis or database)
const activeSessions = new Map();

function createSession(sessionId) {
  const session = new InterviewSession(sessionId);
  activeSessions.set(sessionId, session);
  return session;
}

function getSession(sessionId) {
  return activeSessions.get(sessionId);
}

function removeSession(sessionId) {
  activeSessions.delete(sessionId);
}

module.exports = {
  createInterviewGraph,
  InterviewSession,
  createSession,
  getSession,
  removeSession,
  activeSessions
};