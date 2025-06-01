document.addEventListener('DOMContentLoaded', () => {
  const chatLog = document.getElementById('chat-log');
  const userInput = document.getElementById('user-input');
  const sendBtn = document.getElementById('send-btn');
  const trainBtn = document.getElementById('train-btn');
  const resetBtn = document.getElementById('reset-btn');
  const saveBtn = document.getElementById('save-btn');
  const loadBtn = document.getElementById('load-btn');
  
  // Initialize AI Agent
  const agent = new SelfLearningAIAgent();
  agent.loadFromLocalStorage();
  
  // Display message in chat
  function displayMessage(sender, message) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`);
    messageDiv.textContent = message;
    chatLog.appendChild(messageDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
  }
  
  // Show typing indicator
  function showTyping() {
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typing-indicator';
    typingDiv.className = 'typing-indicator';
    typingDiv.innerHTML = '<span></span><span></span><span></span>';
    chatLog.appendChild(typingDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
  }
  
  // Hide typing indicator
  function hideTyping() {
    const typing = document.getElementById('typing-indicator');
    if (typing) typing.remove();
  }
  
  // Process user input
  async function handleInput() {
    const input = userInput.value.trim();
    if (!input) return;
    
    displayMessage('user', input);
    userInput.value = '';
    
    showTyping();
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    const response = await agent.processInput(input);
    
    hideTyping();
    displayMessage('agent', response);
    
    // Save state
    agent.saveToLocalStorage();
  }
  
  // Event listeners
  sendBtn.addEventListener('click', handleInput);
  userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleInput();
  });
  
  trainBtn.addEventListener('click', () => {
    showTyping();
    setTimeout(() => {
      // The agent now learns automatically, so this just reinforces
      displayMessage('agent', "I learn continuously from our conversations!");
      hideTyping();
    }, 800);
  });
  
  resetBtn.addEventListener('click', () => {
    showTyping();
    setTimeout(() => {
      localStorage.removeItem('selfLearningAIAgent');
      agent = new SelfLearningAIAgent();
      displayMessage('agent', "I've reset my knowledge and started fresh!");
      hideTyping();
    }, 800);
  });
  
  saveBtn.addEventListener('click', () => {
    showTyping();
    setTimeout(() => {
      agent.saveToLocalStorage();
      displayMessage('agent', "I've saved my current knowledge!");
      hideTyping();
    }, 800);
  });
  
  loadBtn.addEventListener('click', () => {
    showTyping();
    setTimeout(() => {
      agent.loadFromLocalStorage();
      displayMessage('agent', "I've loaded my previous knowledge!");
      hideTyping();
    }, 800);
  });
  
  // Initial greeting
  setTimeout(() => {
    displayMessage('agent', "Hello! I'm a self-learning AI. The more we talk, the smarter I become!");
  }, 500);
});