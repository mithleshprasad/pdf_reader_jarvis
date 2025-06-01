class SelfLearningAIAgent {
  constructor() {
    // Core knowledge structures
    this.knowledgeGraph = {
      concepts: {},
      relationships: []
    };
    
    this.conversationMemory = [];
    this.responsePatterns = [];
    
    // Learning parameters
    this.learningRate = 0.1;
    this.memoryDecay = 0.99;
    this.minConfidenceThreshold = 0.6;
    
    // Initialize with basic knowledge
    this.initializeBaseKnowledge();
  }

  initializeBaseKnowledge() {
    // Core concepts
    this.addConcept('agent', { 
      type: 'entity',
      properties: {
        name: 'AI Agent',
        creator: 'user',
        capabilities: ['learning', 'conversation']
      }
    });
    
    this.addConcept('user', {
      type: 'entity',
      properties: {
        role: 'conversation partner'
      }
    });
    
    // Basic patterns
    this.addResponsePattern({
      triggers: ['hello', 'hi', 'hey'],
      response: "Hello! How can I help you today?",
      context: 'greeting',
      confidence: 0.9
    });
    
    this.addResponsePattern({
      triggers: ['what are you', 'who are you'],
      response: "I'm a self-learning AI agent that improves through conversation.",
      context: 'self-description',
      confidence: 0.85
    });
  }

  // Core learning methods
  addConcept(name, data) {
    this.knowledgeGraph.concepts[name] = {
      ...data,
      activation: 1.0,
      lastUsed: Date.now()
    };
  }

  addRelationship(source, target, type, strength = 0.5) {
    this.knowledgeGraph.relationships.push({
      source,
      target,
      type,
      strength,
      lastUsed: Date.now()
    });
  }

  addResponsePattern(pattern) {
    this.responsePatterns.push(pattern);
    this.organizeKnowledge();
  }

  // Process input and generate response
  async processInput(input) {
    const processedInput = this.normalizeInput(input);
    const context = this.extractContext(processedInput);
    const concepts = this.extractConcepts(processedInput);
    
    // Store conversation context
    this.conversationMemory.push({
      input: processedInput,
      context,
      concepts,
      timestamp: Date.now()
    });
    
    // Find best response
    const { response, pattern } = this.findBestResponse(processedInput, context);
    
    // Learn from this interaction
    this.learnFromInteraction(processedInput, response, concepts, context);
    
    return response;
  }

  // Advanced learning mechanisms
  learnFromInteraction(input, response, concepts, context) {
    // Reinforce used concepts
    concepts.forEach(concept => {
      if (this.knowledgeGraph.concepts[concept]) {
        this.knowledgeGraph.concepts[concept].activation = Math.min(
          1.0, 
          this.knowledgeGraph.concepts[concept].activation + this.learningRate
        );
        this.knowledgeGraph.concepts[concept].lastUsed = Date.now();
      }
    });
    
    // Create new concepts if needed
    concepts.forEach(concept => {
      if (!this.knowledgeGraph.concepts[concept]) {
        this.addConcept(concept, {
          type: 'unknown',
          properties: {},
          context
        });
      }
    });
    
    // Create relationships between concepts
    for (let i = 0; i < concepts.length; i++) {
      for (let j = i + 1; j < concepts.length; j++) {
        this.addRelationship(concepts[i], concepts[j], 'co-occurrence');
      }
    }
    
    // Create new response pattern if significant
    if (!this.responsePatterns.some(p => p.response === response)) {
      const newPattern = {
        triggers: this.extractKeywords(input),
        response,
        context,
        confidence: 0.7,
        usageCount: 1
      };
      this.addResponsePattern(newPattern);
    } else {
      // Reinforce existing pattern
      const pattern = this.responsePatterns.find(p => p.response === response);
      pattern.confidence = Math.min(1.0, pattern.confidence + this.learningRate);
      pattern.usageCount = (pattern.usageCount || 1) + 1;
    }
    
    // Generalize patterns
    this.organizeKnowledge();
  }

  // Knowledge organization
  organizeKnowledge() {
    // Merge similar patterns
    for (let i = 0; i < this.responsePatterns.length; i++) {
      for (let j = i + 1; j < this.responsePatterns.length; j++) {
        const pattern1 = this.responsePatterns[i];
        const pattern2 = this.responsePatterns[j];
        
        if (pattern1.response === pattern2.response) {
          // Merge triggers
          pattern1.triggers = [...new Set([...pattern1.triggers, ...pattern2.triggers])];
          pattern1.confidence = (pattern1.confidence + pattern2.confidence) / 2;
          pattern1.usageCount = (pattern1.usageCount || 1) + (pattern2.usageCount || 1);
          
          // Remove the duplicate
          this.responsePatterns.splice(j, 1);
          j--;
        }
      }
    }
    
    // Decay less used knowledge
    this.decayMemory();
  }

  decayMemory() {
    // Decay concept activations
    Object.keys(this.knowledgeGraph.concepts).forEach(key => {
      const concept = this.knowledgeGraph.concepts[key];
      const timeDiff = (Date.now() - concept.lastUsed) / (1000 * 60 * 60); // hours
      concept.activation *= Math.pow(this.memoryDecay, timeDiff);
      
      // Remove very weak concepts
      if (concept.activation < 0.1) {
        delete this.knowledgeGraph.concepts[key];
      }
    });
    
    // Decay pattern confidence
    this.responsePatterns.forEach(pattern => {
      pattern.confidence *= 0.99; // Slight decay
    });
    
    // Remove low-confidence patterns
    this.responsePatterns = this.responsePatterns.filter(
      p => p.confidence > this.minConfidenceThreshold
    );
  }

  // Helper methods
  normalizeInput(text) {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  extractKeywords(text) {
    // Simple implementation - can be enhanced
    const words = text.split(' ');
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'to', 'of']);
    return words.filter(word => word.length > 2 && !stopWords.has(word));
  }

  extractContext(text) {
    // Simple context extraction
    if (text.includes('?')) return 'question';
    if (text.includes('!')) return 'exclamation';
    if (text.match(/\b(how|what|when|where|why|who)\b/)) return 'question';
    return 'statement';
  }

  extractConcepts(text) {
    // Extract nouns and important words
    const keywords = this.extractKeywords(text);
    return keywords.filter(word => word.length > 3); // Simple filter
  }

  findBestResponse(input, context) {
    // First check for exact matches
    const exactMatch = this.responsePatterns.find(pattern =>
      pattern.triggers.some(trigger => input.includes(trigger))
    );
    
    if (exactMatch) return { response: exactMatch.response, pattern: exactMatch };
    
    // Then check for conceptual matches
    const inputConcepts = this.extractConcepts(input);
    const scoredPatterns = this.responsePatterns.map(pattern => {
      const patternConcepts = this.extractConcepts(pattern.triggers.join(' '));
      const intersection = inputConcepts.filter(c => patternConcepts.includes(c));
      const score = intersection.length / Math.max(inputConcepts.length, patternConcepts.length, 1);
      return { pattern, score: score * pattern.confidence };
    });
    
    // Sort by score and return the best
    scoredPatterns.sort((a, b) => b.score - a.score);
    
    if (scoredPatterns.length > 0 && scoredPatterns[0].score > this.minConfidenceThreshold) {
      return {
        response: scoredPatterns[0].pattern.response,
        pattern: scoredPatterns[0].pattern
      };
    }
    
    // Default response if nothing matches
    const defaultResponses = [
      "I'm still learning. Can you explain that differently?",
      "That's interesting. Tell me more about that.",
      "I don't have a response for that yet. What else would you like to discuss?"
    ];
    
    const randomResponse = defaultResponses[
      Math.floor(Math.random() * defaultResponses.length)
    ];
    
    return { response: randomResponse, pattern: null };
  }

  // Save/load state
  saveToLocalStorage() {
    const state = {
      knowledgeGraph: this.knowledgeGraph,
      responsePatterns: this.responsePatterns,
      conversationMemory: this.conversationMemory.slice(-100), // Keep last 100
      timestamp: Date.now()
    };
    localStorage.setItem('selfLearningAIAgent', JSON.stringify(state));
  }

  loadFromLocalStorage() {
    const saved = localStorage.getItem('selfLearningAIAgent');
    if (saved) {
      const state = JSON.parse(saved);
      this.knowledgeGraph = state.knowledgeGraph || { concepts: {}, relationships: [] };
      this.responsePatterns = state.responsePatterns || [];
      this.conversationMemory = state.conversationMemory || [];
    }
  }
}