// Validar formulario según el perfil del usuario
export const validarFormulario = (formData, isEditMode, perfilActivo, idUsuarioAuth) => {
  if (!formData.nombre.trim()) {
    return { valid: false, error: 'El nombre es obligatorio' };
  }
  
  // En modo creación, requerir username
  if (!isEditMode && !formData.username.trim()) {
    return { valid: false, error: 'El usuario (username) es obligatorio' };
  }
  
  // En modo creación, requerir contraseña. En edición, es opcional.
  if (!isEditMode && !formData.password) {
    return { valid: false, error: 'La contraseña es obligatoria' };
  }

  if (!formData.perfil) {
    return { valid: false, error: 'Debe seleccionar un perfil' };
  }

  if (perfilActivo === 'Superadministrador' && !isEditMode && !formData.idGrupoEmpresarial) {
    return { valid: false, error: 'Debe seleccionar un grupo empresarial' };
  }

  if (perfilActivo !== 'Superadministrador' && formData.companias.length === 0) {
    return { valid: false, error: 'Debe seleccionar al menos una compañía' };
  }

  if (!idUsuarioAuth) {
    return { valid: false, error: 'No se pudo obtener la información del usuario autenticado' };
  }

  return { valid: true };
};

// Construir payload para enviar
export const construirPayload = (formData, isEditMode, idUsuarioParam, idUsuarioAuth, perfilActivo) => {
  if (isEditMode) {
    // Modo edición
    const payload = {
      nombre: formData.nombre.trim(),
      estado: formData.estado,
      perfiles: [Number.parseInt(formData.perfil)],
      companias: formData.companias,
      id_usuario_edit: Number.parseInt(idUsuarioParam),
      id_usuario: idUsuarioAuth
    };
    
    // Incluir contraseña solo si se proporciona
    if (formData.password.trim()) {
      payload.password = formData.password.trim();
    }
    
    if (perfilActivo === 'Superadministrador' && formData.idGrupoEmpresarial) {
      payload.idGrupoEmpresarial = formData.idGrupoEmpresarial;
    }
    
    return payload;
  } else {
    // Modo creación
    return {
      nombre: formData.nombre.trim(),
      username: formData.username.trim(),
      password: formData.password,
      estado: formData.estado,
      perfiles: [Number.parseInt(formData.perfil)],
      companias: formData.companias,
      idGrupoEmpresarial: formData.idGrupoEmpresarial || null,
      id_usuario: idUsuarioAuth
    };
  }
};

// Extraer IDs de perfiles desde nombres
export const extraerPerfilesIds = (perfilesNombres, perfilesDisponibles) => {
  return perfilesNombres
    .split(', ')
    .map(p => {
      const perfil = perfilesDisponibles.find(pf => pf.nombre === p.trim());
      return perfil ? perfil.id_perfil : null;
    })
    .filter(p => p !== null);
};

// Extraer IDs de compañías desde nombres
export const extraerCompaniasIds = (companiasNombres, companiasDisponibles) => {
  return companiasNombres
    .split(', ')
    .map(c => {
      const compania = companiasDisponibles.find(co => co.nombre === c.trim());
      return compania ? compania.id_compania : null;
    })
    .filter(c => c !== null);
};

// Extraer ID del grupo empresarial
export const extraerGrupoEmpresarialId = (grupoNombre, gruposEmpresarialesDisponibles) => {
  const grupoEncontrado = gruposEmpresarialesDisponibles.find(
    g => g.nombre === grupoNombre
  );
  return grupoEncontrado ? grupoEncontrado.id_grupo_empresarial : '';
};
