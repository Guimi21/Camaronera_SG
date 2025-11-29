<?php
// Incluir el autoload de Composer para cargar las dependencias
require_once __DIR__ . '/vendor/autoload.php';  // Asegúrate de que este sea el camino correcto hacia el autoload

// Incluir la configuración global
require_once 'config/config.php';

// Incluir configuración CORS centralizada
require_once 'helpers/Cors.php';

// Obtener la URL y el método de la solicitud (POST, GET, etc.)
$requestMethod = $_SERVER['REQUEST_METHOD'];
$requestUri = $_SERVER['REQUEST_URI'];

// Enrutador básico
switch ($requestUri) {
    case '/auth/login':  // Ruta de login (sin .php)
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            // Aquí solo incluimos login.php, ya que la lógica ya está en el archivo
            require_once __DIR__ . '/auth/login.php';
        } else {
            // Responder con un método incorrecto
            header("HTTP/1.1 405 Method Not Allowed");
            echo json_encode(['error' => 'Método no permitido.']);
        }
        break;
           case '/module/cicloproductivo':  // Ruta para obtener los datos del ciclo productivo
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            // Incluir el archivo cicloproductivo.php
            require_once __DIR__ . '/module/cicloproductivo.php';
        } else {
            // Responder con un método incorrecto
            header("HTTP/1.1 405 Method Not Allowed");
            echo json_encode(['error' => 'Método no permitido.']);
        }
        break;

    default:
        // Si la ruta no es válida, responder con un error 404
        header("HTTP/1.1 404 Not Found");
        echo json_encode(['error' => 'Ruta no encontrada']);
}
