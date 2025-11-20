<?php
require_once(__DIR__ . '/../config/config.php');
require_once(__DIR__ . '/../helpers/response.php');
require_once(__DIR__ . '/../helpers/cors.php');

header('Content-Type: application/json');

if (!isset($conn)) {
    $response = [
        'success' => false,
        'message' => 'Error de conexión a la base de datos'
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

// GET - Obtener perfiles
if ($method === 'GET') {
    try {
        $id_perfil = isset($_GET['id_perfil']) ? (int)$_GET['id_perfil'] : null;

        if ($id_perfil) {
            // Obtener perfil específico con sus menús
            $query = "SELECT 
                p.id_perfil,
                p.nombre,
                p.descripcion,
                p.fecha_creacion,
                p.fecha_actualizacion,
                m.id_menu,
                m.nombre as menu_nombre,
                m.ruta,
                m.icono
            FROM perfil p
            LEFT JOIN menu_perfil mp ON p.id_perfil = mp.id_perfil
            LEFT JOIN menu m ON mp.id_menu = m.id_menu
            WHERE p.id_perfil = :id_perfil
            ORDER BY m.nombre";

            $stmt = $conn->prepare($query);
            $stmt->bindParam(':id_perfil', $id_perfil, PDO::PARAM_INT);
        } else {
            // Obtener todos los perfiles con sus menús
            $query = "SELECT 
                p.id_perfil,
                p.nombre,
                p.descripcion,
                p.fecha_creacion,
                p.fecha_actualizacion,
                m.id_menu,
                m.nombre as menu_nombre,
                m.ruta,
                m.icono
            FROM perfil p
            LEFT JOIN menu_perfil mp ON p.id_perfil = mp.id_perfil
            LEFT JOIN menu m ON mp.id_menu = m.id_menu
            ORDER BY p.fecha_actualizacion DESC, m.nombre";

            $stmt = $conn->prepare($query);
        }

        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Reorganizar datos: agrupar menús por perfil
        $perfiles = [];
        foreach ($rows as $row) {
            $perfilId = $row['id_perfil'];
            
            if (!isset($perfiles[$perfilId])) {
                $perfiles[$perfilId] = [
                    'id_perfil' => $row['id_perfil'],
                    'nombre' => $row['nombre'],
                    'descripcion' => $row['descripcion'],
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

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $perfiles,
            'message' => 'Perfiles obtenidos correctamente'
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error en la base de datos: ' . $e->getMessage()
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error del servidor: ' . $e->getMessage()
        ]);
    }
    exit();
}

// POST - Crear nuevo perfil
if ($method === 'POST') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);

        $nombre = isset($input['nombre']) ? trim($input['nombre']) : null;
        $descripcion = isset($input['descripcion']) ? trim($input['descripcion']) : null;
        $menus = isset($input['menus']) ? $input['menus'] : [];

        if (!$nombre) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'El nombre del perfil es requerido'
            ]);
            exit();
        }

        $insertQuery = "INSERT INTO perfil (nombre, descripcion, fecha_creacion, fecha_actualizacion)
                        VALUES (:nombre, :descripcion, NOW(), NOW())";

        $insertStmt = $conn->prepare($insertQuery);
        $insertStmt->bindParam(':nombre', $nombre, PDO::PARAM_STR);
        $insertStmt->bindParam(':descripcion', $descripcion, PDO::PARAM_STR);
        $insertStmt->execute();

        $newPerfilId = $conn->lastInsertId();

        // Insertar menús asociados
        if (!empty($menus)) {
            $menuQuery = "INSERT INTO menu_perfil (id_menu, id_perfil, fecha_creacion, fecha_actualizacion)
                          VALUES (:id_menu, :id_perfil, NOW(), NOW())";
            $menuStmt = $conn->prepare($menuQuery);
            
            foreach ($menus as $id_menu) {
                $menuStmt->bindParam(':id_menu', (int)$id_menu, PDO::PARAM_INT);
                $menuStmt->bindParam(':id_perfil', $newPerfilId, PDO::PARAM_INT);
                $menuStmt->execute();
            }
        }

        http_response_code(201);
        echo json_encode([
            'success' => true,
            'data' => [
                'id_perfil' => $newPerfilId,
                'nombre' => $nombre,
                'descripcion' => $descripcion,
                'menus' => $menus
            ],
            'message' => 'Perfil creado exitosamente'
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error en la base de datos: ' . $e->getMessage()
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error del servidor: ' . $e->getMessage()
        ]);
    }
    exit();
}

// PUT - Actualizar perfil
if ($method === 'PUT') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);

        $id_perfil = isset($input['id_perfil']) ? (int)$input['id_perfil'] : null;
        $nombre = isset($input['nombre']) ? trim($input['nombre']) : null;
        $descripcion = isset($input['descripcion']) ? trim($input['descripcion']) : null;
        $menus = isset($input['menus']) ? $input['menus'] : [];

        if (!$id_perfil || !$nombre) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'ID de perfil y nombre son requeridos'
            ]);
            exit();
        }

        $updateQuery = "UPDATE perfil 
                        SET nombre = :nombre, descripcion = :descripcion, fecha_actualizacion = NOW()
                        WHERE id_perfil = :id_perfil";

        $updateStmt = $conn->prepare($updateQuery);
        $updateStmt->bindParam(':id_perfil', $id_perfil, PDO::PARAM_INT);
        $updateStmt->bindParam(':nombre', $nombre, PDO::PARAM_STR);
        $updateStmt->bindParam(':descripcion', $descripcion, PDO::PARAM_STR);
        $updateStmt->execute();

        // Actualizar menús asociados: primero eliminar los existentes
        $deleteMenuQuery = "DELETE FROM menu_perfil WHERE id_perfil = :id_perfil";
        $deleteMenuStmt = $conn->prepare($deleteMenuQuery);
        $deleteMenuStmt->bindParam(':id_perfil', $id_perfil, PDO::PARAM_INT);
        $deleteMenuStmt->execute();

        // Insertar nuevos menús asociados
        if (!empty($menus)) {
            $menuQuery = "INSERT INTO menu_perfil (id_menu, id_perfil, fecha_creacion, fecha_actualizacion)
                          VALUES (:id_menu, :id_perfil, NOW(), NOW())";
            $menuStmt = $conn->prepare($menuQuery);
            
            foreach ($menus as $id_menu) {
                $menuStmt->bindParam(':id_menu', (int)$id_menu, PDO::PARAM_INT);
                $menuStmt->bindParam(':id_perfil', $id_perfil, PDO::PARAM_INT);
                $menuStmt->execute();
            }
        }

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Perfil actualizado exitosamente'
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error en la base de datos: ' . $e->getMessage()
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error del servidor: ' . $e->getMessage()
        ]);
    }
    exit();
}

http_response_code(405);
echo json_encode([
    'success' => false,
    'message' => 'Método no permitido'
]);
?>