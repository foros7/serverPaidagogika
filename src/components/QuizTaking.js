import React, { useState, useEffect } from 'react';
import './QuizTaking.css';

const API_URL = process.env.REACT_APP_API_URL;

function QuizTaking({ user }) {
    const [quizzes, setQuizzes] = useState([]);
    const [currentQuiz, setCurrentQuiz] = useState(null);
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const fetchQuizzes = async () => {
        try {
            const response = await fetch(`${API_URL}/api/quizzes`);
            if (response.ok) {
                const data = await response.json();
                setQuizzes(data.filter(quiz => !quiz.submissions?.includes(user.id)));
            }
        } catch (error) {
            setError('Σφάλμα κατά τη φόρτωση των quiz');
        } finally {
            setLoading(false);
        }
    };

    const handleQuizSelect = (quiz) => {
        setCurrentQuiz(quiz);
        setAnswers({});
        setSubmitted(false);
        setResults(null);
    };

    const handleAnswerSelect = (questionIndex, answerIndex) => {
        setAnswers({
            ...answers,
            [questionIndex]: answerIndex
        });
    };

    const handleSubmit = async () => {
        try {
            const response = await fetch(`${API_URL}/api/quiz-submissions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    quizId: currentQuiz.id,
                    studentId: user.id,
                    answers: Object.values(answers)
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setResults(data);
                setSubmitted(true);
            } else {
                throw new Error('Σφάλμα κατά την υποβολή');
            }
        } catch (error) {
            setError(error.message);
        }
    };

    if (loading) return <div className="quiz-loading">Φόρτωση quiz...</div>;
    if (error) return <div className="quiz-error">{error}</div>;

    return (
        <div className="quiz-taking">
            {!currentQuiz ? (
                <div className="quiz-list">
                    <h3>Διαθέσιμα Quiz</h3>
                    {quizzes.length === 0 ? (
                        <p>Δεν υπάρχουν διαθέσιμα quiz</p>
                    ) : (
                        quizzes.map(quiz => (
                            <div key={quiz.id} className="quiz-card" onClick={() => handleQuizSelect(quiz)}>
                                <h4>{quiz.title}</h4>
                                <p>Ερωτήσεις: {quiz.questions.length}</p>
                                <p>Προθεσμία: {new Date(quiz.dueDate).toLocaleString()}</p>
                            </div>
                        ))
                    )}
                </div>
            ) : submitted ? (
                <div className="quiz-results">
                    <h3>Αποτελέσματα Quiz</h3>
                    <div className="score-card">
                        <h4>Βαθμολογία: {results.score}/{results.maxScore}</h4>
                        <p>Ποσοστό: {((results.score / results.maxScore) * 100).toFixed(1)}%</p>
                    </div>
                    <div className="answers-review">
                        {currentQuiz.questions.map((question, index) => (
                            <div key={index} className={`question-review ${results.answers[index].isCorrect ? 'correct' : 'incorrect'}`}>
                                <p className="question-text">{question.text}</p>
                                <div className="options-review">
                                    {question.options.map((option, optIndex) => (
                                        <div key={optIndex} className={`option-review 
                                            ${optIndex === question.correctAnswer ? 'correct-answer' : ''} 
                                            ${optIndex === answers[index] ? 'selected-answer' : ''}`}>
                                            {option}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => setCurrentQuiz(null)}>Επιστροφή στη λίστα</button>
                </div>
            ) : (
                <div className="quiz-form">
                    <h3>{currentQuiz.title}</h3>
                    <div className="questions">
                        {currentQuiz.questions.map((question, qIndex) => (
                            <div key={qIndex} className="question-box">
                                <p className="question-text">{question.text}</p>
                                <div className="options">
                                    {question.options.map((option, oIndex) => (
                                        <label key={oIndex} className="option-label">
                                            <input
                                                type="radio"
                                                name={`question-${qIndex}`}
                                                checked={answers[qIndex] === oIndex}
                                                onChange={() => handleAnswerSelect(qIndex, oIndex)}
                                            />
                                            <span className="option-text">{option}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="quiz-controls">
                        <button onClick={() => setCurrentQuiz(null)}>Ακύρωση</button>
                        <button 
                            onClick={handleSubmit}
                            disabled={Object.keys(answers).length !== currentQuiz.questions.length}
                        >
                            Υποβολή
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default QuizTaking; 