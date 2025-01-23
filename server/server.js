// Quiz routes
app.post('/api/quizzes', async (req, res) => {
    try {
        const quiz = await Quiz.create({
            title: req.body.title,
            description: req.body.description,
            questions: req.body.questions,
            instructor: req.body.instructor
        });
        res.json(quiz);
    } catch (error) {
        console.error('Error creating quiz:', error);
        res.status(500).json({ error: 'Σφάλμα κατά τη δημιουργία του quiz' });
    }
});

app.get('/api/quizzes', async (req, res) => {
    try {
        const quizzes = await Quiz.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.json(quizzes);
    } catch (error) {
        console.error('Error fetching quizzes:', error);
        res.status(500).json({ error: 'Σφάλμα κατά την ανάκτηση των quiz' });
    }
});

// Quiz submissions
app.post('/api/quiz-submissions', async (req, res) => {
    try {
        const submission = await QuizSubmission.create({
            QuizId: req.body.quizId,
            UserId: req.body.userId,
            answers: req.body.answers,
            score: req.body.score,
            maxScore: req.body.maxScore
        });
        res.json(submission);
    } catch (error) {
        console.error('Error submitting quiz:', error);
        res.status(500).json({ error: 'Σφάλμα κατά την υποβολή του quiz' });
    }
});

app.get('/api/quiz-submissions/quiz/:quizId', async (req, res) => {
    try {
        const submissions = await QuizSubmission.findAll({
            where: { QuizId: req.params.quizId },
            include: [User], // Συμπεριλαμβάνει τα στοιχεία του χρήστη
            order: [['createdAt', 'DESC']]
        });
        res.json(submissions);
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ error: 'Σφάλμα κατά την ανάκτηση των υποβολών' });
    }
});

// Get user's quiz submissions
app.get('/api/quiz-submissions/user/:userId', async (req, res) => {
    try {
        const submissions = await QuizSubmission.findAll({
            where: { UserId: req.params.userId },
            include: [Quiz], // Συμπεριλαμβάνει τα στοιχεία του quiz
            order: [['createdAt', 'DESC']]
        });
        res.json(submissions);
    } catch (error) {
        console.error('Error fetching user submissions:', error);
        res.status(500).json({ error: 'Σφάλμα κατά την ανάκτηση των υποβολών' });
    }
});

// Grade routes
app.get('/api/users/students', async (req, res) => {
    try {
        const students = await User.findAll({
            where: { role: 'student' },
            attributes: ['id', 'username'] // Εξαιρούμε το password
        });
        res.json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ error: 'Σφάλμα κατά την ανάκτηση των μαθητών' });
    }
});

app.get('/api/grades', async (req, res) => {
    try {
        const grades = await Grade.findAll({
            include: [User],
            order: [['createdAt', 'DESC']]
        });
        res.json(grades);
    } catch (error) {
        console.error('Error fetching grades:', error);
        res.status(500).json({ error: 'Σφάλμα κατά την ανάκτηση των βαθμών' });
    }
});

app.post('/api/grades', async (req, res) => {
    try {
        const grade = await Grade.create({
            UserId: req.body.userId,
            subject: req.body.subject,
            score: req.body.score,
            comments: req.body.comments
        });
        res.json(grade);
    } catch (error) {
        console.error('Error creating grade:', error);
        res.status(500).json({ error: 'Σφάλμα κατά την καταχώρηση του βαθμού' });
    }
}); 