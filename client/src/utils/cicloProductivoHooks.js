import { useEffect, useState } from 'react';
import { fetchApi } from '../services/api';
import { 
  buildFormDataFromCiclo, 
  filterPiscinasForMode,
  calcularDensidadValue,
  calcularLibrasPorHectareaValue,
  shouldRecalculateDensity,
  shouldRecalculateLibras,
  shouldClearLibras
} from './cicloProductivoHelpers';

// Hook para cargar datos del ciclo
export const useCicloData = (idCompania, idCicloParam, isEditMode, API_BASE_URL, onFormDataLoaded) => {
  const [loadingCiclo, setLoadingCiclo] = useState(isEditMode);
  const [error, setError] = useState('');
  const [tieneMuestras, setTieneMuestras] = useState(false);

  useEffect(() => {
    const fetchCicloData = async () => {
      if (!idCompania || !idCicloParam) {
        setError("No se pudo obtener la información necesaria.");
        setLoadingCiclo(false);
        return;
      }

      try {
        const ciclo = await fetchApi(
          `${API_BASE_URL}/module/ciclosproductivos.php?id_compania=${idCompania}&id_ciclo=${idCicloParam}`,
          "Error al obtener datos del ciclo"
        );
        
        onFormDataLoaded(buildFormDataFromCiclo(ciclo));
        await checkMuestras(ciclo.id_ciclo);
        setError('');
      } catch (err) {
        console.error("Error fetching ciclo data:", err);
        setError(err.message || "No se pudieron cargar los datos del ciclo.");
      } finally {
        setLoadingCiclo(false);
      }
    };
    
    const checkMuestras = async (idCiclo) => {
      try {
        const muestrasData = await fetchApi(
          `${API_BASE_URL}/module/muestras.php?id_ciclo=${idCiclo}&count=true`,
          "Error al verificar muestras"
        );
        if (muestrasData) {
          setTieneMuestras(muestrasData.tiene_muestras);
        }
      } catch (err) {
        console.error("Error checking muestras:", err);
        setTieneMuestras(false);
      }
    };
    
    if (isEditMode && idCompania && idCicloParam) {
      fetchCicloData();
    } else {
      setLoadingCiclo(false);
    }
  }, [idCompania, idCicloParam, isEditMode, API_BASE_URL, onFormDataLoaded]);

  return { loadingCiclo, error, tieneMuestras, setError };
};

// Hook para cargar piscinas disponibles
export const usePiscinasData = (idCompania, isEditMode, API_BASE_URL) => {
  const [piscinas, setPiscinas] = useState([]);
  const [loadingPiscinas, setLoadingPiscinas] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPiscinasDisponibles = async () => {
      if (!idCompania) {
        setError("No se pudo obtener la información de la compañía del usuario.");
        setLoadingPiscinas(false);
        return;
      }

      try {
        const piscinasData = await fetchApi(
          `${API_BASE_URL}/module/piscinas.php?id_compania=${idCompania}`,
          "Error al obtener piscinas"
        );

        if (isEditMode) {
          setPiscinas(piscinasData);
        } else {
          const ciclosData = await fetchApi(
            `${API_BASE_URL}/module/ciclosproductivos.php?id_compania=${idCompania}`,
            "Error al obtener ciclos productivos"
          );
          setPiscinas(filterPiscinasForMode(piscinasData, ciclosData, isEditMode));
        }
        setError('');
      } catch (err) {
        console.error("Error fetching piscinas disponibles:", err);
        setError(err.message || "No se pudieron cargar las piscinas disponibles.");
      } finally {
        setLoadingPiscinas(false);
      }
    };

    if (idCompania) {
      fetchPiscinasDisponibles();
    } else {
      setLoadingPiscinas(false);
    }
  }, [idCompania, isEditMode, API_BASE_URL]);

  return { piscinas, loadingPiscinas, error };
};

// Hook para cargar tipos de alimentación
export const useTiposAlimentacion = (idCompania, API_BASE_URL) => {
  const [tiposAlimentacion, setTiposAlimentacion] = useState([]);

  useEffect(() => {
    const fetchTiposAlimentacion = async () => {
      if (!idCompania) return;

      try {
        const tiposData = await fetchApi(
          `${API_BASE_URL}/module/tipo_alimentacion.php?id_compania=${idCompania}`,
          "Error al obtener tipos de alimentación"
        );
        setTiposAlimentacion(tiposData);
      } catch (err) {
        console.error("Error fetching tipos de alimentación:", err);
      }
    };

    if (idCompania) {
      fetchTiposAlimentacion();
    }
  }, [idCompania, API_BASE_URL]);

  return tiposAlimentacion;
};

