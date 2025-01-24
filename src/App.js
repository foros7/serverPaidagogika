import React, { useState, useEffect } from 'react';
import './App.css';
import Auth from './components/Auth';
import QuizCreation from './components/QuizCreation';
import AnnouncementManagement from './components/AnnouncementManagement';
import StudentQuizzes from './components/StudentQuizzes';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

function App() {
  const [user, setUser] = useState(null);
  const [activeComponent, setActiveComponent] = useState('dashboard');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [materials, setMaterials] = useState([]);
  const [students, setStudents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [grades, setGrades] = useState([]);

  useEffect(() => {
    fetchMaterials();
    if (user && user.role === 'instructor') {
      fetchStudents();
    }
    if (user) {
      fetchGrades();
    }
  }, [user]);

  const fetchGrades = async () => {
    try {
      const response = await fetch(`${API_URL}/api/grades`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch grades');
      }

      const data = await response.json();
      setGrades(data);
    } catch (error) {
      console.error('Error fetching grades:', error);
    }
  };

  const fetchMaterials = async () => {
    try {
      console.log('Fetching materials...');
      const response = await fetch(`${API_URL}/api/files`);
      if (!response.ok) {
        throw new Error('Failed to fetch materials');
      }
      const data = await response.json();
      console.log('Fetched materials:', data);
      
      // Transform the data to match the expected format
      const transformedData = data.map(material => ({
        ...material,
        url: material.url || material.downloadURL, // Handle both possible URL fields
        uploadDate: material.uploadDate || material.createdAt || new Date().toISOString(),
        originalname: material.originalname || material.filename,
        size: material.size || 0
      }));
      
      setMaterials(transformedData);
    } catch (error) {
      console.error('Error fetching materials:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch(`${API_URL}/api/students`);
      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    setActiveComponent('dashboard');
  };

  const handleFileUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
        // Remove credentials if not needed
        // credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      console.log('File uploaded successfully:', data);
      return data;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
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
      setGrades(prevGrades => [...prevGrades, data]);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const renderGrades = () => {
    if (user.role === 'student') {
      const studentGrades = grades.filter(grade => grade.studentId === user.id);
      return (
        <div className="grades-section">
          <h3>Οι Βαθμοί μου</h3>
          {studentGrades.length > 0 ? (
            <div className="grades-list">
              {studentGrades.map((grade, index) => (
                <div key={index} className="grade-item">
                  <span>Μάθημα: {grade.subject}</span>
                  <span>Βαθμός: {grade.score}</span>
                  <span>Ημερομηνία: {new Date(grade.submittedAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p>Δεν υπάρχουν καταχωρημένοι βαθμοί.</p>
          )}
        </div>
      );
    }
    return null;
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

    if (activeComponent === 'grades') {
      return (
        <div className="content-section">
          <div className="content-header">
            <button className="back-button" onClick={() => setActiveComponent('dashboard')}>
              ← Επιστροφή
            </button>
            <h3>Βαθμοί</h3>
          </div>
          {user.role === 'instructor' ? (
            <div className="grades-management">
              <h3>Καταχώρηση Βαθμών</h3>
              <div className="students-list">
                <h4>Λίστα Μαθητών</h4>
                {students.map((student) => (
                  <div key={student.id} className="student-item">
                    <span>{student.username}</span>
                    {/* Add grade input form here */}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            renderGrades()
          )}
        </div>
      );
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
            <h3>Εκπαιδευτικό Υλικό</h3>
            {user.role === 'instructor' && (
              <form onSubmit={(e) => {
                e.preventDefault();
                if (selectedFile) {
                  const formData = new FormData();
                  formData.append('file', selectedFile);
                  
                  fetch(`${API_URL}/api/upload`, {
                    method: 'POST',
                    body: formData
                  })
                  .then(response => {
                    if (!response.ok) throw new Error('Upload failed');
                    return response.json();
                  })
                  .then(data => {
                    setMaterials(prevMaterials => [...prevMaterials, data]);
                    setSelectedFile(null);
                    setUploadError('');
                  })
                  .catch(error => {
                    console.error('Upload error:', error);
                    setUploadError('Failed to upload file');
                  });
                }
              }}>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="file-input"
                />
                <button type="submit" disabled={!selectedFile}>
                  Ανέβασμα
                </button>
              </form>
            )}
            {uploadError && <p className="error">{uploadError}</p>}
            {uploadProgress > 0 && <progress value={uploadProgress} max="100" />}
            
            <div className="materials-list">
              <h4>Διαθέσιμα Αρχεία</h4>
              {materials && materials.length > 0 ? (
                materials.map((material, index) => (
                  <div key={index} className="material-item">
                    <a 
                      href={material.url || material.downloadURL} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      {material.originalname || material.filename}
                    </a>
                    <div className="metadata">
                      <span>Μέγεθος: {material.size ? (material.size / 1024).toFixed(2) : 'N/A'} KB</span>
                      <span>
                        Ημερομηνία: {
                          material.uploadDate 
                            ? new Date(material.uploadDate).toLocaleDateString() 
                            : new Date().toLocaleDateString()
                        }
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p>Δεν υπάρχουν διαθέσιμα αρχεία.</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Add this to check if materials are updating
  useEffect(() => {
    console.log('Current materials:', materials);
  }, [materials]);

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
