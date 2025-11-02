<?php
require_once(__DIR__ . '/../config/config.php');
require_once(__DIR__ . '/../helpers/response.php');
require_once(__DIR__ . '/../helpers/cors.php');

// Detectar el método HTTP
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Obtener todos los grupos empresariales
    $query = "SELECT 
        id_grupo_empresarial,
        nombre,
        descripcion,
        fecha_creacion,
        fecha_actualizacion
    FROM grupo_empresarial
    ORDER BY fecha_actualizacion DESC";

    try {
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $grupos = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'data' => $grupos
        ]);
        http_response_code(200);
    } catch (PDOException $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error al obtener grupos empresariales: ' . $e->getMessage()
        ]);
        http_response_code(500);
    }
} elseif ($method === 'POST') {
    // Crear nuevo grupo empresarial
    $data = json_decode(file_get_contents("php://input"));

    // Validar que se hayan recibido los datos requeridos
    if (!isset($data->nombre) || empty(trim($data->nombre))) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'El nombre del grupo empresarial es obligatorio']);
        exit;
    }

    $nombre = trim($data->nombre);
    $descripcion = isset($data->descripcion) && !empty(trim($data->descripcion)) ? trim($data->descripcion) : null;

    try {
        // Verificar si ya existe un grupo con el mismo nombre
        $checkQuery = "SELECT COUNT(*) as count FROM grupo_empresarial WHERE nombre = :nombre";
        $checkStmt = $conn->prepare($checkQuery);
        $checkStmt->bindParam(':nombre', $nombre);
        $checkStmt->execute();
        $result = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if ($result['count'] > 0) {
            echo json_encode([
                'success' => false,
                'message' => 'Ya existe un grupo empresarial con el nombre: ' . htmlspecialchars($nombre),
                'code' => 'DUPLICATE_NAME'
            ]);
            http_response_code(409); // Conflict
            exit;
        }

        // Insertar nuevo grupo empresarial
        $query = "INSERT INTO grupo_empresarial (nombre, descripcion, fecha_creacion, fecha_actualizacion) 
                  VALUES (:nombre, :descripcion, NOW(), NOW())";
        
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':nombre', $nombre);
        $stmt->bindParam(':descripcion', $descripcion);
        $stmt->execute();

        echo json_encode([
            'success' => true,
            'message' => 'Grupo empresarial creado exitosamente',
            'id' => $conn->lastInsertId()
        ]);
        http_response_code(201);
    } catch (PDOException $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error al crear el grupo empresarial: ' . $e->getMessage()
        ]);
        http_response_code(500);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método HTTP no permitido']);
}