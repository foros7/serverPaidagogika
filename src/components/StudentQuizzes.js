import React, { useState, useEffect } from 'react';
import './StudentQuizzes.css';

const API_URL = process.env.REACT_APP_API_URL;

function StudentQuizzes({ user }) {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const fetchQuizzes = async () => {
        try {
            const response = await fetch(`${API_URL}/api/quizzes`);
            if (response.ok) {
                const data = await response.json();
                setQuizzes(data);
            } else {
                throw new Error('Σφάλμα κατά τη φόρτωση των quiz');
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Φόρτωση quiz...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="student-quizzes">
            <h2>Διαθέσιμα Quiz</h2>
            {quizzes.length === 0 ? (
                <p className="no-quizzes">Δεν υπάρχουν διαθέσιμα quiz</p>
            ) : (
                <div className="quiz-list">
                    {quizzes.map((quiz, index) => (
                        <div key={index} className="quiz-card">
                            <h3>{quiz.title}</h3>
                            {quiz.description && (
                                <p className="quiz-description">{quiz.description}</p>
                            )}
                            <div className="quiz-metadata">
                                <span>Δημιουργήθηκε από: {quiz.instructor}</span>
                                <span>•</span>
                                <span>{new Date(quiz.createdAt).toLocaleDateString()}</span>
                            </div>
                            <button 
                                className="start-quiz-btn"
                                onClick={() => {/* TODO: Implement quiz taking */}}
                            >
                                Έναρξη Quiz
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default StudentQuizzes; 