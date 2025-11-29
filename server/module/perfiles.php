<?php
// Bootstrap - Incluir todas las dependencias centralizadas
require_once __DIR__ . '/../bootstrap.php';

// Validar conexión a base de datos
RequestValidator::validateDbConnection($conn);

$method = $_SERVER['REQUEST_METHOD'];
$qb = new DatabaseQueryBuilder($conn);

try {
    // GET - Obtener perfiles
    if ($method === 'GET') {
        $id_perfil = RequestValidator::getParamWithDefault('id_perfil', null, 'GET');
        
        if ($id_perfil) {
            $id_perfil = (int)$id_perfil;
            // Obtener perfil específico con sus menús
            $query = "SELECT 
                p.id_perfil, p.nombre, p.descripcion, p.estado, p.fecha_creacion, p.fecha_actualizacion,
                m.id_menu, m.nombre as menu_nombre, m.ruta, m.icono
            FROM perfil p
            LEFT JOIN menu_perfil mp ON p.id_perfil = mp.id_perfil
            LEFT JOIN menu m ON mp.id_menu = m.id_menu
            WHERE p.id_perfil = :id_perfil
            ORDER BY m.nombre";

            $rows = $qb->executeQuery($query, [':id_perfil' => $id_perfil], true);
        } else {
            // Obtener todos los perfiles con sus menús
            $query = "SELECT 
                p.id_perfil, p.nombre, p.descripcion, p.estado, p.fecha_creacion, p.fecha_actualizacion,
                m.id_menu, m.nombre as menu_nombre, m.ruta, m.icono
            FROM perfil p
            LEFT JOIN menu_perfil mp ON p.id_perfil = mp.id_perfil
            LEFT JOIN menu m ON mp.id_menu = m.id_menu
            ORDER BY p.fecha_actualizacion DESC, m.nombre";

            $rows = $qb->executeQuery($query, [], true);
        }

        // Reorganizar datos: agrupar menús por perfil
        $perfiles = [];
        foreach ($rows as $row) {
            $perfilId = $row['id_perfil'];
            
            if (!isset($perfiles[$perfilId])) {
                $perfiles[$perfilId] = [
                    'id_perfil' => $row['id_perfil'],
                    'nombre' => $row['nombre'],
                    'descripcion' => $row['descripcion'],
                    'estado' => $row['estado'],
                    'fecha_creacion' => $row['fecha_creacion'],
                    'fecha_actualizacion' => $row['fecha_actualizacion'],
                    'menus' => []
                ];
            }
            
            // Agregar menú si existe
            if ($row['id_menu'] !== null) {
                $perfiles[$perfilId]['menus'][] = [
                    'id_menu' => $row['id_menu'],
                    'nombre' => $row['menu_nombre'],
                    'ruta' => $row['ruta'],
                    'icono' => $row['icono']
                ];
            }
        }

        // Convertir a array indexado
        $perfiles = array_values($perfiles);
        ErrorHandler::sendSuccessResponse($perfiles);

    // POST - Crear nuevo perfil
    } elseif ($method === 'POST') {
        $input = RequestValidator::validateJsonInput();
        $nombre = isset($input['nombre']) ? trim($input['nombre']) : null;
        
        if (!$nombre) {
            ErrorHandler::handleValidationError('El nombre del perfil es requerido');
            exit();
        }

        $descripcion = isset($input['descripcion']) ? trim($input['descripcion']) : null;
        $estado = isset($input['estado']) && !empty(trim($input['estado'])) ? trim($input['estado']) : 'ACTIVO';
        $menus = isset($input['menus']) && is_array($input['menus']) ? $input['menus'] : [];

        // Insertar perfil
        $newPerfilId = $qb->insertRecord('perfil', [
            'nombre' => $nombre,
            'descripcion' => $descripcion,
            'estado' => $estado,
            'fecha_creacion' => date('Y-m-d H:i:s'),
            'fecha_actualizacion' => date('Y-m-d H:i:s')
        ]);

        // Insertar menús asociados
        foreach ($menus as $id_menu) {
            $qb->insertRecord('menu_perfil', [
                'id_menu' => (int)$id_menu,
                'id_perfil' => $newPerfilId,
                'fecha_creacion' => date('Y-m-d H:i:s'),
                'fecha_actualizacion' => date('Y-m-d H:i:s')
            ]);
        }

        $data = [
            'id_perfil' => $newPerfilId,
            'nombre' => $nombre,
            'descripcion' => $descripcion,
            'estado' => $estado,
            'menus' => $menus
        ];

        ErrorHandler::sendCreatedResponse($data);

    // PUT - Actualizar perfil
    } elseif ($method === 'PUT') {
        $input = RequestValidator::validateJsonInput();
        RequestValidator::validateJsonFields($input, ['id_perfil', 'nombre']);
        
        $id_perfil = (int)$input['id_perfil'];
        $nombre = trim($input['nombre']);
        $descripcion = isset($input['descripcion']) ? trim($input['descripcion']) : null;
        $estado = isset($input['estado']) && !empty(trim($input['estado'])) ? trim($input['estado']) : 'ACTIVO';
        $menus = isset($input['menus']) && is_array($input['menus']) ? $input['menus'] : [];

        // Actualizar perfil
        $qb->updateRecord('perfil', [
            'nombre' => $nombre,
            'descripcion' => $descripcion,
            'estado' => $estado,
            'fecha_actualizacion' => date('Y-m-d H:i:s')
        ], 'id_perfil = :id_perfil', [':id_perfil' => $id_perfil]);

        // Eliminar menús antiguos e insertar nuevos
        $qb->deleteRecord('menu_perfil', 'id_perfil = :id_perfil', [':id_perfil' => $id_perfil]);
        foreach ($menus as $id_menu) {
            $qb->insertRecord('menu_perfil', [
                'id_menu' => (int)$id_menu,
                'id_perfil' => $id_perfil,
                'fecha_creacion' => date('Y-m-d H:i:s'),
                'fecha_actualizacion' => date('Y-m-d H:i:s')
            ]);
        }

        ErrorHandler::sendUpdatedResponse();

    // DELETE - Eliminar perfil
    } elseif ($method === 'DELETE') {
        $id_perfil = RequestValidator::validateIntegerParam('id_perfil');
        
        // Eliminar menús asociados
        $qb->deleteRecord('menu_perfil', 'id_perfil = :id_perfil', [':id_perfil' => $id_perfil]);
        
        // Eliminar perfil
        $qb->deleteRecord('perfil', 'id_perfil = :id_perfil', [':id_perfil' => $id_perfil]);
        
        ErrorHandler::sendDeletedResponse();

    } else {
        ErrorHandler::sendErrorResponse('Método no permitido', HTTP_METHOD_NOT_ALLOWED);
    }

    exit();

} catch (Exception $e) {
    ErrorHandler::handleException($e);
}