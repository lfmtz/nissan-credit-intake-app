import React, { useState } from 'react';
import ConversationalFormPage from '../pages/ConversationalFormPage';
import ReviewPage from '../pages/ReviewPage';
import SuccessPage from '../pages/SuccessPage';
import RequestsListPage from '../pages/RequestsListPage';
import AdminLogin from '../components/AdminLogin';
import { submitFormToSheets, updateFormInSheets } from '../services/api/sheetsApi';
import { formPayloadAdapter } from '../services/adapters/formPayloadAdapter';
import { nissanFormFlow } from '../flows/nissan/nissanFormFlow';
import { nissanFieldSchema } from '../flows/nissan/nissanFieldSchema';
import { FileText, Home } from 'lucide-react';
import NissanLogo from '../components/NissanLogo';

export const INITIAL_FORM_DATA = {
  // Sección 1: Datos Generales del Acreditado (Preguntas 1 a 15)
  nombreAcreditado: "",
  apellidoPaternoAcreditado: "",
  apellidoMaternoAcreditado: "",
  fechaNacimiento: "",
  paisNacimiento: "MEXICO",
  entidadFederativaNacimiento: "",
  rfc: "",
  curp: "",
  regimenFiscal: "",
  sexo: "",
  nacionalidad: "MEXICANA",
  numeroCelular: "",
  companiaTelefonica: "",
  correoElectronico: "",
  casado: "",

  // Sección 2: Datos del Cónyuge (Preguntas 16 a 21 - Condicional)
  nombreConyuge: "",
  apellidoPaternoConyuge: "",
  apellidoMaternoConyuge: "",
  fechaNacimientoConyuge: "",
  entidadFederativaNacimientoConyuge: "",
  nacionalidadConyuge: "MEXICANA",

  // Sección 3: Identificación Oficial (Preguntas 22 a 23)
  tipoIdentificacion: "IFE Ó INE",
  domicilioMismoIdentificacion: "",

  // Sección 4: Domicilio Particular (Preguntas 24 a 35)
  calle: "",
  numeroExterior: "",
  numeroInterior: "",
  coloniaAcreditado: "",
  entreCallesDomicilio: "",
  municipioAlcaldia: "",
  ciudadPoblacion: "",
  estado: "",
  codigoPostal: "",
  tipoResidencia: "",
  anosVivirDomicilio: "",
  telefonoCasaFijo: "",

  // Sección 5: Situación Laboral e Ingresos (Pregunta 36 + Ingresos)
  situacionLaboral: "",
  ingresoFijo: "",
  ingresoVariable: "",
  ingresoCheques: "",
  ingresosNetosMensuales: "",

  // Sección 6: Datos y Domicilio del Empleo o Negocio (Preguntas 37 a 53)
  nombreEmpresa: "",
  tipoEmpresaPublicaPrivada: "PRIVADA",
  puestoActividad: "",
  giroEmpresa: "",
  fechaIngresoEmpresa: "",
  antiguedadEmpleoAnos: "",
  calleTrabajo: "",
  numeroExteriorTrabajo: "",
  numeroInteriorTrabajo: "",
  coloniaTrabajo: "",
  municipioAlcaldiaTrabajo: "",
  estadoTrabajo: "",
  codigoPostalTrabajo: "",
  telefonoOficinaExt: "",
  nombreJefeInmediato: "",
  puestoJefeInmediato: "",
  propietarioNegocio: "",

  // Sección 7: Referencias Personales (Preguntas 54 a 71)
  ref1Nombre: "",
  ref1ApellidoPaterno: "",
  ref1ApellidoMaterno: "",
  ref1Parentesco: "",
  ref1Telefono: "",
  ref1Ocupacion: "",

  ref2Nombre: "",
  ref2ApellidoPaterno: "",
  ref2ApellidoMaterno: "",
  ref2Parentesco: "",
  ref2Telefono: "",
  ref2Ocupacion: "",

  ref3Nombre: "",
  ref3ApellidoPaterno: "",
  ref3ApellidoMaterno: "",
  ref3Parentesco: "",
  ref3Telefono: "",
  ref3Ocupacion: ""
};

