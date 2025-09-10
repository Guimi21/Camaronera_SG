<?php
require_once(__DIR__ . '/../config/config.php');  // Incluir configuración
require_once(__DIR__ . '/../helpers/response.php');  // Función para enviar respuestas

// Configuración de CORS
header("Access-Control-Allow-Origin: http://localhost:3000");  // Cambia esto según la URL de tu frontend
header("Access-Control-Allow-Methods: GET, OPTIONS");  // Métodos permitidos
header("Access-Control-Allow-Headers: Content-Type, Authorization");  // Encabezados permitidos
header("Access-Control-Allow-Credentials: true");  // Permitir cookies
header('Content-Type: application/json');  // Asegura que la respuesta sea en formato JSON

// Si la solicitud es OPTIONS (preflight), respondemos sin procesar
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200); // 200 OK
    exit(0);  // Permitir solicitudes OPTIONS para el preflight de CORS
}

// Obtener el ID del usuario desde el parámetro GET
$userId = $_GET['userId'];  // Este ID se pasará desde el frontend

// Consultar los menús asignados al perfil del usuario
$query = "
    SELECT m.id_menu, m.nombre, m.ruta, m.icono
    FROM menu m
    JOIN menu_perfil mp ON mp.id_menu = m.id_menu
    JOIN usuario_perfil up ON up.id_perfil = mp.id_perfil
    WHERE up.id_usuario = :userId AND m.estado = 'A'";  // Solo menús activos (estado 'A')
$stmt = $conn->prepare($query);
$stmt->bindParam(':userId', $userId);
$stmt->execute();

$menus = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Si no se encuentran menús, respondemos con un mensaje de error
if (!$menus) {
    echo json_encode(['error' => 'No se encontraron menús para este usuario']);
    http_response_code(404);  // Código de estado 404 Not Found
    exit;
}

// Enviar los menús como respuesta JSON
echo json_encode($menus);
?>
