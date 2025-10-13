<?php
// Detectar el entorno automáticamente
$isProduction = false;

// Detectar el dominio/host
if (isset($_SERVER['HTTP_HOST'])) {
    $isProduction = $_SERVER['HTTP_HOST'] === 'camaron360.com' || 
                   $_SERVER['HTTP_HOST'] === 'www.camaron360.com' ||
                   strpos($_SERVER['HTTP_HOST'], 'camaron360.com') !== false;
}

if ($isProduction) {
    // Configuración de PRODUCCIÓN
    // Usar el dominio con el que se accedió (con o sin www)
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $hostname = $_SERVER['HTTP_HOST'] ?? 'camaron360.com';
    define('BASE_URL', $protocol . '://' . $hostname);
    define('DB_HOST', 'localhost');
    define('DB_USER', 'guimialc_root');
    define('DB_PASS', 'bdCamaronera360');
    define('DB_NAME', 'guimialc_sg_camaronera');
} else {
    // Configuración de DESARROLLO
    define('BASE_URL', 'http://localhost:3000');
    define('DB_HOST', 'localhost');
    define('DB_USER', 'root');
    define('DB_PASS', '');
    define('DB_NAME', 'sg_camaronera');
}

// Crear la conexión a la base de datos
try {
    $conn = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
    // Establecer el modo de errores de PDO
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Si la conexión es exitosa
   // echo "Conexión exitosa a la base de datos!";
} catch (PDOException $e) {
    // Si hay un error, mostrarlo
   
    die();
}
?>

