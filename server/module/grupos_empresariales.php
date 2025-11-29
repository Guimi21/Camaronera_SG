<?php
// Bootstrap - Incluir todas las dependencias centralizadas
require_once __DIR__ . '/../bootstrap.php';

// Validar conexión a base de datos
RequestValidator::validateDbConnection($conn);

$method = $_SERVER['REQUEST_METHOD'];
$qb = new DatabaseQueryBuilder($conn);

try {
    if ($method === 'GET') {
        // Obtener todos los grupos empresariales
        $query = "SELECT
            id_grupo_empresarial, nombre, descripcion, estado, fecha_creacion, fecha_actualizacion
        FROM grupo_empresarial
        ORDER BY fecha_actualizacion DESC";

        $grupos = $qb->executeQuery($query, [], true);
        ErrorHandler::sendSuccessResponse($grupos);

    } elseif ($method === 'POST') {
        // Crear nuevo grupo empresarial
        $input = RequestValidator::validateJsonInput();

        if (!isset($input['nombre']) || empty(trim($input['nombre']))) {
            ErrorHandler::handleValidationError('El nombre del grupo empresarial es obligatorio');
            exit();
        }

        $nombre = trim($input['nombre']);
        $descripcion = isset($input['descripcion']) && !empty(trim($input['descripcion'])) ? trim($input['descripcion']) : null;
        $estado = isset($input['estado']) && !empty(trim($input['estado'])) ? trim($input['estado']) : 'ACTIVO';

        // Verificar si ya existe un grupo con el mismo nombre
        $count = $qb->countRecords('grupo_empresarial', 'nombre = :nombre', [':nombre' => $nombre]);
        if ($count > 0) {
            ErrorHandler::handleValidationError('Ya existe un grupo empresarial con el nombre: ' . htmlspecialchars($nombre), HTTP_BAD_REQUEST);
            exit();
        }

        // Insertar nuevo grupo empresarial
        $id_grupo = $qb->insertRecord('grupo_empresarial', [
            'nombre' => $nombre,
            'descripcion' => $descripcion,
            'estado' => $estado,
            'fecha_creacion' => date('Y-m-d H:i:s'),
            'fecha_actualizacion' => date('Y-m-d H:i:s')
        ]);

        ErrorHandler::sendCreatedResponse(['id' => $id_grupo, 'estado' => $estado]);

    } else {
        ErrorHandler::sendErrorResponse('Método no permitido', HTTP_METHOD_NOT_ALLOWED);
    }

    exit();

} catch (Exception $e) {
    ErrorHandler::handleException($e);
}
