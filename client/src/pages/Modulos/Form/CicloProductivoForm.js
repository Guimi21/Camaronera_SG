import React, { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import config from '../../../config';
import { useAuth } from '../../../context/AuthContext';
import { 
  getCssClassNames, 
  getFormTexts, 
  isSubmitDisabledCalc,
  validateFieldsByType,
  validateSelectionFields,
  validateFinalizedFields,
  validatePdfType,
  buildCreationData,
  buildEditionData,
  cargarPdf,
  validarValorNumerico,
  isValidNumericField,
  updateDensityIfNeeded
} from '../../../utils/cicloProductivoHelpers';
import {
  useCicloData,
  usePiscinasData,
  useTiposAlimentacion,
  usePromedioIncrementoPeso,
  useErrorHandling,
  usePdfValidation,
  useFormValidation,
  useDensityCalculation,
  useLibrasCalculation
} from '../../../utils/cicloProductivoHooks';
import {
  ErrorAlert,
  IncompleteUserInfo,
  NoPiscinasAlert,
  NoPiscinasAlertEdit,
  CycleWithSamplesAlert,
  PiscinaSelect
} from './CicloProductivoFormView';
import { BasicFieldsGrid } from './CicloProductivoFormFields';
import { FinalizedCycleFields } from './CicloProductivoFinalizedFields';
import { FormActions } from './CicloProductivoFormActions';

// Función para obtener la fecha local en formato YYYY-MM-DD
const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Función helper para validar valor numérico
// (Ahora importada de cicloProductivoCalculators)

// Validadores separados
const validateBasicFields = (formData) => {
  const fieldError = validateFieldsByType(formData);
  if (fieldError) return fieldError;
  return validateSelectionFields(formData);
};

export default function CicloProductivoForm() {
  const navigate = useNavigate();
  const { id: idCicloParam } = useParams();
  const { API_BASE_URL } = config;
  const { idCompania, idUsuario } = useAuth();
  
  const isEditMode = !!idCicloParam;
  
  const [formData, setFormData] = useState({
    id_piscina: '',
    fecha_siembra: getLocalDateString(),
    fecha_cosecha: '',
    cantidad_siembra: '',
    densidad: '',
    biomasa_cosecha: '',
    tipo_siembra: '',
    id_tipo_alimentacion: '',
    nombre_tipo_alimentacion: '',
    promedio_incremento_peso: '',
    libras_por_hectarea: '',
    ruta_pdf: '',
    estado: 'EN_CURSO'
  });

  const [pdfFile, setPdfFile] = useState(null);
  const [pdfFileName, setPdfFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const isConsultaMode = isEditMode && formData.estado === 'FINALIZADO';
  const inputRef1 = useRef(null);

  // Usar hooks personalizados
  const cicloDataResult = useCicloData(idCompania, idCicloParam, isEditMode, API_BASE_URL, setFormData);
  const piscinasDataResult = usePiscinasData(idCompania, isEditMode, API_BASE_URL);
  const tiposAlimentacion = useTiposAlimentacion(idCompania, API_BASE_URL);
  
  usePromedioIncrementoPeso(formData, idCicloParam, API_BASE_URL);

  // Combinar errores de múltiples fuentes
  const loadingCiclo = cicloDataResult.loadingCiclo;
  const loadingPiscinas = piscinasDataResult.loadingPiscinas;
  const piscinas = piscinasDataResult.piscinas;
  const tieneMuestras = cicloDataResult.tieneMuestras;

  // Usar hook personalizado para manejar errores de múltiples fuentes
  useErrorHandling(cicloDataResult.error, piscinasDataResult.error, setError);

  // Usar custom hooks para cálculos automáticos
  useDensityCalculation(formData, setFormData, piscinas);
  useLibrasCalculation(formData, setFormData, piscinas);

  // Prevenir scroll en inputs numéricos
  const handleWheel = (e) => {
    if (document.activeElement === e.target) {
      e.preventDefault();
    }
  };

  // Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (isValidNumericField(name) && !validarValorNumerico(value)) {
      return;
    }
    
    const newFormData = {
      ...formData,
      [name]: value,
      densidad: formData.densidad
    };
    
    newFormData.densidad = updateDensityIfNeeded(name, value, newFormData, piscinas);
    setFormData(newFormData);
  };

  // Usar hook personalizado para validación de PDF
  const handlePdfChange = usePdfValidation(pdfFile, setPdfFile, setPdfFileName, setError);

  // Construir datos (delegado a funciones del módulo)
  const construirDataCreacion = () => buildCreationData(formData, idCompania, idUsuario);

  const construirDataEdicion = (rutaPdf) => buildEditionData(formData, idCicloParam, idCompania, idUsuario, rutaPdf);

  // Usar hook personalizado para validación de formulario
  const realizarValidacionesBasicas = useFormValidation({
    formData,
    pdfFile,
    idCompania,
    idUsuario,
    setError,
    validateBasicFields,
    validateFinalizedFields,
    validatePdfType
  });

  const ejecutarCreacion = async () => {
    const dataToSend = construirDataCreacion();
    const response = await fetch(`${API_BASE_URL}/module/ciclosproductivos.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(dataToSend)
    });
    return response;
  };

  const ejecutarEdicion = async (rutaPdf) => {
    const dataToSend = construirDataEdicion(rutaPdf);
    const response = await fetch(`${API_BASE_URL}/module/ciclosproductivos.php`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(dataToSend)
    });
    return response;
  };

  const procesarRespuesta = (response, result, operacion) => {
    if (response.ok && result.success) {
      navigate('/layout/dashboard/monitoreo-ciclos');
    } else {
      const mensajeDefault = operacion === 'edicion' 
        ? 'Error al actualizar el ciclo productivo. Por favor intente nuevamente.'
        : 'Error al crear el ciclo productivo. Por favor intente nuevamente.';
      setError(result.message || mensajeDefault);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!realizarValidacionesBasicas()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isEditMode) {
        const rutaPdf = await cargarPdf(pdfFile, idCicloParam, idCompania, formData, API_BASE_URL);
        const response = await ejecutarEdicion(rutaPdf);
        const result = await response.json();
        procesarRespuesta(response, result, 'edicion');
      } else {
        const response = await ejecutarCreacion();
        const result = await response.json();
        procesarRespuesta(response, result, 'creacion');
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Error de conexión. Por favor intente nuevamente.');
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/layout/dashboard/monitoreo-ciclos');
  };

  const classNames = getCssClassNames(formData, isConsultaMode, pdfFile);
  const formTexts = getFormTexts(isConsultaMode, isEditMode, loading, piscinas, loadingPiscinas);
  const isDisabled = isSubmitDisabledCalc(loading, isEditMode, piscinas, loadingPiscinas);

  if (loadingCiclo || loadingPiscinas) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="form-container max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {formTexts.title}
        </h1>
        <p className="text-gray-600">
          {formTexts.description}
        </p>
      </div>

      {error && <ErrorAlert error={error} />}

      {(!idCompania || !idUsuario) && <IncompleteUserInfo />}

      {!isEditMode && !loadingPiscinas && piscinas.length === 0 && !error && <NoPiscinasAlert />}

      {isEditMode && !loadingPiscinas && piscinas.length === 0 && !error && <NoPiscinasAlertEdit />}

      {tieneMuestras && !isConsultaMode && <CycleWithSamplesAlert />}

      <form onSubmit={handleSubmit} className="space-y-6">
        <PiscinaSelect 
          formData={{ ...formData, isEditMode }}
          piscinas={piscinas}
          loadingPiscinas={loadingPiscinas}
          handleChange={handleChange}
          tieneMuestras={tieneMuestras}
          isConsultaMode={isConsultaMode}
        />

        <BasicFieldsGrid
          formData={formData}
          isConsultaMode={isConsultaMode}
          tieneMuestras={tieneMuestras}
          handleChange={handleChange}
          handleWheel={handleWheel}
          inputRef1={inputRef1}
          piscinas={piscinas}
          tiposAlimentacion={tiposAlimentacion}
          isEditMode={isEditMode}
          classNames={classNames}
          getLocalDateString={getLocalDateString}
        />

        {formData.estado === 'FINALIZADO' && (
          <FinalizedCycleFields
            formData={formData}
            isConsultaMode={isConsultaMode}
            classNames={classNames}
            handleChange={handleChange}
            handleWheel={handleWheel}
            pdfFile={pdfFile}
            pdfFileName={pdfFileName}
            handlePdfChange={handlePdfChange}
            API_BASE_URL={API_BASE_URL}
          />
        )}

        <FormActions
          isConsultaMode={isConsultaMode}
          isDisabled={isDisabled}
          loading={loading}
          submitText={formTexts.submitText}
          submitButtonClassName={formTexts.submitButtonClassName}
          onCancel={handleCancel}
        />
      </form>
    </div>
  );
}
