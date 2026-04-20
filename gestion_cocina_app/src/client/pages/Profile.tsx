import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faSignOutAlt, faEnvelope, faIdCard, faCircleNotch, faSignature } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import { BackButton } from '../components/shared/BackButton';
import '../App.css';
import '../../css/profile.css';

export function Profile() {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <FontAwesomeIcon icon={faCircleNotch} spin size="lg" />
          Cargando perfil...
        </div>
      </div>
    );
  }

  if (!user) {
    return null; 
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <BackButton />
        <h1><FontAwesomeIcon icon={faUser} /> Perfil</h1>
      </div>
      <div className="profile-card">
        <div className="profile-avatar">
          <div className="avatar-icon">
            <FontAwesomeIcon icon={faUser} />
          </div>
          <h2>{user.name || 'Usuario'}</h2>
        </div>
        
        <div className="profile-details">
          <div className="detail-item">
            <FontAwesomeIcon icon={faSignature} />
            <span>Nombre:</span>
            <strong>{user.name || 'N/A'}</strong>
          </div>
          <div className="detail-item">
            <FontAwesomeIcon icon={faEnvelope} />
            <span>Email:</span>
            <strong>{user.email || 'N/A'}</strong>
          </div>
          <div className="detail-item">
            <FontAwesomeIcon icon={faIdCard} />
            <span>Rol:</span>
            <strong>{user.role || 'N/A'}</strong>
          </div>
        </div>

        <button onClick={handleLogout} className="btn-logout">
          <FontAwesomeIcon icon={faSignOutAlt} /> Cerrar Sesión
        </button>
      </div>
    </div>
  );
}

/*
// Basic CSS for Profile page (to be added to a CSS file, e.g., profile.css)
.profile-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 70vh; 
  padding: 20px;
  background-color: #f4f7f9;
}

.profile-container.loading {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #555;
  font-size: 1.2em;
}

.profile-card {
  background-color: #fff;
  padding: 30px 40px;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.profile-card h2 {
  margin-bottom: 25px;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 1.8em;
}

.profile-details {
  text-align: left;
  margin-bottom: 30px;
}

.detail-item {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.1em;
  color: #444;
}

.detail-item strong {
  color: #555;
  min-width: 80px; // Align labels
}

.btn-logout {
  background-color: #dc3545; // Red color for logout
  color: white;
  padding: 12px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.1em;
  transition: background-color 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  width: 100%; // Full width button
}

.btn-logout:hover {
  background-color: #c82333;
}
*/
