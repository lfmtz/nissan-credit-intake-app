import React, { useState } from 'react';
import {
  Edit2,
  Check,
  Send,
  AlertCircle,
  Copy,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { nissanFormFlow } from '../flows/nissan/nissanFormFlow';
import {
  nissanFieldSchema,
  requiresConyugeSection,
  computeIngresosNetos,
  isAsalariado,
  isIndependiente,
  isPensionado
} from '../flows/nissan/nissanFieldSchema';
import { validateField } from '../utils/validators';
import { formatToDDMMYYYY } from '../services/adapters/formPayloadAdapter';

const DATE_FIELDS = new Set([
  "fechaNacimiento",
  "fechaNacimientoConyuge",
  "fechaIngresoEmpresa"
]);

const formatDisplayValue = (fieldId, value) => {
  if (value === undefined || value === null || value === "") return "";
  if (DATE_FIELDS.has(fieldId) && typeof value === "string") {
    return formatToDDMMYYYY(value);
  }
  return String(value).toUpperCase();
};

export default function ReviewPage({
  formData,
  setFormData,
  setCurrentStep,
  onSubmit,
  isSubmitting,
  submitError,
  formFlow = nissanFormFlow,
  fieldSchema = nissanFieldSchema,
  editingRowId = null
}) {
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState('');
  const [localErrors, setLocalErrors] = useState({});
  const [copiedField, setCopiedField] = useState(null);
  const [lastCopiedField, setLastCopiedField] = useState(null);
  const [expandConyugeOverride, setExpandConyugeOverride] = useState(false);
  const [showAllIncomeFields, setShowAllIncomeFields] = useState(Boolean(editingRowId));

  const handleCopyField = (fieldId, value, e) => {
    if (e) e.stopPropagation();
    if (value === undefined || value === null || value === "") return;
    const textToCopy = formatDisplayValue(fieldId, value);
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(String(textToCopy));
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = String(textToCopy);
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopiedField(fieldId);
    setLastCopiedField(fieldId);
    setTimeout(() => {
      setCopiedField((prev) => (prev === fieldId ? null : prev));
    }, 1500);
  };

  const startEditing = (fieldId, currentVal, e) => {
    if (e) e.stopPropagation();
    setEditingField(fieldId);
    let val = currentVal ?? '';
    if (DATE_FIELDS.has(fieldId) && typeof val === "string") {
      const match = val.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        val = `${match[1]}-${match[2]}-${match[3]}`;
      } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(val.trim())) {
        const parts = val.trim().split("/");
        val = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
      }
    } else if (typeof val === "string") {
      val = val.toUpperCase();
    }
    setTempValue(val);
    setLocalErrors((prev) => ({ ...prev, [fieldId]: '' }));
  };

  const cancelEditing = (e) => {
    if (e) e.stopPropagation();
    setEditingField(null);
  };

  const saveEditing = (fieldId, e) => {
    if (e) e.stopPropagation();
    const schema = fieldSchema[fieldId];
    let valToSave = tempValue;
    if (typeof valToSave === "string" && !DATE_FIELDS.has(fieldId)) {
      valToSave = valToSave.replace(/\s+/g, " ").trim().toUpperCase();
    }

    // Permitir dejar vacíos campos condicionales cuando no aplican
    const isConditionalAndInactive =
      typeof schema?.condition === "function" && !schema.condition(formData);
    const isClearingInactiveField =
      isConditionalAndInactive && (!valToSave || String(valToSave).trim() === "");

    if (schema && !isClearingInactiveField && !editingRowId) {
      const errorMsg = validateField(valToSave, schema.validation);
      if (errorMsg) {
        setLocalErrors((prev) => ({ ...prev, [fieldId]: errorMsg }));
        return;
      }
    }

    setLocalErrors((prev) => ({ ...prev, [fieldId]: '' }));
    setFormData((prev) => {
      const next = { ...prev, [fieldId]: valToSave };

      if (fieldId === "situacionLaboral") {
        if (isAsalariado(valToSave)) {
          next.ingresoCheques = "";
          next.propietarioNegocio = "NO";
        } else if (isIndependiente(valToSave)) {
          next.ingresoFijo = "";
          next.ingresoVariable = "";
          next.propietarioNegocio = "SÍ";
          if (!next.nombreJefeInmediato) next.nombreJefeInmediato = "NO APLICA";
          if (!next.puestoJefeInmediato) next.puestoJefeInmediato = "NO APLICA";
        } else if (isPensionado(valToSave)) {
          next.ingresoVariable = "";
          next.ingresoCheques = "";
          next.propietarioNegocio = "NO";
          if (!next.nombreJefeInmediato) next.nombreJefeInmediato = "NO APLICA";
          if (!next.puestoJefeInmediato) next.puestoJefeInmediato = "NO APLICA";
        }
        next.ingresosNetosMensuales = computeIngresosNetos(next);
      } else if (
        fieldId === "ingresoFijo" ||
        fieldId === "ingresoVariable" ||
        fieldId === "ingresoCheques"
      ) {
        next.ingresosNetosMensuales = computeIngresosNetos(next);
        next.ingresosNetosMensualesManual = false;
      } else if (fieldId === "ingresosNetosMensuales") {
        next.ingresosNetosMensualesManual = true;
      }

      return next;
    });
    setEditingField(null);
  };

  const handleEditKeyDown = (e, fieldId) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveEditing(fieldId);
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEditing();
    }
  };

  const renderFieldCard = (fieldId) => {
    const schema = fieldSchema[fieldId];
    if (!schema) return null;
    const value =
      fieldId === "ingresosNetosMensuales" && !formData.ingresosNetosMensuales
        ? computeIngresosNetos(formData)
        : formData[fieldId];
    const hasValue = value !== undefined && value !== null && String(value).trim() !== "";
    const isEditing = editingField === fieldId;
    const isCopied = copiedField === fieldId;
    const isLastCopied = lastCopiedField === fieldId;
    const error = localErrors[fieldId];

    return (
      <div
        key={fieldId}
        onClick={() => {
          if (!isEditing && hasValue) {
            handleCopyField(fieldId, value);
          }
        }}
        className={`review-field-item flex flex-col justify-between rounded-lg border bg-dark-card ${
          !isEditing && hasValue ? 'review-field-copyable' : ''
        } ${isCopied ? 'review-field-copied' : isLastCopied ? 'review-field-last-copied' : ''}`}
        title={!isEditing && hasValue ? "Clic para copiar este dato" : undefined}
      >
        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="review-field-label">
              {schema.questionNumber ? `${schema.questionNumber}. ` : ""}
              {schema.label}
            </span>
            {isLastCopied && !isCopied && !isEditing && (
              <span className="last-copied-pill">Copiado</span>
            )}
          </div>
          {!isEditing && (
            <div className="review-field-actions">
              {hasValue && (
                <button
                  type="button"
                  onClick={(e) => handleCopyField(fieldId, value, e)}
                  className={`btn-review-action ${isCopied ? 'copied' : ''}`}
                  title="Copiar dato"
                >
                  {isCopied ? (
                    <>
                      <Check size={13} />
                      <span>¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={(e) => startEditing(fieldId, value, e)}
                className="btn-review-action edit"
                title="Editar este campo"
              >
                <Edit2 size={13} />
                <span>Editar</span>
              </button>
            </div>
          )}
        </div>

        <div className="review-field-value-container mt-2">
          {isEditing ? (
            <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
              {schema.type === "select" ? (
                <select
                  autoFocus
                  value={tempValue ? String(tempValue).toUpperCase() : ""}
                  onChange={(e) => setTempValue(e.target.value.toUpperCase())}
                  onKeyDown={(e) => handleEditKeyDown(e, fieldId)}
                  className="form-control"
                >
                  <option value="">— Seleccionar —</option>
                  {schema.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                  {tempValue &&
                    !schema.options.includes(String(tempValue).toUpperCase()) && (
                      <option value={String(tempValue).toUpperCase()}>
                        {String(tempValue).toUpperCase()}
                      </option>
                    )}
                </select>
              ) : (
                <input
                  autoFocus
                  type={schema.type}
                  value={tempValue}
                  placeholder={schema.placeholder}
                  onChange={(e) =>
                    setTempValue(
                      schema.type === 'date'
                        ? e.target.value
                        : e.target.value.toUpperCase()
                    )
                  }
                  onKeyDown={(e) => handleEditKeyDown(e, fieldId)}
                  className="form-control"
                  style={
                    schema.type !== 'date'
                      ? { textTransform: 'uppercase' }
                      : undefined
                  }
                />
              )}
              {error && <span className="error-message">{error}</span>}
              <div className="flex items-center justify-between gap-2 mt-1">
                <span className="text-xs text-gray-500">Enter = Guardar · Esc = Cancelar</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="btn btn-secondary btn-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={(e) => saveEditing(fieldId, e)}
                    className="btn btn-primary btn-xs flex items-center gap-1"
                  >
                    <Check size={12} /> Guardar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <span className="review-field-value text-white font-medium">
              {hasValue ? (
                formatDisplayValue(fieldId, value)
              ) : (
                <em className="text-gray-500">Vacío / No aplica</em>
              )}
            </span>
          )}
        </div>
      </div>
    );
  };

  const conyugeApplies = requiresConyugeSection(formData.casado);
  const hasAnyConyugeData = Boolean(
    formData.nombreConyuge ||
      formData.apellidoPaternoConyuge ||
      formData.apellidoMaternoConyuge ||
      formData.fechaNacimientoConyuge ||
      formData.entidadFederativaNacimientoConyuge
  );
  const showConyugeFields =
    Boolean(editingRowId) || conyugeApplies || hasAnyConyugeData || expandConyugeOverride;

  return (
    <div className="review-page-container animate-fade-in">
      <div className="review-header">
        <h1 className="welcome-title text-center">
          {editingRowId
            ? `Edición de Solicitud Nissan · Fila #${editingRowId}`
            : "Revisión de tu Solicitud Credi Nissan"}
        </h1>

        <div
          className="my-5 flex items-start gap-3 p-4 rounded-xl border"
          style={{
            borderColor: 'rgba(255, 42, 84, 0.35)',
            background: 'rgba(195, 0, 47, 0.08)'
          }}
        >
          <AlertCircle className="text-teal-accent shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-sm font-semibold text-white">
              Verifica que todos los datos estén correctos antes de guardar en SOL_CREDITO_ACTUAL_2026.
            </p>
            <p className="text-xs text-gray-300 mt-1">
              💡 Haz clic en cualquier recuadro para <strong>copiar el valor</strong> al portapapeles, o presiona <strong>Editar</strong> para modificar cualquier campo (incluyendo los datos del cónyuge o ingresos).
            </p>
          </div>
        </div>
      </div>

      {submitError && (
        <div className="alert alert-danger flex items-center gap-2">
          <AlertCircle size={20} />
          <span>Error al guardar los datos: {submitError}</span>
        </div>
      )}

      <div className="review-phases-list">
        {formFlow.phases.map((phase) => {
          if (phase.id === 0 || phase.id === 8 || !phase.fields || phase.fields.length === 0) {
            return null;
          }

          // Fase 2: Datos del Cónyuge (Preguntas 16-21 integradas)
          if (phase.id === 2) {
            return (
              <div key={phase.id} className="phase-review-card glass-panel mb-6">
                <div className="phase-card-header flex flex-wrap justify-between items-center gap-2 border-b pb-3">
                  <div>
                    <h3 className="phase-review-title">
                      Sección {phase.id} — {phase.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {conyugeApplies
                        ? `Activo por Estado Civil: ${formData.casado}`
                        : `Estado Civil seleccionado: ${formData.casado || "SOLTERO"} (Sección opcional / condicional)`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!conyugeApplies && !editingRowId && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs"
                        onClick={() => setExpandConyugeOverride((prev) => !prev)}
                      >
                        {showConyugeFields ? (
                          <>
                            <ChevronUp size={14} /> Ocultar campos de cónyuge
                          </>
                        ) : (
                          <>
                            <ChevronDown size={14} /> Ver / Editar campos de cónyuge
                          </>
                        )}
                      </button>
                    )}
                    {conyugeApplies && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs"
                        onClick={() => setCurrentStep(phase.id)}
                      >
                        Ir a esta sección en el asistente
                      </button>
                    )}
                  </div>
                </div>

                {showConyugeFields && (
                  <div className="phase-card-body pt-4">
                    {phase.fields.map((fieldId) => renderFieldCard(fieldId))}
                  </div>
                )}
              </div>
            );
          }

          // Fase 5: Situación Laboral e Ingresos
          if (phase.id === 5) {
            const visibleIncomeFields = phase.fields.filter((fKey) => {
              if (showAllIncomeFields || editingRowId) return true;
              if (fKey === "ingresosNetosMensuales") return true;
              const schema = fieldSchema[fKey];
              if (typeof schema?.condition === "function") {
                return schema.condition(formData);
              }
              return true;
            });

            return (
              <div key={phase.id} className="phase-review-card glass-panel mb-6">
                <div className="phase-card-header flex flex-wrap justify-between items-center gap-2 border-b pb-3">
                  <div>
                    <h3 className="phase-review-title">
                      Sección {phase.id} — {phase.title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Esquema seleccionado: <strong>{formData.situacionLaboral || "SIN SELECCIONAR"}</strong> · Neto mensual calculado: <strong>${computeIngresosNetos(formData) || "0"}</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={() => setShowAllIncomeFields((prev) => !prev)}
                    >
                      {showAllIncomeFields
                        ? "Mostrar solo ingresos aplicables"
                        : "Ver todas las columnas de ingreso"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={() => setCurrentStep(phase.id)}
                    >
                      Volver a esta sección
                    </button>
                  </div>
                </div>

                <div className="phase-card-body pt-4">
                  {visibleIncomeFields.map((fieldId) => renderFieldCard(fieldId))}
                </div>
              </div>
            );
          }

          return (
            <div key={phase.id} className="phase-review-card glass-panel mb-6">
              <div className="phase-card-header flex justify-between items-center border-b pb-3">
                <h3 className="phase-review-title">
                  Sección {phase.id} — {phase.title}
                </h3>
                <button
                  type="button"
                  className="btn btn-secondary btn-xs"
                  onClick={() => setCurrentStep(phase.id)}
                >
                  Volver a esta sección
                </button>
              </div>

              <div className="phase-card-body pt-4">
                {phase.fields.map((fieldId) => renderFieldCard(fieldId))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="submit-actions flex flex-col items-center justify-center mt-8 py-6 border-t gap-4">
        <div className="flex gap-4 flex-wrap justify-center">
          <button
            type="button"
            onClick={() => setCurrentStep(editingRowId ? -1 : 7)}
            className="btn btn-secondary btn-large"
            disabled={isSubmitting}
          >
            {editingRowId ? "Volver al Listado" : "Atrás"}
          </button>

          <button
            id="confirm-submit-btn"
            type="button"
            onClick={onSubmit}
            className="btn btn-primary btn-large flex items-center gap-2"
            disabled={isSubmitting}
          >
            <Send size={18} />
            <span>
              {isSubmitting
                ? "Guardando en Google Sheets..."
                : editingRowId
                ? `Guardar Cambios en Fila #${editingRowId}`
                : "Confirmar y Enviar Solicitud"}
            </span>
          </button>
        </div>

        <div className="disclaimer text-xs text-gray-400 text-center max-w-lg mt-2">
          Al confirmar, los datos se registrarán en MAYÚSCULAS y formato exacto en la hoja{" "}
          <strong>SOL_CREDITO_ACTUAL_2026</strong> para la impresión de la solicitud{" "}
          <strong>CN-Solicitud Persona Fisica.pdf</strong>.
        </div>
      </div>
    </div>
  );
}
