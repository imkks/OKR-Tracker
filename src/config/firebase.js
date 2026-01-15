import { initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';


const firebaseConfig = {
  apiKey: "AIzaSyAEMCiEaPWNBFeZ97r8XzjgBdFMVWyUOCw",
  authDomain: "syncservice-a0f44.firebaseapp.com",
  projectId: "syncservice-a0f44",
  storageBucket: "syncservice-a0f44.appspot.com",
  messagingSenderId: "838303340274",
  appId: "1:838303340274:web:e2940f689e07034a30e26b",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

// Helper: Log in
export const loginWithGoogle = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error("Login failed", error);
  }
};
export const registerWithEmail = async (email, password, name) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Set the display name immediately after registration
    if (name) {
      await updateProfile(userCredential.user, { displayName: name });
    }
    return userCredential.user;
  } catch (error) {
    console.error("Registration failed", error);
    throw error; // Rethrow so UI can show toast
  }
};

export const loginWithEmail = async (email, password) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error("Login failed", error);
    throw error;
  }
};

// export const logoutUser = async () => {
//   await signOut(auth);
//   window.location.reload();
// };

// Helper: Log out
export const logoutUser = async () => {
  await signOut(auth);
  // Optional: Clear local storage on logout if you want privacy
  // localStorage.removeItem('okr_objectives'); 
  window.location.reload();
};