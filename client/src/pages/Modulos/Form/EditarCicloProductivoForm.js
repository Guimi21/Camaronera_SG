import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import config from '../../../config';
import { useAuth } from '../../../context/AuthContext';

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

export default function EditarCicloProductivoForm() {
  const navigate = useNavigate();
  const { id } = useParams(); // Obtener el ID del ciclo desde la URL
  const { API_BASE_URL } = config;
  const { idCompania, idUsuario } = useAuth();
  
  const [formData, setFormData] = useState({
    id_piscina: '',
    fecha_siembra: '',
    fecha_cosecha: '',
    cantidad_siembra: '',
    densidad: '',
    biomasa_cosecha: '',
    tipo_siembra: '',
    id_tipo_alimentacion: '',
    promedio_incremento_peso: '',
    libras_por_hectarea: '',
    ruta_pdf: '',
    estado: 'EN_CURSO'
  });

  const [pdfFile, setPdfFile] = useState(null);
  const [pdfFileName, setPdfFileName] = useState('');
  
  const [piscinas, setPiscinas] = useState([]);
  const [tiposAlimentacion, setTiposAlimentacion] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPiscinas, setLoadingPiscinas] = useState(true);
  const [loadingCiclo, setLoadingCiclo] = useState(true);
  const [error, setError] = useState('');
  const [tieneMuestras, setTieneMuestras] = useState(false); // Nuevo estado para verificar si tiene muestras

  // Hacer scroll al inicio cuando hay un error
  useEffect(() => {
    if (error) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [error]);

  // Referencias para inputs numéricos
  const inputRef1 = useRef(null); // Cantidad de Siembra

  const handleWheel = (e) => {
    // Solo bloquea el scroll si el input está enfocado
    if (document.activeElement === e.target) {
      e.preventDefault();
    }
  };

  // Cargar datos del ciclo productivo a editar
  useEffect(() => {
    const fetchCicloData = async () => {
      if (!idCompania || !id) {
        setError("No se pudo obtener la información necesaria.");
        setLoadingCiclo(false);
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/module/ciclosproductivos.php?id_compania=${idCompania}&id_ciclo=${id}`, 
          {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success && result.data) {
          const ciclo = result.data;
          
          // Formatear las fechas para el input type="date"
          const formatDateForInput = (dateString) => {
            if (!dateString) return '';
            return dateString.split('T')[0];
          };

          setFormData({
            id_piscina: ciclo.id_piscina || '',
            fecha_siembra: formatDateForInput(ciclo.fecha_siembra),
            fecha_cosecha: formatDateForInput(ciclo.fecha_cosecha),
            cantidad_siembra: ciclo.cantidad_siembra || '',
            densidad: ciclo.densidad || '',
            biomasa_cosecha: ciclo.biomasa_cosecha || '',
            tipo_siembra: ciclo.tipo_siembra || '',
            id_tipo_alimentacion: ciclo.id_tipo_alimentacion || '',
            promedio_incremento_peso: ciclo.promedio_incremento_peso || '',
            libras_por_hectarea: '',
            ruta_pdf: ciclo.ruta_pdf || '',
            estado: ciclo.estado || 'EN_CURSO'
          });
          
          // Verificar si el ciclo tiene muestras asociadas
          checkMuestras(ciclo.id_ciclo);
          
          setError('');
        } else {
          throw new Error(result.message || "Error al obtener datos del ciclo");
        }
      } catch (err) {
        console.error("Error fetching ciclo data:", err);
        setError(err.message || "No se pudieron cargar los datos del ciclo.");
      } finally {
        setLoadingCiclo(false);
      }
    };
    
    // Función para verificar si el ciclo tiene muestras
    const checkMuestras = async (idCiclo) => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/module/muestras.php?id_ciclo=${idCiclo}&count=true`,
          {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success && result.data) {
          setTieneMuestras(result.data.tiene_muestras);
        }
      } catch (err) {
        console.error("Error checking muestras:", err);
        // En caso de error, asumir que no tiene muestras para permitir edición
        setTieneMuestras(false);
      }
    };

    if (idCompania && id) {
      fetchCicloData();
    } else {
      setLoadingCiclo(false);
    }
  }, [idCompania, id, API_BASE_URL]);

  // Cargar piscinas disponibles
  useEffect(() => {
    const fetchPiscinas = async () => {
      if (!idCompania) {
        setError("No se pudo obtener la información de la compañía del usuario.");
        setLoadingPiscinas(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/module/piscinas.php?id_compania=${idCompania}`, {
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
          setPiscinas(result.data);
        } else {
          throw new Error(result.message || "Error al obtener piscinas");
        }
      } catch (err) {
        console.error("Error fetching piscinas:", err);
        setError(err.message || "No se pudieron cargar las piscinas.");
      } finally {
        setLoadingPiscinas(false);
      }
    };

    if (idCompania) {
      fetchPiscinas();
    } else {
      setLoadingPiscinas(false);
    }
  }, [idCompania, API_BASE_URL]);

  // Cargar tipos de alimentación disponibles
  useEffect(() => {
    const fetchTiposAlimentacion = async () => {
      if (!idCompania) {
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/module/tipo_alimentacion.php?id_compania=${idCompania}`, {
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
          setTiposAlimentacion(result.data);
        } else {
          throw new Error(result.message || "Error al obtener tipos de alimentación");
        }
      } catch (err) {
        console.error("Error fetching tipos de alimentación:", err);
      }
    };

    if (idCompania) {
      fetchTiposAlimentacion();
    }
  }, [idCompania, API_BASE_URL]);

  // Cargar promedio de incremento de peso cuando el ciclo se finaliza
  useEffect(() => {
    const fetchPromedioIncrementoPeso = async () => {
      if (formData.estado === 'FINALIZADO' && id && formData.promedio_incremento_peso === '') {
        try {
          const response = await fetch(`${API_BASE_URL}/module/muestras.php?id_ciclo=${id}&promedio_incremento_peso=true`, {
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
          
          if (result.success && result.data) {
            // Mostrar el promedio incluso si es 0 o null
            const promedio = result.data.promedio_incremento_peso !== null && result.data.promedio_incremento_peso !== undefined 
              ? result.data.promedio_incremento_peso 
              : '';
            setFormData(prevData => ({
              ...prevData,
              promedio_incremento_peso: promedio
            }));
          }
        } catch (err) {
          console.error("Error fetching promedio incremento peso:", err);
        }
      }
    };

    fetchPromedioIncrementoPeso();
  }, [formData.estado, id, API_BASE_URL]);

  // Efecto para recalcular densidad cuando cambien los datos relevantes
  useEffect(() => {
    if (formData.cantidad_siembra && formData.id_piscina && piscinas.length > 0) {
      const densidadCalculada = calcularDensidad(formData.cantidad_siembra, formData.id_piscina);
      if (densidadCalculada !== formData.densidad) {
        setFormData(prevData => ({
          ...prevData,
          densidad: densidadCalculada
        }));
      }
    }
  }, [formData.cantidad_siembra, formData.id_piscina, piscinas]);

  // Efecto para recalcular libras por hectárea cuando cambien biomasa_cosecha o piscina
  useEffect(() => {
    if (formData.estado === 'FINALIZADO' && formData.biomasa_cosecha && formData.id_piscina && piscinas.length > 0) {
      const librasCalculadas = calcularLibrasPorHectarea(formData.biomasa_cosecha, formData.id_piscina);
      if (librasCalculadas !== formData.libras_por_hectarea) {
        setFormData(prevData => ({
          ...prevData,
          libras_por_hectarea: librasCalculadas
        }));
      }
    } else if (formData.estado !== 'FINALIZADO') {
      // Limpiar el valor si el estado no es FINALIZADO
      if (formData.libras_por_hectarea !== '') {
        setFormData(prevData => ({
          ...prevData,
          libras_por_hectarea: ''
        }));
      }
    }
  }, [formData.biomasa_cosecha, formData.id_piscina, formData.estado, piscinas]);

  // Función para calcular densidad
  const calcularDensidad = (cantidadSiembra, idPiscina) => {
    if (!cantidadSiembra || !idPiscina) return '';
    
    const piscinaSeleccionada = piscinas.find(p => p.id_piscina == idPiscina);
    if (!piscinaSeleccionada?.hectareas) return '';
    
    const cantidadNum = Number.parseFloat(cantidadSiembra);
    const hectareasNum = Number.parseFloat(piscinaSeleccionada.hectareas);

    if (Number.isNaN(cantidadNum) || Number.isNaN(hectareasNum) || hectareasNum === 0) {
      return '';
    }
    
    const densidad = cantidadNum / hectareasNum;
    return densidad.toFixed(2);
  };

  // Función para calcular libras por hectárea
  const calcularLibrasPorHectarea = (cantidadCosecha, idPiscina) => {
    if (!cantidadCosecha || !idPiscina) return '';
    
    const piscinaSeleccionada = piscinas.find(p => p.id_piscina == idPiscina);
    if (!piscinaSeleccionada?.hectareas) return '';
    
    const cantidadNum = Number.parseFloat(cantidadCosecha);
    const hectareasNum = Number.parseFloat(piscinaSeleccionada.hectareas);

    if (Number.isNaN(cantidadNum) || Number.isNaN(hectareasNum) || hectareasNum === 0) {
      return '';
    }
    
    const libras = cantidadNum / hectareasNum;
    return libras.toFixed(2);
  };

  // Validar valor numérico
  const validarValorNumerico = (value) => {
    if (value === '') return true;
    const numericValue = Number.parseFloat(value);
    return !Number.isNaN(numericValue) && numericValue > 0;
  };

  // Actualizar densidad si es necesario
  const actualizarDensidadSiNecesario = (name, value, currentFormData) => {
    if (name === 'cantidad_siembra' || name === 'id_piscina') {
      const cantidadSiembra = name === 'cantidad_siembra' ? value : currentFormData.cantidad_siembra;
      const idPiscina = name === 'id_piscina' ? value : currentFormData.id_piscina;
      return calcularDensidad(cantidadSiembra, idPiscina);
    }
    return currentFormData.densidad;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Validar campos numéricos
    if ((name === 'cantidad_siembra' || name === 'biomasa_cosecha') && !validarValorNumerico(value)) {
      return;
    }
    
    const newFormData = {
      ...formData,
      [name]: value,
      densidad: formData.densidad
    };
    
    newFormData.densidad = actualizarDensidadSiNecesario(name, value, newFormData);
    setFormData(newFormData);
  };

  const handlePdfChange = (e) => {
    const file = e.target.files[0];
    
    if (!file) {
      setPdfFile(null);
      setPdfFileName('');
      return;
    }
    
    // Validar que sea PDF
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

  // Validar campos requeridos básicos
  const validarCamposBasicos = () => {
    if (!formData.id_piscina) return 'Debe seleccionar una piscina.';
    if (!formData.fecha_siembra) return 'La fecha de siembra es requerida.';
    if (!formData.cantidad_siembra || Number.parseFloat(formData.cantidad_siembra) <= 0) {
      return 'La cantidad de siembra debe ser un número positivo.';
    }
    if (!formData.densidad) {
      return 'La densidad no pudo calcularse. Verifica la cantidad de siembra y la piscina seleccionada.';
    }
    if (!formData.tipo_siembra.trim()) return 'El tipo de siembra es requerido.';
    if (!formData.id_tipo_alimentacion) return 'El tipo de alimentación es requerido.';
    return null;
  };

  // Validar campos para ciclos finalizados
  const validarCicloFinalizado = () => {
    if (formData.estado !== 'FINALIZADO') return null;
    
    if (!formData.fecha_cosecha) {
      return 'La fecha de cosecha es requerida cuando el estado es "Finalizado".';
    }
    if (!formData.biomasa_cosecha || Number.parseFloat(formData.biomasa_cosecha) <= 0) {
      return 'La cosecha en libras debe ser un número positivo cuando el estado es "Finalizado".';
    }
    if (!pdfFile && !formData.ruta_pdf) {
      const pdfInput = document.getElementById('ruta_pdf');
      if (pdfInput) {
        pdfInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        pdfInput.focus();
      }
      return null; // Sin error aquí, el focus maneja la UX
    }
    return null;
  };

  // Validar archivo PDF
  const validarArchivoPdf = () => {
    if (pdfFile && pdfFile.type !== 'application/pdf' && !pdfFile.name.endsWith('.pdf')) {
      return 'Solo se permiten archivos en formato PDF.';
    }
    return null;
  };

  // Cargar PDF si existe
  const cargarPdf = async () => {
    if (!pdfFile) return formData.ruta_pdf;

    const formDataPdf = new FormData();
    formDataPdf.append('pdf', pdfFile);
    formDataPdf.append('id_ciclo', id);
    formDataPdf.append('id_compania', idCompania);
    
    const uploadResponse = await fetch(`${API_BASE_URL}/module/ciclosproductivos.php?action=upload_pdf`, {
      method: 'POST',
      credentials: 'include',
      body: formDataPdf
    });
    
    const uploadResult = await uploadResponse.json();
    
    if (uploadResponse.ok && uploadResult.success) {
      return uploadResult.ruta_pdf;
    }
    throw new Error(uploadResult.message || 'Error al cargar el archivo PDF.');
  };

  // Construir datos para enviar
  const construirDataEnvio = (rutaPdf) => ({
    id_ciclo: Number.parseInt(id),
    id_piscina: Number.parseInt(formData.id_piscina),
    fecha_siembra: formData.fecha_siembra,
    fecha_cosecha: formData.fecha_cosecha || null,
    cantidad_siembra: Number.parseInt(formData.cantidad_siembra),
    densidad: Number.parseFloat(formData.densidad),
    biomasa_cosecha: (formData.estado === 'FINALIZADO' && formData.biomasa_cosecha) ? Number.parseInt(formData.biomasa_cosecha) : null,
    libras_por_hectarea: (formData.estado === 'FINALIZADO' && formData.libras_por_hectarea) ? Number.parseFloat(formData.libras_por_hectarea) : null,
    tipo_siembra: formData.tipo_siembra.trim(),
    id_tipo_alimentacion: Number.parseInt(formData.id_tipo_alimentacion),
    promedio_incremento_peso: (formData.promedio_incremento_peso !== '' && formData.promedio_incremento_peso !== null) ? Number.parseFloat(formData.promedio_incremento_peso) : null,
    ruta_pdf: rutaPdf || null,
    estado: formData.estado,
    id_compania: idCompania,
    id_usuario_actualiza: idUsuario
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones en orden
    const errorBasico = validarCamposBasicos();
    if (errorBasico) {
      setError(errorBasico);
      return;
    }

    const errorFinalizado = validarCicloFinalizado();
    if (errorFinalizado) {
      setError(errorFinalizado);
      return;
    }

    const errorPdf = validarArchivoPdf();
    if (errorPdf) {
      setError(errorPdf);
      return;
    }

    if (!idCompania || !idUsuario) {
      setError('No se pudo obtener la información del usuario o compañía.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const rutaPdf = await cargarPdf();
      const dataToSend = construirDataEnvio(rutaPdf);

      const response = await fetch(`${API_BASE_URL}/module/ciclosproductivos.php`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(dataToSend)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        navigate('/layout/dashboard/monitoreo-ciclos');
      } else {
        setError(result.message || 'Error al actualizar el ciclo productivo. Por favor intente nuevamente.');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error updating ciclo:', error);
      setError(error.message || 'Error de conexión. Por favor intente nuevamente.');
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/layout/dashboard/monitoreo-ciclos');
  };

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
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Editar Ciclo Productivo</h1>
        <p className="text-gray-600">Modifique los campos necesarios para actualizar el ciclo productivo.</p>
      </div>

      {error && (
        <div className="header-user mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-3">
          <svg className="info w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      {(!idCompania || !idUsuario) && (
        <div className="mb-6 p-4 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          <p><strong>⚠️ Información de usuario incompleta</strong></p>
          <p className="text-sm mt-1">
            No se pudo cargar la información de la compañía o del usuario. Por favor, cierre sesión e inicie sesión nuevamente.
          </p>
        </div>
      )}

      {piscinas.length === 0 && !error && (
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
      )}

      {tieneMuestras && (
        <div className="header-user mb-6 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded flex items-center gap-3">
          <svg className="info w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <p><strong>Ciclo con muestras registradas</strong></p>
            <p className="text-sm mt-1">
              Este ciclo productivo tiene muestras asociadas. Solo se pueden editar los campos: Fecha de Cosecha, Tipo de Siembra y Estado.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="id_piscina" className="block text-sm font-medium text-gray-700 mb-2">
            Piscina *
          </label>
          <select
            id="id_piscina"
            name="id_piscina"
            value={formData.id_piscina}
            onChange={handleChange}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              tieneMuestras ? 'bg-gray-50 cursor-not-allowed' : ''
            }`}
            disabled={piscinas.length === 0 || tieneMuestras}
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
          <p className="text-xs text-gray-500 mt-1 leyenda">
            Seleccione la piscina donde se realiza el ciclo productivo
          </p>
        </div>

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
                tieneMuestras ? 'bg-gray-50 cursor-not-allowed' : ''
              }`}
              disabled={tieneMuestras}
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
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                formData.estado === 'FINALIZADO' && !formData.fecha_cosecha
                  ? 'border-red-300 bg-red-50'
                  : 'border-gray-300'
              }`}
              required={formData.estado === 'FINALIZADO'}
            />
            {formData.estado === 'FINALIZADO' && formData.fecha_cosecha === '' && <ValidationMessage fieldName="una Fecha de Cosecha" />}
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
                tieneMuestras ? 'bg-gray-50 cursor-not-allowed' : ''
              }`}
              placeholder="Ej: 500000"
              min="1"
              step="1"
              disabled={tieneMuestras}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Seleccione un tipo de siembra</option>
              <option value="transf">transf</option>
              <option value="Directo">Directo</option>
            </select>
            {formData.tipo_siembra === '' && <ValidationMessage fieldName="un Tipo de Siembra" />}
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Seleccione un tipo de alimentación</option>
              {tiposAlimentacion.map(tipo => (
                <option key={tipo.id_tipo_alimentacion} value={tipo.id_tipo_alimentacion}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
            {formData.id_tipo_alimentacion === '' && <ValidationMessage fieldName="un Tipo de Alimentación" />}
            <p className="text-xs text-gray-500 mt-1 leyenda">
              Tipo de alimentación a utilizar en el ciclo productivo
            </p>
          </div>

          <div>
            <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-2">
              Estado *
            </label>
            <select
              id="estado"
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="EN_CURSO">En Curso</option>
              <option value="FINALIZADO">Finalizado</option>
            </select>
            <p className="text-xs text-gray-500 mt-1 leyenda">
              Estado actual del ciclo productivo
            </p>
          </div>
        </div>

        {formData.estado === 'FINALIZADO' && (
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
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formData.biomasa_cosecha === ''
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-300'
                }`}
                placeholder="Ej: 450000"
                min="1"
                step="1"
                required
              />
              {formData.biomasa_cosecha === '' && <ValidationMessage fieldName="una Cosecha en libras" />}
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
                {formData.id_piscina && piscinas.length > 0 && (() => {
                  const piscinaSeleccionada = piscinas.find(p => p.id_piscina == formData.id_piscina);
                  return piscinaSeleccionada ? ` (${piscinaSeleccionada.hectareas} ha)` : '';
                })()}
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
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    formData.estado === 'FINALIZADO' && !pdfFile && !formData.ruta_pdf
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
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
              {formData.estado === 'FINALIZADO' && !pdfFile && !formData.ruta_pdf && <ValidationMessage fieldName="un Informe PDF" />}
              <p className="text-xs text-gray-500 mt-1 leyenda">
                Informe PDF del ciclo productivo. Solo se permiten archivos en formato PDF.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 pt-6">
          <button
            type="submit"
            disabled={loading || piscinas.length === 0}
            className={`flex-1 sm:flex-none px-6 py-3 rounded-md font-medium text-white transition-colors duration-200 ${
              loading || piscinas.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
          >
            Guardar Cambios
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 sm:flex-none px-6 py-3 border border-gray-300 rounded-md font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
