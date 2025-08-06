const { GoogleGenerativeAI } = require('@google/generative-ai');
const { ChatOpenAI } = require('@langchain/openai');

class LLMManager {
  constructor() {
    this.llm = null;
    this.provider = null;
    this.initialized = false;
    this.initPromise = null;
  }

  async initialize() {
    // Prevent multiple initialization attempts
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._doInitialize();
    return this.initPromise;
  }

  async _doInitialize() {
    try {
      // Try Google Gemini first (free tier available)
      if (process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY !== 'your_google_api_key_here') {
        try {
          const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
          this.llm = genAI.getGenerativeModel({ 
            model: "gemini-pro",
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1000,
            }
          });
          
          // Test the connection
          const testResult = await this.llm.generateContent("Hello");
          if (testResult && testResult.response) {
            this.provider = 'google';
            this.initialized = true;
            console.log('✅ Google Gemini LLM initialized successfully');
            return;
          }
        } catch (error) {
          console.warn('⚠️ Google Gemini initialization failed:', error.message);
        }
      }

      // Fallback to OpenAI
      if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
        try {
          this.llm = new ChatOpenAI({
            openAIApiKey: process.env.OPENAI_API_KEY,
            modelName: 'gpt-3.5-turbo',
            temperature: 0.7,
            maxTokens: 1000,
            timeout: 30000
          });
          
          // Test the connection
          const testResult = await this.llm.invoke("Hello");
          if (testResult && testResult.content) {
            this.provider = 'openai';
            this.initialized = true;
            console.log('✅ OpenAI LLM initialized successfully');
            return;
          }
        } catch (error) {
          console.warn('⚠️ OpenAI initialization failed:', error.message);
        }
      }

      // Fallback to OpenRouter
      if (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== 'your_openrouter_api_key_here') {
        try {
          this.llm = new ChatOpenAI({
            openAIApiKey: process.env.OPENROUTER_API_KEY,
            modelName: 'microsoft/wizardlm-2-8x22b',
            temperature: 0.7,
            maxTokens: 1000,
            timeout: 30000,
            configuration: {
              baseURL: 'https://openrouter.ai/api/v1',
            }
          });
          
          // Test the connection
          const testResult = await this.llm.invoke("Hello");
          if (testResult && testResult.content) {
            this.provider = 'openrouter';
            this.initialized = true;
            console.log('✅ OpenRouter LLM initialized successfully');
            return;
          }
        } catch (error) {
          console.warn('⚠️ OpenRouter initialization failed:', error.message);
        }
      }

      console.warn('⚠️  No working LLM API key found - using fallback responses');
      this.provider = 'fallback';
      this.initialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize LLM:', error.message);
      this.provider = 'fallback';
      this.initialized = true;
    }
  }

  async invoke(prompt, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const maxRetries = options.retries || 3;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (this.provider === 'google' && this.llm) {
          const result = await this.llm.generateContent(prompt);
          const response = await result.response;
          const text = response.text();
          if (text && text.trim()) {
            return text.trim();
          }
          throw new Error('Empty response from Google Gemini');
        } else if ((this.provider === 'openai' || this.provider === 'openrouter') && this.llm) {
          const response = await this.llm.invoke(prompt);
          if (response && response.content && response.content.trim()) {
            return response.content.trim();
          }
          throw new Error(`Empty response from ${this.provider}`);
        } else {
          // Fallback response
          return this.getFallbackResponse(prompt);
        }
      } catch (error) {
        lastError = error;
        console.error(`❌ LLM attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    console.error('❌ All LLM attempts failed, using fallback response');
    return this.getFallbackResponse(prompt);
  }

  getFallbackResponse(prompt) {
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('evaluate') || lowerPrompt.includes('quality')) {
      return JSON.stringify({
        score: 7,
        keyPoints: ["Good response provided", "Clear communication demonstrated"],
        needsFollowUp: false,
        quality: "good",
        feedback: "Thank you for your thoughtful response. You've addressed the question well."
      });
    }
    
    if (lowerPrompt.includes('follow')) {
      const followUps = [
        "Could you elaborate on that a bit more?",
        "Can you provide a specific example of that?",
        "What was the outcome of that situation?",
        "How did you approach that challenge?"
      ];
      return followUps[Math.floor(Math.random() * followUps.length)];
    }
    
    if (lowerPrompt.includes('clarify') || lowerPrompt.includes('rephrase')) {
      const clarifications = [
        "Let me ask this in a different way: Could you tell me more about your experience with that?",
        "To clarify, I'm interested in understanding your approach to similar situations.",
        "Perhaps I can phrase this differently - what was your role in that project?",
        "Let me be more specific - what challenges did you face and how did you handle them?"
      ];
      return clarifications[Math.floor(Math.random() * clarifications.length)];
    }
    
    if (lowerPrompt.includes('next question') || lowerPrompt.includes('generate')) {
      const phase = lowerPrompt.includes('technical') ? 'technical' : 
                   lowerPrompt.includes('behavioral') ? 'behavioral' :
                   lowerPrompt.includes('closing') ? 'closing' : 'introduction';
      
      const questionSets = {
        introduction: [
          "What interests you most about this position?",
          "Tell me about your professional background and what led you here.",
          "What are your key strengths that make you a good fit for this role?",
          "What do you know about our company and why do you want to work here?"
        ],
        technical: [
          "Describe a challenging technical project you worked on recently.",
          "How do you approach debugging complex issues in your work?",
          "Tell me about a time you had to learn a new technology quickly.",
          "What's your process for ensuring code quality in your projects?"
        ],
        behavioral: [
          "Tell me about a time when you had to work with a difficult team member.",
          "Describe a situation where you had to meet a tight deadline.",
          "How do you handle constructive criticism?",
          "Tell me about a time you had to adapt to significant changes."
        ],
        closing: [
          "What questions do you have about the role or our team?",
          "What are your salary expectations for this position?",
          "When would you be available to start if offered the position?",
          "Is there anything else you'd like me to know about you?"
        ]
      };
      
      const questions = questionSets[phase] || questionSets.introduction;
      return questions[Math.floor(Math.random() * questions.length)];
    }
    
    return "Thank you for sharing that with me. Could you tell me more about your experience with that?";
  }

  isInitialized() {
    return this.initialized;
  }

  getProvider() {
    return this.provider;
  }

  async healthCheck() {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      const testResponse = await this.invoke("Hello", { retries: 1 });
      return {
        status: 'healthy',
        provider: this.provider,
        response: testResponse ? 'OK' : 'Empty'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        provider: this.provider,
        error: error.message
      };
    }
  }
}

// Singleton instance
const llmManager = new LLMManager();

module.exports = {
  LLMManager,
  llmManager
};