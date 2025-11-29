<?php
/**
 * Constantes Centralizadas para toda la aplicación
 * Este archivo centraliza todas las constantes para evitar duplicación
 * Usa if (!defined()) para evitar redefiniciones
 */

// ==================== RESPUESTAS ESTÁNDAR ====================
if (!defined('RESPONSE_SUCCESS')) {
    define('RESPONSE_SUCCESS', 'success');
}
if (!defined('RESPONSE_MESSAGE')) {
    define('RESPONSE_MESSAGE', 'message');
}
if (!defined('RESPONSE_DATA')) {
    define('RESPONSE_DATA', 'data');
}
if (!defined('RESPONSE_TOTAL')) {
    define('RESPONSE_TOTAL', 'total');
}
if (!defined('RESPONSE_ERROR')) {
    define('RESPONSE_ERROR', 'error');
}
if (!defined('HEADER_CONTENT_TYPE_JSON')) {
    define('HEADER_CONTENT_TYPE_JSON', 'Content-Type: application/json; charset=utf-8');
}

// ==================== MENSAJES DE ÉXITO ====================
if (!defined('SUCCESS_RECORD_CREATED')) {
    define('SUCCESS_RECORD_CREATED', 'Registro creado exitosamente');
}
if (!defined('SUCCESS_RECORD_UPDATED')) {
    define('SUCCESS_RECORD_UPDATED', 'Registro actualizado exitosamente');
}
if (!defined('SUCCESS_RECORD_DELETED')) {
    define('SUCCESS_RECORD_DELETED', 'Registro eliminado exitosamente');
}
if (!defined('SUCCESS_DATA_RETRIEVED')) {
    define('SUCCESS_DATA_RETRIEVED', 'Datos obtenidos correctamente');
}
if (!defined('SUCCESS_LOGIN')) {
    define('SUCCESS_LOGIN', 'Login exitoso');
}
if (!defined('SUCCESS_FILE_UPLOADED')) {
    define('SUCCESS_FILE_UPLOADED', 'Archivo cargado exitosamente');
}

// ==================== MENSAJES DE ERROR - BASE DE DATOS ====================
if (!defined('ERROR_DB_CONNECTION')) {
    define('ERROR_DB_CONNECTION', 'Error de conexión a la base de datos');
}
if (!defined('ERROR_DB_QUERY_PREPARE')) {
    define('ERROR_DB_QUERY_PREPARE', 'Error al preparar la consulta');
}
if (!defined('ERROR_DB_QUERY_EXECUTE')) {
    define('ERROR_DB_QUERY_EXECUTE', 'Error al ejecutar la consulta');
}
if (!defined('ERROR_DB_INSERT')) {
    define('ERROR_DB_INSERT', 'Error al insertar datos');
}
if (!defined('ERROR_DB_UPDATE')) {
    define('ERROR_DB_UPDATE', 'Error al actualizar datos');
}
if (!defined('ERROR_DB_DELETE')) {
    define('ERROR_DB_DELETE', 'Error al eliminar datos');
}
if (!defined('ERROR_DB_FETCH')) {
    define('ERROR_DB_FETCH', 'Error al obtener datos');
}

// ==================== MENSAJES DE ERROR - VALIDACIÓN ====================
if (!defined('ERROR_VALIDATION_ID_USUARIO')) {
    define('ERROR_VALIDATION_ID_USUARIO', 'ID de usuario requerido');
}
if (!defined('ERROR_VALIDATION_ID_COMPANIA')) {
    define('ERROR_VALIDATION_ID_COMPANIA', 'ID de compañía requerido');
}
if (!defined('ERROR_VALIDATION_ID_PISCINA')) {
    define('ERROR_VALIDATION_ID_PISCINA', 'ID de piscina requerido');
}
if (!defined('ERROR_VALIDATION_ID_CICLO')) {
    define('ERROR_VALIDATION_ID_CICLO', 'ID de ciclo requerido');
}
if (!defined('ERROR_VALIDATION_NOMBRE')) {
    define('ERROR_VALIDATION_NOMBRE', 'Nombre requerido');
}
if (!defined('ERROR_VALIDATION_INVALID_INPUT')) {
    define('ERROR_VALIDATION_INVALID_INPUT', 'Datos no válidos');
}
if (!defined('ERROR_VALIDATION_REQUIRED_FIELD')) {
    define('ERROR_VALIDATION_REQUIRED_FIELD', ' requerido');
}
if (!defined('ERROR_VALIDATION_INVALID_JSON')) {
    define('ERROR_VALIDATION_INVALID_JSON', 'Datos no válidos - JSON inválido');
}
if (!defined('ERROR_VALIDATION_INVALID_INTEGER')) {
    define('ERROR_VALIDATION_INVALID_INTEGER', ' debe ser un número entero');
}

