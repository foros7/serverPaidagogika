require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const app = express();

// Διευρυμένες ρυθμίσεις CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://p22095.netlify.app'
];

app.use(cors({
    origin: function(origin, callback) {
      // allow requests with no origin (like mobile apps or curl requests)
      if(!origin) return callback(null, true);
      if(allowedOrigins.indexOf(origin) === -1){
        const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true
}));

app.use(express.json());

// Προσωρινή βάση δεδομένων
let users = [];
let announcements = [];
let tests = [];
let discussions = [];

// Δημιουργία του φακέλου uploads αν δεν υπάρχει
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Ρύθμιση του multer για αποθήκευση αρχείων
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Διαδρομή για την αποθήκευση των αρχείων
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Δεν βρέθηκε αρχείο' });
    }
    res.json({
        filename: req.file.filename,
        originalname: req.file.originalname,
        path: `/files/${req.file.filename}`
    });
});

// Διαδρομή για την προβολή των αρχείων
app.get('/api/files', (req, res) => {
    fs.readdir(uploadsDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Σφάλμα στην ανάγνωση των αρχείων' });
        }
        res.json(files.map(filename => ({
            filename,
            originalname: filename.substring(filename.indexOf('-') + 1),
            path: `/files/${filename}`
        })));
    });
});

// Στατική διαδρομή για την πρόσβαση στα αρχεία
app.use('/files', express.static(path.join(__dirname, 'uploads')));

// Authentication routes
app.post('/api/signup', async (req, res) => {
    try {
        console.log('Signup request received:', req.body);
        const { username, password, role } = req.body;
        
        if (!username || !password || !role) {
            return res.status(400).json({ error: 'Όλα τα πεδία είναι υποχρεωτικά' });
        }

        if (users.find(u => u.username === username)) {
            return res.status(400).json({ error: 'Το username υπάρχει ήδη' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            id: users.length + 1,
            username,
            password: hashedPassword,
            role
        };
        
        users.push(newUser);
        console.log('New user created:', { ...newUser, password: '[HIDDEN]' });
        
        const userResponse = { ...newUser };
        delete userResponse.password;
        
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
    const { text, author } = req.body;
    const newAnnouncement = {
        id: announcements.length + 1,
        text,
        author,
        date: new Date().toISOString()
    };
    announcements.push(newAnnouncement);
    res.json(newAnnouncement);
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

// Χειρισμός σφαλμάτων
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Κάτι πήγε στραβά!' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 