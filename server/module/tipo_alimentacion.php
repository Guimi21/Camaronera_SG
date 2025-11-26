<?php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/cors.php';  // Configuración CORS centralizada

// Constantes para parámetros SQL y mensajes de error
define('PARAM_ID_COMPANIA', ':id_compania');
define('PARAM_NOMBRE', ':nombre');
define('PARAM_ID_TIPO_ALIMENTACION', ':id_tipo_alimentacion');
define('ERROR_PREFIX', 'Error: ');
define('INPUT_STREAM', 'php://input');

// Verificar que la conexión a la base de datos esté establecida
if (!isset($conn)) {
    $response = [
        'success' => false,
        'message' => 'Error de conexión a la base de datos'
    ];
    http_response_code(500);
    echo json_encode($response);
    exit();
}

// Manejar solicitudes GET para obtener tipos de alimentación
if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    try {
        // Obtener parámetros de consulta
        $id_compania = isset($_GET['id_compania']) ? intval($_GET['id_compania']) : null;
        
        // Validar que se proporcione el id_compania
        if (!$id_compania) {
            $response = [
                'success' => false,
                'message' => 'ID de compañía requerido'
            ];
            http_response_code(400);
            echo json_encode($response);
            exit();
        }

        // Construir la consulta SQL
        $sql = "SELECT 
                    ta.id_tipo_alimentacion,
                    ta.nombre,
                    ta.id_compania,
                    ta.estado,
                    ta.fecha_creacion,
                    ta.fecha_actualizacion
                FROM tipo_alimentacion ta
                WHERE ta.id_compania = " . PARAM_ID_COMPANIA . "
                ORDER BY ta.id_tipo_alimentacion DESC";

        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            throw new Exception("Error preparando consulta: " . implode(", ", $conn->errorInfo()));
        }

        $stmt->bindParam(PARAM_ID_COMPANIA, $id_compania, PDO::PARAM_INT);
        
        if (!$stmt->execute()) {
            throw new Exception("Error ejecutando consulta: " . implode(", ", $stmt->errorInfo()));
        }

        $tipos_alimentacion = [];

        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $tipos_alimentacion[] = [
                'id_tipo_alimentacion' => $row['id_tipo_alimentacion'],
                'nombre' => $row['nombre'],
                'id_compania' => $row['id_compania'],
                'estado' => $row['estado'],
                'fecha_creacion' => $row['fecha_creacion'],
                'fecha_actualizacion' => $row['fecha_actualizacion']
            ];
        }

        $response = [
            'success' => true,
            'data' => $tipos_alimentacion,
            'message' => 'Tipos de alimentación obtenidos exitosamente',
            'total' => count($tipos_alimentacion)
        ];

        echo json_encode($response);

    } catch (Exception $e) {
        $response = [
            'success' => false,
            'message' => ERROR_PREFIX . $e->getMessage()
        ];
        http_response_code(500);
        echo json_encode($response);
    }
}

// Manejar solicitudes POST para crear nuevo tipo de alimentación
elseif ($_SERVER['REQUEST_METHOD'] == 'POST') {
    try {
        // Obtener datos del cuerpo de la solicitud
        $input = json_decode(file_get_contents(INPUT_STREAM), true);
        
        if (!$input) {
            $response = [
                'success' => false,
                'message' => 'Datos no válidos'
            ];
            http_response_code(400);
            echo json_encode($response);
            exit();
        }

        // Validar campos requeridos
        $required_fields = ['nombre', 'id_compania', 'id_usuario_crea', 'id_usuario_actualiza'];
        $missing_fields = [];
        
        foreach ($required_fields as $field) {
            if (!isset($input[$field]) || trim($input[$field]) === '') {
                $missing_fields[] = $field;
            }
        }

        if (!empty($missing_fields)) {
            $response = [
                'success' => false,
                'message' => 'Campos requeridos faltantes: ' . implode(', ', $missing_fields)
            ];
            http_response_code(400);
            echo json_encode($response);
            exit();
        }

        // Extraer datos
        $nombre = trim($input['nombre']);
        $id_compania = intval($input['id_compania']);
        $id_usuario_crea = intval($input['id_usuario_crea']);
        $id_usuario_actualiza = intval($input['id_usuario_actualiza']);

        // Verificar si el tipo de alimentación ya existe en esta compañía
        $checkSql = "SELECT COUNT(*) as count FROM tipo_alimentacion 
                     WHERE nombre = " . PARAM_NOMBRE . " AND id_compania = " . PARAM_ID_COMPANIA . "";
        $checkStmt = $conn->prepare($checkSql);
        $checkStmt->bindParam(PARAM_NOMBRE, $nombre);
        $checkStmt->bindParam(PARAM_ID_COMPANIA, $id_compania, PDO::PARAM_INT);
        $checkStmt->execute();
        $checkResult = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if ($checkResult['count'] > 0) {
            $response = [
                'success' => false,
                'message' => 'Ya existe un tipo de alimentación con ese nombre en esta compañía'
            ];
            http_response_code(409);
            echo json_encode($response);
            exit();
        }

        // Insertar el nuevo tipo de alimentación
        $estado = isset($input['estado']) ? trim($input['estado']) : 'ACTIVO';
        $insertSql = "INSERT INTO tipo_alimentacion (nombre, id_compania, estado, id_usuario_crea, id_usuario_actualiza) 
                      VALUES (" . PARAM_NOMBRE . ", " . PARAM_ID_COMPANIA . ", :estado, :id_usuario_crea, :id_usuario_actualiza)";
        
        $insertStmt = $conn->prepare($insertSql);
        $insertStmt->bindParam(PARAM_NOMBRE, $nombre);
        $insertStmt->bindParam(PARAM_ID_COMPANIA, $id_compania, PDO::PARAM_INT);
        $insertStmt->bindParam(':estado', $estado, PDO::PARAM_STR);
        $insertStmt->bindParam(':id_usuario_crea', $id_usuario_crea, PDO::PARAM_INT);
        $insertStmt->bindParam(':id_usuario_actualiza', $id_usuario_actualiza, PDO::PARAM_INT);
        
        if ($insertStmt->execute()) {
            $id_tipo_alimentacion = $conn->lastInsertId();
            
            $response = [
                'success' => true,
                'message' => 'Tipo de alimentación creado exitosamente',
                'data' => [
                    'id_tipo_alimentacion' => $id_tipo_alimentacion,
                    'nombre' => $nombre,
                    'id_compania' => $id_compania,
                    'estado' => $estado,
                    'id_usuario_crea' => $id_usuario_crea,
                    'id_usuario_actualiza' => $id_usuario_actualiza
                ]
            ];
            http_response_code(201);
            echo json_encode($response);
        } else {
            throw new Exception("Error al insertar tipo de alimentación");
        }

    } catch (Exception $e) {
        $response = [
            'success' => false,
            'message' => ERROR_PREFIX . $e->getMessage()
        ];
        http_response_code(500);
        echo json_encode($response);
    }
}

