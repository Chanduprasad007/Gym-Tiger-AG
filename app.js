(function() {
// Gym - Antigravity - Core Application Engine (Pure Local Offline compatibility mode)

// Extract variables from the global window context loaded from scripts
const { 
  program, coachingRules, focusTags, 
  db, auth, isMockMode, saveFirebaseConfig, clearFirebaseConfig, getSavedFirebaseConfig, syncOfflineQueue,
  initAuthUI, showAuthPanel, showToast 
} = window;

// Cache Core DOM Elements
const elements = {
  // Navigation
  userBadge: document.getElementById("nav-user-badge"),
  btnSettingsTrigger: document.getElementById("btn-settings-trigger"),
  
  // Dashboard Core
  daySelectorGrid: document.getElementById("day-selector-grid"),
  detailsHeaderCopy: document.getElementById("details-header-copy"),
  exercisesList: document.getElementById("exercises-list"),
  btnStartWorkout: document.getElementById("btn-start-workout"),
  
  // Sidebar Widgets
  advisorList: document.getElementById("advisor-list"),
  coachingRulesGrid: document.getElementById("coaching-rules-grid"),
  
  // Settings Modal Overlay
  settingsOverlay: document.getElementById("settings-overlay"),
  settingsPanel: document.getElementById("settings-panel"),
  settingsCloseBtn: document.getElementById("settings-close-btn"),
  firebaseConfigTextarea: document.getElementById("firebase-config-textarea"),
  btnSaveConfig: document.getElementById("btn-save-config"),
  btnClearConfig: document.getElementById("btn-clear-config"),
  
  // Session Overlay UI
  workoutSessionOverlay: document.getElementById("workout-session-overlay"),
  sessionDayTitle: document.getElementById("session-day-title"),
  sessionTimer: document.getElementById("session-timer"),
  activeExerciseTitle: document.getElementById("active-exercise-title"),
  activeExerciseCue: document.getElementById("active-exercise-cue"),
  activeExerciseGifFrame: document.getElementById("active-exercise-gif-frame"),
  setsLoggerTable: document.getElementById("sets-logger-table"),
  btnPrevExercise: document.getElementById("btn-prev-exercise"),
  btnNextExercise: document.getElementById("btn-next-exercise"),
  btnFinishSession: document.getElementById("btn-finish-session"),
  btnCloseSession: document.getElementById("btn-close-session"),
  alternativesQuickTabs: document.getElementById("alternatives-quick-tabs"),
  btnSearchForm: document.getElementById("btn-search-form"),
  workoutCardsGrid: document.getElementById("workout-cards-grid"),
  workoutSummaryOverlay: document.getElementById("workout-summary-overlay"),
  btnCloseSummary: document.getElementById("btn-close-summary"),
  
  // Rest Timer UI
  timerSeconds: document.getElementById("timer-seconds"),
  timerProgressCircle: document.getElementById("timer-progress-circle"),
  btnPauseTimer: document.getElementById("btn-pause-timer"),
  btnSkipTimer: document.getElementById("btn-skip-timer"),
  btnAddTimer: document.getElementById("btn-add-timer"),
  
  // History Dashboard Widget
  historyList: document.getElementById("history-list"),
  totalWorkoutsStat: document.getElementById("total-workouts-stat"),
  totalVolumeStat: document.getElementById("total-volume-stat"),
  completionRateStat: document.getElementById("completion-rate-stat"),
  btnInstallApp: document.getElementById("pwa-install-btn"),
  btnThemeToggle: document.getElementById("theme-toggle-btn")
};

// Global App State
let currentUser = null;
let currentActiveDayLetter = "A";
let activeSessionData = null; // Session details when workout is running
let sessionTimerInterval = null;
let restTimerInterval = null;
let restTimerTotalSec = 90;
let restTimerRemainingSec = 0;
let restTimerIsPaused = false;
let currentFilter = "all";

// WorkoutX GIF cache seeds
const WORKOUTX_GIFS = {
  "barbell bench press": "https://api.workoutxapp.com/v1/gifs/0047.gif",
  "incline dumbbell press": "https://api.workoutxapp.com/v1/gifs/0314.gif",
  "deadlift": "https://api.workoutxapp.com/v1/gifs/0032.gif",
  "wide-grip lat pulldown": "https://api.workoutxapp.com/v1/gifs/0150.gif",
  "front squat": "https://api.workoutxapp.com/v1/gifs/0043.gif",
  "romanian deadlift": "https://api.workoutxapp.com/v1/gifs/0034.gif"
};

// ==========================================
// INITIALIZATION
// ==========================================

function initializeGymApp() {
  // Load saved theme settings
  const savedTheme = localStorage.getItem("gym-antigravity_theme");
  if (savedTheme === "light") {
    document.body.classList.add("light-theme");
    const toggleBtn = document.getElementById("theme-toggle-btn");
    if (toggleBtn) {
      toggleBtn.textContent = "🌙";
    }
  }

  // Initialize default offline user instantly for frictionless load
  currentUser = { uid: "local-user-gym-antigravity", email: "athlete@gym-antigravity.com", displayName: "Athlete" };
  onUserAuthenticated(currentUser);

  // Initialize Auth Controller UI
  initAuthUI({
    authContainer: document.getElementById("auth-container"),
    authPanel: document.getElementById("auth-panel"),
    authHeaderTitle: document.getElementById("auth-header-title"),
    authHeaderDesc: document.getElementById("auth-header-desc"),
    authEmailInput: document.getElementById("auth-email"),
    authPasswordInput: document.getElementById("auth-password"),
    authSubmitBtn: document.getElementById("auth-submit-btn"),
    authSwitchSpan: document.getElementById("auth-switch-span"),
    userBadge: elements.userBadge
  }, onUserAuthenticated);

  setupBaseEventListeners();
  renderFocusTags();
  renderCoachingRules();
  loadSavedConfigInTextarea();

  window.addEventListener("online", () => {
    if (currentUser) {
      syncOfflineQueue(currentUser.uid);
      showToast("Connection restored! Syncing offline workouts...");
    }
  });

  // Setup click handler for PWA install button
  const installBtn = document.getElementById("pwa-install-btn");
  if (installBtn) {
    installBtn.addEventListener("click", async () => {
      if (deferredPrompt) {
        // Show the prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        // We've used the prompt, and can't use it again
        deferredPrompt = null;
        // Hide the install button
        installBtn.style.display = "none";
      }
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeGymApp);
} else {
  initializeGymApp();
}

function setupBaseEventListeners() {
  // Settings Panel trigger
  elements.btnSettingsTrigger?.addEventListener("click", openSettingsPanel);
  elements.settingsCloseBtn?.addEventListener("click", closeSettingsPanel);
  elements.settingsOverlay?.addEventListener("click", closeSettingsPanel);
  
  // Save/Clear Firebase Configuration
  elements.btnSaveConfig?.addEventListener("click", saveCustomFirebase);
  elements.btnClearConfig?.addEventListener("click", clearCustomFirebase);
  
  // Dashboard Interactions
  elements.btnStartWorkout?.addEventListener("click", startWorkoutSession);
  
  // Session overlay Controls
  elements.btnPrevExercise?.addEventListener("click", () => navigateExercise(-1));
  elements.btnNextExercise?.addEventListener("click", () => navigateExercise(1));
  elements.btnFinishSession?.addEventListener("click", finishWorkoutSession);
  elements.btnCloseSession?.addEventListener("click", closeWorkoutSession);
  
  // Rest Timer Controls
  elements.btnSkipTimer?.addEventListener("click", skipRestTimer);
  elements.btnPauseTimer?.addEventListener("click", togglePauseRestTimer);
  elements.btnAddTimer?.addEventListener("click", add30sRestTimer);

  // Theme Toggle Control
  elements.btnThemeToggle?.addEventListener("click", toggleAppTheme);

  // Filter Bar listeners
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;

      // Auto-select first visible card if the current active day is filtered out under the new filter
      const favs = getFavorites();
      const visibleDays = program.filter(day => {
        const meta = getWorkoutMetadata(day.letter);
        const isFav = favs.includes(day.letter);
        if (currentFilter === "all") return true;
        if (currentFilter === "favs") return isFav;
        return meta.category === currentFilter;
      });
      if (visibleDays.length > 0 && !visibleDays.some(d => d.letter === currentActiveDayLetter)) {
        currentActiveDayLetter = visibleDays[0].letter;
      }

      renderWorkoutCards();
      renderActiveDayDetails();
    });
  });
  
  // Close summary listener
  elements.btnCloseSummary?.addEventListener("click", () => {
    elements.workoutSummaryOverlay?.classList.remove("active");
    elements.workoutSessionOverlay?.classList.remove("active");
    renderWorkoutCards();
    renderActiveDayDetails();
    refreshHistoryDashboard();
    refreshOverloadAdvisor();
  });
}

