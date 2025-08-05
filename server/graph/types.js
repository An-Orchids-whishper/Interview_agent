// Interview State Schema - Using proper channel format for LangGraph 0.0.19
const InterviewState = {
  sessionId: {
    reducer: (left, right) => right ?? left ?? '',
    default: () => ''
  },
  currentPhase: {
    reducer: (left, right) => right ?? left ?? 'greeting',
    default: () => 'greeting'
  },
  questionCount: {
    reducer: (left, right) => right ?? left ?? 0,
    default: () => 0
  },
  maxQuestions: {
    reducer: (left, right) => right ?? left ?? 15,
    default: () => 15
  },
  lastQuestion: {
    reducer: (left, right) => right ?? left ?? '',
    default: () => ''
  },
  lastAnswer: {
    reducer: (left, right) => right ?? left ?? '',
    default: () => ''
  },
  lastAnswerQuality: {
    reducer: (left, right) => right ?? left ?? 'good',
    default: () => 'good'
  },
  conversationHistory: {
    reducer: (left, right) => right ?? left ?? [],
    default: () => []
  },
  candidateProfile: {
    reducer: (left, right) => right ?? left ?? {
      name: '',
      position: '',
      experience: '',
      skills: [],
      nervousness_level: 'normal'
    },
    default: () => ({
      name: '',
      position: '',
      experience: '',
      skills: [],
      nervousness_level: 'normal'
    })
  },
  askedQuestions: {
    reducer: (left, right) => right ?? left ?? [],
    default: () => []
  },
  evaluationScores: {
    reducer: (left, right) => right ?? left ?? {
      technical: 0,
      behavioral: 0,
      communication: 0,
      overall: 0
    },
    default: () => ({
      technical: 0,
      behavioral: 0,
      communication: 0,
      overall: 0
    })
  },
  needsFollowUp: {
    reducer: (left, right) => right ?? left ?? false,
    default: () => false
  },
  userRequestedRepeat: {
    reducer: (left, right) => right ?? left ?? false,
    default: () => false
  },
  userRequestedClarification: {
    reducer: (left, right) => right ?? left ?? false,
    default: () => false
  },
  interviewComplete: {
    reducer: (left, right) => right ?? left ?? false,
    default: () => false
  },
  lastEvaluation: {
    reducer: (left, right) => right ?? left ?? null,
    default: () => null
  }
};

// Helper function to create initial state
function createInitialState() {
  const state = {};
  for (const [key, channel] of Object.entries(InterviewState)) {
    state[key] = channel.default();
  }
  return state;
}

// Interview Phases
const INTERVIEW_PHASES = {
  GREETING: 'greeting',
  INTRODUCTION: 'introduction', 
  TECHNICAL: 'technical',
  BEHAVIORAL: 'behavioral',
  CLOSING: 'closing'
};

// Answer Quality Levels
const ANSWER_QUALITY = {
  GOOD: 'good',
  NEEDS_CLARIFICATION: 'needs_clarification',
  INSUFFICIENT: 'insufficient'
};

// Node Names
const NODES = {
  START_INTERVIEW: 'startInterview',
  ASK_INTRODUCTION: 'askIntroduction',
  ANALYZE_ANSWER: 'analyzeAnswer',
  GENERATE_FOLLOW_UP: 'generateFollowUp',
  GENERATE_NEXT_QUESTION: 'generateNextQuestion',
  REPEAT_QUESTION: 'repeatQuestion',
  CLARIFY_QUESTION: 'clarifyQuestion',
  EVALUATE_ANSWER: 'evaluateAnswer',
  CONCLUDE_INTERVIEW: 'concludeInterview',
  HANDLE_CLOSING: 'handleClosing'
};

// Tool Names
const TOOLS = {
  REPEAT_QUESTION: 'repeatQuestion',
  CLARIFY_QUESTION: 'clarifyQuestion',
  EVALUATE_ANSWER: 'evaluateAnswer',
  GENERATE_FOLLOW_UP: 'generateFollowUp',
  GENERATE_NEXT_QUESTION: 'generateNextQuestion'
};

module.exports = {
  InterviewState,
  createInitialState,
  INTERVIEW_PHASES,
  ANSWER_QUALITY,
  NODES,
  TOOLS
};