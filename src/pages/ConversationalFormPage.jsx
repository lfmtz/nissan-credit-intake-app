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
import NissanLogo from '../components/NissanLogo';

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
  fieldSchema = nissanFieldSchema
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

  // Secuencia de bienvenida con efecto de escritura IA
  useEffect(() => {
    if (!hasStarted) {
      const paragraphs = [
        "¡Hola! Bienvenido al portal digital de Solicitud de Crédito Credi Nissan.",
        "Hemos organizado las preguntas en 7 capas breves y claras (Datos Generales, Identificación, Domicilio, Ingresos, Empleo y Referencias) para que llenes tu solicitud sin complicaciones.",
        "En cada paso verás indicaciones claras y botones de selección rápida. Al terminar podrás revisar y corregir cualquier dato antes de enviarlo. ¡Comencemos!"
      ];

      if (fastMode) {
        setWelcomeParagraphs(paragraphs);
        setWelcomeStep(3);
        return;
      }

      setWelcomeParagraphs([""]);
      setWelcomeStep(0);

      let pIdx = 0;
      let charIdx = 0;
      let pauseTicks = 0;

      const interval = setInterval(() => {
        if (pauseTicks > 0) {
          pauseTicks -= 1;
          return;
        }

        const targetText = paragraphs[pIdx];
        if (!targetText) {
          clearInterval(interval);
          setWelcomeStep(3);
          return;
        }

        charIdx = Math.min(targetText.length, charIdx + 3);
        const currentSlice = targetText.slice(0, charIdx);

        setWelcomeParagraphs((prev) => {
          const next = [...prev];
          next[pIdx] = currentSlice;
          return next;
        });

        if (charIdx >= targetText.length) {
          if (pIdx < paragraphs.length - 1) {
            pIdx += 1;
            charIdx = 0;
            pauseTicks = 8; // breve pausa natural entre burbujas (~160ms)
            setWelcomeStep(pIdx);
            setWelcomeParagraphs((prev) => [...prev, ""]);
          } else {
            setWelcomeStep(3);
            clearInterval(interval);
          }
        }
      }, 20);

      return () => clearInterval(interval);
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

  // Desplazamiento inmediato al fondo del chat al cambiar de pregunta
  useEffect(() => {
    if (chatBodyRef.current) {
      requestAnimationFrame(() => {
        if (chatBodyRef.current) {
          chatBodyRef.current.scrollTo({
            top: chatBodyRef.current.scrollHeight,
            behavior: 'auto'
          });
        }
      });
    }
  }, [currentQuestionIndex, hasStarted]);

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
        <div className="welcome-container animate-fade-in max-w-2xl mx-auto text-center py-12">
          <div className="brand-logo-container flex items-center justify-center gap-2 mb-4">
            <ShieldCheck size={22} className="text-teal-accent" />
            <h2 className="brand-badge">CREDI NISSAN · PANEL ADMIN</h2>
          </div>

          <h1 className="welcome-title mb-2">ADMINISTRACIÓN DE SOLICITUDES</h1>
          <p className="welcome-subtitle text-gray-400 mb-8 font-semibold">
            Consulta y edita expedientes registrados en SOL_CREDITO_ACTUAL_2026
          </p>

          <div className="glass-panel p-8 rounded-xl max-w-md mx-auto bg-dark-card">
            <p className="text-sm text-gray-300 mb-6">
              Este es tu panel privado para gestionar las solicitudes de crédito Nissan:
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
                <Plus size={18} /> Iniciar Nueva Solicitud
              </button>
              <button
                id="admin-view-requests-btn"
                type="button"
                onClick={() => setCurrentStep(-1)}
                className="btn btn-secondary w-full flex items-center justify-center gap-2 py-3"
              >
                <FileText size={18} className="text-teal-accent" /> Ver y Editar Solicitudes
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="welcome-container animate-fade-in max-w-2xl mx-auto">
        <div className="flex flex-col items-center text-center mb-6">
          <NissanLogo size={115} className="mb-2" />
          <h2 className="brand-badge mb-2" style={{ letterSpacing: '0.24em', color: '#ff6b88' }}>
            CREDI NISSAN
          </h2>
          <h1 className="welcome-title text-center">Asistente de Solicitud</h1>
        </div>

        <div className="welcome-chat-box">
          <div
            className="ai-terminal-header"
            style={{ borderRadius: '0.85rem 0.85rem 0 0', margin: '-1.75rem -1.75rem 1.25rem -1.75rem' }}
          >
            <div className="ai-core-visualizer">
              <div className="ai-core-sphere"></div>
              <div className="ai-core-info">
                <h2 className="ai-core-title">Asesor Credi Nissan</h2>
                <div className="ai-core-status">
                  <span className="ai-core-status-dot"></span>
                  <span>{welcomeStep < 3 ? "Asesor escribiendo..." : "En línea"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {welcomeParagraphs.map((paragraph, index) => {
              const isLast = index === welcomeParagraphs.length - 1;
              const isTyping = welcomeStep < 3 && isLast;
              return (
                <div key={index} className="ai-msg-row bot animate-message-slide">
                  <div className={`ai-bubble bot ${isTyping ? 'active-question' : ''}`}>
                    {paragraph === "" ? (
                      <div className="ai-typing-dots">
                        <div className="ai-typing-dot"></div>
                        <div className="ai-typing-dot"></div>
                        <div className="ai-typing-dot"></div>
                      </div>
                    ) : (
                      <p>
                        {paragraph}
                        {isTyping && <span className="ai-typing-cursor" aria-hidden="true">|</span>}
                      </p>
                    )}
                    <span className="ai-time-label">
                      {isTyping ? "Asesor escribiendo..." : "IA"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center mt-8">
          <button
            id="start-intake-btn"
            onClick={handleNext}
            className="btn btn-primary btn-large"
          >
            ¡Empecemos! <ArrowRight size={18} />
          </button>
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