// ==========================================
// CORE AUTH / USER SETUP
// ==========================================

async function onUserAuthenticated(user) {
  currentUser = user;
  if (user) {
    // Read user profile preferences
    try {
      const profile = await db.getUserProfile(user.uid);
      currentActiveDayLetter = profile.activeDay || "A";
    } catch (e) {
      console.warn("Failed to load user profile, falling back to Day A.", e);
    }
    
    // Refresh dashboards
    renderWorkoutCards();
    renderActiveDayDetails();
    refreshHistoryDashboard();
    refreshOverloadAdvisor();
    
    // Trigger offline queue sync
    syncOfflineQueue(user.uid);
  } else {
    // Unauthenticated: default clean rendering
    currentActiveDayLetter = "A";
    renderWorkoutCards();
    renderActiveDayDetails();
    resetStatsDashboard();
  }
}

// ==========================================
// DASHBOARD RENDERING
// ==========================================

function renderFocusTags() {
  const container = document.getElementById("focus-tags");
  if (container) {
    container.innerHTML = focusTags
      .map(tag => `<span class="focus-tag ${tag.tone}"><span></span>${tag.label}</span>`)
      .join("");
  }
}

function renderCoachingRules() {
  if (elements.coachingRulesGrid) {
    elements.coachingRulesGrid.innerHTML = coachingRules
      .map(rule => `
        <div class="coaching-card">
          <h4>⚡ ${rule.title}</h4>
          <p>${rule.copy}</p>
        </div>
      `).join("");
  }
}

function getWorkoutMetadata(dayLetter) {
  switch (dayLetter) {
    case "A":
      return { category: "chest-arms", duration: "60 mins", difficulty: "Intermediate", accent: "var(--color-orange)", accentDim: "rgba(255, 107, 0, 0.15)", gradient: "linear-gradient(135deg, var(--color-orange) 0%, var(--color-pink) 100%)" };
    case "B":
      return { category: "back-shoulders", duration: "60 mins", difficulty: "Intermediate", accent: "var(--color-cyan)", accentDim: "rgba(0, 229, 229, 0.15)", gradient: "linear-gradient(135deg, var(--color-cyan) 0%, var(--color-lime) 100%)" };
    case "C":
      return { category: "legs-core", duration: "75 mins", difficulty: "Advanced", accent: "var(--color-violet)", accentDim: "rgba(138, 43, 226, 0.15)", gradient: "linear-gradient(135deg, var(--color-violet) 0%, var(--color-pink) 100%)" };
    case "D":
      return { category: "chest-arms", duration: "60 mins", difficulty: "Intermediate", accent: "var(--color-orange)", accentDim: "rgba(255, 107, 0, 0.15)", gradient: "linear-gradient(135deg, var(--color-orange) 0%, var(--color-pink) 100%)" };
    case "E":
      return { category: "back-shoulders", duration: "60 mins", difficulty: "Intermediate", accent: "var(--color-cyan)", accentDim: "rgba(0, 229, 229, 0.15)", gradient: "linear-gradient(135deg, var(--color-cyan) 0%, var(--color-lime) 100%)" };
    case "F":
      return { category: "legs-core", duration: "75 mins", difficulty: "Advanced", accent: "var(--color-violet)", accentDim: "rgba(138, 43, 226, 0.15)", gradient: "linear-gradient(135deg, var(--color-violet) 0%, var(--color-pink) 100%)" };
    default:
      return { category: "chest-arms", duration: "60 mins", difficulty: "Intermediate", accent: "var(--gym-antigravity-orange)", accentDim: "rgba(255, 107, 0, 0.15)", gradient: "var(--gym-antigravity-gradient)" };
  }
}

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem("gym-antigravity_favorites") || "[]");
  } catch (e) {
    return [];
  }
}

function toggleFavorite(letter) {
  let favs = getFavorites();
  if (favs.includes(letter)) {
    favs = favs.filter(l => l !== letter);
  } else {
    favs.push(letter);
  }
  localStorage.setItem("gym-antigravity_favorites", JSON.stringify(favs));
  renderWorkoutCards();
}

