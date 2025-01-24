const { initializeApp } = require('firebase/app');
const { getStorage } = require('firebase/storage');

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
const storage = getStorage(app);

module.exports = { storage }; 