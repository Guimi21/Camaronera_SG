<?php
require_once 'config/config.php';

class Piscina {
    private $codigo;
    private $hectareas;
    private $ubicacion;

    // Constructor
    public function __construct($codigo, $hectareas, $ubicacion) {
        $this->codigo = $codigo;
        $this->hectareas = $hectareas;
        $this->ubicacion = $ubicacion;
    }

    // Guardar piscina en la base de datos
    public function save() {
        $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        if ($conn->connect_error) {
            die("Conexión fallida: " . $conn->connect_error);
        }

        $stmt = $conn->prepare("INSERT INTO piscinas (codigo, hectareas, ubicacion) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $this->codigo, $this->hectareas, $this->ubicacion);

        if ($stmt->execute()) {
            $stmt->close();
            $conn->close();
            return true;
        } else {
            $stmt->close();
            $conn->close();
            return false;
        }
    }

    // Obtener todas las piscinas
    public static function getAll() {
        $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        if ($conn->connect_error) {
            die("Conexión fallida: " . $conn->connect_error);
        }

        $result = $conn->query("SELECT * FROM piscinas");
        $piscinas = [];
        while ($row = $result->fetch_assoc()) {
            $piscinas[] = $row;
        }

        $conn->close();
        return $piscinas;
    }
}
