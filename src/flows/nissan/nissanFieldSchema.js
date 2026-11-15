export const ESTADOS_MEXICO = [
  "AGUASCALIENTES",
  "BAJA CALIFORNIA",
  "BAJA CALIFORNIA SUR",
  "CAMPECHE",
  "CHIAPAS",
  "CHIHUAHUA",
  "CIUDAD DE MÉXICO",
  "COAHUILA",
  "COLIMA",
  "DURANGO",
  "ESTADO DE MÉXICO",
  "GUANAJUATO",
  "GUERRERO",
  "HIDALGO",
  "JALISCO",
  "MICHOACÁN",
  "MORELOS",
  "NAYARIT",
  "NUEVO LEÓN",
  "OAXACA",
  "PUEBLA",
  "QUERÉTARO",
  "QUINTANA ROO",
  "SAN LUIS POTOSÍ",
  "SINALOA",
  "SONORA",
  "TABASCO",
  "TAMAULIPAS",
  "TLAXCALA",
  "VERACRUZ",
  "YUCATÁN",
  "ZACATECAS"
];

export const ESTADOS_NACIMIENTO = [...ESTADOS_MEXICO, "NACÍ EN OTRO PAÍS"];

export const PARENTESCOS_SUGERIDOS = [
  "HERMANO(A)",
  "PADRE / MADRE",
  "HIJO(A)",
  "PRIMO(A)",
  "TÍO(A)",
  "CUÑADO(A)",
  "AMISTAD",
  "COMPAÑERO(A) DE TRABAJO",
  "VECINO(A)"
];