function renderWorkoutCards() {
  const container = document.getElementById("workout-cards-grid");
  if (!container) return;
  
  const favs = getFavorites();
  
  let filteredProgram = program.filter(day => {
    const meta = getWorkoutMetadata(day.letter);
    const isFav = favs.includes(day.letter);
    
    if (currentFilter === "all") return true;
    if (currentFilter === "favs") return isFav;
    
    if (currentFilter === "back-shoulders") return meta.category === "back-shoulders";
    if (currentFilter === "chest-arms") return meta.category === "chest-arms";
    if (currentFilter === "legs-core") return meta.category === "legs-core";
    
    return true;
  });
  
  if (filteredProgram.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; color: var(--text-dim); padding: 40px; font-size: 14px;">
        No workouts found for this filter.
      </div>
    `;
    return;
  }
  
  container.innerHTML = filteredProgram.map(day => {
    const meta = getWorkoutMetadata(day.letter);
    const isFav = favs.includes(day.letter);
    const isSelected = day.letter === currentActiveDayLetter;
    
    return `
      <div class="workout-card ${isSelected ? 'selected' : ''}" style="--card-accent: ${meta.accent}; --card-accent-dim: ${meta.accentDim}; --card-gradient: ${meta.gradient};" data-letter="${day.letter}">
        <div class="workout-card-header">
          <div class="workout-card-title-block">
            <h3>${day.title}</h3>
            <p>${day.day}</p>
          </div>
          <button class="workout-card-fav-btn ${isFav ? 'is-fav' : ''}" data-letter="${day.letter}" aria-label="Favorite workout">
            ${isFav ? '❤️' : '🤍'}
          </button>
        </div>
        
        <div class="workout-card-footer">
          <div class="workout-card-specs">
            <span>⏱ ${meta.duration}</span>
            <span>📶 ${meta.difficulty}</span>
          </div>
          <button class="workout-card-btn" data-letter="${day.letter}" aria-label="Start workout">
            ▶ Start
          </button>
        </div>
      </div>
    `;
  }).join("");
  
  // Add card selection and action click handlers
  container.querySelectorAll(".workout-card").forEach(card => {
    const letter = card.dataset.letter;
    
    // Card click (selects workout, updating details panel below)
    card.addEventListener("click", (e) => {
      // Prevent selecting when clicking buttons inside card
      if (e.target.closest(".workout-card-fav-btn") || e.target.closest(".workout-card-btn")) return;
      
      currentActiveDayLetter = letter;
      container.querySelectorAll(".workout-card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      renderActiveDayDetails();
    });
    
    // Favorite toggle click
    card.querySelector(".workout-card-fav-btn").addEventListener("click", () => {
      toggleFavorite(letter);
    });
    
    // Start button click
    card.querySelector(".workout-card-btn").addEventListener("click", () => {
      currentActiveDayLetter = letter;
      renderActiveDayDetails();
      startWorkoutSession();
    });
  });
}

function updateMuscleCompletion(day) {
  let latsSets = 0;
  let deltsSets = 0;
  let absSets = 0;
  
  // Define standard milestone totals for a fully complete workout session
  const latsMilestone = 12;
  const deltsMilestone = 12;
  const absMilestone = 8;
  
  day.exercises.forEach(ex => {
    const sets = parseInt(ex.sets) || 0;
    const nameLower = ex.name.toLowerCase();
    const tagLower = ex.tag.toLowerCase();
    
    // Check if Wide Back (Lats/Teres)
    if (tagLower === "width" || tagLower === "back" || nameLower.includes("pull") || nameLower.includes("row") || nameLower.includes("pullover")) {
      latsSets += sets;
    }
    
    // Check if Deltoids (Shoulders)
    if (tagLower === "rear delt" || tagLower === "shoulder" || nameLower.includes("lateral") || nameLower.includes("shoulder") || nameLower.includes("military") || nameLower.includes("press") || nameLower.includes("face pull") || nameLower.includes("shrug")) {
      if (!nameLower.includes("bench") && !nameLower.includes("chest") && !nameLower.includes("dip")) {
        deltsSets += sets;
      }
    }
    
    // Check if Abs
    if (tagLower === "abs" || tagLower === "core" || nameLower.includes("crunch") || nameLower.includes("raise") || nameLower.includes("rollout") || nameLower.includes("pallof") || nameLower.includes("plank") || nameLower.includes("sit-up") || nameLower.includes("woodchop") || nameLower.includes("carry")) {
      if (!nameLower.includes("lateral")) {
        absSets += sets;
      }
    }
  });
  
  const latsPct = Math.min(100, Math.round((latsSets / latsMilestone) * 100));
  const deltsPct = Math.min(100, Math.round((deltsSets / deltsMilestone) * 100));
  const absPct = Math.min(100, Math.round((absSets / absMilestone) * 100));
  
  const valLats = document.getElementById("val-lats");
  const fillLats = document.getElementById("fill-lats");
  const valDelts = document.getElementById("val-delts");
  const fillDelts = document.getElementById("fill-delts");
  const valAbs = document.getElementById("val-abs");
  const fillAbs = document.getElementById("fill-abs");
  
  if (valLats && fillLats) {
    valLats.textContent = `${latsPct}% (${latsSets} sets)`;
    fillLats.style.width = `${latsPct}%`;
  }
  if (valDelts && fillDelts) {
    valDelts.textContent = `${deltsPct}% (${deltsSets} sets)`;
    fillDelts.style.width = `${deltsPct}%`;
  }
  if (valAbs && fillAbs) {
    valAbs.textContent = `${absPct}% (${absSets} sets)`;
    fillAbs.style.width = `${absPct}%`;
  }
}

function renderActiveDayDetails() {
  const day = program.find(d => d.letter === currentActiveDayLetter) || program[0];
  if (!day) return;
  
  updateMuscleCompletion(day);
  
  if (elements.detailsHeaderCopy) {
    elements.detailsHeaderCopy.innerHTML = `
      <h3>${day.day} - ${day.title}</h3>
      <p>Target Goal: ${day.intent}</p>
    `;
  }
  
  if (elements.exercisesList) {
    elements.exercisesList.innerHTML = day.exercises
      .map((ex, index) => `
        <div class="exercise-item">
          <div class="exercise-item-left">
            <span class="exercise-num">${String(index + 1).padStart(2, "0")}</span>
            <div class="exercise-info">
              <h4>${ex.name}</h4>
              <p>${ex.cue}</p>
              <div class="exercise-alternatives" style="margin-top: 8px; font-size: 12px; color: var(--text-dim);">
                <strong style="color: var(--gym-antigravity-orange); font-weight: 600;">⟲ Alternatives:</strong> 
                <span>${ex.alternatives ? ex.alternatives.join(" • ") : "None"}</span>
                <div style="margin-top: 6px;">
                  <a href="https://www.google.com/search?q=${encodeURIComponent(ex.name + ' exercise form tutorial')}" target="_blank" style="color: var(--color-cyan); text-decoration: none; display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; background: rgba(0, 229, 229, 0.1); border-radius: 4px;">
                    🔍 Search Form Guide
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div class="exercise-item-right">
            <div class="exercise-specs">
              <div class="spec-badge">
                <span>Sets</span>
                <strong>${ex.sets}</strong>
              </div>
              <div class="spec-badge">
                <span>Reps</span>
                <strong>${ex.reps}</strong>
              </div>
              <div class="spec-badge">
                <span>Rest</span>
                <strong>${ex.rest}</strong>
              </div>
            </div>
            <span class="exercise-tag-badge">${ex.tag}</span>
          </div>
        </div>
      `).join("");
  }
}

// ==========================================
// INTERACTIVE WORKOUT SESSION ENGINE
// ==========================================

function startWorkoutSession() {
  if (!currentUser) {
    currentUser = { uid: "local-user-gym-antigravity", email: "athlete@gym-antigravity.com", displayName: "Athlete" };
  }

  const day = program.find(d => d.letter === currentActiveDayLetter) || program[0];
  if (!day) return;
  
  // Set up active session state variables
  activeSessionData = {
    dayLetter: day.letter,
    dayTitle: day.title,
    accent: day.accent,
    startTime: new Date(),
    exercises: day.exercises.map(ex => ({
      name: ex.name,
      setsPrescribed: parseInt(ex.sets),
      repsPrescribed: ex.reps,
      restPrescribed: ex.rest,
      cue: ex.cue,
      tag: ex.tag,
      alternatives: ex.alternatives || [],
      sets: Array.from({ length: parseInt(ex.sets) }, (_, i) => ({
        setNum: i + 1,
        weight: "",
        reps: "",
        rpe: "",
        completed: false
      }))
    })),
    currentExerciseIdx: 0
  };
  
  // Launch Session Overlay
  if (elements.workoutSessionOverlay) {
    elements.workoutSessionOverlay.classList.add("active");
  }
  
  // Render Session UI Elements
  if (elements.sessionDayTitle) {
    elements.sessionDayTitle.textContent = `${day.day} Session - ${day.title}`;
  }
  
  // Start HUD Timer clock
  startSessionClock();
  
  // Render active exercise logger
  renderActiveExerciseSession();
}

function closeWorkoutSession() {
  if (confirm("Are you sure you want to exit? Your active session progress will be lost.")) {
    // Stop session clocks
    if (sessionTimerInterval) clearInterval(sessionTimerInterval);
    if (restTimerInterval) clearInterval(restTimerInterval);
    
    // Close Session Overlay
    if (elements.workoutSessionOverlay) {
      elements.workoutSessionOverlay.classList.remove("active");
    }
    
    // Clean state
    activeSessionData = null;
    showToast("Session cancelled.");
  }
}

function startSessionClock() {
  let totalSec = 0;
  if (sessionTimerInterval) clearInterval(sessionTimerInterval);
  
  sessionTimerInterval = setInterval(() => {
    totalSec++;
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    if (elements.sessionTimer) {
      elements.sessionTimer.textContent = `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    }
  }, 1000);
}

