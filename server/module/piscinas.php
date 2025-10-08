<?php
require_once(__DIR__ . '/../config/config.php');
require_once(__DIR__ . '/../helpers/response.php');
require_once(__DIR__ . '/../helpers/cors.php');  // Configuración CORS centralizada

// Verificar que la conexión a la base de datos esté establecida
if (!isset($conn)) {
    $response = [
        'success' => false,
        'message' => 'Error de conexión a la base de datos'
    ];
    echo json_encode($response);
    http_response_code(500);
    exit();
}

// Manejar solicitudes GET para obtener piscinas
if ($_SERVER['REQUEST_METHOD'] == 'GET') {
    try {
        // Obtener parámetros de consulta
        $id_compania = isset($_GET['id_compania']) ? intval($_GET['id_compania']) : null;
        
        // Validar que se proporcione el id_compania
        if (!$id_compania) {
            $response = [
                'success' => false,
                'message' => 'ID de compañía requerido'
            ];
            echo json_encode($response);
            http_response_code(400);
            exit();
        }

        // Construir la consulta SQL simplificada
        $sql = "SELECT 
                    p.id_piscina,
                    p.codigo,
                    p.hectareas,
                    p.ubicacion,
                    p.id_compania
                FROM piscina p
                WHERE p.id_compania = :id_compania
                ORDER BY p.id_piscina";

        $stmt = $conn->prepare($sql);
        if (!$stmt) {
            throw new Exception("Error preparando consulta: " . implode(", ", $conn->errorInfo()));
        }

        $stmt->bindParam(':id_compania', $id_compania, PDO::PARAM_INT);
        
        if (!$stmt->execute()) {
            throw new Exception("Error ejecutando consulta: " . implode(", ", $stmt->errorInfo()));
        }

        $piscinas = [];

        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $piscinas[] = [
                'id_piscina' => $row['id_piscina'],
                'codigo' => $row['codigo'],
                'hectareas' => floatval($row['hectareas']),
                'ubicacion' => $row['ubicacion'],
                'id_compania' => $row['id_compania']
            ];
        }

        $response = [
            'success' => true,
            'data' => $piscinas,
            'message' => 'Piscinas obtenidas exitosamente',
            'total' => count($piscinas)
        ];

        echo json_encode($response);

    } catch (Exception $e) {
        $response = [
            'success' => false,
            'message' => 'Error: ' . $e->getMessage()
        ];
        echo json_encode($response);
        http_response_code(500);
    }
}

