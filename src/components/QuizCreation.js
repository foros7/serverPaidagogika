import React, { useState } from 'react';
import './QuizCreation.css';

const API_URL = process.env.REACT_APP_API_URL;

function QuizCreation({ user }) {
    const [formTitle, setFormTitle] = useState('Νέο Quiz');
    const [formDescription, setFormDescription] = useState('');
    const [questions, setQuestions] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const addQuestion = (type = 'multiple') => {
        const newQuestion = {
            id: Date.now(),
            type,
            title: '',
            required: true,
            options: type === 'multiple' ? ['Επιλογή 1', 'Επιλογή 2'] : [],
            correctAnswer: 0
        };
        setQuestions([...questions, newQuestion]);
    };

    const updateQuestion = (id, field, value) => {
        setQuestions(questions.map(q => 
            q.id === id ? { ...q, [field]: value } : q
        ));
    };

    const addOption = (questionId) => {
        setQuestions(questions.map(q => {
            if (q.id === questionId) {
                return {
                    ...q,
                    options: [...q.options, `Επιλογή ${q.options.length + 1}`]
                };
            }
            return q;
        }));
    };

    const removeOption = (questionId, optionIndex) => {
        setQuestions(questions.map(q => {
            if (q.id === questionId) {
                const newOptions = q.options.filter((_, index) => index !== optionIndex);
                return {
                    ...q,
                    options: newOptions,
                    correctAnswer: q.correctAnswer >= optionIndex ? 
                        Math.max(0, q.correctAnswer - 1) : q.correctAnswer
                };
            }
            return q;
        }));
    };

    const removeQuestion = (id) => {
        setQuestions(questions.filter(q => q.id !== id));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        try {
            if (!formTitle || questions.length === 0) {
                throw new Error('Συμπληρώστε τον τίτλο και προσθέστε τουλάχιστον μία ερώτηση');
            }

            const response = await fetch(`${API_URL}/api/quizzes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: formTitle,
                    description: formDescription,
                    questions: questions.map(q => ({
                        text: q.title,
                        type: q.type,
                        required: q.required,
                        options: q.options,
                        correctAnswer: q.correctAnswer
                    })),
                    instructor: user.username,
                    createdAt: new Date().toISOString()
                }),
            });

            if (!response.ok) {
                throw new Error('Σφάλμα κατά τη δημιουργία του quiz');
            }

            setSuccess('Το quiz δημιουργήθηκε επιτυχώς!');
            setFormTitle('Νέο Quiz');
            setFormDescription('');
            setQuestions([]);
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="quiz-creator">
            <div className="quiz-header">
                <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="quiz-title-input"
                    placeholder="Τίτλος Quiz"
                />
                <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="quiz-description-input"
                    placeholder="Περιγραφή (προαιρετικό)"
                />
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="questions-container">
                {questions.map((question, index) => (
                    <div key={question.id} className="question-card">
                        <div className="question-header">
                            <input
                                type="text"
                                value={question.title}
                                onChange={(e) => updateQuestion(question.id, 'title', e.target.value)}
                                placeholder="Ερώτηση"
                                className="question-title-input"
                            />
                            <button 
                                onClick={() => removeQuestion(question.id)}
                                className="remove-question-btn"
                            >
                                ×
                            </button>
                        </div>

                        <div className="options-container">
                            {question.options.map((option, optIndex) => (
                                <div key={optIndex} className="option-row">
                                    <input
                                        type="radio"
                                        checked={question.correctAnswer === optIndex}
                                        onChange={() => updateQuestion(question.id, 'correctAnswer', optIndex)}
                                    />
                                    <input
                                        type="text"
                                        value={option}
                                        onChange={(e) => {
                                            const newOptions = [...question.options];
                                            newOptions[optIndex] = e.target.value;
                                            updateQuestion(question.id, 'options', newOptions);
                                        }}
                                        placeholder={`Επιλογή ${optIndex + 1}`}
                                        className="option-input"
                                    />
                                    {question.options.length > 2 && (
                                        <button 
                                            onClick={() => removeOption(question.id, optIndex)}
                                            className="remove-option-btn"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button 
                                onClick={() => addOption(question.id)}
                                className="add-option-btn"
                            >
                                + Προσθήκη επιλογής
                            </button>
                        </div>

                        <div className="question-footer">
                            <label className="required-toggle">
                                <input
                                    type="checkbox"
                                    checked={question.required}
                                    onChange={(e) => updateQuestion(question.id, 'required', e.target.checked)}
                                />
                                Υποχρεωτική
                            </label>
                        </div>
                    </div>
                ))}
            </div>

            <div className="quiz-controls">
                <button 
                    onClick={() => addQuestion('multiple')}
                    className="add-question-btn"
                >
                    + Προσθήκη ερώτησης
                </button>
                
                <button 
                    onClick={handleSubmit}
                    disabled={isLoading || questions.length === 0}
                    className="save-quiz-btn"
                >
                    {isLoading ? 'Αποθήκευση...' : 'Αποθήκευση Quiz'}
                </button>
            </div>
        </div>
    );
}

export default QuizCreation; 