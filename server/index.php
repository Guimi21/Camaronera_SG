<?php
// Incluir el autoload de Composer para cargar las dependencias
require_once __DIR__ . '/vendor/autoload.php';  // Asegúrate de que este sea el camino correcto hacia el autoload

// Incluir la configuración global
require_once 'config/config.php';  // Aquí se incluyen configuraciones de base de datos y otras variables globales

// Incluir los controladores necesarios
require_once('controller/AuthController.php');
require_once('controller/PiscinaController.php');
// Crear instancias de los controladores
$authController = new AuthController();
$piscinaController = new PiscinaController();

// Obtener la URL y el método de la solicitud (POST, GET, etc.)
$requestMethod = $_SERVER['REQUEST_METHOD'];
$requestUri = $_SERVER['REQUEST_URI'];

// Ruta para login (POST)
if ($requestMethod == 'POST' && $requestUri == '/auth/login.php') {
    // Obtener los parámetros del formulario
    $username = $_POST['username'];
    $password = $_POST['password'];
    
    // Llamar al controlador de autenticación para hacer login
    $authController->login($username, $password);
}

// Ruta para crear una nueva piscina (POST)
elseif ($requestMethod == 'POST' && $requestUri == '/piscinas') {
    // Llamar al controlador de piscinas para crear la piscina
    $piscinaController->createPiscina();
}

// Ruta para obtener todas las piscinas (GET)
elseif ($requestMethod == 'GET' && $requestUri == '/piscinas') {
    // Llamar al controlador de piscinas para obtener todas las piscinas
    $piscinaController->getPiscinas();
}

// Si la ruta no es válida, responder con un error 404
else {
    header("HTTP/1.1 404 Not Found");
    echo json_encode(['error' => 'Ruta no encontrada']);
}

// Mostrar mensaje de servidor iniciado correctamente

?>
