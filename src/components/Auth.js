import React, { useState } from 'react';
import './Auth.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    if (username.length < 3 || username.length > 20) {
      setError('Το username πρέπει να είναι μεταξύ 3 και 20 χαρακτήρων');
      return false;
    }

    if (!isLogin && password.length < 6) {
      setError('Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = `${API_URL}/api/${isLogin ? 'login' : 'signup'}`;
      console.log('Attempting to connect to:', endpoint);
      console.log('Login data:', { username, password });
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          role: isLogin ? undefined : document.querySelector('select').value
        }),
      });

      const data = await response.json();
      console.log('Response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Σφάλμα σύνδεσης');
      }

      if (!data.user) {
        throw new Error('Invalid response format');
      }

      onLogin(data.user);
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message || 'Σφάλμα σύνδεσης με τον server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>{isLogin ? 'Σύνδεση' : 'Εγγραφή'}</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit} className="auth-form">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isLoading}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          required
        />
        {!isLogin && (
          <select required disabled={isLoading}>
            <option value="student">Εκπαιδευόμενος</option>
            <option value="instructor">Εκπαιδευτής</option>
          </select>
        )}
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Παρακαλώ περιμένετε...' : (isLogin ? 'Σύνδεση' : 'Εγγραφή')}
        </button>
      </form>
      <button 
        className="switch-auth"
        onClick={() => setIsLogin(!isLogin)}
        disabled={isLoading}
      >
        {isLogin ? 'Δεν έχετε λογαριασμό; Εγγραφείτε' : 'Έχετε ήδη λογαριασμό; Συνδεθείτε'}
      </button>
    </div>
  );
}

export default Auth; 