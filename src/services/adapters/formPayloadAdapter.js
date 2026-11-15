import { nissanSheetMap } from "../../flows/nissan/nissanSheetMap.js";
import {
  requiresConyugeSection,
  isAsalariado,
  isIndependiente,
  isPensionado,
  computeIngresosNetos
} from "../../flows/nissan/nissanFieldSchema.js";

const DATE_KEYS = new Set([
  "fechaNacimiento",
  "fechaNacimientoConyuge",
  "fechaIngresoEmpresa"
]);

const CONYUGE_KEYS = [
  "nombreConyuge",
  "apellidoPaternoConyuge",
  "apellidoMaternoConyuge",
  "fechaNacimientoConyuge",
  "entidadFederativaNacimientoConyuge",
  "nacionalidadConyuge"
];

/**
 * Formatea cualquier fecha de entrada (YYYY-MM-DD, ISO o D/M/YYYY) a DD/MM/YYYY.
 */
export const formatToDDMMYYYY = (val) => {
  if (!val) return "";
  const str = String(val).trim();
  if (!str) return "";

  // Caso YYYY-MM-DD o ISO
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
  }

  // Caso D/M/YYYY o DD/MM/YYYY
  const slashMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const day = slashMatch[1].padStart(2, "0");
    const month = slashMatch[2].padStart(2, "0");
    const year = slashMatch[3];
    return `${day}/${month}/${year}`;
  }

  return str.toUpperCase();
};

/**
 * Limpia espacios dobles y convierte texto a MAYÚSCULAS.
 */
export const cleanUpperText = (val) => {
  if (val === undefined || val === null) return "";
  return String(val)
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
};

/**
 * Convierte el estado local del formulario de React (camelCase)
 * a un payload estructurado utilizando los cabeceros exactos de SOL_CREDITO_ACTUAL_2026.
 */
export const formPayloadAdapter = (formData) => {
  const payload = {};

  // Evaluamos si debe enviarse la sección de cónyuge
  const showConyuge = requiresConyugeSection(formData.casado);
  const hasManualConyugeName = Boolean(cleanUpperText(formData.nombreConyuge));

  Object.keys(nissanSheetMap).forEach((key) => {
    const sheetHeader = nissanSheetMap[key];
    if (!sheetHeader) return;

    let rawVal = formData[key];

    if (DATE_KEYS.has(key)) {
      payload[sheetHeader] = formatToDDMMYYYY(rawVal);
    } else {
      payload[sheetHeader] = cleanUpperText(rawVal);
    }
  });

  // 1. Regla Condicional Sección 2 (Datos del Cónyuge - Cols 16 a 21):
  // Si seleccionó "Soltero" o "Viudo(a)" y no hay un nombre de cónyuge capturado manualmente,
  // enviar todas las columnas de cónyuge vacías (incluyendo NACIONALIDAD).
  if (!showConyuge && !hasManualConyugeName) {
    CONYUGE_KEYS.forEach((key) => {
      const header = nissanSheetMap[key];
      if (header) {
        payload[header] = "";
      }
    });
  }

  // 2. Regla Condicional Crítica Sección 5 (Situación Laboral e Ingresos - Cols 36, 37, 38, 39, 55, 56):
  const sit = formData.situacionLaboral;
  const netosCalculados = computeIngresosNetos(formData);

  if (isAsalariado(sit)) {
    payload["Ingreso Fijo"] = cleanUpperText(formData.ingresoFijo);
    payload["Ingreso Variable"] = cleanUpperText(formData.ingresoVariable);
    payload["Ingreso Cheques"] = "";
    payload["Ingresos netos mensuales"] = cleanUpperText(
      formData.ingresosNetosMensualesManual ? formData.ingresosNetosMensuales : netosCalculados
    );
    if (!payload["¿Eres propietario de negocio?"]) {
      payload["¿Eres propietario de negocio?"] = "NO";
    }
  } else if (isIndependiente(sit)) {
    payload["Ingreso Fijo"] = "";
    payload["Ingreso Variable"] = "";
    payload["Ingreso Cheques"] = cleanUpperText(formData.ingresoCheques);
    payload["Ingresos netos mensuales"] = cleanUpperText(
      formData.ingresosNetosMensualesManual ? formData.ingresosNetosMensuales : netosCalculados
    );
    if (!payload["¿Eres propietario de negocio?"]) {
      payload["¿Eres propietario de negocio?"] = "SÍ";
    }
    if (!payload["Nombre de tu Jefe Inmediato"]) {
      payload["Nombre de tu Jefe Inmediato"] = "NO APLICA";
    }
    if (!payload["¿Puesto de jefe inmediato?"]) {
      payload["¿Puesto de jefe inmediato?"] = "NO APLICA";
    }
  } else if (isPensionado(sit)) {
    payload["Ingreso Fijo"] = cleanUpperText(formData.ingresoFijo);
    payload["Ingreso Variable"] = "";
    payload["Ingreso Cheques"] = "";
    payload["Ingresos netos mensuales"] = cleanUpperText(
      formData.ingresosNetosMensualesManual ? formData.ingresosNetosMensuales : netosCalculados
    );
    if (!payload["¿Eres propietario de negocio?"]) {
      payload["¿Eres propietario de negocio?"] = "NO";
    }
    if (!payload["Nombre de tu Jefe Inmediato"]) {
      payload["Nombre de tu Jefe Inmediato"] = "NO APLICA";
    }
    if (!payload["¿Puesto de jefe inmediato?"]) {
      payload["¿Puesto de jefe inmediato?"] = "NO APLICA";
    }
  } else if (netosCalculados) {
    payload["Ingresos netos mensuales"] = cleanUpperText(netosCalculados);
  }

  return payload;
};
