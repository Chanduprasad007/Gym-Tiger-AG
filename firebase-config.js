// Gym Tiger Firebase Configuration & Initialization Module
// Supports dynamic client-side Firebase configuration and high-fidelity mock fallbacks for offline demo mode.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  getDocs 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Retrieve saved Firebase Web Configuration from localStorage
const STORAGE_KEY = "gym_tiger_firebase_config";
let savedConfig = null;

try {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    savedConfig = JSON.parse(raw);
  }
} catch (e) {
  console.warn("Could not read saved Firebase config from localStorage", e);
}

let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;
let isRealFirebase = false;

if (savedConfig && savedConfig.apiKey && savedConfig.projectId) {
  try {
    firebaseApp = initializeApp(savedConfig);
    firebaseAuth = getAuth(firebaseApp);
    firebaseDb = getFirestore(firebaseApp);
    isRealFirebase = true;
    console.log("Gym Tiger: Connected to user's custom Firebase Project: " + savedConfig.projectId);
  } catch (error) {
    console.error("Gym Tiger: Failed to initialize Firebase with user's config. Falling back to Mock mode.", error);
  }
}

// ==========================================
// HIGH-FIDELITY MOCK FALLBACK IMPLEMENTATION
// ==========================================

const mockState = {
  currentUser: null,
  authListeners: new Set(),
  workoutsHistory: JSON.parse(localStorage.getItem("gym_tiger_mock_history") || "[]"),
  personalRecords: JSON.parse(localStorage.getItem("gym_tiger_mock_prs") || "{}"),
  userPreferences: JSON.parse(localStorage.getItem("gym_tiger_mock_prefs") || '{"activeDay": "A"}')
};

const mockAuth = {
  signInWithEmailAndPassword: async (email, password) => {
    // Basic validation
    if (!email.includes("@") || password.length < 6) {
      throw new Error("auth/invalid-login-credentials");
    }
    const mockUser = { uid: "mock-uid-tiger", email, displayName: email.split("@")[0] };
    mockState.currentUser = mockUser;
    triggerAuthChange(mockUser);
    return { user: mockUser };
  },
  createUserWithEmailAndPassword: async (email, password) => {
    if (!email.includes("@") || password.length < 6) {
      throw new Error("auth/weak-password");
    }
    const mockUser = { uid: "mock-uid-tiger", email, displayName: email.split("@")[0] };
    mockState.currentUser = mockUser;
    triggerAuthChange(mockUser);
    return { user: mockUser };
  },
  signOut: async () => {
    mockState.currentUser = null;
    triggerAuthChange(null);
  },
  onAuthStateChanged: (callback) => {
    mockState.authListeners.add(callback);
    // Fire initially
    callback(mockState.currentUser);
    return () => {
      mockState.authListeners.delete(callback);
    };
  }
};

function triggerAuthChange(user) {
  mockState.authListeners.forEach(cb => {
    try { cb(user); } catch (e) {}
  });
}

// Database helper functions that transparently handle both Firestore and LocalStorage
const dbOperations = {
  // Save user profile data
  saveUserProfile: async (uid, data) => {
    if (isRealFirebase) {
      await setDoc(doc(firebaseDb, "users", uid), data, { merge: true });
    } else {
      mockState.userPreferences = { ...mockState.userPreferences, ...data };
      localStorage.setItem("gym_tiger_mock_prefs", JSON.stringify(mockState.userPreferences));
    }
  },

  // Get user profile data
  getUserProfile: async (uid) => {
    if (isRealFirebase) {
      const snap = await getDoc(doc(firebaseDb, "users", uid));
      return snap.exists() ? snap.data() : { activeDay: "A" };
    } else {
      return mockState.userPreferences;
    }
  },

  // Save completed workout session
  saveWorkoutSession: async (uid, workoutSession) => {
    if (isRealFirebase) {
      const ref = collection(firebaseDb, "users", uid, "workouts_history");
      await addDoc(ref, workoutSession);
    } else {
      const session = { id: "mock-session-" + Date.now(), ...workoutSession };
      mockState.workoutsHistory.unshift(session);
      localStorage.setItem("gym_tiger_mock_history", JSON.stringify(mockState.workoutsHistory));
    }
  },

  // Fetch completed workouts history
  getWorkoutsHistory: async (uid) => {
    if (isRealFirebase) {
      const ref = collection(firebaseDb, "users", uid, "workouts_history");
      const q = query(ref, orderBy("startTime", "desc"));
      const snap = await getDocs(q);
      const list = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() });
      });
      return list;
    } else {
      return mockState.workoutsHistory;
    }
  },

  // Save personal record
  savePersonalRecord: async (uid, exerciseName, prData) => {
    if (isRealFirebase) {
      const ref = doc(firebaseDb, "users", uid, "personal_records", exerciseName.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
      await setDoc(ref, prData, { merge: true });
    } else {
      const key = exerciseName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      mockState.personalRecords[key] = prData;
      localStorage.setItem("gym_tiger_mock_prs", JSON.stringify(mockState.personalRecords));
    }
  },

  // Fetch personal records
  getPersonalRecords: async (uid) => {
    if (isRealFirebase) {
      const ref = collection(firebaseDb, "users", uid, "personal_records");
      const snap = await getDocs(ref);
      const prs = {};
      snap.forEach(d => {
        prs[d.id] = d.data();
      });
      return prs;
    } else {
      return mockState.personalRecords;
    }
  }
};

// Functions to manage Firebase configuration directly from UI
export function saveFirebaseConfig(config) {
  if (!config || !config.apiKey || !config.projectId) {
    throw new Error("Invalid configuration object. Must contain apiKey and projectId.");
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function clearFirebaseConfig() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem("gym_tiger_mock_history");
  localStorage.removeItem("gym_tiger_mock_prs");
  localStorage.removeItem("gym_tiger_mock_prefs");
}

export function getSavedFirebaseConfig() {
  return savedConfig;
}

// Exports unified API
export const auth = isRealFirebase ? firebaseAuth : mockAuth;
export const isMockMode = !isRealFirebase;
export const db = dbOperations;
export const realAuthMethods = {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
};
export const realFirestoreMethods = {
  doc, setDoc, getDoc, collection, addDoc, query, orderBy, getDocs
};
export { firebaseDb, firebaseAuth };
