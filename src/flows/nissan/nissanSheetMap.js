import { nissanFieldSchema } from "./nissanFieldSchema.js";

// Genera un mapeo dinámico desde las keys del formulario en el frontend
// hacia los cabeceros exactos esperados por el Google Sheet SOL_CREDITO_ACTUAL_2026.
export const nissanSheetMap = Object.keys(nissanFieldSchema).reduce((acc, key) => {
  acc[key] = nissanFieldSchema[key].sheetHeader;
  return acc;
}, {});

// Exportamos explícitamente el arreglo de cabeceros para validación rápida
export const nissanSheetHeaders = Object.values(nissanSheetMap);
