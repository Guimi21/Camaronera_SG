<?php
require_once(__DIR__ . '/../config/config.php');  // Incluir configuración
require_once(__DIR__ . '/../helpers/response.php');  // Función para enviar respuestas

// Configuración de CORS
header("Access-Control-Allow-Origin: " . BASE_URL);  
header("Access-Control-Allow-Methods: POST, OPTIONS");  
header("Access-Control-Allow-Headers: Content-Type, Authorization");  
header("Access-Control-Allow-Credentials: true");  
header('Content-Type: application/json');  

// Si la solicitud es OPTIONS (preflight), respondemos sin procesar
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200); // 200 OK
    exit(0);  
}

// Obtener los datos enviados (usuario y contraseña)
$data = json_decode(file_get_contents("php://input"));  

// Depuración: muestra los datos recibidos
error_log("Datos recibidos del frontend: " . print_r($data, true));  

// Validar que se hayan recibido los datos
if (!isset($data->username) || !isset($data->password)) {
    echo json_encode(['error' => 'Faltan datos']);
    http_response_code(400);  // Código de estado 400 Bad Request
    exit;
}

$username = $data->username;
$password = $data->password;

// Verificar si las credenciales son correctas (esto debe hacerlo con tu base de datos)
$query = "SELECT u.id_usuario, u.username, u.password_hash, u.tipo_usuario, uc.id_compania, c.nombre AS compania_nombre, c.id_grupo_empresarial, ge.nombre AS grupo_empresarial_nombre 
          FROM usuario u
          JOIN usuario_compania uc ON u.id_usuario = uc.id_usuario
          JOIN compania c ON uc.id_compania = c.id_compania
          LEFT JOIN grupo_empresarial ge ON c.id_grupo_empresarial = ge.id_grupo_empresarial
          WHERE u.username = :username";

$stmt = $conn->prepare($query);
$stmt->bindParam(':username', $username);
$stmt->execute();

$user = $stmt->fetch(PDO::FETCH_ASSOC);

// Depuración: imprimir lo que se trae de la base de datos
error_log("Datos del usuario desde la base de datos: " . print_r($user, true));  

// Si no se encuentra el usuario o las credenciales son incorrectas
if (!$user || $user['password_hash'] !== $password) {  
    echo json_encode(['error' => 'Credenciales incorrectas']);
    http_response_code(401);  // Código de estado 401 Unauthorized
    exit;
}

// Obtener los menús asociados al perfil del usuario
$query_menus = "
    SELECT DISTINCT m.id_menu, m.nombre, m.ruta, m.icono, m.estado, modu.nombre AS modulo
    FROM menu m 
    JOIN modulo modu ON m.id_modulo = modu.id_modulo
    JOIN menu_perfil mp ON m.id_menu = mp.id_menu 
    WHERE m.estado = 'A'
    AND mp.id_perfil IN (
        SELECT id_perfil FROM usuario_perfil WHERE id_usuario = :userId
    )
    ORDER BY modu.nombre, m.nombre
";
$stmt_menus = $conn->prepare($query_menus);
$stmt_menus->bindParam(':userId', $user['id_usuario']);
$stmt_menus->execute();

$menus = $stmt_menus->fetchAll(PDO::FETCH_ASSOC);

// Respuesta con los datos del usuario, el grupo empresarial, la compañía y los menús
$response = [
    'usuario' => $user['username'],
    'tipo_usuario' => $user['tipo_usuario'],
    'grupo_empresarial' => $user['grupo_empresarial_nombre'],  // Nombre del grupo empresarial
    'compania' => $user['compania_nombre'],  // Nombre de la compañía
    'menus' => $menus  // Agregar los menús a la respuesta
];

// Imprimir la respuesta antes de enviarla
error_log("Respuesta enviada al frontend: " . print_r($response, true));  

echo json_encode($response);
http_response_code(200);  // Código de estado 200 OK
?>
