import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Send,
  AlertTriangle,
  Edit2,
  CheckCheck,
  Plus,
  FileText,
  Copy,
  Check,
  FastForward,
  Zap,
  ShieldCheck
} from 'lucide-react';
import {
  nissanFormFlow,
  getActiveFieldKeys
} from '../flows/nissan/nissanFormFlow';
import {
  nissanFieldSchema,
  isAsalariado,
  isIndependiente,
  isPensionado,
  computeIngresosNetos
} from '../flows/nissan/nissanFieldSchema';
import { validateField } from '../utils/validators';
import { formatToDDMMYYYY } from '../services/adapters/formPayloadAdapter';
import nissanHeroImg from '../assets/nissan-hero.jpg';

const calculateAntiguedadFromDate = (dateStr) => {
  if (!dateStr) return "";
  const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return "";
  const startYear = parseInt(match[1], 10);
  const startMonth = parseInt(match[2], 10) - 1;
  const startDay = parseInt(match[3], 10);
  const startDate = new Date(startYear, startMonth, startDay);
  const now = new Date();
  let years = now.getFullYear() - startDate.getFullYear();
  const mDiff = now.getMonth() - startDate.getMonth();
  if (mDiff < 0 || (mDiff === 0 && now.getDate() < startDate.getDate())) {
    years--;
  }
  const clamped = Math.max(1, Math.min(40, isNaN(years) ? 1 : years));
  return String(clamped);
};

