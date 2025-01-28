require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { initDatabase, User, Announcement, Quiz, QuizSubmission, Material } = require('./database');
const seedUsers = require('./seedUsers');
const { ref, uploadBytes, getDownloadURL, listAll } = require('firebase/storage');
const { storage } = require('./firebase');

const app = express();

// Update CORS configuration
const corsOptions = {
    origin: ['https://p22095.netlify.app', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Remove the old headers middleware and replace with this:
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, Accept');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    next();
});

// Δημιουργία του uploads directory
const uploadsDir = process.env.NODE_ENV === 'production'
  ? path.join('/tmp', 'uploads')
  : path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Προσθήκη του static middleware ΠΡΙΝ από τα routes
app.use('/files', express.static(uploadsDir));
app.use(express.json());

// Update the DATA_FILE path to be relative to the project root
const DATA_FILE = process.env.NODE_ENV === 'production'
  ? path.join(process.cwd(), 'data', 'data.json')
  : path.join(__dirname, 'data', 'data.json');

// Create data directory if it doesn't exist
const dataDir = path.dirname(DATA_FILE);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('Created data directory:', dataDir);
}

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    const initialData = {
        materials: [],
        users: [],
        announcements: [],
        grades: [],
        quizzes: [],
        quizSubmissions: []
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
    console.log('Created initial data file:', DATA_FILE);
}

// Αρχικοποίηση μεταβλητών
let users = [];
let announcements = [];
let tests = [];
let discussions = [];
let materials = [];
let grades = [];
let quizzes = [];
let quizSubmissions = [];

// Βελτιωμένη συνάρτηση για αποθήκευση δεδομένων
const saveData = async () => {
    try {
        const data = {
            materials,
            users,
            announcements,
            grades,
            quizzes,
            quizSubmissions
        };
        
        // Create backup of existing file
        if (fs.existsSync(DATA_FILE)) {
            const backupFile = `${DATA_FILE}.backup`;
            fs.copyFileSync(DATA_FILE, backupFile);
        }
        
        // Write new data
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        console.log('Data saved successfully. Current materials:', materials);
        
        // Verify the save
        const savedData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        if (savedData.materials.length !== materials.length) {
            throw new Error('Data verification failed');
        }
        
        return true;
    } catch (error) {
        console.error('Error saving data:', error);
        // Restore from backup if available
        const backupFile = `${DATA_FILE}.backup`;
        if (fs.existsSync(backupFile)) {
            fs.copyFileSync(backupFile, DATA_FILE);
        }
        throw error;
    }
};

// Βελτιωμένη συνάρτηση για φόρτωση δεδομένων
const loadData = () => {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            console.log('No data file exists, initializing empty data');
            return;
        }

        const fileContent = fs.readFileSync(DATA_FILE, 'utf8');
        if (!fileContent) {
            console.log('Data file is empty, initializing empty data');
            return;
        }

        const data = JSON.parse(fileContent);
        
        // Validate materials data
        if (Array.isArray(data.materials)) {
            materials = data.materials;
            console.log(`Loaded ${materials.length} materials from file`);
            materials.forEach((material, index) => {
                console.log(`Material ${index + 1}:`, {
                    filename: material.filename,
                    url: material.url,
                    uploadDate: material.uploadDate
                });
            });
        } else {
            console.warn('Invalid materials data in file, initializing empty array');
            materials = [];
        }
    } catch (error) {
        console.error('Error loading data:', error);
        materials = [];
    }
};

// Φόρτωση δεδομένων κατά την εκκίνηση
loadData();

// Αυτόματη αποθήκευση κάθε 5 λεπτά
setInterval(saveData, 5 * 60 * 1000);

// Αποθήκευση δεδομένων πριν τον τερματισμό
process.on('SIGINT', () => {
    console.log('Saving data before exit...');
    saveData();
    process.exit();
});

process.on('SIGTERM', () => {
    console.log('Saving data before exit...');
    saveData();
    process.exit();
});

// Ρύθμιση του multer για αποθήκευση αρχείων
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Διαδρομή για την αποθήκευση των αρχείων
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Δεν βρέθηκε αρχείο' });
        }

        console.log('Starting file upload to Firebase...');
        
        const fileExtension = path.extname(req.file.originalname);
        const timestamp = Date.now();
        const filename = `uploads/${timestamp}${fileExtension}`;
        
        const storageRef = ref(storage, filename);
        const snapshot = await uploadBytes(storageRef, req.file.buffer);
        const downloadURL = await getDownloadURL(snapshot.ref);

        const fileData = {
            filename: filename,
            originalname: req.file.originalname,
            size: req.file.size,
            uploadDate: new Date().toISOString(),
            url: downloadURL,
            contentType: req.file.mimetype
        };

        // Add to materials array
        materials.push(fileData);
        
        // Save data and verify
        await saveData();
        
        // Load data to verify it was saved
        loadData();
        
        console.log('File uploaded and saved. Current materials:', materials);
        res.json(fileData);
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed', details: error.message });
    }
});

