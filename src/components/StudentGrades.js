import React, { useState, useEffect } from 'react';
import './StudentGrades.css';

const API_URL = process.env.REACT_APP_API_URL;

function StudentGrades({ studentId }) {
    const [grades, setGrades] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchGrades();
    }, [studentId]);

    const fetchGrades = async () => {
        try {
            const response = await fetch(`${API_URL}/api/grades/${studentId}`);
            if (response.ok) {
                const data = await response.json();
                setGrades(data);
            } else {
                throw new Error('Σφάλμα κατά την ανάκτηση βαθμών');
            }
        } catch (error) {
            console.error('Error fetching grades:', error);
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const getSubjectName = (subject) => {
        const subjects = {
            mathematics: 'Μαθηματικά',
            literature: 'Έκθεση',
            informatics: 'Πληροφορική',
            economics: 'Οικονομικά'
        };
        return subjects[subject] || subject;
    };

    if (isLoading) return <div className="loading">Φόρτωση βαθμών...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="student-grades">
            <div className="grades-container">
                {grades.length === 0 ? (
                    <div className="no-grades">Δεν υπάρχουν καταχωρημένοι βαθμοί</div>
                ) : (
                    <>
                        <div className="grades-grid">
                            {grades.map((grade) => (
                                <div key={grade.id} className="grade-card">
                                    <h4>{getSubjectName(grade.subject)}</h4>
                                    <div className="grade-value">{grade.grade}</div>
                                    <div className="grade-metadata">
                                        <span>Καθηγητής: {grade.instructor}</span>
                                        <span>Ημερομηνία: {new Date(grade.date).toLocaleDateString('el-GR')}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="grade-summary">
                            <h4>Μέσος Όρος</h4>
                            <div className="average-grade">
                                {(grades.reduce((sum, grade) => sum + grade.grade, 0) / grades.length).toFixed(2)}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default StudentGrades; 