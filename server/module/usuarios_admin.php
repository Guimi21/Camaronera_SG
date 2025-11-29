<?php
// Bootstrap - Incluir todas las dependencias centralizadas
require_once __DIR__ . '/../bootstrap.php';

// Validar conexión a base de datos
RequestValidator::validateDbConnection($conn);

$method = $_SERVER['REQUEST_METHOD'];
$qb = new DatabaseQueryBuilder($conn);

try {
    // Solo GET permitido - obtener usuarios administradores
    if ($method !== 'GET') {
        ErrorHandler::sendErrorResponse('Método no permitido', HTTP_METHOD_NOT_ALLOWED);
        exit();
    }

    // Parámetro id_usuario requerido
    $id_usuario = RequestValidator::getParamWithDefault('id_usuario', null, 'GET');
    
    if (!$id_usuario) {
        ErrorHandler::handleValidationError('ID de usuario requerido');
        exit();
    }

    // Obtener usuarios con perfil "Administrador"
    $query = "SELECT 
        u.id_usuario,
        u.nombre,
        u.username,
        u.estado,
        u.fecha_creacion,
        u.fecha_actualizacion,
        GROUP_CONCAT(DISTINCT p.nombre SEPARATOR ', ') as perfiles,
        ge.nombre as grupo_empresarial
    FROM usuario u
    LEFT JOIN usuario_perfil up ON u.id_usuario = up.id_usuario
    LEFT JOIN perfil p ON up.id_perfil = p.id_perfil
    LEFT JOIN grupo_empresarial ge ON u.id_grupo_empresarial = ge.id_grupo_empresarial
    WHERE p.nombre = 'Administrador'
    GROUP BY u.id_usuario
    ORDER BY u.fecha_actualizacion DESC";

    $usuarios = $qb->executeQuery($query, [], true);
    ErrorHandler::sendSuccessResponse($usuarios);
    exit();

} catch (Exception $e) {
    ErrorHandler::handleException($e);
}