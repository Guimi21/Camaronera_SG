export const getCssClassNames = (formData, isConsultaMode, pdfFile) => {
  const getFechaCosechaClassName = () => {
    if (isConsultaMode) return 'border-gray-300 bg-gray-50 cursor-not-allowed';
    if (formData.estado === 'FINALIZADO' && !formData.fecha_cosecha) return 'border-red-300 bg-red-50';
    return 'border-gray-300';
  };

  const getBiomasaCosechaClassName = () => {
    if (isConsultaMode) return 'border-gray-300 bg-gray-50 cursor-not-allowed';
    if (formData.biomasa_cosecha === '') return 'border-red-300 bg-red-50';
    return 'border-gray-300';
  };

  const getRutaPdfClassName = () => {
    if (isConsultaMode) return 'border-gray-300 bg-gray-50 cursor-not-allowed';
    if (formData.estado === 'FINALIZADO' && !pdfFile && !formData.ruta_pdf) return 'border-red-300 bg-red-50';
    return 'border-gray-300';
  };

  return {
    fechaCosecha: getFechaCosechaClassName(),
    biomasaCosecha: getBiomasaCosechaClassName(),
    rutaPdf: getRutaPdfClassName()
  };
};

export const getFormTexts = (isConsultaMode, isEditMode, loading, piscinas, loadingPiscinas) => {
  const getFormDescription = () => {
    if (isConsultaMode) return 'Visualización de la información del ciclo productivo.';
    if (isEditMode) return 'Modifique los campos necesarios para actualizar el ciclo productivo.';
    return 'Complete los campos para registrar un nuevo ciclo productivo en el sistema.';
  };

  const getSubmitButtonLoadingText = () => isEditMode ? 'Guardando Cambios...' : 'Guardando Ciclo...';

  const getSubmitButtonDefaultText = () => isEditMode ? 'Guardar Cambios' : 'Guardar Ciclo Productivo';

  const getSubmitButtonText = () => loading ? getSubmitButtonLoadingText() : getSubmitButtonDefaultText();

  const getFormTitle = () => {
    if (isConsultaMode) return 'Consultar Ciclo Productivo';
    return isEditMode ? 'Editar Ciclo Productivo' : 'Agregar Nuevo Ciclo Productivo';
  };

  const getSubmitButtonClassName = (loading, isEditMode, piscinas, loadingPiscinas) => {
    const isDisabled = loading || (isEditMode ? piscinas.length === 0 : piscinas.length === 0 || loadingPiscinas);
    return isDisabled
      ? 'bg-gray-400 cursor-not-allowed'
      : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2';
  };

  return {
    description: getFormDescription(),
    submitLoadingText: getSubmitButtonLoadingText(),
    submitDefaultText: getSubmitButtonDefaultText(),
    submitText: getSubmitButtonText(),
    title: getFormTitle(),
    submitButtonClassName: getSubmitButtonClassName(loading, isEditMode, piscinas, loadingPiscinas)
  };
};

export const isSubmitDisabledCalc = (loading, isEditMode, piscinas, loadingPiscinas) => {
  return loading || (isEditMode ? piscinas.length === 0 : piscinas.length === 0 || loadingPiscinas);
};

// Función para construir formulario inicial desde datos del ciclo
export const buildFormDataFromCiclo = (ciclo) => ({
  id_piscina: ciclo.id_piscina || '',
  fecha_siembra: ciclo.fecha_siembra?.split('T')[0] || '',
  fecha_cosecha: ciclo.fecha_cosecha?.split('T')[0] || '',
  cantidad_siembra: ciclo.cantidad_siembra || '',
  densidad: ciclo.densidad || '',
  biomasa_cosecha: ciclo.biomasa_cosecha || '',
  tipo_siembra: ciclo.tipo_siembra || '',
  id_tipo_alimentacion: ciclo.id_tipo_alimentacion || '',
  nombre_tipo_alimentacion: ciclo.nombre_tipo_alimentacion || '',
  promedio_incremento_peso: ciclo.promedio_incremento_peso || '',
  libras_por_hectarea: ciclo.libras_por_hectarea || '',
  ruta_pdf: ciclo.ruta_pdf || '',
  estado: ciclo.estado || 'EN_CURSO'
});

// Función para filtrar piscinas según modo
export const filterPiscinasForMode = (piscinasData, ciclosData, isEditMode) => {
  if (isEditMode) return piscinasData;
  
  const piscinasConCicloEnCurso = new Set(
    ciclosData
      .filter(ciclo => ciclo.estado === 'EN_CURSO')
      .map(ciclo => ciclo.id_piscina)
  );

  return piscinasData.filter(
    piscina => !piscinasConCicloEnCurso.has(piscina.id_piscina)
  );
};

// Validaciones separadas por tipo
export const validateFieldsByType = (formData) => {
  if (!formData.id_piscina) return 'Debe seleccionar una piscina.';
  if (!formData.fecha_siembra) return 'La fecha de siembra es requerida.';
  if (!formData.cantidad_siembra || Number.parseFloat(formData.cantidad_siembra) <= 0) {
    return 'La cantidad de siembra debe ser un número positivo.';
  }
  if (!formData.densidad) {
    return 'La densidad no pudo calcularse. Verifica la cantidad de siembra y la piscina seleccionada.';
  }
  return null;
};