// ==================== MENSAJES DE ERROR - AUTENTICACIÓN ====================
if (!defined('ERROR_AUTH_UNAUTHORIZED')) {
    define('ERROR_AUTH_UNAUTHORIZED', 'No autorizado');
}
if (!defined('ERROR_AUTH_FORBIDDEN')) {
    define('ERROR_AUTH_FORBIDDEN', 'Acceso denegado');
}
if (!defined('ERROR_AUTH_INVALID_CREDENTIALS')) {
    define('ERROR_AUTH_INVALID_CREDENTIALS', 'Credenciales inválidas');
}

// ==================== MENSAJES DE ERROR - ARCHIVOS ====================
if (!defined('ERROR_FILE_NOT_RECEIVED')) {
    define('ERROR_FILE_NOT_RECEIVED', 'No se recibió ningún archivo o hubo un error en la carga');
}
if (!defined('ERROR_FILE_INVALID_TYPE')) {
    define('ERROR_FILE_INVALID_TYPE', 'Tipo de archivo no permitido');
}
if (!defined('ERROR_FILE_UPLOAD_FAILED')) {
    define('ERROR_FILE_UPLOAD_FAILED', 'Error al guardar el archivo');
}
if (!defined('ERROR_FILE_NOT_FOUND')) {
    define('ERROR_FILE_NOT_FOUND', 'Archivo no encontrado');
}

// ==================== MENSAJES DE ERROR - SERVIDOR ====================
if (!defined('ERROR_SERVER_INTERNAL')) {
    define('ERROR_SERVER_INTERNAL', 'Error interno del servidor');
}
if (!defined('ERROR_SERVER_PREFIX')) {
    define('ERROR_SERVER_PREFIX', 'Error del servidor: ');
}
if (!defined('ERROR_UNKNOWN')) {
    define('ERROR_UNKNOWN', 'Error desconocido');
}

// ==================== MÉTODOS HTTP ====================
if (!defined('METHOD_GET')) {
    define('METHOD_GET', 'GET');
}
if (!defined('METHOD_POST')) {
    define('METHOD_POST', 'POST');
}
if (!defined('METHOD_PUT')) {
    define('METHOD_PUT', 'PUT');
}
if (!defined('METHOD_DELETE')) {
    define('METHOD_DELETE', 'DELETE');
}
if (!defined('METHOD_PATCH')) {
    define('METHOD_PATCH', 'PATCH');
}
if (!defined('METHOD_OPTIONS')) {
    define('METHOD_OPTIONS', 'OPTIONS');
}

// ==================== CÓDIGOS DE RESPUESTA HTTP ====================
if (!defined('HTTP_OK')) {
    define('HTTP_OK', 200);
}
if (!defined('HTTP_CREATED')) {
    define('HTTP_CREATED', 201);
}
if (!defined('HTTP_BAD_REQUEST')) {
    define('HTTP_BAD_REQUEST', 400);
}
if (!defined('HTTP_UNAUTHORIZED')) {
    define('HTTP_UNAUTHORIZED', 401);
}
if (!defined('HTTP_FORBIDDEN')) {
    define('HTTP_FORBIDDEN', 403);
}
if (!defined('HTTP_NOT_FOUND')) {
    define('HTTP_NOT_FOUND', 404);
}
if (!defined('HTTP_METHOD_NOT_ALLOWED')) {
    define('HTTP_METHOD_NOT_ALLOWED', 405);
}
if (!defined('HTTP_CONFLICT')) {
    define('HTTP_CONFLICT', 409);
}
if (!defined('HTTP_INTERNAL_SERVER_ERROR')) {
    define('HTTP_INTERNAL_SERVER_ERROR', 500);
}
if (!defined('HTTP_SERVICE_UNAVAILABLE')) {
    define('HTTP_SERVICE_UNAVAILABLE', 503);
}

// ==================== PARÁMETROS SQL - USUARIO ====================
if (!defined('PARAM_ID_USUARIO')) {
    define('PARAM_ID_USUARIO', ':id_usuario');
}
if (!defined('PARAM_USERNAME')) {
    define('PARAM_USERNAME', ':username');
}
if (!defined('PARAM_NOMBRE')) {
    define('PARAM_NOMBRE', ':nombre');
}
if (!defined('PARAM_PASSWORD_HASH')) {
    define('PARAM_PASSWORD_HASH', ':password_hash');
}
if (!defined('PARAM_ESTADO')) {
    define('PARAM_ESTADO', ':estado');
}
if (!defined('PARAM_ID_GRUPO_EMPRESARIAL')) {
    define('PARAM_ID_GRUPO_EMPRESARIAL', ':id_grupo_empresarial');
}
if (!defined('PARAM_ID_PERFIL')) {
    define('PARAM_ID_PERFIL', ':id_perfil');
}
if (!defined('PARAM_ID_COMPANIA')) {
    define('PARAM_ID_COMPANIA', ':id_compania');
}
if (!defined('PARAM_ID_USUARIO_EDIT')) {
    define('PARAM_ID_USUARIO_EDIT', ':id_usuario_edit');
}

