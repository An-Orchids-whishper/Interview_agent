const { INTERVIEW_PHASES, ANSWER_QUALITY, NODES } = require('./types');
const { llmManager } = require('./llm');

// Node: Start Interview
async function startInterviewNode(state) {
  const greetings = [
    "Hello! Welcome to your interview today. I'm excited to get to know you better.",
    "Hi there! Thanks for joining me today. I'm looking forward to our conversation.",
    "Welcome! I hope you're doing well today. Let's begin with your interview.",
    "Good day! Thank you for your time today. I'm here to learn more about you and your experience."
  ];

  const greeting = greetings[Math.floor(Math.random() * greetings.length)];
  const introQuestion = "Let's start with introductions. Could you please tell me your name and a bit about yourself?";
  
  return {
    ...state,
    currentPhase: INTERVIEW_PHASES.INTRODUCTION,
    lastQuestion: introQuestion,
    questionCount: 1,
    conversationHistory: [
      {
        role: 'assistant',
        message: greeting,
        timestamp: new Date().toISOString()
      },
      {
        role: 'assistant', 
        message: introQuestion,
        timestamp: new Date().toISOString()
      }
    ],
    askedQuestions: [introQuestion]
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
    const techQuestion = "Now let's talk about your technical experience. Can you describe a challenging project you worked on recently?";
    return {
      ...state,
      currentPhase: INTERVIEW_PHASES.TECHNICAL,
      lastQuestion: techQuestion,
      questionCount: state.questionCount + 1,
      askedQuestions: [...state.askedQuestions, techQuestion],
      conversationHistory: [
        ...state.conversationHistory,
        {
          role: 'assistant',
          message: techQuestion,
          timestamp: new Date().toISOString()
        }
      ]
    };
  }

  const nextQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
  
  return {
    ...state,
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

// Node: Analyze Answer
async function analyzeAnswerNode(state) {
  const answer = state.lastAnswer;
  
  // Add user message to conversation history first
  const updatedHistory = [
    ...state.conversationHistory,
    {
      role: 'user',
      message: answer,
      timestamp: new Date().toISOString()
    }
  ];

  // Simple analysis logic for immediate responses
  const lowerAnswer = answer.toLowerCase();
  
  // Check for keywords that indicate confusion or need for clarification
  const confusionKeywords = ['confused', 'unclear', 'don\'t understand', 'what do you mean', 'clarify'];
  const repeatKeywords = ['repeat', 'again', 'say that again', 'didn\'t catch'];
  
  let quality = ANSWER_QUALITY.GOOD;
  let needsFollowUp = false;
  
  // Detect user requests
  if (repeatKeywords.some(keyword => lowerAnswer.includes(keyword))) {
    return {
      ...state,
      userRequestedRepeat: true,
      lastAnswerQuality: quality,
      conversationHistory: updatedHistory
    };
  }
  
  if (confusionKeywords.some(keyword => lowerAnswer.includes(keyword))) {
    return {
      ...state,
      userRequestedClarification: true,
      lastAnswerQuality: ANSWER_QUALITY.NEEDS_CLARIFICATION,
      conversationHistory: updatedHistory
    };
  }
  
  // Simple quality assessment
  if (answer.length < 15) {
    quality = ANSWER_QUALITY.INSUFFICIENT;
    needsFollowUp = true;
  } else if (answer.length < 40) {
    quality = ANSWER_QUALITY.NEEDS_CLARIFICATION;
    needsFollowUp = true;
  }
  
  // Use AI for detailed evaluation (with fallback)
  let evaluation = null;
  try {
    const evaluationPrompt = `
    Question: ${state.lastQuestion}
    Answer: ${answer}
    Interview Phase: ${state.currentPhase}
    
    Evaluate this interview answer and provide:
    1. Quality score (1-10)
    2. Key points extracted
    3. Whether it needs follow-up (true/false)
    4. Quality level: "good", "needs_clarification", or "insufficient"
    5. Brief encouraging feedback
    
    Respond in JSON format:
    {
      "score": number,
      "keyPoints": ["point1", "point2"],
      "needsFollowUp": boolean,
      "quality": "good|needs_clarification|insufficient",
      "feedback": "brief encouraging feedback"
    }
    `;

    const response = await llmManager.invoke(evaluationPrompt);
    try {
      evaluation = JSON.parse(response);
      quality = evaluation.quality || quality;
      needsFollowUp = evaluation.needsFollowUp || needsFollowUp;
    } catch (parseError) {
      console.log('Failed to parse AI evaluation, using fallback');
    }
  } catch (error) {
    console.log('AI evaluation failed, using fallback');
    // Optionally set evaluation to a default/fallback value
  }
  
  return {
    ...state,
    lastAnswerQuality: quality,
    needsFollowUp,
    conversationHistory: updatedHistory,
    lastEvaluation: evaluation,
    userRequestedRepeat: false,
    userRequestedClarification: false
  };
}

// Node: Generate Follow-up Question
async function generateFollowUpNode(state) {
  let followUpQuestion = '';

  // Try to generate with AI first
  try {
    const followUpPrompt = `
    Original Question: ${state.lastQuestion}
    User's Answer: ${state.lastAnswer}
    Interview Phase: ${state.currentPhase}
    
    The user's answer was brief or needs more detail. Generate a follow-up question that:
    1. Asks for more specific details or examples
    2. Helps clarify their response
    3. Maintains an encouraging, supportive tone
    4. Is relevant to the ${state.currentPhase} phase
    
    Respond with just the follow-up question (no quotes).
    `;

    followUpQuestion = await llmManager.invoke(followUpPrompt);
  } catch (error) {
    // Fallback to predefined follow-ups
    const fallbackFollowUps = {
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
    
    const phaseQuestions = fallbackFollowUps[state.currentPhase] || fallbackFollowUps[INTERVIEW_PHASES.INTRODUCTION];
    followUpQuestion = phaseQuestions[Math.floor(Math.random() * phaseQuestions.length)];
  }
  
  return {
    ...state,
    lastQuestion: followUpQuestion,
    needsFollowUp: false,
    conversationHistory: [
      ...state.conversationHistory,
      {
        role: 'assistant',
        message: followUpQuestion,
        timestamp: new Date().toISOString()
      }
    ]
  };
}

// Node: Generate Next Question
async function generateNextQuestionNode(state) {
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
  
  // Generate phase-appropriate question with AI if no transition
  if (!nextQuestion) {
    try {
      const questionPrompt = `
      Current Phase: ${state.currentPhase}
      Question Count: ${state.questionCount}
      Candidate Profile: ${JSON.stringify(state.candidateProfile)}
      Asked Questions: ${JSON.stringify(state.askedQuestions)}
      Recent Answer: ${state.lastAnswer}
      
      Generate the next appropriate interview question for the ${state.currentPhase} phase.
      
      Guidelines:
      - Don't repeat questions from the asked questions list
      - Build on the candidate's previous answers when possible
      - Use encouraging, professional tone
      - Make it specific and engaging
      
      Phase requirements:
      - Introduction: Background, motivation, strengths
      - Technical: Skills, projects, problem-solving
      - Behavioral: Teamwork, leadership, challenges
      - Closing: Questions, availability, wrap-up
      
      Respond with just the question (no quotes).
      `;

      nextQuestion = await llmManager.invoke(questionPrompt);
    } catch (error) {
      // Fallback to predefined questions
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
  let clarification = '';

  // Try to generate with AI first
  try {
    const clarifyPrompt = `
    The user seems confused about this question: "${state.lastQuestion}"
    Interview Phase: ${state.currentPhase}
    User's response: "${state.lastAnswer}"
    
    Please rephrase this question in a simpler, clearer way. Make it more specific and easier to understand.
    Keep the same intent but use simpler language and provide context if needed.
    
    Respond with just the clarified question (no quotes).
    `;

    clarification = await llmManager.invoke(clarifyPrompt);
  } catch (error) {
    // Fallback clarifications
    const clarifications = {
      [INTERVIEW_PHASES.INTRODUCTION]: "Let me ask this more simply: Can you tell me about your work experience and what brings you here today?",
      [INTERVIEW_PHASES.TECHNICAL]: "Let me rephrase: Can you describe a project where you had to solve a difficult technical problem?",
      [INTERVIEW_PHASES.BEHAVIORAL]: "Let me clarify: I'd like to hear about a specific situation from your past work experience.",
      [INTERVIEW_PHASES.CLOSING]: "Let me be more specific: What would you like to know about this position or our company?"
    };
    
    clarification = clarifications[state.currentPhase] || 
      `Let me rephrase that question: ${state.lastQuestion} - Could you share your thoughts on this?`;
  }
  
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