export default function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const isAdminUrl = urlParams.get('admin') === 'true';

  // currentStep:
  // -1 = Portal de Listado / Edición (Admin)
  //  0 = Bienvenida
  // 1..7 = Secciones de la solicitud Nissan
  //  8 = Revisión Final / Edición Interactiva
  //  9 = Éxito
  const [currentStep, setCurrentStep] = useState(isAdminUrl ? -1 : 0);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [editingRowId, setEditingRowId] = useState(null);
  const [submittedRowId, setSubmittedRowId] = useState(null);
  const [wasEditingOnSubmit, setWasEditingOnSubmit] = useState(false);
  const [adminPassword, setAdminPassword] = useState(
    () => sessionStorage.getItem('nissanAdminPassword') || ''
  );

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    const sheetPayload = formPayloadAdapter(formData);

    try {
      let response;
      if (editingRowId) {
        response = await updateFormInSheets(editingRowId, sheetPayload, adminPassword);
        setWasEditingOnSubmit(true);
      } else {
        response = await submitFormToSheets(sheetPayload);
        setWasEditingOnSubmit(false);
      }

      if (response && (response.success || response.status === 'success')) {
        setSubmittedRowId(response.rowId || editingRowId || null);
        setCurrentStep(9);
      } else {
        throw new Error(response?.error || "Error desconocido al guardar en SOL_CREDITO_ACTUAL_2026.");
      }
    } catch (err) {
      setSubmitError(
        err.message || "Fallo en la comunicación con Google Sheets. Verifica tu conexión."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(INITIAL_FORM_DATA);
    setErrors({});
    setSubmitError(null);
    setEditingRowId(null);
    setSubmittedRowId(null);
    setCurrentStep(0);
  };

  const handleEditRequest = (rowId, adaptedData) => {
    setFormData({
      ...INITIAL_FORM_DATA,
      ...adaptedData
    });
    setEditingRowId(rowId);
    setErrors({});
    setSubmitError(null);
    setCurrentStep(8); // Abrir directamente en Revisión / Edición Interactiva
  };

  return (
    <div className="app-root-layout">
      {/* Cabecera Superior Credi Nissan */}
      <header className="app-nav-header">
        <div className="nav-container px-6 py-3">
          <div
            className="flex items-center gap-2.5"
            style={{ cursor: 'pointer' }}
            onClick={handleReset}
            title="Ir al inicio"
          >
            <NissanLogo size={42} />
            <div>
              <span className="logo-text">
                CREDI <span className="logo-subtext">NISSAN</span>
              </span>
            </div>
          </div>

          <div className="nav-actions flex items-center gap-2">
            {adminPassword && (
              <button
                type="button"
                onClick={() => {
                  setAdminPassword('');
                  sessionStorage.removeItem('nissanAdminPassword');
                  handleReset();
                }}
                className="btn btn-secondary btn-xs"
                style={{ borderColor: 'rgba(239, 68, 68, 0.35)', color: '#fca5a5' }}
              >
                Cerrar Sesión
              </button>
            )}

            {isAdminUrl && (
              <>
                {currentStep !== 0 && (
                  <button
                    id="nav-home-btn"
                    type="button"
                    onClick={handleReset}
                    className="btn btn-secondary btn-xs flex items-center gap-1"
                  >
                    <Home size={13} />
                    <span className="hide-on-mobile">Inicio</span>
                  </button>
                )}

                <button
                  id="nav-edit-portal-btn"
                  type="button"
                  onClick={() => setCurrentStep(-1)}
                  className="btn btn-secondary btn-xs flex items-center gap-1.5"
                  title="Abrir portal de consulta y edición de solicitudes"
                >
                  <FileText size={13} className="text-teal-accent" />
                  <span>Ver Solicitudes</span>
                </button>
              </>
            )}

            <span className="badge badge-outline">
              {editingRowId
                ? `Editando Fila #${editingRowId}`
                : currentStep === -1
                ? "Edición"
                : currentStep === 8
                ? "Revisión"
                : currentStep >= 1 && currentStep <= 7
                ? `Sección ${currentStep} de 7`
                : "Persona Física"}
            </span>
          </div>
        </div>
      </header>

      {/* Área Principal */}
      <main className="app-main-content">
        <div className="content-container max-w-4xl mx-auto px-4 py-6">
          {currentStep === -1 &&
            (adminPassword ? (
              <RequestsListPage
                adminPassword={adminPassword}
                onEditRequest={handleEditRequest}
                onCreateNew={() => {
                  setFormData(INITIAL_FORM_DATA);
                  setEditingRowId(null);
                  setCurrentStep(0);
                }}
              />
            ) : (
              <AdminLogin
                onLoginSuccess={(pass) => {
                  setAdminPassword(pass);
                  sessionStorage.setItem('nissanAdminPassword', pass);
                }}
                onCancel={handleReset}
              />
            ))}

          {currentStep >= 0 && currentStep <= 7 && (
            <ConversationalFormPage
              currentStep={currentStep}
              setCurrentStep={setCurrentStep}
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              setErrors={setErrors}
              formFlow={nissanFormFlow}
              fieldSchema={nissanFieldSchema}
            />
          )}

          {currentStep === 8 && (
            <ReviewPage
              formData={formData}
              setFormData={setFormData}
              setCurrentStep={setCurrentStep}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              submitError={submitError}
              formFlow={nissanFormFlow}
              fieldSchema={nissanFieldSchema}
              editingRowId={editingRowId}
            />
          )}

          {currentStep === 9 && (
            <SuccessPage
              onReset={handleReset}
              submittedRowId={submittedRowId}
              wasEditing={wasEditingOnSubmit}
              onReturnToList={adminPassword ? () => setCurrentStep(-1) : null}
            />
          )}
        </div>
      </main>

      {/* Pie de Página */}
      <footer className="app-footer text-center py-6 text-xs text-gray-500 border-t">
        &copy; {new Date().getFullYear()} Credi Nissan · Solicitud Digital Persona Física · Conectado a SOL_CREDITO_ACTUAL_2026
      </footer>
    </div>
  );
}
