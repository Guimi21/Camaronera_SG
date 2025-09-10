<?php
require_once 'model/Piscina.php';

class PiscinaController {
    // Crear una nueva piscina
    public function createPiscina() {
        $data = json_decode(file_get_contents("php://input"));
        if (isset($data->codigo) && isset($data->hectareas)) {
            $piscina = new Piscina($data->codigo, $data->hectareas, $data->ubicacion);
            if ($piscina->save()) {
                echo json_encode(['message' => 'Piscina creada correctamente']);
            } else {
                echo json_encode(['error' => 'Error al crear piscina']);
            }
        } else {
            echo json_encode(['error' => 'Datos incompletos']);
        }
    }

    // Obtener todas las piscinas
    public function getPiscinas() {
        $piscinas = Piscina::getAll();
        echo json_encode($piscinas);
    }
}
?>
