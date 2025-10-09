import { initializeApp } from 'firebase/app'
import { getStorage } from 'firebase/storage'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyABsInQ1dLpNHhSbfujle09zAlIfmLU2oY",
  authDomain: "eagleeye-e16e7.firebaseapp.com",
  projectId: "eagleeye-e16e7",
  storageBucket: "eagleeye-e16e7.firebasestorage.app",
  messagingSenderId: "374602045793",
  appId: "1:374602045793:web:bd7981807e56b8ab24cd20",
  measurementId: "G-4TCRKLSG7K"
};

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)