import React from 'react';
import PropTypes from 'prop-types';
import config from '../../../config';

const { API_BASE_URL } = config;

// Componente para mostrar mensaje de validación
const ValidationMessage = ({ fieldName }) => (
  <div className="validation-message">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <span>Ingresa {fieldName}</span>
  </div>
);

ValidationMessage.propTypes = {
  fieldName: PropTypes.string.isRequired
};

// Componente para el mensaje de error principal
const ErrorAlert = ({ error }) => (
  <div className="header-user mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-3">
    <svg className="info w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
    {error}
  </div>
);

ErrorAlert.propTypes = {
  error: PropTypes.string.isRequired
};

// Componente para información de usuario incompleta
const IncompleteUserInfo = () => (
  <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
    <p><strong>⚠️ Información de usuario incompleta</strong></p>
    <p className="text-sm mt-1">
      No se pudo cargar la información de la compañía o del usuario. Por favor, cierre sesión e inicie sesión nuevamente.
    </p>
  </div>
);

// Componente para alerta de piscinas no disponibles (creación)
const NoPiscinasAlert = () => (
  <div className="header-user mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-3">
    <svg className="info w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
    <div>
      <p><strong>No hay piscinas disponibles.</strong></p>
      <p className="text-sm mt-1">
        Para agregar ciclos productivos, debe haber piscinas sin ciclos activos en el sistema.
        Las piscinas con ciclos "EN_CURSO" no están disponibles para nuevos ciclos.
      </p>
    </div>
  </div>
);

// Componente para alerta de piscinas no disponibles (edición)
const NoPiscinasAlertEdit = () => (
  <div className="header-user mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-3">
    <svg className="info w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
    <div>
      <p><strong>No hay piscinas disponibles.</strong></p>
      <p className="text-sm mt-1">
        Para editar ciclos productivos, debe haber piscinas disponibles en el sistema.
      </p>
    </div>
  </div>
);

// Componente para alerta de ciclo con muestras
const CycleWithSamplesAlert = () => (
  <div className="header-user mb-6 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded flex items-center gap-3">
    <svg className="info w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
    <div>
      <p><strong>Ciclo con muestras registradas</strong></p>
      <p className="text-sm mt-1">
        Este ciclo productivo tiene muestras asociadas. Solo se pueden editar los campos: Fecha de Cosecha, Tipo de Siembra, Tipo de Alimentación y Estado.
      </p>
    </div>
  </div>
);

// Componente para selector de piscina
const PiscinaSelect = ({ 
  formData, 
  piscinas, 
  loadingPiscinas, 
  handleChange, 
  tieneMuestras, 
  isConsultaMode 
}) => (
  <div>
    <label htmlFor="id_piscina" className="block text-sm font-medium text-gray-700 mb-2">
      Piscina *
    </label>
    {loadingPiscinas ? (
      <div className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
        Cargando piscinas...
      </div>
    ) : (
      <select
        id="id_piscina"
        name="id_piscina"
        value={formData.id_piscina}
        onChange={handleChange}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          (tieneMuestras || isConsultaMode) ? 'bg-gray-50 cursor-not-allowed' : ''
        }`}
        disabled={piscinas.length === 0 || tieneMuestras || isConsultaMode}
        required
      >
        <option value="">
          {piscinas.length === 0 
            ? "No hay piscinas disponibles" 
            : "Seleccione una piscina"
          }
        </option>
        {piscinas.map(piscina => (
          <option key={piscina.id_piscina} value={piscina.id_piscina}>
            {piscina.codigo} - {piscina.hectareas} ha - {piscina.ubicacion}
          </option>
        ))}
      </select>
    )}
    {formData.id_piscina === '' && !isConsultaMode && <ValidationMessage fieldName="una Piscina" />}
    <p className="text-xs text-gray-500 mt-1 leyenda">
      {formData.isEditMode ? 'Seleccione la piscina donde se realiza el ciclo productivo' : 'Solo se muestran piscinas sin ciclos productivos activos (EN_CURSO)'}
    </p>
  </div>
);

PiscinaSelect.propTypes = {
  formData: PropTypes.object.isRequired,
  piscinas: PropTypes.array.isRequired,
  loadingPiscinas: PropTypes.bool.isRequired,
  handleChange: PropTypes.func.isRequired,
  tieneMuestras: PropTypes.bool.isRequired,
  isConsultaMode: PropTypes.bool.isRequired
};

export {
  ValidationMessage,
  ErrorAlert,
  IncompleteUserInfo,
  NoPiscinasAlert,
  NoPiscinasAlertEdit,
  CycleWithSamplesAlert,
  PiscinaSelect
};
