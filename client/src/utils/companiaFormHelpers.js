// Validación de teléfono
export const validarTelefono = (telefono) => {
  if (!telefono || telefono.trim() === '') {
    return { valido: true, razon: '' }; // El teléfono es opcional
  }
  
  const telefonoSinEspacios = telefono.replaceAll(' ', '');
  const soloDigitos = /^\d+$/.test(telefonoSinEspacios);
  const tieneExactamente10 = telefonoSinEspacios.length === 10;
  
  if (!soloDigitos) {
    return { valido: false, razon: 'El teléfono solo puede contener dígitos' };
  }
  
  if (!tieneExactamente10) {
    return { valido: false, razon: `El teléfono debe tener exactamente 10 dígitos (actualmente tiene ${telefonoSinEspacios.length})` };
  }
  
  return { valido: true, razon: '' };
};

// Obtener campos vacíos requeridos
export const obtenerCamposVacios = (formData) => {
  const camposVacios = [];

  if (!formData.nombre || formData.nombre.trim() === '') {
    camposVacios.push({
      campo: 'Nombre de la Compañía',
      tipo: 'vacio',
      razon: 'Este campo es obligatorio'
    });
  }

  return camposVacios;
};

// Validar formulario completo
export const validarFormulario = (formData) => {
  // Verificar si hay campos vacíos
  const camposVacios = obtenerCamposVacios(formData);
  if (camposVacios.length > 0) {
    return { valido: false, error: 'Campos requeridos faltantes' };
  }

  // Validar teléfono si fue ingresado
  if (formData.telefono.trim()) {
    const validacionTelefono = validarTelefono(formData.telefono);
    if (!validacionTelefono.valido) {
      return { valido: false, error: `Teléfono: ${validacionTelefono.razon}` };
    }
  }

  return { valido: true, error: '' };
};

// Construir payload para crear compañía
export const construirPayloadCreacion = (formData, idUsuario) => ({
  nombre: formData.nombre.trim(),
  direccion: formData.direccion.trim() || null,
  telefono: formData.telefono.trim() || null,
  estado: formData.estado,
  id_usuario: idUsuario
});

// Construir payload para editar compañía
export const construirPayloadEdicion = (formData, idCompania, idUsuario) => ({
  nombre: formData.nombre.trim(),
  direccion: formData.direccion.trim() || null,
  telefono: formData.telefono.trim() || null,
  estado: formData.estado,
  id_compania: Number.parseInt(idCompania),
  id_usuario: idUsuario
});

// Procesar mensajes de error de la API
export const procesarMensajeError = (errorMessage) => {
  if (!errorMessage) return null;

  const errorMap = {
    'Ya existe una compañía con este nombre para este grupo empresarial': 
      'Ya existe una compañía con este nombre en tu grupo empresarial. Por favor, elige un nombre diferente.',
    'Error al insertar la compañía en la base de datos': 
      'Ocurrió un error al guardar la compañía. Por favor, intenta nuevamente.',
    'Error al actualizar la compañía en la base de datos': 
      'Ocurrió un error al actualizar la compañía. Por favor, intenta nuevamente.',
    'No tiene permiso para editar esta compañía':
      'No tienes permisos para editar esta compañía.'
  };

  for (const [key, value] of Object.entries(errorMap)) {
    if (errorMessage.includes(key)) {
      return value;
    }
  }

  if (errorMessage.includes('Error HTTP:') || errorMessage.includes('500')) {
    return 'Ocurrió un error en el servidor. Por favor, intenta nuevamente más tarde.';
  }

  if (errorMessage.includes('Failed to fetch')) {
    return 'Error de conexión. Por favor, verifica tu conexión a internet.';
  }

  return errorMessage;
};
