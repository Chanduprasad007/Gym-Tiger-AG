// Gym - Antigravity Firebase Configuration & Initialization Module
// Supports dynamic client-side Firebase configuration and high-fidelity mock fallbacks for offline demo mode.

// Firebase imports removed to support 100% offline local-only operation.

// Retrieve saved Firebase Web Configuration from localStorage
const STORAGE_KEY = "gym-antigravity_firebase_config";
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

// Force LocalStorage mock mode for frictionless access
isRealFirebase = false;

// ==========================================
// HIGH-FIDELITY MOCK FALLBACK IMPLEMENTATION
// ==========================================

const mockState = {
  currentUser: { uid: "local-user-gym-antigravity", email: "athlete@gym-antigravity.com", displayName: "Athlete" },
  authListeners: new Set(),
  workoutsHistory: JSON.parse(localStorage.getItem("gym-antigravity_mock_history") || "[]"),
  personalRecords: JSON.parse(localStorage.getItem("gym-antigravity_mock_prs") || "{}"),
  userPreferences: JSON.parse(localStorage.getItem("gym-antigravity_mock_prefs") || '{"activeDay": "A"}')
};

const mockAuth = {
  signInWithEmailAndPassword: async (email, password) => {
    // Basic validation
    if (!email.includes("@") || password.length < 6) {
      throw new Error("auth/invalid-login-credentials");
    }
    const mockUser = { uid: "mock-uid-gym-antigravity", email, displayName: email.split("@")[0] };
    mockState.currentUser = mockUser;
    triggerAuthChange(mockUser);
    return { user: mockUser };
  },
  createUserWithEmailAndPassword: async (email, password) => {
    if (!email.includes("@") || password.length < 6) {
      throw new Error("auth/weak-password");
    }
    const mockUser = { uid: "mock-uid-gym-antigravity", email, displayName: email.split("@")[0] };
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
      localStorage.setItem("gym-antigravity_mock_prefs", JSON.stringify(mockState.userPreferences));
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
    // Save to local storage cache immediately so the user doesn't lose anything
    const localCacheKey = `gym-antigravity_history_cache_${uid}`;
    let cachedHistory = [];
    try {
      cachedHistory = JSON.parse(localStorage.getItem(localCacheKey) || "[]");
    } catch (e) {}
    
    // Check if duplicate
    const timestampId = workoutSession.startTime instanceof Date ? workoutSession.startTime.getTime() : new Date(workoutSession.startTime).getTime();
    const sessionWithId = { id: `session-${timestampId}`, ...workoutSession };
    
    cachedHistory.unshift(sessionWithId);
    localStorage.setItem(localCacheKey, JSON.stringify(cachedHistory));

    if (isRealFirebase) {
      try {
        const ref = collection(firebaseDb, "users", uid, "workouts_history");
        await addDoc(ref, workoutSession);
        console.log("Gym - Antigravity: Workout session saved to Firestore.");
      } catch (error) {
        console.warn("Gym - Antigravity: Network error, queuing workout for background sync.", error);
        // Add to offline sync queue
        let queue = [];
        try {
          queue = JSON.parse(localStorage.getItem(`gym-antigravity_sync_queue_${uid}`) || "[]");
        } catch (e) {}
        queue.push(workoutSession);
        localStorage.setItem(`gym-antigravity_sync_queue_${uid}`, JSON.stringify(queue));
      }
    } else {
      mockState.workoutsHistory.unshift(sessionWithId);
      localStorage.setItem("gym-antigravity_mock_history", JSON.stringify(mockState.workoutsHistory));
    }
  },

  // Fetch completed workouts history
  getWorkoutsHistory: async (uid) => {
    // Load local cache first so it renders instantly
    const localCacheKey = `gym-antigravity_history_cache_${uid}`;
    let cachedHistory = [];
    try {
      cachedHistory = JSON.parse(localStorage.getItem(localCacheKey) || "[]");
    } catch (e) {}
    
    if (isRealFirebase) {
      try {
        const ref = collection(firebaseDb, "users", uid, "workouts_history");
        const q = query(ref, orderBy("startTime", "desc"));
        const snap = await getDocs(q);
        const list = [];
        snap.forEach(d => {
          list.push({ id: d.id, ...d.data() });
        });
        
        // Update local cache with fresh data from Firestore
        localStorage.setItem(localCacheKey, JSON.stringify(list));
        return list;
      } catch (error) {
        console.warn("Gym - Antigravity: Failed to fetch from Firestore, serving cached history", error);
        return cachedHistory;
      }
    } else {
      return mockState.workoutsHistory.length > 0 ? mockState.workoutsHistory : cachedHistory;
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
      localStorage.setItem("gym-antigravity_mock_prs", JSON.stringify(mockState.personalRecords));
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
  localStorage.removeItem("gym-antigravity_mock_history");
  localStorage.removeItem("gym-antigravity_mock_prs");
  localStorage.removeItem("gym-antigravity_mock_prefs");
}

export function getSavedFirebaseConfig() {
  return savedConfig;
}

// Synchronize offline queued workouts to Firestore when online
export async function syncOfflineQueue(uid) {
  if (!isRealFirebase || !navigator.onLine) return;
  const queueKey = `gym-antigravity_sync_queue_${uid}`;
  let queue = [];
  try {
    queue = JSON.parse(localStorage.getItem(queueKey) || "[]");
  } catch (e) {}
  
  if (queue.length === 0) return;
  
  console.log(`Gym - Antigravity: Attempting to sync ${queue.length} offline workouts...`);
  const ref = collection(firebaseDb, "users", uid, "workouts_history");
  
  const failedToSync = [];
  for (const session of queue) {
    try {
      await addDoc(ref, session);
    } catch (err) {
      failedToSync.push(session);
    }
  }
  
  if (failedToSync.length === 0) {
    localStorage.removeItem(queueKey);
    console.log("Gym - Antigravity: All offline workouts synchronized successfully.");
  } else {
    localStorage.setItem(queueKey, JSON.stringify(failedToSync));
  }
}

// Exports unified API
export const auth = isRealFirebase ? firebaseAuth : mockAuth;
export const isMockMode = !isRealFirebase;
export const db = dbOperations;
export const realAuthMethods = {
  signInWithEmailAndPassword: async () => { throw new Error("Firebase disabled"); },
  createUserWithEmailAndPassword: async () => { throw new Error("Firebase disabled"); },
  signOut: async () => {},
  onAuthStateChanged: (callback) => { callback(mockState.currentUser); return () => {}; }
};
export const realFirestoreMethods = {
  doc: () => {}, setDoc: () => {}, getDoc: () => {}, collection: () => {}, addDoc: () => {}, query: () => {}, orderBy: () => {}, getDocs: () => {}
};
export { firebaseDb, firebaseAuth };
