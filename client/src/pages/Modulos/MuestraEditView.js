import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import config from '../../config';
import { useAuth } from '../../context/AuthContext';
import { useScrollToError } from '../../hooks/useScrollToError';

// Función para obtener la fecha local en formato YYYY-MM-DD
const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function MuestraEditView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { API_BASE_URL } = config;
  const { idCompania, idUsuario } = useAuth();
  
  // Obtener parámetros de la URL
  const muestraId = searchParams.get('id');
  const mode = searchParams.get('mode'); // 'edit' o 'view'
  const isReadOnly = mode === 'view';

  const [formData, setFormData] = useState({
    id_muestra: '',
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
    fecha_muestra: getLocalDateString()
  });
  
  const [ciclosDisponibles, setCiclosDisponibles] = useState([]);
  const [tiposBalanceado, setTiposBalanceado] = useState([]);
  const [ultimoMuestra, setUltimoMuestraState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingCiclos, setLoadingCiclos] = useState(true);
  const [loadingTipos, setLoadingTipos] = useState(true);
  const [loadingMuestra, setLoadingMuestra] = useState(true);
  const [error, setError] = useState('');

  useScrollToError(error);

  const setUltimoMuestra = (valor) => {
    setUltimoMuestraState(valor);
  };

  const inputRef1 = useRef(null);
  const inputRef2 = useRef(null);
  const balanceadoInputRefs = useRef({});

  const handleWheel = (e) => {
    if (document.activeElement === e.target) {
      e.preventDefault();
    }
  };

  // Función para cargar los tipos de balanceado
  const fetchTiposBalanceado = async () => {
    if (!idCompania) {
      console.error("No hay ID de compañía disponible");
      setLoadingTipos(false);
      return [];
    }

    try {
      const response = await fetch(`${API_BASE_URL}/module/tipos_balanceado.php?id_compania=${idCompania}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setTiposBalanceado(result.data);
        return result.data;
      } else {
        console.error("Error al obtener tipos de balanceado:", result.message);
        setTiposBalanceado([]);
        return [];
      }
    } catch (err) {
      console.error("Error fetching tipos balanceado:", err);
      setTiposBalanceado([]);
      return [];
    } finally {
      setLoadingTipos(false);
    }
  };

  // Función para cargar ciclos disponibles
  const fetchCiclosDisponibles = async () => {
    if (!idCompania) {
      setError("No se pudo obtener la información de la compañía del usuario.");
      setLoadingCiclos(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/module/ciclosproductivos.php?id_compania=${idCompania}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // En modo edición, mostrar todos los ciclos; en modo view, solo ciclos en curso
        const ciclos = isReadOnly ? result.data : result.data.filter(ciclo => ciclo.estado === 'EN_CURSO');
        setCiclosDisponibles(ciclos);
        setError('');
      } else {
        throw new Error(result.message || "Error al obtener ciclos productivos");
      }
    } catch (err) {
      console.error("Error fetching ciclos:", err);
      setError(err.message || "No se pudieron cargar los ciclos productivos.");
    } finally {
      setLoadingCiclos(false);
    }
  };

  // Función para cargar la muestra existente
  const fetchMuestraData = async (tipos) => {
    if (!muestraId) {
      setLoadingMuestra(false);
      return;
    }

    try {
      setLoadingMuestra(true);
      const response = await fetch(`${API_BASE_URL}/module/muestras.php?id_muestra=${muestraId}&id_compania=${idCompania}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && result.data.length > 0) {
          const muestraData = result.data[0];
          
          // Normalizar balanceados por ID de tipo
          const balanceadosObj = {};
          tipos.forEach(tipo => {
            const nombreBalanceado = tipo.nombre;
            balanceadosObj[tipo.id_tipo_balanceado] = muestraData[nombreBalanceado] || '';
          });

          setFormData({
            id_muestra: muestraData.id_muestra,
            id_ciclo: muestraData.id_ciclo,
            dias_cultivo: muestraData['Dias cultivo'] || '',
            peso: muestraData['Peso'] || '',
            incremento_peso: muestraData['Inc.P'] || '',
            biomasa_lbs: muestraData['Biomasa Lbs'] || '',
            balanceados: balanceadosObj,
            balanceado_acumulado: muestraData['Balanceado Acumulado'] || '',
            conversion_alimenticia: muestraData['Conversión Alimenticia'] || '',
            poblacion_actual: muestraData['Población actual'] || '',
            supervivencia: muestraData['Sobrev. Actual %'] || '',
            observaciones: muestraData['Observaciones'] || '',
            fecha_muestra: muestraData['Fecha Muestra'] || getLocalDateString()
          });

          // Obtener el último muestra anterior
          if (muestraData.id_ciclo) {
            fetchUltimoMuestraData(muestraData.id_ciclo, muestraData.id_muestra);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching muestra:", err);
      setError("Error al cargar los datos de la muestra");
    } finally {
      setLoadingMuestra(false);
    }
  };

  // Función para obtener el último muestra anterior
  const fetchUltimoMuestraData = async (idCiclo, excludeMuestraId = null) => {
    if (!idCiclo) {
      setUltimoMuestra(null);
      return;
    }

    try {
      // En modo edición, usar el endpoint de penúltima muestra para obtener la muestra anterior
      // En modo view, usar el endpoint de última muestra
      const endpoint = isReadOnly 
        ? `${API_BASE_URL}/module/muestras.php?id_ciclo=${idCiclo}&ultimo=1&id_compania=${idCompania}`
        : `${API_BASE_URL}/module/muestras.php?id_ciclo=${idCiclo}&penultimo=1&id_compania=${idCompania}`;

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && result.data.length > 0) {
          const muestraAnterior = result.data[0];
          if (muestraAnterior && muestraAnterior.id_muestra != excludeMuestraId) {
            setUltimoMuestra({
              peso: muestraAnterior['Peso'],
              balanceado_acumulado: muestraAnterior['Balanceado Acumulado'],
              fecha_muestra: muestraAnterior['Fecha Muestra'],
              id_muestra: muestraAnterior['id_muestra']
            });
          } else {
            setUltimoMuestra(null);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching último muestra:", err);
      setUltimoMuestra(null);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    if (idCompania) {
      const loadData = async () => {
        const tipos = await fetchTiposBalanceado();
        await fetchCiclosDisponibles();
        
        // Si tenemos muestraId, cargar los datos de la muestra
        if (muestraId && tipos.length > 0) {
          await fetchMuestraData(tipos);
        } else {
          setLoadingMuestra(false);
        }
      };
      
      loadData();
    } else {
      setLoadingCiclos(false);
      setLoadingTipos(false);
      setLoadingMuestra(false);
    }
  }, [idCompania, muestraId]);

  // Efectos para cálculos automáticos (igual que en MuestraForm)
  // NO ejecutar cálculos en modo lectura (view)
  useEffect(() => {
    if (isReadOnly) return;
    
    if (formData.id_ciclo && formData.fecha_muestra && ciclosDisponibles.length > 0) {
      const cicloSeleccionado = ciclosDisponibles.find(ciclo => ciclo.id_ciclo == formData.id_ciclo);
      if (cicloSeleccionado) {
        const diasCultivo = calcularDiasCultivo(cicloSeleccionado.fecha_siembra, formData.fecha_muestra);
        if (diasCultivo !== formData.dias_cultivo) {
          setFormData(prev => ({
            ...prev,
            dias_cultivo: diasCultivo
          }));
        }
      }
    }
  }, [formData.id_ciclo, formData.fecha_muestra, ciclosDisponibles, isReadOnly]);

  useEffect(() => {
    if (isReadOnly) return;
    
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
      setFormData(prev => ({
        ...prev,
        incremento_peso: ''
      }));
    }
  }, [formData.peso, ultimoMuestra, isReadOnly]);

  useEffect(() => {
    if (isReadOnly) return;
    
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
      setFormData(prev => ({
        ...prev,
        balanceado_acumulado: ''
      }));
    }
  }, [formData.balanceados, ultimoMuestra, isReadOnly]);

  useEffect(() => {
    if (isReadOnly) return;
    
    if (formData.supervivencia && formData.id_ciclo && ciclosDisponibles.length > 0) {
      const cicloSeleccionado = ciclosDisponibles.find(ciclo => ciclo.id_ciclo == formData.id_ciclo);
      if (cicloSeleccionado && cicloSeleccionado.cantidad_siembra) {
        const poblacionActual = calcularPoblacionActual(formData.supervivencia, cicloSeleccionado.cantidad_siembra);
        if (poblacionActual !== formData.poblacion_actual) {
          setFormData(prev => ({
            ...prev,
            poblacion_actual: poblacionActual
          }));
        }
      }
    } else if (formData.poblacion_actual !== '') {
      setFormData(prev => ({
        ...prev,
        poblacion_actual: ''
      }));
    }
  }, [formData.supervivencia, formData.id_ciclo, ciclosDisponibles, isReadOnly]);

  useEffect(() => {
    if (isReadOnly) return;
    
    if (formData.peso && formData.poblacion_actual) {
      const biomasa = calcularBiomasa(formData.peso, formData.poblacion_actual);
      if (biomasa !== formData.biomasa_lbs) {
        setFormData(prev => ({
          ...prev,
          biomasa_lbs: biomasa
        }));
      }
    } else if (formData.biomasa_lbs !== '') {
      setFormData(prev => ({
        ...prev,
        biomasa_lbs: ''
      }));
    }
  }, [formData.peso, formData.poblacion_actual, isReadOnly]);

  useEffect(() => {
    if (isReadOnly) return;
    
    if (formData.balanceado_acumulado && formData.biomasa_lbs) {
      const conversionAlimenticia = calcularConversionAlimenticia(formData.balanceado_acumulado, formData.biomasa_lbs);
      if (conversionAlimenticia !== formData.conversion_alimenticia) {
        setFormData(prev => ({
          ...prev,
          conversion_alimenticia: conversionAlimenticia
        }));
      }
    } else if (formData.conversion_alimenticia !== '') {
      setFormData(prev => ({
        ...prev,
        conversion_alimenticia: ''
      }));
    }
  }, [formData.balanceado_acumulado, formData.biomasa_lbs, isReadOnly]);

  // Funciones de cálculo (idénticas a MuestraForm)
  const calcularDiasCultivo = (fechaSiembra, fechaMuestra) => {
    if (!fechaSiembra || !fechaMuestra) return '';
    
    const fechaSiembraDate = new Date(fechaSiembra);
    const fechaMuestraDate = new Date(fechaMuestra);
    
    if (fechaMuestraDate < fechaSiembraDate) return 0;
    
    const diferenciaMilisegundos = fechaMuestraDate - fechaSiembraDate;
    const diferenciaDias = Math.floor(diferenciaMilisegundos / (1000 * 60 * 60 * 24));
    
    return diferenciaDias;
  };

  const calcularIncrementoPeso = (pesoActual, pesoAnterior) => {
    if (!pesoActual) return '';
    
    if (pesoAnterior === null || pesoAnterior === undefined) {
      const pesoActualNum = parseFloat(pesoActual);
      return isNaN(pesoActualNum) ? '' : pesoActualNum.toFixed(2);
    }
    
    const pesoActualNum = parseFloat(pesoActual);
    const pesoAnteriorNum = parseFloat(pesoAnterior);
    
    if (isNaN(pesoActualNum) || isNaN(pesoAnteriorNum)) return '';
    
    const incremento = pesoActualNum - pesoAnteriorNum;
    return incremento.toFixed(2);
  };

  const calcularBalanceadoAcumulado = (balanceadosObj, balanceadoAnterior) => {
    const sumaActual = Object.values(balanceadosObj).reduce((sum, val) => {
      const numVal = (val === '' || val === null || val === undefined) ? 0 : parseFloat(val) || 0;
      return sum + numVal;
    }, 0);
    
    const valAnterior = (balanceadoAnterior === null || balanceadoAnterior === undefined) ? 0 : parseFloat(balanceadoAnterior) || 0;
    const acumuladoTotal = valAnterior + sumaActual;
    
    return acumuladoTotal.toFixed(2);
  };

  const calcularPoblacionActual = (supervivencia, cantidadSiembra) => {
    if (!supervivencia || !cantidadSiembra) return '';
    
    const supervivenciaNum = parseFloat(supervivencia);
    const cantidadSiembraNum = parseFloat(cantidadSiembra);
    
    if (isNaN(supervivenciaNum) || isNaN(cantidadSiembraNum)) return '';
    
    const supervivenciaDecimal = supervivenciaNum / 100;
    const poblacionActual = cantidadSiembraNum * supervivenciaDecimal;
    
    return Math.round(poblacionActual);
  };

  const calcularBiomasa = (pesoGramos, poblacionActual) => {
    if (!pesoGramos || !poblacionActual) return '';
    
    const pesoGramosNum = parseFloat(pesoGramos);
    const poblacionActualNum = parseFloat(poblacionActual);
    
    if (isNaN(pesoGramosNum) || isNaN(poblacionActualNum)) return '';
    
    const pesoLibras = pesoGramosNum / 454;
    const biomasaLbs = pesoLibras * poblacionActualNum;
    
    return biomasaLbs.toFixed(2);
  };

  const calcularConversionAlimenticia = (balanceadoAcumulado, biomasaLbs) => {
    if (!balanceadoAcumulado || !biomasaLbs) return '';
    
    const balanceadoNum = parseFloat(balanceadoAcumulado);
    const biomasaNum = parseFloat(biomasaLbs);
    
    if (isNaN(balanceadoNum) || isNaN(biomasaNum) || biomasaNum === 0) return '';
    
    const conversionAlimenticia = balanceadoNum / biomasaNum;
    
    return conversionAlimenticia.toFixed(3);
  };

  const handleChange = (e) => {
    if (isReadOnly) return;
    
    const { name, value } = e.target;
    
    if (name === 'peso' || name === 'supervivencia' || name.startsWith('balanceado_')) {
      if (value !== '' && parseFloat(value) < 0) {
        return;
      }
      if (name === 'supervivencia' && value !== '' && parseFloat(value) > 100) {
        return;
      }
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
    
    if (name === 'id_ciclo') {
      const cicloSeleccionado = ciclosDisponibles.find(ciclo => ciclo.id_ciclo == value);
      if (cicloSeleccionado) {
        fetchUltimoMuestraData(value, formData.id_muestra);
        if (newFormData.fecha_muestra) {
          const diasCultivo = calcularDiasCultivo(cicloSeleccionado.fecha_siembra, newFormData.fecha_muestra);
          newFormData.dias_cultivo = diasCultivo;
        }
        newFormData.balanceado_acumulado = '';
        newFormData.incremento_peso = '';
      }
    }
    
    if (name === 'fecha_muestra' && newFormData.id_ciclo) {
      const cicloSeleccionado = ciclosDisponibles.find(ciclo => ciclo.id_ciclo == newFormData.id_ciclo);
      if (cicloSeleccionado) {
        const diasCultivo = calcularDiasCultivo(cicloSeleccionado.fecha_siembra, value);
        newFormData.dias_cultivo = diasCultivo;
      }
    }
    
    if (name === 'peso') {
      const pesoAnterior = ultimoMuestra ? ultimoMuestra.peso : null;
      const incrementoPeso = calcularIncrementoPeso(value, pesoAnterior);
      newFormData.incremento_peso = incrementoPeso;

      if (newFormData.poblacion_actual) {
        const biomasa = calcularBiomasa(value, newFormData.poblacion_actual);
        newFormData.biomasa_lbs = biomasa;

        if (newFormData.balanceado_acumulado) {
          const conversionAlimenticia = calcularConversionAlimenticia(newFormData.balanceado_acumulado, biomasa);
          newFormData.conversion_alimenticia = conversionAlimenticia;
        }
      }
    }
    
    if (isBalanceadoField) {
      const balanceadoAnterior = ultimoMuestra ? ultimoMuestra.balanceado_acumulado : 0;
      const balanceadoAcumulado = calcularBalanceadoAcumulado(
        newFormData.balanceados,
        balanceadoAnterior
      );
      newFormData.balanceado_acumulado = balanceadoAcumulado;

      if (newFormData.biomasa_lbs) {
        const conversionAlimenticia = calcularConversionAlimenticia(balanceadoAcumulado, newFormData.biomasa_lbs);
        newFormData.conversion_alimenticia = conversionAlimenticia;
      }
    }

    if (name === 'supervivencia' && newFormData.id_ciclo) {
      const cicloSeleccionado = ciclosDisponibles.find(ciclo => ciclo.id_ciclo == newFormData.id_ciclo);
      if (cicloSeleccionado && cicloSeleccionado.cantidad_siembra) {
        const poblacionActual = calcularPoblacionActual(value, cicloSeleccionado.cantidad_siembra);
        newFormData.poblacion_actual = poblacionActual;

        if (newFormData.peso) {
          const biomasa = calcularBiomasa(newFormData.peso, poblacionActual);
          newFormData.biomasa_lbs = biomasa;

          if (newFormData.balanceado_acumulado) {
            const conversionAlimenticia = calcularConversionAlimenticia(newFormData.balanceado_acumulado, biomasa);
            newFormData.conversion_alimenticia = conversionAlimenticia;
          }
        }
      }
    }
    
    setFormData(newFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isReadOnly) {
      navigate('/layout/dashboard/reporte');
      return;
    }

    setError('');
    const errores = [];

    if (!formData.id_ciclo || String(formData.id_ciclo).trim() === '') {
      errores.push('Debes seleccionar un ciclo productivo.');
    }

    if (!formData.fecha_muestra || String(formData.fecha_muestra).trim() === '') {
      errores.push('Debes ingresar la fecha de muestra.');
    }

    if (!formData.peso || String(formData.peso).trim() === '') {
      errores.push('El peso es requerido.');
    } else if (parseFloat(formData.peso) <= 0) {
      errores.push('El peso debe ser mayor a 0.');
    }

    if (!formData.supervivencia || String(formData.supervivencia).trim() === '') {
      errores.push('La supervivencia es requerida.');
    } else if (parseFloat(formData.supervivencia) < 0 || parseFloat(formData.supervivencia) > 100) {
      errores.push('La supervivencia debe estar entre 0 y 100.');
    }

    const tieneBalanceado = Object.values(formData.balanceados).some(
      val => val !== '' && val !== null && val !== undefined && parseFloat(val) > 0
    );
    if (!tieneBalanceado) {
      errores.push('Debes ingresar al menos un tipo de balanceado.');
    }

    if (!formData.observaciones || formData.observaciones.trim() === '') {
      errores.push('Las observaciones son requeridas.');
    }

    if (!idUsuario) {
      errores.push('No se pudo obtener la información del usuario autenticado.');
    }

    if (!idCompania) {
      errores.push('No se pudo obtener la información de la compañía del usuario.');
    }

    if (errores.length > 0) {
      setError(errores.join('\n'));
      return;
    }

    setLoading(true);

    try {
      const balanceadosArray = Object.entries(formData.balanceados)
        .filter(([id, cantidad]) => cantidad !== '' && cantidad !== null && cantidad !== undefined && parseFloat(cantidad) > 0)
        .map(([id, cantidad]) => ({
          id_tipo_balanceado: parseInt(id),
          cantidad: parseFloat(cantidad)
        }));
      
      const dataToSend = {
        id_muestra: formData.id_muestra,
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
        fecha_muestra: formData.fecha_muestra,
        id_usuario: idUsuario,
        id_compania: idCompania
      };
      
      const response = await fetch(`${API_BASE_URL}/module/muestras.php`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(dataToSend)
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        navigate('/layout/dashboard/reporte', { 
          state: { message: 'Registro de muestra actualizado exitosamente' } 
        });
      } else {
        setError(result.message || `Error al actualizar el registro (Status: ${response.status})`);
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

  return (
    <div className="form-container max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-blue-800 mb-2">
          {isReadOnly ? 'Consultar Muestra' : 'Editar Registro de Muestra'}
        </h1>
        <p className="text-gray-600">
          {isReadOnly 
            ? 'Visualiza los datos del registro de muestra seleccionado.'
            : 'Actualiza los datos del registro de muestra seleccionado.'
          }
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {(loadingCiclos || loadingTipos || loadingMuestra) && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Cargando datos...</span>
        </div>
      )}

      {!loadingCiclos && !loadingTipos && !loadingMuestra && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selección de Ciclo Productivo */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Ciclo Productivo {!isReadOnly && '*'}
            </label>
            <select
              name="id_ciclo"
              value={formData.id_ciclo}
              onChange={handleChange}
              disabled={isReadOnly || (muestraId && !isReadOnly) || ciclosDisponibles.length === 0}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            >
              <option value="">Seleccionar piscina y fecha de siembra</option>
              {ciclosDisponibles.map(ciclo => {
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
          </div>

          {/* Información de muestra */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Muestra {!isReadOnly && '*'}
              </label>
              <input
                type="date"
                name="fecha_muestra"
                value={formData.fecha_muestra}
                onChange={handleChange}
                disabled={isReadOnly}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
          </div>

          {/* Información de producción */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Días de Cultivo <span className="text-blue-600 text-xs">(Automático)</span>
              </label>
              <input
                type="text"
                name="dias_cultivo"
                value={formData.dias_cultivo}
                readOnly
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Peso (g)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="peso"
                value={formData.peso}
                ref={inputRef1}
                onFocus={(e) => e.target.addEventListener('wheel', handleWheel, { passive: false })}
                onBlur={(e) => e.target.removeEventListener('wheel', handleWheel)}
                onChange={handleChange}
                disabled={isReadOnly}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                {ultimoMuestra 
                  ? `Peso anterior: ${ultimoMuestra.peso}g` 
                  : formData.id_ciclo 
                    ? "Buscando último muestra..."
                    : "Selecciona un ciclo primero"
                }
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Incremento Peso (g) <span className="text-blue-600 text-xs">(Automático)</span>
              </label>
              <input
                type="text"
                name="incremento_peso"
                value={formData.incremento_peso}
                readOnly
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supervivencia (%)
              </label>
              <input
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
                disabled={isReadOnly}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Población Actual <span className="text-blue-600 text-xs">(Automático)</span>
              </label>
              <input
                type="text"
                name="poblacion_actual"
                value={formData.poblacion_actual}
                readOnly
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Biomasa (lbs) <span className="text-blue-600 text-xs">(Automático)</span>
              </label>
              <input
                type="text"
                name="biomasa_lbs"
                value={formData.biomasa_lbs}
                readOnly
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Información de alimentación */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tiposBalanceado.length === 0 ? (
              <div className="col-span-full bg-orange-50 border border-orange-300 rounded-lg p-4">
                <p className="font-semibold text-orange-900">No hay tipos de balanceado configurados para esta compañía.</p>
              </div>
            ) : (
              tiposBalanceado.map((tipo) => (
                <div key={tipo.id_tipo_balanceado}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {tipo.nombre}
                  </label>
                  <input
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
                    disabled={isReadOnly}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Cantidad consumida ({tipo.unidad})
                  </p>
                </div>
              ))
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Balanceado Acumulado <span className="text-blue-600 text-xs">(Automático)</span>
              </label>
              <input
                type="text"
                name="balanceado_acumulado"
                value={formData.balanceado_acumulado}
                readOnly
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conversión Alimenticia <span className="text-blue-600 text-xs">(Automático)</span>
              </label>
              <input
                type="text"
                name="conversion_alimenticia"
                value={formData.conversion_alimenticia}
                readOnly
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones {!isReadOnly && '*'}
            </label>
            <textarea
              name="observaciones"
              value={formData.observaciones}
              onChange={handleChange}
              disabled={isReadOnly}
              rows="4"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            {!isReadOnly && (
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Guardar Cambios
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              {isReadOnly ? 'Cerrar' : 'Cancelar'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
