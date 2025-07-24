import React, { useState } from 'react';
import { useUser } from '../contexts/UserContext';

const Login = ({ onSuccess }) => {
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

    const result = await login(formData.username, formData.password);
    
    if (result.success) {
      // Call success callback to return to events page
      if (onSuccess) {
        onSuccess();
      }
    } else {
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <div className="container" style={{ maxWidth: '400px', marginTop: '2rem' }}>
      <div className="card">
        <h2>🔐 Admin Login</h2>
        <p style={{ color: '#666', marginBottom: '1rem', fontSize: '0.9rem' }}>
          Administrator access only. Contact the event coordinator if you need admin privileges.
        </p>
        
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
              placeholder="Admin username"
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
              placeholder="Admin password"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-success"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Logging in...' : '� Admin Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
