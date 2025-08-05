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
  
  // Wait for user input - this will be handled by processAnswer
  return "__end__";
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
  
  // From start interview, wait for user input (handled by session)
  workflow.addConditionalEdges(
    NODES.START_INTERVIEW,
    routeAfterQuestion
  );
  
  // After analyzing answer, route based on state
  workflow.addConditionalEdges(
    NODES.ANALYZE_ANSWER,
    routeAfterAnalysis
  );
  
  // After repeat/clarify/follow-up, wait for user input
  workflow.addConditionalEdges(
    NODES.REPEAT_QUESTION,
    routeAfterQuestion
  );
  
  workflow.addConditionalEdges(
    NODES.CLARIFY_QUESTION,
    routeAfterQuestion
  );
  
  workflow.addConditionalEdges(
    NODES.GENERATE_FOLLOW_UP,
    routeAfterQuestion
  );
  
  // After generating next question, wait for user input
  workflow.addConditionalEdges(
    NODES.GENERATE_NEXT_QUESTION,
    routeAfterQuestion
  );
  
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
      this.state.lastAnswer = answer;
      this.state.userRequestedRepeat = false;
      this.state.userRequestedClarification = false;
      
      // Check for special requests
      const lowerAnswer = answer.toLowerCase();
      if (lowerAnswer.includes('repeat') || lowerAnswer.includes('again')) {
        this.state.userRequestedRepeat = true;
      }
      if (lowerAnswer.includes('clarify') || lowerAnswer.includes('explain') || lowerAnswer.includes('understand')) {
        this.state.userRequestedClarification = true;
      }
      
      // Process through analyze answer node first
      const config = { configurable: { thread_id: this.sessionId } };
      const result = await this.graph.invoke({
        ...this.state,
        __start_node__: NODES.ANALYZE_ANSWER
      }, config);
      
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