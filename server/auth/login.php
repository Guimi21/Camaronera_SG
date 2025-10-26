<?php
require_once(__DIR__ . '/../config/config.php');  // Incluir configuración
require_once(__DIR__ . '/../helpers/response.php');  // Función para enviar respuestas
require_once(__DIR__ . '/../helpers/cors.php');  // Configuración CORS centralizada

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
$query = "SELECT u.id_usuario, u.nombre, u.username, u.password_hash, uc.id_compania, c.nombre AS compania_nombre, c.id_grupo_empresarial, ge.nombre AS grupo_empresarial_nombre 
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

// Obtener los perfiles asociados al usuario
$query_perfiles = "
    SELECT p.id_perfil, p.nombre
    FROM perfil p
    JOIN usuario_perfil up ON p.id_perfil = up.id_perfil
    WHERE up.id_usuario = :userId
    ORDER BY p.nombre
";
$stmt_perfiles = $conn->prepare($query_perfiles);
$stmt_perfiles->bindParam(':userId', $user['id_usuario']);
$stmt_perfiles->execute();

$perfiles = $stmt_perfiles->fetchAll(PDO::FETCH_ASSOC);

// Obtener todas las compañías asociadas al usuario
$query_companias = "
    SELECT c.id_compania, c.nombre
    FROM compania c
    JOIN usuario_compania uc ON c.id_compania = uc.id_compania
    WHERE uc.id_usuario = :userId
    ORDER BY c.nombre
";
$stmt_companias = $conn->prepare($query_companias);
$stmt_companias->bindParam(':userId', $user['id_usuario']);
$stmt_companias->execute();

$companias = $stmt_companias->fetchAll(PDO::FETCH_ASSOC);

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

// Respuesta con los datos del usuario, el grupo empresarial, la compañía, los perfiles y los menús
$response = [
    'id_usuario' => $user['id_usuario'],  // ID del usuario
    'nombre' => $user['nombre'],  // Nombre del usuario
    'usuario' => $user['username'], // Nickname del usuario
    'perfiles' => $perfiles,  // Array de perfiles del usuario
    'grupo_empresarial' => $user['grupo_empresarial_nombre'],  // Nombre del grupo empresarial
    'companias' => $companias,  // Array de todas las compañías del usuario
    'compania' => $companias[0]['nombre'] ?? null,  // Nombre de la primera compañía
    'id_compania' => $companias[0]['id_compania'] ?? null,  // ID de la primera compañía
    'menus' => $menus  // Agregar los menús a la respuesta
];

// Imprimir la respuesta antes de enviarla
error_log("Respuesta enviada al frontend: " . print_r($response, true));  

echo json_encode($response);
http_response_code(200);  // Código de estado 200 OK
?>
