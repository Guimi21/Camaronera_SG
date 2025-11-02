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
    GROUP_CONCAT(DISTINCT c.nombre SEPARATOR ', ') as companias
FROM usuario u
LEFT JOIN usuario_perfil up ON u.id_usuario = up.id_usuario
LEFT JOIN perfil p ON up.id_perfil = p.id_perfil
LEFT JOIN usuario_compania uc ON u.id_usuario = uc.id_usuario
LEFT JOIN compania c ON uc.id_compania = c.id_compania
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