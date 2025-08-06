const { GoogleGenerativeAI } = require('@google/generative-ai');
const { ChatOpenAI } = require('@langchain/openai');

class LLMManager {
  constructor() {
    this.llm = null;
    this.provider = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      // Try Google Gemini first (free tier available)
      if (process.env.GOOGLE_API_KEY) {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        this.llm = genAI.getGenerativeModel({ model: "gemini-pro" });
        this.provider = 'google';
        this.initialized = true;
        console.log('✅ Google Gemini LLM initialized successfully');
        return;
      }

      // Fallback to OpenAI
      if (process.env.OPENAI_API_KEY) {
        this.llm = new ChatOpenAI({
          openAIApiKey: process.env.OPENAI_API_KEY,
          modelName: 'gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 500
        });
        this.provider = 'openai';
        this.initialized = true;
        console.log('✅ OpenAI LLM initialized successfully');
        return;
      }

      // Fallback to OpenRouter
      if (process.env.OPENROUTER_API_KEY) {
        this.llm = new ChatOpenAI({
          openAIApiKey: process.env.OPENROUTER_API_KEY,
          modelName: 'microsoft/wizardlm-2-8x22b',
          temperature: 0.7,
          maxTokens: 500,
          configuration: {
            baseURL: 'https://openrouter.ai/api/v1',
          }
        });
        this.provider = 'openrouter';
        this.initialized = true;
        console.log('✅ OpenRouter LLM initialized successfully');
        return;
      }

      console.warn('⚠️  No LLM API key found - using fallback responses');
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
          return response.text();
        } else if ((this.provider === 'openai' || this.provider === 'openrouter') && this.llm) {
          const response = await this.llm.invoke(prompt);
          return response.content;
        } else {
          // Fallback response
          return this.getFallbackResponse(prompt);
        }
      } catch (error) {
        lastError = error;
        console.error(`❌ LLM attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          // Exponential backoff with jitter (±20%)
          const baseDelay = Math.pow(2, attempt) * 1000;
          const jitter = baseDelay * 0.2 * (Math.random() - 0.5); // ±20%
          const delay = Math.max(500, baseDelay + jitter);
          console.log(`⏳ Retrying in ${Math.round(delay)}ms...`);
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
        keyPoints: ["Response provided"],
        needsFollowUp: false,
        quality: "good",
        feedback: "Thank you for your response."
      });
    }
    
    if (lowerPrompt.includes('follow')) {
      return "Could you elaborate on that a bit more?";
    }
    
    if (lowerPrompt.includes('clarify') || lowerPrompt.includes('rephrase')) {
      return "Let me ask this in a different way: Could you tell me more about your experience?";
    }
    
    if (lowerPrompt.includes('next question') || lowerPrompt.includes('generate')) {
      const questions = [
        "What interests you most about this position?",
        "Tell me about your professional background.",
        "Describe a challenging project you worked on recently.",
        "How do you handle working under pressure?",
        "What are your greatest strengths?"
      ];
      return questions[Math.floor(Math.random() * questions.length)];
    }
    
    return "Thank you for sharing that with me. Could you tell me more?";
  }

  isInitialized() {
    return this.initialized;
  }

  getProvider() {
    return this.provider;
  }
}

// Singleton instance
const llmManager = new LLMManager();

module.exports = {
  LLMManager,
  llmManager
};