// Hook para cargar promedio de incremento de peso
export const usePromedioIncrementoPeso = (formData, idCicloParam, API_BASE_URL) => {
  useEffect(() => {
    const fetchPromedioIncrementoPeso = async () => {
      if (formData.estado === 'FINALIZADO' && idCicloParam && formData.promedio_incremento_peso === '') {
        try {
          const muestrasData = await fetchApi(
            `${API_BASE_URL}/module/muestras.php?id_ciclo=${idCicloParam}&promedio_incremento_peso=true`,
            "Error al obtener promedio de incremento de peso"
          );
          
          if (muestrasData) {
            const promedio = muestrasData.promedio_incremento_peso !== null && muestrasData.promedio_incremento_peso !== undefined 
              ? muestrasData.promedio_incremento_peso 
              : '';
            return promedio;
          }
        } catch (err) {
          console.error("Error fetching promedio incremento peso:", err);
        }
      }
    };

    fetchPromedioIncrementoPeso();
  }, [formData.estado, idCicloParam, API_BASE_URL]);
};

// ===== HOOKS DE VALIDACIÓN Y MANEJO DE ERRORES =====

// Hook para manejar errores de múltiples fuentes
export const useErrorHandling = (cicloError, piscinasError, setError) => {
  useEffect(() => {
    if (cicloError) {
      setError(cicloError);
    }
  }, [cicloError, setError]);

  useEffect(() => {
    if (piscinasError) {
      setError(piscinasError);
    }
  }, [piscinasError, setError]);

  useEffect(() => {
    if (setError) {
      const handleErrorScroll = () => {
        if (cicloError || piscinasError) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      };
      handleErrorScroll();
    }
  }, [cicloError, piscinasError, setError]);
};

// Hook para validación de archivos PDF
export const usePdfValidation = (pdfFile, setPdfFile, setPdfFileName, setError) => {
  const handlePdfChange = (e) => {
    const file = e.target.files[0];
    
    if (!file) {
      setPdfFile(null);
      setPdfFileName('');
      return;
    }
    
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      setError('Solo se permiten archivos en formato PDF.');
      setPdfFile(null);
      setPdfFileName('');
      e.target.value = '';
      return;
    }
    
    setPdfFile(file);
    setPdfFileName(file.name);
    setError('');
  };

  return handlePdfChange;
};

// Hook para validación de campos
export const useFormValidation = ({
  formData,
  pdfFile,
  idCompania,
  idUsuario,
  setError,
  validateBasicFields,
  validateFinalizedFields,
  validatePdfType
}) => {
  const realizarValidacionesBasicas = () => {
    const errorBasico = validateBasicFields(formData);
    if (errorBasico) {
      setError(errorBasico);
      return false;
    }

    const errorFinalizado = validateFinalizedFields(formData, pdfFile);
    if (errorFinalizado) {
      setError(errorFinalizado);
      return false;
    }

    const errorPdf = validatePdfType(pdfFile);
    if (errorPdf) {
      setError(errorPdf);
      return false;
    }

    if (!idCompania || !idUsuario) {
      setError('No se pudo obtener la información del usuario o compañía.');
      return false;
    }

    return true;
  };

  return realizarValidacionesBasicas;
};

// ===== HOOKS DE CÁLCULO AUTOMÁTICO =====

// Hook para recalcular densidad
export const useDensityCalculation = (formData, setFormData, piscinas) => {
  useEffect(() => {
    if (shouldRecalculateDensity(formData, piscinas)) {
      const densidadCalculada = calcularDensidadValue(formData.cantidad_siembra, formData.id_piscina, piscinas);
      if (densidadCalculada !== formData.densidad) {
        setFormData(prevData => ({
          ...prevData,
          densidad: densidadCalculada
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.cantidad_siembra, formData.id_piscina, formData.densidad, piscinas]);
};

// Hook para recalcular libras por hectárea
export const useLibrasCalculation = (formData, setFormData, piscinas) => {
  useEffect(() => {
    if (shouldRecalculateLibras(formData, piscinas)) {
      const librasCalculadas = calcularLibrasPorHectareaValue(formData.biomasa_cosecha, formData.id_piscina, piscinas);
      if (librasCalculadas !== formData.libras_por_hectarea) {
        setFormData(prevData => ({
          ...prevData,
          libras_por_hectarea: librasCalculadas
        }));
      }
    } else if (shouldClearLibras(formData)) {
      setFormData(prevData => ({
        ...prevData,
        libras_por_hectarea: ''
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.biomasa_cosecha, formData.id_piscina, formData.estado, formData.libras_por_hectarea, piscinas]);
};
