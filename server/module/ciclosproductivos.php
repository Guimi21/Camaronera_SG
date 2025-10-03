<?php
require_once(__DIR__ . '/../config/config.php');
require_once(__DIR__ . '/../helpers/response.php');

// Configuración de CORS
header("Access-Control-Allow-Origin: " . BASE_URL);
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");  
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

// Manejar solicitudes POST para crear registros de seguimiento
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
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
        if (!isset($input['id_ciclo']) || empty($input['id_ciclo'])) {
            $response = [
                'success' => false,
                'message' => 'ID de ciclo requerido'
            ];
            echo json_encode($response);
            http_response_code(400);
            exit();
        }

        if (!isset($input['id_usuario']) || empty($input['id_usuario'])) {
            $response = [
                'success' => false,
                'message' => 'ID de usuario requerido'
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

        // Insertar nuevo registro de seguimiento
        $insertQuery = "
        INSERT INTO seguimiento (
            id_ciclo,
            dias_cultivo,
            peso_promedio,
            incremento_peso,
            biomasa_lbs,
            balanceado_acumulado,
            convercion_alimenticia,
            poblacion_actual,
            indice_supervivencia,
            observaciones,
            fecha_seguimiento,
            id_compania,
            id_usuario_crea,
            id_usuario_actualiza
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ";

        // Verificar que el ciclo productivo existe (validación de seguridad)
        $cicloQuery = "SELECT id_ciclo FROM ciclo_productivo WHERE id_ciclo = ? AND id_compania = ?";
        $cicloStmt = $conn->prepare($cicloQuery);
        $cicloStmt->bindValue(1, $input['id_ciclo']);
        $cicloStmt->bindValue(2, $input['id_compania']);
        $cicloStmt->execute();
        $cicloExists = $cicloStmt->fetch(PDO::FETCH_ASSOC);

        if (!$cicloExists) {
            $response = [
                'success' => false,
                'message' => 'Ciclo productivo no encontrado o no pertenece a su compañía'
            ];
            echo json_encode($response);
            http_response_code(404);
            exit();
        }

        // Log para debugging
        error_log("Creando seguimiento para ciclo ID: " . $input['id_ciclo'] . " por usuario ID: " . $input['id_usuario'] . " en compañía ID: " . $input['id_compania']);
        error_log("Datos recibidos: " . json_encode($input));
        
        $stmt = $conn->prepare($insertQuery);
        $stmt->bindValue(1, $input['id_ciclo']);
        $stmt->bindValue(2, $input['dias_cultivo'] ?? null);
        $stmt->bindValue(3, $input['peso'] ?? null);
        $stmt->bindValue(4, $input['inc'] ?? null);
        $stmt->bindValue(5, $input['biomasa_lbs'] ?? null);
        $stmt->bindValue(6, $input['balanceado_acu'] ?? null);
        $stmt->bindValue(7, $input['conversion_alimenticia'] ?? null);
        $stmt->bindValue(8, $input['poblacion_actual'] ?? null);
        $stmt->bindValue(9, $input['supervivencia'] ?? null);
        $stmt->bindValue(10, $input['observaciones'] ?? null);
        $stmt->bindValue(11, $input['fecha_seguimiento'] ?? date('Y-m-d'));
        $stmt->bindValue(12, $input['id_compania']);
        $stmt->bindValue(13, $input['id_usuario']);
        $stmt->bindValue(14, $input['id_usuario']); // Mismo usuario para crea y actualiza en inserción

        if ($stmt->execute()) {
            $seguimientoId = $conn->lastInsertId();
            
            // Insertar registros de balanceado si están presentes
            if (!empty($input['balnova08']) || !empty($input['balnova12']) || !empty($input['balnova22'])) {
                error_log("Insertando registros de balanceado para seguimiento ID: " . $seguimientoId);
                $balanceadoQuery = "
                INSERT INTO consumo_balanceado (
                    id_seguimiento, 
                    id_tipo_balanceado, 
                    cantidad, 
                    id_compania, 
                    id_usuario_crea, 
                    id_usuario_actualiza
                ) VALUES (?, ?, ?, ?, ?, ?)
                ";
                $balanceadoStmt = $conn->prepare($balanceadoQuery);
                
                try {
                    // Balnova 2.2mm (asumiendo id_tipo_balanceado = 1)
                    if (!empty($input['balnova22'])) {
                        $balanceadoStmt->execute([
                            $seguimientoId, 
                            1, 
                            $input['balnova22'], 
                            $input['id_compania'], 
                            $input['id_usuario'], 
                            $input['id_usuario']
                        ]);
                        error_log("Insertado Balnova 2.2mm: " . $input['balnova22']);
                    }
                    // Balnova 1.2mm (asumiendo id_tipo_balanceado = 2)
                    if (!empty($input['balnova12'])) {
                        $balanceadoStmt->execute([
                            $seguimientoId, 
                            2, 
                            $input['balnova12'], 
                            $input['id_compania'], 
                            $input['id_usuario'], 
                            $input['id_usuario']
                        ]);
                        error_log("Insertado Balnova 1.2mm: " . $input['balnova12']);
                    }
                    // Balnova 0.8mm (asumiendo id_tipo_balanceado = 3)
                    if (!empty($input['balnova08'])) {
                        $balanceadoStmt->execute([
                            $seguimientoId, 
                            3, 
                            $input['balnova08'], 
                            $input['id_compania'], 
                            $input['id_usuario'], 
                            $input['id_usuario']
                        ]);
                        error_log("Insertado Balnova 0.8mm: " . $input['balnova08']);
                    }
                } catch (Exception $balanceadoError) {
                    error_log("Error al insertar balanceado: " . $balanceadoError->getMessage());
                    // No fallar toda la operación si hay error en balanceado
                }
            }

            $response = [
                'success' => true,
                'message' => 'Registro de seguimiento creado exitosamente',
                'data' => ['id_seguimiento' => $seguimientoId]
            ];
            echo json_encode($response);
            http_response_code(201);
        } else {
            throw new Exception("Error al insertar el registro");
        }

    } catch (Exception $e) {
        error_log("Error al crear seguimiento: " . $e->getMessage());
        $response = [
            'success' => false,
            'message' => 'Error al crear el registro de seguimiento'
        ];
        echo json_encode($response);
        http_response_code(500);
    }
    exit();
}

// Manejar solicitudes GET (código existente)
try {
    // Obtener filtros de los parámetros de la consulta
    $filters = [
        'piscina' => isset($_GET['piscina']) && $_GET['piscina'] !== 'todas' ? $_GET['piscina'] : null,
        'startDate' => isset($_GET['startDate']) && !empty($_GET['startDate']) ? $_GET['startDate'] : null,
        'endDate' => isset($_GET['endDate']) && !empty($_GET['endDate']) ? $_GET['endDate'] : null,
        'id_compania' => isset($_GET['id_compania']) && !empty($_GET['id_compania']) ? $_GET['id_compania'] : null
    ];

    // Crear la consulta base
    $query = "
    SELECT
        p.codigo AS 'Piscina',
        p.hectareas AS 'Has',
        cp.fecha_siembra AS 'Fecha de siembra',
        s.dias_cultivo AS 'Dias cultivo',
        cp.cantidad_siembra AS 'Siembra / Larvas',
        cp.densidad AS 'Densidad',
        cp.tipo_siembra AS 'Tipo Siembra',
        s.peso_promedio AS 'Peso',
        s.incremento_peso AS 'Inc.P',
        s.biomasa_lbs AS 'Biomasa Lbs',
        COALESCE(SUM(CASE WHEN tb.nombre = 'Balnova 2,2 mm' THEN cb.cantidad ELSE 0 END), 0) AS 'Balnova22',
        COALESCE(SUM(CASE WHEN tb.nombre = 'Balnova 1,2 mm' THEN cb.cantidad ELSE 0 END), 0) AS 'Balnova12',
        COALESCE(SUM(CASE WHEN tb.nombre = 'Balnova 0,8 mm' THEN cb.cantidad ELSE 0 END), 0) AS 'Balnova08',
        s.balanceado_acumulado AS 'Balanceado Acumulado',
        s.convercion_alimenticia AS 'Conversión Alimenticia',
        s.poblacion_actual AS 'Población actual',
        s.indice_supervivencia AS 'Sobrev. Actual %',
        s.observaciones AS 'Observaciones',
        s.fecha_seguimiento AS 'Fecha Seguimiento'
    FROM
        piscina p
        INNER JOIN ciclo_productivo cp ON cp.id_piscina = p.id_piscina
        LEFT JOIN seguimiento s ON cp.id_ciclo = s.id_ciclo
        LEFT JOIN consumo_balanceado cb ON s.id_seguimiento = cb.id_seguimiento
        LEFT JOIN tipo_balanceado tb ON cb.id_tipo_balanceado = tb.id_tipo_balanceado
    ";

    // Condiciones dinámicas para el WHERE
    $whereCondition = " WHERE 1 = 1 ";

    // Aplicar filtros de piscina y fechas
    $params = [];
    
    // FILTRO OBLIGATORIO: Solo mostrar datos de la compañía del usuario autenticado
    if ($filters['id_compania']) {
        $whereCondition .= " AND s.id_compania = ?";
        $params[] = $filters['id_compania'];
    }
    if ($filters['piscina']) {
        // Si se filtra por piscina específica
        $whereCondition .= " AND p.codigo = ?";
        $params[] = $filters['piscina'];
    } else {
        // Si piscina es 'todas', manejar los filtros de fecha
        if ($filters['startDate'] && $filters['endDate']) {
            $whereCondition .= " AND s.fecha_seguimiento BETWEEN ? AND ?";
            $params[] = $filters['startDate'];
            $params[] = $filters['endDate'];
        } else {
            // Si no hay filtro de fecha, traer solo la última fecha de seguimiento por piscina
            $whereCondition .= " AND s.fecha_seguimiento = (
                SELECT MAX(fecha_seguimiento)
                FROM seguimiento
                WHERE id_ciclo IN (SELECT id_ciclo FROM ciclo_productivo WHERE id_piscina = p.id_piscina))";
        }
    }

    // Continuar con la consulta
    $query .= $whereCondition . "
    GROUP BY
        p.codigo,
        p.hectareas,
        cp.fecha_siembra,
        cp.tipo_siembra,
        s.dias_cultivo,
        cp.cantidad_siembra,
        s.peso_promedio,
        s.incremento_peso,
        s.biomasa_lbs,
        s.poblacion_actual,
        s.indice_supervivencia,
        s.observaciones,
        s.fecha_seguimiento
    ORDER BY 
        p.id_piscina, s.fecha_seguimiento desc;";

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
