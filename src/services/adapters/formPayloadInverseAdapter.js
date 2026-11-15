import { nissanFieldSchema } from "../../flows/nissan/nissanFieldSchema.js";

const normalizeExact = (str) =>
  String(str || "")
    .normalize("NFC")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const normalizeNoAccents = (str) =>
  String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const inverseMapExact = {};
const inverseMapNoAccents = {};

Object.keys(nissanFieldSchema).forEach((key) => {
  const header = nissanFieldSchema[key].sheetHeader;
  if (header) {
    const exactKey = normalizeExact(header);
    const noAccentKey = normalizeNoAccents(header);

    if (!inverseMapExact[exactKey]) inverseMapExact[exactKey] = [];
    if (!inverseMapExact[exactKey].includes(key)) inverseMapExact[exactKey].push(key);

    if (!inverseMapNoAccents[noAccentKey]) inverseMapNoAccents[noAccentKey] = [];
    if (!inverseMapNoAccents[noAccentKey].includes(key)) inverseMapNoAccents[noAccentKey].push(key);
  }
});

// Alias adicionales para compatibilidad con registros históricos en SOL_CREDITO_ACTUAL_2026
const EXTRA_ALIASES = {
  "nombre(s) conyuge": ["nombreConyuge"],
  "apellido paterno conyuge": ["apellidoPaternoConyuge"],
  "apellido materno conyuge": ["apellidoMaternoConyuge"],
  "fecha de nacimiento conyuge": ["fechaNacimientoConyuge"],
  "entidad federativa de nacimiento conyuge": ["entidadFederativaNacimientoConyuge"],
  "nacionalidad conyu": ["nacionalidadConyuge"]
};

Object.keys(EXTRA_ALIASES).forEach((alias) => {
  const targetKeys = EXTRA_ALIASES[alias];
  if (!inverseMapExact[alias]) inverseMapExact[alias] = targetKeys;
  if (!inverseMapNoAccents[alias]) inverseMapNoAccents[alias] = targetKeys;
});

const DATE_FIELD_KEYS = new Set([
  "fechaNacimiento",
  "fechaNacimientoConyuge",
  "fechaIngresoEmpresa"
]);

/**
 * Convierte un registro obtenido de Google Sheets (SOL_CREDITO_ACTUAL_2026)
 * al estado local del formulario de React (camelCase).
 */
export const formPayloadInverseAdapter = (sheetData) => {
  const formData = {};

  if (!sheetData || typeof sheetData !== "object") {
    return formData;
  }

  Object.keys(sheetData).forEach((header) => {
    const exactHeader = normalizeExact(header);
    const noAccentHeader = normalizeNoAccents(header);
    const matchedKeys = inverseMapExact[exactHeader] || inverseMapNoAccents[noAccentHeader];

    if (matchedKeys && matchedKeys.length > 0) {
      let val = sheetData[header];

      if (val === undefined || val === null) {
        val = "";
      }

      if (typeof val === "number") {
        val = String(val);
      }

      matchedKeys.forEach((key) => {
        let processedVal = val;

        if (typeof processedVal === "string") {
          const trimmed = processedVal.trim();

          if (DATE_FIELD_KEYS.has(key)) {
            // Convertir D/M/YYYY o DD/MM/YYYY a YYYY-MM-DD para inputs tipo date
            if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
              const parts = trimmed.split("/");
              const day = parts[0].padStart(2, "0");
              const month = parts[1].padStart(2, "0");
              const year = parts[2];
              processedVal = `${year}-${month}-${day}`;
            } else if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
              processedVal = trimmed.substring(0, 10);
            } else {
              processedVal = trimmed;
            }
          } else {
            processedVal = trimmed.replace(/\s+/g, " ").toUpperCase();
            // Normalizar "SI" sin acento a "SÍ" para selects de Sí/No
            if (
              (key === "domicilioMismoIdentificacion" || key === "propietarioNegocio") &&
              processedVal === "SI"
            ) {
              processedVal = "SÍ";
            }
            if (key === "tipoEmpresaPublicaPrivada" && processedVal === "PUBLICA") {
              processedVal = "PÚBLICA";
            }
          }
        }

        if (processedVal !== "" || !formData[key]) {
          formData[key] = processedVal;
        }
      });
    }
  });

  return formData;
};