// Manejar solicitudes PUT para actualizar tipo de alimentación
elseif ($_SERVER['REQUEST_METHOD'] == 'PUT') {
    try {
        $input = json_decode(file_get_contents(INPUT_STREAM), true);
        
        if (!$input || !isset($input['id_tipo_alimentacion'])) {
            $response = [
                'success' => false,
                'message' => 'ID de tipo de alimentación requerido'
            ];
            http_response_code(400);
            echo json_encode($response);
            exit();
        }

        $id_tipo_alimentacion = intval($input['id_tipo_alimentacion']);
        $nombre = isset($input['nombre']) ? trim($input['nombre']) : null;
        $estado = isset($input['estado']) ? trim($input['estado']) : null;

        // Construir consulta de actualización dinámica
        $updates = [];
        $params = [PARAM_ID_TIPO_ALIMENTACION => $id_tipo_alimentacion];

        if ($nombre !== null && $nombre !== '') {
            $updates[] = "nombre = " . PARAM_NOMBRE . "";
            $params[PARAM_NOMBRE] = $nombre;
        }

        if ($estado !== null && $estado !== '') {
            $updates[] = "estado = :estado";
            $params[':estado'] = $estado;
        }

        if (empty($updates)) {
            $response = [
                'success' => false,
                'message' => 'No hay campos para actualizar'
            ];
            http_response_code(400);
            echo json_encode($response);
            exit();
        }

        $updateSql = "UPDATE tipo_alimentacion SET " . implode(', ', $updates) . " 
                      WHERE id_tipo_alimentacion = " . PARAM_ID_TIPO_ALIMENTACION . "";
        
        $updateStmt = $conn->prepare($updateSql);
        
        foreach ($params as $key => $value) {
            $updateStmt->bindValue($key, $value);
        }
        
        if ($updateStmt->execute()) {
            $response = [
                'success' => true,
                'message' => 'Tipo de alimentación actualizado exitosamente'
            ];
            echo json_encode($response);
        } else {
            throw new Exception("Error al actualizar tipo de alimentación");
        }

    } catch (Exception $e) {
        $response = [
            'success' => false,
            'message' => ERROR_PREFIX . $e->getMessage()
        ];
        http_response_code(500);
        echo json_encode($response);
    }
}

// Manejar solicitudes DELETE para eliminar tipo de alimentación
elseif ($_SERVER['REQUEST_METHOD'] == 'DELETE') {
    try {
        $input = json_decode(file_get_contents(INPUT_STREAM), true);
        
        if (!$input || !isset($input['id_tipo_alimentacion'])) {
            $response = [
                'success' => false,
                'message' => 'ID de tipo de alimentación requerido'
            ];
            http_response_code(400);
            echo json_encode($response);
            exit();
        }

        $id_tipo_alimentacion = intval($input['id_tipo_alimentacion']);

        $deleteSql = "DELETE FROM tipo_alimentacion WHERE id_tipo_alimentacion = " . PARAM_ID_TIPO_ALIMENTACION . "";
        $deleteStmt = $conn->prepare($deleteSql);
        $deleteStmt->bindParam(PARAM_ID_TIPO_ALIMENTACION, $id_tipo_alimentacion, PDO::PARAM_INT);
        
        if ($deleteStmt->execute()) {
            $response = [
                'success' => true,
                'message' => 'Tipo de alimentación eliminado exitosamente'
            ];
            echo json_encode($response);
        } else {
            throw new Exception("Error al eliminar tipo de alimentación");
        }

    } catch (Exception $e) {
        $response = [
            'success' => false,
            'message' => ERROR_PREFIX . $e->getMessage()
        ];
        http_response_code(500);
        echo json_encode($response);
    }
}

// Método no soportado
else {
    $response = [
        'success' => false,
        'message' => 'Método HTTP no soportado'
    ];
    http_response_code(405);
    echo json_encode($response);
}