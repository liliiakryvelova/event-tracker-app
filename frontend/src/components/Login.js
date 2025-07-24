import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';

const Login = () => {
  const { login } = useUser();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = login(formData.username, formData.password);
    
    if (!result.success) {
      setError(result.message);
    }
    
    setLoading(false);
  };

  const demoCredentials = [
    { username: 'admin', password: 'admin123', role: 'Admin (Can create/edit/delete events)' }
  ];

  return (
    <div className="container" style={{ maxWidth: '400px', marginTop: '2rem' }}>
      <div className="card">
        <h2>🔐 Login to Event Tracker</h2>
        
        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Enter username"
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-success"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Logging in...' : '🚀 Login'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
          <h4>Demo Credentials:</h4>
          <div style={{ fontSize: '0.9rem' }}>
            {demoCredentials.map((cred, index) => (
              <div key={index} style={{ marginBottom: '0.5rem' }}>
                <strong>{cred.username}</strong> / {cred.password}
                <br />
                <em style={{ color: '#666' }}>{cred.role}</em>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
