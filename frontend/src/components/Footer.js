import React from 'react';

const Footer = () => {
  return (
    <footer style={{
      backgroundColor: '#2c3e50',
      color: 'white',
      padding: '2rem 0',
      marginTop: '4rem',
      textAlign: 'center',
      borderTop: '4px solid #e74c3c'
    }}>
      <div className="container">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginBottom: '1rem'
        }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
            🏐 Empowered by Women's Sports
          </span>
        </div>
        
        <div style={{
          fontSize: '1rem',
          marginBottom: '1rem',
          fontStyle: 'italic',
          color: '#ecf0f1'
        }}>
          "Strong women. Strong teams. Strong future."
        </div>
        
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '2rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🏆</span>
            <span>Champions</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>💪</span>
            <span>Strength</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🤝</span>
            <span>Unity</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>✨</span>
            <span>Excellence</span>
          </div>
        </div>
        
        <div style={{
          fontSize: '0.9rem',
          color: '#bdc3c7',
          paddingTop: '1rem',
          borderTop: '1px solid #34495e'
        }}>
          <p style={{ margin: '0.5rem 0' }}>
            Supporting women athletes • Building stronger communities • Creating opportunities
          </p>
          <p style={{ margin: '0.5rem 0' }}>
            © 2025 Catchball Seattle • Powered by passion, driven by purpose
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
