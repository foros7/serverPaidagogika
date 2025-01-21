require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const app = express();

// Αφαιρέστε το παλιό CORS middleware και προσθέστε το νέο
app.use(cors({
  origin: 'https://p22095.netlify.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Προσθέστε τα headers σε κάθε response
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://p22095.netlify.app');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
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

// Αλλάξτε το DATA_FILE path για να χρησιμοποιεί μόνιμο φάκελο
const DATA_FILE = process.env.NODE_ENV === 'production'
  ? path.join('/data', 'data.json')
  : path.join(__dirname, 'data', 'data.json');

// Δημιουργία του data directory αν δεν υπάρχει
const dataDir = path.dirname(DATA_FILE);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
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
const saveData = () => {
    try {
        const data = {
            users,
            announcements,
            tests,
            discussions,
            materials,
            grades,
            quizzes,
            quizSubmissions
        };
        
        // Δημιουργία προσωρινού αρχείου
        const tempFile = `${DATA_FILE}.tmp`;
        fs.writeFileSync(tempFile, JSON.stringify(data, null, 2));
        
        // Μετονομασία του προσωρινού αρχείου στο τελικό
        fs.renameSync(tempFile, DATA_FILE);
        
        console.log('Data saved successfully');
    } catch (error) {
        console.error('Error saving data:', error);
        // Προσπάθεια επαναφοράς του προσωρινού αρχείου αν υπάρχει
        const tempFile = `${DATA_FILE}.tmp`;
        if (fs.existsSync(tempFile)) {
            try {
                fs.renameSync(tempFile, DATA_FILE);
            } catch (e) {
                console.error('Error recovering data file:', e);
            }
        }
    }
};

// Βελτιωμένη συνάρτηση για φόρτωση δεδομένων
const loadData = () => {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const fileData = fs.readFileSync(DATA_FILE, 'utf8');
            const data = JSON.parse(fileData);
            
            // Ενημέρωση των μεταβλητών με τα δεδομένα από το αρχείο
            users = data.users || [];
            announcements = data.announcements || [];
            tests = data.tests || [];
            discussions = data.discussions || [];
            materials = data.materials || [];
            grades = data.grades || [];
            quizzes = data.quizzes || [];
            quizSubmissions = data.quizSubmissions || [];
            
            console.log('Data loaded successfully');
        } else {
            // Δημιουργία του αρχείου με αρχικά δεδομένα αν δεν υπάρχει
            const initialData = {
                users,
                announcements,
                tests,
                discussions,
                materials,
                grades,
                quizzes,
                quizSubmissions
            };
            fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
            console.log('Initial data file created');
        }
    } catch (error) {
        console.error('Error loading data:', error);
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
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Προσθέτουμε timestamp για μοναδικά ονόματα
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // όριο 5MB
    }
});

// Διαδρομή για την αποθήκευση των αρχείων
app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Δεν βρέθηκε αρχείο' });
        }

        // Δημιουργία του URL με βάση το περιβάλλον
        const baseUrl = process.env.NODE_ENV === 'production'
            ? 'https://lms-backend-9r0g.onrender.com'
            : `http://localhost:${process.env.PORT || 5001}`;

        const fileData = {
            filename: req.file.filename,
            originalname: req.file.originalname,
            size: req.file.size,
            uploadDate: new Date().toISOString(),
            url: `${baseUrl}/files/${req.file.filename}`
        };

        // Προσθήκη στη λίστα materials
        materials.push(fileData);
        saveData(); // Προσθήκη αποθήκευσης

        console.log('File uploaded:', fileData);
        console.log('Upload directory:', uploadsDir);
        console.log('File path:', path.join(uploadsDir, req.file.filename));

        res.json(fileData);
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Σφάλμα κατά το ανέβασμα του αρχείου' });
    }
});

// Διαδρομή για την προβολή των αρχείων
app.get('/api/files', (req, res) => {
    res.json(materials);
});

// Authentication routes
app.post('/api/signup', async (req, res) => {
    try {
        console.log('Signup request received:', { ...req.body, password: '[HIDDEN]' });
        const { username, password, role } = req.body;
        
        // Βασικός έλεγχος
        if (!username || !password || !role) {
            return res.status(400).json({ error: 'Όλα τα πεδία είναι υποχρεωτικά' });
        }

        // Έλεγχος μήκους username
        if (username.length < 3 || username.length > 20) {
            return res.status(400).json({ error: 'Το username πρέπει να είναι μεταξύ 3 και 20 χαρακτήρες' });
        }

        // Έλεγχος για επιτρεπτούς χαρακτήρες στο username
        const usernameRegex = /^[a-zA-Z0-9\u0370-\u03FF\u1F00-\u1FFF]+$/;
        if (!usernameRegex.test(username)) {
            return res.status(400).json({ 
                error: 'Το username μπορεί να περιέχει μόνο γράμματα, αριθμούς και ελληνικούς χαρακτήρες' 
            });
        }

        // Έλεγχος για διπλότυπο username
        if (users.find(u => u.username === username)) {
            return res.status(400).json({ error: 'Το username υπάρχει ήδη' });
        }

        // Έλεγχος μήκους password
        if (password.length < 6) {
            return res.status(400).json({ error: 'Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες' });
        }

        // Δημιουργία νέου χρήστη
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            id: Date.now(),
            username,
            password: hashedPassword,
            role,
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        saveData();

        console.log('New user created:', { ...newUser, password: '[HIDDEN]' });
        
        // Αφαίρεση ευαίσθητων δεδομένων πριν την αποστολή
        const userResponse = { 
            id: newUser.id,
            username: newUser.username,
            role: newUser.role,
            createdAt: newUser.createdAt
        };
        
        res.json({ user: userResponse });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Σφάλμα κατά την εγγραφή' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = users.find(u => u.username === username);
        
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Λάθος στοιχεία' });
        }

        // Αφαιρούμε το password πριν στείλουμε την απάντηση
        const userResponse = { ...user };
        delete userResponse.password;
        
        res.json({ user: userResponse });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Σφάλμα κατά τη σύνδεση' });
    }
});

