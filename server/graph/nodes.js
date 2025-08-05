const { INTERVIEW_PHASES, ANSWER_QUALITY, NODES } = require('./types');

// Node: Start Interview
async function startInterviewNode(state) {
  const greetings = [
    "Hello! Welcome to your interview today. I'm excited to get to know you better.",
    "Hi there! Thanks for joining me today. I'm looking forward to our conversation.",
    "Welcome! I hope you're doing well today. Let's begin with your interview.",
    "Good day! Thank you for your time today. I'm here to learn more about you and your experience."
  ];

  const greeting = greetings[Math.floor(Math.random() * greetings.length)];
  
  return {
    ...state,
    currentPhase: INTERVIEW_PHASES.INTRODUCTION,
    lastQuestion: "Let's start with introductions. Could you please tell me your name and a bit about yourself?",
    conversationHistory: [
      {
        role: 'assistant',
        message: greeting,
        timestamp: new Date().toISOString()
      },
      {
        role: 'assistant', 
        message: "Let's start with introductions. Could you please tell me your name and a bit about yourself?",
        timestamp: new Date().toISOString()
      }
    ]
  };
}

// Node: Ask Introduction Questions
async function askIntroductionNode(state) {
  const introQuestions = [
    "What interests you most about this position?",
    "Tell me about your professional background.",
    "What motivated you to apply for this role?",
    "Walk me through your career journey so far.",
    "What are your key strengths and skills?"
  ];

  // Filter out already asked questions
  const availableQuestions = introQuestions.filter(q => !state.askedQuestions.includes(q));
  
  if (availableQuestions.length === 0 || state.questionCount >= 5) {
    // Move to technical phase
    return {
      ...state,
      currentPhase: INTERVIEW_PHASES.TECHNICAL,
      lastQuestion: "Now let's talk about your technical experience. Can you describe a challenging project you worked on recently?",
      questionCount: state.questionCount + 1,
      askedQuestions: [...state.askedQuestions, "Now let's talk about your technical experience. Can you describe a challenging project you worked on recently?"]
    };
  }

  const nextQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
  
  return {
    ...state,
    lastQuestion: nextQuestion,
    questionCount: state.questionCount + 1,
    askedQuestions: [...state.askedQuestions, nextQuestion]
  };
}

// Node: Analyze Answer
async function analyzeAnswerNode(state) {
  // Simple analysis logic - in production this would use LLM
  const answer = state.lastAnswer.toLowerCase();
  
  // Check for keywords that indicate confusion or need for clarification
  const confusionKeywords = ['confused', 'unclear', 'don\'t understand', 'what do you mean', 'clarify'];
  const repeatKeywords = ['repeat', 'again', 'say that again', 'didn\'t catch'];
  
  let quality = ANSWER_QUALITY.GOOD;
  let needsFollowUp = false;
  
  // Detect user requests
  if (repeatKeywords.some(keyword => answer.includes(keyword))) {
    return {
      ...state,
      userRequestedRepeat: true,
      lastAnswerQuality: quality
    };
  }
  
  if (confusionKeywords.some(keyword => answer.includes(keyword))) {
    return {
      ...state,
      userRequestedClarification: true,
      lastAnswerQuality: ANSWER_QUALITY.NEEDS_CLARIFICATION
    };
  }
  
  // Simple quality assessment
  if (answer.length < 20) {
    quality = ANSWER_QUALITY.INSUFFICIENT;
    needsFollowUp = true;
  } else if (answer.length < 50) {
    quality = ANSWER_QUALITY.NEEDS_CLARIFICATION;
    needsFollowUp = true;
  }
  
  // Update conversation history
  const updatedHistory = [
    ...state.conversationHistory,
    {
      role: 'user',
      message: state.lastAnswer,
      timestamp: new Date().toISOString()
    }
  ];
  
  return {
    ...state,
    lastAnswerQuality: quality,
    needsFollowUp,
    conversationHistory: updatedHistory
  };
}

// Node: Generate Follow-up Question
async function generateFollowUpNode(state) {
  const followUpQuestions = {
    [INTERVIEW_PHASES.INTRODUCTION]: [
      "Could you elaborate on that a bit more?",
      "Can you give me a specific example?",
      "What aspects of that experience were most valuable to you?",
      "How did that shape your career goals?"
    ],
    [INTERVIEW_PHASES.TECHNICAL]: [
      "What technologies did you use in that project?",
      "What challenges did you face and how did you overcome them?",
      "What was your specific role in the project?",
      "How did you measure the success of that solution?"
    ],
    [INTERVIEW_PHASES.BEHAVIORAL]: [
      "How did you handle that situation?",
      "What was the outcome?",
      "What would you do differently next time?",
      "How did others respond to your approach?"
    ]
  };
  
  const phaseQuestions = followUpQuestions[state.currentPhase] || followUpQuestions[INTERVIEW_PHASES.INTRODUCTION];
  const followUp = phaseQuestions[Math.floor(Math.random() * phaseQuestions.length)];
  
  return {
    ...state,
    lastQuestion: followUp,
    needsFollowUp: false,
    conversationHistory: [
      ...state.conversationHistory,
      {
        role: 'assistant',
        message: followUp,
        timestamp: new Date().toISOString()
      }
    ]
  };
}

