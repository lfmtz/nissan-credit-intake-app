# Credi Nissan · Solicitud de Crédito Digital (Persona Física)

Aplicación web interactiva para la captura y edición de solicitudes de crédito automotriz **Credi Nissan**, conectada en tiempo real a la hoja de Google Sheets `SOL_CREDITO_ACTUAL_2026` (`1PbUYdmnj5LqQ9k5mFUjHyAL1ATxtEDNgsreAIHHfTUc`, pestaña `Respuestas de formulario 1`) para la generación del formato oficial `CN-Solicitud Persona Fisica.pdf`.

## Portales Incluidos

1. **Portal de Captura de Solicitud (Clientes / Asesores):**
   - URL: `https://lfmtz.github.io/nissan-credit-intake-app/`
   - Entrevista guiada en **7 capas / secciones** con botones de selección rápida, notas de ayuda contextuales, validación en tiempo real y pantalla de revisión final antes de enviar.
2. **Portal de Edición de Datos (Administración):**
   - URL directa: `https://lfmtz.github.io/nissan-credit-intake-app/?admin=true` (o desde el botón **Portal Edición** en la barra superior).
   - Permite buscar expedientes por nombre, apellidos, RFC o fecha y editar cualquier campo (incluyendo los campos de cónyuge e ingresos condicionales) directamente sobre la fila correspondiente en `SOL_CREDITO_ACTUAL_2026`.

## Estructura de Secciones (71 Preguntas Oficiales Nissan)

- **Sección 1:** Datos Generales del Acreditado (Preguntas 1 a 15 — Nombres y apellidos separados, Fecha y lugar de nacimiento, RFC, CURP, Régimen Fiscal, Sexo, Nacionalidad, Celular, Compañía, Correo y Estado Civil).
- **Sección 2 (Condicional):** Datos del Cónyuge (Preguntas 16 a 21 — Se solicita durante la captura únicamente si el Estado Civil es *Casado bienes mancomunados*, *Casado bienes separados* o *Unión Libre*; siempre disponible y editable en el Portal de Edición).
- **Sección 3:** Identificación Oficial (Preguntas 22 a 23 — Tipo de identificación y coincidencia de domicilio con INE/IFE).
- **Sección 4:** Domicilio Particular del Acreditado (Preguntas 24 a 35 — Calle, números, colonia, entre calles, municipio/alcaldía, ciudad, estado, C.P., tipo de residencia, años de residencia y teléfono).
- **Sección 5 (Lógica Condicional de Ingresos):** Situación Laboral e Ingresos (`Asalariado`, `Independiente`, `Pensionado ó Jubilado`) con mapeo automático a `Ingreso Fijo` (Col 37), `Ingreso Variable` (Col 38), `Ingreso Cheques` (Col 39) e `Ingresos netos mensuales` (Col 56).
- **Sección 6:** Datos y Domicilio del Empleo o Negocio (Preguntas 37 a 53 — Empresa, pública/privada, puesto, giro, fecha de ingreso, antigüedad autocalculada, dirección laboral, teléfono, jefe inmediato y puesto de jefe).
- **Sección 7:** Referencias Personales 1, 2 y 3 (Preguntas 54 a 71 — Con `Nombre(s)`, `Apellido Paterno` y `Apellido Materno` en columnas individuales + Parentesco, Teléfono y Ocupación).

## Comandos de Desarrollo y Despliegue

```bash
# Instalar dependencias
npm install

# Servidor local de desarrollo
npm run dev

# Verificar linter y compilación de producción
npm run lint
npm run build

# Publicar en GitHub Pages (rama gh-pages)
npm run deploy
```
