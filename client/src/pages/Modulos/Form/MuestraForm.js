import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../../../config';
import { useAuth } from '../../../context/AuthContext';

export default function MuestraForm() {
  const navigate = useNavigate();
  const { API_BASE_URL } = config;
  const { idCompania, idUsuario } = useAuth();
  
  const [formData, setFormData] = useState({
    id_ciclo: '', // Reemplaza los campos de ciclo_productivo
    dias_cultivo: '',
    peso: '',
    incremento_peso: '',
    biomasa_lbs: '', // Calculado automáticamente
    balanceados: {}, // Objeto dinámico para almacenar consumos de balanceado
    balanceado_acumulado: '',
    conversion_alimenticia: '', // Calculado automáticamente
    poblacion_actual: '', // Calculado automáticamente
    supervivencia: '',
    observaciones: '',
    fecha_muestra: new Date().toISOString().split('T')[0]
  });
  
  const [ciclosDisponibles, setCiclosDisponibles] = useState([]);
  const [tiposBalanceado, setTiposBalanceado] = useState([]); // Tipos de balanceado de la compañía
  const [ultimoMuestra, setUltimoMuestraState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingCiclos, setLoadingCiclos] = useState(true);
  const [loadingTipos, setLoadingTipos] = useState(true);
  const [error, setError] = useState('');

  // Wrapper para trackear cambios en ultimoMuestra
  const setUltimoMuestra = (valor) => {
    setUltimoMuestraState(valor);
  };

  // Función para cargar los tipos de balanceado de la compañía
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
        
        // Inicializar los campos de balanceado en el formData
        const balanceadosIniciales = {};
        result.data.forEach(tipo => {
          balanceadosIniciales[tipo.id_tipo_balanceado] = '';
        });
        
        setFormData(prev => ({
          ...prev,
          balanceados: balanceadosIniciales
        }));
        
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

  // Función para cargar los ciclos productivos disponibles
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
        // Filtrar solo los ciclos que estén EN_CURSO
        const ciclosEnCurso = result.data.filter(ciclo => ciclo.estado === 'EN_CURSO');
        setCiclosDisponibles(ciclosEnCurso);
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

  // Función para obtener el último muestra de un ciclo productivo
  const fetchUltimoMuestra = async (idCiclo) => {
    if (!idCiclo) {
      setUltimoMuestra(null);
      return;
    }

    try {
      const url = `${API_BASE_URL}/module/muestras.php?id_ciclo=${idCiclo}&ultimo=true`;
      
      const response = await fetch(url, {
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
      
      if (result.success && result.data && result.data.length > 0) {
        // Obtener el muestra más reciente (el primero en la lista ordenada por fecha desc)
        setUltimoMuestra(result.data[0]);
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
        if (diasCultivo !== formData.dias_cultivo) {
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
    if (!fechaSiembra || !fechaMuestra) return '';
    
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
      const pesoActualNum = parseFloat(pesoActual);
      return isNaN(pesoActualNum) ? '' : pesoActualNum.toFixed(2);
    }
    
    const pesoActualNum = parseFloat(pesoActual);
    const pesoAnteriorNum = parseFloat(pesoAnterior);
    
    if (isNaN(pesoActualNum) || isNaN(pesoAnteriorNum)) return '';
    
    const incremento = pesoActualNum - pesoAnteriorNum;
    return incremento.toFixed(2);
  };

  // Función para calcular balanceado acumulado
  const calcularBalanceadoAcumulado = (balanceadosObj, balanceadoAnterior) => {
    // Sumar todos los valores de balanceado ingresados
    const sumaActual = Object.values(balanceadosObj).reduce((sum, val) => {
      const numVal = (val === '' || val === null || val === undefined) ? 0 : parseFloat(val) || 0;
      return sum + numVal;
    }, 0);
    
    const valAnterior = (balanceadoAnterior === null || balanceadoAnterior === undefined) ? 0 : parseFloat(balanceadoAnterior) || 0;
    const acumuladoTotal = valAnterior + sumaActual;
    
    return acumuladoTotal.toFixed(2);
  };

  // Función para calcular población actual
  const calcularPoblacionActual = (supervivencia, cantidadSiembra) => {
    if (!supervivencia || !cantidadSiembra) return '';
    
    const supervivenciaNum = parseFloat(supervivencia);
    const cantidadSiembraNum = parseFloat(cantidadSiembra);
    
    if (isNaN(supervivenciaNum) || isNaN(cantidadSiembraNum)) return '';
    
    // Convertir supervivencia de porcentaje a decimal (dividir entre 100)
    const supervivenciaDecimal = supervivenciaNum / 100;
    const poblacionActual = cantidadSiembraNum * supervivenciaDecimal;
    
    return Math.round(poblacionActual); // Redondeamos porque son individuos
  };

  // Función para calcular biomasa en libras
  const calcularBiomasa = (pesoGramos, poblacionActual) => {
    if (!pesoGramos || !poblacionActual) return '';
    
    const pesoGramosNum = parseFloat(pesoGramos);
    const poblacionActualNum = parseFloat(poblacionActual);
    
    if (isNaN(pesoGramosNum) || isNaN(poblacionActualNum)) return '';
    
    // Convertir peso de gramos a libras (1 libra = 454 gramos)
    const pesoLibras = pesoGramosNum / 454;
    const biomasaLbs = pesoLibras * poblacionActualNum;
    
    return biomasaLbs.toFixed(2); // Redondeamos a 2 decimales
  };

  // Función para calcular conversión alimenticia
  const calcularConversionAlimenticia = (balanceadoAcumulado, biomasaLbs) => {
    if (!balanceadoAcumulado || !biomasaLbs) return '';
    
    const balanceadoNum = parseFloat(balanceadoAcumulado);
    const biomasaNum = parseFloat(biomasaLbs);
    
    if (isNaN(balanceadoNum) || isNaN(biomasaNum) || biomasaNum === 0) return '';
    
    const conversionAlimenticia = balanceadoNum / biomasaNum;
    
    return conversionAlimenticia.toFixed(3); // Redondeamos a 3 decimales para mayor precisión
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Verificar si el cambio es en un campo de balanceado
    const isBalanceadoField = name.startsWith('balanceado_');
    
    // Actualizar el estado del formulario
    let newFormData;
    
    if (isBalanceadoField) {
      // Extraer el ID del tipo de balanceado del nombre del campo
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
    
    // Manejar cambio de ciclo productivo
    if (name === 'id_ciclo') {
      const cicloSeleccionado = ciclosDisponibles.find(ciclo => ciclo.id_ciclo == value);
      
      if (cicloSeleccionado) {
        // Obtener el último muestra del ciclo seleccionado
        fetchUltimoMuestra(value);
        
        // Calcular días de cultivo si también hay fecha de muestra
        if (newFormData.fecha_muestra) {
          const diasCultivo = calcularDiasCultivo(cicloSeleccionado.fecha_siembra, newFormData.fecha_muestra);
          newFormData.dias_cultivo = diasCultivo;
        }
        
        // Resetear valores calculados cuando se cambia de ciclo
        // Se recalcularán automáticamente en los useEffect cuando se obtenga el último muestra
        newFormData.balanceado_acumulado = '';
        newFormData.incremento_peso = '';
        
        // Si ya hay un peso ingresado, necesitamos recalcular el incremento después de obtener el nuevo muestra
        // Esto se hará automáticamente en el useEffect cuando cambie ultimoMuestra
      }
    }
    
    // Si se cambia la fecha de muestra y hay un ciclo seleccionado, recalcular días de cultivo
    if (name === 'fecha_muestra' && newFormData.id_ciclo) {
      const cicloSeleccionado = ciclosDisponibles.find(ciclo => ciclo.id_ciclo == newFormData.id_ciclo);
      if (cicloSeleccionado) {
        const diasCultivo = calcularDiasCultivo(cicloSeleccionado.fecha_siembra, value);
        newFormData.dias_cultivo = diasCultivo;
      }
    }
    
    // Si se cambia el peso, calcular incremento de peso y biomasa
    if (name === 'peso') {
      const pesoAnterior = ultimoMuestra ? ultimoMuestra.peso : null;
      const incrementoPeso = calcularIncrementoPeso(value, pesoAnterior);
      newFormData.incremento_peso = incrementoPeso;

      // Si también hay población actual, calcular biomasa
      if (newFormData.poblacion_actual) {
        const biomasa = calcularBiomasa(value, newFormData.poblacion_actual);
        newFormData.biomasa_lbs = biomasa;

        // Si también hay balanceado acumulado, calcular conversión alimenticia
        if (newFormData.balanceado_acumulado) {
          const conversionAlimenticia = calcularConversionAlimenticia(newFormData.balanceado_acumulado, biomasa);
          newFormData.conversion_alimenticia = conversionAlimenticia;
        }
      }
    }
    
    // Si se cambia algún valor de balanceado, recalcular el acumulado
    if (isBalanceadoField) {
      const balanceadoAnterior = ultimoMuestra ? ultimoMuestra.balanceado_acumulado : 0;
      const balanceadoAcumulado = calcularBalanceadoAcumulado(
        newFormData.balanceados,
        balanceadoAnterior
      );
      newFormData.balanceado_acumulado = balanceadoAcumulado;

      // Si también hay biomasa, calcular conversión alimenticia
      if (newFormData.biomasa_lbs) {
        const conversionAlimenticia = calcularConversionAlimenticia(balanceadoAcumulado, newFormData.biomasa_lbs);
        newFormData.conversion_alimenticia = conversionAlimenticia;
      }
    }

    // Si se cambia la supervivencia, calcular población actual y biomasa
    if (name === 'supervivencia' && newFormData.id_ciclo) {
      const cicloSeleccionado = ciclosDisponibles.find(ciclo => ciclo.id_ciclo == newFormData.id_ciclo);
      if (cicloSeleccionado && cicloSeleccionado.cantidad_siembra) {
        const poblacionActual = calcularPoblacionActual(value, cicloSeleccionado.cantidad_siembra);
        newFormData.poblacion_actual = poblacionActual;

        // Si también hay peso, calcular biomasa
        if (newFormData.peso) {
          const biomasa = calcularBiomasa(newFormData.peso, poblacionActual);
          newFormData.biomasa_lbs = biomasa;

          // Si también hay balanceado acumulado, calcular conversión alimenticia
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
    setLoading(true);
    setError('');

    // Validar que se haya seleccionado un ciclo
    if (!formData.id_ciclo) {
      setError('Debes seleccionar un ciclo productivo');
      setLoading(false);
      return;
    }

    // Validar que se haya ingresado la fecha de muestra
    if (!formData.fecha_muestra) {
      setError('Debes ingresar la fecha de muestra');
      setLoading(false);
      return;
    }

    // Validar que el usuario esté autenticado
    if (!idUsuario) {
      setError('No se pudo obtener la información del usuario autenticado');
      setLoading(false);
      return;
    }

    // Validar que se tenga la información de la compañía
    if (!idCompania) {
      setError('No se pudo obtener la información de la compañía del usuario');
      setLoading(false);
      return;
    }

    try {
      // Preparar los datos para enviar
      // Extraer los campos de balanceado del objeto y convertirlos a un array
      const balanceadosArray = Object.entries(formData.balanceados)
        .filter(([id, cantidad]) => cantidad !== '' && cantidad !== null && cantidad !== undefined && parseFloat(cantidad) > 0)
        .map(([id, cantidad]) => ({
          id_tipo_balanceado: parseInt(id),
          cantidad: parseFloat(cantidad)
        }));
      
      const dataToSend = {
        id_ciclo: formData.id_ciclo,
        dias_cultivo: formData.dias_cultivo,
        peso: formData.peso,
        incremento_peso: formData.incremento_peso,
        biomasa_lbs: formData.biomasa_lbs,
        balanceados: balanceadosArray, // Enviar como array de objetos
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
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend)
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        // Redirigir de vuelta al panel directivo con mensaje de éxito
        navigate('/layout/directivo', { 
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
    navigate('/layout/directivo');
  };

  return (
    <div className="form-container min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-blue-800 mb-2">
              Nuevo Registro de Muestra
            </h1>
            <p className="text-gray-600">
              Selecciona un ciclo productivo existente y completa los campos de muestra para agregar un nuevo registro.
            </p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {!loadingCiclos && ciclosDisponibles.length === 0 && !error && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
              <p><strong>No hay ciclos productivos en curso disponibles.</strong></p>
              <p className="text-sm mt-1">
                Para agregar registros de muestra, debe haber al menos un ciclo productivo con estado "EN_CURSO". 
                Los ciclos finalizados no están disponibles para agregar nuevas muestras.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Selección de Ciclo Productivo */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seleccionar Ciclo Productivo *
              </label>
              {loadingCiclos ? (
                <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                  Cargando ciclos productivos...
                </div>
              ) : (
                <select
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
              <p className="text-sm text-gray-500 mt-1 leyenda">
                Solo se muestran ciclos productivos con estado "EN_CURSO". Selecciona uno para agregar datos de muestra.
              </p>
            </div>

            {/* Información de muestra */}
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Muestra *
                </label>
                <input
                  type="date"
                  name="fecha_muestra"
                  value={formData.fecha_muestra}
                  onChange={handleChange}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1 leyenda">
                  Selecciona la fecha del muestra
                </p>
              </div>
            </div>

            {/* Información de producción */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Días de Cultivo <span className="text-blue-600 text-xs">(Calculado automáticamente)</span>
                </label>
                <input
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Peso (g)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="peso"
                  value={formData.peso}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: 15.5"
                />
                <p className="text-sm text-gray-500 mt-1 leyenda">
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
                  Incremento Peso (g) <span className="text-blue-600 text-xs">(Calculado automáticamente)</span>
                </label>
                <input
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supervivencia (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="supervivencia"
                  value={formData.supervivencia}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: 93.33"
                />
                <p className="text-sm text-gray-500 mt-1 leyenda">
                  {formData.id_ciclo && ciclosDisponibles.length > 0
                    ? (() => {
                        const cicloSeleccionado = ciclosDisponibles.find(ciclo => ciclo.id_ciclo == formData.id_ciclo);
                        if (cicloSeleccionado && cicloSeleccionado.cantidad_siembra) {
                          return `Cantidad siembra: ${parseInt(cicloSeleccionado.cantidad_siembra).toLocaleString()} individuos`;
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Población Actual <span className="text-blue-600 text-xs">(Calculado automáticamente)</span>
                </label>
                <input
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Biomasa (lbs) <span className="text-blue-600 text-xs">(Calculado automáticamente)</span>
                </label>
                <input
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
              {loadingTipos ? (
                <div className="col-span-full text-center py-4 text-gray-500">
                  Cargando tipos de balanceado...
                </div>
              ) : tiposBalanceado.length === 0 ? (
                <div className="col-span-full text-center py-4 text-yellow-600">
                  No hay tipos de balanceado configurados para esta compañía.
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
                      name={`balanceado_${tipo.id_tipo_balanceado}`}
                      value={formData.balanceados[tipo.id_tipo_balanceado] || ''}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={`Ej: 500`}
                    />
                    <p className="text-sm text-gray-500 mt-1 leyenda">
                      Cantidad consumida en este muestreo ({tipo.unidad})
                    </p>
                  </div>
                ))
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Balanceado Acumulado <span className="text-blue-600 text-xs">(Calculado automáticamente)</span>
                </label>
                <input
                  type="text"
                  name="balanceado_acumulado"
                  value={formData.balanceado_acumulado}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                  placeholder="Se calcula automáticamente"
                />
                <p className="text-sm text-gray-500 mt-1 leyenda">
                  {ultimoMuestra && ultimoMuestra.balanceado_acumulado 
                    ? `Acumulado anterior: ${ultimoMuestra.balanceado_acumulado} + consumo actual`
                    : "Suma del consumo actual (primer muestra del ciclo)"
                  }
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conversión Alimenticia <span className="text-blue-600 text-xs">(Calculado automáticamente)</span>
                </label>
                <input
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones
              </label>
              <textarea
                name="observaciones"
                value={formData.observaciones}
                onChange={handleChange}
                rows="4"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ingresa cualquier observación relevante..."
              />
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
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Guardar Registro
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                disabled={loading || loadingCiclos || loadingTipos}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
