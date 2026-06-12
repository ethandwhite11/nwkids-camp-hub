import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyBhQ-5_SzyCaGQV5rgFv0Cmm2qhVgRpBxo",
  authDomain: "nwkids-camp-hub.firebaseapp.com",
  projectId: "nwkids-camp-hub",
  storageBucket: "nwkids-camp-hub.firebasestorage.app",
  messagingSenderId: "145606289751",
  appId: "1:145606289751:web:35af4c105f2e888bc5f612"
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
