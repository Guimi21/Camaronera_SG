<?php
define('RESPONSE_SUCCESS', 'success');
define('RESPONSE_MESSAGE', 'message');
define('RESPONSE_DATA', 'data');
define('ERROR_DB', 'Error en la base de datos: ');
define('ERROR_SERVER', 'Error del servidor: ');

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/cors.php';

header('Content-Type: application/json');

if (!isset($conn)) {
    $response = [
        RESPONSE_SUCCESS => false,
        RESPONSE_MESSAGE => 'Error de conexión a la base de datos'
    ];
    http_response_code(500);
    echo json_encode($response);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// GET - Obtener módulos
if ($method === 'GET') {
    try {
        $id_modulo = isset($_GET['id_modulo']) ? (int)$_GET['id_modulo'] : null;

        if ($id_modulo) {
            // Obtener módulo específico
            $query = "SELECT 
                id_modulo,
                nombre,
                descripcion,
                estado,
                fecha_creacion,
                fecha_actualizacion
            FROM modulo
            WHERE id_modulo = :id_modulo";

            $stmt = $conn->prepare($query);
            $stmt->bindParam(':id_modulo', $id_modulo, PDO::PARAM_INT);
        } else {
            // Obtener todos los módulos
            $query = "SELECT 
                id_modulo,
                nombre,
                descripcion,
                estado,
                fecha_creacion,
                fecha_actualizacion
            FROM modulo
            ORDER BY fecha_actualizacion DESC";

            $stmt = $conn->prepare($query);
        }

        $stmt->execute();
        $modulos = $stmt->fetchAll(PDO::FETCH_ASSOC);

        http_response_code(200);
        echo json_encode([
            RESPONSE_SUCCESS => true,
            RESPONSE_DATA => $modulos,
            RESPONSE_MESSAGE => 'Módulos obtenidos correctamente'
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            RESPONSE_SUCCESS => false,
            RESPONSE_MESSAGE => ERROR_DB . $e->getMessage()
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            RESPONSE_SUCCESS => false,
            RESPONSE_MESSAGE => ERROR_SERVER . $e->getMessage()
        ]);
    }
    exit();
}

// POST - Crear nuevo módulo
if ($method === 'POST') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);

        $nombre = isset($input['nombre']) ? trim($input['nombre']) : null;
        $descripcion = isset($input['descripcion']) ? trim($input['descripcion']) : null;
        $estado = isset($input['estado']) ? trim($input['estado']) : 'ACTIVO';

        if (!$nombre) {
            http_response_code(400);
            echo json_encode([
                RESPONSE_SUCCESS => false,
                RESPONSE_MESSAGE => 'El nombre del módulo es requerido'
            ]);
            exit();
        }

        $insertQuery = "INSERT INTO modulo (nombre, descripcion, estado, fecha_creacion, fecha_actualizacion)
                        VALUES (:nombre, :descripcion, :estado, NOW(), NOW())";

        $insertStmt = $conn->prepare($insertQuery);
        $insertStmt->bindParam(':nombre', $nombre, PDO::PARAM_STR);
        $insertStmt->bindParam(':descripcion', $descripcion, PDO::PARAM_STR);
        $insertStmt->bindParam(':estado', $estado, PDO::PARAM_STR);
        $insertStmt->execute();

        $newModuloId = $conn->lastInsertId();

        http_response_code(201);
        echo json_encode([
            RESPONSE_SUCCESS => true,
            RESPONSE_DATA => [
                'id_modulo' => $newModuloId,
                'nombre' => $nombre,
                'descripcion' => $descripcion,
                'estado' => $estado
            ],
            RESPONSE_MESSAGE => 'Módulo creado exitosamente'
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            RESPONSE_SUCCESS => false,
            RESPONSE_MESSAGE => ERROR_DB . $e->getMessage()
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            RESPONSE_SUCCESS => false,
            RESPONSE_MESSAGE => ERROR_SERVER . $e->getMessage()
        ]);
    }
    exit();
}

// PUT - Actualizar módulo
if ($method === 'PUT') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);

        $id_modulo = isset($input['id_modulo']) ? (int)$input['id_modulo'] : null;
        $nombre = isset($input['nombre']) ? trim($input['nombre']) : null;
        $descripcion = isset($input['descripcion']) ? trim($input['descripcion']) : null;
        $estado = isset($input['estado']) ? trim($input['estado']) : 'ACTIVO';

        if (!$id_modulo || !$nombre) {
            http_response_code(400);
            echo json_encode([
                RESPONSE_SUCCESS => false,
                RESPONSE_MESSAGE => 'ID de módulo y nombre son requeridos'
            ]);
            exit();
        }

        $updateQuery = "UPDATE modulo 
                        SET nombre = :nombre, descripcion = :descripcion, estado = :estado, fecha_actualizacion = NOW()
                        WHERE id_modulo = :id_modulo";

        $updateStmt = $conn->prepare($updateQuery);
        $updateStmt->bindParam(':id_modulo', $id_modulo, PDO::PARAM_INT);
        $updateStmt->bindParam(':nombre', $nombre, PDO::PARAM_STR);
        $updateStmt->bindParam(':descripcion', $descripcion, PDO::PARAM_STR);
        $updateStmt->bindParam(':estado', $estado, PDO::PARAM_STR);
        $updateStmt->execute();

        http_response_code(200);
        echo json_encode([
            RESPONSE_SUCCESS => true,
            RESPONSE_MESSAGE => 'Módulo actualizado exitosamente'
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            RESPONSE_SUCCESS => false,
            RESPONSE_MESSAGE => ERROR_DB . $e->getMessage()
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            RESPONSE_SUCCESS => false,
            RESPONSE_MESSAGE => ERROR_SERVER . $e->getMessage()
        ]);
    }
    exit();
}

http_response_code(405);
echo json_encode([
    RESPONSE_SUCCESS => false,
    RESPONSE_MESSAGE => 'Método no permitido'
]);
?>
