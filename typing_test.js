const sampleTexts = {
      beginner: [
        "The cat sits. The dog runs. Birds fly high. Kids like to play.",
        "A red ball rolls. The sun is bright. We all smile today."
      ],
      easy: [
        "The sun is shining today. It is a great day to go outside and play. Enjoy the weather!",
        "Cats and dogs are common pets. They bring joy to many people. Love your animals."
      ],
      medium: [
        "The quick brown fox jumps over the lazy dog. This is a common typing test sentence. Practice makes perfect.",
        "Typing is a skill that improves with practice. The more you type, the better you get. Keep going strong!"
      ],
      hard: [
        "A journey of a thousand miles begins with a single step. Practice makes perfect in typing. Stay focused and keep learning.",
        "Technology has transformed communication. Typing is now essential in the digital age. Embrace the challenge to excel."
      ],
      expert: [
        "Pneumonoultramicroscopicsilicovolcanoconiosis is a lung disease caused by silica dust. It affects many workers in certain industries. Precision is key.",
        "Supercalifragilisticexpialidocious is a nonsensical word from a famous musical film. It is often used to test advanced typing skills. Push your limits."
      ],
      master: [
        "In the labyrinthine depths of computational linguistics, mastering typing velocity demands relentless dedication. The synergy of muscle memory and cognitive acuity propels one toward unparalleled proficiency, challenging even the most adept typists to transcend their limits.",
        "Quantum mechanics elucidates the enigmatic behavior of subatomic particles, while typing at this echelon requires precision akin to aligning qubits. Only the most disciplined practitioners conquer this pinnacle, blending speed, accuracy, and endurance in a symphony of keystrokes."
      ],
      legendary: [
        "Amidst the esoteric realm of cryptographic algorithms and polymorphic code, typing with transcendent speed and unerring accuracy demands an almost superhuman synthesis of dexterity, focus, and resilience. The relentless pursuit of perfection in this domain separates the legendary from the merely proficient, forging a legacy of unmatched skill.",
        "Navigating the intricate tapestry of astrophysical theories and multidimensional mathematics, legendary typists harness a fusion of cerebral prowess and kinetic mastery. To type at this zenith, one must synchronize rapid keystrokes with impeccable precision, defying the boundaries of human capability in a relentless quest for greatness."
      ]
    };

    const textDisplay = document.getElementById('text-display');
    const textInput = document.getElementById('text-input');
    const startBtn = document.getElementById('start-btn');
    const timerDisplay = document.getElementById('timer');
    const wpmDisplay = document.getElementById('wpm');
    const accuracyDisplay = document.getElementById('accuracy');
    const cpmDisplay = document.getElementById('cpm');
    const errorsDisplay = document.getElementById('errors');
    const resultsDisplay = document.getElementById('results');
    const difficultySelect = document.getElementById('difficulty');
    const timeLimitSelect = document.getElementById('time-limit');
    const customTextBtn = document.getElementById('custom-text-btn');
    const customTextModal = document.getElementById('custom-text-modal');
    const customTextInput = document.getElementById('custom-text-input');
    const saveCustomText = document.getElementById('save-custom-text');
    const cancelCustomText = document.getElementById('cancel-custom-text');
    const progressChart = document.getElementById('progress-chart');
    const heatmapCanvas = document.getElementById('keystroke-heatmap');
    const reportCard = document.getElementById('report-card');
    const generateReport = document.getElementById('generate-report');

    let currentText = '';
    let currentIndex = 0;
    let startTime = null;
    let endTime = null;
    let timer = 60;
    let interval = null;
    let testActive = false;
    let correctChars = 0;
    let totalChars = 0;
    let errors = 0;
    let keystrokes = {};
    let history = JSON.parse(localStorage.getItem('typingHistory')) || [];
    let wpmChart = null;

    function getRandomText() {
      const diff = difficultySelect.value;
      const texts = sampleTexts[diff];
      return texts[Math.floor(Math.random() * texts.length)];
    }

    function startTest() {
      if (testActive) return;
      testActive = true;
      currentText = customTextInput.value.trim() || getRandomText();
      currentIndex = 0;
      correctChars = 0;
      totalChars = 0;
      errors = 0;
      keystrokes = {};
      timer = parseInt(timeLimitSelect.value);
      textInput.value = '';
      textInput.disabled = false;
      textInput.focus();
      startBtn.textContent = 'Reset';
      resultsDisplay.classList.remove('show');
      progressChart.classList.remove('show');
      heatmapCanvas.classList.remove('show');
      reportCard.classList.remove('show');
      timerDisplay.textContent = timer;
      wpmDisplay.textContent = '0';
      accuracyDisplay.textContent = '0';
      cpmDisplay.textContent = '0';
      errorsDisplay.textContent = '0';
      updateTextDisplay();
      startTime = new Date();
      interval = setInterval(updateTimer, 1000);
    }

    function endTest() {
      if (!testActive) return;
      testActive = false;
      clearInterval(interval);
      textInput.disabled = true;
      endTime = new Date();
      const timeTaken = (endTime - startTime) / 1000 / 60; // in minutes
      const wpm = Math.round((correctChars / 5) / timeTaken) || 0;
      const accuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 0;
      const cpm = Math.round(correctChars / timeTaken) || 0;
      wpmDisplay.textContent = wpm;
      accuracyDisplay.textContent = accuracy;
      cpmDisplay.textContent = cpm;
      errorsDisplay.textContent = errors;
      resultsDisplay.innerHTML = `Test Complete!<br>WPM: ${wpm}<br>Accuracy: ${accuracy}%<br>CPM: ${cpm}<br>Errors: ${errors}`;
      resultsDisplay.classList.add('show');
      saveHistory(wpm, accuracy, cpm, errors);
      updateProgressChart();
      updateKeystrokeHeatmap();
    }

    function updateTimer() {
      if (!testActive) return;
      timer--;
      timerDisplay.textContent = timer;
      if (timer <= 0) {
        endTest();
      }
    }

    function updateTextDisplay() {
      const displayHTML = currentText.split('').map((char, index) => {
        if (index < currentIndex) {
          const typedChar = textInput.value[index] || '';
          const isCorrect = typedChar === char;
          return `<span class="${isCorrect ? 'correct' : 'incorrect'}">${char}</span>`;
        } else if (index === currentIndex) {
          return `<span class="current">${char}</span>`;
        } else {
          return char;
        }
      }).join('');
      textDisplay.innerHTML = displayHTML;
    }

    function saveHistory(wpm, accuracy, cpm, errors) {
      const entry = {
        date: new Date().toLocaleString(),
        wpm: wpm,
        accuracy: accuracy,
        cpm: cpm,
        errors: errors,
        difficulty: difficultySelect.value,
        timeLimit: timeLimitSelect.value
      };
      history.push(entry);
      localStorage.setItem('typingHistory', JSON.stringify(history));
    }

    function updateProgressChart() {
      progressChart.classList.add('show');
      const ctx = document.getElementById('wpm-chart').getContext('2d');
      if (wpmChart) wpmChart.destroy();
      wpmChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: history.map(entry => entry.date),
          datasets: [{
            label: 'WPM Over Time',
            data: history.map(entry => entry.wpm),
            borderColor: 'var(--primary)',
            backgroundColor: 'rgba(96, 165, 250, 0.2)',
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          scales: {
            y: { 
              beginAtZero: true, 
              title: { 
                display: true, 
                text: 'WPM', 
                color: 'var(--text-color)' 
              } 
            },
            x: { 
              title: { 
                display: true, 
                text: 'Test Date', 
                color: 'var(--text-color)' 
              } 
            }
          }
        }
      });
    }

    function updateKeystrokeHeatmap() {
      heatmapCanvas.classList.add('show');
      const ctx = document.getElementById('heatmap-canvas').getContext('2d');
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      for (let key in keystrokes) {
        const freq = keystrokes[key];
        const intensity = Math.min(255, freq * 50);
        ctx.fillStyle = `rgba(167, 139, 250, ${intensity / 255})`;
        ctx.fillRect((key.charCodeAt(0) % 20) * 20, Math.floor(key.charCodeAt(0) / 20) * 20, 18, 18);
        ctx.fillStyle = 'var(--text-color)';
        ctx.fillText(key, (key.charCodeAt(0) % 20) * 20 + 9, Math.floor(key.charCodeAt(0) / 20) * 20 + 14);
      }
    }

    function generateReportCard() {
      reportCard.classList.add('show');
      if (history.length === 0) {
        reportCard.innerHTML = '<h2>Report Card</h2><p>No test history available. Complete a test to generate a report.</p>';
        return;
      }
      const lastTest = history[history.length - 1];
      const avgWpm = history.reduce((sum, entry) => sum + entry.wpm, 0) / history.length;
      const avgAccuracy = history.reduce((sum, entry) => sum + entry.accuracy, 0) / history.length;
      const avgCpm = history.reduce((sum, entry) => sum + entry.cpm, 0) / history.length;
      const performanceGrade = lastTest.wpm > 100 && lastTest.accuracy > 97 ? 'A+'
        : lastTest.wpm > 80 && lastTest.accuracy > 95 ? 'A'
        : lastTest.wpm > 60 && lastTest.accuracy > 90 ? 'B'
        : lastTest.wpm > 40 && lastTest.accuracy > 85 ? 'C'
        : lastTest.wpm > 20 && lastTest.accuracy > 75 ? 'D' : 'F';
      reportCard.innerHTML = `
        <h2>Report Card</h2>
        <p><strong>Date:</strong> ${lastTest.date}</p>
        <p><strong>Difficulty:</strong> ${lastTest.difficulty.toUpperCase()}</p>
        <p><strong>Time Limit:</strong> ${lastTest.timeLimit} seconds</p>
        <p><strong>WPM:</strong> ${lastTest.wpm}</p>
        <p><strong>Accuracy:</strong> ${lastTest.accuracy}%</p>
        <p><strong>CPM:</strong> ${lastTest.cpm}</p>
        <p><strong>Errors:</strong> ${lastTest.errors}</p>
        <p><strong>Average WPM (All Tests):</strong> ${Math.round(avgWpm)}</p>
        <p><strong>Average Accuracy (All Tests):</strong> ${Math.round(avgAccuracy)}%</p>
        <p><strong>Average CPM (All Tests):</strong> ${Math.round(avgCpm)}</p>
        <p><strong>Performance Grade:</strong> ${performanceGrade}</p>
        <p><strong>Feedback:</strong> ${getFeedback(lastTest.wpm, lastTest.accuracy, lastTest.errors)}</p>
      `;
    }

    function getFeedback(wpm, accuracy, errors) {
      if (wpm > 100 && accuracy > 97 && errors < 3) return "Legendary performance! Your speed and accuracy are extraordinary.";
      if (wpm > 80 && accuracy > 95) return "Outstanding! Excellent speed and precision. Aim for legendary status.";
      if (wpm > 60 && accuracy > 90) return "Great job! Solid speed and high accuracy. Keep practicing.";
      if (wpm > 40 && accuracy > 85) return "Good effort! Focus on reducing errors to boost your score.";
      if (wpm > 20 && accuracy > 75) return "Keep practicing! Work on speed and accuracy to improve.";
      return "Start slow and steady! Focus on accuracy, then build speed over time.";
    }

    function resetTest() {
      clearInterval(interval);
      testActive = false;
      textInput.disabled = true;
      textInput.value = '';
      startBtn.textContent = 'Start Test';
      timer = parseInt(timeLimitSelect.value);
      timerDisplay.textContent = timer;
      wpmDisplay.textContent = '0';
      accuracyDisplay.textContent = '0';
      cpmDisplay.textContent = '0';
      errorsDisplay.textContent = '0';
      resultsDisplay.classList.remove('show');
      progressChart.classList.remove('show');
      heatmapCanvas.classList.remove('show');
      reportCard.classList.remove('show');
      textDisplay.innerHTML = '';
      startTime = null;
      endTime = null;
    }

    textInput.addEventListener('input', () => {
      if (!testActive) return;
      const typed = textInput.value;
      totalChars = typed.length;
      correctChars = 0;
      errors = 0;
      for (let i = 0; i < typed.length; i++) {
        if (i < currentText.length) {
          if (typed[i] === currentText[i]) {
            correctChars++;
          } else {
            errors++;
          }
          keystrokes[typed[i]] = (keystrokes[typed[i]] || 0) + 1;
        }
      }
      currentIndex = typed.length;
      updateTextDisplay();
      const timeTaken = startTime ? (new Date() - startTime) / 1000 / 60 : 0;
      const wpm = timeTaken > 0 ? Math.round((correctChars / 5) / timeTaken) : 0;
      const accuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 0;
      const cpm = timeTaken > 0 ? Math.round(correctChars / timeTaken) : 0;
      wpmDisplay.textContent = wpm;
      accuracyDisplay.textContent = accuracy;
      cpmDisplay.textContent = cpm;
      errorsDisplay.textContent = errors;
      if (currentIndex >= currentText.length) {
        endTest();
      }
    });

    textInput.addEventListener('keydown', (e) => {
      if (!testActive) return;
      keystrokes[e.key] = (keystrokes[e.key] || 0) + 1;
    });

    startBtn.addEventListener('click', () => {
      if (testActive) {
        resetTest();
      } else {
        startTest();
      }
    });

    customTextBtn.addEventListener('click', () => {
      customTextModal.style.display = 'flex';
    });

    saveCustomText.addEventListener('click', () => {
      if (customTextInput.value.trim()) {
        customTextModal.style.display = 'none';
      }
    });

    cancelCustomText.addEventListener('click', () => {
      customTextInput.value = '';
      customTextModal.style.display = 'none';
    });

    generateReport.addEventListener('click', generateReportCard);