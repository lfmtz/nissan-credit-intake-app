import React, { useEffect, useState } from 'react';
import { CheckCircle2, ArrowRight, Edit2 } from 'lucide-react';

export default function SuccessPage({
  onReset,
  submittedRowId = null,
  wasEditing = false,
  onReturnToList = null
}) {
  const [countdown, setCountdown] = useState(18);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onReset();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onReset]);

  return (
    <div className="success-page-container text-center animate-fade-in py-10 max-w-lg mx-auto">
      <div className="flex justify-center mb-6">
        <div className="success-icon-wrapper animate-bounce-slow">
          <CheckCircle2 size={76} className="text-emerald-400" />
        </div>
      </div>

      <h1 className="welcome-title text-emerald-400">
        {wasEditing ? "¡Solicitud Actualizada!" : "¡Solicitud Registrada con Éxito!"}
      </h1>

      <p className="welcome-subtitle text-lg font-medium my-4">
        {wasEditing
          ? "Los cambios han sido guardados correctamente en la base de datos SOL_CREDITO_ACTUAL_2026."
          : "Tus datos han sido enviados y registrados para tu trámite con Credi Nissan."}
      </p>

      {submittedRowId && (
        <div className="glass-panel p-4 rounded-xl mt-4 inline-block px-6">
          <span className="text-xs uppercase tracking-wider text-gray-400 block">
            Registro en SOL_CREDITO_ACTUAL_2026
          </span>
          <strong className="text-lg text-white">Fila #{submittedRowId}</strong>
        </div>
      )}

      <div className="glass-panel p-5 rounded-xl mt-6">
        <p className="text-xs text-gray-400">
          Redirigiendo a la pantalla principal en{" "}
          <strong className="text-teal-accent">{countdown}</strong> segundos...
        </p>
        <div className="progress-bar-wrapper mt-3" style={{ height: '4px' }}>
          <div
            className="progress-bar-fill"
            style={{
              width: `${(countdown / 18) * 100}%`,
              transition: 'width 1s linear'
            }}
          />
        </div>
      </div>

      <div className="flex justify-center gap-3 flex-wrap mt-8">
        {onReturnToList && (
          <button
            type="button"
            onClick={onReturnToList}
            className="btn btn-secondary btn-large flex items-center gap-2"
          >
            <Edit2 size={16} /> Volver al Portal de Edición
          </button>
        )}
        <button
          type="button"
          onClick={onReset}
          className="btn btn-primary btn-large flex items-center gap-2"
        >
          Volver al Inicio <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
