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
function routeAfterAnalysis(state) {
  // Handle user requests first
  if (state.userRequestedRepeat) {
    return NODES.REPEAT_QUESTION;
  }
  
  if (state.userRequestedClarification) {
    return NODES.CLARIFY_QUESTION;
  }
  
  // Check if we need follow-up
  if (state.needsFollowUp || state.lastAnswerQuality === ANSWER_QUALITY.INSUFFICIENT) {
    return NODES.GENERATE_FOLLOW_UP;
  }
  
  // Check if interview should end
  if (state.questionCount >= state.maxQuestions) {
    return NODES.CONCLUDE_INTERVIEW;
  }
  
  // Move to next question
  return NODES.GENERATE_NEXT_QUESTION;
}

function routeAfterQuestion(state) {
  // If interview is complete, end it
  if (state.interviewComplete) {
    return END;
  }
  
  // Wait for user input - return END to stop execution
  return END;
}

// Create the StateGraph
function createInterviewGraph() {
  const workflow = new StateGraph({
    channels: InterviewState
  });

  // Add all nodes
  workflow.addNode(NODES.START_INTERVIEW, startInterviewNode);
  workflow.addNode(NODES.ANALYZE_ANSWER, analyzeAnswerNode);
  workflow.addNode(NODES.GENERATE_FOLLOW_UP, generateFollowUpNode);
  workflow.addNode(NODES.GENERATE_NEXT_QUESTION, generateNextQuestionNode);
  workflow.addNode(NODES.REPEAT_QUESTION, repeatQuestionNode);
  workflow.addNode(NODES.CLARIFY_QUESTION, clarifyQuestionNode);
  workflow.addNode(NODES.CONCLUDE_INTERVIEW, concludeInterviewNode);
  workflow.addNode(NODES.HANDLE_CLOSING, handleClosingNode);

  // Add edges - proper routing logic
  workflow.addEdge(START, NODES.START_INTERVIEW);
  
  // From start interview, end execution (wait for user input)
  workflow.addEdge(NODES.START_INTERVIEW, END);
  
  // After analyzing answer, route based on state
  workflow.addConditionalEdges(
    NODES.ANALYZE_ANSWER,
    routeAfterAnalysis
  );
  
  // After repeat/clarify/follow-up/next question, end execution (wait for user input)
  workflow.addEdge(NODES.REPEAT_QUESTION, END);
  workflow.addEdge(NODES.CLARIFY_QUESTION, END);
  workflow.addEdge(NODES.GENERATE_FOLLOW_UP, END);
  workflow.addEdge(NODES.GENERATE_NEXT_QUESTION, END);
  
  // Closing and conclusion lead to end
  workflow.addEdge(NODES.HANDLE_CLOSING, END);
  workflow.addEdge(NODES.CONCLUDE_INTERVIEW, END);

  return workflow.compile();
}

// Interview Session Manager
class InterviewSession {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.state = createInitialState();
    this.state.sessionId = sessionId;
    this.graph = createInterviewGraph();
    this.hasActiveConnection = true;
  }

  async startInterview() {
    try {
      // Run the start interview node
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
        error: 'Failed to start interview: ' + error.message
      };
    }
  }

  async processAnswer(answer) {
    try {
      // Update state with user's answer
      const newState = {
        ...this.state,
        lastAnswer: answer,
        userRequestedRepeat: false,
        userRequestedClarification: false
      };
      
      // Check for special requests
      const lowerAnswer = answer.toLowerCase();
      if (lowerAnswer.includes('repeat') || lowerAnswer.includes('again')) {
        newState.userRequestedRepeat = true;
      }
      if (lowerAnswer.includes('clarify') || lowerAnswer.includes('explain') || lowerAnswer.includes('understand')) {
        newState.userRequestedClarification = true;
      }
      
      // Process through analyze answer node
      const result = await this.graph.invoke({
        ...newState,
        // Start from analyze answer node
      }, {
        configurable: { 
          thread_id: this.sessionId,
          recursion_limit: 10
        }
      });
      
      // Merge the result
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
        error: 'Failed to process answer: ' + error.message
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

// Create a separate graph for processing answers
function createAnswerProcessingGraph() {
  const workflow = new StateGraph({
    channels: InterviewState
  });

  // Add nodes for processing answers
  workflow.addNode(NODES.ANALYZE_ANSWER, analyzeAnswerNode);
  workflow.addNode(NODES.GENERATE_FOLLOW_UP, generateFollowUpNode);
  workflow.addNode(NODES.GENERATE_NEXT_QUESTION, generateNextQuestionNode);
  workflow.addNode(NODES.REPEAT_QUESTION, repeatQuestionNode);
  workflow.addNode(NODES.CLARIFY_QUESTION, clarifyQuestionNode);
  workflow.addNode(NODES.CONCLUDE_INTERVIEW, concludeInterviewNode);
  workflow.addNode(NODES.HANDLE_CLOSING, handleClosingNode);

  // Start with analyze answer
  workflow.addEdge(START, NODES.ANALYZE_ANSWER);
  
  // Route after analysis
  workflow.addConditionalEdges(
    NODES.ANALYZE_ANSWER,
    routeAfterAnalysis
  );
  
  // All other nodes end the flow
  workflow.addEdge(NODES.REPEAT_QUESTION, END);
  workflow.addEdge(NODES.CLARIFY_QUESTION, END);
  workflow.addEdge(NODES.GENERATE_FOLLOW_UP, END);
  workflow.addEdge(NODES.GENERATE_NEXT_QUESTION, END);
  workflow.addEdge(NODES.HANDLE_CLOSING, END);
  workflow.addEdge(NODES.CONCLUDE_INTERVIEW, END);

  return workflow.compile();
}

// Updated Interview Session Manager
class EnhancedInterviewSession {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.state = createInitialState();
    this.state.sessionId = sessionId;
    this.startGraph = createInterviewGraph();
    this.answerGraph = createAnswerProcessingGraph();
    this.hasActiveConnection = true;
  }

  async startInterview() {
    try {
      const result = await this.startGraph.invoke(this.state);
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
        error: 'Failed to start interview: ' + error.message
      };
    }
  }

  async processAnswer(answer) {
    try {
      // Update state with user's answer
      const newState = {
        ...this.state,
        lastAnswer: answer,
        userRequestedRepeat: false,
        userRequestedClarification: false
      };
      
      // Check for special requests
      const lowerAnswer = answer.toLowerCase();
      if (lowerAnswer.includes('repeat') || lowerAnswer.includes('again')) {
        newState.userRequestedRepeat = true;
      }
      if (lowerAnswer.includes('clarify') || lowerAnswer.includes('explain') || lowerAnswer.includes('understand')) {
        newState.userRequestedClarification = true;
      }
      
      // Process through answer processing graph
      const result = await this.answerGraph.invoke(newState, {
        configurable: { 
          thread_id: this.sessionId,
          recursion_limit: 10
        }
      });
      
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
        error: 'Failed to process answer: ' + error.message
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
  const session = new EnhancedInterviewSession(sessionId);
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
  InterviewSession: EnhancedInterviewSession,
  createSession,
  getSession,
  removeSession,
  activeSessions
};