export default function ConversationalFormPage({
  currentStep,
  setCurrentStep,
  formData,
  setFormData,
  setErrors,
  formFlow = nissanFormFlow,
  fieldSchema = nissanFieldSchema,
  onOpenAdminPortal
}) {
  // Lista dinámica de preguntas activas según las condiciones (Estado Civil y Situación Laboral)
  const allFieldKeys = getActiveFieldKeys(formData, formFlow, fieldSchema);

  const activePhases = formFlow.phases.filter(
    (p) =>
      p.id > 0 &&
      p.id < 8 &&
      p.fields &&
      p.fields.some((k) => allFieldKeys.includes(k))
  );
  const totalPhases = activePhases.length;

  const [currentKey, setCurrentKey] = useState(() => {
    if (currentStep > 0 && currentStep < 8) {
      const firstKeyInPhase = allFieldKeys.find(
        (k) => fieldSchema[k]?.phase === currentStep
      );
      if (firstKeyInPhase) return firstKeyInPhase;
    }
    return allFieldKeys[0] || "nombreAcreditado";
  });

  const currentQuestionIndex = Math.max(0, allFieldKeys.indexOf(currentKey));
  const activeFieldKey = allFieldKeys[currentQuestionIndex] || allFieldKeys[0];
  const activeSchema = fieldSchema[activeFieldKey];

  const [localError, setLocalError] = useState("");
  const inputRef = useRef(null);
  const chatBodyRef = useRef(null);

  const [fastMode, setFastMode] = useState(() => {
    try {
      const stored = localStorage.getItem('nissan.fastMode');
      if (stored !== null) return stored === 'true';
    } catch {
      /* ignore */
    }
    return new URLSearchParams(window.location.search).get('admin') === 'true';
  });

  const toggleFastMode = () => {
    setFastMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('nissan.fastMode', String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
    setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0);
  };

  const [hasStarted, setHasStarted] = useState(() => currentStep > 0);
  const [welcomeParagraphs, setWelcomeParagraphs] = useState([]);
  const [welcomeStep, setWelcomeStep] = useState(0);
  const [typedValue, setTypedValue] = useState("");
  const [furthestQuestionIndex, setFurthestQuestionIndex] = useState(0);
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopyText = (e, text, key) => {
    if (e) e.stopPropagation();
    if (!text || text === "—") return;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(String(text));
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = String(text);
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  // Sincronizar valor del input cuando cambia la pregunta activa
  useEffect(() => {
    if (activeFieldKey) {
      const existingVal = formData[activeFieldKey];
      const defaultVal = fieldSchema[activeFieldKey]?.defaultValue || "";
      const valToUse =
        existingVal !== undefined && existingVal !== ""
          ? existingVal
          : defaultVal;
      setTypedValue(valToUse);
      if (existingVal === "" && defaultVal) {
        setFormData((prev) => ({ ...prev, [activeFieldKey]: defaultVal }));
      }
    }
  }, [activeFieldKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Secuencia de bienvenida
  useEffect(() => {
    if (!hasStarted) {
      const p1 = "¡Hola! Bienvenido al portal digital de Solicitud de Crédito Credi Nissan (Persona Física).";
      const p2 = "Hemos organizado las preguntas en 7 capas breves y claras (Datos Generales, Identificación, Domicilio, Ingresos, Empleo y Referencias) para que llenes tu solicitud sin complicaciones.";
      const p3 = "En cada paso verás indicaciones claras y botones de selección rápida. Al terminar podrás revisar y corregir cualquier dato antes de enviarlo. ¡Comencemos!";

      if (fastMode) {
        setWelcomeParagraphs([p1, p2, p3]);
        setWelcomeStep(3);
        return;
      }

      const timers = [
        setTimeout(() => {
          setWelcomeParagraphs([p1]);
          setWelcomeStep(1);
        }, 200),
        setTimeout(() => {
          setWelcomeParagraphs([p1, p2]);
          setWelcomeStep(2);
        }, 450),
        setTimeout(() => {
          setWelcomeParagraphs([p1, p2, p3]);
          setWelcomeStep(3);
        }, 750)
      ];

      return () => timers.forEach(clearTimeout);
    }
  }, [hasStarted, fastMode]);

  // Sincronizar número de fase con el componente padre
  useEffect(() => {
    if (hasStarted && activeSchema) {
      setCurrentStep(activeSchema.phase);
    }
  }, [hasStarted, activeSchema, setCurrentStep]);

  // Auto-enfoque del campo activo
  useEffect(() => {
    if (hasStarted && inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
    }
  }, [activeFieldKey, hasStarted]);

  // Desplazamiento suave al fondo del chat
  useEffect(() => {
    if (chatBodyRef.current) {
      requestAnimationFrame(() => {
        if (chatBodyRef.current) {
          chatBodyRef.current.scrollTo({
            top: chatBodyRef.current.scrollHeight,
            behavior: fastMode ? 'auto' : 'smooth'
          });
        }
      });
    }
  }, [currentQuestionIndex, hasStarted, fastMode]);

  const applySmartSideEffects = (key, cleanValue, draftFormData) => {
    const nextData = { ...draftFormData, [key]: cleanValue };

    // Si selecciona Situación Laboral (Pregunta 36)
    if (key === "situacionLaboral") {
      if (isAsalariado(cleanValue)) {
        nextData.ingresoCheques = "";
        nextData.propietarioNegocio = "NO";
        if (nextData.nombreJefeInmediato === "NO APLICA") nextData.nombreJefeInmediato = "";
        if (nextData.puestoJefeInmediato === "NO APLICA") nextData.puestoJefeInmediato = "";
      } else if (isIndependiente(cleanValue)) {
        nextData.ingresoFijo = "";
        nextData.ingresoVariable = "";
        nextData.propietarioNegocio = "SÍ";
        if (!nextData.nombreJefeInmediato) nextData.nombreJefeInmediato = "NO APLICA";
        if (!nextData.puestoJefeInmediato) nextData.puestoJefeInmediato = "NO APLICA";
      } else if (isPensionado(cleanValue)) {
        nextData.ingresoVariable = "";
        nextData.ingresoCheques = "";
        nextData.propietarioNegocio = "NO";
        if (!nextData.nombreJefeInmediato) nextData.nombreJefeInmediato = "NO APLICA";
        if (!nextData.puestoJefeInmediato) nextData.puestoJefeInmediato = "NO APLICA";
      }
      nextData.ingresosNetosMensuales = computeIngresosNetos(nextData);
    }

    // Si actualiza cualquiera de los montos de ingreso
    if (key === "ingresoFijo" || key === "ingresoVariable" || key === "ingresoCheques") {
      nextData.ingresosNetosMensuales = computeIngresosNetos(nextData);
    }

    // Si captura la fecha de ingreso a la empresa (Pregunta 41), precalcular antigüedad en años (Pregunta 42)
    if (key === "fechaIngresoEmpresa" && cleanValue) {
      const calcYears = calculateAntiguedadFromDate(cleanValue);
      if (calcYears && !nextData.antiguedadEmpleoAnos) {
        nextData.antiguedadEmpleoAnos = calcYears;
      }
    }

    return nextData;
  };

  const advanceWithValue = (overrideValue) => {
    if (!hasStarted) {
      setHasStarted(true);
      setCurrentStep(1);
      setCurrentKey(allFieldKeys[0] || "nombreAcreditado");
      return;
    }

    let value = overrideValue !== undefined ? overrideValue : typedValue;
    if (typeof value === "string" && activeSchema.type !== "date") {
      value = value.replace(/\s+/g, " ").trim().toUpperCase();
    }

    const errorMsg = validateField(value, activeSchema.validation);
    if (errorMsg) {
      setLocalError(errorMsg);
      setErrors((prev) => ({ ...prev, [activeFieldKey]: errorMsg }));
      return;
    }

    setLocalError("");
    setErrors((prev) => ({ ...prev, [activeFieldKey]: "" }));

    const updatedFormData = applySmartSideEffects(activeFieldKey, value, formData);
    setFormData(updatedFormData);

    // Recalcular llaves activas con el nuevo estado (por si cambió 'casado' o 'situacionLaboral')
    const updatedKeys = getActiveFieldKeys(updatedFormData, formFlow, fieldSchema);
    const idxInUpdated = updatedKeys.indexOf(activeFieldKey);
    const nextIdx = idxInUpdated + 1;

    setFurthestQuestionIndex((prev) => Math.max(prev, nextIdx));

    if (nextIdx < updatedKeys.length) {
      setCurrentKey(updatedKeys[nextIdx]);
    } else {
      setCurrentStep(8); // Ir a Revisión Final
    }
  };

  const handleNext = () => {
    advanceWithValue(undefined);
  };

  const handleQuickSelect = (optValue) => {
    const cleanOpt = String(optValue).toUpperCase();
    setTypedValue(cleanOpt);
    advanceWithValue(cleanOpt);
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setLocalError("");
      setCurrentKey(allFieldKeys[currentQuestionIndex - 1]);
    } else {
      setHasStarted(false);
      setCurrentStep(0);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNext();
    }
  };

  const handleEditQuestion = (key) => {
    setLocalError("");
    setCurrentKey(key);
  };

  const handleJumpToFurthest = () => {
    setLocalError("");
    const safeIdx = Math.min(furthestQuestionIndex, allFieldKeys.length - 1);
    setCurrentKey(allFieldKeys[safeIdx]);
  };

  const handleInputChange = (value) => {
    setLocalError("");
    const formattedValue =
      typeof value === "string" && activeSchema?.type !== "date"
        ? value.toUpperCase()
        : value;
    setTypedValue(formattedValue);
    setFormData((prev) => applySmartSideEffects(activeFieldKey, formattedValue, prev));
  };

  // Pantalla de Bienvenida
  if (!hasStarted) {
    const isAdminMode = new URLSearchParams(window.location.search).get('admin') === 'true';

    if (isAdminMode) {
      return (
        <div className="welcome-container animate-fade-in max-w-2xl mx-auto text-center py-8">
          <div className="nissan-hero-card">
            <img src={nissanHeroImg} alt="Nissan Showroom" className="nissan-hero-img" />
            <div className="nissan-hero-overlay text-left">
              <span className="nissan-hero-tag">
                <ShieldCheck size={14} /> CREDI NISSAN · PANEL ADMINISTRATIVO
              </span>
              <h1 className="welcome-title">GESTIÓN Y EDICIÓN DE SOLICITUDES</h1>
              <p className="welcome-subtitle">
                Consulta, busca y corrige expedientes conectados en tiempo real a SOL_CREDITO_ACTUAL_2026.
              </p>
            </div>
          </div>

          <div className="glass-panel p-8 rounded-xl max-w-md mx-auto bg-dark-card">
            <p className="text-sm text-gray-300 mb-6">
              Selecciona una acción para gestionar las solicitudes de crédito Nissan:
            </p>
            <div className="flex flex-col gap-4">
              <button
                id="admin-start-new-btn"
                type="button"
                onClick={() => {
                  setHasStarted(true);
                  setCurrentStep(1);
                  setCurrentKey(allFieldKeys[0] || "nombreAcreditado");
                }}
                className="btn btn-primary w-full flex items-center justify-center gap-2 py-3"
              >
                <Plus size={18} /> Capturar Nueva Solicitud
              </button>
              <button
                id="admin-view-requests-btn"
                type="button"
                onClick={() => setCurrentStep(-1)}
                className="btn btn-secondary w-full flex items-center justify-center gap-2 py-3"
              >
                <FileText size={18} className="text-teal-accent" /> Ver y Editar Solicitudes Guardadas
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="welcome-container animate-fade-in max-w-2xl mx-auto">
        {/* Hero Banner Nissan */}
        <div className="nissan-hero-card">
          <img
            src={nissanHeroImg}
            alt="Credi Nissan Solicitud de Crédito"
            className="nissan-hero-img"
          />
          <div className="nissan-hero-overlay">
            <span className="nissan-hero-tag">CREDI NISSAN · PERSONA FÍSICA</span>
            <h1 className="welcome-title">Solicitud de Crédito Automotriz</h1>
            <p className="welcome-subtitle">
              Captura guiada paso a paso con validación inteligente.
            </p>
          </div>
        </div>

        <div className="welcome-chat-box">
          <div
            className="ai-terminal-header"
            style={{ borderRadius: '0.85rem 0.85rem 0 0', margin: '-1.75rem -1.75rem 1.25rem -1.75rem' }}
          >
            <div className="ai-core-visualizer">
              <div className="ai-core-sphere"></div>
              <div className="ai-core-info">
                <h2 className="ai-core-title">Asesor Digital Credi Nissan</h2>
                <div className="ai-core-status">
                  <span className="ai-core-status-dot"></span>
                  <span>{welcomeStep < 3 ? "Preparando guía..." : "En línea · Listo para comenzar"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {welcomeParagraphs.map((paragraph, index) => (
              <div key={index} className="ai-msg-row bot animate-message-slide">
                <div className="ai-bubble bot">
                  <p>{paragraph}</p>
                  <span className="ai-time-label">Credi Nissan</span>
                </div>
              </div>
            ))}

            {welcomeStep < 3 && (
              <div className="ai-msg-row bot animate-message-slide">
                <div className="ai-bubble bot active-question">
                  <div className="ai-typing-dots">
                    <div className="ai-typing-dot"></div>
                    <div className="ai-typing-dot"></div>
                    <div className="ai-typing-dot"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 mt-6">
          <button
            id="start-intake-btn"
            onClick={handleNext}
            className="btn btn-primary btn-large"
          >
            Comenzar Solicitud <ArrowRight size={18} />
          </button>

          {onOpenAdminPortal && (
            <button
              id="welcome-edit-portal-btn"
              type="button"
              onClick={onOpenAdminPortal}
              className="btn btn-secondary btn-xs mt-1"
            >
              <Edit2 size={13} /> ¿Necesitas corregir una solicitud enviada? Ir al Portal de Edición
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!activeSchema) return null;

  const totalQuestions = allFieldKeys.length;
  const progressPercent = Math.round((currentQuestionIndex / totalQuestions) * 100);
  const activePromptText =
    typeof activeSchema.dynamicPrompt === "function"
      ? activeSchema.dynamicPrompt(formData)
      : activeSchema.prompt;

  const renderPhaseIntro = (key) => {
    const schema = fieldSchema[key];
    if (!schema) return null;
    const phase = formFlow.phases.find((p) => p.id === schema.phase);
    if (!phase) return null;

    const activePhaseFields = phase.fields.filter((fKey) => allFieldKeys.includes(fKey));
    if (activePhaseFields[0] === key) {
      return (
        <div key={`phase-intro-${phase.id}`} className="ai-msg-row bot animate-message-slide">
          <div
            className="ai-bubble bot"
            style={{
              borderLeftColor: '#ff2a54',
              background: 'rgba(195, 0, 47, 0.09)'
            }}
          >
            <p className="font-bold text-teal-accent text-xs uppercase tracking-wider mb-1">
              Sección {phase.id}: {phase.title}
            </p>
            <p className="text-gray-300 text-xs">{phase.description}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  const formatBubbleValue = (schema, val) => {
    if (!val) return "—";
    if (schema.type === "date") {
      return formatToDDMMYYYY(val);
    }
    return String(val).toUpperCase();
  };

  const currentPhaseObj = formFlow.phases.find((p) => p.id === activeSchema.phase);
  const currentPhasePosition = Math.max(
    1,
    activePhases.findIndex((p) => p.id === activeSchema.phase) + 1
  );

  // Opciones rápidas (chips) para selects cortos o sugerencias de parentesco
  const quickOptionsToShow =
    activeSchema.quickSelect && activeSchema.options
      ? activeSchema.options
      : activeSchema.suggestions || null;

  return (
    <div
      className={`conversational-wizard-container animate-fade-in max-w-2xl mx-auto ${
        fastMode ? 'fast-mode' : ''
      }`}
    >
      {/* Tira de Secciones / Capas */}
      <div className="phase-pills-strip" role="navigation" aria-label="Fases de la solicitud">
        {activePhases.map((phase) => {
          const firstFieldInPhase = phase.fields.find((k) => allFieldKeys.includes(k));
          const phaseStartIndex = allFieldKeys.indexOf(firstFieldInPhase);
          const isCurrent = phase.id === activeSchema.phase;
          const isDone = phaseStartIndex !== -1 && phaseStartIndex < currentQuestionIndex && !isCurrent;
          const canJump = phaseStartIndex !== -1 && phaseStartIndex <= furthestQuestionIndex;

          return (
            <button
              key={phase.id}
              type="button"
              disabled={!canJump}
              onClick={() => {
                if (firstFieldInPhase) {
                  setLocalError("");
                  setCurrentKey(firstFieldInPhase);
                }
              }}
              className={`phase-pill-item ${isCurrent ? 'active' : isDone ? 'completed' : ''}`}
            >
              <span>{phase.id}. {phase.title}</span>
            </button>
          );
        })}
      </div>

      {/* Progreso General */}
      <div className="conversational-progress mb-2 flex justify-between items-center">
        <span className="step-badge font-bold">
          Sección {activeSchema.phase}: {currentPhaseObj?.title || "Solicitud"}
        </span>
        <span className="text-xs text-gray-400">
          Pregunta {currentQuestionIndex + 1} de {totalQuestions} ({progressPercent}%)
        </span>
      </div>

      <div className="progress-bar-wrapper mb-4">
        <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      {/* Terminal de Chat Credi Nissan */}
      <div className="ai-terminal-container">
        <div className="ai-terminal-header">
          <div className="ai-core-visualizer">
            <div className="ai-core-sphere"></div>
            <div className="ai-core-info">
              <h3 className="ai-core-title">Asesor Credi Nissan</h3>
              <div className="ai-core-status">
                <span className="ai-core-status-dot"></span>
                <span>{fastMode ? "Modo rápido activo" : "Asistencia interactiva"}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleFastMode}
              className={`fast-mode-toggle ${fastMode ? 'active' : ''}`}
              title="Activar o desactivar animaciones"
            >
              <Zap size={12} />
              <span>Modo rápido</span>
            </button>
            <span className="ai-phase-tag">
              Capa {currentPhasePosition}/{totalPhases}
            </span>
          </div>
        </div>

        {/* Cuerpo de la Conversación */}
        <div className="ai-terminal-body" ref={chatBodyRef}>
          {allFieldKeys.slice(0, currentQuestionIndex).map((key) => {
            const schema = fieldSchema[key];
            if (!schema) return null;
            const val = formData[key];
            const displayVal = formatBubbleValue(schema, val);
            const promptText =
              typeof schema.dynamicPrompt === "function"
                ? schema.dynamicPrompt(formData)
                : schema.prompt;

            return (
              <React.Fragment key={key}>
                {renderPhaseIntro(key)}

                <div className="ai-msg-row bot animate-message-slide">
                  <div className="ai-bubble bot">
                    {schema.questionNumber && (
                      <span className="question-number-pill">
                        Pregunta {schema.questionNumber} · {schema.label}
                      </span>
                    )}
                    <p>{promptText}</p>
                  </div>
                </div>

                <div className="ai-msg-row user animate-message-slide">
                  <div className="ai-bubble user">
                    <div className="flex items-center gap-2 justify-between">
                      <span className="user-answer-text">{displayVal}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => handleCopyText(e, displayVal, key)}
                          className="ai-bubble-action-btn"
                          title="Copiar dato"
                        >
                          {copiedKey === key ? <Check size={13} /> : <Copy size={13} />}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditQuestion(key);
                          }}
                          className="ai-bubble-action-btn"
                          title="Editar esta respuesta"
                        >
                          <Edit2 size={12} />
                        </button>
                      </div>
                    </div>
                    <span className="ai-time-label flex items-center justify-end gap-1">
                      <span>Confirmado</span>
                      <CheckCheck size={13} />
                    </span>
                  </div>
                </div>
              </React.Fragment>
            );
          })}

          {/* Pregunta Activa */}
          <React.Fragment key={`active-${activeFieldKey}`}>
            {renderPhaseIntro(activeFieldKey)}
            <div className="ai-msg-row bot animate-message-slide">
              <div className="ai-bubble bot active-question" style={{ width: '100%' }}>
                {activeSchema.questionNumber && (
                  <span className="question-number-pill">
                    Pregunta {activeSchema.questionNumber} · {activeSchema.label}
                  </span>
                )}
                <p className="font-semibold text-white">{activePromptText}</p>

                {activeSchema.helperText && (
                  <div className="question-helper-box">
                    💡 {activeSchema.helperText}
                  </div>
                )}

                {quickOptionsToShow && (
                  <div className="quick-chips-container">
                    {quickOptionsToShow.map((opt) => {
                      const isSelected =
                        String(typedValue || "").toUpperCase() === String(opt).toUpperCase();
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleQuickSelect(opt)}
                          className={`quick-chip-btn ${isSelected ? 'selected' : ''}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </React.Fragment>
        </div>

        {/* Controles de Entrada */}
        <div className="ai-terminal-footer">
          {localError && (
            <div className="ai-error-message-bar animate-fade-in">
              <AlertTriangle size={16} className="text-rose-400 flex-shrink-0" />
              <span>{localError}</span>
            </div>
          )}

          {(currentQuestionIndex < furthestQuestionIndex ||
            furthestQuestionIndex >= allFieldKeys.length - 1) && (
            <div className="ai-jump-return-banner animate-fade-in flex items-center justify-between p-2 px-3 rounded-lg flex-wrap gap-2">
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <span className="text-amber-400 font-bold">Modo edición de paso:</span>
                <span>
                  Pregunta {currentQuestionIndex + 1} de {allFieldKeys.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {currentQuestionIndex < furthestQuestionIndex &&
                  furthestQuestionIndex < allFieldKeys.length - 1 && (
                    <button
                      type="button"
                      onClick={handleJumpToFurthest}
                      className="btn-jump-return"
                    >
                      <FastForward size={14} />
                      <span>Continuar en Pregunta {furthestQuestionIndex + 1}</span>
                    </button>
                  )}
                {furthestQuestionIndex >= allFieldKeys.length - 1 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(8)}
                    className="btn-jump-return"
                  >
                    <FastForward size={14} />
                    <span>Ir a Revisión Final</span>
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="ai-input-controls-row">
            <button
              id="wizard-prev-btn"
              type="button"
              className="ai-control-btn back"
              onClick={handlePrev}
              title="Pregunta anterior"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="ai-input-field-wrapper">
              {activeSchema.type === "select" ? (
                <select
                  id={`field-${activeFieldKey}`}
                  ref={inputRef}
                  value={typedValue ? String(typedValue).toUpperCase() : ""}
                  onChange={(e) => handleInputChange(e.target.value.toUpperCase())}
                  onKeyDown={handleKeyDown}
                  className="ai-select-input-field"
                >
                  <option value="" disabled>
                    {activeSchema.placeholder}
                  </option>
                  {activeSchema.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                  {typedValue &&
                    !activeSchema.options.includes(String(typedValue).toUpperCase()) && (
                      <option value={String(typedValue).toUpperCase()}>
                        {String(typedValue).toUpperCase()}
                      </option>
                    )}
                </select>
              ) : (
                <input
                  id={`field-${activeFieldKey}`}
                  ref={inputRef}
                  type={activeSchema.type}
                  placeholder={activeSchema.placeholder}
                  value={typedValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="ai-text-input-field"
                  style={
                    activeSchema.type !== 'date'
                      ? { textTransform: 'uppercase' }
                      : undefined
                  }
                />
              )}
            </div>

            <button
              id="wizard-next-btn"
              type="button"
              className="ai-control-btn send"
              onClick={handleNext}
              title="Confirmar y avanzar"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
