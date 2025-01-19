import React, { useState, useEffect } from 'react';
import './GradeManagement.css';

const API_URL = process.env.REACT_APP_API_URL;

function GradeManagement({ user }) {
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [grades, setGrades] = useState({
        mathematics: '',
        literature: '',
        informatics: '',
        economics: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await fetch(`${API_URL}/api/students`);
            if (response.ok) {
                const data = await response.json();
                setStudents(data);
            }
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    const fetchGrades = async (studentId) => {
        try {
            const response = await fetch(`${API_URL}/api/grades/${studentId}`);
            if (response.ok) {
                const data = await response.json();
                const studentGrades = {
                    mathematics: '',
                    literature: '',
                    informatics: '',
                    economics: ''
                };
                data.forEach(grade => {
                    studentGrades[grade.subject] = grade.grade.toString();
                });
                setGrades(studentGrades);
            }
        } catch (error) {
            console.error('Error fetching grades:', error);
        }
    };

    const handleStudentSelect = (student) => {
        setSelectedStudent(student);
        fetchGrades(student.id);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        try {
            const subjects = ['mathematics', 'literature', 'informatics', 'economics'];
            const updatedGrades = [];
            
            for (const subject of subjects) {
                if (grades[subject] !== '') {
                    const response = await fetch(`${API_URL}/api/grades`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            studentId: selectedStudent.id,
                            subject,
                            grade: parseInt(grades[subject]),
                            instructor: user.username
                        }),
                    });

                    if (!response.ok) {
                        throw new Error(`Error submitting grade for ${subject}`);
                    }

                    const data = await response.json();
                    updatedGrades.push(data);
                }
            }

            setMessage('Οι βαθμοί καταχωρήθηκαν επιτυχώς!');
            setTimeout(() => setMessage(''), 3000);
            
            fetchGrades(selectedStudent.id);
        } catch (error) {
            console.error('Error submitting grades:', error);
            setMessage('Σφάλμα κατά την καταχώρηση των βαθμών');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="grade-management">
            <div className="students-list">
                <h4>Επιλέξτε Μαθητή</h4>
                {students.map(student => (
                    <div
                        key={student.id}
                        className={`student-item ${selectedStudent?.id === student.id ? 'selected' : ''}`}
                        onClick={() => handleStudentSelect(student)}
                    >
                        {student.username}
                    </div>
                ))}
            </div>
            
            {selectedStudent && (
                <form onSubmit={handleSubmit} className="grade-form">
                    <h4>Βαθμοί για {selectedStudent.username}</h4>
                    
                    <div className="grade-input">
                        <label>Μαθηματικά:</label>
                        <input
                            type="number"
                            min="0"
                            max="20"
                            value={grades.mathematics}
                            onChange={(e) => setGrades({...grades, mathematics: e.target.value})}
                        />
                    </div>

                    <div className="grade-input">
                        <label>Έκθεση:</label>
                        <input
                            type="number"
                            min="0"
                            max="20"
                            value={grades.literature}
                            onChange={(e) => setGrades({...grades, literature: e.target.value})}
                        />
                    </div>

                    <div className="grade-input">
                        <label>Πληροφορική:</label>
                        <input
                            type="number"
                            min="0"
                            max="20"
                            value={grades.informatics}
                            onChange={(e) => setGrades({...grades, informatics: e.target.value})}
                        />
                    </div>

                    <div className="grade-input">
                        <label>Οικονομικά:</label>
                        <input
                            type="number"
                            min="0"
                            max="20"
                            value={grades.economics}
                            onChange={(e) => setGrades({...grades, economics: e.target.value})}
                        />
                    </div>

                    <button type="submit" disabled={isLoading}>
                        {isLoading ? 'Καταχώρηση...' : 'Καταχώρηση Βαθμών'}
                    </button>

                    {message && <div className="message">{message}</div>}
                </form>
            )}
        </div>
    );
}

export default GradeManagement; 