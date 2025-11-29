import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import config from '../../../config';
import { useAuth } from '../../../context/AuthContext';
import { fetchApi } from '../../../services/api';

// Función para obtener la fecha local en formato YYYY-MM-DD
const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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

export default function MuestraForm() {
  const navigate = useNavigate();
  const { API_BASE_URL } = config;
  const { idCompania, idUsuario } = useAuth();
  
  const [formData, setFormData] = useState({
    id_ciclo: '',
    dias_cultivo: '',
    peso: '',
    incremento_peso: '',
    biomasa_lbs: '',
    balanceados: {},
    balanceado_acumulado: '',
    conversion_alimenticia: '',
    poblacion_actual: '',
    supervivencia: '',
    observaciones: '',
    fecha_muestra: getLocalDateString(),
    estado: 'ACTIVA'
  });
  
  const [ciclosDisponibles, setCiclosDisponibles] = useState([]);
  const [tiposBalanceado, setTiposBalanceado] = useState([]); // Tipos de balanceado de la compañía
  const [ultimoMuestra, setUltimoMuestra] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingCiclos, setLoadingCiclos] = useState(true);
  const [loadingTipos, setLoadingTipos] = useState(true);
  const [error, setError] = useState('');

  // Hacer scroll al inicio cuando hay un error
  useEffect(() => {
    if (error) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [error]);

  // Referencias para inputs numéricos
  const inputRef1 = useRef(null); // Peso (g)
  const inputRef2 = useRef(null); // Supervivencia (%)
  const balanceadoInputRefs = useRef({}); // Dinámicos para balanceados

  const handleWheel = (e) => {
    // Solo bloquea el scroll si el input está enfocado
    if (document.activeElement === e.target) {
      e.preventDefault();
    }
  };

  // Función para cargar los tipos de balanceado de la compañía
  const fetchTiposBalanceado = async () => {
    if (!idCompania) {
      console.error("No hay ID de compañía disponible");
      setLoadingTipos(false);
      return [];
    }

    try {
      const data = await fetchApi(
        `${API_BASE_URL}/module/tipos_balanceado.php?id_compania=${idCompania}`,
        "Error al obtener tipos de balanceado"
      );
      
      setTiposBalanceado(data);
      
      // Inicializar los campos de balanceado en el formData
      const balanceadosIniciales = {};
      for (const tipo of data) {
        balanceadosIniciales[tipo.id_tipo_balanceado] = '';
      }
      
      setFormData(prev => ({
        ...prev,
        balanceados: balanceadosIniciales
      }));
      
      return data;
    } catch (err) {
      console.error("Error fetching tipos balanceado:", err);
      setTiposBalanceado([]);
      return [];
    } finally {
      setLoadingTipos(false);
    }
  };

  // Función para cargar los ciclos productivos disponibles
  const fetchCiclosDisponibles = async () => {
    if (!idCompania) {
      setError("No se pudo obtener la información de la compañía del usuario.");
      setLoadingCiclos(false);
      return;
    }

    try {
      const data = await fetchApi(
        `${API_BASE_URL}/module/ciclosproductivos.php?id_compania=${idCompania}`,
        "Error al obtener ciclos productivos"
      );
      
      // Filtrar solo los ciclos que estén EN_CURSO
      const ciclosEnCurso = data.filter(ciclo => ciclo.estado === 'EN_CURSO');
      setCiclosDisponibles(ciclosEnCurso);
      setError('');
    } catch (err) {
      console.error("Error fetching ciclos:", err);
      setError(err.message || "No se pudieron cargar los ciclos productivos.");
    } finally {
      setLoadingCiclos(false);
    }
  };

  // Función para obtener el último muestra de un ciclo productivo
  const fetchUltimoMuestra = async (idCiclo) => {
    if (!idCiclo) {
      setUltimoMuestra(null);
      return;
    }

    try {
      const url = `${API_BASE_URL}/module/muestras.php?id_ciclo=${idCiclo}&ultimo=true`;
      
      const data = await fetchApi(url, "Error al obtener el último muestra");
      
      if (data && data.length > 0) {
        // El backend retorna el muestra más reciente ordenado por:
        // 1. fecha_muestra (DESC) - fecha del muestreo
        // 2. fecha_creacion (DESC) - fecha de creación como criterio de desempate
        // Esto garantiza que si hay múltiples muestras con la misma fecha_muestra,
        // se use el que fue creado más recientemente.
        setUltimoMuestra(data[0]);
      } else {
        // No hay muestras previos para este ciclo
        setUltimoMuestra(null);
      }
    } catch (err) {
      console.error("❌ Error al obtener último muestra:", err.message);
      setUltimoMuestra(null);
    }
  };

  // Cargar ciclos y tipos de balanceado disponibles al montar el componente
  useEffect(() => {
    if (idCompania) {
      const loadInitialData = async () => {
        await fetchTiposBalanceado();
        await fetchCiclosDisponibles();
      };
      loadInitialData();
    } else {
      setLoadingCiclos(false);
      setLoadingTipos(false);
    }
  }, [idCompania]);

  // Monitor para cambios en ultimoMuestra
  useEffect(() => {
    // Monitoring changes in ultimoMuestra for automatic recalculations
  }, [ultimoMuestra]);

  // Efecto para detectar cambios en el ciclo seleccionado y preparar recálculos
  useEffect(() => {
    if (formData.id_ciclo && formData.id_ciclo !== '') {
      // El fetchUltimoMuestra se ejecutará automáticamente en handleChange
      // Los useEffect de cálculos se ejecutarán cuando ultimoMuestra cambie
    }
  }, [formData.id_ciclo]);

  // Efecto para recalcular días de cultivo cuando cambien los datos relevantes
  useEffect(() => {
    if (formData.id_ciclo && formData.fecha_muestra && ciclosDisponibles.length > 0) {
      const cicloSeleccionado = ciclosDisponibles.find(ciclo => ciclo.id_ciclo == formData.id_ciclo);
      if (cicloSeleccionado) {
        const diasCultivo = calcularDiasCultivo(cicloSeleccionado.fecha_siembra, formData.fecha_muestra);
        if (diasCultivo != formData.dias_cultivo) {
          setFormData(prev => ({
            ...prev,
            dias_cultivo: diasCultivo
          }));
        }
      }
    }
  }, [formData.id_ciclo, formData.fecha_muestra, ciclosDisponibles]);

  // Efecto para recalcular incremento de peso cuando cambien los datos relevantes
  useEffect(() => {
    if (formData.peso) {
      const pesoAnterior = ultimoMuestra ? ultimoMuestra.peso : null;
      const incrementoPeso = calcularIncrementoPeso(formData.peso, pesoAnterior);
      if (incrementoPeso !== formData.incremento_peso) {
        setFormData(prev => ({
          ...prev,
          incremento_peso: incrementoPeso
        }));
      }
    } else if (formData.incremento_peso !== '') {
      // Si no hay peso, limpiar el incremento
      setFormData(prev => ({
        ...prev,
        incremento_peso: ''
      }));
    }
  }, [formData.peso, ultimoMuestra]);

  // Efecto para recalcular balanceado acumulado cuando cambien los datos relevantes
  useEffect(() => {
    // Solo calcular si hay al menos un valor de balanceado ingresado
    const tieneBalanceado = Object.values(formData.balanceados).some(val => val !== '' && val !== null && val !== undefined);
    
    if (tieneBalanceado) {
      const balanceadoAnterior = ultimoMuestra ? ultimoMuestra.balanceado_acumulado : 0;
      const balanceadoAcumulado = calcularBalanceadoAcumulado(
        formData.balanceados,
        balanceadoAnterior
      );
      
      if (balanceadoAcumulado !== formData.balanceado_acumulado) {
        setFormData(prev => ({
          ...prev,
          balanceado_acumulado: balanceadoAcumulado
        }));
      }
    } else if (formData.balanceado_acumulado !== '') {
      // Si no hay valores de consumo, limpiar el acumulado
      setFormData(prev => ({
        ...prev,
        balanceado_acumulado: ''
      }));
    }
  }, [formData.balanceados, ultimoMuestra]);

  // Efecto para recalcular población actual cuando cambien los datos relevantes
  useEffect(() => {
    if (formData.supervivencia && formData.id_ciclo && ciclosDisponibles.length > 0) {
      const cicloSeleccionado = ciclosDisponibles.find(ciclo => ciclo.id_ciclo == formData.id_ciclo);
      if (cicloSeleccionado?.cantidad_siembra) {
        const poblacionActual = calcularPoblacionActual(formData.supervivencia, cicloSeleccionado.cantidad_siembra);
        if (poblacionActual !== formData.poblacion_actual) {
          setFormData(prev => ({
            ...prev,
            poblacion_actual: poblacionActual
          }));
        }
      }
    } else if (formData.poblacion_actual !== '') {
      // Si no hay supervivencia, limpiar la población
      setFormData(prev => ({
        ...prev,
        poblacion_actual: ''
      }));
    }
  }, [formData.supervivencia, formData.id_ciclo, ciclosDisponibles]);

  // Efecto para recalcular biomasa cuando cambien los datos relevantes
  useEffect(() => {
    if (formData.peso && formData.poblacion_actual) {
      const biomasa = calcularBiomasa(formData.peso, formData.poblacion_actual);
      if (biomasa !== formData.biomasa_lbs) {
        setFormData(prev => ({
          ...prev,
          biomasa_lbs: biomasa
        }));
      }
    } else if (formData.biomasa_lbs !== '') {
      // Si no hay peso o población, limpiar la biomasa
      setFormData(prev => ({
        ...prev,
        biomasa_lbs: ''
      }));
    }
  }, [formData.peso, formData.poblacion_actual]);

  // Efecto para recalcular conversión alimenticia cuando cambien los datos relevantes
  useEffect(() => {
    if (formData.balanceado_acumulado && formData.biomasa_lbs) {
      const conversionAlimenticia = calcularConversionAlimenticia(formData.balanceado_acumulado, formData.biomasa_lbs);
      if (conversionAlimenticia !== formData.conversion_alimenticia) {
        setFormData(prev => ({
          ...prev,
          conversion_alimenticia: conversionAlimenticia
        }));
      }
    } else if (formData.conversion_alimenticia !== '') {
      // Si no hay balanceado o biomasa, limpiar la conversión
      setFormData(prev => ({
        ...prev,
        conversion_alimenticia: ''
      }));
    }
  }, [formData.balanceado_acumulado, formData.biomasa_lbs]);

  // Función para calcular días de cultivo
  const calcularDiasCultivo = (fechaSiembra, fechaMuestra) => {
    if (!fechaSiembra || !fechaMuestra) return 0;
    
    const fechaSiembraDate = new Date(fechaSiembra);
    const fechaMuestraDate = new Date(fechaMuestra);
    
    if (fechaMuestraDate < fechaSiembraDate) return 0;
    
    const diferenciaMilisegundos = fechaMuestraDate - fechaSiembraDate;
    const diferenciaDias = Math.floor(diferenciaMilisegundos / (1000 * 60 * 60 * 24));
    
    return diferenciaDias;
  };

  // Función para calcular incremento de peso
  const calcularIncrementoPeso = (pesoActual, pesoAnterior) => {
    if (!pesoActual) return '';
    
    // Si no hay peso anterior (primer muestra del ciclo), el incremento es el peso actual
    if (pesoAnterior === null || pesoAnterior === undefined) {
      const pesoActualNum = Number.parseFloat(pesoActual);
      return Number.isNaN(pesoActualNum) ? '' : pesoActualNum.toFixed(2);
    }
    
    const pesoActualNum = Number.parseFloat(pesoActual);
    const pesoAnteriorNum = Number.parseFloat(pesoAnterior);
    
    if (Number.isNaN(pesoActualNum) || Number.isNaN(pesoAnteriorNum)) return '';
    
    const incremento = pesoActualNum - pesoAnteriorNum;
    return incremento.toFixed(2);
  };

  // Función para calcular balanceado acumulado
  const calcularBalanceadoAcumulado = (balanceadosObj, balanceadoAnterior) => {
    // Sumar todos los valores de balanceado ingresados
    const sumaActual = Object.values(balanceadosObj).reduce((sum, val) => {
      const numVal = (val === '' || val === null || val === undefined) ? 0 : Number.parseFloat(val) || 0;
      return sum + numVal;
    }, 0);
    
    const valAnterior = (balanceadoAnterior === null || balanceadoAnterior === undefined) ? 0 : Number.parseFloat(balanceadoAnterior) || 0;
    const acumuladoTotal = valAnterior + sumaActual;
    
    return acumuladoTotal.toFixed(2);
  };

  // Función para calcular población actual
  const calcularPoblacionActual = (supervivencia, cantidadSiembra) => {
    if (!supervivencia || !cantidadSiembra) return '';
    
    const supervivenciaNum = Number.parseFloat(supervivencia);
    const cantidadSiembraNum = Number.parseFloat(cantidadSiembra);
    
    if (Number.isNaN(supervivenciaNum) || Number.isNaN(cantidadSiembraNum)) return '';
    
    // Convertir supervivencia de porcentaje a decimal (dividir entre 100)
    const supervivenciaDecimal = supervivenciaNum / 100;
    const poblacionActual = cantidadSiembraNum * supervivenciaDecimal;
    
    return String(Math.round(poblacionActual));
  };

  // Función para calcular biomasa en libras
  const calcularBiomasa = (pesoGramos, poblacionActual) => {
    if (!pesoGramos || !poblacionActual) return '';
    
    const pesoGramosNum = Number.parseFloat(pesoGramos);
    const poblacionActualNum = Number.parseFloat(poblacionActual);
    
    if (Number.isNaN(pesoGramosNum) || Number.isNaN(poblacionActualNum)) return '';
    
    // Convertir peso de gramos a libras (1 libra = 454 gramos)
    const pesoLibras = pesoGramosNum / 454;
    const biomasaLbs = pesoLibras * poblacionActualNum;
    
    return biomasaLbs.toFixed(2); // Redondeamos a 2 decimales
  };

  // Función para calcular conversión alimenticia
  const calcularConversionAlimenticia = (balanceadoAcumulado, biomasaLbs) => {
    if (!balanceadoAcumulado || !biomasaLbs) return '';
    
    const balanceadoNum = Number.parseFloat(balanceadoAcumulado);
    const biomasaNum = Number.parseFloat(biomasaLbs);
    
    if (Number.isNaN(balanceadoNum) || Number.isNaN(biomasaNum) || biomasaNum === 0) return '';
    
    const conversionAlimenticia = balanceadoNum / biomasaNum;
    
    return conversionAlimenticia.toFixed(3); // Redondeamos a 3 decimales para mayor precisión
  };

  // Validar valor numérico según campo
  const validarValorNumerico = (name, value) => {
    if (value === '') return true;
    const numVal = Number.parseFloat(value);
    
    if (Number.isNaN(numVal) || numVal < 0) return false;
    if (name === 'supervivencia' && numVal > 100) return false;
    
    return true;
  };

  // Validar que al menos un balanceado tenga consumo
  const validarAlMenosUnBalanceado = (balanceados) => {
    return Object.values(balanceados).some(val => val !== '' && val !== null && val !== undefined && Number.parseFloat(val) > 0);
  };

  // Procesar cambio de ciclo productivo
  const procesarCambioCiclo = (value, newFormData) => {
    const cicloSeleccionado = ciclosDisponibles.find(ciclo => ciclo.id_ciclo == value);
    
    if (cicloSeleccionado) {
      fetchUltimoMuestra(value);
      
      if (newFormData.fecha_muestra) {
        newFormData.dias_cultivo = calcularDiasCultivo(cicloSeleccionado.fecha_siembra, newFormData.fecha_muestra);
      }
      
      newFormData.balanceado_acumulado = '';
      newFormData.incremento_peso = '';
    }
  };

  // Procesar cambio de fecha muestra
  const procesarCambioFecha = (value, newFormData) => {
    if (newFormData.id_ciclo) {
      const cicloSeleccionado = ciclosDisponibles.find(ciclo => ciclo.id_ciclo == newFormData.id_ciclo);
      if (cicloSeleccionado) {
        newFormData.dias_cultivo = calcularDiasCultivo(cicloSeleccionado.fecha_siembra, value);
      }
    }
  };

  // Procesar cambio de peso y actualizar campos dependientes
  const procesarCambioPeso = (value, newFormData) => {
    const pesoAnterior = ultimoMuestra ? ultimoMuestra.peso : null;
    const incrementoPeso = calcularIncrementoPeso(value, pesoAnterior);
    newFormData.incremento_peso = incrementoPeso;

    if (newFormData.poblacion_actual) {
      const biomasa = calcularBiomasa(value, newFormData.poblacion_actual);
      newFormData.biomasa_lbs = biomasa;

      if (newFormData.balanceado_acumulado) {
        newFormData.conversion_alimenticia = calcularConversionAlimenticia(newFormData.balanceado_acumulado, biomasa);
      }
    }
  };

  // Procesar cambio de balanceado
  const procesarCambioBalanceado = (newFormData) => {
    const balanceadoAnterior = ultimoMuestra ? ultimoMuestra.balanceado_acumulado : 0;
    const balanceadoAcumulado = calcularBalanceadoAcumulado(newFormData.balanceados, balanceadoAnterior);
    newFormData.balanceado_acumulado = balanceadoAcumulado;

    if (newFormData.biomasa_lbs) {
      newFormData.conversion_alimenticia = calcularConversionAlimenticia(balanceadoAcumulado, newFormData.biomasa_lbs);
    }
  };

  // Procesar cambio de supervivencia
  const procesarCambioSupervivencia = (value, newFormData) => {
    if (newFormData.id_ciclo) {
      const cicloSeleccionado = ciclosDisponibles.find(ciclo => ciclo.id_ciclo == newFormData.id_ciclo);
      if (cicloSeleccionado?.cantidad_siembra) {
        const poblacionActual = calcularPoblacionActual(value, cicloSeleccionado.cantidad_siembra);
        newFormData.poblacion_actual = poblacionActual;

        if (newFormData.peso) {
          const biomasa = calcularBiomasa(newFormData.peso, poblacionActual);
          newFormData.biomasa_lbs = biomasa;

          if (newFormData.balanceado_acumulado) {
            newFormData.conversion_alimenticia = calcularConversionAlimenticia(newFormData.balanceado_acumulado, biomasa);
          }
        }
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (!validarValorNumerico(name, value)) {
      return;
    }
    
    const isBalanceadoField = name.startsWith('balanceado_');
    
    let newFormData;
    
    if (isBalanceadoField) {
      const idTipoBalanceado = name.replace('balanceado_', '');
      newFormData = {
        ...formData,
        balanceados: {
          ...formData.balanceados,
          [idTipoBalanceado]: value
        }
      };
    } else {
      newFormData = {
        ...formData,
        [name]: value
      };
    }
    
    // Procesar cambios en campos específicos
    if (name === 'id_ciclo') {
      procesarCambioCiclo(value, newFormData);
    } else if (name === 'fecha_muestra') {
      procesarCambioFecha(value, newFormData);
    } else if (name === 'peso') {
      procesarCambioPeso(value, newFormData);
    } else if (isBalanceadoField) {
      procesarCambioBalanceado(newFormData);
    } else if (name === 'supervivencia') {
      procesarCambioSupervivencia(value, newFormData);
    }
    
    setFormData(newFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar que al menos un balanceado tenga consumo
    if (!validarAlMenosUnBalanceado(formData.balanceados)) {
      setError('Por favor, ingresa el consumo de al menos un tipo de balanceado.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    setLoading(true);

    try {
      // Preparar los datos para enviar
      // Extraer los campos de balanceado del objeto y convertirlos a un array
      const balanceadosArray = Object.entries(formData.balanceados)
        .filter(([id, cantidad]) => cantidad !== '' && cantidad !== null && cantidad !== undefined && Number.parseFloat(cantidad) > 0)
        .map(([id, cantidad]) => ({
          id_tipo_balanceado: Number.parseInt(id),
          cantidad: Number.parseFloat(cantidad)
        }));
      
      const dataToSend = {
        id_ciclo: formData.id_ciclo,
        dias_cultivo: formData.dias_cultivo,
        peso: formData.peso,
        incremento_peso: formData.incremento_peso,
        biomasa_lbs: formData.biomasa_lbs,
        balanceados: balanceadosArray,
        balanceado_acumulado: formData.balanceado_acumulado,
        conversion_alimenticia: formData.conversion_alimenticia,
        poblacion_actual: formData.poblacion_actual,
        supervivencia: formData.supervivencia,
        observaciones: formData.observaciones,
        estado: formData.estado,
        fecha_muestra: formData.fecha_muestra,
        id_usuario: idUsuario,
        id_compania: idCompania
      };
      
      const response = await fetch(`${API_BASE_URL}/module/muestras.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend)
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        // Redirigir de vuelta al panel directivo con mensaje de éxito
        navigate('/layout/dashboard/reporte', { 
          state: { message: 'Registro de muestra creado exitosamente' } 
        });
      } else {
        setError(result.message || `Error al crear el registro (Status: ${response.status})`);
      }
    } catch (err) {
      console.error('Error completo:', err);
      setError('Error de conexión. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/layout/dashboard/reporte');
  };

  const getUltimoPesoMessage = () => {
    if (ultimoMuestra) {
      return `Peso promedio anterior: ${ultimoMuestra.peso}g`;
    }
    if (formData.id_ciclo) {
      return 'Buscando último muestra...';
    }
    return 'Selecciona un ciclo primero';
  };

  const renderBalanceadoContent = () => {
    if (loadingTipos) {
      return (
        <div className="col-span-full text-center py-4 text-gray-500">
          Cargando tipos de balanceado...
        </div>
      );
    }

    if (tiposBalanceado.length === 0) {
      return (
        <div className="col-span-full bg-orange-50 border border-orange-300 rounded-lg p-4">
          <div className="header-user flex items-start gap-3">
            <svg className="info w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-semibold text-orange-900">No hay tipos de balanceado configurados para esta compañía.</p>
            </div>
          </div>
        </div>
      );
    }

    const tieneAlMenosUnBalanceado = validarAlMenosUnBalanceado(formData.balanceados);

    return (
      <>
        {tiposBalanceado.map((tipo) => (
          <div key={tipo.id_tipo_balanceado}>
            <label htmlFor={`balanceado_${tipo.id_tipo_balanceado}`} className="block text-sm font-medium text-gray-700 mb-2">
              {tipo.nombre} *
            </label>
            <input
              id={`balanceado_${tipo.id_tipo_balanceado}`}
              type="number"
              step="0.01"
              min="0"
              name={`balanceado_${tipo.id_tipo_balanceado}`}
              value={formData.balanceados[tipo.id_tipo_balanceado] || ''}
              ref={(el) => {
                if (el) {
                  balanceadoInputRefs.current[tipo.id_tipo_balanceado] = el;
                }
              }}
              onFocus={(e) => e.target.addEventListener('wheel', handleWheel, { passive: false })}
              onBlur={(e) => e.target.removeEventListener('wheel', handleWheel)}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={`Ej: 500`}
            />
            <p className="text-sm text-gray-500 mt-1 leyenda">
              Cantidad consumida en este muestreo ({tipo.unidad})
            </p>
          </div>
        ))}
        {!tieneAlMenosUnBalanceado && (
          <div className="col-span-full">
            <div className="validation-message">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Ingresa el consumo de al menos un tipo de balanceado</span>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="form-container max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-blue-800 mb-2">
          Nuevo Registro de Muestra
        </h1>
        <p className="text-gray-600">
          Selecciona un ciclo productivo existente y completa los campos de muestra para agregar un nuevo registro.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-6">
          <div className="header-user flex items-start gap-3">
            <svg className="info w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {!loadingCiclos && ciclosDisponibles.length === 0 && !error && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="info2 w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p><strong>No hay ciclos productivos en curso disponibles.</strong></p>
              <p className="text-sm text-yellow-800">
                Para agregar registros de muestra, debe haber al menos un ciclo productivo con estado "EN_CURSO". 
                Los ciclos finalizados no están disponibles para agregar nuevas muestras.
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
            {/* Selección de Ciclo Productivo */}
            <div className="mb-6">
              <label htmlFor="id_ciclo_muestra" className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Ciclo Productivo *
              </label>
              {loadingCiclos ? (
                <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                  Cargando ciclos productivos...
                </div>
              ) : (
                <select
                  id="id_ciclo_muestra"
                  name="id_ciclo"
                  value={formData.id_ciclo}
                  onChange={handleChange}
                  required
                  disabled={ciclosDisponibles.length === 0}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option value="">
                    {ciclosDisponibles.length === 0 
                      ? "No hay ciclos productivos en curso disponibles" 
                      : "Seleccionar piscina y fecha de siembra"
                    }
                  </option>
                  {ciclosDisponibles.map(ciclo => {
                    // Formatear fecha sin problemas de zona horaria
                    const formatFecha = (fechaString) => {
                      if (!fechaString) return 'N/A';
                      const [year, month, day] = fechaString.split('T')[0].split('-');
                      const fecha = new Date(year, month - 1, day);
                      return fecha.toLocaleDateString('es-ES');
                    };
                    
                    return (
                      <option key={ciclo.id_ciclo} value={ciclo.id_ciclo}>
                        Piscina {ciclo.codigo_piscina} - Siembra: {formatFecha(ciclo.fecha_siembra)} ({ciclo.hectareas} has, {ciclo.tipo_siembra}, Densidad: {ciclo.densidad}/ha)
                      </option>
                    );
                  })}
                </select>
              )}
              {formData.id_ciclo === '' && <ValidationMessage fieldName="un Ciclo Productivo" />}
              <p className="text-sm text-gray-500 mt-1 leyenda">
                Solo se muestran ciclos productivos con estado "EN_CURSO". Selecciona uno para agregar datos de muestra.
              </p>
            </div>

            {/* Información de muestra */}
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              <div>
                <label htmlFor="fecha_muestra_nuevo" className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Muestra *
                </label>
                <input
                  id="fecha_muestra_nuevo"
                  type="date"
                  name="fecha_muestra"
                  value={formData.fecha_muestra}
                  onChange={handleChange}
                  max={getLocalDateString()}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {formData.fecha_muestra === '' && <ValidationMessage fieldName="una Fecha de Muestra" />}
                <p className="text-sm text-gray-500 mt-1 leyenda">
                  Selecciona la fecha del muestra
                </p>
              </div>
            </div>

            {/* Información de producción */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label htmlFor="dias_cultivo_nuevo" className="block text-sm font-medium text-gray-700 mb-2">
                  Días de Cultivo <span className="text-blue-600 text-xs">(Calculado automáticamente)</span>
                </label>
                <input
                  id="dias_cultivo_nuevo"
                  type="text"
                  name="dias_cultivo"
                  value={formData.dias_cultivo}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                  placeholder="Se calcula automáticamente"
                />
                <p className="text-sm text-gray-500 mt-1 leyenda">
                  Calculado desde la fecha de siembra hasta la fecha de muestra
                </p>
              </div>

              <div>
                <label htmlFor="peso_nuevo" className="block text-sm font-medium text-gray-700 mb-2">
                  Peso Promedio (g)
                </label>
                <input
                  id="peso_nuevo"
                  type="number"
                  step="0.01"
                  min="0"
                  name="peso"
                  value={formData.peso}
                  ref={inputRef1}
                  onFocus={(e) => e.target.addEventListener('wheel', handleWheel, { passive: false })}
                  onBlur={(e) => e.target.removeEventListener('wheel', handleWheel)}
                  onChange={handleChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: 15.5"
                />
                {formData.peso === '' && <ValidationMessage fieldName="un Peso Promedio (g)" />}
                <p className="text-sm text-gray-500 mt-1 leyenda">
                  {getUltimoPesoMessage()}
                </p>
              </div>

              <div>
                <label htmlFor="incremento_peso_nuevo" className="block text-sm font-medium text-gray-700 mb-2">
                  Incremento Peso (g) <span className="text-blue-600 text-xs">(Calculado automáticamente)</span>
                </label>
                <input
                  id="incremento_peso_nuevo"
                  type="text"
                  name="incremento_peso"
                  value={formData.incremento_peso}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                  placeholder="Se calcula automáticamente"
                />
                <p className="text-sm text-gray-500 mt-1 leyenda">
                  Diferencia entre el peso actual y el peso del último muestra
                </p>
              </div>

              <div>
                <label htmlFor="supervivencia_nuevo" className="block text-sm font-medium text-gray-700 mb-2">
                  Supervivencia (%)
                </label>
                <input
                  id="supervivencia_nuevo"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  name="supervivencia"
                  value={formData.supervivencia}
                  ref={inputRef2}
                  onFocus={(e) => e.target.addEventListener('wheel', handleWheel, { passive: false })}
                  onBlur={(e) => e.target.removeEventListener('wheel', handleWheel)}
                  onChange={handleChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: 93.33"
                />
                {formData.supervivencia === '' && <ValidationMessage fieldName="una Supervivencia (%)" />}
                <p className="text-sm text-gray-500 mt-1 leyenda">
                  {formData.id_ciclo && ciclosDisponibles.length > 0
                    ? (() => {
                        const cicloSeleccionado = ciclosDisponibles.find(ciclo => ciclo.id_ciclo == formData.id_ciclo);
                        if (cicloSeleccionado?.cantidad_siembra) {
                          return `Cantidad siembra: ${Number.parseInt(cicloSeleccionado.cantidad_siembra).toLocaleString()} individuos`;
                        } else if (cicloSeleccionado) {
                          return "Ciclo seleccionado, pero no hay datos de cantidad de siembra";
                        } else {
                          return "Ciclo no encontrado";
                        }
                      })()
                    : "Selecciona un ciclo primero para ver la cantidad de siembra"
                  }
                </p>
              </div>

              <div>
                <label htmlFor="poblacion_actual_nuevo" className="block text-sm font-medium text-gray-700 mb-2">
                  Población Actual <span className="text-blue-600 text-xs">(Calculado automáticamente)</span>
                </label>
                <input
                  id="poblacion_actual_nuevo"
                  type="text"
                  name="poblacion_actual"
                  value={formData.poblacion_actual}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                  placeholder="Se calcula automáticamente"
                />
                <p className="text-sm text-gray-500 mt-1 leyenda">
                  Cantidad de siembra × (Supervivencia % ÷ 100)
                </p>
              </div>

              <div>
                <label htmlFor="biomasa_lbs_nuevo" className="block text-sm font-medium text-gray-700 mb-2">
                  Biomasa (lbs) <span className="text-blue-600 text-xs">(Calculado automáticamente)</span>
                </label>
                <input
                  id="biomasa_lbs_nuevo"
                  type="text"
                  name="biomasa_lbs"
                  value={formData.biomasa_lbs}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                  placeholder="Se calcula automáticamente"
                />
                <p className="text-sm text-gray-500 mt-1 leyenda">
                  (Peso en g ÷ 454) × Población actual
                </p>
              </div>
            </div>

            {/* Información de alimentación */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Campos dinámicos de balanceado */}
              {renderBalanceadoContent()}

              <div>
                <label htmlFor="balanceado_acumulado_nuevo" className="block text-sm font-medium text-gray-700 mb-2">
                  Balanceado Acumulado <span className="text-blue-600 text-xs">(Calculado automáticamente)</span>
                </label>
                <input
                  id="balanceado_acumulado_nuevo"
                  type="text"
                  name="balanceado_acumulado"
                  value={formData.balanceado_acumulado}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                  placeholder="Se calcula automáticamente"
                />
                <p className="text-sm text-gray-500 mt-1 leyenda">
                  {ultimoMuestra?.balanceado_acumulado
                    ? `Acumulado anterior: ${ultimoMuestra.balanceado_acumulado} + consumo actual`
                    : "Suma del consumo actual (primer muestra del ciclo)"
                  }
                </p>
              </div>

              <div>
                <label htmlFor="conversion_alimenticia_nuevo" className="block text-sm font-medium text-gray-700 mb-2">
                  Conversión Alimenticia <span className="text-blue-600 text-xs">(Calculado automáticamente)</span>
                </label>
                <input
                  id="conversion_alimenticia_nuevo"
                  type="text"
                  name="conversion_alimenticia"
                  value={formData.conversion_alimenticia}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                  placeholder="Se calcula automáticamente"
                />
                <p className="text-sm text-gray-500 mt-1 leyenda">
                  Balanceado acumulado ÷ Biomasa (lbs)
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="observaciones_nuevo" className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones <span className="text-gray-500 text-xs">(Opcional)</span>
              </label>
              <textarea
                id="observaciones_nuevo"
                name="observaciones"
                value={formData.observaciones}
                onChange={handleChange}
                rows="4"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ingresa cualquier observación relevante..."
              />
            </div>

            <div>
              <label htmlFor="estado_muestra" className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                id="estado_muestra"
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ACTIVA">Activa</option>
                <option value="INACTIVA">Inactiva</option>
              </select>
              <p className="text-xs text-gray-500 mt-1 leyenda">Estado de la muestra en el sistema</p>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <button
                type="submit"
                disabled={loading || loadingCiclos || loadingTipos || ciclosDisponibles.length === 0 || tiposBalanceado.length === 0}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Guardando...
                  </>
                ) : (
                  'Guardar Registro'
                )}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                disabled={loading || loadingCiclos || loadingTipos}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
            </div>
          </form>
    </div>
  );
}
