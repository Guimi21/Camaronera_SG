<?php
// Bootstrap - Incluir todas las dependencias centralizadas
require_once __DIR__ . '/../bootstrap.php';

// Validar conexión a base de datos
RequestValidator::validateDbConnection($conn);

$method = $_SERVER['REQUEST_METHOD'];
$qb = new DatabaseQueryBuilder($conn);

try {
    // GET - Obtener módulos
    if ($method === 'GET') {
        $id_modulo = RequestValidator::getParamWithDefault('id_modulo', null, 'GET');

        if ($id_modulo) {
            $id_modulo = (int)$id_modulo;
            // Obtener módulo específico
            $query = "SELECT id_modulo, nombre, descripcion, estado, fecha_creacion, fecha_actualizacion
                      FROM modulo WHERE id_modulo = :id_modulo";
            $modulos = $qb->executeQuery($query, [':id_modulo' => $id_modulo], true);
        } else {
            // Obtener todos los módulos
            $query = "SELECT id_modulo, nombre, descripcion, estado, fecha_creacion, fecha_actualizacion
                      FROM modulo ORDER BY fecha_actualizacion DESC";
            $modulos = $qb->executeQuery($query, [], true);
        }

        ErrorHandler::sendSuccessResponse($modulos);

    // POST - Crear nuevo módulo
    } elseif ($method === 'POST') {
        $input = RequestValidator::validateJsonInput();
        
        $nombre = isset($input['nombre']) ? trim($input['nombre']) : null;
        if (!$nombre) {
            ErrorHandler::handleValidationError('El nombre del módulo es requerido');
            exit();
        }

        $descripcion = isset($input['descripcion']) ? trim($input['descripcion']) : null;
        $estado = isset($input['estado']) && !empty(trim($input['estado'])) ? trim($input['estado']) : 'ACTIVO';

        $newModuloId = $qb->insertRecord('modulo', [
            'nombre' => $nombre,
            'descripcion' => $descripcion,
            'estado' => $estado,
            'fecha_creacion' => date('Y-m-d H:i:s'),
            'fecha_actualizacion' => date('Y-m-d H:i:s')
        ]);

        $data = [
            'id_modulo' => $newModuloId,
            'nombre' => $nombre,
            'descripcion' => $descripcion,
            'estado' => $estado
        ];

        ErrorHandler::sendCreatedResponse($data);

    // PUT - Actualizar módulo
    } elseif ($method === 'PUT') {
        $input = RequestValidator::validateJsonInput();
        RequestValidator::validateJsonFields($input, ['id_modulo', 'nombre']);

        $id_modulo = (int)$input['id_modulo'];
        $nombre = trim($input['nombre']);
        $descripcion = isset($input['descripcion']) ? trim($input['descripcion']) : null;
        $estado = isset($input['estado']) && !empty(trim($input['estado'])) ? trim($input['estado']) : 'ACTIVO';

        $qb->updateRecord('modulo', [
            'nombre' => $nombre,
            'descripcion' => $descripcion,
            'estado' => $estado,
            'fecha_actualizacion' => date('Y-m-d H:i:s')
        ], 'id_modulo = :id_modulo', [':id_modulo' => $id_modulo]);

        ErrorHandler::sendUpdatedResponse();

    } else {
        ErrorHandler::sendErrorResponse('Método no permitido', HTTP_METHOD_NOT_ALLOWED);
    }

    exit();

} catch (Exception $e) {
    ErrorHandler::handleException($e);
}
echo json_encode([
    RESPONSE_SUCCESS => false,
    RESPONSE_MESSAGE => 'Método no permitido'
]);