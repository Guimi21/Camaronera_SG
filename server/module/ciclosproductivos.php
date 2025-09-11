<?php
require_once(__DIR__ . '/../config/config.php');  // Archivo de configuración de la base de datos
require_once(__DIR__ . '/../helpers/response.php');  // Función para enviar respuestas

// Configuración de CORS
header("Access-Control-Allow-Origin: http://localhost:3000");  
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
        'endDate' => isset($_GET['endDate']) && !empty($_GET['endDate']) ? $_GET['endDate'] : null,
        'tipoSiembra' => isset($_GET['tipoSiembra']) && $_GET['tipoSiembra'] !== 'todos' ? $_GET['tipoSiembra'] : null
    ];

    // Crear la consulta base
    $query = "
    SELECT
        p.codigo AS 'Piscina',
        p.hectareas AS 'Has',
        sc.fecha_siembra AS 'Fecha de siembra',
        SUM(s.dias_cultivo) AS 'Dias cultivo',
        sc.tipo_siembra AS 'Siembra / Larvas',
        SUM(sc.cantidad_larvas) AS 'Densidad',
        sc.tipo_siembra AS 'Tipo Siembra',
        AVG(s.peso_promedio) AS 'Peso',
        AVG(s.incremento_peso) AS 'Inc.P',
        SUM(s.biomasa_lbs) AS 'Biomasa Lbs',
        SUM(cbd.cantidad) AS 'Cantidad Balanceado',
        SUM(cbd.balanceado_acumulado) AS 'Balanceado Acumulado',
        SUM(cbd.convercio_alimenticia) AS 'Conversión Alimenticia',
        SUM(s.poblacion_actual) AS 'Población actual',
        AVG(s.indice_supervivencia) AS 'Sobrev. Actual %',
        GROUP_CONCAT(s.observaciones) AS 'Observaciones',
        tb1.nombre AS '35% Balnova 2,2',  -- Nueva columna
        tb2.nombre AS '35% Balnova 1,2 mm',  -- Nueva columna
        tb3.nombre AS '35% Balnova 0,8 mm'   -- Nueva columna
    FROM
        ciclo_productivo cp
        INNER JOIN piscina p ON cp.id_piscina = p.id_piscina
        INNER JOIN siembra_cosecha sc ON cp.id_siembra_cosecha = sc.id_siembra_cosecha
        INNER JOIN seguimiento s ON s.id_piscina = p.id_piscina
        INNER JOIN consumo_balanceado_detalle cbd ON cbd.id_seguimiento = s.id_seguimiento
        LEFT JOIN tipo_balanceado tb1 ON cbd.id_tipo_balanceado = tb1.id_tipo_balanceado AND tb1.nombre = '2,2'  -- Relación con la tabla tipo_balanceado para el balanceado 2,2
        LEFT JOIN tipo_balanceado tb2 ON cbd.id_tipo_balanceado = tb2.id_tipo_balanceado AND tb2.nombre = '1,2 mm'  -- Relación con la tabla tipo_balanceado para el balanceado 1,2 mm
        LEFT JOIN tipo_balanceado tb3 ON cbd.id_tipo_balanceado = tb3.id_tipo_balanceado AND tb3.nombre = '0,8 mm'  -- Relación con la tabla tipo_balanceado para el balanceado 0,8 mm
    WHERE
        cp.estado = 'EN_CURSO'  
";

    $params = [];

    // Agregar condiciones a la consulta según los filtros
    if ($filters['startDate'] && $filters['endDate']) {
        $query .= " AND sc.fecha_siembra BETWEEN ? AND ?";  // Aquí se añaden las fechas
        $params[] = $filters['startDate'];
        $params[] = $filters['endDate'];
    }

    if ($filters['piscina']) {
        $query .= " AND p.codigo = ?";
        $params[] = $filters['piscina'];
    }

    if ($filters['tipoSiembra']) {
        $query .= " AND sc.tipo_siembra = ?";
        $params[] = $filters['tipoSiembra'];
    }

    // Continuar con la consulta
    $query .= " GROUP BY p.codigo, p.hectareas, sc.fecha_siembra, sc.tipo_siembra ORDER BY sc.fecha_siembra";

    // Preparar y ejecutar la consulta
    $stmt = $conn->prepare($query);
    
    // Vincular parámetros posicionales
    foreach ($params as $key => $value) {
        $stmt->bindValue($key + 1, $value);  // Usar 1 basado en el índice para los parámetros posicionales
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
    // Log del error (en producción, usar un sistema de logging)
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
