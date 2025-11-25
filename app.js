// === RÉCUPÉRATION DES ÉLÉMENTS HTML ===
const questionText = document.getElementById("questionText");
const choicesContainer = document.getElementById("choices");
const nextBtn = document.getElementById("nextBtn");
const restartBtn = document.getElementById("restartBtn");
const timerContainer = document.getElementById("timer");
const timeLeftEl = document.getElementById("timeLeft");
const qNumber = document.getElementById("qNumber");
const qTotal = document.getElementById("qTotal");
const progressBar = document.getElementById("progress");

// === VARIABLES ===
let questions = [];
let currentIndex = 0;
let score = 0;
let timer;
let timeLeft = 15;

// Tableau pour stocker le résumé
let summary = [];

// ===============================
// CHARGEMENT QUESTIONS
// ===============================
if (document.body.id === "quiz-page") {
  fetch("questions.json")
    .then((res) => res.json())
    .then((data) => {
      questions = data;
      qTotal.textContent = questions.length;
      loadQuestion();
    })
    .catch((err) => console.error("Erreur JSON :", err));
}

// ===============================
// CHARGER UNE QUESTION
// ===============================
function loadQuestion() {
  clearInterval(timer);

  // Timer
  timeLeft = 15;
  timeLeftEl.textContent = timeLeft;
  timerContainer.style.display = "block";
  timer = setInterval(countdown, 1000);

  // Progresion
  updateProgressBar();

  const currentQuestion = questions[currentIndex];

  // --- Animation fade-out ---
  questionText.classList.add("fade-out");
  choicesContainer.classList.add("fade-out");
  nextBtn.classList.add("fade-out");

  // Après un petit délai, changer le contenu et fade-in
  setTimeout(() => {
    qNumber.textContent = currentIndex + 1;
    questionText.textContent = currentQuestion.question;

    // Choix
    choicesContainer.innerHTML = "";
    nextBtn.disabled = true;

    currentQuestion.choices.forEach((choice, index) => {
      const li = document.createElement("li");
      li.classList.add("choice");
      li.textContent = choice;

      li.onclick = () => selectAnswer(li, index);

      choicesContainer.appendChild(li);
    });

    // --- Animation fade-in ---
    questionText.classList.remove("fade-out");
    questionText.classList.add("fade-in");

    choicesContainer.classList.remove("fade-out");
    choicesContainer.classList.add("fade-in");

    nextBtn.classList.remove("fade-out");
    nextBtn.classList.add("fade-in");
  }, 200); // 200ms pour fade-out
}

// ===============================
// TIMER
// ===============================
function countdown() {
  timeLeft--;
  timeLeftEl.textContent = timeLeft;

  // Son de compte à rebours
  soundTick.currentTime = 0;
  soundTick.play();

  if (timeLeft === 0) {
    clearInterval(timer);

    // Son de fin de temps
    soundEnd.currentTime = 0;
    soundEnd.play();

    revealCorrectAnswer();
    nextBtn.disabled = false;

    // Ajouter résumé pour question non répondue
    summary.push({
      question: questions[currentIndex].question,
      userAnswer: "Temps écoulé",
      correctAnswer:
        questions[currentIndex].choices[questions[currentIndex].answer],
    });

    nextBtn.disabled = false;
  }
}

// ===============================
// SÉLECTION RÉPONSE
// ===============================
function selectAnswer(selectedLi, selectedIndex) {
  clearInterval(timer);

  const correctIndex = questions[currentIndex].answer;
  const choices = document.querySelectorAll(".choice");

  choices.forEach((choice, i) => {
    if (i === correctIndex) choice.classList.add("correct");
    if (i === selectedIndex && selectedIndex !== correctIndex)
      choice.classList.add("wrong");

    choice.style.pointerEvents = "none";
  });

  // Son pour bonne réponse / mauvaise réponse
  if (selectedIndex === correctIndex) {
    soundCorrect.play();
  } else {
    soundWrong.play();
  }

  // Résumé
  summary.push({
    question: questions[currentIndex].question,
    userAnswer: questions[currentIndex].choices[selectedIndex],
    correctAnswer: questions[currentIndex].choices[correctIndex],
  });

  if (selectedIndex === correctIndex) score++;

  nextBtn.disabled = false;
}