const normalizeStatus = (val) =>
  String(val || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();

export const requiresConyugeSection = (casadoVal) => {
  const norm = normalizeStatus(casadoVal);
  return (
    norm === "CASADO BIENES MANCOMUNADOS" ||
    norm === "CASADO BIENES SEPARADOS" ||
    norm === "UNION LIBRE"
  );
};

export const isAsalariado = (situacionVal) => {
  const norm = normalizeStatus(situacionVal);
  return norm === "ASALARIADO";
};

export const isIndependiente = (situacionVal) => {
  const norm = normalizeStatus(situacionVal);
  return norm === "INDEPENDIENTE";
};

export const isPensionado = (situacionVal) => {
  const norm = normalizeStatus(situacionVal);
  return norm.includes("PENSIONADO") || norm.includes("JUBILADO");
};

export const parseCurrencyNumber = (val) => {
  if (val === undefined || val === null || val === "") return 0;
  const cleaned = String(val).replace(/[^0-9.]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

export const computeIngresosNetos = (formData) => {
  const sit = formData?.situacionLaboral;
  if (isAsalariado(sit)) {
    const fijo = parseCurrencyNumber(formData.ingresoFijo);
    const variable = parseCurrencyNumber(formData.ingresoVariable);
    const total = fijo + variable;
    return total > 0 ? String(Math.round(total)) : (String(formData.ingresoFijo || "").trim());
  }
  if (isIndependiente(sit)) {
    const cheques = parseCurrencyNumber(formData.ingresoCheques);
    return cheques > 0 ? String(Math.round(cheques)) : (String(formData.ingresoCheques || "").trim());
  }
  if (isPensionado(sit)) {
    const fijo = parseCurrencyNumber(formData.ingresoFijo);
    return fijo > 0 ? String(Math.round(fijo)) : (String(formData.ingresoFijo || "").trim());
  }
  return String(formData?.ingresosNetosMensuales || "").trim();
};

const formatNombreCortesia = (formData) => {
  const raw = String(formData?.nombreAcreditado || "").trim();
  if (!raw) return "";
  const first = raw.split(/\s+/)[0];
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
};

export const nissanFieldSchema = {
  // =========================================================================
  // SECCIÓN 1: DATOS GENERALES DEL ACREDITADO (Preguntas 1 a 15)
  // =========================================================================
  nombreAcreditado: {
    questionNumber: 1,
    label: "Nombre(s) del acreditado",
    prompt: "Coloca de favor tu nombre o nombres solamente, los apellidos te los preguntaré en un momento más.",
    helperText: "Escribe únicamente tu nombre o nombres, sin apellidos.",
    type: "text",
    placeholder: "Ej. JUAN CARLOS",
    phase: 1,
    sheetHeader: "Nombre(s) acreditado",
    validation: {
      required: true,
      minLength: 2,
      message: "Por favor, ingresa tu nombre o nombres (mínimo 2 letras)."
    }
  },
  apellidoPaternoAcreditado: {
    questionNumber: 2,
    label: "Apellido Paterno",
    prompt: "¡Mucho gusto! Ahora dime, ¿cuál es tu primer apellido (apellido paterno)?",
    dynamicPrompt: (fd) => {
      const n = formatNombreCortesia(fd);
      return n
        ? `¡Mucho gusto ${n}! Ahora dime, ¿cuál es tu primer apellido (apellido paterno)?`
        : "¡Mucho gusto! Ahora dime, ¿cuál es tu primer apellido (apellido paterno)?";
    },
    helperText: "Tal como aparece en tu identificación oficial.",
    type: "text",
    placeholder: "Ej. HERNÁNDEZ",
    phase: 1,
    sheetHeader: "Apellido Paterno acreditado",
    validation: {
      required: true,
      minLength: 2,
      message: "Tu apellido paterno es obligatorio para la solicitud."
    }
  },
  apellidoMaternoAcreditado: {
    questionNumber: 3,
    label: "Apellido Materno",
    prompt: "Perfecto, ¿y cuál es tu segundo apellido (apellido materno)?",
    helperText: "Escribe únicamente tu apellido materno.",
    type: "text",
    placeholder: "Ej. GARCÍA",
    phase: 1,
    sheetHeader: "Apellido Materno acreditado",
    validation: {
      required: true,
      minLength: 2,
      message: "Tu apellido materno es obligatorio para la solicitud."
    }
  },
  fechaNacimiento: {
    questionNumber: 4,
    label: "Fecha de Nacimiento",
    prompt: "¿En qué fecha naciste?",
    helperText: "Selecciona o escribe tu día, mes y año de nacimiento.",
    type: "date",
    placeholder: "DD/MM/AAAA",
    phase: 1,
    sheetHeader: "Fecha de Nacimiento",
    validation: {
      required: true,
      message: "Por favor, indica tu fecha de nacimiento."
    }
  },
  paisNacimiento: {
    questionNumber: 5,
    label: "País de Nacimiento",
    prompt: "¿En qué país naciste?",
    helperText: "Ya dejamos seleccionado MÉXICO por defecto; si naciste en el extranjero, toca OTRA.",
    type: "select",
    placeholder: "Selecciona tu país de nacimiento",
    options: ["MEXICO", "OTRA"],
    quickSelect: true,
    defaultValue: "MEXICO",
    phase: 1,
    sheetHeader: "País de Nacimiento",
    validation: {
      required: true,
      message: "Selecciona tu país de nacimiento."
    }
  },
  entidadFederativaNacimiento: {
    questionNumber: 6,
    label: "Entidad Federativa de Nacimiento",
    prompt: "¿Y en qué estado de la República naciste?",
    helperText: "Elige el estado donde fuiste registrado al nacer (o 'NACÍ EN OTRO PAÍS').",
    type: "select",
    placeholder: "Selecciona el estado donde naciste",
    options: ESTADOS_NACIMIENTO,
    phase: 1,
    sheetHeader: "Entidad Federativa de nacimiento",
    validation: {
      required: true,
      message: "Selecciona tu entidad federativa de nacimiento."
    }
  },
  rfc: {
    questionNumber: 7,
    label: "RFC con Homoclave",
    prompt: "Ahora necesito tu RFC con homoclave, ¿me lo compartes?",
    helperText: "Son 13 caracteres: 4 letras, 6 números de tu fecha de nacimiento y 3 dígitos de homoclave (ej. HEGJ850115AB1).",
    type: "text",
    placeholder: "Ej. HEGJ850115AB1",
    phase: 1,
    sheetHeader: "RFC",
    validation: {
      required: true,
      pattern: /^[A-Z&Ññ]{4}[0-9]{6}[A-Z0-9]{3}$/i,
      message: "El RFC debe tener exactamente 13 caracteres (4 letras, 6 números y 3 de homoclave)."
    }
  },
  curp: {
    questionNumber: 8,
    label: "CURP",
    prompt: "¡Excelente! ¿Cuál es tu clave CURP?",
    helperText: "Son los 18 caracteres alfanuméricos que aparecen al frente de tu INE.",
    type: "text",
    placeholder: "Ej. HEGJ850115HDFRRA01",
    phase: 1,
    sheetHeader: "CURP",
    validation: {
      required: true,
      pattern: /^[A-Z]{4}[0-9]{6}[H,M][A-Z]{5}[A-Z0-9]{2}$/i,
      message: "La CURP debe tener exactamente 18 caracteres con formato oficial válido."
    }
  },
  regimenFiscal: {
    questionNumber: 9,
    label: "Régimen Fiscal",
    prompt: "¿Cómo estás dado de alta ante el SAT?",
    helperText: "Elige 'FISICA' si eres empleado/asalariado, o 'FISICA CON ACTIVIDAD EMPRESARIAL' si tienes negocio propio o facturas.",
    type: "select",
    placeholder: "Selecciona tu régimen fiscal",
    options: ["FISICA", "FISICA CON ACTIVIDAD EMPRESARIAL"],
    quickSelect: true,
    phase: 1,
    sheetHeader: "Régimen Fiscal",
    validation: {
      required: true,
      message: "Selecciona tu régimen fiscal."
    }
  },
  sexo: {
    questionNumber: 10,
    label: "Sexo",
    prompt: "¿Cuál es tu sexo según aparece en tu identificación?",
    helperText: "Toca una opción para continuar.",
    type: "select",
    placeholder: "Selecciona una opción",
    options: ["HOMBRE", "MUJER"],
    quickSelect: true,
    phase: 1,
    sheetHeader: "Sexo",
    validation: {
      required: true,
      message: "Por favor selecciona una opción."
    }
  },
  nacionalidad: {
    questionNumber: 11,
    label: "Nacionalidad",
    prompt: "¿Cuál es tu nacionalidad?",
    helperText: "Ya está prellenada como MEXICANA; solo cámbiala si tienes otra.",
    type: "text",
    placeholder: "MEXICANA",
    defaultValue: "MEXICANA",
    phase: 1,
    sheetHeader: "Nacionalidad",
    validation: {
      required: true,
      minLength: 3,
      message: "Indica tu nacionalidad."
    }
  },
  numeroCelular: {
    questionNumber: 12,
    label: "Número de Celular",
    prompt: "¿A qué número celular te podemos contactar?",
    dynamicPrompt: (fd) => {
      const n = formatNombreCortesia(fd);
      return n
        ? `${n}, ¿a qué número celular te podemos contactar?`
        : "¿A qué número celular te podemos contactar?";
    },
    helperText: "Ingresa los 10 dígitos seguidos, sin espacios ni guiones.",
    type: "tel",
    placeholder: "Ej. 5512345678",
    phase: 1,
    sheetHeader: "Número Celular",
    validation: {
      required: true,
      pattern: /^[0-9]{10}$/,
      message: "El número celular debe contener exactamente 10 dígitos numéricos."
    }
  },
  companiaTelefonica: {
    questionNumber: 13,
    label: "Compañía Telefónica",
    prompt: "¿De qué compañía es tu línea celular?",
    helperText: "Selecciona tu operador telefónico actual.",
    type: "select",
    placeholder: "Selecciona tu compañía",
    options: ["TELCEL", "AT&T", "MOVISTAR", "BAIT", "ALTAN / OTRA"],
    quickSelect: true,
    phase: 1,
    sheetHeader: "Compañia telefonica",
    validation: {
      required: true,
      message: "Selecciona tu compañía telefónica."
    }
  },
  correoElectronico: {
    questionNumber: 14,
    label: "Correo Electrónico",
    prompt: "¿Cuál es tu correo electrónico personal?",
    helperText: "Asegúrate de que esté bien escrito para enviarte cualquier avance.",
    type: "email",
    placeholder: "ejemplo@correo.com",
    phase: 1,
    sheetHeader: "Correo Electrónico",
    validation: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "Ingresa un correo electrónico válido (ejemplo@dominio.com)."
    }
  },
  casado: {
    questionNumber: 15,
    label: "Estado Civil",
    prompt: "Para cerrar tus datos generales, ¿cuál es tu estado civil actual?",
    helperText: "Si eres Casado(a) o vives en Unión Libre, enseguida te pediré unos datos rápidos de tu pareja.",
    type: "select",
    placeholder: "Selecciona tu estado civil",
    options: [
      "SOLTERO",
      "CASADO BIENES MANCOMUNADOS",
      "CASADO BIENES SEPARADOS",
      "UNIÓN LIBRE",
      "VIUDO(A)"
    ],
    quickSelect: true,
    phase: 1,
    sheetHeader: "Casado",
    validation: {
      required: true,
      message: "Selecciona tu estado civil."
    }
  },

  // =========================================================================
  // SECCIÓN 2: DATOS DEL CÓNYUGE (Preguntas 16 a 21 — Condicional)
  // =========================================================================
  nombreConyuge: {
    questionNumber: 16,
    label: "Nombre(s) del Cónyuge",
    prompt: "¿Cuál es el nombre o nombres de pila de tu cónyuge o pareja (sin apellidos)?",
    dynamicPrompt: (fd) => {
      const n = formatNombreCortesia(fd);
      return n
        ? `Perfecto ${n}, ¿cuál es el nombre o nombres de pila de tu cónyuge o pareja (sin apellidos)?`
        : "¿Cuál es el nombre o nombres de pila de tu cónyuge o pareja (sin apellidos)?";
    },
    helperText: "Escribe únicamente su(s) nombre(s). Sus apellidos los capturaremos en los siguientes pasos.",
    type: "text",
    placeholder: "Ej. MARÍA ELENA",
    phase: 2,
    sheetHeader: "Nombre(s) conyuge",
    condition: (formData) => requiresConyugeSection(formData?.casado),
    validation: {
      required: true,
      minLength: 2,
      message: "Ingresa el nombre(s) de tu cónyuge."
    }
  },
  apellidoPaternoConyuge: {
    questionNumber: 17,
    label: "Apellido Paterno del Cónyuge",
    prompt: "¿Cuál es el primer apellido (Apellido Paterno) de tu cónyuge?",
    helperText: "Escribe solo su apellido paterno.",
    type: "text",
    placeholder: "Ej. LÓPEZ",
    phase: 2,
    sheetHeader: "Apellido Paterno conyuge",
    condition: (formData) => requiresConyugeSection(formData?.casado),
    validation: {
      required: true,
      minLength: 2,
      message: "Ingresa el apellido paterno de tu cónyuge."
    }
  },
  apellidoMaternoConyuge: {
    questionNumber: 18,
    label: "Apellido Materno del Cónyuge",
    prompt: "¿Cuál es el segundo apellido (Apellido Materno) de tu cónyuge?",
    helperText: "Escribe solo su apellido materno.",
    type: "text",
    placeholder: "Ej. MARTÍNEZ",
    phase: 2,
    sheetHeader: "Apellido Materno conyuge",
    condition: (formData) => requiresConyugeSection(formData?.casado),
    validation: {
      required: true,
      minLength: 2,
      message: "Ingresa el apellido materno de tu cónyuge."
    }
  },
  fechaNacimientoConyuge: {
    questionNumber: 19,
    label: "Fecha de Nacimiento del Cónyuge",
    prompt: "¿Cuál es la fecha de nacimiento de tu cónyuge?",
    helperText: "Selecciona su día, mes y año de nacimiento (DD/MM/AAAA).",
    type: "date",
    placeholder: "DD/MM/AAAA",
    phase: 2,
    sheetHeader: "Fecha de nacimiento conyuge",
    condition: (formData) => requiresConyugeSection(formData?.casado),
    validation: {
      required: true,
      message: "Indica la fecha de nacimiento de tu cónyuge."
    }
  },
  entidadFederativaNacimientoConyuge: {
    questionNumber: 20,
    label: "Entidad de Nacimiento del Cónyuge",
    prompt: "¿En qué estado de la República nació tu cónyuge?",
    helperText: "Selecciona la entidad federativa donde nació tu cónyuge.",
    type: "select",
    placeholder: "Selecciona el estado de nacimiento",
    options: ESTADOS_NACIMIENTO,
    phase: 2,
    sheetHeader: "Entidad Federativa de nacimiento conyuge",
    condition: (formData) => requiresConyugeSection(formData?.casado),
    validation: {
      required: true,
      message: "Selecciona el estado de nacimiento de tu cónyuge."
    }
  },
  nacionalidadConyuge: {
    questionNumber: 21,
    label: "Nacionalidad del Cónyuge",
    prompt: "¿Cuál es la nacionalidad de tu cónyuge?",
    helperText: "Por defecto está prellenada como MEXICANA.",
    type: "text",
    placeholder: "MEXICANA",
    defaultValue: "MEXICANA",
    phase: 2,
    sheetHeader: "NACIONALIDAD",
    condition: (formData) => requiresConyugeSection(formData?.casado),
    validation: {
      required: true,
      minLength: 3,
      message: "Indica la nacionalidad de tu cónyuge."
    }
  },

  // =========================================================================
  // SECCIÓN 3: IDENTIFICACIÓN OFICIAL (Preguntas 22 a 23)
  // =========================================================================
  tipoIdentificacion: {
    questionNumber: 22,
    label: "Identificación Oficial",
    prompt: "¿Cuál es la identificación oficial vigente que nos proporcionas?",
    dynamicPrompt: (fd) => {
      const n = formatNombreCortesia(fd);
      return n
        ? `Muy bien ${n}, ¿cuál es la identificación oficial vigente que nos proporcionas?`
        : "¿Cuál es la identificación oficial vigente que nos proporcionas?";
    },
    helperText: "Selecciona el documento oficial que presentarás para tu trámite.",
    type: "select",
    placeholder: "Selecciona tu identificación",
    options: [
      "IFE Ó INE",
      "PASAPORTE",
      "FM3 CON RESIDENCIA PERMANENTE (EN CASO DE EXTRANJEROS)"
    ],
    quickSelect: true,
    defaultValue: "IFE Ó INE",
    phase: 3,
    sheetHeader: "¿La identificación que nos proporciona es alguna de las siguientes?",
    validation: {
      required: true,
      message: "Selecciona el tipo de identificación oficial."
    }
  },
  domicilioMismoIdentificacion: {
    questionNumber: 23,
    label: "¿Domicilio igual a tu INE/IFE?",
    prompt: "¿Tu domicilio actual es el mismo que aparece en tu INE/IFE y viene con la dirección completa?",
    helperText: "Elige 'SÍ' si vives en la misma dirección impresa en tu credencial, o 'NO' si cambiaste de domicilio o tu INE no trae calle/número.",
    type: "select",
    placeholder: "Selecciona Sí o No",
    options: ["SÍ", "NO"],
    quickSelect: true,
    phase: 3,
    sheetHeader: "¿El domicilio es el mismo que su IFE?¿Tiene dirección completa su Identificación?",
    validation: {
      required: true,
      message: "Indica si el domicilio coincide con tu identificación."
    }
  },

  // =========================================================================
  // SECCIÓN 4: DOMICILIO PARTICULAR DEL ACREDITADO (Preguntas 24 a 35)
  // =========================================================================
  calle: {
    questionNumber: 24,
    label: "Calle del Domicilio",
    prompt: "Pasemos a tu domicilio actual. ¿Cuál es el nombre de tu calle, avenida o cerrada?",
    dynamicPrompt: (fd) => {
      const n = formatNombreCortesia(fd);
      return n
        ? `${n}, pasemos a tu domicilio actual. ¿Cuál es el nombre de tu calle, avenida o cerrada?`
        : "Pasemos a tu domicilio actual. ¿Cuál es el nombre de tu calle, avenida o cerrada?";
    },
    helperText: "Escribe únicamente el nombre de la calle o avenida, sin el número exterior ni interior.",
    type: "text",
    placeholder: "Ej. AV. INSURGENTES SUR",
    phase: 4,
    sheetHeader: "Calle (solo nombre)",
    validation: {
      required: true,
      minLength: 2,
      message: "El nombre de la calle es obligatorio."
    }
  },
  numeroExterior: {
    questionNumber: 25,
    label: "Número Exterior",
    prompt: "¿Cuál es el número exterior de tu domicilio?",
    helperText: "Si no tiene número, escribe S/N o el lote/manzana correspondiente (ej. 124, MZA 1).",
    type: "text",
    placeholder: "Ej. 124 o S/N",
    phase: 4,
    sheetHeader: "Numero exterior",
    validation: {
      required: true,
      message: "El número exterior es obligatorio."
    }
  },
  numeroInterior: {
    questionNumber: 26,
    label: "Número Interior / Depto",
    prompt: "¿Tienes número interior, departamento o lote? (Opcional)",
    helperText: "Si vives en casa sola y no aplica, puedes dejarlo vacío y presionar Enviar.",
    type: "text",
    placeholder: "Ej. DEPTO 302 (dejar vacío si no aplica)",
    phase: 4,
    sheetHeader: "Numero interior",
    validation: {
      required: false
    }
  },
  coloniaAcreditado: {
    questionNumber: 27,
    label: "Colonia o Fraccionamiento",
    prompt: "¿En qué colonia, fraccionamiento o urbanización se ubica tu domicilio?",
    helperText: "Tal como aparece en tu comprobante de domicilio.",
    type: "text",
    placeholder: "Ej. DEL VALLE CENTRO",
    phase: 4,
    sheetHeader: "Colonia acreditado",
    validation: {
      required: true,
      minLength: 2,
      message: "La colonia es obligatoria."
    }
  },
  entreCallesDomicilio: {
    questionNumber: 28,
    label: "¿Entre qué calles está tu domicilio?",
    prompt: "¿Entre qué calles se encuentra ubicado tu domicilio?",
    helperText: "Menciona las dos calles que cruzan o colindan con tu cuadra (ej. ENTRE EJE 5 Y PILARES).",
    type: "text",
    placeholder: "Ej. ENTRE MATÍAS ROMERO Y PILARES",
    phase: 4,
    sheetHeader: "¿Entre que calles esta su domicilio?",
    validation: {
      required: true,
      minLength: 2,
      message: "Por favor indica entre qué calles se ubica tu domicilio."
    }
  },
  municipioAlcaldia: {
    questionNumber: 29,
    label: "Municipio o Alcaldía",
    prompt: "¿A qué Municipio o Alcaldía pertenece tu domicilio?",
    helperText: "Ejemplo: BENITO JUÁREZ, NAUCALPAN DE JUÁREZ, GUADALAJARA, etc.",
    type: "text",
    placeholder: "Ej. BENITO JUÁREZ",
    phase: 4,
    sheetHeader: "Municipio ó Alcaldía",
    validation: {
      required: true,
      minLength: 2,
      message: "El municipio o alcaldía es obligatorio."
    }
  },
  ciudadPoblacion: {
    questionNumber: 30,
    label: "Ciudad o Población",
    prompt: "¿En qué Ciudad o Población vives?",
    helperText: "Ejemplo: CIUDAD DE MÉXICO, MONTERREY, PUEBLA, TOLUCA, etc.",
    type: "text",
    placeholder: "Ej. CIUDAD DE MÉXICO",
    phase: 4,
    sheetHeader: "Ciudad o Población",
    validation: {
      required: true,
      minLength: 2,
      message: "La ciudad o población es obligatoria."
    }
  },
  estado: {
    questionNumber: 31,
    label: "Estado del Domicilio",
    prompt: "¿En qué Estado de la República se encuentra tu domicilio?",
    helperText: "Selecciona el estado donde vives actualmente.",
    type: "select",
    placeholder: "Selecciona el estado de tu domicilio",
    options: ESTADOS_MEXICO,
    phase: 4,
    sheetHeader: "Estado",
    validation: {
      required: true,
      message: "Selecciona el estado de tu domicilio."
    }
  },
  codigoPostal: {
    questionNumber: 32,
    label: "Código Postal (C.P.)",
    prompt: "¿Cuál es el Código Postal (5 dígitos) de tu domicilio?",
    helperText: "Verifica que coincida con tu comprobante de domicilio.",
    type: "text",
    placeholder: "Ej. 03100",
    phase: 4,
    sheetHeader: "Código Postal",
    validation: {
      required: true,
      pattern: /^[0-9]{5}$/,
      message: "El código postal debe tener exactamente 5 dígitos numéricos."
    }
  },
  tipoResidencia: {
    questionNumber: 33,
    label: "Tipo de Vivienda / Residencia",
    prompt: "La vivienda donde habitas actualmente es:",
    helperText: "Selecciona la opción que mejor describa tu vivienda actual.",
    type: "select",
    placeholder: "Selecciona el tipo de residencia",
    options: ["PROPIA", "RENTADA", "HIPOTECA", "DE FAMILIARES"],
    quickSelect: true,
    phase: 4,
    sheetHeader: "Tipo de Residencia",
    validation: {
      required: true,
      message: "Selecciona el tipo de residencia."
    }
  },
  anosVivirDomicilio: {
    questionNumber: 34,
    label: "Años de vivir en el domicilio",
    prompt: "¿Cuántos años llevas viviendo en este domicilio?",
    helperText: "Si llevas menos de 1 año completo, coloca 1. Ingresa un número entre 1 y 70.",
    type: "number",
    placeholder: "Ej. 5",
    phase: 4,
    sheetHeader: "Años de vivir en su domicilio",
    validation: {
      required: true,
      min: 1,
      max: 70,
      message: "Ingresa cuántos años llevas viviendo ahí (entre 1 y 70)."
    }
  },
  telefonoCasaFijo: {
    questionNumber: 35,
    label: "Teléfono de Casa o Recados",
    prompt: "¿Cuál es tu teléfono de casa o número de recados (10 dígitos)?",
    helperText: "Si no tienes línea fija en casa, puedes repetir tu número celular a 10 dígitos.",
    type: "tel",
    placeholder: "Ej. 5555432100",
    phase: 4,
    sheetHeader: "Teléfono de casa fijo o celular",
    validation: {
      required: true,
      pattern: /^[0-9]{10}$/,
      message: "Ingresa un número telefónico válido de 10 dígitos."
    }
  },

  // =========================================================================
  // SECCIÓN 5: SITUACIÓN LABORAL E INGRESOS (Pregunta 36 + Ingresos Condicionales)
  // =========================================================================
  situacionLaboral: {
    questionNumber: 36,
    label: "Situación Laboral Actual",
    prompt: "¿Cuál es tu situación laboral actualmente?",
    dynamicPrompt: (fd) => {
      const n = formatNombreCortesia(fd);
      return n
        ? `¡Vas excelente ${n}! ¿Cuál es tu situación laboral actualmente?`
        : "¿Cuál es tu situación laboral actualmente?";
    },
    helperText: "• ASALARIADO: Compruebas ingresos con recibos de nómina.\n• INDEPENDIENTE: Negocio propio, profesionista o estados de cuenta bancarios.\n• PENSIONADO Ó JUBILADO: Recibes pensión mensual.",
    type: "select",
    placeholder: "Selecciona tu situación laboral",
    options: ["ASALARIADO", "INDEPENDIENTE", "PENSIONADO Ó JUBILADO"],
    quickSelect: true,
    phase: 5,
    sheetHeader: "¿Tu situación laboral es actualmente?",
    validation: {
      required: true,
      message: "Selecciona tu situación laboral actual."
    }
  },
  ingresoFijo: {
    questionNumber: "36.1",
    label: "Ingreso Fijo Mensual Neto ($)",
    prompt: "¿Cuál es tu Sueldo Fijo Mensual Neto (libre de impuestos, comprobable en nómina o pensión)?",
    dynamicPrompt: (formData) =>
      isPensionado(formData?.situacionLaboral)
        ? "¿Cuál es el monto mensual neto de tu Pensión o Jubilación (en pesos, sin centavos)?"
        : "¿Cuál es tu Sueldo Fijo Mensual Neto (libre de impuestos, comprobable en recibos de nómina)?",
    helperText: "Escribe solo números (ejemplo: 25000). Se registrará en la casilla 'Fijo: $' de la solicitud Nissan.",
    type: "number",
    placeholder: "Ej. 25000",
    phase: 5,
    sheetHeader: "Ingreso Fijo",
    condition: (formData) =>
      isAsalariado(formData?.situacionLaboral) || isPensionado(formData?.situacionLaboral),
    validation: {
      required: true,
      min: 1,
      message: "Por favor indica tu ingreso fijo mensual neto."
    }
  },
  ingresoVariable: {
    questionNumber: "36.2",
    label: "Ingreso Variable Mensual ($)",
    prompt: "¿Percibes algún Ingreso Variable Mensual adicional (comisiones o bonos)?",
    helperText: "Si no percibes comisiones ni bonos variables, escribe 0 o déjalo vacío y presiona Enviar.",
    type: "number",
    placeholder: "Ej. 5000 (o 0 si no aplica)",
    phase: 5,
    sheetHeader: "Ingreso Variable",
    condition: (formData) => isAsalariado(formData?.situacionLaboral),
    validation: {
      required: false
    }
  },
  ingresoCheques: {
    questionNumber: "36.3",
    label: "Ingreso Mensual en Cheques / Ahorro ($)",
    prompt: "¿Cuál es tu Ingreso Mensual promedio en Cheques o Ahorro (según tus estados de cuenta o declaración)?",
    helperText: "Escribe el promedio mensual de depósitos en tus estados de cuenta bancarios (solo números, ej. 35000).",
    type: "number",
    placeholder: "Ej. 35000",
    phase: 5,
    sheetHeader: "Ingreso Cheques",
    condition: (formData) => isIndependiente(formData?.situacionLaboral),
    validation: {
      required: true,
      min: 1,
      message: "Por favor indica tu ingreso mensual promedio comprobable en estados de cuenta."
    }
  },
  ingresosNetosMensuales: {
    questionNumber: "36.4",
    label: "Ingresos Netos Mensuales Totales ($)",
    prompt: "Total de Ingresos Netos Mensuales Comprobables:",
    helperText: "Se calcula automáticamente (Ingreso Fijo + Variable para asalariados, o Ingreso Cheques para independientes).",
    type: "number",
    placeholder: "Ej. 30000",
    phase: 5,
    hidden: true, // Se calcula automáticamente durante la captura y es editable en Revisión/Edición
    sheetHeader: "Ingresos netos mensuales",
    validation: {
      required: false
    }
  },

  // =========================================================================
  // SECCIÓN 6: DATOS Y DOMICILIO DEL EMPLEO O NEGOCIO (Preguntas 37 a 53)
  // =========================================================================
  nombreEmpresa: {
    questionNumber: 37,
    label: "Nombre de la Empresa, Institución o Negocio",
    prompt: "¿Cuál es el nombre de la Empresa, Institución o Negocio donde trabajas?",
    dynamicPrompt: (fd) => {
      const n = formatNombreCortesia(fd);
      return n
        ? `${n}, ¿cuál es el nombre de la Empresa, Institución o Negocio donde trabajas?`
        : "¿Cuál es el nombre de la Empresa, Institución o Negocio donde trabajas?";
    },
    helperText: "Nota: Si eres persona física con actividad empresarial o independiente sin nombre comercial, escribe tu propio nombre completo.",
    type: "text",
    placeholder: "Ej. NISSAN MEXICANA S.A. DE C.V. (o tu nombre si eres independiente)",
    phase: 6,
    sheetHeader: "Nombre de la Empresa ó Institución",
    validation: {
      required: true,
      minLength: 2,
      message: "Ingresa el nombre de la empresa, institución o negocio."
    }
  },
  tipoEmpresaPublicaPrivada: {
    questionNumber: 38,
    label: "¿Empresa Pública o Privada?",
    prompt: "¿La empresa o institución donde laboras es Pública (gobierno) o Privada?",
    helperText: "Si tienes negocio propio o trabajas en iniciativa privada, selecciona PRIVADA.",
    type: "select",
    placeholder: "Selecciona Pública o Privada",
    options: ["PRIVADA", "PÚBLICA"],
    quickSelect: true,
    defaultValue: "PRIVADA",
    phase: 6,
    sheetHeader: "¿Pública ó privada?",
    validation: {
      required: true,
      message: "Selecciona si es empresa pública o privada."
    }
  },
  puestoActividad: {
    questionNumber: 39,
    label: "Puesto o Actividad que desempeñas",
    prompt: "¿Qué puesto tienes o qué actividad física/profesional desempeñas en tu trabajo?",
    helperText: "Ejemplo: GERENTE DE VENTAS, CONTADOR, COMERCIANTE, MÉDICO, INGENIERO DE PLANTA, JUBILADO, etc.",
    type: "text",
    placeholder: "Ej. COORDINADOR DE LOGÍSTICA / COMERCIANTE",
    phase: 6,
    sheetHeader: "¿Qué puesto o actividad desempeñas en tu trabajo?",
    validation: {
      required: true,
      minLength: 2,
      message: "Indica el puesto o actividad que desempeñas."
    }
  },
  giroEmpresa: {
    questionNumber: 40,
    label: "Giro o Actividad de la Empresa",
    prompt: "¿A qué se dedica la empresa o negocio donde trabajas (cuál es su giro específico)?",
    helperText: "Ejemplo: AUTOMOTRIZ, SERVICIOS DE SALUD, COMERCIO DE ALIMENTOS, CONSTRUCCIÓN, EDUCACIÓN, etc.",
    type: "text",
    placeholder: "Ej. COMERCIALIZACIÓN DE AUTOPARTES / SERVICIOS MÉDICOS",
    phase: 6,
    sheetHeader: "¿A que se dedica la empresa donde laboras?",
    validation: {
      required: true,
      minLength: 2,
      message: "Indica el giro o actividad específica de la empresa."
    }
  },
  fechaIngresoEmpresa: {
    questionNumber: 41,
    label: "Fecha de Ingreso al Empleo / Inicio del Negocio",
    prompt: "¿En qué fecha ingresaste a este empleo o iniciaste operaciones en tu negocio?",
    helperText: "Si no recuerdas el día exacto, puedes poner el día 01 del mes y año en que iniciaste (formato DD/MM/AAAA).",
    type: "date",
    placeholder: "DD/MM/AAAA",
    phase: 6,
    sheetHeader: "Fecha de ingreso a la empresa ó institución",
    validation: {
      required: true,
      message: "Indica la fecha de ingreso a tu empleo o inicio de tu negocio."
    }
  },
  antiguedadEmpleoAnos: {
    questionNumber: 42,
    label: "Antigüedad Laboral (en años)",
    prompt: "¿Cuántos años de antigüedad tienes en este empleo, negocio o como jubilado/pensionado?",
    helperText: "Calculamos automáticamente los años según tu fecha de ingreso; puedes confirmarlo o ajustarlo (de 1 a 40 años).",
    type: "number",
    placeholder: "Ej. 4",
    phase: 6,
    sheetHeader: "Antigüedad en el empleo, negocio ó jubilado ó pensionado años",
    validation: {
      required: true,
      min: 1,
      max: 40,
      message: "Ingresa tu antigüedad en años (entre 1 y 40)."
    }
  },
  calleTrabajo: {
    questionNumber: 43,
    label: "Calle del Trabajo / Negocio",
    prompt: "Ahora indícanos la dirección de tu trabajo o negocio. ¿Cuál es el nombre de la calle (sin número)?",
    helperText: "Si trabajas desde casa o tu negocio está en tu domicilio, escribe la calle de tu domicilio.",
    type: "text",
    placeholder: "Ej. PASEO DE LA REFORMA",
    phase: 6,
    sheetHeader: "Calle trabajo (solo el nombre)",
    validation: {
      required: true,
      minLength: 2,
      message: "La calle del trabajo o negocio es obligatoria."
    }
  },
  numeroExteriorTrabajo: {
    questionNumber: 44,
    label: "Número Exterior del Trabajo",
    prompt: "¿Cuál es el número exterior de tu lugar de trabajo o negocio?",
    helperText: "Ejemplo: 505, MZA 4, o S/N si no tiene número.",
    type: "text",
    placeholder: "Ej. 505 o S/N",
    phase: 6,
    sheetHeader: "Numero exterior trabajo",
    validation: {
      required: true,
      message: "El número exterior del trabajo es obligatorio."
    }
  },
  numeroInteriorTrabajo: {
    questionNumber: 45,
    label: "Número Interior del Trabajo",
    prompt: "¿Tiene número interior, piso u oficina tu lugar de trabajo? (Opcional)",
    helperText: "Si no aplica, déjalo en blanco y presiona Enviar.",
    type: "text",
    placeholder: "Ej. PISO 8 OFICINA 802 (Opcional)",
    phase: 6,
    sheetHeader: "Numero interior trabajo",
    validation: {
      required: false
    }
  },
  coloniaTrabajo: {
    questionNumber: 46,
    label: "Colonia del Trabajo",
    prompt: "¿En qué colonia o zona industrial está ubicado tu trabajo o negocio?",
    helperText: "Escribe el nombre de la colonia o fraccionamiento del empleo.",
    type: "text",
    placeholder: "Ej. CUAUHTÉMOC",
    phase: 6,
    sheetHeader: "Colonia trabajo",
    validation: {
      required: true,
      minLength: 2,
      message: "La colonia del trabajo es obligatoria."
    }
  },
  municipioAlcaldiaTrabajo: {
    questionNumber: 47,
    label: "Municipio o Alcaldía del Trabajo",
    prompt: "¿En qué Municipio o Alcaldía se ubica tu trabajo o negocio?",
    helperText: "Ejemplo: MIGUEL HIDALGO, QUERÉTARO, SAN PEDRO GARZA GARCÍA, etc.",
    type: "text",
    placeholder: "Ej. CUAUHTÉMOC",
    phase: 6,
    sheetHeader: "Municipio ó Alcaldía trabajo",
    validation: {
      required: true,
      minLength: 2,
      message: "El municipio o alcaldía del trabajo es obligatorio."
    }
  },
  estadoTrabajo: {
    questionNumber: 48,
    label: "Estado del Trabajo",
    prompt: "¿En qué Estado de la República está tu trabajo o negocio?",
    helperText: "Selecciona la entidad federativa donde se ubica tu trabajo.",
    type: "select",
    placeholder: "Selecciona el estado del trabajo",
    options: ESTADOS_MEXICO,
    phase: 6,
    sheetHeader: "Estado trabajo",
    validation: {
      required: true,
      message: "Selecciona el estado donde se ubica tu trabajo."
    }
  },
  codigoPostalTrabajo: {
    questionNumber: 49,
    label: "Código Postal del Trabajo (C.P.)",
    prompt: "¿Cuál es el Código Postal (5 dígitos) de tu lugar de trabajo o negocio?",
    helperText: "Ingresa los 5 dígitos numéricos del C.P. laboral.",
    type: "text",
    placeholder: "Ej. 06500",
    phase: 6,
    sheetHeader: "Código Postal trabajo",
    validation: {
      required: true,
      pattern: /^[0-9]{5}$/,
      message: "El código postal laboral debe tener exactamente 5 dígitos numéricos."
    }
  },
  telefonoOficinaExt: {
    questionNumber: 50,
    label: "Teléfono de la Empresa / Oficina",
    prompt: "¿Cuál es el teléfono de la empresa, oficina o negocio (10 dígitos)?",
    helperText: "Escribe los 10 dígitos del teléfono laboral (sin espacios ni letras).",
    type: "tel",
    placeholder: "Ej. 5550801234",
    phase: 6,
    sheetHeader: "Teléfono de oficina y extensión ó directo",
    validation: {
      required: true,
      pattern: /^[0-9]{10}$/,
      message: "Ingresa un teléfono de oficina válido de 10 dígitos numéricos."
    }
  },
  nombreJefeInmediato: {
    questionNumber: 51,
    label: "Nombre de tu Jefe Inmediato",
    prompt: "¿Cuál es el nombre completo de tu Jefe Inmediato?",
    helperText: "Si eres Independiente o Pensionado/Jubilado, ya lo prellenamos como 'NO APLICA' (solo presiona Enviar).",
    type: "text",
    placeholder: "Ej. ROBERTO SÁNCHEZ (o NO APLICA)",
    phase: 6,
    sheetHeader: "Nombre de tu Jefe Inmediato",
    validation: {
      required: true,
      minLength: 2,
      message: "Ingresa el nombre de tu jefe inmediato (o 'NO APLICA' si eres independiente/jubilado)."
    }
  },
  puestoJefeInmediato: {
    questionNumber: 52,
    label: "Puesto de tu Jefe Inmediato",
    prompt: "¿Qué puesto tiene tu Jefe Inmediato?",
    helperText: "Si eres Independiente o Pensionado/Jubilado, déjalo como 'NO APLICA' y presiona Enviar.",
    type: "text",
    placeholder: "Ej. DIRECTOR DE OPERACIONES (o NO APLICA)",
    phase: 6,
    sheetHeader: "¿Puesto de jefe inmediato?",
    validation: {
      required: true,
      minLength: 2,
      message: "Ingresa el puesto de tu jefe inmediato (o 'NO APLICA')."
    }
  },
  propietarioNegocio: {
    questionNumber: 53,
    label: "¿Eres propietario de negocio?",
    prompt: "¿Eres dueño o propietario del negocio donde trabajas?",
    helperText: "Se preseleccionó automáticamente según tu situación laboral, pero puedes confirmarlo aquí.",
    type: "select",
    placeholder: "Selecciona Sí o No",
    options: ["SÍ", "NO"],
    quickSelect: true,
    phase: 6,
    sheetHeader: "¿Eres propietario de negocio?",
    validation: {
      required: true,
      message: "Indica si eres propietario de negocio."
    }
  },

  // =========================================================================
  // SECCIÓN 7: REFERENCIAS PERSONALES (Preguntas 54 a 71 — 3 Referencias)
  // =========================================================================
  // --- REFERENCIA PERSONAL 1 ---
  ref1Nombre: {
    questionNumber: 54,
    label: "Referencia 1 · Nombre(s)",
    prompt: "Para finalizar, registremos 3 referencias personales (familiares o amistades). ¿Cuál es el NOMBRE(S) de pila de tu Referencia 1 (sin apellidos)?",
    dynamicPrompt: (fd) => {
      const n = formatNombreCortesia(fd);
      return n
        ? `Ya casi terminamos, ${n}. Registremos 3 referencias personales (familiares o amistades). ¿Cuál es el NOMBRE(S) de pila de tu Referencia 1 (sin apellidos)?`
        : "Para finalizar, registremos 3 referencias personales (familiares o amistades). ¿Cuál es el NOMBRE(S) de pila de tu Referencia 1 (sin apellidos)?";
    },
    helperText: "Importante para Nissan: Escribe solo su nombre o nombres de pila. Sus apellidos van en las siguientes dos preguntas.",
    type: "text",
    placeholder: "Ej. PEDRO ANTONIO",
    phase: 7,
    sheetHeader: "Nombre (solo nombre) referencia 1",
    validation: {
      required: true,
      minLength: 2,
      message: "Ingresa únicamente el nombre(s) de pila de tu Referencia 1."
    }
  },
  ref1ApellidoPaterno: {
    questionNumber: 55,
    label: "Referencia 1 · Apellido Paterno",
    prompt: "¿Cuál es el Apellido Paterno de tu Referencia 1?",
    helperText: "Escribe solo su primer apellido (Apellido Paterno).",
    type: "text",
    placeholder: "Ej. PÉREZ",
    phase: 7,
    sheetHeader: "Apellido Paterno (solo nombre) referencia 1",
    validation: {
      required: true,
      minLength: 2,
      message: "Ingresa el apellido paterno de la Referencia 1."
    }
  },
  ref1ApellidoMaterno: {
    questionNumber: 56,
    label: "Referencia 1 · Apellido Materno",
    prompt: "¿Cuál es el Apellido Materno de tu Referencia 1?",
    helperText: "Escribe solo su segundo apellido (Apellido Materno).",
    type: "text",
    placeholder: "Ej. RAMÍREZ",
    phase: 7,
    sheetHeader: "Apellido Materno (solo nombre) referencia 1",
    validation: {
      required: true,
      minLength: 2,
      message: "Ingresa el apellido materno de la Referencia 1."
    }
  },
  ref1Parentesco: {
    questionNumber: 57,
    label: "Referencia 1 · Parentesco",
    prompt: "¿Qué parentesco o relación tiene contigo la Referencia 1?",
    helperText: "Puedes tocar una de las sugerencias rápidas o escribir el parentesco directamente.",
    type: "text",
    placeholder: "Ej. HERMANO, PADRE, PRIMO, AMISTAD",
    suggestions: PARENTESCOS_SUGERIDOS,
    phase: 7,
    sheetHeader: "Parentesco ref 1",
    validation: {
      required: true,
      minLength: 2,
      message: "Indica el parentesco de la Referencia 1."
    }
  },
  ref1Telefono: {
    questionNumber: 58,
    label: "Referencia 1 · Teléfono (10 dígitos)",
    prompt: "¿Cuál es el número de teléfono celular de tu Referencia 1 (10 dígitos)?",
    helperText: "Ingresa los 10 dígitos numéricos sin espacios.",
    type: "tel",
    placeholder: "Ej. 5599887766",
    phase: 7,
    sheetHeader: "Teléfono de la Referencia 1",
    validation: {
      required: true,
      pattern: /^[0-9]{10}$/,
      message: "El teléfono de la Referencia 1 debe tener exactamente 10 dígitos numéricos."
    }
  },
  ref1Ocupacion: {
    questionNumber: 59,
    label: "Referencia 1 · Ocupación",
    prompt: "¿A qué se dedica o cuál es la ocupación de tu Referencia 1?",
    helperText: "Ejemplo: EMPLEADO, INGENIERO, COMERCIANTE, AMA DE CASA, PROFESOR, etc.",
    type: "text",
    placeholder: "Ej. INGENIERO / EMPLEADO",
    phase: 7,
    sheetHeader: "Ocupacion de la referencia 1",
    validation: {
      required: true,
      minLength: 2,
      message: "Indica la ocupación de la Referencia 1."
    }
  },

  // --- REFERENCIA PERSONAL 2 ---
  ref2Nombre: {
    questionNumber: 60,
    label: "Referencia 2 · Nombre(s)",
    prompt: "Vamos con tu Referencia Personal 2. ¿Cuál es su NOMBRE(S) de pila (sin apellidos)?",
    helperText: "Recuerda colocar solo su(s) nombre(s) de pila.",
    type: "text",
    placeholder: "Ej. ANA LAURA",
    phase: 7,
    sheetHeader: "Nombre (solo nombre) referencia 2",
    validation: {
      required: true,
      minLength: 2,
      message: "Ingresa el nombre(s) de pila de la Referencia 2."
    }
  },
  ref2ApellidoPaterno: {
    questionNumber: 61,
    label: "Referencia 2 · Apellido Paterno",
    prompt: "¿Cuál es el Apellido Paterno de tu Referencia 2?",
    helperText: "Escribe solo su primer apellido (Apellido Paterno).",
    type: "text",
    placeholder: "Ej. GÓMEZ",
    phase: 7,
    sheetHeader: "Apellido Paterno (solo nombre) referencia 2",
    validation: {
      required: true,
      minLength: 2,
      message: "Ingresa el apellido paterno de la Referencia 2."
    }
  },
  ref2ApellidoMaterno: {
    questionNumber: 62,
    label: "Referencia 2 · Apellido Materno",
    prompt: "¿Cuál es el Apellido Materno de tu Referencia 2?",
    helperText: "Escribe solo su segundo apellido (Apellido Materno).",
    type: "text",
    placeholder: "Ej. SÁNCHEZ",
    phase: 7,
    sheetHeader: "Apellido Materno (solo nombre) referencia 2",
    validation: {
      required: true,
      minLength: 2,
      message: "Ingresa el apellido materno de la Referencia 2."
    }
  },
  ref2Parentesco: {
    questionNumber: 63,
    label: "Referencia 2 · Parentesco",
    prompt: "¿Qué parentesco o relación tiene contigo la Referencia 2?",
    helperText: "Toca una sugerencia o escríbelo directamente.",
    type: "text",
    placeholder: "Ej. PRIMA, TÍO, AMISTAD",
    suggestions: PARENTESCOS_SUGERIDOS,
    phase: 7,
    sheetHeader: "Parentesco ref 2",
    validation: {
      required: true,
      minLength: 2,
      message: "Indica el parentesco de la Referencia 2."
    }
  },
  ref2Telefono: {
    questionNumber: 64,
    label: "Referencia 2 · Teléfono (10 dígitos)",
    prompt: "¿Cuál es el número celular de tu Referencia 2 (10 dígitos)?",
    helperText: "Ingresa los 10 dígitos numéricos sin espacios.",
    type: "tel",
    placeholder: "Ej. 5566778899",
    phase: 7,
    sheetHeader: "Teléfono de la Referencia 2",
    validation: {
      required: true,
      pattern: /^[0-9]{10}$/,
      message: "El teléfono de la Referencia 2 debe tener exactamente 10 dígitos numéricos."
    }
  },
  ref2Ocupacion: {
    questionNumber: 65,
    label: "Referencia 2 · Ocupación",
    prompt: "¿Cuál es la ocupación de tu Referencia 2?",
    helperText: "Ejemplo: ABOGADA, CONTADOR, COMERCIANTE, EMPLEADA, etc.",
    type: "text",
    placeholder: "Ej. CONTADORA",
    phase: 7,
    sheetHeader: "Ocupacion de la referencia 2",
    validation: {
      required: true,
      minLength: 2,
      message: "Indica la ocupación de la Referencia 2."
    }
  },

  // --- REFERENCIA PERSONAL 3 ---
  ref3Nombre: {
    questionNumber: 66,
    label: "Referencia 3 · Nombre(s)",
    prompt: "¡Última referencia! ¿Cuál es el NOMBRE(S) de pila de tu Referencia Personal 3 (sin apellidos)?",
    helperText: "Escribe solo su nombre o nombres de pila.",
    type: "text",
    placeholder: "Ej. CARLOS ALBERTO",
    phase: 7,
    sheetHeader: "Nombre (solo nombre) referencia 3",
    validation: {
      required: true,
      minLength: 2,
      message: "Ingresa el nombre(s) de pila de la Referencia 3."
    }
  },
  ref3ApellidoPaterno: {
    questionNumber: 67,
    label: "Referencia 3 · Apellido Paterno",
    prompt: "¿Cuál es el Apellido Paterno de tu Referencia 3?",
    helperText: "Escribe solo su primer apellido (Apellido Paterno).",
    type: "text",
    placeholder: "Ej. TORRES",
    phase: 7,
    sheetHeader: "Apellido Paterno (solo nombre) referencia 3",
    validation: {
      required: true,
      minLength: 2,
      message: "Ingresa el apellido paterno de la Referencia 3."
    }
  },
  ref3ApellidoMaterno: {
    questionNumber: 68,
    label: "Referencia 3 · Apellido Materno",
    prompt: "¿Cuál es el Apellido Materno de tu Referencia 3?",
    helperText: "Escribe solo su segundo apellido (Apellido Materno).",
    type: "text",
    placeholder: "Ej. VÁZQUEZ",
    phase: 7,
    sheetHeader: "Apellido Materno (solo nombre) referencia 3",
    validation: {
      required: true,
      minLength: 2,
      message: "Ingresa el apellido materno de la Referencia 3."
    }
  },
  ref3Parentesco: {
    questionNumber: 69,
    label: "Referencia 3 · Parentesco",
    prompt: "¿Qué parentesco o relación tiene contigo la Referencia 3?",
    helperText: "Toca una sugerencia o escríbelo directamente.",
    type: "text",
    placeholder: "Ej. AMISTAD, HERMANO, VECINO",
    suggestions: PARENTESCOS_SUGERIDOS,
    phase: 7,
    sheetHeader: "Parentesco ref 3",
    validation: {
      required: true,
      minLength: 2,
      message: "Indica el parentesco de la Referencia 3."
    }
  },
  ref3Telefono: {
    questionNumber: 70,
    label: "Referencia 3 · Teléfono (10 dígitos)",
    prompt: "¿Cuál es el número celular de tu Referencia 3 (10 dígitos)?",
    helperText: "Ingresa los 10 dígitos numéricos sin espacios.",
    type: "tel",
    placeholder: "Ej. 5511223344",
    phase: 7,
    sheetHeader: "Teléfono de la Referencia 3",
    validation: {
      required: true,
      pattern: /^[0-9]{10}$/,
      message: "El teléfono de la Referencia 3 debe tener exactamente 10 dígitos numéricos."
    }
  },
  ref3Ocupacion: {
    questionNumber: 71,
    label: "Referencia 3 · Ocupación",
    prompt: "Por último, ¿a qué se dedica o qué ocupación tiene tu Referencia 3?",
    helperText: "Ejemplo: MÉDICO, ARQUITECTO, COMERCIANTE, EMPLEADO, etc.",
    type: "text",
    placeholder: "Ej. ARQUITECTO",
    phase: 7,
    sheetHeader: "Ocupacion de la referencia 3",
    validation: {
      required: true,
      minLength: 2,
      message: "Indica la ocupación de la Referencia 3."
    }
  }
};
