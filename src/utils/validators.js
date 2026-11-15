/**
 * Funciones de validación para los campos de la solicitud Credi Nissan.
 */

export const validateField = (value, ruleSchema) => {
  if (!ruleSchema) return "";
  const { required, pattern, minLength, min, max, message } = ruleSchema;

  const stringVal = value !== undefined && value !== null ? String(value).trim() : "";

  if (required && !stringVal) {
    return message || "Este campo es obligatorio.";
  }

  if (stringVal) {
    if (minLength && stringVal.length < minLength) {
      return message || `Debe tener al menos ${minLength} caracteres.`;
    }

    if (min !== undefined && min !== null) {
      const numVal = Number(String(stringVal).replace(/[^0-9.-]/g, ""));
      if (isNaN(numVal) || numVal < min) {
        return message || `El valor mínimo permitido es ${min}.`;
      }
    }

    if (max !== undefined && max !== null) {
      const numVal = Number(String(stringVal).replace(/[^0-9.-]/g, ""));
      if (isNaN(numVal) || numVal > max) {
        return message || `El valor máximo permitido es ${max}.`;
      }
    }

    if (pattern && !pattern.test(stringVal)) {
      return message || "El formato ingresado no es válido.";
    }
  }

  return "";
};

export const validateRFC = (rfc) => {
  const pattern = /^[A-Z&Ññ]{4}[0-9]{6}[A-Z0-9]{3}$/i;
  return pattern.test(rfc);
};

export const validateCURP = (curp) => {
  const pattern = /^[A-Z]{4}[0-9]{6}[H,M][A-Z]{5}[A-Z0-9]{2}$/i;
  return pattern.test(curp);
};