function updateWizardProgress() {
  const session = activeSessionData;
  if (!session) return;
  
  const total = session.exercises.length;
  const current = session.currentExerciseIdx;
  const percent = Math.round((current / total) * 100);
  
  const fill = document.getElementById("wizard-progress-fill");
  const stepInfo = document.getElementById("wizard-step-info");
  const percentInfo = document.getElementById("wizard-percent-info");
  
  if (fill) fill.style.width = `${percent}%`;
  if (stepInfo) stepInfo.textContent = `Exercise ${current + 1} of ${total}`;
  if (percentInfo) percentInfo.textContent = `${percent}% Completed`;
}

function renderActiveExerciseSession() {
  const session = activeSessionData;
  const ex = session.exercises[session.currentExerciseIdx];
  if (!ex) return;
  
  // Update titles
  if (elements.activeExerciseTitle) elements.activeExerciseTitle.textContent = ex.name;
  if (elements.activeExerciseCue) elements.activeExerciseCue.textContent = ex.cue;
  
  // Update Alternatives Quick Tabs
  if (elements.alternativesQuickTabs && ex.alternatives) {
    elements.alternativesQuickTabs.innerHTML = ex.alternatives.map((alt, idx) => `
      <button class="nav-session-btn alt-swap-btn" data-idx="${idx}" style="height: 30px; font-size: 11px; padding: 0 12px; background: rgba(0, 229, 229, 0.05); border-color: rgba(0, 229, 229, 0.2); border-radius: 50px; color: var(--color-cyan);">
        ${alt}
      </button>
    `).join("");
    
    elements.alternativesQuickTabs.querySelectorAll(".alt-swap-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.idx);
        const oldName = ex.name;
        ex.name = ex.alternatives[idx];
        ex.alternatives[idx] = oldName;
        renderActiveExerciseSession();
      });
    });
  }
  
  // Update Google Search URL
  if (elements.btnSearchForm) {
    const query = encodeURIComponent(`${ex.name} exercise form tutorial`);
    elements.btnSearchForm.href = `https://www.google.com/search?q=${query}`;
  }
  
  // Load exercise demonstration GIF
  loadExerciseGif(ex);
  
  // Render interactive log table
  renderActiveSetsLogger(ex);
  
  // Update navigator button states
  if (elements.btnPrevExercise) elements.btnPrevExercise.disabled = session.currentExerciseIdx === 0;
  if (elements.btnNextExercise) {
    if (session.currentExerciseIdx === session.exercises.length - 1) {
      elements.btnNextExercise.style.display = "none";
      elements.btnFinishSession.style.display = "block";
    } else {
      elements.btnNextExercise.style.display = "block";
      elements.btnFinishSession.style.display = "none";
    }
  }
  
  updateWizardProgress();
}

