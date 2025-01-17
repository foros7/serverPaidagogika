import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL;

function App() {
  const [user, setUser] = useState(null);
  const [activeComponent, setActiveComponent] = useState('dashboard');
  const [materials, setMaterials] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [tests, setTests] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [newItems, setNewItems] = useState(new Set());
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [materialsRes, announcementsRes, testsRes, discussionsRes] = await Promise.all([
        fetch(`${API_URL}/api/files`),
        fetch(`${API_URL}/api/announcements`),
        fetch(`${API_URL}/api/tests`),
        fetch(`${API_URL}/api/discussions`)
      ]);

      const [materialsData, announcementsData, testsData, discussionsData] = await Promise.all([
        materialsRes.json(),
        announcementsRes.json(),
        testsRes.json(),
        discussionsRes.json()
      ]);

      setMaterials(materialsData);
      setAnnouncements(announcementsData);
      setTests(testsData);
      setDiscussions(discussionsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleFileUpload = async (fileInput) => {
    const file = fileInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        setMaterials(prevMaterials => [...prevMaterials, data]);
        setNewItems(prev => new Set([...prev, data.filename]));
        setTimeout(() => {
          setNewItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.filename);
            return newSet;
          });
        }, 5000);
        handleSuccess();
        fileInput.value = '';
      } else {
        const errorData = await response.json();
        console.error('Σφάλμα:', errorData.error);
      }
    } catch (error) {
      console.error('Σφάλμα:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (role) => {
    setUser(role);
  };

  const handleLogout = () => {
    if (window.confirm('Είστε σίγουροι ότι θέλετε να αποσυνδεθείτε;')) {
      setUser(null);
      setActiveComponent('dashboard');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
        const text = document.querySelector('textarea').value;
        const newAnnouncement = { 
            text,
            author: user.username,
            date: new Date().toISOString()
        };
        
        const response = await fetch(`${API_URL}/api/announcements`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newAnnouncement)
        });

        if (response.ok) {
            const data = await response.json();
            setAnnouncements(prev => [...prev, data]);
            document.querySelector('textarea').value = '';
            handleSuccess();
        } else {
            const error = await response.json();
            console.error('Error:', error);
        }
    } catch (error) {
        console.error('Error posting announcement:', error);
    } finally {
        setIsLoading(false);
    }
  };

  const handleDeleteMaterial = async (filename) => {
    if (window.confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το αρχείο;')) {
        try {
            setIsLoading(true);
            const response = await fetch(`${API_URL}/api/files/${filename}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setMaterials(prevMaterials => 
                    prevMaterials.filter(m => m.filename !== filename)
                );
                handleSuccess();
            } else {
                const data = await response.json();
                console.error('Error:', data.error);
            }
        } catch (error) {
            console.error('Error deleting file:', error);
        } finally {
            setIsLoading(false);
        }
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (window.confirm('Είστε σίγουροι ότι θέλετε να διαγράψετε αυτή την ανακοίνωση;')) {
        try {
            setIsLoading(true);
            console.log('Deleting announcement with id:', id);
            
            const response = await fetch(`${API_URL}/api/announcements/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setAnnouncements(prev => prev.filter(a => a.id !== id));
                handleSuccess();
            } else {
                const error = await response.json();
                console.error('Error:', error);
            }
        } catch (error) {
            console.error('Error deleting announcement:', error);
        } finally {
            setIsLoading(false);
        }
    }
  };

  const renderContent = () => {
    if (activeComponent !== 'dashboard') {
      return (
        <div className="content-section">
          <div className="content-header">
            <button className="back-button" onClick={() => setActiveComponent('dashboard')}>
              ← Επιστροφή
            </button>
            <h3>{getComponentTitle()}</h3>
          </div>
          {renderComponentContent()}
        </div>
      );
    }

    return (
      <div className="dashboard">
        <h2>Καλώς ήρθατε, {user?.role === 'instructor' ? 'Εκπαιδευτή' : 'Εκπαιδευόμενε'}</h2>
        {user?.role === 'instructor' ? (
          <div className="instructor-options">
            <button onClick={() => setActiveComponent('materials')}>Ανάρτηση Υλικού</button>
            <button onClick={() => setActiveComponent('tests')}>Δημιουργία Δοκιμασίας</button>
            <button onClick={() => setActiveComponent('announcements')}>Ανακοινώσεις</button>
            <button onClick={() => setActiveComponent('assignments')}>Ανάθεση Εργασίας</button>
            <button onClick={() => setActiveComponent('progress')}>Πρόοδος Εκπαιδευόμενων</button>
          </div>
        ) : (
          <div className="student-options">
            <button onClick={() => setActiveComponent('materials')}>Εκπαιδευτικό Υλικό</button>
            <button onClick={() => setActiveComponent('tests')}>Γραπτές Δοκιμασίες</button>
            <button onClick={() => setActiveComponent('grades')}>Βαθμολογία</button>
            <button onClick={() => setActiveComponent('announcements')}>Ανακοινώσεις</button>
            <button onClick={() => setActiveComponent('discussions')}>Συζητήσεις</button>
          </div>
        )}
      </div>
    );
  };

  const getComponentTitle = () => {
    switch (activeComponent) {
      case 'materials': return 'Εκπαιδευτικό Υλικό';
      case 'tests': return 'Γραπτές Δοκιμασίες';
      case 'announcements': return 'Ανακοινώσεις';
      case 'assignments': return 'Εργασίες';
      case 'progress': return 'Πρόοδος Εκπαιδευόμενων';
      case 'grades': return 'Βαθμολογία';
      case 'discussions': return 'Συζητήσεις';
      default: return '';
    }
  };

  const renderComponentContent = () => {
    switch (activeComponent) {
      case 'materials':
        return (
          <div className="content-section">
            <h3>Εκπαιδευτικό Υλικό</h3>
            {user?.role === 'instructor' && (
              <div className="upload-section">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const fileInput = document.querySelector('input[type="file"]');
                  if (fileInput.files.length > 0) {
                    handleFileUpload(fileInput);
                  }
                }}>
                  <input
                    type="file"
                    className="file-input"
                    onChange={(e) => {
                      setShowSuccess(false);
                    }}
                  />
                  <button 
                    type="submit"
                    className={isLoading ? 'loading' : ''}
                    disabled={isLoading}
                  >
                    {isLoading ? <span className="loading-dots">Μεταφόρτωση</span> : 'Ανέβασμα Αρχείου'}
                  </button>
                </form>
              </div>
            )}
            <div className="materials-list">
              {materials.map((material, index) => (
                <div key={index} className={`material-item ${newItems.has(material.filename) ? 'new-item' : ''}`}>
                  <div className="material-content">
                    <a href={material.url} target="_blank" rel="noopener noreferrer">
                      {material.originalname}
                    </a>
                    <div className="metadata">
                      <span>Ανέβηκε: {new Date(material.uploadDate).toLocaleString('el-GR')}</span>
                      <span> • </span>
                      <span>Μέγεθος: {formatFileSize(material.size)}</span>
                    </div>
                  </div>
                  {user?.role === 'instructor' && (
                    <button 
                      className="delete-button"
                      onClick={() => handleDeleteMaterial(material.filename)}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'announcements':
        return (
          <div className="content-section">
            <h3>Ανακοινώσεις</h3>
            {user?.role === 'instructor' && (
              <div className="announcement-form">
                <textarea 
                  placeholder="Γράψτε την ανακοίνωσή σας..."
                  required
                />
                <button 
                  onClick={handleAnnouncementSubmit}
                  className={isLoading ? 'loading' : ''}
                >
                  {isLoading ? <span className="loading-dots">Υποβολή</span> : 'Υποβολή'}
                </button>
              </div>
            )}
            <div className="announcements-list">
              {announcements.map((announcement, index) => (
                <div key={index} className="announcement-item">
                  <div className="announcement-content">
                    <p>{announcement.text}</p>
                    <div className="metadata">
                      <span>Από: {announcement.author}</span>
                      <span> • </span>
                      <span>{new Date(announcement.date).toLocaleString('el-GR')}</span>
                    </div>
                  </div>
                  {user?.role === 'instructor' && (
                    <button 
                      className="delete-button"
                      onClick={() => handleDeleteAnnouncement(announcement.id)}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'tests':
        return (
          <div className="content-section">
            <h3>Γραπτές Δοκιμασίες</h3>
            {user?.role === 'instructor' ? (
              <div className="test-creation">
                <input type="text" placeholder="Τίτλος δοκιμασίας" />
                <textarea placeholder="Ερωτήσεις..." />
                <button onClick={() => {
                  const newTest = {
                    title: document.querySelector('input').value,
                    questions: document.querySelector('textarea').value,
                    date: new Date().toLocaleDateString()
                  };
                  setTests([...tests, newTest]);
                }}>
                  Δημιουργία Δοκιμασίας
                </button>
              </div>
            ) : (
              <div className="available-tests">
                {tests.map((test, index) => (
                  <div key={index} className="test-item">
                    <h4>{test.title}</h4>
                    <p>{test.questions}</p>
                    <button>Έναρξη Δοκιμασίας</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'discussions':
        return (
          <div className="content-section">
            <h3>Συζητήσεις</h3>
            <div className="discussion-form">
              <textarea placeholder="Νέο μήνυμα..." />
              <button onClick={() => {
                const newDiscussion = {
                  text: document.querySelector('textarea').value,
                  author: user,
                  date: new Date().toLocaleDateString()
                };
                setDiscussions([...discussions, newDiscussion]);
                document.querySelector('textarea').value = '';
              }}>
                Αποστολή
              </button>
            </div>
            <div className="discussions-list">
              {discussions.map((discussion, index) => (
                <div key={index} className="discussion-item">
                  <p>{discussion.text}</p>
                  <small>{discussion.author} - {discussion.date}</small>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="dashboard">
            <h2>Καλώς ήρθατε, {user?.role === 'instructor' ? 'Εκπαιδευτή' : 'Εκπαιδευόμενε'}</h2>
            {user?.role === 'instructor' ? (
              <div className="instructor-options">
                <button onClick={() => setActiveComponent('materials')}>Ανάρτηση Υλικού</button>
                <button onClick={() => setActiveComponent('tests')}>Δημιουργία Δοκιμασίας</button>
                <button onClick={() => setActiveComponent('announcements')}>Ανακοινώσεις</button>
                <button onClick={() => setActiveComponent('assignments')}>Ανάθεση Εργασίας</button>
                <button onClick={() => setActiveComponent('progress')}>Πρόοδος Εκπαιδευόμενων</button>
              </div>
            ) : (
              <div className="student-options">
                <button onClick={() => setActiveComponent('materials')}>Εκπαιδευτικό Υλικό</button>
                <button onClick={() => setActiveComponent('tests')}>Γραπτές Δοκιμασίες</button>
                <button onClick={() => setActiveComponent('grades')}>Βαθμολογία</button>
                <button onClick={() => setActiveComponent('announcements')}>Ανακοινώσεις</button>
                <button onClick={() => setActiveComponent('discussions')}>Συζητήσεις</button>
              </div>
            )}
          </div>
        );
    }
  };

  const handleSuccess = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  return (
    <div className="App">
      <header className="App-header">
        {!user ? (
          <Auth onLogin={setUser} />
        ) : (
          <div className="main-content">
            <nav className="top-nav">
              <div className="nav-left">
                <h1>Σύστημα Διαχείρισης Μάθησης</h1>
              </div>
              <div className="user-info">
                <span className="username">
                  {user.username} ({user.role === 'instructor' ? 'Εκπαιδευτής' : 'Εκπαιδευόμενος'})
                </span>
                <button className="logout-button" onClick={handleLogout}>
                  Αποσύνδεση
                </button>
              </div>
            </nav>
            {renderContent()}
          </div>
        )}
      </header>
      {showSuccess && (
        <div className="success-checkmark">
          <span>✓</span>
        </div>
      )}
    </div>
  );
}

export default App;
