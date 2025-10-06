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

try {
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

    // Crear la consulta para obtener ciclos productivos activos con información de piscina
    $query = "
    SELECT 
        cp.id_ciclo,
        p.codigo AS codigo_piscina,
        p.hectareas,
        cp.fecha_siembra,
        cp.cantidad_siembra,
        cp.densidad,
        cp.tipo_siembra,
        cp.id_compania
    FROM 
        ciclo_productivo cp
        INNER JOIN piscina p ON cp.id_piscina = p.id_piscina
    WHERE 
        cp.id_compania = ?
        AND cp.estado = 'EN_CURSO'
    ORDER BY 
        p.id_piscina, cp.fecha_siembra DESC
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