function loadExerciseGif(ex) {
  const frame = elements.activeExerciseGifFrame;
  if (!frame) return;
  
  // Trigger CSS neon pulse animation on frame content
  frame.classList.remove("transitioning");
  void frame.offsetWidth; // force reflow
  frame.classList.add("transitioning");

  // Handle both string fallback or exercise object
  const name = typeof ex === "string" ? ex : ex.name;
  const tag = ex.tag || "KEY";
  const normName = name.toLowerCase().trim();
  
  // Determine Theme Color based on Tag
  let themeColor = "var(--gym-antigravity-orange)";
  if (["WIDTH", "BACK", "BICEPS"].includes(tag)) themeColor = "var(--color-cyan)";
  else if (["LEGS", "SHOULDER", "REAR DELT", "TRAPS"].includes(tag)) themeColor = "var(--color-violet)";
  else if (["ABS", "CORE", "LOW BACK"].includes(tag)) themeColor = "var(--color-lime)";

  // Build the gorgeous glass overlay HUD
  const overlayHtml = `
    <div class="gif-overlay-info" style="--theme-accent: ${themeColor};">
      <span class="gif-overlay-tag">${tag} TARGET</span>
      <span class="gif-overlay-title">${name}</span>
    </div>
  `;
  
  // 1. Map to high-fidelity premium local graphics
  const localMappings = {
    // Chest / Presses
    "barbell bench press": "assets/bench_press.png",
    "dumbbell bench press": "assets/bench_press.png",
    "incline dumbbell press": "assets/bench_press.png",
    "cable chest fly": "assets/bench_press.png",
    "weighted dips": "assets/bench_press.png",
    "decline bench press": "assets/bench_press.png",
    "pec deck fly": "assets/bench_press.png",
    "incline cable fly": "assets/bench_press.png",
    "close-grip bench press": "assets/bench_press.png",
    
    // Pull / Hinge
    "deadlift": "assets/deadlift.png",
    "romanian deadlift": "assets/deadlift.png",
    "45-degree back extension": "assets/deadlift.png",
    "good morning": "assets/deadlift.png",
    "heavy barbell shrug": "assets/deadlift.png",
    
    // Legs / Squats
    "front squat": "assets/squat.png",
    "back squat": "assets/squat.png",
    "leg press": "assets/squat.png",
    "standing calf raise": "assets/squat.png",
    "lying leg curl": "assets/squat.png",
    
    // Back Width / Pulldowns
    "wide-grip lat pulldown": "assets/lat_pulldown.png",
    "pull-up": "assets/lat_pulldown.png",
    "t-bar row": "assets/lat_pulldown.png",
    "chest-supported row": "assets/lat_pulldown.png",
    "straight-arm pulldown": "assets/lat_pulldown.png",
    "single-arm cable row": "assets/lat_pulldown.png",
    "dumbbell pullover": "assets/lat_pulldown.png"
  };

  const localAsset = localMappings[normName];
  if (localAsset) {
    frame.innerHTML = `
      <img src="${localAsset}?t=${Date.now()}" alt="${name} demonstration graphic" class="premium-neon-media" />
      ${overlayHtml}
    `;
    return;
  }

  // Helper for generating dynamic SVG
  const generateDynamicSVG = () => {
    // Determine raw hex color based on themeColor string for SVG embedding
    let hexColor = "#ff6b00"; // orange
    if (themeColor.includes("cyan")) hexColor = "#00e5e5";
    if (themeColor.includes("violet")) hexColor = "#b25cff";
    if (themeColor.includes("lime")) hexColor = "#92f00a";

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" style="width:100%; height:100%; display:block; background:#08080c; font-family:'Outfit', sans-serif;">
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
          </pattern>
          <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        <!-- Background -->
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        <!-- Radar Circles -->
        <circle cx="200" cy="125" r="90" fill="none" stroke="${hexColor}" stroke-opacity="0.08" stroke-dasharray="5 5" />
        <circle cx="200" cy="125" r="70" fill="none" stroke="${hexColor}" stroke-opacity="0.15" stroke-width="1.5">
          <animate attributeName="r" values="60;80;60" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="200" cy="125" r="40" fill="none" stroke="${hexColor}" stroke-opacity="0.3" stroke-width="2" filter="url(#neon-glow)">
          <animate attributeName="stroke-dashoffset" values="0;251" dur="8s" repeatCount="indefinite" />
        </circle>
        
        <!-- Center Emblem -->
        <g filter="url(#neon-glow)" opacity="0.85">
          <rect x="195" y="105" width="10" height="40" rx="3" fill="${hexColor}" />
          <rect x="180" y="120" width="40" height="10" rx="3" fill="${hexColor}" />
          <circle cx="180" cy="125" r="8" fill="${hexColor}" />
          <circle cx="220" cy="125" r="8" fill="${hexColor}" />
        </g>
        
        <!-- Typography -->
        <text x="200" y="65" text-anchor="middle" font-size="11" font-weight="800" fill="${hexColor}" letter-spacing="3" opacity="0.9" style="text-transform: uppercase;">
          ${tag} PROTOCOL
        </text>
        <text x="200" y="195" text-anchor="middle" font-size="11" font-weight="500" fill="#8e8e9c" letter-spacing="1">
          ANALYSIS ACTIVE
        </text>
      </svg>
    `;
  };

  // 2. Map other exercises to free public-domain database on GitHub
  const gitMappings = {
    // Shoulders
    "seated dumbbell shoulder press": "Dumbbell_Shoulder_Press",
    "cable lateral raise": "Cable_Lateral_Raise",
    "face pull": "Face_Pull",
    "arnold press": "Arnold_Press",
    "machine lateral raise": "Machine_Lateral_Raise",
    "reverse pec deck": "Rear_Delt_Fly",
    
    // Arms
    "overhead cable triceps extension": "Cable_Tricep_Extension",
    "rope triceps pushdown": "Triceps_Pushdown",
    "ez-bar curl": "EZ-Bar_Curl",
    "incline dumbbell curl": "Incline_Dumbbell_Curl",
    "preacher curl": "Preacher_Curl",
    "hammer curl": "Hammer_Curls",
    "ez-bar skull crusher": "EZ-Bar_Skullcrusher",
    
    // Abs / Core
    "hanging leg raise": "Hanging_Leg_Raise",
    "cable crunch": "Cable_Crunches",
    "pallof press": "Pallof_Press",
    "ab wheel rollout": "Ab_Wheel_Rollout",
    "weighted plank": "Plank",
    "decline sit-up": "Decline_Sit-up",
    "cable woodchop": "Cable_Woodchop",
    "farmer's carry": "Farmers_Walk",
    "bird dog": "Bird_Dog"
  };

  const gitFolder = gitMappings[normName];
  if (gitFolder) {
    const gitUrl = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${gitFolder}/0.jpg`;
    
    frame.innerHTML = `
      <img src="${gitUrl}?t=${Date.now()}" alt="${name} demonstration" style="width:100%; height:100%; object-fit:cover; filter: brightness(0.85) contrast(1.15);" />
      ${overlayHtml}
    `;
    
    const imgEl = frame.querySelector("img");
    imgEl.onerror = function() {
      // Gracefully inject dynamic SVG fallback on image 404
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = generateDynamicSVG();
      this.replaceWith(tempDiv.firstElementChild);
    };
    return;
  }

  // 3. Complete Fallback (dynamic tech SVG)
  frame.innerHTML = `
    ${generateDynamicSVG()}
    ${overlayHtml}
  `;
}

async function getLastLogForExercise(exerciseName) {
  if (!currentUser) return null;
  try {
    const history = await db.getWorkoutsHistory(currentUser.uid);
    if (!history || history.length === 0) return null;
    const nameLower = exerciseName.toLowerCase();
    for (const session of history) {
      if (!session.logs) continue;
      const found = session.logs.find(log => log.name.toLowerCase() === nameLower);
      if (found) return found;
    }
  } catch (error) {
    console.warn("getLastLogForExercise failed:", error);
  }
  return null;
}

