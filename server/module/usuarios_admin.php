<?php
require_once(__DIR__ . '/../config/config.php');
require_once(__DIR__ . '/../helpers/response.php');
require_once(__DIR__ . '/../helpers/cors.php');

// Obtener solo usuarios con perfil "Administrador"
$id_usuario = isset($_GET['id_usuario']) ? $_GET['id_usuario'] : null;

if (!$id_usuario) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'ID de usuario requerido']);
    exit;
}

$query = "SELECT 
    u.id_usuario,
    u.nombre,
    u.username,
    u.estado,
    u.fecha_creacion,
    u.fecha_actualizacion,
    GROUP_CONCAT(DISTINCT p.nombre SEPARATOR ', ') as perfiles,
    ge.nombre as grupo_empresarial
FROM usuario u
LEFT JOIN usuario_perfil up ON u.id_usuario = up.id_usuario
LEFT JOIN perfil p ON up.id_perfil = p.id_perfil
LEFT JOIN grupo_empresarial ge ON u.id_grupo_empresarial = ge.id_grupo_empresarial
WHERE p.nombre = 'Administrador'
GROUP BY u.id_usuario
ORDER BY u.fecha_actualizacion DESC";

try {
    $stmt = $conn->prepare($query);
    $stmt->execute();
    $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $usuarios
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error al obtener usuarios administradores: ' . $e->getMessage()
    ]);
}