// Manejar solicitudes POST para crear nueva piscina
elseif ($_SERVER['REQUEST_METHOD'] == 'POST') {
    try {
        // Obtener datos del cuerpo de la solicitud
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            $response = [
                'success' => false,
                'message' => 'Datos no válidos'
            ];
            echo json_encode($response);
            http_response_code(400);
            exit();
        }

        // Validar campos requeridos
        $required_fields = ['codigo', 'hectareas', 'ubicacion', 'id_compania'];
        foreach ($required_fields as $field) {
            if (!isset($input[$field]) || empty($input[$field])) {
                $response = [
                    'success' => false,
                    'message' => "Campo requerido: $field"
                ];
                echo json_encode($response);
                http_response_code(400);
                exit();
            }
        }

        // Validar que el código no exista para la misma compañía
        $check_sql = "SELECT id_piscina FROM piscina WHERE codigo = :codigo AND id_compania = :id_compania";
        $check_stmt = $conn->prepare($check_sql);
        $check_stmt->bindParam(':codigo', $input['codigo'], PDO::PARAM_STR);
        $check_stmt->bindParam(':id_compania', $input['id_compania'], PDO::PARAM_INT);
        $check_stmt->execute();
        $check_result = $check_stmt->fetchAll(PDO::FETCH_ASSOC);

        if (count($check_result) > 0) {
            $response = [
                'success' => false,
                'message' => 'Ya existe una piscina con este código en la compañía'
            ];
            echo json_encode($response);
            http_response_code(400);
            exit();
        }

        // Insertar nueva piscina
        $insert_sql = "INSERT INTO piscina (codigo, hectareas, ubicacion, id_compania) VALUES (:codigo, :hectareas, :ubicacion, :id_compania)";
        $insert_stmt = $conn->prepare($insert_sql);
        
        if (!$insert_stmt) {
            throw new Exception("Error preparando consulta de inserción: " . implode(", ", $conn->errorInfo()));
        }

        $insert_stmt->bindParam(':codigo', $input['codigo'], PDO::PARAM_STR);
        $insert_stmt->bindParam(':hectareas', $input['hectareas'], PDO::PARAM_STR);
        $insert_stmt->bindParam(':ubicacion', $input['ubicacion'], PDO::PARAM_STR);
        $insert_stmt->bindParam(':id_compania', $input['id_compania'], PDO::PARAM_INT);

        if (!$insert_stmt->execute()) {
            throw new Exception("Error ejecutando inserción: " . implode(", ", $insert_stmt->errorInfo()));
        }

        $new_id = $conn->lastInsertId();

        $response = [
            'success' => true,
            'message' => 'Piscina creada exitosamente',
            'id_piscina' => $new_id
        ];

        echo json_encode($response);

    } catch (Exception $e) {
        $response = [
            'success' => false,
            'message' => 'Error: ' . $e->getMessage()
        ];
        echo json_encode($response);
        http_response_code(500);
    }
}

// Manejar solicitudes PUT para actualizar piscina
elseif ($_SERVER['REQUEST_METHOD'] == 'PUT') {
    try {
        // Obtener datos del cuerpo de la solicitud
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            $response = [
                'success' => false,
                'message' => 'Datos no válidos'
            ];
            echo json_encode($response);
            http_response_code(400);
            exit();
        }

        // Validar campos requeridos
        $required_fields = ['id_piscina', 'codigo', 'hectareas', 'ubicacion', 'id_compania'];
        foreach ($required_fields as $field) {
            if (!isset($input[$field]) || empty($input[$field])) {
                $response = [
                    'success' => false,
                    'message' => "Campo requerido: $field"
                ];
                echo json_encode($response);
                http_response_code(400);
                exit();
            }
        }

        // Validar que el código no exista para otra piscina de la misma compañía
        $check_sql = "SELECT id_piscina FROM piscina WHERE codigo = :codigo AND id_compania = :id_compania AND id_piscina != :id_piscina";
        $check_stmt = $conn->prepare($check_sql);
        $check_stmt->bindParam(':codigo', $input['codigo'], PDO::PARAM_STR);
        $check_stmt->bindParam(':id_compania', $input['id_compania'], PDO::PARAM_INT);
        $check_stmt->bindParam(':id_piscina', $input['id_piscina'], PDO::PARAM_INT);
        $check_stmt->execute();
        $check_result = $check_stmt->fetchAll(PDO::FETCH_ASSOC);

        if (count($check_result) > 0) {
            $response = [
                'success' => false,
                'message' => 'Ya existe otra piscina con este código en la compañía'
            ];
            echo json_encode($response);
            http_response_code(400);
            exit();
        }

        // Actualizar piscina
        $update_sql = "UPDATE piscina SET codigo = :codigo, hectareas = :hectareas, ubicacion = :ubicacion WHERE id_piscina = :id_piscina AND id_compania = :id_compania";
        $update_stmt = $conn->prepare($update_sql);
        
        if (!$update_stmt) {
            throw new Exception("Error preparando consulta de actualización: " . implode(", ", $conn->errorInfo()));
        }

        $update_stmt->bindParam(':codigo', $input['codigo'], PDO::PARAM_STR);
        $update_stmt->bindParam(':hectareas', $input['hectareas'], PDO::PARAM_STR);
        $update_stmt->bindParam(':ubicacion', $input['ubicacion'], PDO::PARAM_STR);
        $update_stmt->bindParam(':id_piscina', $input['id_piscina'], PDO::PARAM_INT);
        $update_stmt->bindParam(':id_compania', $input['id_compania'], PDO::PARAM_INT);

        if (!$update_stmt->execute()) {
            throw new Exception("Error ejecutando actualización: " . implode(", ", $update_stmt->errorInfo()));
        }

        if ($update_stmt->rowCount() === 0) {
            $response = [
                'success' => false,
                'message' => 'No se encontró la piscina o no se realizaron cambios'
            ];
            echo json_encode($response);
            http_response_code(404);
        } else {
            $response = [
                'success' => true,
                'message' => 'Piscina actualizada exitosamente'
            ];
            echo json_encode($response);
        }

    } catch (Exception $e) {
        $response = [
            'success' => false,
            'message' => 'Error: ' . $e->getMessage()
        ];
        echo json_encode($response);
        http_response_code(500);
    }
}

