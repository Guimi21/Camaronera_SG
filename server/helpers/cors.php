<?php
/**
 * Configuración CORS centralizada
 * Este archivo maneja los headers CORS de forma consistente en toda la aplicación
 */

function setupCORS() {
    // Obtener el origen de la solicitud
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
    
    // Lista de orígenes permitidos
    $allowedOrigins = [
        'https://camaron360.com',
        'https://www.camaron360.com',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://10.0.2.2:5000',
    ];
    
    // Si el origen está en la lista permitida, configurar CORS
    if (in_array($origin, $allowedOrigins)) {
        header("Access-Control-Allow-Origin: " . $origin);
    } else if (defined('BASE_URL')) {
        // Fallback al BASE_URL configurado
        header("Access-Control-Allow-Origin: " . BASE_URL);
    }
    
    // Headers CORS estándar
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Max-Age: 86400"); // Cache preflight por 24 horas
    header('Content-Type: application/json; charset=utf-8');
    
    // Manejar solicitudes preflight OPTIONS
    if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
        http_response_code(200);
        exit(0);
    }
}

// Llamar automáticamente la función cuando se incluya el archivo
setupCORS();