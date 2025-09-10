<?php
require_once(__DIR__ . '/../config/config.php');  // Incluir configuración
require_once(__DIR__ . '/../helpers/response.php');  // Función para enviar respuestas

// Configuración de CORS
header("Access-Control-Allow-Origin: http://localhost:3000");  // Cambia esto según la URL de tu frontend
header("Access-Control-Allow-Methods: POST, OPTIONS");  // Métodos permitidos
header("Access-Control-Allow-Headers: Content-Type, Authorization");  // Encabezados permitidos
header("Access-Control-Allow-Credentials: true");  // Permitir cookies
header('Content-Type: application/json');  // Asegura que la respuesta sea en formato JSON

// Si la solicitud es OPTIONS (preflight), respondemos sin procesar
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200); // 200 OK
    exit(0);  // Permitir solicitudes OPTIONS para el preflight de CORS
}

// Obtener los datos enviados (usuario y contraseña)
$data = json_decode(file_get_contents("php://input"));  // Lee los datos de la solicitud

// Depuración: muestra los datos recibidos
error_log("Datos recibidos del frontend: " . print_r($data, true));  // Imprime los datos recibidos

// Validar que se hayan recibido los datos
if (!isset($data->username) || !isset($data->password)) {
    echo json_encode(['error' => 'Faltan datos']);
    http_response_code(400);  // Código de estado 400 Bad Request
    exit;
}

$username = $data->username;
$password = $data->password;

// Verificar si las credenciales son correctas (esto debe hacerlo con tu base de datos)
$query = "SELECT id_usuario, username, password_hash, tipo_usuario FROM usuario WHERE username = :username";
$stmt = $conn->prepare($query);
$stmt->bindParam(':username', $username);
$stmt->execute();

$user = $stmt->fetch(PDO::FETCH_ASSOC);

// Depuración: imprimir lo que se trae de la base de datos
error_log("Datos del usuario desde la base de datos: " . print_r($user, true));  // Imprime los datos obtenidos

// Si no se encuentra el usuario o las credenciales son incorrectas
if (!$user || $user['password_hash'] !== $password) {  // Comparación directa (sin hash)
    echo json_encode(['error' => 'Credenciales incorrectas']);
    http_response_code(401);  // Código de estado 401 Unauthorized
    exit;
}

// Aquí ya no necesitamos crear un token JWT, solo devolvemos los datos del usuario
$response = [
    'usuario' => $user['username'],
    'tipo_usuario' => $user['tipo_usuario'],
];

// Imprimir la respuesta antes de enviarla
error_log("Respuesta enviada al frontend: " . print_r($response, true));  // Imprime la respuesta enviada

echo json_encode($response);
http_response_code(200);  // Código de estado 200 OK
?>