// ==================== PARÁMETROS SQL - GENÉRICOS ====================
if (!defined('PARAM_ID')) {
    define('PARAM_ID', ':id');
}
if (!defined('PARAM_GRUPO_EMPRESARIAL')) {
    define('PARAM_GRUPO_EMPRESARIAL', ':id_grupo_empresarial');
}
if (!defined('PARAM_CODIGO')) {
    define('PARAM_CODIGO', ':codigo');
}
if (!defined('PARAM_DESCRIPCION')) {
    define('PARAM_DESCRIPCION', ':descripcion');
}
if (!defined('PARAM_TIPO')) {
    define('PARAM_TIPO', ':tipo');
}
if (!defined('PARAM_FECHA_INICIO')) {
    define('PARAM_FECHA_INICIO', ':fecha_inicio');
}
if (!defined('PARAM_FECHA_FIN')) {
    define('PARAM_FECHA_FIN', ':fecha_fin');
}

// ==================== CONSTANTES DE DIRECTORIO ====================
if (!defined('DIR_INFORMES')) {
    define('DIR_INFORMES', __DIR__ . '/../Informes');
}
if (!defined('DIR_UPLOADS')) {
    define('DIR_UPLOADS', __DIR__ . '/../uploads');
}
if (!defined('DIR_LOGS')) {
    define('DIR_LOGS', __DIR__ . '/../logs');
}

// ==================== CONSTANTES DE SEGURIDAD ====================
if (!defined('MAX_UPLOAD_SIZE')) {
    define('MAX_UPLOAD_SIZE', 10485760); // 10MB en bytes
}
if (!defined('ALLOWED_UPLOAD_TYPES')) {
    define('ALLOWED_UPLOAD_TYPES', ['pdf', 'xlsx', 'xls', 'jpg', 'jpeg', 'png']);
}

// ==================== CONSTANTES DE PAGINACIÓN ====================
if (!defined('DEFAULT_PAGE_SIZE')) {
    define('DEFAULT_PAGE_SIZE', 20);
}
if (!defined('MAX_PAGE_SIZE')) {
    define('MAX_PAGE_SIZE', 100);
}
if (!defined('PARAM_ID_CICLO')) {
    define('PARAM_ID_CICLO', ':id_ciclo');
}
if (!defined('PARAM_ID_COMPANIA_LITERAL')) {
    define('PARAM_ID_COMPANIA_LITERAL', ':id_compania');
}
if (!defined('PARAM_ID_USUARIO')) {
    define('PARAM_ID_USUARIO', ':id_usuario');
}
if (!defined('PARAM_ID_MUESTRA')) {
    define('PARAM_ID_MUESTRA', ':id_muestra');
}
if (!defined('PARAM_ID_PERFIL')) {
    define('PARAM_ID_PERFIL', ':id_perfil');
}
if (!defined('PARAM_ID_PISCINA')) {
    define('PARAM_ID_PISCINA', ':id_piscina');
}
if (!defined('WHERE_CLAUSE_ID_MUESTRA')) {
    define('WHERE_CLAUSE_ID_MUESTRA', 'id_muestra = ');
}
if (!defined('WHERE_ID_MUESTRA')) {
    define('WHERE_ID_MUESTRA', 'id_muestra = ' . PARAM_ID_MUESTRA);
}
if (!defined('AND_ID_COMPANIA')) {
    define('AND_ID_COMPANIA', ' AND id_compania = ' . PARAM_ID_COMPANIA_LITERAL);
}
if (!defined('AND_S_ID_COMPANIA')) {
    define('AND_S_ID_COMPANIA', ' AND s.id_compania = ' . PARAM_ID_COMPANIA_LITERAL);
}
if (!defined('WHERE_ID_PISCINA')) {
    define('WHERE_ID_PISCINA', 'id_piscina = ' . PARAM_ID_PISCINA);
}
if (!defined('WHERE_ID_MUESTRA_SIMPLE')) {
    define('WHERE_ID_MUESTRA_SIMPLE', 'cb.id_muestra = ' . PARAM_ID_MUESTRA);
}
if (!defined('WHERE_ID_PERFIL')) {
    define('WHERE_ID_PERFIL', 'id_perfil = ' . PARAM_ID_PERFIL);
}
if (!defined('DATETIME_FORMAT')) {
    define('DATETIME_FORMAT', 'Y-m-d H:i:s');
}

// ==================== ESTADOS COMUNES ====================
if (!defined('STATUS_ACTIVE')) {
    define('STATUS_ACTIVE', 'Activo');
}
if (!defined('STATUS_INACTIVE')) {
    define('STATUS_INACTIVE', 'Inactivo');
}
if (!defined('STATUS_PENDING')) {
    define('STATUS_PENDING', 'Pendiente');
}
if (!defined('STATUS_COMPLETED')) {
    define('STATUS_COMPLETED', 'Completado');
}

// ==================== CONTEXTOS DE ENTRADA ====================
if (!defined('INPUT_STREAM')) {
    define('INPUT_STREAM', 'php://input');
}

// ==================== PREFIJOS DE ERROR ====================
if (!defined('ERROR_DB_PREFIX')) {
    define('ERROR_DB_PREFIX', 'Error en la base de datos: ');
}
if (!defined('ERROR_PREFIX')) {
    define('ERROR_PREFIX', 'Error: ');
}
