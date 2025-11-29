<?php
// Bootstrap - Incluir todas las dependencias centralizadas
require_once __DIR__ . '/../bootstrap.php';

// Validar conexión a base de datos
RequestValidator::validateDbConnection($conn);

$method = $_SERVER['REQUEST_METHOD'];
$qb = new DatabaseQueryBuilder($conn);

try {
    if ($method === 'GET') {
        // Obtener menús
        $id_menu = RequestValidator::getParamWithDefault('id_menu', null, 'GET');

        if ($id_menu) {
            $id_menu = (int)$id_menu;
            // Obtener menú específico con su módulo
            $query = "SELECT
                m.id_menu, m.id_modulo, mo.nombre as nombre_modulo,
                m.nombre, m.ruta, m.icono, m.estado,
                m.fecha_creacion, m.fecha_actualizacion
            FROM menu m
            LEFT JOIN modulo mo ON m.id_modulo = mo.id_modulo
            WHERE m.id_menu = :id_menu";

            $menus = $qb->executeQuery($query, [':id_menu' => $id_menu], true);
        } else {
            // Obtener todos los menús
            $query = "SELECT
                m.id_menu, m.id_modulo, mo.nombre as nombre_modulo,
                m.nombre, m.ruta, m.icono, m.estado,
                m.fecha_creacion, m.fecha_actualizacion
            FROM menu m
            LEFT JOIN modulo mo ON m.id_modulo = mo.id_modulo
            ORDER BY m.fecha_actualizacion DESC";

            $menus = $qb->executeQuery($query, [], true);
        }

        ErrorHandler::sendSuccessResponse($menus);

    } elseif ($method === 'POST') {
        // Crear nuevo menú
        $input = RequestValidator::validateJsonInput();

        $nombre = isset($input['nombre']) ? trim($input['nombre']) : null;
        if (!$nombre) {
            ErrorHandler::handleValidationError('El nombre del menú es requerido');
            exit();
        }

        $id_modulo = isset($input['id_modulo']) ? (int)$input['id_modulo'] : null;
        $ruta = isset($input['ruta']) ? trim($input['ruta']) : null;
        $icono = isset($input['icono']) ? trim($input['icono']) : null;
        $estado = isset($input['estado']) ? trim($input['estado']) : 'ACTIVO';

        $newMenuId = $qb->insertRecord('menu', [
            'id_modulo' => $id_modulo,
            'nombre' => $nombre,
            'ruta' => $ruta,
            'icono' => $icono,
            'estado' => $estado,
            'fecha_creacion' => date(DATETIME_FORMAT),
            'fecha_actualizacion' => date(DATETIME_FORMAT)
        ]);

        $data = [
            'id_menu' => $newMenuId,
            'id_modulo' => $id_modulo,
            'nombre' => $nombre,
            'ruta' => $ruta,
            'icono' => $icono,
            'estado' => $estado
        ];

        ErrorHandler::sendCreatedResponse($data);

    } elseif ($method === 'PUT') {
        // Actualizar menú
        $input = RequestValidator::validateJsonInput();
        RequestValidator::validateJsonFields($input, ['id_menu', 'nombre']);

        $id_menu = (int)$input['id_menu'];
        $nombre = trim($input['nombre']);
        $id_modulo = isset($input['id_modulo']) ? (int)$input['id_modulo'] : null;
        $ruta = isset($input['ruta']) ? trim($input['ruta']) : null;
        $icono = isset($input['icono']) ? trim($input['icono']) : null;
        $estado = isset($input['estado']) ? trim($input['estado']) : 'ACTIVO';

        $qb->updateRecord('menu', [
            'id_modulo' => $id_modulo,
            'nombre' => $nombre,
            'ruta' => $ruta,
            'icono' => $icono,
            'estado' => $estado,
            'fecha_actualizacion' => date(DATETIME_FORMAT)
        ], 'id_menu = :id_menu', [':id_menu' => $id_menu]);

        ErrorHandler::sendUpdatedResponse();

    } else {
        ErrorHandler::sendErrorResponse('Método no permitido', HTTP_METHOD_NOT_ALLOWED);
    }

    exit();

} catch (Exception $e) {
    ErrorHandler::handleException($e);
}
