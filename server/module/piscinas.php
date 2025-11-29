<?php
// Bootstrap - Incluir todas las dependencias centralizadas
require_once __DIR__ . '/../bootstrap.php';

// Validar conexión a base de datos
RequestValidator::validateDbConnection($conn);

$method = $_SERVER['REQUEST_METHOD'];
$qb = new DatabaseQueryBuilder($conn);

try {
    // GET - Obtener piscinas
    if ($method === 'GET') {
        $id_compania = RequestValidator::validateIntegerParam('id_compania');
        
        $sql = "SELECT 
                    p.id_piscina,
                    p.codigo,
                    p.hectareas,
                    p.ubicacion,
                    p.estado,
                    p.id_compania,
                    p.fecha_creacion,
                    p.fecha_actualizacion
                FROM piscina p
                WHERE p.id_compania = :id_compania
                ORDER BY p.id_piscina";

        $records = $qb->executeQuery($sql, [':id_compania' => $id_compania], true);
        
        // Formatear datos
        $piscinas = array_map(function($row) {
            return [
                'id_piscina' => $row['id_piscina'],
                'codigo' => $row['codigo'],
                'hectareas' => floatval($row['hectareas']),
                'ubicacion' => $row['ubicacion'],
                'estado' => $row['estado'],
                'id_compania' => $row['id_compania'],
                'fecha_creacion' => $row['fecha_creacion'],
                'fecha_actualizacion' => $row['fecha_actualizacion']
            ];
        }, $records);
        
        ErrorHandler::sendSuccessResponseWithTotal($piscinas, count($piscinas));
        
    // POST - Crear piscina
    } elseif ($method === 'POST') {
        $input = RequestValidator::validateJsonInput();
        
        $requiredFields = ['codigo', 'hectareas', 'ubicacion', 'id_compania', 'id_usuario_crea', 'id_usuario_actualiza'];
        RequestValidator::validateJsonFields($input, $requiredFields);
        
        // Validar que el código no exista
        $count = $qb->countRecords('piscina',
            'codigo = :codigo AND id_compania = :id_compania',
            [':codigo' => $input['codigo'], ':id_compania' => $input['id_compania']]);
        
        if ($count > 0) {
            ErrorHandler::handleValidationError('Ya existe una piscina con este código en la compañía');
            exit();
        }
        
        $estado = isset($input['estado']) && !empty(trim($input['estado'])) ? trim($input['estado']) : 'ACTIVA';
        
        $id_piscina = $qb->insertRecord('piscina', [
            'codigo' => $input['codigo'],
            'hectareas' => $input['hectareas'],
            'ubicacion' => $input['ubicacion'],
            'estado' => $estado,
            'id_compania' => intval($input['id_compania']),
            'id_usuario_crea' => intval($input['id_usuario_crea']),
            'id_usuario_actualiza' => intval($input['id_usuario_actualiza']),
            'fecha_creacion' => date('Y-m-d H:i:s'),
            'fecha_actualizacion' => date('Y-m-d H:i:s')
        ]);
        
        ErrorHandler::sendCreatedResponse(['id_piscina' => $id_piscina]);
        
    // PUT - Actualizar piscina
    } elseif ($method === 'PUT') {
        $input = RequestValidator::validateJsonInput();
        
        $requiredFields = ['id_piscina', 'codigo', 'hectareas', 'ubicacion', 'id_compania'];
        RequestValidator::validateJsonFields($input, $requiredFields);
        
        $id_piscina = intval($input['id_piscina']);
        $id_compania = intval($input['id_compania']);
        
        // Validar que el código no exista en otra piscina
        $count = $qb->countRecords('piscina',
            'codigo = :codigo AND id_compania = :id_compania AND id_piscina != :id_piscina',
            [':codigo' => $input['codigo'], ':id_compania' => $id_compania, ':id_piscina' => $id_piscina]);
        
        if ($count > 0) {
            ErrorHandler::handleValidationError('Ya existe otra piscina con este código en la compañía');
            exit();
        }
        
        $estado = isset($input['estado']) && !empty(trim($input['estado'])) ? trim($input['estado']) : 'ACTIVA';
        
        $qb->updateRecord('piscina', [
            'codigo' => $input['codigo'],
            'hectareas' => $input['hectareas'],
            'ubicacion' => $input['ubicacion'],
            'estado' => $estado,
            'fecha_actualizacion' => date('Y-m-d H:i:s')
        ], 'id_piscina = :id_piscina AND id_compania = :id_compania', 
           [':id_piscina' => $id_piscina, ':id_compania' => $id_compania]);
        
        ErrorHandler::sendUpdatedResponse();
        
    // DELETE - Eliminar piscina
    } elseif ($method === 'DELETE') {
        $id_piscina = RequestValidator::validateIntegerParam('id_piscina');
        $id_compania = RequestValidator::validateIntegerParam('id_compania');
        
        // Verificar si tiene ciclos asociados
        $cycle_count = $qb->countRecords('ciclo', 'id_piscina = :id_piscina', [':id_piscina' => $id_piscina]);
        
        if ($cycle_count > 0) {
            ErrorHandler::handleValidationError('No se puede eliminar la piscina porque tiene ciclos asociados');
            exit();
        }
        
        // Eliminar piscina
        $deleted = $qb->deleteRecord('piscina', 
            'id_piscina = :id_piscina AND id_compania = :id_compania',
            [':id_piscina' => $id_piscina, ':id_compania' => $id_compania]);
        
        if ($deleted === 0) {
            ErrorHandler::sendErrorResponse('No se encontró la piscina', HTTP_NOT_FOUND);
        } else {
            ErrorHandler::sendDeletedResponse();
        }
        
    } else {
        ErrorHandler::sendErrorResponse('Método no permitido', HTTP_METHOD_NOT_ALLOWED);
    }
    
} catch (Exception $e) {
    ErrorHandler::handleException($e);
}