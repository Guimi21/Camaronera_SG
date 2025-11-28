import React from 'react';
import PropTypes from 'prop-types';
import { ValidationMessage } from './CicloProductivoFormView';

// Componente para el grid de campos básicos
const BasicFieldsGrid = ({
  formData,
  isConsultaMode,
  tieneMuestras,
  handleChange,
  handleWheel,
  inputRef1,
  piscinas,
  tiposAlimentacion,
  isEditMode,
  classNames,
  getLocalDateString
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div>
      <label htmlFor="fecha_siembra" className="block text-sm font-medium text-gray-700 mb-2">
        Fecha de Siembra *
      </label>
      <input
        type="date"
        id="fecha_siembra"
        name="fecha_siembra"
        value={formData.fecha_siembra}
        onChange={handleChange}
        max={getLocalDateString()}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          (tieneMuestras || isConsultaMode) ? 'bg-gray-50 cursor-not-allowed' : ''
        }`}
        disabled={tieneMuestras || isConsultaMode}
        required
      />
      <p className="text-xs text-gray-500 mt-1 leyenda">
        Fecha en la que se realiza la siembra
      </p>
    </div>

    <div>
      <label htmlFor="fecha_cosecha" className="block text-sm font-medium text-gray-700 mb-2">
        Fecha de Cosecha {formData.estado === 'FINALIZADO' && <span className="text-red-600">*</span>}
        {formData.estado === 'FINALIZADO' && <span className="text-xs text-red-600"> (Requerida para ciclos finalizados)</span>}
      </label>
      <input
        type="date"
        id="fecha_cosecha"
        name="fecha_cosecha"
        value={formData.fecha_cosecha}
        onChange={handleChange}
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${classNames.fechaCosecha}`}
        disabled={isConsultaMode}
        required={formData.estado === 'FINALIZADO'}
      />
      {formData.estado === 'FINALIZADO' && formData.fecha_cosecha === '' && !isConsultaMode && <ValidationMessage fieldName="una Fecha de Cosecha" />}
      <p className="text-xs text-gray-500 mt-1 leyenda">
        {formData.estado === 'FINALIZADO' 
          ? 'Fecha de cosecha es obligatoria para ciclos finalizados'
          : 'Fecha estimada de cosecha (opcional)'
        }
      </p>
    </div>

    <div>
      <label htmlFor="cantidad_siembra" className="block text-sm font-medium text-gray-700 mb-2">
        Cantidad de Siembra *
      </label>
      <input
        type="number"
        id="cantidad_siembra"
        name="cantidad_siembra"
        value={formData.cantidad_siembra}
        ref={inputRef1}
        onFocus={(e) => e.target.addEventListener('wheel', handleWheel, { passive: false })}
        onBlur={(e) => e.target.removeEventListener('wheel', handleWheel)}
        onChange={handleChange}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          (tieneMuestras || isConsultaMode) ? 'bg-gray-50 cursor-not-allowed' : ''
        }`}
        placeholder="Ej: 500000"
        min="1"
        step="1"
        disabled={tieneMuestras || isConsultaMode}
        required
      />
      <p className="text-xs text-gray-500 mt-1 leyenda">
        Número de larvas o individuos sembrados
      </p>
    </div>

    <div>
      <label htmlFor="densidad" className="block text-sm font-medium text-gray-700 mb-2">
        Densidad (por hectárea) * <span className="text-blue-600 text-xs">(Calculado automáticamente)</span>
      </label>
      <input
        type="text"
        id="densidad"
        name="densidad"
        value={formData.densidad}
        readOnly
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700 cursor-not-allowed"
        placeholder="Se calcula automáticamente"
      />
      <p className="text-xs text-gray-500 mt-1 leyenda">
        Cantidad de siembra ÷ Hectáreas de la piscina
        {formData.id_piscina && piscinas.length > 0 && (() => {
          const piscinaSeleccionada = piscinas.find(p => p.id_piscina == formData.id_piscina);
          return piscinaSeleccionada ? ` (${piscinaSeleccionada.hectareas} ha)` : '';
        })()}
      </p>
    </div>

    <div>
      <label htmlFor="tipo_siembra" className="block text-sm font-medium text-gray-700 mb-2">
        Tipo de Siembra *
      </label>
      <select
        id="tipo_siembra"
        name="tipo_siembra"
        value={formData.tipo_siembra}
        onChange={handleChange}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          isConsultaMode ? 'bg-gray-50 text-gray-700 cursor-not-allowed' : ''
        }`}
        disabled={isConsultaMode}
        required
      >
        <option value="">Seleccione un tipo de siembra</option>
        <option value="transf">transf</option>
        <option value="Directo">Directo</option>
      </select>
      {formData.tipo_siembra === '' && !isConsultaMode && <ValidationMessage fieldName="un Tipo de Siembra" />}
      <p className="text-xs text-gray-500 mt-1 leyenda">
        Tipo o método de siembra utilizado
      </p>
    </div>

    <div>
      <label htmlFor="id_tipo_alimentacion" className="block text-sm font-medium text-gray-700 mb-2">
        Tipo de Alimentación *
      </label>
      <select
        id="id_tipo_alimentacion"
        name="id_tipo_alimentacion"
        value={formData.id_tipo_alimentacion}
        onChange={handleChange}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          isConsultaMode ? 'bg-gray-50 text-gray-700 cursor-not-allowed' : ''
        }`}
        disabled={isConsultaMode}
        required
      >
        <option value="">Seleccione un tipo de alimentación</option>
        {tiposAlimentacion.map(tipo => (
          <option key={tipo.id_tipo_alimentacion} value={tipo.id_tipo_alimentacion}>
            {tipo.nombre}
          </option>
        ))}
      </select>
      {formData.id_tipo_alimentacion === '' && !isConsultaMode && <ValidationMessage fieldName="un Tipo de Alimentación" />}
      <p className="text-xs text-gray-500 mt-1 leyenda">
        Tipo de alimentación a utilizar en el ciclo productivo
      </p>
    </div>

    <div>
      <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-2">
        Estado *
      </label>
      {isEditMode ? (
        <select
          id="estado"
          name="estado"
          value={formData.estado}
          onChange={handleChange}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            isConsultaMode ? 'bg-gray-50 text-gray-700 cursor-not-allowed' : ''
          }`}
          disabled={isConsultaMode}
          required
        >
          <option value="EN_CURSO">En Curso</option>
          <option value="FINALIZADO">Finalizado</option>
        </select>
      ) : (
        <input
          type="text"
          id="estado"
          name="estado"
          value="En Curso"
          readOnly
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700 cursor-not-allowed"
        />
      )}
      <p className="text-xs text-gray-500 mt-1 leyenda">
        {isEditMode ? 'Estado actual del ciclo productivo' : 'Los ciclos se crean siempre en estado "En Curso"'}
      </p>
    </div>
  </div>
);

BasicFieldsGrid.propTypes = {
  formData: PropTypes.object.isRequired,
  isConsultaMode: PropTypes.bool.isRequired,
  tieneMuestras: PropTypes.bool.isRequired,
  handleChange: PropTypes.func.isRequired,
  handleWheel: PropTypes.func.isRequired,
  inputRef1: PropTypes.object.isRequired,
  piscinas: PropTypes.array.isRequired,
  tiposAlimentacion: PropTypes.array.isRequired,
  isEditMode: PropTypes.bool.isRequired,
  classNames: PropTypes.object.isRequired,
  getLocalDateString: PropTypes.func.isRequired
};

export { BasicFieldsGrid };