// Update the files endpoint to properly fetch from Firebase
app.get('/api/files', async (req, res) => {
    try {
        console.log('Fetching files from Firebase...');
        
        // Create reference to uploads folder
        const storageRef = ref(storage, 'uploads');
        
        try {
            // List all files in uploads folder
            const listResult = await listAll(storageRef);
            console.log('Found files:', listResult.items.length);
            
            // Get details for each file
            const filesPromises = listResult.items.map(async (itemRef) => {
                try {
                    const url = await getDownloadURL(itemRef);
                    const filename = itemRef.name;
                    const originalname = filename.split('/').pop(); // Remove path
                    
                    return {
                        filename,
                        originalname,
                        url,
                        uploadDate: new Date().toISOString(),
                        contentType: 'application/octet-stream'
                    };
                } catch (error) {
                    console.error(`Error getting details for file ${itemRef.name}:`, error);
                    return null;
                }
            });

            // Wait for all file details
            const files = (await Promise.all(filesPromises)).filter(file => file !== null);
            console.log('Processed files:', files);
            
            res.json(files);
        } catch (listError) {
            console.error('Error listing files:', listError);
            // If the folder doesn't exist yet, return empty array
            if (listError.code === 'storage/object-not-found') {
                return res.json([]);
            }
            throw listError;
        }
    } catch (error) {
        console.error('Error in /api/files:', error);
        res.status(500).json({ 
            error: 'Error fetching files',
            details: error.message 
        });
    }
});

// Authentication routes
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log('Login attempt for username:', username);
        
        // Find user in database
        const user = await User.findOne({ 
            where: { username },
            raw: true // Get plain object
        });
        
        if (!user) {
            console.log('User not found:', username);
            return res.status(401).json({ error: 'Λάθος στοιχεία σύνδεσης' });
        }

        console.log('User found:', { ...user, password: '[HIDDEN]' });

        // Compare password
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            console.log('Invalid password for user:', username);
            return res.status(401).json({ error: 'Λάθος στοιχεία σύνδεσης' });
        }

        // Remove password from response
        const userResponse = { ...user };
        delete userResponse.password;
        
        console.log('Login successful for user:', username);
        res.json({ user: userResponse });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            error: 'Σφάλμα κατά τη σύνδεση',
            details: error.message 
        });
    }
});

// Signup route
app.post('/api/signup', async (req, res) => {
    try {
        const { username, password, role } = req.body;

        // Έλεγχος αν υπάρχει ήδη ο χρήστης
        const existingUser = await User.findOne({ 
            where: { username } 
        });

        if (existingUser) {
            return res.status(400).json({ error: 'Το username χρησιμοποιείται ήδη' });
        }

        // Κρυπτογράφηση του password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Δημιουργία νέου χρήστη
        const user = await User.create({
            username,
            password: hashedPassword,
            role
        });

        // Αφαιρούμε το password πριν στείλουμε την απάντηση
        const userResponse = user.toJSON();
        delete userResponse.password;

        res.status(201).json({ user: userResponse });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Σφάλμα κατά την εγγραφή' });
    }
});

// Announcements routes
app.post('/api/announcements', async (req, res) => {
    try {
        const announcement = await Announcement.create({
            title: req.body.title,
            content: req.body.content,
            createdBy: req.body.createdBy
        });
        res.json(announcement);
    } catch (error) {
        console.error('Error creating announcement:', error);
        res.status(500).json({ error: 'Σφάλμα κατά τη δημιουργία της ανακοίνωσης' });
    }
});

app.get('/api/announcements', async (req, res) => {
    try {
        const announcements = await Announcement.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.json(announcements);
    } catch (error) {
        console.error('Error fetching announcements:', error);
        res.status(500).json({ error: 'Σφάλμα κατά την ανάκτηση των ανακοινώσεων' });
    }
});

// Tests routes
app.post('/api/tests', (req, res) => {
    const { title, questions, author } = req.body;
    const newTest = {
        id: tests.length + 1,
        title,
        questions,
        author,
        date: new Date().toISOString()
    };
    tests.push(newTest);
    res.json(newTest);
});

app.get('/api/tests', (req, res) => {
    res.json(tests);
});

// Discussions routes
app.post('/api/discussions', (req, res) => {
    const { text, author } = req.body;
    const newDiscussion = {
        id: discussions.length + 1,
        text,
        author,
        date: new Date().toISOString()
    };
    discussions.push(newDiscussion);
    res.json(newDiscussion);
});

app.get('/api/discussions', (req, res) => {
    res.json(discussions);
});

