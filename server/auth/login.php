<?php
// Bootstrap - Incluir todas las dependencias centralizadas
require_once __DIR__ . '/../bootstrap.php';

// Validar conexión a base de datos
RequestValidator::validateDbConnection($conn);

try {
    // Validar entrada JSON
    $input = RequestValidator::validateJsonInput();

    // Validar campos requeridos
    RequestValidator::validateJsonFields($input, ['username', 'password']);

    $username = trim($input['username']);
    $password = trim($input['password']);

    // Verificar si las credenciales son correctas
    $query = "SELECT u.id_usuario, u.nombre, u.username, u.password_hash, u.id_grupo_empresarial
              FROM usuario u
              WHERE u.username = :username";

    $qb = new DatabaseQueryBuilder($conn);
    $users = $qb->executeQuery($query, [':username' => $username], true);

    // Si no se encuentra el usuario
    if (empty($users)) {
        ErrorHandler::handleValidationError('Credenciales incorrectas', HTTP_UNAUTHORIZED);
        exit();
    }

    $user = $users[0];

    // Verificar la contraseña usando password_verify()
    if (!password_verify($password, $user['password_hash'])) {
        ErrorHandler::handleValidationError('Credenciales incorrectas', HTTP_UNAUTHORIZED);
        exit();
    }

    // Obtener el grupo empresarial
    $grupo_empresarial_nombre = null;
    if ($user['id_grupo_empresarial']) {
        $query_grupo = "SELECT nombre FROM grupo_empresarial WHERE id_grupo_empresarial = :id_grupo";
        $grupos = $qb->executeQuery($query_grupo, [':id_grupo' => $user['id_grupo_empresarial']], true);
        $grupo_empresarial_nombre = $grupos[0]['nombre'] ?? null;
    }

    // Obtener los perfiles asociados al usuario
    $query_perfiles = "
        SELECT p.id_perfil, p.nombre
        FROM perfil p
        JOIN usuario_perfil up ON p.id_perfil = up.id_perfil
        WHERE up.id_usuario = :userId
        ORDER BY p.nombre
    ";
    $perfiles = $qb->executeQuery($query_perfiles, [':userId' => $user['id_usuario']], true);

    // Obtener todas las compañías asociadas al usuario
    $query_companias = "
        SELECT c.id_compania, c.nombre
        FROM compania c
        JOIN usuario_compania uc ON c.id_compania = uc.id_compania
        WHERE uc.id_usuario = :userId
        ORDER BY c.nombre
    ";
    $companias = $qb->executeQuery($query_companias, [':userId' => $user['id_usuario']], true);

    // Obtener los menús asociados al perfil del usuario
    $query_menus = "
        SELECT DISTINCT m.id_menu, m.nombre, m.ruta, m.icono, m.estado, modu.nombre AS modulo
        FROM menu m
        JOIN modulo modu ON m.id_modulo = modu.id_modulo
        JOIN menu_perfil mp ON m.id_menu = mp.id_menu
        WHERE m.estado = 'ACTIVO'
        AND mp.id_perfil IN (
            SELECT id_perfil FROM usuario_perfil WHERE id_usuario = :userId
        )
        ORDER BY modu.nombre, m.nombre
    ";
    $menus = $qb->executeQuery($query_menus, [':userId' => $user['id_usuario']], true);

    // Respuesta con los datos del usuario, el grupo empresarial, la compañía, los perfiles y los menús
    $response = [
        'id_usuario' => intval($user['id_usuario']),
        'nombre' => $user['nombre'],
        'usuario' => $user['username'],
        'perfiles' => $perfiles,
        'grupo_empresarial' => $grupo_empresarial_nombre,
        'companias' => $companias,
        'compania' => $companias[0]['nombre'] ?? null,
        'id_compania' => !empty($companias) ? intval($companias[0]['id_compania']) : null,
        'menus' => $menus
    ];

    ErrorHandler::sendSuccessResponse($response);

} catch (Exception $e) {
    ErrorHandler::handleException($e);
}