export const validateSelectionFields = (formData) => {
  if (!formData.tipo_siembra.trim()) return 'El tipo de siembra es requerido.';
  if (!formData.id_tipo_alimentacion) return 'El tipo de alimentación es requerido.';
  return null;
};

export const validateFinalizedFields = (formData, pdfFile) => {
  if (formData.estado !== 'FINALIZADO') return null;
  if (!formData.fecha_cosecha) {
    return 'La fecha de cosecha es requerida cuando el estado es "Finalizado".';
  }
  if (!formData.biomasa_cosecha || Number.parseFloat(formData.biomasa_cosecha) <= 0) {
    return 'La cosecha en libras debe ser un número positivo cuando el estado es "Finalizado".';
  }
  if (!pdfFile && !formData.ruta_pdf) return null;
  return null;
};

export const validatePdfType = (pdfFile) => {
  if (pdfFile && pdfFile.type !== 'application/pdf' && !pdfFile.name.endsWith('.pdf')) {
    return 'Solo se permiten archivos en formato PDF.';
  }
  return null;
};

// Constructores de datos
export const buildCreationData = (formData, idCompania, idUsuario) => ({
  id_piscina: Number.parseInt(formData.id_piscina),
  fecha_siembra: formData.fecha_siembra,
  fecha_cosecha: formData.fecha_cosecha || null,
  cantidad_siembra: Number.parseInt(formData.cantidad_siembra),
  densidad: Number.parseFloat(formData.densidad),
  tipo_siembra: formData.tipo_siembra.trim(),
  id_tipo_alimentacion: Number.parseInt(formData.id_tipo_alimentacion),
  promedio_incremento_peso: null,
  estado: formData.estado,
  id_compania: idCompania,
  id_usuario_crea: idUsuario,
  id_usuario_actualiza: idUsuario
});

export const buildEditionData = (formData, idCicloParam, idCompania, idUsuario, rutaPdf) => ({
  id_ciclo: Number.parseInt(idCicloParam),
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

export const cargarPdf = async (pdfFile, idCicloParam, idCompania, formData, API_BASE_URL) => {
  if (!pdfFile) return formData.ruta_pdf;

  const formDataPdf = new FormData();
  formDataPdf.append('pdf', pdfFile);
  formDataPdf.append('id_ciclo', idCicloParam);
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

// ===== FUNCIONES DE CÁLCULO =====

export const calcularDensidadValue = (cantidadSiembra, idPiscina, piscinas) => {
  if (!cantidadSiembra || !idPiscina) return '';
  const piscinaSeleccionada = piscinas.find(p => p.id_piscina === idPiscina);
  if (!piscinaSeleccionada?.hectareas) return '';
  const cantidadNum = Number.parseFloat(cantidadSiembra);
  const hectareasNum = Number.parseFloat(piscinaSeleccionada.hectareas);
  if (Number.isNaN(cantidadNum) || Number.isNaN(hectareasNum) || hectareasNum === 0) return '';
  return (cantidadNum / hectareasNum).toFixed(2);
};

export const calcularLibrasPorHectareaValue = (cantidadCosecha, idPiscina, piscinas) => {
  if (!cantidadCosecha || !idPiscina) return '';
  const piscinaSeleccionada = piscinas.find(p => p.id_piscina === idPiscina);
  if (!piscinaSeleccionada?.hectareas) return '';
  const cantidadNum = Number.parseFloat(cantidadCosecha);
  const hectareasNum = Number.parseFloat(piscinaSeleccionada.hectareas);
  if (Number.isNaN(cantidadNum) || Number.isNaN(hectareasNum) || hectareasNum === 0) return '';
  return (cantidadNum / hectareasNum).toFixed(2);
};

export const validarValorNumerico = (value) => {
  if (value === '') return true;
  const numericValue = Number.parseFloat(value);
  return !Number.isNaN(numericValue) && numericValue > 0;
};

export const isValidNumericField = (name) => name === 'cantidad_siembra' || name === 'biomasa_cosecha';

export const shouldUpdateDensity = (name) => name === 'cantidad_siembra' || name === 'id_piscina';

export const updateDensityIfNeeded = (name, value, currentFormData, piscinas) => {
  if (!shouldUpdateDensity(name)) return currentFormData.densidad;
  const cantidadSiembra = name === 'cantidad_siembra' ? value : currentFormData.cantidad_siembra;
  const idPiscina = name === 'id_piscina' ? value : currentFormData.id_piscina;
  return calcularDensidadValue(cantidadSiembra, idPiscina, piscinas);
};

export const shouldRecalculateDensity = (formData, piscinas) => {
  return formData.cantidad_siembra && formData.id_piscina && piscinas.length > 0;
};

export const shouldRecalculateLibras = (formData, piscinas) => {
  return formData.estado === 'FINALIZADO' && formData.biomasa_cosecha && formData.id_piscina && piscinas.length > 0;
};

export const shouldClearLibras = (formData) => {
  return formData.estado !== 'FINALIZADO' && formData.libras_por_hectarea !== '';
};