// Διαγραφή αρχείου
app.delete('/api/files/:filename', async (req, res) => {
    try {
        const filename = req.params.filename;
        
        // Delete from Firebase Storage
        const fileRef = ref(storage, `files/${filename}`);
        await deleteObject(fileRef);
        
        // Remove from materials array
        const index = materials.findIndex(m => m.filename === filename);
        if (index !== -1) {
            materials.splice(index, 1);
            saveData();
        }
        
        res.json({ message: 'Το αρχείο διαγράφηκε επιτυχώς' });
    } catch (error) {
        console.error('File deletion error:', error);
        res.status(500).json({ error: 'Σφάλμα κατά τη διαγραφή του αρχείου' });
    }
});

// Διαγραφή ανακοίνωσης
app.delete('/api/announcements/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        console.log('Attempting to delete announcement with id:', id);
        console.log('Current announcements:', announcements);
        
        const index = announcements.findIndex(a => a.id === id);
        
        if (index === -1) {
            console.log('Announcement not found');
            return res.status(404).json({ error: 'Η ανακοίνωση δεν βρέθηκε' });
        }
        
        const deletedAnnouncement = announcements.splice(index, 1)[0];
        console.log('Deleted announcement:', deletedAnnouncement);
        console.log('Remaining announcements:', announcements);
        saveData(); // Προσθήκη αποθήκευσης
        
        res.json({ 
            message: 'Η ανακοίνωση διαγράφηκε επιτυχώς',
            deletedAnnouncement 
        });
    } catch (error) {
        console.error('Error deleting announcement:', error);
        res.status(500).json({ 
            error: 'Σφάλμα κατά τη διαγραφή της ανακοίνωσης',
            details: error.message 
        });
    }
});

// Προσθέστε ένα route για να ελέγξετε αν το αρχείο υπάρχει
app.get('/api/files/:filename', (req, res) => {
  const filePath = path.join(uploadsDir, req.params.filename);
  
  if (fs.existsSync(filePath)) {
    res.json({ exists: true });
  } else {
    res.status(404).json({ exists: false });
  }
});

// Προσθήκη ενός route για να ελέγξουμε αν το αρχείο υπάρχει
app.get('/api/files/:filename/check', (req, res) => {
    const filePath = path.join(uploadsDir, req.params.filename);
    console.log('Checking file:', filePath);
    
    if (fs.existsSync(filePath)) {
        res.json({ exists: true, path: filePath });
    } else {
        res.status(404).json({ exists: false, path: filePath });
    }
});

// Προσθέστε τα νέα routes για τους βαθμούς
app.post('/api/grades', async (req, res) => {
    try {
        const { studentId, subject, score, submittedBy } = req.body;
        const newGrade = {
            id: Date.now(),
            studentId,
            subject,
            score,
            submittedBy,
            submittedAt: new Date().toISOString()
        };
        
        grades.push(newGrade);
        await saveData();
        
        res.json(newGrade);
    } catch (error) {
        console.error('Error submitting grade:', error);
        res.status(500).json({ error: 'Σφάλμα κατά την καταχώρηση του βαθμού' });
    }
});

// Get όλων των βαθμών ενός μαθητή
app.get('/api/grades/student/:studentId', async (req, res) => {
    try {
        const studentGrades = grades.filter(grade => 
            grade.studentId === parseInt(req.params.studentId)
        );
        res.json(studentGrades);
    } catch (error) {
        console.error('Error fetching student grades:', error);
        res.status(500).json({ error: 'Σφάλμα κατά την ανάκτηση των βαθμών του μαθητή' });
    }
});

// Update the students endpoint
app.get('/api/students', async (req, res) => {
    try {
        console.log('Fetching students from database...');
        
        // Get all users from the database with role 'student'
        const students = await User.findAll({
            where: { role: 'student' },
            attributes: ['id', 'username'],
            raw: true
        });

        console.log('Found students:', students);
        
        if (!students || students.length === 0) {
            console.log('No students found in database');
        }

        res.json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ 
            error: 'Σφάλμα κατά την ανάκτηση μαθητών',
            details: error.message 
        });
    }
});

// Προσθέστε τα νέα routes για τα quiz
app.post('/api/quizzes', (req, res) => {
    try {
        const { title, questions, instructor, dueDate } = req.body;
        
        // Validation
        if (!title || !questions || !instructor || !Array.isArray(questions)) {
            return res.status(400).json({ error: 'Λείπουν απαραίτητα πεδία' });
        }

        if (questions.length === 0) {
            return res.status(400).json({ error: 'Το quiz πρέπει να έχει τουλάχιστον μία ερώτηση' });
        }

        const newQuiz = {
            id: Date.now(),
            title,
            questions,
            instructor,
            dueDate,
            createdAt: new Date().toISOString(),
            isActive: true
        };

        quizzes.push(newQuiz);
        saveData();
        res.json(newQuiz);
    } catch (error) {
        console.error('Error creating quiz:', error);
        res.status(500).json({ error: 'Σφάλμα κατά τη δημιουργία του quiz' });
    }
});

