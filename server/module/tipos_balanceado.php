<?php
require_once(__DIR__ . '/../config/config.php');
require_once(__DIR__ . '/../helpers/response.php');
require_once(__DIR__ . '/../helpers/cors.php');  // Configuración CORS centralizada

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

// Manejar solicitudes GET para obtener tipos de balanceado
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
                    tb.id_tipo_balanceado,
                    tb.nombre,
                    tb.unidad,
                    tb.id_compania,
                    tb.estado,
                    tb.fecha_creacion,
                    tb.fecha_actualizacion
                FROM tipo_balanceado tb
                WHERE tb.id_compania = :id_compania
                ORDER BY tb.id_tipo_balanceado";

        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            throw new Exception("Error preparando consulta: " . implode(", ", $conn->errorInfo()));
        }

        $stmt->bindParam(':id_compania', $id_compania, PDO::PARAM_INT);
        
        if (!$stmt->execute()) {
            throw new Exception("Error ejecutando consulta: " . implode(", ", $stmt->errorInfo()));
        }

        $tipos_balanceado = [];

        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $tipos_balanceado[] = [
                'id_tipo_balanceado' => $row['id_tipo_balanceado'],
                'nombre' => $row['nombre'],
                'unidad' => $row['unidad'],
                'id_compania' => $row['id_compania'],
                'estado' => $row['estado'],
                'fecha_creacion' => $row['fecha_creacion'],
                'fecha_actualizacion' => $row['fecha_actualizacion']
            ];
        }

        $response = [
            'success' => true,
            'data' => $tipos_balanceado,
            'message' => 'Tipos de balanceado obtenidos exitosamente',
            'total' => count($tipos_balanceado)
        ];

        echo json_encode($response);

    } catch (Exception $e) {
        $response = [
            'success' => false,
            'message' => 'Error: ' . $e->getMessage()
        ];
        http_response_code(500);
        echo json_encode($response);
    }
}

// Manejar solicitudes POST para crear nuevo tipo de balanceado
elseif ($_SERVER['REQUEST_METHOD'] == 'POST') {
    try {
        // Obtener datos del cuerpo de la solicitud
        $input = json_decode(file_get_contents('php://input'), true);
        
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
        $required_fields = ['nombre', 'unidad', 'id_compania', 'id_usuario_crea', 'id_usuario_actualiza'];
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
        $unidad = trim($input['unidad']);
        $id_compania = intval($input['id_compania']);
        $id_usuario_crea = intval($input['id_usuario_crea']);
        $id_usuario_actualiza = intval($input['id_usuario_actualiza']);

        // Verificar si el tipo de balanceado ya existe en esta compañía
        $checkSql = "SELECT COUNT(*) as count FROM tipo_balanceado 
                     WHERE nombre = :nombre AND id_compania = :id_compania";
        $checkStmt = $conn->prepare($checkSql);
        $checkStmt->bindParam(':nombre', $nombre);
        $checkStmt->bindParam(':id_compania', $id_compania, PDO::PARAM_INT);
        $checkStmt->execute();
        $checkResult = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if ($checkResult['count'] > 0) {
            $response = [
                'success' => false,
                'message' => 'Ya existe un tipo de balanceado con ese nombre en esta compañía'
            ];
            http_response_code(409);
            echo json_encode($response);
            exit();
        }

        // Insertar el nuevo tipo de balanceado
        $estado = isset($input['estado']) ? trim($input['estado']) : 'ACTIVO';
        $insertSql = "INSERT INTO tipo_balanceado (nombre, unidad, id_compania, estado, id_usuario_crea, id_usuario_actualiza) 
                      VALUES (:nombre, :unidad, :id_compania, :estado, :id_usuario_crea, :id_usuario_actualiza)";
        
        $insertStmt = $conn->prepare($insertSql);
        $insertStmt->bindParam(':nombre', $nombre);
        $insertStmt->bindParam(':unidad', $unidad);
        $insertStmt->bindParam(':id_compania', $id_compania, PDO::PARAM_INT);
        $insertStmt->bindParam(':estado', $estado, PDO::PARAM_STR);
        $insertStmt->bindParam(':id_usuario_crea', $id_usuario_crea, PDO::PARAM_INT);
        $insertStmt->bindParam(':id_usuario_actualiza', $id_usuario_actualiza, PDO::PARAM_INT);
        
        if ($insertStmt->execute()) {
            $id_tipo_balanceado = $conn->lastInsertId();
            
            $response = [
                'success' => true,
                'message' => 'Tipo de balanceado creado exitosamente',
                'data' => [
                    'id_tipo_balanceado' => $id_tipo_balanceado,
                    'nombre' => $nombre,
                    'unidad' => $unidad,
                    'id_compania' => $id_compania,
                    'estado' => $estado,
                    'id_usuario_crea' => $id_usuario_crea,
                    'id_usuario_actualiza' => $id_usuario_actualiza
                ]
            ];
            http_response_code(201);
            echo json_encode($response);
        } else {
            throw new Exception("Error al insertar tipo de balanceado");
        }

    } catch (Exception $e) {
        $response = [
            'success' => false,
            'message' => 'Error: ' . $e->getMessage()
        ];
        http_response_code(500);
        echo json_encode($response);
    }
}

