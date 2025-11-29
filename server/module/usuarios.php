<?php
// Bootstrap - Incluir todas las dependencias centralizadas
require_once __DIR__ . '/../bootstrap.php';

// Validar conexión a base de datos
RequestValidator::validateDbConnection($conn);

// Determinar el método de la solicitud
$method = $_SERVER['REQUEST_METHOD'];

// Manejo de peticiones GET - Obtener usuarios
if ($method === 'GET') {
    try {
        // Validar parámetro requerido
        $id_usuario = RequestValidator::validateIntegerParam('id_usuario');

        // Consulta para obtener usuarios del mismo grupo empresarial
        $query = "
            SELECT 
                u.id_usuario,
                u.nombre,
                u.username,
                u.estado,
                u.id_grupo_empresarial,
                u.fecha_creacion,
                u.fecha_actualizacion,
                GROUP_CONCAT(DISTINCT p.nombre ORDER BY p.nombre SEPARATOR ', ') as perfiles,
                GROUP_CONCAT(DISTINCT c.nombre ORDER BY c.nombre SEPARATOR ', ') as companias
            FROM usuario u
            LEFT JOIN usuario_perfil up ON u.id_usuario = up.id_usuario
            LEFT JOIN perfil p ON up.id_perfil = p.id_perfil
            LEFT JOIN usuario_compania uc ON u.id_usuario = uc.id_usuario
            LEFT JOIN compania c ON uc.id_compania = c.id_compania
            WHERE u.id_grupo_empresarial = (
                SELECT id_grupo_empresarial 
                FROM usuario 
                WHERE id_usuario = :id_usuario
            )
            GROUP BY u.id_usuario, u.nombre, u.username, u.estado, u.id_grupo_empresarial, u.fecha_creacion, u.fecha_actualizacion
            ORDER BY u.fecha_creacion DESC
        ";

        $qb = new DatabaseQueryBuilder($conn);
        $usuarios = $qb->executeQuery($query, [':id_usuario' => $id_usuario], true);

        ErrorHandler::sendSuccessResponse($usuarios);

    } catch (Exception $e) {
        ErrorHandler::handleException($e);
    }
    exit();
}

// Manejo de peticiones POST - Crear usuario
if ($method === 'POST') {
    try {
        // Validar entrada JSON
        $input = RequestValidator::validateJsonInput();

        // Validar campos requeridos
        RequestValidator::validateJsonFields($input, ['nombre', 'username', 'password', 'estado', 'perfiles', 'id_usuario']);

        $id_usuario = intval($input['id_usuario']);
        $nombre = trim($input['nombre']);
        $username = trim($input['username']);
        $password = trim($input['password']);
        $estado = trim($input['estado']);
        $perfiles = $input['perfiles'];
        $companias = isset($input['companias']) && is_array($input['companias']) ? $input['companias'] : [];

        // Validar perfiles
        if (!is_array($perfiles) || count($perfiles) === 0) {
            ErrorHandler::handleValidationError('Al menos un perfil es requerido');
            exit();
        }

        // Validar compañías para no superadmins
        $isSuperadmin = isset($input['idGrupoEmpresarial']) && !empty($input['idGrupoEmpresarial']);
        if (empty($companias) && !$isSuperadmin) {
            ErrorHandler::handleValidationError('Al menos una compañía es requerida');
            exit();
        }

        $qb = new DatabaseQueryBuilder($conn);

        // Obtener el id_grupo_empresarial
        if (isset($input['idGrupoEmpresarial']) && !empty($input['idGrupoEmpresarial'])) {
            $id_grupo_empresarial = intval($input['idGrupoEmpresarial']);
            
            // Validar que el grupo empresarial existe
            $grupoExists = $qb->countRecords('grupo_empresarial', 'id_grupo_empresarial = :id_grupo', [':id_grupo' => $id_grupo_empresarial]);
            if ($grupoExists === 0) {
                ErrorHandler::handleValidationError('Grupo empresarial inválido');
                exit();
            }
        } else {
            // Obtener el del usuario autenticado
            $id_grupo_empresarial = $qb->getUserGroupId($id_usuario);
            if ($id_grupo_empresarial === null) {
                ErrorHandler::handleValidationError('No se pudo obtener el grupo empresarial del usuario');
                exit();
            }
        }

        // Validar que el username no exista
        $usernameExists = $qb->countRecords('usuario', 'username = :username', [':username' => $username]);
        if ($usernameExists > 0) {
            ErrorHandler::handleValidationError('El Usuario (username) ya existe en el sistema');
            exit();
        }

        // Hashear la contraseña
        $password_hash = password_hash($password, PASSWORD_BCRYPT);

        // Insertar nuevo usuario
        $new_id = $qb->insertRecord('usuario', [
            'nombre' => $nombre,
            'username' => $username,
            'password_hash' => $password_hash,
            'estado' => $estado,
            'id_grupo_empresarial' => $id_grupo_empresarial,
            'fecha_creacion' => date('Y-m-d H:i:s'),
            'fecha_actualizacion' => date('Y-m-d H:i:s')
        ]);

        // Insertar relaciones usuario-perfil
        foreach ($perfiles as $id_perfil) {
            $qb->insertRecord('usuario_perfil', [
                'id_usuario' => $new_id,
                'id_perfil' => intval($id_perfil)
            ]);
        }

        // Insertar relaciones usuario-compañía
        foreach ($companias as $id_compania) {
            $qb->insertRecord('usuario_compania', [
                'id_usuario' => $new_id,
                'id_compania' => intval($id_compania)
            ]);
        }

        // Obtener datos del usuario creado
        $perfilesNombres = $qb->getRecords('perfil', 'nombre', 
            'id_perfil IN (SELECT id_perfil FROM usuario_perfil WHERE id_usuario = :id_usuario)',
            [':id_usuario' => $new_id]);
        $perfilesArray = array_column($perfilesNombres, 'nombre');

        $companiasNombres = $qb->getRecords('compania', 'nombre',
            'id_compania IN (SELECT id_compania FROM usuario_compania WHERE id_usuario = :id_usuario)',
            [':id_usuario' => $new_id]);
        $companiasArray = array_column($companiasNombres, 'nombre');

        $usuarioCreado = [
            'id_usuario' => $new_id,
            'nombre' => $nombre,
            'username' => $username,
            'estado' => $estado,
            'perfiles' => implode(', ', $perfilesArray),
            'companias' => implode(', ', $companiasArray),
            'id_grupo_empresarial' => $id_grupo_empresarial
        ];

        ErrorHandler::sendCreatedResponse($usuarioCreado);

    } catch (Exception $e) {
        if ($e->getCode() == '23000') {
            ErrorHandler::handleValidationError('El Usuario (username) ya existe en el sistema');
        } else {
            ErrorHandler::handleException($e);
        }
    }
    exit();
}

