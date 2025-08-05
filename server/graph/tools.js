const { Tool } = require('@langchain/core/tools');
const { ANSWER_QUALITY, INTERVIEW_PHASES } = require('./types');

// Tool: Repeat the last question
class RepeatQuestionTool extends Tool {
  constructor() {
    super();
    this.name = 'repeatQuestion';
    this.description = 'Repeat the last question when user requests it';
  }

  async _call(input, config) {
    const state = JSON.parse(input);
    
    const responses = [
      `Let me repeat that question: ${state.lastQuestion}`,
      `Sure, I'll ask that again: ${state.lastQuestion}`,
      `Of course! Here's the question again: ${state.lastQuestion}`,
      `No problem, let me repeat: ${state.lastQuestion}`
    ];
    
    const response = responses[Math.floor(Math.random() * responses.length)];
    
    return JSON.stringify({
      message: response,
      action: 'repeat_question',
      userRequestedRepeat: false
    });
  }
}

// Tool: Clarify/rephrase question
class ClarifyQuestionTool extends Tool {
  constructor(llm) {
    super();
    this.name = 'clarifyQuestion';
    this.description = 'Rephrase or clarify a question when user seems confused';
    this.llm = llm;
  }

  async _call(input, config) {
    const state = JSON.parse(input);
    
    const clarificationPrompt = `
    The user seems confused about this question: "${state.lastQuestion}"
    
    Please rephrase this question in a simpler, clearer way. Make it more specific and easier to understand.
    Keep the same intent but use simpler language.
    
    Respond with just the clarified question.
    `;

    try {
      const response = await this.llm.invoke(clarificationPrompt);
      const clarifiedQuestion = response.content || response;
      
      return JSON.stringify({
        message: `Let me rephrase that: ${clarifiedQuestion}`,
        action: 'clarify_question',
        lastQuestion: clarifiedQuestion,
        userRequestedClarification: false
      });
    } catch (error) {
      // Fallback clarification
      return JSON.stringify({
        message: `Let me ask this differently: ${state.lastQuestion} Could you tell me more about your experience with this?`,
        action: 'clarify_question',
        userRequestedClarification: false
      });
    }
  }
}

// Tool: Evaluate user's answer
class EvaluateAnswerTool extends Tool {
  constructor(llm) {
    super();
    this.name = 'evaluateAnswer';
    this.description = 'Analyze and evaluate the quality of user responses';
    this.llm = llm;
  }

  async _call(input, config) {
    const state = JSON.parse(input);
    
    const evaluationPrompt = `
    Question: ${state.lastQuestion}
    Answer: ${state.lastAnswer}
    Interview Phase: ${state.currentPhase}
    
    Evaluate this answer on a scale of 1-10 and provide:
    1. Quality score (1-10)
    2. Key points extracted
    3. Whether it needs follow-up (true/false)
    4. Quality level: "good", "needs_clarification", or "insufficient"
    5. Brief feedback
    
    Respond in JSON format:
    {
      "score": number,
      "keyPoints": ["point1", "point2"],
      "needsFollowUp": boolean,
      "quality": "good|needs_clarification|insufficient",
      "feedback": "brief feedback"
    }
    `;

    try {
      const response = await this.llm.invoke(evaluationPrompt);
      let evaluation;
      
      try {
        evaluation = JSON.parse(response.content || response);
      } catch {
        // Fallback evaluation
        evaluation = {
          score: 7,
          keyPoints: ["Response provided"],
          needsFollowUp: false,
          quality: "good",
          feedback: "Thank you for your response."
        };
      }
      
      return JSON.stringify({
        evaluation,
        action: 'evaluate_answer',
        lastAnswerQuality: evaluation.quality,
        needsFollowUp: evaluation.needsFollowUp
      });
    } catch (error) {
      return JSON.stringify({
        evaluation: {
          score: 5,
          keyPoints: ["Answer received"],
          needsFollowUp: false,
          quality: "good",
          feedback: "Thank you for sharing."
        },
        action: 'evaluate_answer',
        lastAnswerQuality: "good",
        needsFollowUp: false
      });
    }
  }
}

// Tool: Generate follow-up question
class GenerateFollowUpTool extends Tool {
  constructor(llm) {
    super();
    this.name = 'generateFollowUp';
    this.description = 'Generate follow-up questions based on insufficient answers';
    this.llm = llm;
  }

