<?php
// Incluir archivos necesarios
require_once(__DIR__ . '/../config/config.php');
require_once(__DIR__ . '/../helpers/response.php');
require_once(__DIR__ . '/../helpers/cors.php');

header('Content-Type: application/json');

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

// Determinar el método de la solicitud
$method = $_SERVER['REQUEST_METHOD'];

// Manejo de peticiones OPTIONS (preflight)
if ($method === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Manejo de peticiones GET - Obtener todos los perfiles
if ($method === 'GET') {
    try {
        $query = "SELECT id_perfil, nombre FROM perfil ORDER BY nombre";
        $stmt = $conn->prepare($query);
        $stmt->execute();
        
        $perfiles = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
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

// Método no permitido
http_response_code(405);
echo json_encode([
    'success' => false,
    'message' => 'Método no permitido'
]);
exit();