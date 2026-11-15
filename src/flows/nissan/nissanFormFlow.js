import { nissanFieldSchema } from "./nissanFieldSchema.js";

export const nissanFormFlow = {
  phases: [
    {
      id: 0,
      title: "Bienvenida",
      description: "Comienza tu solicitud de crédito automotriz Credi Nissan de manera rápida y guiada.",
      fields: []
    },
    {
      id: 1,
      title: "Datos Generales del Acreditado",
      description: "Datos personales, RFC, CURP, contacto y estado civil del titular.",
      fields: [
        "nombreAcreditado",
        "apellidoPaternoAcreditado",
        "apellidoMaternoAcreditado",
        "fechaNacimiento",
        "paisNacimiento",
        "entidadFederativaNacimiento",
        "rfc",
        "curp",
        "regimenFiscal",
        "sexo",
        "nacionalidad",
        "numeroCelular",
        "companiaTelefonica",
        "correoElectronico",
        "casado"
      ]
    },
    {
      id: 2,
      title: "Datos del Cónyuge",
      description: "Información básica de tu cónyuge o pareja (aplicable para Casado o Unión Libre).",
      conditionalPhase: true,
      fields: [
        "nombreConyuge",
        "apellidoPaternoConyuge",
        "apellidoMaternoConyuge",
        "fechaNacimientoConyuge",
        "entidadFederativaNacimientoConyuge",
        "nacionalidadConyuge"
      ]
    },
    {
      id: 3,
      title: "Identificación Oficial",
      description: "Documento oficial vigente y coincidencia con tu domicilio actual.",
      fields: [
        "tipoIdentificacion",
        "domicilioMismoIdentificacion"
      ]
    },
    {
      id: 4,
      title: "Domicilio Particular",
      description: "Dirección completa de tu residencia actual y años de habitar en ella.",
      fields: [
        "calle",
        "numeroExterior",
        "numeroInterior",
        "coloniaAcreditado",
        "entreCallesDomicilio",
        "municipioAlcaldia",
        "ciudadPoblacion",
        "estado",
        "codigoPostal",
        "tipoResidencia",
        "anosVivirDomicilio",
        "telefonoCasaFijo"
      ]
    },
    {
      id: 5,
      title: "Situación Laboral e Ingresos",
      description: "Esquema laboral actual y desglose de tus ingresos mensuales netos comprobables.",
      fields: [
        "situacionLaboral",
        "ingresoFijo",
        "ingresoVariable",
        "ingresoCheques",
        "ingresosNetosMensuales"
      ]
    },
    {
      id: 6,
      title: "Datos y Domicilio del Empleo o Negocio",
      description: "Información sobre la empresa, institución o actividad comercial donde laboras.",
      fields: [
        "nombreEmpresa",
        "tipoEmpresaPublicaPrivada",
        "puestoActividad",
        "giroEmpresa",
        "fechaIngresoEmpresa",
        "antiguedadEmpleoAnos",
        "calleTrabajo",
        "numeroExteriorTrabajo",
        "numeroInteriorTrabajo",
        "coloniaTrabajo",
        "municipioAlcaldiaTrabajo",
        "estadoTrabajo",
        "codigoPostalTrabajo",
        "telefonoOficinaExt",
        "nombreJefeInmediato",
        "puestoJefeInmediato",
        "propietarioNegocio"
      ]
    },
    {
      id: 7,
      title: "Referencias Personales",
      description: "Datos de 3 referencias personales (con nombres y apellidos separados).",
      fields: [
        // Referencia 1
        "ref1Nombre",
        "ref1ApellidoPaterno",
        "ref1ApellidoMaterno",
        "ref1Parentesco",
        "ref1Telefono",
        "ref1Ocupacion",
        // Referencia 2
        "ref2Nombre",
        "ref2ApellidoPaterno",
        "ref2ApellidoMaterno",
        "ref2Parentesco",
        "ref2Telefono",
        "ref2Ocupacion",
        // Referencia 3
        "ref3Nombre",
        "ref3ApellidoPaterno",
        "ref3ApellidoMaterno",
        "ref3Parentesco",
        "ref3Telefono",
        "ref3Ocupacion"
      ]
    },
    {
      id: 8,
      title: "Revisión Final",
      description: "Verifica y edita cualquiera de tus datos antes de enviar la solicitud.",
      fields: []
    }
  ]
};

/**
 * Obtiene la lista ordenada de llaves de preguntas activas para el flujo conversacional
 * evaluando las condiciones dinámicas según las respuestas actuales de `formData`.
 */
export const getActiveFieldKeys = (formData, formFlow = nissanFormFlow, fieldSchema = nissanFieldSchema) => {
  const keys = [];
  formFlow.phases.forEach((phase) => {
    if (phase.fields && phase.fields.length > 0) {
      phase.fields.forEach((key) => {
        const schema = fieldSchema[key];
        if (!schema || schema.hidden) return;
        if (typeof schema.condition === "function" && !schema.condition(formData)) {
          return;
        }
        keys.push(key);
      });
    }
  });
  return keys;
};
