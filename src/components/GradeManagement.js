import React, { useState, useEffect } from 'react';
import './GradeManagement.css';

const API_URL = process.env.REACT_APP_API_URL;

function GradeManagement({ user }) {
    const [students, setStudents] = useState([]);
    const [grades, setGrades] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchStudents();
        fetchGrades();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await fetch(`${API_URL}/api/users/students`);
            if (response.ok) {
                const data = await response.json();
                setStudents(data);
            }
        } catch (error) {
            setError('Σφάλμα κατά τη φόρτωση των μαθητών');
        }
    };

    const fetchGrades = async () => {
        try {
            const response = await fetch(`${API_URL}/api/grades`);
            if (response.ok) {
                const data = await response.json();
                const gradesByStudent = data.reduce((acc, grade) => {
                    if (!acc[grade.UserId]) acc[grade.UserId] = [];
                    acc[grade.UserId].push(grade);
                    return acc;
                }, {});
                setGrades(gradesByStudent);
            }
        } catch (error) {
            setError('Σφάλμα κατά τη φόρτωση των βαθμών');
        } finally {
            setLoading(false);
        }
    };

    const handleGradeSubmit = async (studentId, subject, score, comments) => {
        try {
            const response = await fetch(`${API_URL}/api/grades`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: studentId,
                    subject,
                    score,
                    comments
                }),
            });

            if (response.ok) {
                setSuccess('Ο βαθμός καταχωρήθηκε επιτυχώς');
                fetchGrades();
            }
        } catch (error) {
            setError('Σφάλμα κατά την καταχώρηση του βαθμού');
        }
    };

    if (loading) return <div className="loading">Φόρτωση...</div>;

    return (
        <div className="grade-management">
            <h2>Διαχείριση Βαθμών</h2>
            
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="students-grid">
                {students.map(student => (
                    <div key={student.id} className="student-card">
                        <h3>{student.username}</h3>
                        <div className="grades-list">
                            {grades[student.id]?.map((grade, index) => (
                                <div key={index} className="grade-item">
                                    <span className="subject">{grade.subject}</span>
                                    <span className="score">{grade.score}</span>
                                    {grade.comments && (
                                        <p className="comments">{grade.comments}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                        <form 
                            className="grade-form"
                            onSubmit={(e) => {
                                e.preventDefault();
                                const subject = e.target.subject.value;
                                const score = parseFloat(e.target.score.value);
                                const comments = e.target.comments.value;
                                handleGradeSubmit(student.id, subject, score, comments);
                                e.target.reset();
                            }}
                        >
                            <input 
                                type="text" 
                                name="subject" 
                                placeholder="Μάθημα"
                                required 
                            />
                            <input 
                                type="number" 
                                name="score" 
                                placeholder="Βαθμός"
                                min="0" 
                                max="10" 
                                step="0.5"
                                required 
                            />
                            <textarea 
                                name="comments" 
                                placeholder="Σχόλια"
                            />
                            <button type="submit">Καταχώρηση Βαθμού</button>
                        </form>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default GradeManagement; 