// Manejar solicitudes DELETE para eliminar piscina
elseif ($_SERVER['REQUEST_METHOD'] == 'DELETE') {
    try {
        // Obtener el ID de la piscina de los parámetros de consulta
        $id_piscina = isset($_GET['id_piscina']) ? intval($_GET['id_piscina']) : null;
        $id_compania = isset($_GET['id_compania']) ? intval($_GET['id_compania']) : null;
        
        if (!$id_piscina || !$id_compania) {
            $response = [
                'success' => false,
                'message' => 'ID de piscina e ID de compañía requeridos'
            ];
            echo json_encode($response);
            http_response_code(400);
            exit();
        }

        // Verificar si la piscina tiene ciclos asociados
        $check_cycles_sql = "SELECT COUNT(*) as cycle_count FROM ciclo WHERE id_piscina = :id_piscina";
        $check_cycles_stmt = $conn->prepare($check_cycles_sql);
        $check_cycles_stmt->bindParam(':id_piscina', $id_piscina, PDO::PARAM_INT);
        $check_cycles_stmt->execute();
        $cycles_row = $check_cycles_stmt->fetch(PDO::FETCH_ASSOC);

        if ($cycles_row['cycle_count'] > 0) {
            $response = [
                'success' => false,
                'message' => 'No se puede eliminar la piscina porque tiene ciclos asociados'
            ];
            echo json_encode($response);
            http_response_code(400);
            exit();
        }

        // Eliminar piscina
        $delete_sql = "DELETE FROM piscina WHERE id_piscina = :id_piscina AND id_compania = :id_compania";
        $delete_stmt = $conn->prepare($delete_sql);
        
        if (!$delete_stmt) {
            throw new Exception("Error preparando consulta de eliminación: " . implode(", ", $conn->errorInfo()));
        }

        $delete_stmt->bindParam(':id_piscina', $id_piscina, PDO::PARAM_INT);
        $delete_stmt->bindParam(':id_compania', $id_compania, PDO::PARAM_INT);

        if (!$delete_stmt->execute()) {
            throw new Exception("Error ejecutando eliminación: " . implode(", ", $delete_stmt->errorInfo()));
        }

        if ($delete_stmt->rowCount() === 0) {
            $response = [
                'success' => false,
                'message' => 'No se encontró la piscina'
            ];
            echo json_encode($response);
            http_response_code(404);
        } else {
            $response = [
                'success' => true,
                'message' => 'Piscina eliminada exitosamente'
            ];
            echo json_encode($response);
        }

    } catch (Exception $e) {
        $response = [
            'success' => false,
            'message' => 'Error: ' . $e->getMessage()
        ];
        echo json_encode($response);
        http_response_code(500);
    }
}

// Método no permitido
else {
    $response = [
        'success' => false,
        'message' => 'Método no permitido'
    ];
    echo json_encode($response);
    http_response_code(405);
}
?>