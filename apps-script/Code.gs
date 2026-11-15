/**
 * Código de Google Apps Script para recibir datos del formulario de crédito (Nissan / Stellantis)
 * y guardarlos en la hoja de cálculo SOL_CREDITO_ACTUAL_2026 ("Respuestas de formulario 1").
 */

var ADMIN_PASSWORD = "stellantis2026";

// Cabeceros oficiales compatibles con SOL_CREDITO_ACTUAL_2026 (Nissan 71 preguntas + Stellantis)
var HEADERS_ORDER = [
  "Marca temporal",
  "Nombre(s) acreditado",
  "Apellido Paterno acreditado",
  "Apellido Materno acreditado",
  "Fecha de Nacimiento",
  "País de Nacimiento",
  "Entidad Federativa de nacimiento",
  "RFC",
  "CURP",
  "Régimen Fiscal",
  "Sexo",
  "Nacionalidad",
  "Número Celular",
  "Correo Electrónico",
  "Casado",
  "Nombre(s) conyuge",
  "Apellido Paterno conyuge",
  "Apellido Materno conyuge",
  "Fecha de nacimiento conyuge",
  "Entidad Federativa de nacimiento conyuge",
  "NACIONALIDAD",
  "¿La identificación que nos proporciona es alguna de las siguientes?",
  "No de Identificación",
  "Autoridad que lo expide identificacion",
  "¿El domicilio es el mismo que su IFE?¿Tiene dirección completa su Identificación?",
  "Calle (solo nombre)",
  "Numero exterior",
  "Numero interior",
  "¿Entre que calles esta su domicilio?",
  "Municipio ó Alcaldía",
  "Estado",
  "Código Postal",
  "Tipo de Residencia",
  "Años de vivir en su domicilio",
  "Teléfono de casa fijo o celular",
  "¿Tu situación laboral es actualmente?",
  "Ingreso Fijo",
  "Ingreso Variable",
  "Ingreso Cheques",
  "Calle trabajo (solo el nombre)",
  "Numero exterior trabajo",
  "Numero interior trabajo",
  "Colonia trabajo",
  "Municipio ó Alcaldía trabajo",
  "Estado trabajo",
  "Código Postal trabajo",
  "Teléfono de oficina y extensión ó directo",
  "Nombre de la Empresa ó Institución",
  "¿Pública ó privada?",
  "¿A que se dedica la empresa donde laboras?",
  "Fecha de ingreso a la empresa ó institución",
  "Antigüedad en el empleo, negocio ó jubilado ó pensionado años",
  "Nombre de tu Jefe Inmediato",
  "¿Puesto de jefe inmediato?",
  "¿Eres propietario de negocio?",
  "Ingresos netos mensuales",
  "Nombre (solo nombre) referencia 1",
  "Apellido Paterno (solo nombre) referencia 1",
  "Apellido Materno (solo nombre) referencia 1",
  "Parentesco ref 1",
  "Teléfono de la Referencia 1",
  "Nombre (solo nombre) referencia 2",
  "Apellido Paterno (solo nombre) referencia 2",
  "Apellido Materno (solo nombre) referencia 2",
  "Parentesco ref 2",
  "Teléfono de la Referencia 2",
  "Nombre (solo nombre) referencia 3",
  "Apellido Paterno (solo nombre) referencia 3",
  "Apellido Materno (solo nombre) referencia 3",
  "Parentesco ref 3",
  "Teléfono de la Referencia 3",
  "Colonia acreditado",
  "¿Qué puesto o actividad desempeñas en tu trabajo?",
  "Ciudad o Población",
  "Ocupacion de la referencia 1",
  "Ocupacion de la referencia 2",
  "Ocupacion de la referencia 3",
  "Compañia telefonica",
  "Timestamp"
];

