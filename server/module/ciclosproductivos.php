<?php
require_once(__DIR__ . '/../config/config.php');
require_once(__DIR__ . '/../helpers/response.php');

// Configuración de CORS
header("Access-Control-Allow-Origin: " . BASE_URL);
header("Access-Control-Allow-Methods: GET, OPTIONS");  
header("Access-Control-Allow-Headers: Content-Type, Authorization");  
header("Access-Control-Allow-Credentials: true");  
header('Content-Type: application/json');  

// Manejar solicitud OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit(0);  
}

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
    // Obtener filtros de los parámetros de la consulta
    $filters = [
        'piscina' => isset($_GET['piscina']) && $_GET['piscina'] !== 'todas' ? $_GET['piscina'] : null,
        'startDate' => isset($_GET['startDate']) && !empty($_GET['startDate']) ? $_GET['startDate'] : null,
        'endDate' => isset($_GET['endDate']) && !empty($_GET['endDate']) ? $_GET['endDate'] : null
    ];

    // Crear la consulta base
    $query = "
    SELECT
        p.codigo AS 'Piscina',
        p.hectareas AS 'Has',
        sc.fecha_siembra AS 'Fecha de siembra',
        s.dias_cultivo AS 'Dias cultivo',
        sc.cantidad_larvas AS 'Siembra / Larvas',
        sc.cantidad_por_hectarea AS 'Densidad',
        sc.tipo_siembra AS 'Tipo Siembra',
        s.peso_promedio AS 'Peso',
        s.incremento_peso AS 'Inc.P',
        s.biomasa_lbs AS 'Biomasa Lbs',
        cbd.cantidad AS 'Cantidad Balanceado',
        cbd.balanceado_acumulado AS 'Balanceado Acumulado',
        cbd.convercio_alimenticia AS 'Conversión Alimenticia',
        s.poblacion_actual AS 'Población actual',
        s.indice_supervivencia AS 'Sobrev. Actual %',
        s.observaciones AS 'Observaciones',
        s.fecha AS 'Fecha Seguimiento',
        SUM(CASE WHEN tb.nombre = '35% Balnova 2,2 mm' THEN cbd.cantidad ELSE 0 END) AS 'Balnova22',
        SUM(CASE WHEN tb.nombre = '35% Balnova 1,2 mm' THEN cbd.cantidad ELSE 0 END) AS 'Balnova12',
        SUM(CASE WHEN tb.nombre = '35% Balnova 0,8 mm' THEN cbd.cantidad ELSE 0 END) AS 'Balnova08'
    FROM
        ciclo_productivo cp
        INNER JOIN piscina p ON cp.id_piscina = p.id_piscina
        INNER JOIN siembra_cosecha sc ON cp.id_siembra_cosecha = sc.id_siembra_cosecha
        INNER JOIN seguimiento s ON s.id_piscina = p.id_piscina
        INNER JOIN consumo_balanceado_detalle cbd ON cbd.id_seguimiento = s.id_seguimiento
        LEFT JOIN tipo_balanceado tb ON cbd.id_tipo_balanceado = tb.id_tipo_balanceado
    WHERE
        cp.estado = 'EN_CURSO'  
    ";

    $params = [];

    // Aplicar filtros si están presentes
    if ($filters['piscina']) {
        $query .= " AND p.codigo = ?";
        $params[] = $filters['piscina'];
    }

    if ($filters['startDate'] && $filters['endDate']) {
        $query .= " AND s.fecha BETWEEN ? AND ?";
        $params[] = $filters['startDate'];
        $params[] = $filters['endDate'];
    }

    // Continuar con la consulta
    $query .= " GROUP BY 
       p.codigo, 
    p.hectareas, 
    sc.fecha_siembra, 
    sc.cantidad_por_hectarea,
    sc.tipo_siembra,
    s.dias_cultivo,
    sc.cantidad_larvas
    ORDER BY 
        s.fecha";

    // Preparar y ejecutar la consulta
    $stmt = $conn->prepare($query);
    
    // Vincular parámetros
    foreach ($params as $key => $value) {
        $stmt->bindValue($key + 1, $value);
    }
    
    $stmt->execute();

    // Obtener los resultados
    $cicloData = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Respuesta con los datos del ciclo productivo
    $response = [
        'success' => true,
        'data' => $cicloData,
        'total' => count($cicloData)
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