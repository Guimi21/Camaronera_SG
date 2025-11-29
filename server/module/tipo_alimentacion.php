<?php
// Bootstrap - Incluir todas las dependencias centralizadas
require_once __DIR__ . '/../bootstrap.php';

// Validar conexión a base de datos
RequestValidator::validateDbConnection($conn);

$method = $_SERVER['REQUEST_METHOD'];
$qb = new DatabaseQueryBuilder($conn);

try {
    if ($method === 'GET') {
        // Obtener tipos de alimentación de una compañía
        $id_compania = RequestValidator::getRequiredParamInt('id_compania', 'GET');

        $query = "SELECT 
            id_tipo_alimentacion, nombre, id_compania, estado, fecha_creacion, fecha_actualizacion
        FROM tipo_alimentacion
        WHERE id_compania = :id_compania
        ORDER BY id_tipo_alimentacion DESC";

        $tipos = $qb->executeQuery($query, [':id_compania' => $id_compania], true);
        ErrorHandler::sendSuccessResponse($tipos);

    } elseif ($method === 'POST') {
        // Crear nuevo tipo de alimentación
        $input = RequestValidator::validateJsonInput();
        RequestValidator::validateJsonFields($input, ['nombre', 'id_compania']);

        $nombre = trim($input['nombre']);
        $id_compania = (int)$input['id_compania'];
        $estado = isset($input['estado']) ? trim($input['estado']) : 'ACTIVO';

        // Verificar si ya existe
        $count = $qb->countRecords('tipo_alimentacion', 
            'nombre = :nombre AND id_compania = :id_compania', 
            [':nombre' => $nombre, ':id_compania' => $id_compania]
        );
        
        if ($count > 0) {
            ErrorHandler::handleValidationError('Ya existe un tipo de alimentación con ese nombre en esta compañía', HTTP_CONFLICT);
            exit();
        }

        $id = $qb->insertRecord('tipo_alimentacion', [
            'nombre' => $nombre,
            'id_compania' => $id_compania,
            'estado' => $estado,
            'fecha_creacion' => date('Y-m-d H:i:s'),
            'fecha_actualizacion' => date('Y-m-d H:i:s')
        ]);

        ErrorHandler::sendCreatedResponse(['id_tipo_alimentacion' => $id]);

    } elseif ($method === 'PUT') {
        // Actualizar tipo de alimentación
        $input = RequestValidator::validateJsonInput();
        RequestValidator::validateJsonFields($input, ['id_tipo_alimentacion']);

        $id = (int)$input['id_tipo_alimentacion'];
        $updates = [];
        $params = [':id' => $id];

        if (isset($input['nombre']) && !empty(trim($input['nombre']))) {
            $updates[] = 'nombre = :nombre';
            $params[':nombre'] = trim($input['nombre']);
        }

        if (isset($input['estado']) && !empty(trim($input['estado']))) {
            $updates[] = 'estado = :estado';
            $params[':estado'] = trim($input['estado']);
        }

        if (empty($updates)) {
            ErrorHandler::handleValidationError('No hay campos para actualizar');
            exit();
        }

        $updates[] = 'fecha_actualizacion = :fecha_actualizacion';
        $params[':fecha_actualizacion'] = date('Y-m-d H:i:s');

        $query = "UPDATE tipo_alimentacion SET " . implode(', ', $updates) . " WHERE id_tipo_alimentacion = :id";
        $qb->executeQuery($query, $params, false);

        ErrorHandler::sendUpdatedResponse();

    } elseif ($method === 'DELETE') {
        // Eliminar tipo de alimentación
        $input = RequestValidator::validateJsonInput();
        
        if (!isset($input['id_tipo_alimentacion'])) {
            ErrorHandler::handleValidationError('ID de tipo de alimentación requerido');
            exit();
        }

        $id = (int)$input['id_tipo_alimentacion'];
        $qb->deleteRecord('tipo_alimentacion', 'id_tipo_alimentacion = :id', [':id' => $id]);

        ErrorHandler::sendDeletedResponse();

    } else {
        ErrorHandler::sendErrorResponse('Método no permitido', HTTP_METHOD_NOT_ALLOWED);
    }

    exit();

} catch (Exception $e) {
    ErrorHandler::handleException($e);
}