// Announcements routes
app.post('/api/announcements', (req, res) => {
    try {
        const { text, author } = req.body;
        const newAnnouncement = {
            id: Date.now(), // Χρησιμοποιούμε timestamp για μοναδικό ID
            text,
            author,
            date: new Date().toISOString()
        };
        announcements.push(newAnnouncement);
        saveData(); // Προσθήκη αποθήκευσης
        
        console.log('New announcement:', newAnnouncement);
        console.log('Total announcements:', announcements.length);
        
        res.json(newAnnouncement);
    } catch (error) {
        console.error('Error creating announcement:', error);
        res.status(500).json({ error: 'Σφάλμα κατά τη δημιουργία της ανακοίνωσης' });
    }
});

app.get('/api/announcements', (req, res) => {
    res.json(announcements);
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
app.delete('/api/files/:filename', (req, res) => {
  const filePath = path.join(uploadsDir, req.params.filename);
  const filename = req.params.filename;
  
  try {
    // Διαγραφή από το filesystem
    fs.unlinkSync(filePath);
    
    // Διαγραφή από τη λίστα materials
    const index = materials.findIndex(m => m.filename === filename);
    if (index !== -1) {
      materials.splice(index, 1);
      saveData(); // Προσθήκη αποθήκευσης
    }
    
    res.json({ message: 'Το αρχείο διαγράφηκε επιτυχώς' });
  } catch (err) {
    console.error('File deletion error:', err);
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
app.post('/api/grades', (req, res) => {
    try {
        const { studentId, subject, grade, instructor } = req.body;
        
        // Έλεγχος εγκυρότητας βαθμού
        if (grade < 0 || grade > 20) {
            return res.status(400).json({ error: 'Ο βαθμός πρέπει να είναι μεταξύ 0 και 20' });
        }

        // Έλεγχος αν υπάρχει ήδη βαθμός για αυτό το μάθημα
        const existingGradeIndex = grades.findIndex(g => 
            g.studentId === studentId && g.subject === subject
        );

        if (existingGradeIndex !== -1) {
            // Ενημέρωση υπάρχοντος βαθμού
            grades[existingGradeIndex] = {
                ...grades[existingGradeIndex],
                grade,
                instructor,
                date: new Date().toISOString()
            };
            console.log('Grade updated:', grades[existingGradeIndex]);
            saveData(); // Προσθήκη αποθήκευσης
            res.json(grades[existingGradeIndex]);
        } else {
            // Προσθήκη νέου βαθμού
            const newGrade = {
                id: Date.now(),
                studentId,
                subject,
                grade,
                instructor,
                date: new Date().toISOString()
            };
            grades.push(newGrade);
            console.log('New grade added:', newGrade);
            saveData(); // Προσθήκη αποθήκευσης
            res.json(newGrade);
        }
    } catch (error) {
        console.error('Error handling grade:', error);
        res.status(500).json({ error: 'Σφάλμα κατά την διαχείριση βαθμού' });
    }
});

// Get όλων των βαθμών ενός μαθητή
app.get('/api/grades/:studentId', (req, res) => {
    try {
        const studentGrades = grades.filter(g => g.studentId === parseInt(req.params.studentId));
        res.json(studentGrades);
    } catch (error) {
        console.error('Error fetching grades:', error);
        res.status(500).json({ error: 'Σφάλμα κατά την ανάκτηση βαθμών' });
    }
});

// Get όλων των μαθητών
app.get('/api/students', (req, res) => {
    try {
        const students = users.filter(user => user.role === 'student').map(student => ({
            id: student.id,
            username: student.username
        }));
        res.json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Σφάλμα κατά την ανάκτηση μαθητών' });
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

// Βεβαιωθείτε ότι το data directory έχει τα σωστά permissions
const dataDir = path.dirname(DATA_FILE);
try {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true, mode: 0o755 });
  }
  // Διορθώστε τα permissions αν χρειάζεται
  fs.chmodSync(dataDir, 0o755);
} catch (error) {
  console.error('Error setting up data directory:', error);
}

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 