// Node: Generate Next Question
async function generateNextQuestionNode(state) {
  // Determine next phase if needed
  let nextPhase = state.currentPhase;
  let nextQuestion = '';
  
  // Phase transition logic
  if (state.currentPhase === INTERVIEW_PHASES.INTRODUCTION && state.questionCount >= 4) {
    nextPhase = INTERVIEW_PHASES.TECHNICAL;
    nextQuestion = "Now let's discuss your technical background. Can you tell me about a challenging project you worked on recently?";
  } else if (state.currentPhase === INTERVIEW_PHASES.TECHNICAL && state.questionCount >= 8) {
    nextPhase = INTERVIEW_PHASES.BEHAVIORAL;
    nextQuestion = "Let's talk about some behavioral scenarios. Tell me about a time when you had to work with a difficult team member.";
  } else if (state.currentPhase === INTERVIEW_PHASES.BEHAVIORAL && state.questionCount >= 12) {
    nextPhase = INTERVIEW_PHASES.CLOSING;
    nextQuestion = "We're nearing the end of our interview. Do you have any questions about the role or our company?";
  }
  
  // Generate phase-appropriate question if no transition
  if (!nextQuestion) {
    const questionSets = {
      [INTERVIEW_PHASES.INTRODUCTION]: [
        "What are your career goals for the next few years?",
        "What do you know about our company and why do you want to work here?",
        "What are your greatest professional achievements?",
        "How do you stay updated with industry trends?"
      ],
      [INTERVIEW_PHASES.TECHNICAL]: [
        "How do you approach debugging complex issues?",
        "Describe your experience with version control and collaboration tools.",
        "What's your process for learning new technologies?",
        "Tell me about a time you had to optimize performance in an application."
      ],
      [INTERVIEW_PHASES.BEHAVIORAL]: [
        "Describe a time when you had to meet a tight deadline.",
        "Tell me about a time you received constructive criticism.",
        "How do you handle conflicts in a team environment?",
        "Describe a situation where you had to adapt to significant changes."
      ],
      [INTERVIEW_PHASES.CLOSING]: [
        "What questions do you have about the team you'd be working with?",
        "What are your salary expectations for this role?",
        "When would you be available to start if offered the position?",
        "Is there anything else you'd like me to know about you?"
      ]
    };
    
    const availableQuestions = questionSets[state.currentPhase].filter(q => 
      !state.askedQuestions.includes(q)
    );
    
    if (availableQuestions.length > 0) {
      nextQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
    } else {
      // Fallback to closing if no more questions
      nextPhase = INTERVIEW_PHASES.CLOSING;
      nextQuestion = "Thank you for your responses. Do you have any final questions for me?";
    }
  }
  
  return {
    ...state,
    currentPhase: nextPhase,
    lastQuestion: nextQuestion,
    questionCount: state.questionCount + 1,
    askedQuestions: [...state.askedQuestions, nextQuestion],
    conversationHistory: [
      ...state.conversationHistory,
      {
        role: 'assistant',
        message: nextQuestion,
        timestamp: new Date().toISOString()
      }
    ]
  };
}

// Node: Repeat Question
async function repeatQuestionNode(state) {
  const responses = [
    `Let me repeat that question: ${state.lastQuestion}`,
    `Sure, I'll ask that again: ${state.lastQuestion}`,
    `Of course! Here's the question again: ${state.lastQuestion}`,
    `No problem, let me repeat: ${state.lastQuestion}`
  ];
  
  const response = responses[Math.floor(Math.random() * responses.length)];
  
  return {
    ...state,
    userRequestedRepeat: false,
    conversationHistory: [
      ...state.conversationHistory,
      {
        role: 'assistant',
        message: response,
        timestamp: new Date().toISOString()
      }
    ]
  };
}

// Node: Clarify Question
async function clarifyQuestionNode(state) {
  const clarifications = {
    [INTERVIEW_PHASES.INTRODUCTION]: "Let me ask this more simply: Can you tell me about your work experience and what brings you here today?",
    [INTERVIEW_PHASES.TECHNICAL]: "Let me rephrase: Can you describe a project where you had to solve a difficult technical problem?",
    [INTERVIEW_PHASES.BEHAVIORAL]: "Let me clarify: I'd like to hear about a specific situation from your past work experience.",
    [INTERVIEW_PHASES.CLOSING]: "Let me be more specific: What would you like to know about this position or our company?"
  };
  
  const clarification = clarifications[state.currentPhase] || 
    `Let me rephrase that question: ${state.lastQuestion} - Could you share your thoughts on this?`;
  
  return {
    ...state,
    lastQuestion: clarification,
    userRequestedClarification: false,
    conversationHistory: [
      ...state.conversationHistory,
      {
        role: 'assistant',
        message: clarification,
        timestamp: new Date().toISOString()
      }
    ]
  };
}

// Node: Conclude Interview
async function concludeInterviewNode(state) {
  const closingMessages = [
    "Thank you so much for your time today. It was great getting to know you and learning about your experience. We'll be in touch soon with next steps.",
    "I really enjoyed our conversation today. You've shared some great insights about your background and experience. We'll follow up with you shortly.",
    "Thank you for taking the time to speak with me today. I appreciate you sharing your experiences and answering all my questions. We'll be in contact soon.",
    "This has been a wonderful interview. Thank you for your thoughtful responses and for sharing your story with me. We'll reach out with updates soon."
  ];
  
  const closingMessage = closingMessages[Math.floor(Math.random() * closingMessages.length)];
  
  return {
    ...state,
    interviewComplete: true,
    conversationHistory: [
      ...state.conversationHistory,
      {
        role: 'assistant',
        message: closingMessage,
        timestamp: new Date().toISOString()
      }
    ]
  };
}

// Node: Handle Closing
async function handleClosingNode(state) {
  if (state.questionCount >= state.maxQuestions) {
    return concludeInterviewNode(state);
  }
  
  // Continue with closing questions
  return generateNextQuestionNode(state);
}

module.exports = {
  startInterviewNode,
  askIntroductionNode,
  analyzeAnswerNode,
  generateFollowUpNode,
  generateNextQuestionNode,
  repeatQuestionNode,
  clarifyQuestionNode,
  concludeInterviewNode,
  handleClosingNode
};