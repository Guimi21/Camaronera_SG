<?php
require_once 'controller/AuthController.php';
require_once 'controller/PiscinaController.php';

$authController = new AuthController();
$piscinaController = new PiscinaController();

// Ruta para login (POST)
if ($_SERVER['REQUEST_METHOD'] == 'POST' && $_SERVER['REQUEST_URI'] == '/auth/login') {
    $username = $_POST['username'];
    $password = $_POST['password'];
    $authController->login($username, $password);
}

if ($_SERVER['REQUEST_METHOD'] == 'POST' && $_SERVER['REQUEST_URI'] == '/auth/menus') {
    $userId = $_POST['userId'];
    $authController->getMenus($userId); 
}

if($_SERVER['REQUEST_METHOD'] == 'POST' && $_SERVER['REQUEST_URI'] == '/auth/perfiles') {
    $userId = $_POST['userId'];
    $authController->getUsuarioPerfiles($userId); 
}

if($_SERVER['REQUEST_METHOD'] == 'POST' && $_SERVER['REQUEST_URI'] == '/auth/perfilQueries') {
    $perfilId = $_POST['perfilId'];
    $authController->profileQueries($perfilId); 
}
if($_SERVER['REQUEST_METHOD'] == 'POST' && $_SERVER['REQUEST_URI'] == '/auth/userProfiles') {
    $userId = $_POST['userId'];
    $authController->getUserProfiles($userId);
}
// Ruta para crear piscina (POST)
if ($_SERVER['REQUEST_METHOD'] == 'POST' && $_SERVER['REQUEST_URI'] == '/piscinas') {
    $piscinaController->createPiscina();
}

// Ruta para obtener todas las piscinas (GET)
if ($_SERVER['REQUEST_METHOD'] == 'GET' && $_SERVER['REQUEST_URI'] == '/piscinas') {
    $piscinaController->getPiscinas();
}