// Manejo de peticiones PUT - Actualizar usuario
if ($method === 'PUT') {
    try {
        // Validar entrada JSON
        $input = RequestValidator::validateJsonInput();

        // Validar campos requeridos
        RequestValidator::validateJsonFields($input, ['nombre', 'perfiles', 'companias', 'estado', 'id_usuario_edit', 'id_usuario']);

        $id_usuario_edit = intval($input['id_usuario_edit']);
        $id_usuario_autenticado = intval($input['id_usuario']);
        $nombre = trim($input['nombre']);
        $estado = trim($input['estado']);
        $perfiles = $input['perfiles'];
        $companias = $input['companias'];

        // Validar perfiles
        if (!is_array($perfiles) || count($perfiles) === 0) {
            ErrorHandler::handleValidationError('Al menos un perfil es requerido');
            exit();
        }

        // Validar compañías
        if (!is_array($companias)) {
            ErrorHandler::handleValidationError('Compañías debe ser un array');
            exit();
        }

        $qb = new DatabaseQueryBuilder($conn);

        // Procesar contraseña solo si se proporciona
        $updateData = [
            'nombre' => $nombre,
            'estado' => $estado,
            'fecha_actualizacion' => date('Y-m-d H:i:s')
        ];

        if (isset($input['password']) && !empty(trim($input['password']))) {
            $updateData['password_hash'] = password_hash(trim($input['password']), PASSWORD_BCRYPT);
        }

        // Actualizar datos del usuario
        $qb->updateRecord('usuario', $updateData, 'id_usuario = :id_usuario_edit', [':id_usuario_edit' => $id_usuario_edit]);

        // Eliminar perfiles antiguos e insertar nuevos
        $qb->deleteRecord('usuario_perfil', 'id_usuario = :id_usuario', [':id_usuario' => $id_usuario_edit]);
        foreach ($perfiles as $id_perfil) {
            $qb->insertRecord('usuario_perfil', [
                'id_usuario' => $id_usuario_edit,
                'id_perfil' => intval($id_perfil)
            ]);
        }

        // Eliminar compañías antiguas e insertar nuevas
        $qb->deleteRecord('usuario_compania', 'id_usuario = :id_usuario', [':id_usuario' => $id_usuario_edit]);
        foreach ($companias as $id_compania) {
            $qb->insertRecord('usuario_compania', [
                'id_usuario' => $id_usuario_edit,
                'id_compania' => intval($id_compania)
            ]);
        }

        // Obtener datos actualizados
        $perfilesNombres = $qb->getRecords('perfil', 'nombre',
            'id_perfil IN (SELECT id_perfil FROM usuario_perfil WHERE id_usuario = :id_usuario)',
            [':id_usuario' => $id_usuario_edit]);
        $perfilesArray = array_column($perfilesNombres, 'nombre');

        $companiasNombres = $qb->getRecords('compania', 'nombre',
            'id_compania IN (SELECT id_compania FROM usuario_compania WHERE id_usuario = :id_usuario)',
            [':id_usuario' => $id_usuario_edit]);
        $companiasArray = array_column($companiasNombres, 'nombre');

        $usuarioActualizado = [
            'id_usuario' => $id_usuario_edit,
            'nombre' => $nombre,
            'estado' => $estado,
            'perfiles' => implode(', ', $perfilesArray),
            'companias' => implode(', ', $companiasArray)
        ];

        ErrorHandler::sendUpdatedResponse($usuarioActualizado);

    } catch (Exception $e) {
        ErrorHandler::handleException($e);
    }
    exit();
}

// Método no permitido
ErrorHandler::sendErrorResponse('Método no permitido', HTTP_METHOD_NOT_ALLOWED);
exit();