// ===============================
// Bonne réponse automatique
// ===============================
function revealCorrectAnswer() {
  const correctIndex = questions[currentIndex].answer;
  const choices = document.querySelectorAll(".choice");

  choices.forEach((choice, i) => {
    if (i === correctIndex) choice.classList.add("correct");
    choice.style.pointerEvents = "none";
  });
}

// ===============================
// Barre de progression
// ===============================
function updateProgressBar() {
  const percent = (currentIndex / questions.length) * 100;
  progressBar.style.width = percent + "%";
}

// ===============================
// SUIVANT
// ===============================
if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    currentIndex++;

    if (currentIndex < questions.length) {
      loadQuestion();
    } else {
      showResults();
    }
  });
}

// ===============================
// Affichage résultats
// ===============================
function showResults() {
  // Enregistrer score + résumé
  localStorage.setItem("quiz_score", score);
  localStorage.setItem("quiz_total", questions.length);
  localStorage.setItem("quizSummary", JSON.stringify(summary));

  // Redirection avec paramètres (au cas où)
  window.location.href = `resultat.html?score=${score}&total=${questions.length}`;
}

// ===================================================================
// SECTION RESULT PAGE
// ===================================================================
if (document.body.id === "result-page") {
  const scoreText = document.getElementById("scoreText");
  const summaryContainer = document.getElementById("summary");

  // Récupération score
  const score = localStorage.getItem("quiz_score");
  const total = localStorage.getItem("quiz_total");

  if (score && total) {
    scoreText.textContent = `${score} / ${total}`;
  } else {
    scoreText.textContent = "Aucun score trouvé";
  }

  // Récupération résumé
  const summaryData = localStorage.getItem("quizSummary");

  if (summaryData) {
    const items = JSON.parse(summaryData);

    summaryContainer.innerHTML = `
            <h2>Résumé</h2>
            <ol class="summary-list">
                ${items
                  .map(
                    (item) => `
                    <li class="summary-item">
                        <p>${item.question}</p>
                        <p><strong>Ta réponse :</strong> ${item.userAnswer}</p>
                        <p><strong>Bonne réponse :</strong> ${item.correctAnswer}</p>
                    </li>
                `
                  )
                  .join("")}
            </ol>
        `;
  } else {
    summaryContainer.innerHTML = "<p>Aucun résumé disponible.</p>";
  }

  // Son de félicitations
  const percent = (score / total) * 100;
  let endSound;

  if (percent < 50) {
    endSound = new Audio("sounds/end.mp3");
  } else if (percent >= 50) {
    endSound = new Audio("sounds/gg.mp3");
  }

  setTimeout(() => {
    endSound
      .play()
      .catch((err) => console.error("Lecture audio bloquée :", err));
  }, 300);
}
// --- THEME TOGGLE ---
document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("themeToggle");
  const themeLabel = document.getElementById("themeLabel");
  const body = document.body;

  if (!themeToggle || !themeLabel) return;

  // Charger thème sauvegardé
  const savedTheme = localStorage.getItem("theme") || "light";
  body.setAttribute("data-theme", savedTheme);
  themeToggle.checked = savedTheme === "dark";
  themeLabel.textContent = savedTheme === "dark" ? "Dark Mode" : "Light Mode";

  // Changement du switch
  themeToggle.addEventListener("change", () => {
    const isDark = themeToggle.checked;
    body.setAttribute("data-theme", isDark ? "dark" : "light");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    themeLabel.textContent = isDark ? "Dark Mode" : "Light Mode";
  });
});

// SONS
const soundTick = new Audio("sounds/ticking.mp3");
const soundCorrect = new Audio("sounds/correct.mp3");
const soundWrong = new Audio("sounds/incorrect.mp3");
const soundEnd = new Audio("sounds/end.mp3");

// Sélection des éléments
const fabMain = document.querySelector(".fab-main");
const fabButtons = document.querySelector(".fab-buttons");

if (fabMain && fabButtons) {
  fabMain.addEventListener("click", () => {
    const isOpen = fabButtons.style.opacity === "1";
    if (isOpen) {
      fabButtons.style.opacity = "0";
      fabButtons.style.pointerEvents = "none";
      fabMain.style.transform = "rotate(0deg)";
    } else {
      fabButtons.style.opacity = "1";
      fabButtons.style.pointerEvents = "auto";
      fabMain.style.transform = "rotate(180deg)";
    }
  });
}
