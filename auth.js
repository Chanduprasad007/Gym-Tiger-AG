// Gym Tiger Authentication Controller Module
import { auth, db, isMockMode } from "./firebase-config.js";

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
export function initAuthUI(elementsMap, onAuthSuccess) {
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
  auth.onAuthStateChanged((user) => {
    updateAuthUI(user);
    if (user && authSuccessCallback) {
      authSuccessCallback(user);
    }
  });
}

export function showAuthPanel() {
  if (authContainer) {
    authContainer.classList.add("active");
    authEmailInput?.focus();
  }
}

export function hideAuthPanel() {
  if (authContainer) {
    authContainer.classList.remove("active");
  }
}

function toggleAuthMode() {
  isSignUpMode = !isSignUpMode;
  if (isSignUpMode) {
    authHeaderTitle.textContent = "Create Account";
    authHeaderDesc.textContent = "Sign up to track and sync workouts to Cloud Firestore";
    authSubmitBtn.textContent = "Start Training As Tiger";
    authSwitchSpan.textContent = "Sign In instead";
  } else {
    authHeaderTitle.textContent = "Gym Tiger Sign In";
    authHeaderDesc.textContent = "Enter your email to resume your progression split";
    authSubmitBtn.textContent = "Launch Dashboard";
    authSwitchSpan.textContent = "Register here";
  }
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  
  const email = authEmailInput?.value.trim();
  const password = authPasswordInput?.value;

  if (!email || !password) {
    showToast("Please fill in all fields.");
    return;
  }

  if (password.length < 6) {
    showToast("Password must be at least 6 characters.");
    return;
  }

  setLoadingState(true);

  try {
    if (isSignUpMode) {
      await auth.createUserWithEmailAndPassword(email, password);
      showToast("Account created successfully!");
    } else {
      await auth.signInWithEmailAndPassword(email, password);
      showToast("Welcome back, Tiger!");
    }
    hideAuthPanel();
  } catch (error) {
    console.error("Auth error:", error);
    handleAuthError(error);
  } finally {
    setLoadingState(false);
  }
}

function handleAuthError(error) {
  let message = "Authentication failed.";
  if (error.code === "auth/invalid-login-credentials" || error.message.includes("credentials")) {
    message = "Invalid email or password.";
  } else if (error.code === "auth/email-already-in-use") {
    message = "This email is already registered.";
  } else if (error.code === "auth/weak-password") {
    message = "Password is too weak.";
  } else if (error.code === "auth/invalid-email") {
    message = "Invalid email address format.";
  }
  showToast(message);
}

function setLoadingState(isLoading) {
  if (authSubmitBtn) {
    authSubmitBtn.disabled = isLoading;
    authSubmitBtn.textContent = isLoading ? "Authenticating..." : (isSignUpMode ? "Start Training As Tiger" : "Launch Dashboard");
  }
}

export async function handleSignOut() {
  try {
    await auth.signOut();
    showToast("Signed out successfully.");
    window.location.reload();
  } catch (e) {
    showToast("Failed to sign out.");
  }
}

// Update the Top Navigation user badge based on login state
function updateAuthUI(user) {
  if (userBadgeContainer) {
    if (user) {
      const email = user.email || "Tiger";
      const initial = email.charAt(0).toUpperCase();
      const cleanName = email.split("@")[0];
      
      userBadgeContainer.innerHTML = `
        <div class="user-badge" id="user-badge-details">
          <div class="user-avatar">${initial}</div>
          <span class="user-name">${cleanName}</span>
          <button class="nav-btn" style="padding: 4px 10px; font-size: 11px; margin-left: 8px;" id="btn-sign-out">Sign Out</button>
        </div>
      `;
      
      const signOutBtn = document.getElementById("btn-sign-out");
      if (signOutBtn) {
        signOutBtn.addEventListener("click", handleSignOut);
      }
      
      // If we are in mock mode, add a subtle banner to explain
      if (isMockMode) {
        const titleBadge = document.getElementById("user-badge-details");
        if (titleBadge) {
          const banner = document.createElement("span");
          banner.textContent = "Offline Demo Mode";
          banner.style.fontSize = "10px";
          banner.style.padding = "2px 8px";
          banner.style.background = "rgba(255, 107, 0, 0.1)";
          banner.style.color = "var(--tiger-orange)";
          banner.style.borderRadius = "4px";
          banner.style.marginLeft = "8px";
          banner.style.fontWeight = "800";
          titleBadge.insertBefore(banner, signOutBtn);
        }
      }
    } else {
      userBadgeContainer.innerHTML = `
        <button class="nav-btn primary" id="btn-login-trigger">Get Started</button>
      `;
      const triggerBtn = document.getElementById("btn-login-trigger");
      if (triggerBtn) {
        triggerBtn.addEventListener("click", showAuthPanel);
      }
    }
  }
}

// Toast notification helper
export function showToast(message) {
  let toast = document.getElementById("gym-tiger-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "gym-tiger-toast";
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