function doGet(e) {
  try {
    var password = e && e.parameter && e.parameter.password;
    if (password !== ADMIN_PASSWORD) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: "No autorizado. Proporcione la contraseña correcta."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Respuestas de formulario 1") || ss.getActiveSheet();

    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();

    if (lastRow <= 1) {
      return ContentService.createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol);
    var values = dataRange.getValues();

    var records = [];
    for (var r = 0; r < values.length; r++) {
      var record = { rowId: r + 2 };
      for (var c = 0; c < headers.length; c++) {
        var headerName = headers[c].toString().trim();
        if (headerName) {
          record[headerName] = values[r][c];
        }
      }
      records.push(record);
    }

    return ContentService.createTextOutput(JSON.stringify(records))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function asegurarCabeceros(sheet) {
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var currentHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var normalizedExisting = currentHeaders.map(function(h) {
    return h.toString().trim().toLowerCase();
  });

  for (var i = 0; i < HEADERS_ORDER.length; i++) {
    var header = HEADERS_ORDER[i];
    if (normalizedExisting.indexOf(header.toLowerCase()) === -1) {
      lastCol++;
      sheet.getRange(1, lastCol).setValue(header);
      normalizedExisting.push(header.toLowerCase());
    }
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);

    var jsonString = e.postData.contents;
    var data = JSON.parse(jsonString);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Respuestas de formulario 1") ||
                ss.getSheetByName("Respuestas a formulario 1") ||
                ss.getSheetByName("Form Responses 1") ||
                ss.getSheetByName("Hoja 1") ||
                ss.getSheets()[0];

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS_ORDER);
    } else {
      asegurarCabeceros(sheet);
    }

    var lastCol = Math.max(sheet.getLastColumn(), 1);
    var sheetHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

    // Actualización explícita por rowId (panel de administración / edición)
    if (data.action === "update" && data.rowId) {
      if (data.password !== ADMIN_PASSWORD) {
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: "No autorizado. Proporcione la contraseña correcta."
        })).setMimeType(ContentService.MimeType.JSON);
      }

      var rowId = parseInt(data.rowId, 10);
      if (rowId >= 2 && rowId <= sheet.getLastRow()) {
        for (var i = 0; i < sheetHeaders.length; i++) {
          var headerName = sheetHeaders[i].toString().trim();
          var lowerHeader = headerName.toLowerCase();
          if (lowerHeader !== "timestamp" && lowerHeader !== "marca temporal") {
            var value = getValueFromData(data, headerName);
            if (value !== undefined) {
              if (typeof value === "string") {
                value = value.toUpperCase().trim();
              }
              sheet.getRange(rowId, i + 1).setValue(value);
            }
          }
        }

        return ContentService.createTextOutput(JSON.stringify({
          success: true,
          message: "Registro actualizado exitosamente",
          rowId: rowId
        })).setMimeType(ContentService.MimeType.JSON);
      } else {
        throw new Error("ID de fila inválido para actualización: " + rowId);
      }
    }

    // Inserción de nueva fila
    var row = [];
    for (var j = 0; j < sheetHeaders.length; j++) {
      var hName = sheetHeaders[j].toString().trim();
      var lowerH = hName.toLowerCase();
      if (lowerH === "timestamp" || lowerH === "marca temporal") {
        row.push(new Date());
      } else {
        var val = getValueFromData(data, hName);
        if (val !== undefined && typeof val === "string") {
          val = val.toUpperCase().trim();
        }
        row.push(val !== undefined ? val : "");
      }
    }

    sheet.appendRow(row);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Registro guardado exitosamente",
      rowId: sheet.getLastRow(),
      action: "inserted"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function getValueFromData(data, headerName) {
  var normalizedHeader = headerName.toString().trim().normalize("NFC").toLowerCase();
  for (var key in data) {
    if (key.toString().trim().normalize("NFC").toLowerCase() === normalizedHeader) {
      return data[key];
    }
  }
  return undefined;
}

function doOptions(e) {
  return ContentService.createTextOutput("");
}
