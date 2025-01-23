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