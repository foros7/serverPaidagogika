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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        setMaterials(prevMaterials => [...prevMaterials, data]);
      } else {
        console.error('Σφάλμα κατά τη μεταφόρτωση του αρχείου');
      }
    } catch (error) {
      console.error('Σφάλμα:', error);
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
                <input 
                  type="file" 
                  onChange={handleFileUpload}
                  className="file-input" 
                />
              </div>
            )}
            <div className="materials-list">
              {materials.map((material, index) => (
                <div key={index} className="material-item">
                  <a 
                    href={`http://localhost:5001${material.path}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    {material.originalname || material.filename}
                  </a>
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
                  placeholder="Νέα ανακοίνωση..."
                  onChange={(e) => {}}
                />
                <button onClick={() => {
                  const newAnnouncement = { 
                    text: document.querySelector('textarea').value,
                    date: new Date().toLocaleDateString()
                  };
                  setAnnouncements([...announcements, newAnnouncement]);
                  document.querySelector('textarea').value = '';
                }}>
                  Δημοσίευση
                </button>
              </div>
            )}
            <div className="announcements-list">
              {announcements.map((announcement, index) => (
                <div key={index} className="announcement-item">
                  <p>{announcement.text}</p>
                  <small>{announcement.date}</small>
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
    </div>
  );
}

export default App;
