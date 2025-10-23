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
    echo json_encode($response);
    http_response_code(500);
    exit();
}

// Determinar el método de la solicitud
$method = $_SERVER['REQUEST_METHOD'];

// Manejo de peticiones OPTIONS (preflight)
if ($method === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Manejo de peticiones GET - Obtener usuarios
if ($method === 'GET') {
    try {
        // Verificar que se envió el ID del usuario
        if (!isset($_GET['id_usuario']) || empty($_GET['id_usuario'])) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'ID de usuario no proporcionado'
            ]);
            exit();
        }

        $id_usuario = $_GET['id_usuario'];

        // Consulta para obtener usuarios del mismo grupo empresarial
        $query = "
            SELECT 
                u.id_usuario,
                u.nombre,
                u.username,
                u.estado,
                u.tipo_usuario,
                u.id_grupo_empresarial,
                u.fecha_creacion,
                u.fecha_actualizacion
            FROM usuario u
            WHERE u.id_grupo_empresarial = (
                SELECT id_grupo_empresarial 
                FROM usuario 
                WHERE id_usuario = :id_usuario
            )
            ORDER BY u.fecha_creacion DESC
        ";

        $stmt = $conn->prepare($query);
        $stmt->bindParam(':id_usuario', $id_usuario, PDO::PARAM_INT);
        $stmt->execute();

        $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $usuarios,
            'message' => 'Usuarios obtenidos correctamente'
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
