import React from 'react';
import PropTypes from 'prop-types';
import { ValidationMessage } from './CicloProductivoFormView';

// Componente para los campos de ciclo finalizado
const FinalizedCycleFields = ({
  formData,
  isConsultaMode,
  classNames,
  handleChange,
  handleWheel,
  pdfFile,
  pdfFileName,
  handlePdfChange,
  API_BASE_URL
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div>
      <label htmlFor="biomasa_cosecha" className="block text-sm font-medium text-gray-700 mb-2">
        Cosecha en libras <span className="text-red-600">*</span>
        <span className="text-xs text-red-600"> (Requerida para ciclos finalizados)</span>
      </label>
      <input
        type="number"
        id="biomasa_cosecha"
        name="biomasa_cosecha"
        value={formData.biomasa_cosecha}
        onFocus={(e) => e.target.addEventListener('wheel', handleWheel, { passive: false })}
        onBlur={(e) => e.target.removeEventListener('wheel', handleWheel)}
        onChange={handleChange}
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${classNames.biomasaCosecha}`}
        placeholder="Ej: 450000"
        min="1"
        step="1"
        disabled={isConsultaMode}
        required
      />
      {formData.biomasa_cosecha === '' && !isConsultaMode && <ValidationMessage fieldName="una Cosecha en libras" />}
      <p className="text-xs text-gray-500 mt-1 leyenda">
        Cantidad total de libras de camarones cosechadas
      </p>
    </div>

    <div>
      <label htmlFor="libras_por_hectarea" className="block text-sm font-medium text-gray-700 mb-2">
        Libras por Hectárea
      </label>
      <input
        type="text"
        id="libras_por_hectarea"
        name="libras_por_hectarea"
        value={formData.libras_por_hectarea}
        readOnly
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700 cursor-not-allowed"
        placeholder="Se calcula automáticamente"
      />
      <p className="text-xs text-gray-500 mt-1 leyenda">
        Biomasa de cosecha ÷ Hectáreas de la piscina
      </p>
    </div>

    <div>
      <label htmlFor="promedio_incremento_peso" className="block text-sm font-medium text-gray-700 mb-2">
        Promedio de Incremento de Peso
      </label>
      <input
        type="text"
        id="promedio_incremento_peso"
        name="promedio_incremento_peso"
        value={formData.promedio_incremento_peso}
        readOnly
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-700 cursor-not-allowed"
        placeholder="Se calcula automáticamente desde las muestras"
      />
      <p className="text-xs text-gray-500 mt-1 leyenda">
        Promedio de incremento de peso calculado automáticamente de todas las muestras registradas
      </p>
    </div>

    <div>
      <label htmlFor="ruta_pdf" className="block text-sm font-medium text-gray-700 mb-2">
        Informe PDF <span className="text-red-600">*</span>
      </label>
      <div className="flex items-center gap-3">
        <input
          type="file"
          id="ruta_pdf"
          name="ruta_pdf"
          accept=".pdf"
          onChange={handlePdfChange}
          disabled={isConsultaMode}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${classNames.rutaPdf}`}
        />
        {formData.ruta_pdf && !pdfFile && (
          <a
            href={`${API_BASE_URL}/${formData.ruta_pdf}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-xs font-medium transition-colors duration-200"
            title="Descargar PDF actual"
          >
            Descargar
          </a>
        )}
      </div>
      {pdfFile && <p className="text-xs text-green-600 mt-2">Archivo seleccionado: {pdfFileName}</p>}
      {formData.estado === 'FINALIZADO' && !pdfFile && !formData.ruta_pdf && !isConsultaMode && <ValidationMessage fieldName="un Informe PDF" />}
      <p className="text-xs text-gray-500 mt-1 leyenda">
        Informe PDF del ciclo productivo. Solo se permiten archivos en formato PDF.
      </p>
    </div>
  </div>
);

FinalizedCycleFields.propTypes = {
  formData: PropTypes.object.isRequired,
  isConsultaMode: PropTypes.bool.isRequired,
  classNames: PropTypes.object.isRequired,
  handleChange: PropTypes.func.isRequired,
  handleWheel: PropTypes.func.isRequired,
  pdfFile: PropTypes.object,
  pdfFileName: PropTypes.string.isRequired,
  handlePdfChange: PropTypes.func.isRequired,
  API_BASE_URL: PropTypes.string.isRequired
};

export { FinalizedCycleFields };
