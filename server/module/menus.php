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

// GET - Obtener menús
if ($method === 'GET') {
    try {
        $id_menu = isset($_GET['id_menu']) ? (int)$_GET['id_menu'] : null;

        if ($id_menu) {
            // Obtener menú específico
            $query = "SELECT 
                m.id_menu,
                m.id_modulo,
                mo.nombre as nombre_modulo,
                m.nombre,
                m.ruta,
                m.icono,
                m.estado,
                m.fecha_creacion,
                m.fecha_actualizacion
            FROM menu m
            LEFT JOIN `modulo` mo ON m.id_modulo = mo.id_modulo
            WHERE m.id_menu = :id_menu";

            $stmt = $conn->prepare($query);
            $stmt->bindParam(':id_menu', $id_menu, PDO::PARAM_INT);
        } else {
            // Obtener todos los menús
            $query = "SELECT 
                m.id_menu,
                m.id_modulo,
                mo.nombre as nombre_modulo,
                m.nombre,
                m.ruta,
                m.icono,
                m.estado,
                m.fecha_creacion,
                m.fecha_actualizacion
            FROM menu m
            LEFT JOIN `modulo` mo ON m.id_modulo = mo.id_modulo
            ORDER BY m.fecha_actualizacion DESC";

            $stmt = $conn->prepare($query);
        }

        $stmt->execute();
        $menus = $stmt->fetchAll(PDO::FETCH_ASSOC);

        http_response_code(200);
        echo json_encode([
            RESPONSE_SUCCESS => true,
            RESPONSE_DATA => $menus,
            RESPONSE_MESSAGE => 'Menús obtenidos correctamente'
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

// POST - Crear nuevo menú
if ($method === 'POST') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);

        $id_modulo = isset($input['id_modulo']) ? (int)$input['id_modulo'] : null;
        $nombre = isset($input['nombre']) ? trim($input['nombre']) : null;
        $ruta = isset($input['ruta']) ? trim($input['ruta']) : null;
        $icono = isset($input['icono']) ? trim($input['icono']) : null;
        $estado = isset($input['estado']) ? trim($input['estado']) : 'ACTIVO';

        if (!$nombre) {
            http_response_code(400);
            echo json_encode([
                RESPONSE_SUCCESS => false,
                RESPONSE_MESSAGE => 'El nombre del menú es requerido'
            ]);
            exit();
        }

        $insertQuery = "INSERT INTO menu (id_modulo, nombre, ruta, icono, estado, fecha_creacion, fecha_actualizacion)
                        VALUES (:id_modulo, :nombre, :ruta, :icono, :estado, NOW(), NOW())";

        $insertStmt = $conn->prepare($insertQuery);
        $insertStmt->bindParam(':id_modulo', $id_modulo, PDO::PARAM_INT);
        $insertStmt->bindParam(':nombre', $nombre, PDO::PARAM_STR);
        $insertStmt->bindParam(':ruta', $ruta, PDO::PARAM_STR);
        $insertStmt->bindParam(':icono', $icono, PDO::PARAM_STR);
        $insertStmt->bindParam(':estado', $estado, PDO::PARAM_STR);
        $insertStmt->execute();

        $newMenuId = $conn->lastInsertId();

        http_response_code(201);
        echo json_encode([
            RESPONSE_SUCCESS => true,
            RESPONSE_DATA => [
                'id_menu' => $newMenuId,
                'id_modulo' => $id_modulo,
                'nombre' => $nombre,
                'ruta' => $ruta,
                'icono' => $icono,
                'estado' => $estado
            ],
            RESPONSE_MESSAGE => 'Menú creado exitosamente'
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

// PUT - Actualizar menú
if ($method === 'PUT') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);

        $id_menu = isset($input['id_menu']) ? (int)$input['id_menu'] : null;
        $id_modulo = isset($input['id_modulo']) ? (int)$input['id_modulo'] : null;
        $nombre = isset($input['nombre']) ? trim($input['nombre']) : null;
        $ruta = isset($input['ruta']) ? trim($input['ruta']) : null;
        $icono = isset($input['icono']) ? trim($input['icono']) : null;
        $estado = isset($input['estado']) ? trim($input['estado']) : 'ACTIVO';

        if (!$id_menu || !$nombre) {
            http_response_code(400);
            echo json_encode([
                RESPONSE_SUCCESS => false,
                RESPONSE_MESSAGE => 'ID de menú y nombre son requeridos'
            ]);
            exit();
        }

        $updateQuery = "UPDATE menu 
                        SET id_modulo = :id_modulo, nombre = :nombre, ruta = :ruta, icono = :icono, estado = :estado, fecha_actualizacion = NOW()
                        WHERE id_menu = :id_menu";

        $updateStmt = $conn->prepare($updateQuery);
        $updateStmt->bindParam(':id_menu', $id_menu, PDO::PARAM_INT);
        $updateStmt->bindParam(':id_modulo', $id_modulo, PDO::PARAM_INT);
        $updateStmt->bindParam(':nombre', $nombre, PDO::PARAM_STR);
        $updateStmt->bindParam(':ruta', $ruta, PDO::PARAM_STR);
        $updateStmt->bindParam(':icono', $icono, PDO::PARAM_STR);
        $updateStmt->bindParam(':estado', $estado, PDO::PARAM_STR);
        $updateStmt->execute();

        http_response_code(200);
        echo json_encode([
            RESPONSE_SUCCESS => true,
            RESPONSE_MESSAGE => 'Menú actualizado exitosamente'
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            RESPONSE_SUCCESS => false,
            RESPONSE_MESSAGE => 'Error en la base de datos: ' . $e->getMessage()
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            RESPONSE_SUCCESS => false,
            RESPONSE_MESSAGE => 'Error del servidor: ' . $e->getMessage()
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
