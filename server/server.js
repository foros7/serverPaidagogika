require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const app = express();

// Διορθώστε το CORS configuration στην αρχή του αρχείου
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://p22095.netlify.app'
];

// Ρυθμίσεις CORS
app.use(cors({
  origin: function(origin, callback) {
    // Επιτρέπουμε requests χωρίς origin (όπως mobile apps ή curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Προσθέστε OPTIONS handler για όλα τα routes
app.options('*', cors());

// Προσθέστε error handler για CORS errors
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    res.status(403).json({
      error: 'CORS not allowed',
      origin: req.headers.origin,
      allowedOrigins
    });
  } else {
    next(err);
  }
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

// Προσωρινή βάση δεδομένων
let users = [];
let announcements = [];
let tests = [];
let discussions = [];
let materials = [];

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
    try {
        const { text, author } = req.body;
        const newAnnouncement = {
            id: Date.now(), // Χρησιμοποιούμε timestamp για μοναδικό ID
            text,
            author,
            date: new Date().toISOString()
        };
        announcements.push(newAnnouncement);
        
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

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 