  async _call(input, config) {
    const state = JSON.parse(input);
    
    const followUpPrompt = `
    Original Question: ${state.lastQuestion}
    User's Answer: ${state.lastAnswer}
    Interview Phase: ${state.currentPhase}
    
    The user's answer was insufficient or unclear. Generate a follow-up question that:
    1. Asks for more specific details
    2. Helps clarify their response
    3. Maintains a supportive, encouraging tone
    4. Is relevant to the ${state.currentPhase} phase
    
    Respond with just the follow-up question.
    `;

    try {
      const response = await this.llm.invoke(followUpPrompt);
      const followUpQuestion = response.content || response;
      
      return JSON.stringify({
        message: followUpQuestion,
        action: 'generate_follow_up',
        lastQuestion: followUpQuestion,
        needsFollowUp: false
      });
    } catch (error) {
      const genericFollowUps = [
        "Could you elaborate on that a bit more?",
        "Can you give me a specific example?",
        "What was your role in that situation?",
        "How did you handle the challenges you faced?"
      ];
      
      const followUp = genericFollowUps[Math.floor(Math.random() * genericFollowUps.length)];
      
      return JSON.stringify({
        message: followUp,
        action: 'generate_follow_up',
        lastQuestion: followUp,
        needsFollowUp: false
      });
    }
  }
}

// Tool: Generate next question based on phase
class GenerateNextQuestionTool extends Tool {
  constructor(llm) {
    super();
    this.name = 'generateNextQuestion';
    this.description = 'Generate the next logical question based on interview phase and progress';
    this.llm = llm;
  }

  async _call(input, config) {
    const state = JSON.parse(input);
    
    const nextQuestionPrompt = `
    Current Phase: ${state.currentPhase}
    Question Count: ${state.questionCount}
    Candidate Profile: ${JSON.stringify(state.candidateProfile)}
    Asked Questions: ${JSON.stringify(state.askedQuestions)}
    Last Answer: ${state.lastAnswer}
    
    Generate the next appropriate interview question for the ${state.currentPhase} phase.
    
    Guidelines:
    - Don't repeat questions from askedQuestions array
    - Tailor to the candidate's profile and previous answers
    - Use encouraging, professional tone
    - For technical phase: focus on skills and problem-solving
    - For behavioral phase: focus on situations and soft skills
    
    Phase-specific requirements:
    ${this.getPhaseGuidelines(state.currentPhase)}
    
    Respond with just the question.
    `;

    try {
      const response = await this.llm.invoke(nextQuestionPrompt);
      const nextQuestion = response.content || response;
      
      return JSON.stringify({
        message: nextQuestion,
        action: 'generate_next_question',
        lastQuestion: nextQuestion,
        questionCount: state.questionCount + 1
      });
    } catch (error) {
      const fallbackQuestion = this.getFallbackQuestion(state.currentPhase, state.questionCount);
      
      return JSON.stringify({
        message: fallbackQuestion,
        action: 'generate_next_question',
        lastQuestion: fallbackQuestion,
        questionCount: state.questionCount + 1
      });
    }
  }
  
  getPhaseGuidelines(phase) {
    const guidelines = {
      [INTERVIEW_PHASES.INTRODUCTION]: "Ask about background, experience, motivation for the role",
      [INTERVIEW_PHASES.TECHNICAL]: "Focus on technical skills, problem-solving, past projects",
      [INTERVIEW_PHASES.BEHAVIORAL]: "Ask about teamwork, leadership, challenges, conflict resolution",
      [INTERVIEW_PHASES.CLOSING]: "Ask about questions they have, availability, next steps"
    };
    
    return guidelines[phase] || "Ask relevant interview questions";
  }
  
  getFallbackQuestion(phase, questionCount) {
    const fallbackQuestions = {
      [INTERVIEW_PHASES.INTRODUCTION]: [
        "Tell me about your background and experience.",
        "What interests you most about this position?",
        "Walk me through your career journey so far."
      ],
      [INTERVIEW_PHASES.TECHNICAL]: [
        "Describe a challenging project you worked on recently.",
        "How do you approach problem-solving in your work?",
        "What technologies are you most comfortable with?"
      ],
      [INTERVIEW_PHASES.BEHAVIORAL]: [
        "Tell me about a time you had to work with a difficult team member.",
        "Describe a situation where you had to meet a tight deadline.",
        "How do you handle constructive feedback?"
      ],
      [INTERVIEW_PHASES.CLOSING]: [
        "Do you have any questions about the role or company?",
        "What are your salary expectations?",
        "When would you be available to start?"
      ]
    };
    
    const questions = fallbackQuestions[phase] || fallbackQuestions[INTERVIEW_PHASES.INTRODUCTION];
    return questions[questionCount % questions.length];
  }
}

module.exports = {
  RepeatQuestionTool,
  ClarifyQuestionTool,
  EvaluateAnswerTool,
  GenerateFollowUpTool,
  GenerateNextQuestionTool
};