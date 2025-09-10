<?php

define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', ''); // Cambia esto por tu contraseña de MySQL
define('DB_NAME', 'sg_camaronera'); // Nombre de la base de datos

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

