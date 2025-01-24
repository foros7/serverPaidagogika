const { initializeApp } = require('firebase/app');
const { getStorage, connectStorageEmulator, ref, listAll } = require('firebase/storage');

const firebaseConfig = {
    apiKey: "AIzaSyCX78GmGuiVPvvV1FFQgeKZedJ0_xm8v1I",
    authDomain: "p22095-ergasia.firebaseapp.com",
    projectId: "p22095-ergasia",
    storageBucket: "gs://p22095-ergasia.firebasestorage.app",
    messagingSenderId: "497319914024",
    appId: "1:497319914024:web:916eb6123b1cb4d016631d",
    measurementId: "G-4C0GYEL0BR"
};

try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const storage = getStorage(app);

    // Test storage access with a specific path
    const storageRef = ref(storage, 'files/');
    listAll(storageRef).then((result) => {
        console.log('Storage access successful:', result);
    }).catch((error) => {
        console.error('Storage access error:', error);
    });

    // Log successful initialization
    console.log('Firebase Storage initialized successfully');

    module.exports = { storage };
} catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
} 