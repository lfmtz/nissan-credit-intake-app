import React, { useState } from 'react';
import { Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { getRequestsFromSheets } from '../services/api/sheetsApi';

export default function AdminLogin({ onLoginSuccess, onCancel }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Por favor completa usuario y contraseña.');
      return;
    }

    if (username.toLowerCase().trim() !== 'admin') {
      setError('Usuario o contraseña incorrectos.');
      return;
    }

    setLoading(true);
    try {
      await getRequestsFromSheets(password);
      onLoginSuccess(password);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Contraseña incorrecta o error de conexión con Google Sheets.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="max-w-lg mx-auto py-8 px-4 flex flex-col justify-center items-center animate-fade-in"
      style={{ minHeight: '55vh' }}
    >
      <div
        className="glass-panel p-8 relative overflow-hidden"
        style={{ width: '100%', maxWidth: '420px' }}
      >
        <div className="text-center mb-6">
          <div
            className="inline-flex p-3 rounded-full mb-3"
            style={{
              background: 'rgba(195, 0, 47, 0.15)',
              border: '1px solid rgba(255, 42, 84, 0.35)'
            }}
          >
            <Lock size={26} className="text-teal-accent" />
          </div>
          <h2 className="text-lg font-bold text-white uppercase tracking-wider mb-1">
            Portal de Edición · Credi Nissan
          </h2>
          <p className="text-xs text-gray-400">
            Ingresa tus credenciales administrativas para consultar y editar solicitudes en SOL_CREDITO_ACTUAL_2026.
          </p>
        </div>

        {error && (
          <div className="alert alert-danger flex items-center gap-2 text-xs py-2 px-3 mb-4">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="form-group text-left">
            <label className="form-label text-xs uppercase tracking-wider text-gray-400 font-bold mb-1">
              Usuario
            </label>
            <input
              id="admin-username-input"
              type="text"
              placeholder="Ej. admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              className="form-control"
              style={{ textTransform: 'none' }}
            />
          </div>

          <div className="form-group text-left">
            <label className="form-label text-xs uppercase tracking-wider text-gray-400 font-bold mb-1">
              Contraseña
            </label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                id="admin-password-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="form-control"
                style={{ width: '100%', paddingRight: '2.75rem', textTransform: 'none' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400"
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="btn btn-secondary"
              style={{ width: '50%' }}
            >
              Volver
            </button>
            <button
              id="admin-login-submit"
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '50%' }}
            >
              {loading ? 'Validando...' : 'Ingresar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
