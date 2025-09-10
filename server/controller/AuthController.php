<?php
require_once(__DIR__ . '/../config/config.php');  

class AuthController {

    // Login de usuario
    public function login($username, $password) {
        global $conn;
        $query = "SELECT * FROM users WHERE username = :username LIMIT 1";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':username', $username);
        $stmt->execute();

        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && password_verify($password, $user['password'])) {
            // Autenticación exitosa
            return [
                'status' => 'success',
                'message' => 'Login successful',
                'data' => $user
            ];
        } else {
            // Credenciales incorrectas
            return [
                'status' => 'error',
                'message' => 'Invalid credentials'
            ];
        }
    }

    // Registro de usuario
    public function register($username, $password) {
        global $conn;
        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
        $query = "INSERT INTO users (username, password) VALUES (:username, :password)";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':username', $username);
        $stmt->bindParam(':password', $hashedPassword);

        if ($stmt->execute()) {
            return [
                'status' => 'success',
                'message' => 'User registered successfully'
            ];
        } else {
            return [
                'status' => 'error',
                'message' => 'User registration failed'
            ];
        }
    }
}
?>