// Manejar solicitudes PUT para actualizar tipo de balanceado
elseif ($_SERVER['REQUEST_METHOD'] == 'PUT') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['id_tipo_balanceado'])) {
            $response = [
                'success' => false,
                'message' => 'ID de tipo de balanceado requerido'
            ];
            http_response_code(400);
            echo json_encode($response);
            exit();
        }

        $id_tipo_balanceado = intval($input['id_tipo_balanceado']);
        $nombre = isset($input['nombre']) ? trim($input['nombre']) : null;
        $unidad = isset($input['unidad']) ? trim($input['unidad']) : null;
        $estado = isset($input['estado']) ? trim($input['estado']) : null;

        // Construir consulta de actualización dinámica
        $updates = [];
        $params = [':id_tipo_balanceado' => $id_tipo_balanceado];

        if ($nombre !== null && $nombre !== '') {
            $updates[] = "nombre = :nombre";
            $params[':nombre'] = $nombre;
        }

        if ($unidad !== null && $unidad !== '') {
            $updates[] = "unidad = :unidad";
            $params[':unidad'] = $unidad;
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

        $updateSql = "UPDATE tipo_balanceado SET " . implode(', ', $updates) . " 
                      WHERE id_tipo_balanceado = :id_tipo_balanceado";
        
        $updateStmt = $conn->prepare($updateSql);
        
        foreach ($params as $key => $value) {
            $updateStmt->bindValue($key, $value);
        }
        
        if ($updateStmt->execute()) {
            $response = [
                'success' => true,
                'message' => 'Tipo de balanceado actualizado exitosamente'
            ];
            echo json_encode($response);
        } else {
            throw new Exception("Error al actualizar tipo de balanceado");
        }

    } catch (Exception $e) {
        $response = [
            'success' => false,
            'message' => 'Error: ' . $e->getMessage()
        ];
        http_response_code(500);
        echo json_encode($response);
    }
}

// Manejar solicitudes DELETE para eliminar tipo de balanceado
elseif ($_SERVER['REQUEST_METHOD'] == 'DELETE') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['id_tipo_balanceado'])) {
            $response = [
                'success' => false,
                'message' => 'ID de tipo de balanceado requerido'
            ];
            http_response_code(400);
            echo json_encode($response);
            exit();
        }

        $id_tipo_balanceado = intval($input['id_tipo_balanceado']);

        $deleteSql = "DELETE FROM tipo_balanceado WHERE id_tipo_balanceado = :id_tipo_balanceado";
        $deleteStmt = $conn->prepare($deleteSql);
        $deleteStmt->bindParam(':id_tipo_balanceado', $id_tipo_balanceado, PDO::PARAM_INT);
        
        if ($deleteStmt->execute()) {
            $response = [
                'success' => true,
                'message' => 'Tipo de balanceado eliminado exitosamente'
            ];
            echo json_encode($response);
        } else {
            throw new Exception("Error al eliminar tipo de balanceado");
        }

    } catch (Exception $e) {
        $response = [
            'success' => false,
            'message' => 'Error: ' . $e->getMessage()
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