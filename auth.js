// DOM Elements cache for Auth overlay
let authContainer = null;
let authPanel = null;
let authHeaderTitle = null;
let authHeaderDesc = null;
let authEmailInput = null;
let authPasswordInput = null;
let authSubmitBtn = null;
let authSwitchSpan = null;
let userBadgeContainer = null;

let isSignUpMode = false;
let authSuccessCallback = null;

// Initialize elements once DOM is loaded
function initAuthUI(elementsMap, onAuthSuccess) {
  authContainer = elementsMap.authContainer;
  authPanel = elementsMap.authPanel;
  authHeaderTitle = elementsMap.authHeaderTitle;
  authHeaderDesc = elementsMap.authHeaderDesc;
  authEmailInput = elementsMap.authEmailInput;
  authPasswordInput = elementsMap.authPasswordInput;
  authSubmitBtn = elementsMap.authSubmitBtn;
  authSwitchSpan = elementsMap.authSwitchSpan;
  userBadgeContainer = elementsMap.userBadge;
  authSuccessCallback = onAuthSuccess;

  // Add event listeners
  if (authSwitchSpan) {
    authSwitchSpan.addEventListener("click", toggleAuthMode);
  }
  
  if (authSubmitBtn) {
    authSubmitBtn.addEventListener("click", handleAuthSubmit);
  }

  // Subscribe to Authentication state change
  window.auth.onAuthStateChanged((user) => {
    updateAuthUI(user);
    if (authSuccessCallback) {
      authSuccessCallback(user || { uid: "local-user-gym-antigravity", email: "athlete@gym-antigravity.com", displayName: "Athlete" });
    }
  });
}

function showAuthPanel() {
  if (authContainer) {
    authContainer.classList.add("active");
    authEmailInput?.focus();
  }
}

function hideAuthPanel() {
  if (authContainer) {
    authContainer.classList.remove("active");
  }
}

function toggleAuthMode() {
  // No-op for local-only Gym - Antigravity
}

async function handleAuthSubmit(e) {
  e.preventDefault();
}

function handleAuthError(error) {
  // No-op
}

function setLoadingState(isLoading) {
  // No-op
}

async function handleSignOut() {
  // No-op
}

// Update the Top Navigation user badge based on login state
function updateAuthUI(user) {
  // No-op - Navigation displays local stats directly
}

// Toast notification helper
function showToast(message) {
  let toast = document.getElementById("gym-antigravity-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "gym-antigravity-toast";
    toast.className = "toast-msg";
    document.body.appendChild(toast);
  }

  toast.innerHTML = `
    <span class="toast-icon">⚡</span>
    <span>${message}</span>
  `;
  
  toast.classList.add("active");
  
  setTimeout(() => {
    toast.classList.remove("active");
  }, 3500);
}

window.initAuthUI = initAuthUI;
window.showAuthPanel = showAuthPanel;
window.hideAuthPanel = hideAuthPanel;
window.handleSignOut = handleSignOut;
window.showToast = showToast;
