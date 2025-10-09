<?php
// Detectar el entorno automáticamente
$isProduction = false;

// Detectar el dominio/host
if (isset($_SERVER['HTTP_HOST'])) {
    $isProduction = $_SERVER['HTTP_HOST'] === 'camaron360.com' || 
                   strpos($_SERVER['HTTP_HOST'], 'camaron360.com') !== false;
}

if ($isProduction) {
    // Configuración de PRODUCCIÓN
    define('BASE_URL', 'https://camaron360.com');
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

