<?php
/**
 * Bootstrap - Archivo centralizado de inicialización
 * Incluye automáticamente todas las dependencias necesarias
 * Utilizar este archivo en todos los módulos
 */

// Guard para evitar inclusiones múltiples
if (defined('BOOTSTRAP_INCLUDED')) {
    return;
}
define('BOOTSTRAP_INCLUDED', true);

// Incluir autoload de Composer para cargar las dependencias
require_once __DIR__ . '/vendor/autoload.php';

// Incluir la configuración global
require_once __DIR__ . '/config/config.php';

// Incluir constantes centralizadas
require_once __DIR__ . '/helpers/Constants.php';

// Incluir excepciones personalizadas
require_once __DIR__ . '/helpers/CustomExceptions.php';

// Incluir helpers de respuesta
require_once __DIR__ . '/helpers/Response.php';

// Incluir manejo de errores
require_once __DIR__ . '/helpers/ErrorHandler.php';

// Incluir validación de solicitudes
require_once __DIR__ . '/helpers/RequestValidator.php';

// Incluir constructor de consultas
require_once __DIR__ . '/helpers/DatabaseQueryBuilder.php';

// Incluir configuración CORS
require_once __DIR__ . '/helpers/Cors.php';

// Establecer headers JSON por defecto
header('Content-Type: application/json; charset=utf-8');

// Manejo automático de solicitudes OPTIONS (preflight CORS)
RequestValidator::handleOptions();
