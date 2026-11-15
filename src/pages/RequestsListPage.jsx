import React, { useState, useEffect } from 'react';
import { getRequestsFromSheets } from '../services/api/sheetsApi';
import { formPayloadInverseAdapter } from '../services/adapters/formPayloadInverseAdapter';
import {
  Search,
  Edit2,
  Plus,
  RefreshCw,
  AlertCircle,
  FileText,
  Calendar,
  User,
  Briefcase
} from 'lucide-react';

export default function RequestsListPage({ adminPassword, onEditRequest, onCreateNew }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchRequests = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    setError(null);
    try {
      const data = await getRequestsFromSheets(adminPassword);
      if (Array.isArray(data)) {
        setRequests(data);
      } else {
        throw new Error("El formato de respuesta de solicitudes es inválido.");
      }
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las solicitudes desde SOL_CREDITO_ACTUAL_2026.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEdit = (record) => {
    const adaptedData = formPayloadInverseAdapter(record);
    onEditRequest(record.rowId, adaptedData);
  };

  const reversedRequests = [...requests].reverse();

  const filtered = reversedRequests.filter((req) => {
    let matchesSearch = true;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const nombre = `${req["Nombre(s) acreditado"] || ''} ${
        req["Apellido Paterno acreditado"] || ''
      } ${req["Apellido Materno acreditado"] || ''}`.toLowerCase();
      const rfc = (req["RFC"] || '').toLowerCase();
      matchesSearch = nombre.includes(term) || rfc.includes(term);
    }

    let matchesDate = true;
    if (filterDate) {
      const rawTimestamp =
        req["Timestamp"] || req["Marca temporal"] || req["Marca Temporal"];
      if (rawTimestamp) {
        const str = String(rawTimestamp).trim();
        const [selYear, selMonth, selDay] = filterDate.split('-');
        const selDayInt = parseInt(selDay, 10).toString();
        const selMonthInt = parseInt(selMonth, 10).toString();

        const formattedSlash1 = `${selDayInt}/${selMonthInt}/${selYear}`;
        const formattedSlash2 = `${selDay.padStart(2, '0')}/${selMonth.padStart(2, '0')}/${selYear}`;
        const formattedDash = `${selYear}-${selMonth.padStart(2, '0')}-${selDay.padStart(2, '0')}`;

        matchesDate =
          str.includes(formattedSlash1) ||
          str.includes(formattedSlash2) ||
          str.includes(formattedDash);
      } else {
        matchesDate = false;
      }
    }

    return matchesSearch && matchesDate;
  });

  const displayedRequests =
    searchTerm || filterDate ? filtered : filtered.slice(0, 10);

  const formatTimestampShort = (rawTimestamp) => {
    if (!rawTimestamp) return 'Sin fecha';
    const str = String(rawTimestamp).trim();
    if (str.includes('T')) return str.split('T')[0];
    if (str.includes(' ')) return str.split(' ')[0];
    return str;
  };

  return (
    <div className="requests-list-container animate-fade-in py-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2 flex-wrap">
            <FileText className="text-teal-accent flex-shrink-0" />
            <span>Portal de Edición · Solicitudes en SOL_CREDITO_ACTUAL_2026</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Selecciona cualquier registro para ver y editar todos sus campos (incluyendo cónyuge, ingresos y referencias).
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={() => fetchRequests(true)}
            disabled={loading || isRefreshing}
            className="btn btn-secondary flex items-center gap-1.5 px-3 py-2"
          >
            <RefreshCw
              size={16}
              className={isRefreshing ? "animate-spin text-teal-accent" : ""}
            />
            <span>Actualizar</span>
          </button>
          <button
            type="button"
            onClick={onCreateNew}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={18} /> Nueva Solicitud
          </button>
        </div>
      </div>

      {/* Buscador y Filtro de Fecha */}
      <div className="glass-panel p-4 mb-6 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div
          className="flex items-center gap-3 flex-grow rounded-lg px-3 py-2"
          style={{ background: 'rgba(0, 0, 0, 0.25)', border: '1px solid var(--border-color)' }}
        >
          <Search className="text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar cliente por nombre, apellidos o RFC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control"
            style={{
              flexGrow: 1,
              border: 'none',
              background: 'transparent',
              padding: '0.2rem 0',
              boxShadow: 'none'
            }}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="text-xs text-gray-400"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Limpiar
            </button>
          )}
        </div>

        <div
          className="flex items-center gap-2 rounded-lg px-3 py-2"
          style={{ background: 'rgba(0, 0, 0, 0.25)', border: '1px solid var(--border-color)' }}
        >
          <Calendar className="text-gray-400" size={16} />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="form-control text-xs text-gray-200"
            style={{
              border: 'none',
              background: 'transparent',
              padding: '0.15rem 0',
              colorScheme: 'dark',
              boxShadow: 'none'
            }}
          />
          {filterDate && (
            <button
              type="button"
              onClick={() => setFilterDate('')}
              className="text-xs text-gray-400"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-danger flex items-center gap-3">
          <AlertCircle size={22} />
          <div>{error}</div>
        </div>
      )}

      {loading ? (
        <div className="glass-panel p-12 text-center">
          <RefreshCw className="animate-spin text-teal-accent mx-auto mb-4" size={32} />
          <p className="text-gray-400">Consultando expedientes en SOL_CREDITO_ACTUAL_2026...</p>
        </div>
      ) : displayedRequests.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <FileText className="text-gray-500 mx-auto mb-4" size={48} />
          <h3 className="text-lg font-semibold mb-2">No se encontraron solicitudes</h3>
          <p className="text-gray-400 mb-6">
            {searchTerm || filterDate
              ? "Ningún registro coincide con tu búsqueda."
              : "Aún no hay solicitudes registradas."}
          </p>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto hide-on-mobile">
            <table className="w-full text-left" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr className="border-b" style={{ background: 'rgba(0, 0, 0, 0.35)' }}>
                  <th className="p-4 text-xs font-bold text-teal-accent uppercase tracking-wider">
                    Fecha / Fila
                  </th>
                  <th className="p-4 text-xs font-bold text-teal-accent uppercase tracking-wider">
                    Acreditado / Estado Civil
                  </th>
                  <th className="p-4 text-xs font-bold text-teal-accent uppercase tracking-wider">
                    RFC / CURP
                  </th>
                  <th className="p-4 text-xs font-bold text-teal-accent uppercase tracking-wider">
                    Laboral / Ingreso
                  </th>
                  <th className="p-4 text-xs font-bold text-teal-accent uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="p-4 text-xs font-bold text-teal-accent uppercase tracking-wider text-center">
                    Acción
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayedRequests.map((req, idx) => {
                  const nombreCompleto = `${req["Nombre(s) acreditado"] || ''} ${
                    req["Apellido Paterno acreditado"] || ''
                  } ${req["Apellido Materno acreditado"] || ''}`
                    .toUpperCase()
                    .trim();
                  const rfc = (req["RFC"] || 'N/A').toUpperCase();
                  const curp = (req["CURP"] || 'N/A').toUpperCase();
                  const casado = (req["Casado"] || '—').toUpperCase();
                  const situacion = (req["¿Tu situación laboral es actualmente?"] || '—').toUpperCase();
                  const ingresoNeto = req["Ingresos netos mensuales"] || req["Ingreso Fijo"] || req["Ingreso Cheques"] || '—';
                  const email = (req["Correo Electrónico"] || 'N/A').toUpperCase();
                  const tel = req["Número Celular"] || 'N/A';
                  const timestamp = formatTimestampShort(
                    req["Timestamp"] || req["Marca temporal"] || req["Marca Temporal"]
                  );

                  return (
                    <tr
                      key={req.rowId || idx}
                      style={{ borderBottom: '1px solid var(--border-color)' }}
                    >
                      <td className="p-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          <span className="font-semibold text-gray-200">{timestamp}</span>
                        </div>
                        <span className="text-xs text-gray-500 block mt-1">
                          Fila #{req.rowId}
                        </span>
                      </td>
                      <td className="p-4 text-sm">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-gray-400" />
                          <span className="font-semibold text-white">{nombreCompleto || 'SIN NOMBRE'}</span>
                        </div>
                        <span className="text-xs text-gray-400 block mt-1">
                          Estado civil: {casado}
                        </span>
                      </td>
                      <td className="p-4 text-sm">
                        <span className="text-xs text-gray-400 font-semibold block">
                          RFC: <span className="font-mono text-gray-200">{rfc}</span>
                        </span>
                        <span className="text-xs text-gray-400 font-semibold block mt-0.5">
                          CURP: <span className="font-mono text-gray-200">{curp}</span>
                        </span>
                      </td>
                      <td className="p-4 text-sm">
                        <div className="flex items-center gap-1.5 text-xs text-gray-200 font-semibold">
                          <Briefcase size={12} className="text-teal-accent" />
                          <span>{situacion}</span>
                        </div>
                        <span className="text-xs text-gray-400 block mt-1">
                          Neto: ${ingresoNeto}
                        </span>
                      </td>
                      <td className="p-4 text-xs">
                        <span className="text-gray-300 block">{email}</span>
                        <span className="text-gray-400 block mt-1">{tel}</span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleEdit(req)}
                          className="btn btn-primary btn-xs flex items-center gap-1.5 mx-auto"
                        >
                          <Edit2 size={12} />
                          <span>Editar</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Vista móvil */}
          <div className="show-on-mobile p-4">
            <div className="flex flex-col gap-4">
              {displayedRequests.map((req, idx) => {
                const nombreCompleto = `${req["Nombre(s) acreditado"] || ''} ${
                  req["Apellido Paterno acreditado"] || ''
                } ${req["Apellido Materno acreditado"] || ''}`
                  .toUpperCase()
                  .trim();
                const rfc = (req["RFC"] || 'N/A').toUpperCase();
                const situacion = (req["¿Tu situación laboral es actualmente?"] || '—').toUpperCase();
                const tel = req["Número Celular"] || 'N/A';
                const timestamp = formatTimestampShort(
                  req["Timestamp"] || req["Marca temporal"] || req["Marca Temporal"]
                );

                return (
                  <div
                    key={req.rowId || idx}
                    className="glass-panel p-4 flex flex-col gap-3"
                    style={{ background: 'rgba(255, 255, 255, 0.02)' }}
                  >
                    <div className="flex justify-between items-start border-b pb-2">
                      <div>
                        <span className="text-xs text-teal-accent font-semibold block">
                          {timestamp} · Fila #{req.rowId}
                        </span>
                        <span className="font-bold text-white text-sm mt-1 block">
                          {nombreCompleto || 'SIN NOMBRE'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleEdit(req)}
                        className="btn btn-primary btn-xs"
                      >
                        <Edit2 size={12} /> Editar
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500 block">RFC</span>
                        <span className="font-mono text-gray-200">{rfc}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Situación / Celular</span>
                        <span className="text-gray-200">{situacion} · {tel}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 border-t text-xs text-gray-500 text-right">
            {searchTerm || filterDate
              ? `Mostrando ${displayedRequests.length} resultados encontrados`
              : `Mostrando las últimas ${displayedRequests.length} solicitudes de ${requests.length} registros en SOL_CREDITO_ACTUAL_2026`}
          </div>
        </div>
      )}
    </div>
  );
}
