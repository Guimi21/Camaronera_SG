<?php
// Bootstrap - Incluir todas las dependencias centralizadas
require_once __DIR__ . '/../bootstrap.php';

// Validar conexión a base de datos
RequestValidator::validateDbConnection($conn);

// Determinar el método de la solicitud
$method = $_SERVER['REQUEST_METHOD'];

$qb = new DatabaseQueryBuilder($conn);

try {
    // GET - Obtener compañías
    if ($method === 'GET') {
        $id_usuario = RequestValidator::validateIntegerParam('id_usuario');

        $query = "SELECT
                    c.id_compania,
                    c.nombre,
                    c.direccion,
                    c.telefono,
                    c.estado,
                    c.fecha_creacion,
                    c.fecha_actualizacion,
                    COALESCE(ge.nombre, 'Sin grupo') as grupo_empresarial
                FROM compania c
                LEFT JOIN grupo_empresarial ge ON c.id_grupo_empresarial = ge.id_grupo_empresarial
                WHERE c.id_grupo_empresarial = (
                    SELECT id_grupo_empresarial FROM usuario WHERE id_usuario = " . PARAM_ID_USUARIO . "
                )
                ORDER BY c.id_compania ASC";

        $companias = $qb->executeQuery($query, [PARAM_ID_USUARIO => $id_usuario], true);

        ErrorHandler::sendSuccessResponse($companias, SUCCESS_DATA_RETRIEVED);

    } elseif ($method === 'POST') {
        // POST - Crear compañía
        $input = RequestValidator::validateJsonInput();
        RequestValidator::validateJsonFields($input, ['nombre', 'estado', 'id_usuario']);

        $id_usuario = intval($input['id_usuario']);
        $nombre = trim($input['nombre']);
        $estado = $input['estado'];
        $direccion = isset($input['direccion']) && !empty(trim($input['direccion'])) ? trim($input['direccion']) : null;
        $telefono = isset($input['telefono']) && !empty(trim($input['telefono'])) ? trim($input['telefono']) : null;

        // Obtener grupo empresarial del usuario
        $id_grupo_empresarial = $qb->getUserGroupId($id_usuario);
        if ($id_grupo_empresarial === null) {
            ErrorHandler::handleValidationError('No se pudo obtener el grupo empresarial del usuario');
            exit();
        }

        // Verificar que no exista compañía con el mismo nombre
        $count = $qb->countRecords('compania',
            'nombre = :nombre AND id_grupo_empresarial = :id_grupo',
            [':nombre' => $nombre, ':id_grupo' => $id_grupo_empresarial]);

        if ($count > 0) {
            ErrorHandler::handleValidationError('Ya existe una compañía con este nombre para este grupo empresarial');
            exit();
        }

        // Insertar compañía
        $id_compania = $qb->insertRecord('compania', [
            'nombre' => $nombre,
            'direccion' => $direccion,
            'telefono' => $telefono,
            'estado' => $estado,
            'id_grupo_empresarial' => $id_grupo_empresarial,
            'fecha_creacion' => date(DATETIME_FORMAT),
            'fecha_actualizacion' => date(DATETIME_FORMAT)
        ]);

        $data = [
            'id_compania' => $id_compania,
            'nombre' => $nombre,
            'direccion' => $direccion,
            'telefono' => $telefono,
            'estado' => $estado,
            'id_grupo_empresarial' => $id_grupo_empresarial
        ];

        ErrorHandler::sendCreatedResponse($data);

    } elseif ($method === 'PUT') {
        // PUT - Actualizar compañía
        $input = RequestValidator::validateJsonInput();
        RequestValidator::validateJsonFields($input, ['id_compania', 'nombre', 'estado', 'id_usuario']);

        $id_compania = intval($input['id_compania']);
        $id_usuario = intval($input['id_usuario']);
        $nombre = trim($input['nombre']);
        $estado = $input['estado'];
        $direccion = isset($input['direccion']) && !empty(trim($input['direccion'])) ? trim($input['direccion']) : null;
        $telefono = isset($input['telefono']) && !empty(trim($input['telefono'])) ? trim($input['telefono']) : null;

        // Verificar que la compañía pertenece al mismo grupo empresarial
        $query = "SELECT c.id_compania FROM compania c
                  WHERE c.id_compania = " . PARAM_ID_COMPANIA_LITERAL . "
                  AND c.id_grupo_empresarial = (
                    SELECT id_grupo_empresarial FROM usuario WHERE id_usuario = " . PARAM_ID_USUARIO . "
                  )";

        $result = $qb->executeQuery($query, [PARAM_ID_COMPANIA_LITERAL => $id_compania, PARAM_ID_USUARIO => $id_usuario], false);

        if (!$result) {
            ErrorHandler::sendErrorResponse('No tiene permiso para editar esta compañía', HTTP_FORBIDDEN);
            exit();
        }

        // Verificar que no exista otra compañía con el mismo nombre
        $count = $qb->countRecords('compania',
            'nombre = :nombre AND id_grupo_empresarial = (SELECT id_grupo_empresarial FROM usuario WHERE id_usuario = ' . PARAM_ID_USUARIO . ') AND id_compania != ' . PARAM_ID_COMPANIA_LITERAL,
            [':nombre' => $nombre, PARAM_ID_USUARIO => $id_usuario, PARAM_ID_COMPANIA_LITERAL => $id_compania]);

        if ($count > 0) {
            ErrorHandler::handleValidationError('Ya existe una compañía con este nombre para este grupo empresarial');
            exit();
        }

        // Actualizar compañía
        $qb->updateRecord('compania', [
            'nombre' => $nombre,
            'direccion' => $direccion,
            'telefono' => $telefono,
            'estado' => $estado,
            'fecha_actualizacion' => date(DATETIME_FORMAT)
        ], 'id_compania = ' . PARAM_ID_COMPANIA_LITERAL, [PARAM_ID_COMPANIA_LITERAL => $id_compania]);

        $data = [
            'id_compania' => $id_compania,
            'nombre' => $nombre,
            'direccion' => $direccion,
            'telefono' => $telefono,
            'estado' => $estado
        ];

        ErrorHandler::sendUpdatedResponse($data);

    } else {
        ErrorHandler::sendErrorResponse('Método no permitido', HTTP_METHOD_NOT_ALLOWED);
    }

} catch (Exception $e) {
    ErrorHandler::handleException($e);
}
