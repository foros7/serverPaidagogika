import React, { useState, useEffect } from 'react';
import './AnnouncementManagement.css';

const API_URL = process.env.REACT_APP_API_URL;

function AnnouncementManagement({ user, onBack }) {
    const [announcements, setAnnouncements] = useState([]);
    const [newAnnouncement, setNewAnnouncement] = useState('');
    const [title, setTitle] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const response = await fetch(`${API_URL}/api/announcements`);
            if (response.ok) {
                const data = await response.json();
                setAnnouncements(data);
            }
        } catch (error) {
            setError('Σφάλμα κατά τη φόρτωση των ανακοινώσεων');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        try {
            if (!title.trim() || !newAnnouncement.trim()) {
                throw new Error('Συμπληρώστε τίτλο και περιεχόμενο ανακοίνωσης');
            }

            const response = await fetch(`${API_URL}/api/announcements`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: title.trim(),
                    content: newAnnouncement.trim(),
                    createdBy: user.username,
                    createdAt: new Date().toISOString()
                }),
            });

            if (!response.ok) {
                throw new Error('Σφάλμα κατά τη δημιουργία της ανακοίνωσης');
            }

            const data = await response.json();
            setAnnouncements([data, ...announcements]);
            setTitle('');
            setNewAnnouncement('');
            setSuccess('Η ανακοίνωση δημιουργήθηκε επιτυχώς!');
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="announcement-management">
            <div className="content-header">
                <button className="back-button" onClick={onBack}>
                    ← Επιστροφή
                </button>
                <h3>Ανακοινώσεις</h3>
            </div>

            {user.role === 'instructor' && (
                <div className="announcement-form">
                    <h3>Νέα Ανακοίνωση</h3>
                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">{success}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Τίτλος ανακοίνωσης"
                                className="announcement-title-input"
                            />
                        </div>
                        <div className="form-group">
                            <textarea
                                value={newAnnouncement}
                                onChange={(e) => setNewAnnouncement(e.target.value)}
                                placeholder="Περιεχόμενο ανακοίνωσης"
                                className="announcement-content-input"
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="submit-announcement-btn"
                        >
                            {isLoading ? 'Δημοσίευση...' : 'Δημοσίευση Ανακοίνωσης'}
                        </button>
                    </form>
                </div>
            )}

            <div className="announcements-list">
                <h3>Ανακοινώσεις</h3>
                {announcements.length === 0 ? (
                    <p className="no-announcements">Δεν υπάρχουν ανακοινώσεις</p>
                ) : (
                    announcements.map((announcement, index) => (
                        <div key={index} className="announcement-card">
                            <h4>{announcement.title}</h4>
                            <p>{announcement.content}</p>
                            <div className="announcement-metadata">
                                <span>Από: {announcement.createdBy}</span>
                                <span>•</span>
                                <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default AnnouncementManagement; 