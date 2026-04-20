import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock, faEnvelope, faSignature, faCircleNotch } from '@fortawesome/free-solid-svg-icons';
import { z } from 'zod';
import toast from 'react-hot-toast';

import { AuthService } from '../services/AuthService';
import { useAuth } from '../context/AuthContext';
import '../../css/auth.css';

const RegisterSchemaFrontend = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(50, "El nombre es muy largo"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type RegisterFormData = z.infer<typeof RegisterSchemaFrontend>;

export function Register() {
  const navigate = useNavigate();
  const { user, register } = useAuth(); // Get user and register function from context

  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<any>(null); // To store validation errors

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/home');
    }
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear specific error when user types
    if (errors && errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors(null);

    const validation = RegisterSchemaFrontend.safeParse(formData);

    if (!validation.success) {
      const flattenedErrors = validation.error.flatten();
      setErrors(flattenedErrors.fieldErrors);
      toast.error('Por favor, corrija los errores en el formulario.');
      setIsSubmitting(false);
      return;
    }

    try {
      const registeredUser = await register(validation.data);
      if (registeredUser) {
        // If registration is successful and auto-login happened, redirect to home
        // If registration is successful but no auto-login, user will see success toast and stay on page, or redirect to login
        // For now, let's redirect to home as the context might have updated user
        navigate('/home'); 
      }
      // If register() fails, it throws an error, which is caught below
    } catch (error: any) {
      // Error already handled by AuthService with toast
      // setErrors might be populated if backend sends specific validation errors not caught by Zod frontend
      console.error("Registration error:", error);
      // Ensure submitting state is reset even if error occurs
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <div className="auth-brand-icon">
          <i className="fa-solid fa-utensils"></i>
        </div>
        <h1>Gestión <span>Cocina</span></h1>
      </div>
      <form onSubmit={handleSubmit} className="auth-form">
        <h2><FontAwesomeIcon icon={faUser} /> Registrarse</h2>
        
        <div className="form-field">
          <label htmlFor="name">Nombre (*)</label>
          <div className="input-wrapper">
            <FontAwesomeIcon icon={faSignature} className="input-icon" />
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Tu nombre completo"
              aria-label="Name"
            />
          </div>
          {errors?.name && <p className="error-message">{errors.name[0]}</p>}
        </div>

        <div className="form-field">
          <label htmlFor="email">Email (*)</label>
          <div className="input-wrapper">
            <FontAwesomeIcon icon={faEnvelope} className="input-icon" />
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="tu.email@ejemplo.com"
              aria-label="Email"
            />
          </div>
          {errors?.email && <p className="error-message">{errors.email[0]}</p>}
        </div>

        <div className="form-field">
          <label htmlFor="password">Contraseña (*)</label>
          <div className="input-wrapper">
            <FontAwesomeIcon icon={faLock} className="input-icon" />
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Mín. 6 caracteres"
              aria-label="Password"
            />
          </div>
          {errors?.password && <p className="error-message">{errors.password[0]}</p>}
        </div>

        <button type="submit" className="btn-submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <FontAwesomeIcon icon={faCircleNotch} spin />
          ) : (
            "Registrarse"
          )}
        </button>

        <div className="auth-switch">
          ¿Ya tienes cuenta? <a href="/login">Inicia Sesión</a>
        </div>
      </form>
    </div>
  );
}

/*
// Basic CSS for Auth pages (to be added to a CSS file, e.g., auth.css)
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh; // Adjust as needed for page centering
  padding: 20px;
  background-color: #f4f7f9; // Light background
}

.auth-form {
  background-color: #fff;
  padding: 30px 40px;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.auth-form h2 {
  margin-bottom: 25px;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 1.8em;
}

.form-field {
  margin-bottom: 20px;
  text-align: left;
}

.form-field label {
  display: block;
  margin-bottom: 10px;
  font-weight: bold;
  color: #555;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 12px;
  color: #888;
  font-size: 1.1em;
}

.auth-form input[type="text"],
.auth-form input[type="email"],
.auth-form input[type="password"] {
  width: calc(100% - 40px); // Account for icon and padding
  padding: 12px 15px 12px 45px; // Add left padding for icon
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1em;
  transition: border-color 0.3s ease;
}

.auth-form input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.error-message {
  color: #dc3545; // Red for errors
  font-size: 0.85em;
  margin-top: 8px;
  padding-left: 5px; // Align with input text
}

.btn-submit {
  width: 100%;
  background-color: #007bff;
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
  justify-content: center;
  margin-top: 10px;
}

.btn-submit:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-submit:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.auth-switch {
  margin-top: 25px;
  font-size: 0.95em;
  color: #555;
}

.auth-switch a {
  color: #007bff;
  text-decoration: none;
  font-weight: bold;
}

.auth-switch a:hover {
  text-decoration: underline;
}
*/
