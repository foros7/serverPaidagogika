require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const app = express();

const corsOrigins = process.env.NODE_ENV === 'production' 
  ? ['https://your-netlify-app.netlify.app']  // αντικαταστήστε με το πραγματικό Netlify domain
  : ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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
        const { username, password, role } = req.body;
        
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
        res.json({ message: 'Επιτυχής εγγραφή', user: { ...newUser, password: undefined } });
    } catch (error) {
        res.status(500).json({ error: 'Σφάλμα κατά την εγγραφή' });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Λάθος στοιχεία' });
    }

    res.json({ user: { ...user, password: undefined } });
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