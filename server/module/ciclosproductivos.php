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
    cp.fecha_siembra AS 'Fecha de siembra',
    s.dias_cultivo AS 'Dias cultivo',
    cp.cantidad_larvas AS 'Siembra / Larvas',
    cp.cantidad_por_hectarea AS 'Densidad',
    cp.tipo_siembra AS 'Tipo Siembra',
    s.peso_promedio AS 'Peso',
    s.incremento_peso AS 'Inc.P',
    s.biomasa_lbs AS 'Biomasa Lbs',
    COALESCE(SUM(CASE WHEN tb.nombre = 'Balnova 2,2 mm' THEN cbd.cantidad ELSE 0 END), 0) AS 'Balnova22',
    COALESCE(SUM(CASE WHEN tb.nombre = 'Balnova 1,2 mm' THEN cbd.cantidad ELSE 0 END), 0) AS 'Balnova12',
    COALESCE(SUM(CASE WHEN tb.nombre = 'Balnova 0,8 mm' THEN cbd.cantidad ELSE 0 END), 0) AS 'Balnova08',
    MAX(cb.balanceado_acumulado) AS 'Balanceado Acumulado',
    MAX(cb.convercion_alimenticia) AS 'Conversión Alimenticia',
    s.poblacion_actual AS 'Población actual',
    s.indice_supervivencia AS 'Sobrev. Actual %',
    s.observaciones AS 'Observaciones',
    s.fecha AS 'Fecha Seguimiento'
FROM
    piscina p
    INNER JOIN ciclo_productivo cp ON cp.id_piscina = p.id_piscina
    INNER JOIN (
        SELECT
            s.id_seguimiento,
            s.id_ciclo,
            s.dias_cultivo,
            s.peso_promedio,
            s.incremento_peso,
            s.biomasa_lbs,
            s.poblacion_actual,
            s.indice_supervivencia,
            s.observaciones,
            s.fecha
        FROM seguimiento s
        WHERE s.id_ciclo IN (
            SELECT id_ciclo FROM ciclo_productivo WHERE estado = 'EN_CURSO'
        )
    ) s ON s.id_ciclo = cp.id_ciclo
    LEFT JOIN consumo_balanceado cb ON cb.id_seguimiento = s.id_seguimiento  
    LEFT JOIN consumo_balanceado_detalle cbd ON cbd.id_consumo_balanceado = cb.id_consumo_balanceado
    LEFT JOIN tipo_balanceado tb ON cbd.id_tipo_balanceado = tb.id_tipo_balanceado
";

    // Condiciones dinámicas para el WHERE
    $whereCondition = " WHERE 1 = 1 ";

    // Aplicar filtros de piscina y fechas
    $params = [];
    if ($filters['piscina']) {
        // Si se filtra por piscina específica
        $whereCondition .= " AND p.codigo = ?";
        $params[] = $filters['piscina'];
    } else {
        // Si piscina es 'todas', manejar los filtros de fecha
        if ($filters['startDate'] && $filters['endDate']) {
            $whereCondition .= " AND s.fecha BETWEEN ? AND ?";
            $params[] = $filters['startDate'];
            $params[] = $filters['endDate'];
        } else {
            // Si no hay filtro de fecha, traer solo la última fecha de seguimiento por piscina
            $whereCondition .= " AND s.fecha = (SELECT MAX(fecha) FROM seguimiento WHERE id_ciclo IN (SELECT id_ciclo FROM ciclo_productivo WHERE id_piscina = p.id_piscina))";
        }
    }

    // Continuar con la consulta
    $query .= $whereCondition . "
    GROUP BY
    p.codigo,
    p.hectareas,
    sc.fecha_siembra,
    sc.cantidad_por_hectarea,
    sc.tipo_siembra,
    s.dias_cultivo,
    sc.cantidad_larvas,
    s.peso_promedio,
    s.incremento_peso,
    s.biomasa_lbs,
    s.poblacion_actual,
    s.indice_supervivencia,
    s.observaciones,
    s.fecha
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
