import React, { useState } from 'react';
import './App.css';
import Auth from './components/Auth';
import QuizCreation from './components/QuizCreation';
import AnnouncementManagement from './components/AnnouncementManagement';
import StudentQuizzes from './components/StudentQuizzes';

const API_URL = process.env.REACT_APP_API_URL;

function App() {
  const [user, setUser] = useState(null);
  const [activeComponent, setActiveComponent] = useState('dashboard');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [materials, setMaterials] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [grades, setGrades] = useState([]);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    setActiveComponent('dashboard');
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('uploadedBy', user.username);

    try {
      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Σφάλμα κατά το ανέβασμα του αρχείου');
      }

      const data = await response.json();
      setMaterials([...materials, data]);
      setSelectedFile(null);
      setUploadProgress(0);
    } catch (error) {
      setUploadError(error.message);
    }
  };

  const handleFileSelect = (e) => {
    setSelectedFile(e.target.files[0]);
    setUploadError('');
  };

  const handleAnnouncementSubmit = async (announcement) => {
    try {
      const response = await fetch(`${API_URL}/api/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...announcement,
          createdBy: user.username,
          createdAt: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error('Σφάλμα κατά τη δημιουργία της ανακοίνωσης');
      }

      const data = await response.json();
      setAnnouncements([...announcements, data]);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDiscussionSubmit = async (discussion) => {
    try {
      const response = await fetch(`${API_URL}/api/discussions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...discussion,
          createdBy: user.username,
          createdAt: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error('Σφάλμα κατά τη δημιουργία της συζήτησης');
      }

      const data = await response.json();
      setDiscussions([...discussions, data]);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleGradeSubmit = async (grade) => {
    try {
      const response = await fetch(`${API_URL}/api/grades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...grade,
          submittedBy: user.username,
          submittedAt: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error('Σφάλμα κατά την καταχώρηση του βαθμού');
      }

      const data = await response.json();
      setGrades([...grades, data]);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const renderContent = () => {
    if (!user) {
      return <Auth onLogin={handleLogin} />;
    }

    if (activeComponent === 'quiz-creation' && user.role === 'instructor') {
      return (
        <div className="content-section">
          <div className="content-header">
            <button className="back-button" onClick={() => setActiveComponent('dashboard')}>
              ← Επιστροφή
            </button>
            <h3>Δημιουργία Quiz</h3>
          </div>
          <QuizCreation user={user} />
        </div>
      );
    }

    if (activeComponent === 'dashboard') {
      return (
        <div className="dashboard">
          <h2>Καλώς ήρθατε, {user.username}!</h2>
          {user.role === 'instructor' ? (
            <div className="instructor-options">
              <button onClick={() => setActiveComponent('materials')}>
                Ανέβασμα Εκπαιδευτικού Υλικού
              </button>
              <button onClick={() => setActiveComponent('quiz-creation')}>
                Δημιουργία Quiz
              </button>
              <button onClick={() => setActiveComponent('grades')}>
                Διαχείριση Βαθμών
              </button>
              <button onClick={() => setActiveComponent('announcements')}>
                Διαχείριση Ανακοινώσεων
              </button>
              <button onClick={() => setActiveComponent('discussions')}>
                Συζητήσεις
              </button>
            </div>
          ) : (
            <div className="student-options">
              <button onClick={() => setActiveComponent('materials')}>
                Εκπαιδευτικό Υλικό
              </button>
              <button onClick={() => setActiveComponent('quizzes')}>
                Διαθέσιμα Quiz
              </button>
              <button onClick={() => setActiveComponent('announcements')}>
                Ανακοινώσεις
              </button>
              <button onClick={() => setActiveComponent('grades')}>
                Οι Βαθμοί μου
              </button>
            </div>
          )}
        </div>
      );
    }

    if (activeComponent === 'announcements') {
      return <AnnouncementManagement user={user} onBack={() => setActiveComponent('dashboard')} />;
    }

    if (activeComponent === 'quizzes' && user.role === 'student') {
      return <StudentQuizzes user={user} />;
    }

    return (
      <div className="content-section">
        <div className="content-header">
          <button className="back-button" onClick={() => setActiveComponent('dashboard')}>
            ← Επιστροφή
          </button>
        </div>
        {activeComponent === 'materials' && (
          <div className="upload-section">
            <h3>Ανέβασμα Εκπαιδευτικού Υλικού</h3>
            <form onSubmit={handleFileUpload}>
              <input
                type="file"
                onChange={handleFileSelect}
                className="file-input"
              />
              <button type="submit" disabled={!selectedFile}>
                Ανέβασμα
              </button>
            </form>
            {uploadError && <p className="error">{uploadError}</p>}
            {uploadProgress > 0 && <progress value={uploadProgress} max="100" />}
            <div className="materials-list">
              {materials.map((material, index) => (
                <div key={index} className="material-item">
                  <a href={material.url} target="_blank" rel="noopener noreferrer">
                    {material.filename}
                  </a>
                  <div className="metadata">
                    <span>Ανέβηκε από: {material.uploadedBy}</span>
                    <span>Ημερομηνία: {new Date(material.uploadedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="App">
      <header className="App-header">
        <nav className="top-nav">
          <h1>Σύστημα Διαχείρισης Μάθησης</h1>
          {user && (
            <button onClick={handleLogout}>Αποσύνδεση</button>
          )}
        </nav>
        <main className="main-content">
          {renderContent()}
        </main>
      </header>
    </div>
  );
}

export default App;