function renderActiveSetsLogger(exercise) {
  if (!elements.setsLoggerTable) return;
  
  elements.setsLoggerTable.innerHTML = exercise.sets
    .map(set => {
      const isDone = set.completed;
      return `
        <div class="set-row ${isDone ? "completed" : ""}" data-set="${set.setNum}">
          <div class="set-num">
            <span>Set ${set.setNum}</span>
            <span class="set-overload-tip" data-set="${set.setNum}"></span>
          </div>
          
          <div class="set-input-group">
            <label>Weight (kg)</label>
            <input type="number" class="set-input weight-input" value="${set.weight}" placeholder="0" ${isDone ? "disabled" : ""} />
          </div>
          
          <div class="set-input-group">
            <label>Reps</label>
            <input type="number" class="set-input reps-input" value="${set.reps}" placeholder="${exercise.repsPrescribed}" ${isDone ? "disabled" : ""} />
          </div>
          
          <div class="set-input-group">
            <label>RPE (1-10)</label>
            <input type="number" class="set-input rpe-input" value="${set.rpe}" min="1" max="10" placeholder="8" ${isDone ? "disabled" : ""} />
          </div>
          
          <button class="set-checkbox" data-set="${set.setNum}">
            ${isDone ? "✓ Done" : "Log"}
          </button>
        </div>
      `;
    }).join("");
    
  // Fetch overload advice from history
  getLastLogForExercise(exercise.name).then(lastLog => {
    if (!lastLog || !lastLog.sets) return;
    
    const repsRange = exercise.repsPrescribed.split("-");
    const minReps = parseInt(repsRange[0]) || 8;
    const maxReps = parseInt(repsRange[1] || repsRange[0]) || 12;
    const isLower = ["squat", "deadlift", "calf", "leg", "rdl"].some(part => exercise.name.toLowerCase().includes(part));
    const increment = isLower ? 5 : 2.5;

    exercise.sets.forEach(set => {
      const lastSet = lastLog.sets.find(s => s.setNum === set.setNum);
      if (!lastSet) return;
      
      const row = elements.setsLoggerTable.querySelector(`.set-row[data-set="${set.setNum}"]`);
      if (!row) return;
      
      const tipElement = row.querySelector(".set-overload-tip");
      const weightInput = row.querySelector(".weight-input");
      const repsInput = row.querySelector(".reps-input");
      
      // Determine targets
      let targetWeight, targetReps;
      if (lastSet.reps >= maxReps) {
        targetWeight = lastSet.weight + increment;
        targetReps = minReps;
      } else {
        targetWeight = lastSet.weight;
        targetReps = maxReps;
      }
      
      // Set the tip
      if (tipElement) {
        tipElement.textContent = `🎯 ${targetWeight}kg x ${targetReps}`;
        tipElement.style.display = "block";
      }
      
      // Smart helper: if inputs are empty and set is not logged, pre-fill them
      if (!weightInput.value && !set.completed) {
        weightInput.value = targetWeight;
        set.weight = targetWeight;
      }
      if (!repsInput.value && !set.completed) {
        repsInput.value = targetReps;
        set.reps = targetReps;
      }
    });
  });

  // Add logger listeners
  elements.setsLoggerTable.querySelectorAll(".set-row").forEach(row => {
    const setNum = parseInt(row.dataset.set);
    const setObj = exercise.sets.find(s => s.setNum === setNum);
    
    const weightInput = row.querySelector(".weight-input");
    const repsInput = row.querySelector(".reps-input");
    const rpeInput = row.querySelector(".rpe-input");
    const logBtn = row.querySelector(".set-checkbox");
    
    // Save values on input change
    const updateValues = () => {
      setObj.weight = weightInput.value.trim();
      setObj.reps = repsInput.value.trim();
      setObj.rpe = rpeInput.value.trim();
    };
    
    weightInput.addEventListener("input", updateValues);
    repsInput.addEventListener("input", updateValues);
    rpeInput.addEventListener("input", updateValues);
    
    logBtn.addEventListener("click", () => {
      if (setObj.completed) {
        // Toggle undone
        setObj.completed = false;
        row.classList.remove("completed");
        weightInput.disabled = false;
        repsInput.disabled = false;
        rpeInput.disabled = false;
        logBtn.textContent = "Log";
      } else {
        // Validate inputs
        if (!weightInput.value || !repsInput.value) {
          showToast("Please log weight and reps first.");
          return;
        }
        
        updateValues();
        setObj.completed = true;
        row.classList.add("completed");
        weightInput.disabled = true;
        repsInput.disabled = true;
        rpeInput.disabled = true;
        logBtn.textContent = "✓ Done";
        
        // Trigger Circular Rest Timer!
        const restVal = exercise.restPrescribed || "90s";
        const seconds = parseInt(restVal.replace("s", "")) || 90;
        triggerRestTimer(seconds);
        
        // AUTO-FOCUS next set
        const nextSetNum = setNum + 1;
        const nextRow = elements.setsLoggerTable.querySelector(`.set-row[data-set="${nextSetNum}"]`);
        if (nextRow) {
          const nextWeightInput = nextRow.querySelector(".weight-input");
          if (nextWeightInput) {
            nextWeightInput.focus();
            nextWeightInput.select();
          }
        }
      }
    });
  });
}

function navigateExercise(direction) {
  const session = activeSessionData;
  const targetIdx = session.currentExerciseIdx + direction;
  
  if (targetIdx >= 0 && targetIdx < session.exercises.length) {
    session.currentExerciseIdx = targetIdx;
    renderActiveExerciseSession();
  }
}

// ==========================================
// REST TIMER CORE CONTROLS
// ==========================================

function triggerRestTimer(seconds) {
  restTimerTotalSec = seconds;
  restTimerRemainingSec = seconds;
  restTimerIsPaused = false;
  
  updateRestTimerUI();
  
  if (elements.timerProgressCircle) {
    elements.timerProgressCircle.style.strokeDashoffset = 0;
  }
  
  if (restTimerInterval) clearInterval(restTimerInterval);
  
  restTimerInterval = setInterval(() => {
    if (restTimerIsPaused) return;
    
    restTimerRemainingSec--;
    updateRestTimerUI();
    
    // Update SVG progress offset
    if (elements.timerProgressCircle) {
      const totalDash = 502; // 2 * pi * r (r=80)
      const ratio = restTimerRemainingSec / restTimerTotalSec;
      const offset = totalDash * (1 - ratio);
      elements.timerProgressCircle.style.strokeDashoffset = offset;
    }
    
    if (restTimerRemainingSec <= 0) {
      clearInterval(restTimerInterval);
      playTimerSynthTone();
      showToast("Rest over! Get to the next set.");
    }
  }, 1000);
}