// Get όλων των quiz
app.get('/api/quizzes', (req, res) => {
    try {
        res.json(quizzes);
    } catch (error) {
        console.error('Error fetching quizzes:', error);
        res.status(500).json({ error: 'Σφάλμα κατά την ανάκτηση των quiz' });
    }
});

// Get ενός συγκεκριμένου quiz
app.get('/api/quizzes/:id', (req, res) => {
    try {
        const quiz = quizzes.find(q => q.id === parseInt(req.params.id));
        if (!quiz) {
            return res.status(404).json({ error: 'Το quiz δεν βρέθηκε' });
        }
        res.json(quiz);
    } catch (error) {
        console.error('Error fetching quiz:', error);
        res.status(500).json({ error: 'Σφάλμα κατά την ανάκτηση του quiz' });
    }
});

// Υποβολή απαντήσεων quiz
app.post('/api/quiz-submissions', (req, res) => {
    try {
        const { quizId, studentId, answers } = req.body;
        
        const quiz = quizzes.find(q => q.id === quizId);
        if (!quiz) {
            return res.status(404).json({ error: 'Το quiz δεν βρέθηκε' });
        }

        // Έλεγχος αν έχει ήδη υποβληθεί
        const existingSubmission = quizSubmissions.find(
            s => s.quizId === quizId && s.studentId === studentId
        );
        if (existingSubmission) {
            return res.status(400).json({ error: 'Έχετε ήδη υποβάλει απαντήσεις για αυτό το quiz' });
        }

        // Υπολογισμός βαθμολογίας
        let score = 0;
        const gradedAnswers = answers.map((answer, index) => {
            const isCorrect = answer === quiz.questions[index].correctAnswer;
            if (isCorrect) score++;
            return { ...answer, isCorrect };
        });

        const submission = {
            id: Date.now(),
            quizId,
            studentId,
            answers: gradedAnswers,
            score,
            maxScore: quiz.questions.length,
            submittedAt: new Date().toISOString()
        };

        quizSubmissions.push(submission);
        saveData();
        res.json(submission);
    } catch (error) {
        console.error('Error submitting quiz:', error);
        res.status(500).json({ error: 'Σφάλμα κατά την υποβολή του quiz' });
    }
});

// Get υποβολών ενός μαθητή
app.get('/api/quiz-submissions/student/:studentId', (req, res) => {
    try {
        const submissions = quizSubmissions.filter(
            s => s.studentId === parseInt(req.params.studentId)
        );
        res.json(submissions);
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ error: 'Σφάλμα κατά την ανάκτηση των υποβολών' });
    }
});

// Get υποβολών ενός quiz
app.get('/api/quiz-submissions/quiz/:quizId', (req, res) => {
    try {
        const submissions = quizSubmissions.filter(
            s => s.quizId === parseInt(req.params.quizId)
        );
        res.json(submissions);
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ error: 'Σφάλμα κατά την ανάκτηση των υποβολών' });
    }
});

// Χειρισμός σφαλμάτων
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Κάτι πήγε στραβά!' });
});

// Μετακινήστε το γενικό error handler στο τέλος του αρχείου
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Κάτι πήγε στραβά!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Add this route to test Firebase connection
app.get('/api/test-firebase', async (req, res) => {
    try {
        const testRef = ref(storage, 'test.txt');
        const testBuffer = Buffer.from('test');
        await uploadBytes(testRef, testBuffer);
        const url = await getDownloadURL(testRef);
        res.json({ status: 'success', url });
    } catch (error) {
        console.error('Firebase test error:', error);
        res.status(500).json({ 
            error: 'Firebase test failed',
            details: error.message
        });
    }
});

// Update the grades endpoint to include CORS headers
app.get('/api/grades', async (req, res) => {
    try {
        // Add CORS headers explicitly
        res.header('Access-Control-Allow-Origin', 'https://p22095.netlify.app');
        res.header('Access-Control-Allow-Credentials', 'true');
        
        console.log('Fetching grades...');
        res.json(grades);
    } catch (error) {
        console.error('Error fetching grades:', error);
        res.status(500).json({ error: 'Σφάλμα κατά την ανάκτηση των βαθμών' });
    }
});

const PORT = process.env.PORT || 5001;
(async () => {
    try {
        // Initialize database
        await initDatabase();
        console.log('Database initialized');

        // Seed users
        await seedUsers();
        console.log('Users seeded');

        // Verify users in database
        const users = await User.findAll({ raw: true });
        console.log('Current users in database:', users.map(u => ({ 
            id: u.id, 
            username: u.username, 
            role: u.role 
        })));

        // Start server
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to initialize server:', error);
    }
})(); 