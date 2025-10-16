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

// Determinar el método de la solicitud
$method = $_SERVER['REQUEST_METHOD'];

try {
    // Manejar solicitud POST para crear un nuevo ciclo productivo
    if ($method === 'POST') {
        // Leer el cuerpo de la solicitud JSON
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Validar campos requeridos
        if (!isset($input['id_piscina']) || empty($input['id_piscina'])) {
            $response = [
                'success' => false,
                'message' => 'ID de piscina requerido'
            ];
            echo json_encode($response);
            http_response_code(400);
            exit();
        }
        
        if (!isset($input['fecha_siembra']) || empty($input['fecha_siembra'])) {
            $response = [
                'success' => false,
                'message' => 'Fecha de siembra requerida'
            ];
            echo json_encode($response);
            http_response_code(400);
            exit();
        }
        
        if (!isset($input['cantidad_siembra']) || empty($input['cantidad_siembra'])) {
            $response = [
                'success' => false,
                'message' => 'Cantidad de siembra requerida'
            ];
            echo json_encode($response);
            http_response_code(400);
            exit();
        }
        
        if (!isset($input['densidad']) || empty($input['densidad'])) {
            $response = [
                'success' => false,
                'message' => 'Densidad requerida'
            ];
            echo json_encode($response);
            http_response_code(400);
            exit();
        }
        
        if (!isset($input['tipo_siembra']) || empty($input['tipo_siembra'])) {
            $response = [
                'success' => false,
                'message' => 'Tipo de siembra requerido'
            ];
            echo json_encode($response);
            http_response_code(400);
            exit();
        }
        
        if (!isset($input['estado']) || empty($input['estado'])) {
            $response = [
                'success' => false,
                'message' => 'Estado requerido'
            ];
            echo json_encode($response);
            http_response_code(400);
            exit();
        }
        
        if (!isset($input['id_compania']) || empty($input['id_compania'])) {
            $response = [
                'success' => false,
                'message' => 'ID de compañía requerido'
            ];
            echo json_encode($response);
            http_response_code(400);
            exit();
        }
        
        if (!isset($input['id_usuario_crea']) || empty($input['id_usuario_crea'])) {
            $response = [
                'success' => false,
                'message' => 'ID de usuario requerido'
            ];
            echo json_encode($response);
            http_response_code(400);
            exit();
        }
        
        // id_usuario_actualiza es opcional, si no se envía, usar id_usuario_crea
        $id_usuario_actualiza = isset($input['id_usuario_actualiza']) && !empty($input['id_usuario_actualiza']) 
            ? $input['id_usuario_actualiza'] 
            : $input['id_usuario_crea'];
        
        // Insertar el nuevo ciclo productivo
        $query = "
            INSERT INTO ciclo_productivo (
                id_piscina,
                fecha_siembra,
                fecha_cosecha,
                cantidad_siembra,
                densidad,
                tipo_siembra,
                estado,
                id_compania,
                id_usuario_crea,
                id_usuario_actualiza
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ";
        
        $stmt = $conn->prepare($query);
        $stmt->bindValue(1, $input['id_piscina'], PDO::PARAM_INT);
        $stmt->bindValue(2, $input['fecha_siembra']);
        $stmt->bindValue(3, $input['fecha_cosecha'] ?? null);
        $stmt->bindValue(4, $input['cantidad_siembra'], PDO::PARAM_INT);
        $stmt->bindValue(5, $input['densidad']);
        $stmt->bindValue(6, $input['tipo_siembra']);
        $stmt->bindValue(7, $input['estado']);
        $stmt->bindValue(8, $input['id_compania'], PDO::PARAM_INT);
        $stmt->bindValue(9, $input['id_usuario_crea'], PDO::PARAM_INT);
        $stmt->bindValue(10, $id_usuario_actualiza, PDO::PARAM_INT);
        
        $stmt->execute();
        
        $id_ciclo = $conn->lastInsertId();
        
        $response = [
            'success' => true,
            'message' => 'Ciclo productivo creado exitosamente',
            'id_ciclo' => $id_ciclo
        ];
        
        echo json_encode($response);
        http_response_code(201);
        exit();
    }
    
    // Manejar solicitud GET para obtener ciclos productivos
    if ($method === 'GET') {
        // Obtener id_compania de los parámetros de la consulta
        $id_compania = isset($_GET['id_compania']) && !empty($_GET['id_compania']) ? $_GET['id_compania'] : null;
        
        if (!$id_compania) {
            $response = [
                'success' => false,
                'message' => 'ID de compañía requerido'
            ];
            echo json_encode($response);
            http_response_code(400);
            exit();
        }

        // Crear la consulta para obtener ciclos productivos con información de piscina
        $query = "
        SELECT 
            cp.id_ciclo,
            cp.id_piscina,
            p.codigo AS codigo_piscina,
            p.hectareas,
            cp.fecha_siembra,
            cp.fecha_cosecha,
            cp.cantidad_siembra,
            cp.densidad,
            cp.tipo_siembra,
            cp.estado,
            cp.id_compania
        FROM 
            ciclo_productivo cp
            INNER JOIN piscina p ON cp.id_piscina = p.id_piscina
        WHERE 
            cp.id_compania = ?
        ORDER BY 
            cp.fecha_siembra DESC, p.codigo
        ";

        // Preparar y ejecutar la consulta
        $stmt = $conn->prepare($query);
        $stmt->bindValue(1, $id_compania);
        $stmt->execute();

        // Obtener los resultados
        $ciclos = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Respuesta con los datos de los ciclos productivos
        $response = [
            'success' => true,
            'data' => $ciclos,
            'total' => count($ciclos)
        ];

        echo json_encode($response);
        http_response_code(200);
        exit();
    }
    
    // Método no permitido
    $response = [
        'success' => false,
        'message' => 'Método no permitido'
    ];
    echo json_encode($response);
    http_response_code(405);
    
} catch (PDOException $e) {
    error_log("Error en la consulta: " . $e->getMessage());
    
    $response = [
        'success' => false,
        'message' => 'Error al obtener los datos',
        'error' => $e->getMessage()
    ];
    
    echo json_encode($response);
    http_response_code(500);
    
} catch (Exception $e) {
    error_log("Error general: " . $e->getMessage());
    
    $response = [
        'success' => false,
        'message' => 'Error interno del servidor'
    ];
    
    echo json_encode($response);
    http_response_code(500);
}
?>