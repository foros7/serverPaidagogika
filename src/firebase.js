import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyCX78GmGuiVPvvV1FFQgeKZedJ0_xm8v1I",
    authDomain: "p22095-ergasia.firebaseapp.com",
    projectId: "p22095-ergasia",
    storageBucket: "p22095-ergasia.appspot.com",
    messagingSenderId: "497319914024",
    appId: "1:497319914024:web:916eb6123b1cb4d016631d",
    measurementId: "G-4C0GYEL0BR"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app); 