function updateRestTimerUI() {
  if (elements.timerSeconds) {
    const min = Math.floor(restTimerRemainingSec / 60);
    const sec = restTimerRemainingSec % 60;
    elements.timerSeconds.textContent = `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  if (elements.btnPauseTimer) {
    elements.btnPauseTimer.innerHTML = restTimerIsPaused ? "▶" : "⏸";
  }
}

function togglePauseRestTimer() {
  restTimerIsPaused = !restTimerIsPaused;
  updateRestTimerUI();
}

function skipRestTimer() {
  if (restTimerInterval) clearInterval(restTimerInterval);
  restTimerRemainingSec = 0;
  updateRestTimerUI();
  if (elements.timerProgressCircle) {
    elements.timerProgressCircle.style.strokeDashoffset = 502;
  }
  showToast("Rest timer skipped.");
}

function add30sRestTimer() {
  restTimerRemainingSec += 30;
  restTimerTotalSec += 30;
  updateRestTimerUI();
}

// Advanced Web Audio API beep synthesizer
function playTimerSynthTone() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Create double beep
    const playBeep = (time, pitch) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(pitch, time);
      gain.gain.setValueAtTime(0.08, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
      osc.start(time);
      osc.stop(time + 0.25);
    };

    playBeep(ctx.currentTime, 880);
    playBeep(ctx.currentTime + 0.35, 880);
  } catch (e) {
    console.warn("Audio synthesizer failed", e);
  }
}

// ==========================================
// SESSION COMPLETION & DATABASE SAVE
// ==========================================

async function finishWorkoutSession() {
  const session = activeSessionData;
  if (!session) return;
  
  // Stop session clocks
  if (sessionTimerInterval) clearInterval(sessionTimerInterval);
  if (restTimerInterval) clearInterval(restTimerInterval);
  
  const endTime = new Date();
  
  // Calculate total volume lifted and metrics
  let totalVolume = 0;
  let totalSetsCompleted = 0;
  const filteredExercises = [];
  
  session.exercises.forEach(ex => {
    const completedSets = ex.sets.filter(s => s.completed);
    if (completedSets.length > 0) {
      totalSetsCompleted += completedSets.length;
      completedSets.forEach(s => {
        const w = parseFloat(s.weight) || 0;
        const r = parseInt(s.reps) || 0;
        totalVolume += (w * r);
      });
      
      filteredExercises.push({
        name: ex.name,
        setsPrescribed: ex.setsPrescribed,
        repsPrescribed: ex.repsPrescribed,
        sets: completedSets.map(s => ({
          setNum: s.setNum,
          weight: parseFloat(s.weight),
          reps: parseInt(s.reps),
          rpe: parseInt(s.rpe) || 8
        }))
      });
    }
  });

  if (filteredExercises.length === 0) {
    showToast("Cannot log an empty session. Log at least one set.");
    return;
  }

  // Construct Workout History entry
  const durationMin = Math.max(1, Math.round((endTime - session.startTime) / 60000));
  const workoutEntry = {
    dayLetter: session.dayLetter,
    dayTitle: session.dayTitle,
    startTime: session.startTime,
    endTime: endTime,
    durationMinutes: durationMin,
    totalVolumeKg: Math.round(totalVolume),
    totalSets: totalSetsCompleted,
    logs: filteredExercises
  };

  showToast("Saving session as Gym - Antigravity...");

  try {
    // 1. Write to Firestore history collection
    await db.saveWorkoutSession(currentUser.uid, workoutEntry);
    
    // 2. Compute and Save Personal Records (PRs)
    for (const ex of filteredExercises) {
      const topSet = ex.sets.reduce((max, s) => s.weight > max.weight ? s : max, { weight: 0, reps: 0 });
      if (topSet.weight > 0) {
        const calculated1RM = Math.round(topSet.weight * (1 + topSet.reps / 30));
        const prPayload = {
          maxWeight: topSet.weight,
          maxReps: topSet.reps,
          calculated1RM: calculated1RM,
          achievedAt: new Date()
        };
        await db.savePersonalRecord(currentUser.uid, ex.name, prPayload);
      }
    }

    // 3. Move active day forward automatically
    const currentIdx = program.findIndex(d => d.letter === currentActiveDayLetter);
    const nextIdx = (currentIdx + 1) % program.length;
    const nextDayLetter = program[nextIdx].letter;
    currentActiveDayLetter = nextDayLetter;
    
    await db.saveUserProfile(currentUser.uid, { activeDay: nextDayLetter });
    
    showToast("Workout Logged! Day split advanced.");
    
    // Calculate streak and metrics for summary screen
    const history = await db.getWorkoutsHistory(currentUser.uid);
    const streak = calculateStreak(history);
    
    // Populate summary screen metrics
    const summaryTimeVal = document.getElementById("summary-time-val");
    const summaryVolumeVal = document.getElementById("summary-volume-val");
    const summarySetsVal = document.getElementById("summary-sets-val");
    const summaryStreakVal = document.getElementById("summary-streak-val");
    
    if (summaryTimeVal) summaryTimeVal.textContent = `${workoutEntry.durationMinutes}m`;
    if (summaryVolumeVal) summaryVolumeVal.textContent = `${workoutEntry.totalVolumeKg} kg`;
    if (summarySetsVal) summarySetsVal.textContent = `${workoutEntry.totalSets}`;
    if (summaryStreakVal) summaryStreakVal.textContent = `${streak} Day Streak!`;
    
    if (elements.workoutSummaryOverlay) {
      elements.workoutSummaryOverlay.classList.add("active");
    }
  } catch (error) {
    console.error("Failed to save session:", error);
    showToast("Failed to save workout session.");
  }
}

// ==========================================
// HISTORY LOG VIEW
// ==========================================

function setRingProgress(elementId, pct) {
  const circle = document.getElementById(elementId);
  if (circle) {
    const radius = 33;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (Math.min(pct, 100) / 100) * circumference;
    circle.style.strokeDasharray = `${circumference}`;
    circle.style.strokeDashoffset = offset;
  }
}

function calculateStreak(history) {
  if (!history || history.length === 0) return 0;
  
  const dates = history.map(h => {
    const d = h.startTime.toDate ? h.startTime.toDate() : new Date(h.startTime);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  });
  
  // Remove duplicates and sort descending
  const uniqueDates = [...new Set(dates)].sort((a,b) => b - a);
  
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const yesterdayMidnight = todayMidnight - 24 * 60 * 60 * 1000;
  
  if (uniqueDates[0] < yesterdayMidnight) {
    return 0; // Streak broken
  }
  
  let streak = 1;
  let current = uniqueDates[0];
  
  for (let i = 1; i < uniqueDates.length; i++) {
    const prev = uniqueDates[i];
    if (current - prev === 24 * 60 * 60 * 1000) {
      streak++;
      current = prev;
    } else if (current - prev > 24 * 60 * 60 * 1000) {
      break;
    }
  }
  return streak;
}

async function refreshHistoryDashboard() {
  if (!currentUser) return;
  
  try {
    const list = await db.getWorkoutsHistory(currentUser.uid);
    if (!list) return;
    
    // Render Stats Badges
    if (elements.totalWorkoutsStat) elements.totalWorkoutsStat.textContent = list.length;
    setRingProgress("workouts-ring-progress", (list.length / 30) * 100);
    
    let vol = 0;
    list.forEach(entry => vol += (entry.totalVolumeKg || 0));
    if (elements.totalVolumeStat) {
      elements.totalVolumeStat.textContent = vol >= 1000 ? `${(vol/1000).toFixed(1)}k` : vol;
    }
    setRingProgress("volume-ring-progress", (vol / 50000) * 100);
    
    if (elements.completionRateStat) {
      const completions = list.length;
      elements.completionRateStat.textContent = completions;
      setRingProgress("progression-ring-progress", (completions / 12) * 100);
    }
    
    // Update Header Badges
    const streak = calculateStreak(list);
    const streakCountEl = document.getElementById("nav-streak-count");
    const completedCountEl = document.getElementById("nav-completed-count");
    if (streakCountEl) streakCountEl.textContent = streak;
    if (completedCountEl) completedCountEl.textContent = list.length;
    
    // Render history feed list
    if (elements.historyList) {
      if (list.length === 0) {
        elements.historyList.innerHTML = `
          <div style="text-align: center; color: var(--text-dim); padding: 24px;">No logged sessions yet. Press 'Start Session'!</div>
        `;
        return;
      }
      
      elements.historyList.innerHTML = list.map(item => {
        const dateStr = item.startTime.toDate ? item.startTime.toDate().toLocaleDateString() : new Date(item.startTime).toLocaleDateString();
        
        let colorClass = "orange";
        if (item.dayLetter === "B" || item.dayLetter === "E") colorClass = "cyan";
        if (item.dayLetter === "C" || item.dayLetter === "F") colorClass = "violet";
        
        return `
          <div class="history-item ${colorClass}">
            <div class="history-item-header">
              <h4><span>Day ${item.dayLetter}</span> ${item.dayTitle}</h4>
              <div class="history-date">${dateStr}</div>
            </div>
            <div class="history-summary-specs">
              <span>Duration: <strong>${item.durationMinutes} mins</strong></span>
              <span>Volume: <strong>${item.totalVolumeKg} kg</strong></span>
              <span>Sets: <strong>${item.totalSets} logged</strong></span>
            </div>
          </div>
        `;
      }).join("");
    }
  } catch (error) {
    console.warn("Failed to load historical analytics", error);
  }
}

function resetStatsDashboard() {
  if (elements.totalWorkoutsStat) elements.totalWorkoutsStat.textContent = "0";
  if (elements.totalVolumeStat) elements.totalVolumeStat.textContent = "0";
  if (elements.completionRateStat) elements.completionRateStat.textContent = "0";
  setRingProgress("workouts-ring-progress", 0);
  setRingProgress("volume-ring-progress", 0);
  setRingProgress("progression-ring-progress", 0);
  
  if (elements.historyList) {
    elements.historyList.innerHTML = `
      <div style="text-align: center; color: var(--text-dim); padding: 24px;">Please log in to view workout history metrics.</div>
    `;
  }
}

// ==========================================
// PROGRESSIVE OVERLOAD ADVISOR WIDGET
// ==========================================

async function refreshOverloadAdvisor() {
  if (!currentUser || !elements.advisorList) return;
  
  try {
    const history = await db.getWorkoutsHistory(currentUser.uid);
    const prs = await db.getPersonalRecords(currentUser.uid);
    
    if (history.length === 0) {
      elements.advisorList.innerHTML = `
        <div style="text-align: center; color: var(--text-dim); padding: 12px; font-size: 12px;">Log your first workout to enable the Advisor.</div>
      `;
      return;
    }

    // Examine latest logged workout logs
    const latestWorkout = history[0];
    const suggestions = [];

    latestWorkout.logs.forEach(exLog => {
      const topSet = exLog.sets.reduce((max, s) => s.reps > max.reps ? s : max, { reps: 0 });
      const currentPr = prs[exLog.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")];
      const maxPrWeight = currentPr ? currentPr.maxWeight : topSet.weight;
      
      // Smart algorithm logic: If all sets achieved peak completed reps
      // (e.g. 5-8 reps prescribed, and they achieved 8 reps on ALL sets)
      const repsRange = exLog.repsPrescribed.split("-");
      const targetMaxReps = parseInt(repsRange[1] || repsRange[0]) || 8;
      
      const allSetsHitMax = exLog.sets.every(s => s.reps >= targetMaxReps);
      
      if (allSetsHitMax) {
        const isLower = [" squat", "deadlift", "calf raise", "leg press", "rdl"].some(part => exLog.name.toLowerCase().includes(part));
        const increment = isLower ? "5.0 kg" : "2.5 kg";
        
        suggestions.push({
          name: exLog.name,
          achieved: true,
          text: `All sets achieved target **${targetMaxReps} reps**. Incremented overload triggered! Increase by **+${increment}** next time.`
        });
      } else {
        suggestions.push({
          name: exLog.name,
          achieved: false,
          text: `Highest set logged was **${topSet.weight} kg x ${topSet.reps} reps**. Continue training until all sets hit **${targetMaxReps} reps** with clean form.`
        });
      }
    });

    if (suggestions.length === 0) {
      elements.advisorList.innerHTML = `
        <div style="text-align: center; color: var(--text-dim); padding: 12px; font-size: 12px;">No overload recommendations calculated.</div>
      `;
      return;
    }

    // Render Recommendations List
    elements.advisorList.innerHTML = suggestions.slice(0, 3).map(item => `
      <div class="advisor-item ${item.achieved ? "achieved" : ""}">
        <div class="advisor-item-header">
          <h4>${item.name}</h4>
          <span class="advisor-status ${item.achieved ? "ready" : "neutral"}">
            ${item.achieved ? "OVERLOAD READY" : "IN PROGRESS"}
          </span>
        </div>
        <p class="advisor-suggestion">${formatMarkdown(item.text)}</p>
      </div>
    `).join("");

  } catch (error) {
    console.warn("Overload Advisor calculations failed", error);
  }
}

// Simple bold parsing helper for HTML text injection
function formatMarkdown(text) {
  return text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
}

// ==========================================
// DYNAMIC FIREBASE SETTINGS PANEL
// ==========================================

function openSettingsPanel() {
  if (elements.settingsPanel && elements.settingsOverlay) {
    elements.settingsPanel.classList.add("active");
    elements.settingsOverlay.classList.add("active");
  }
}

function closeSettingsPanel() {
  if (elements.settingsPanel && elements.settingsOverlay) {
    elements.settingsPanel.classList.remove("active");
    elements.settingsOverlay.classList.remove("active");
  }
}

function loadSavedConfigInTextarea() {
  if (!elements.firebaseConfigTextarea) return;
  const config = getSavedFirebaseConfig();
  if (config) {
    elements.firebaseConfigTextarea.value = JSON.stringify(config, null, 2);
  } else {
    elements.firebaseConfigTextarea.value = `{\n  "apiKey": "PASTE_YOUR_FIREBASE_API_KEY",\n  "authDomain": "PROJECT_ID.firebaseapp.com",\n  "projectId": "PROJECT_ID",\n  "storageBucket": "PROJECT_ID.appspot.com",\n  "messagingSenderId": "SENDER_ID",\n  "appId": "APP_ID"\n}`;
  }
}

function saveCustomFirebase() {
  const text = elements.firebaseConfigTextarea?.value.trim();
  if (!text) {
    showToast("Paste a valid JSON Firebase Web config.");
    return;
  }
  
  try {
    const config = JSON.parse(text);
    if (!config.apiKey || !config.projectId) {
      showToast("Config must contain 'apiKey' and 'projectId'.");
      return;
    }
    
    saveFirebaseConfig(config);
    showToast("Firebase Config saved! Reloading to sync...");
    closeSettingsPanel();
    
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  } catch (e) {
    showToast("Failed to parse JSON. Please review the formatting.");
  }
}

function clearCustomFirebase() {
  clearFirebaseConfig();
  showToast("Custom database keys cleared! Reverted to Mock offline mode. Reloading...");
  closeSettingsPanel();
  
  setTimeout(() => {
    window.location.reload();
  }, 1500);
}

// ==========================================
// PWA SERVICE WORKER REGISTRATION
// ==========================================
let deferredPrompt = null;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
        // Force update check
        registration.update();
      })
      .catch(err => {
        console.log('ServiceWorker registration failed: ', err);
      });
  });
}

// Custom PWA installation prompt event listener
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault();
  // Stash the event so it can be triggered later.
  deferredPrompt = e;
  // Show the install button in navigation header
  const installBtn = document.getElementById("pwa-install-btn");
  if (installBtn) {
    installBtn.style.display = "inline-flex";
  }
});

// PWA install handler registered inside initializeGymApp

window.addEventListener('appinstalled', (evt) => {
  console.log('Gym - Antigravity app was successfully installed!');
  const installBtn = document.getElementById("pwa-install-btn");
  if (installBtn) {
    installBtn.style.display = "none";
  }
});

function toggleAppTheme() {
  const isLight = document.body.classList.toggle("light-theme");
  localStorage.setItem("gym-antigravity_theme", isLight ? "light" : "dark");
  if (elements.btnThemeToggle) {
    elements.btnThemeToggle.textContent = isLight ? "🌙" : "☀️";
  }
}

})();
