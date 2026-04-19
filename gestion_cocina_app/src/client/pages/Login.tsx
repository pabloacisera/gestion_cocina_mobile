import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faLock, faEnvelope, faCircleNotch } from '@fortawesome/free-solid-svg-icons';
import { z } from 'zod';
import toast from 'react-hot-toast';

import { AuthService } from '../services/AuthService';
import { useAuth } from '../context/AuthContext';
import '../../css/auth.css';

const LoginSchemaFrontend = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type LoginFormData = z.infer<typeof LoginSchemaFrontend>;

export function Login() {
  const navigate = useNavigate();
  const { user, login } = useAuth(); // Get user and login function from context

  const [formData, setFormData] = useState<LoginFormData>({
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

    const validation = LoginSchemaFrontend.safeParse(formData);

    if (!validation.success) {
      const flattenedErrors = validation.error.flatten();
      setErrors(flattenedErrors.fieldErrors);
      toast.error('Please correct the errors in the form.');
      setIsSubmitting(false);
      return;
    }

    try {
      await login(validation.data);
      // If login is successful, AuthContext will update user state, triggering redirect via useEffect
      // If login fails, AuthService.login throws an error
    } catch (error: any) {
      // Error already handled by AuthService with toast
      console.error("Login error:", error);
      // Ensure submitting state is reset
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
        <h2><FontAwesomeIcon icon={faUser} /> Iniciar Sesión</h2>
        
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
            "Iniciar Sesión"
          )}
        </button>

        <div className="auth-switch">
          ¿No tienes cuenta? <a href="/register">Regístrate</a>
        </div>
      </form>
    </div>
  );
}

/*
// Basic CSS for Auth pages (re-use or extend auth.css)
// ... (CSS content from Register.tsx can be reused here)
*/
