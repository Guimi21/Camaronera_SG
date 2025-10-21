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

// Manejar solicitudes POST para crear registros de muestra
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

        // Insertar nuevo registro de muestra
        $insertQuery = "
        INSERT INTO muestra (
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
            fecha_muestra,
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
        error_log("Creando muestra para ciclo ID: " . $input['id_ciclo'] . " por usuario ID: " . $input['id_usuario'] . " en compañía ID: " . $input['id_compania']);
        error_log("Datos recibidos: " . json_encode($input));
        
        $stmt = $conn->prepare($insertQuery);
        $stmt->bindValue(1, $input['id_ciclo']);
        $stmt->bindValue(2, $input['dias_cultivo'] ?? null);
        $stmt->bindValue(3, $input['peso'] ?? null);
        $stmt->bindValue(4, $input['incremento_peso'] ?? null);
        $stmt->bindValue(5, $input['biomasa_lbs'] ?? null);
        $stmt->bindValue(6, $input['balanceado_acumulado'] ?? null);
        $stmt->bindValue(7, $input['conversion_alimenticia'] ?? null);
        $stmt->bindValue(8, $input['poblacion_actual'] ?? null);
        $stmt->bindValue(9, $input['supervivencia'] ?? null);
        $stmt->bindValue(10, $input['observaciones'] ?? null);
        $stmt->bindValue(11, $input['fecha_muestra'] ?? date('Y-m-d'));
        $stmt->bindValue(12, $input['id_compania']);
        $stmt->bindValue(13, $input['id_usuario']);
        $stmt->bindValue(14, $input['id_usuario']); // Mismo usuario para crea y actualiza en inserción

        if ($stmt->execute()) {
            $muestraId = $conn->lastInsertId();
            
            // Insertar registros de balanceado si están presentes (formato dinámico)
            if (!empty($input['balanceados']) && is_array($input['balanceados'])) {
                error_log("Insertando registros de balanceado dinámicos para muestra ID: " . $muestraId);
                $balanceadoQuery = "
                INSERT INTO consumo_balanceado (
                    id_muestra, 
                    id_tipo_balanceado, 
                    cantidad, 
                    id_compania, 
                    id_usuario_crea, 
                    id_usuario_actualiza
                ) VALUES (?, ?, ?, ?, ?, ?)
                ";
                $balanceadoStmt = $conn->prepare($balanceadoQuery);
                
                try {
                    foreach ($input['balanceados'] as $balanceado) {
                        if (isset($balanceado['id_tipo_balanceado']) && isset($balanceado['cantidad']) && $balanceado['cantidad'] > 0) {
                            $balanceadoStmt->execute([
                                $muestraId, 
                                $balanceado['id_tipo_balanceado'], 
                                $balanceado['cantidad'], 
                                $input['id_compania'], 
                                $input['id_usuario'], 
                                $input['id_usuario']
                            ]);
                            error_log("Insertado balanceado ID " . $balanceado['id_tipo_balanceado'] . ": " . $balanceado['cantidad']);
                        }
                    }
                } catch (Exception $balanceadoError) {
                    error_log("Error al insertar balanceado: " . $balanceadoError->getMessage());
                    // No fallar toda la operación si hay error en balanceado
                }
            }

            $response = [
                'success' => true,
                'message' => 'Registro de muestra creado exitosamente',
                'data' => ['id_muestra' => $muestraId]
            ];
            echo json_encode($response);
            http_response_code(201);
        } else {
            throw new Exception("Error al insertar el registro");
        }

    } catch (Exception $e) {
        error_log("Error al crear muestra: " . $e->getMessage());
        $response = [
            'success' => false,
            'message' => 'Error al crear el registro de muestra'
        ];
        echo json_encode($response);
        http_response_code(500);
    }
    exit();
}

// Manejar solicitudes GET (código existente)
try {
    // Verificar si se solicita el conteo de muestras de un ciclo específico
    if (isset($_GET['id_ciclo']) && isset($_GET['count'])) {
        $id_ciclo = $_GET['id_ciclo'];
        
        // Consulta para contar las muestras del ciclo
        $countQuery = "SELECT COUNT(*) as total FROM muestra WHERE id_ciclo = ?";
        $countStmt = $conn->prepare($countQuery);
        $countStmt->bindValue(1, $id_ciclo);
        $countStmt->execute();
        $countResult = $countStmt->fetch(PDO::FETCH_ASSOC);
        
        $response = [
            'success' => true,
            'data' => [
                'id_ciclo' => $id_ciclo,
                'total_muestras' => (int)$countResult['total'],
                'tiene_muestras' => (int)$countResult['total'] > 0
            ]
        ];
        
        echo json_encode($response);
        http_response_code(200);
        exit();
    }
    
    // Verificar si se solicita el último muestra de un ciclo específico
    if (isset($_GET['id_ciclo']) && isset($_GET['ultimo'])) {
        $id_ciclo = $_GET['id_ciclo'];
        error_log("Buscando último muestra para ciclo ID: " . $id_ciclo);
        
        // Consulta de prueba para ver si hay algún muestra en la tabla
        $testQuery = "SELECT COUNT(*) as total FROM muestra WHERE id_ciclo = ?";
        $testStmt = $conn->prepare($testQuery);
        $testStmt->bindValue(1, $id_ciclo);
        $testStmt->execute();
        $testResult = $testStmt->fetch(PDO::FETCH_ASSOC);
        error_log("Total de muestras para este ciclo: " . $testResult['total']);
        
        // Consulta simplificada para obtener el último muestra del ciclo
        $queryUltimo = "
        SELECT 
            s.peso_promedio as peso,
            s.balanceado_acumulado,
            s.fecha_muestra,
            s.id_muestra,
            s.id_ciclo
        FROM 
            muestra s 
        WHERE 
            s.id_ciclo = ?
        ORDER BY 
            s.fecha_muestra DESC 
        LIMIT 1
        ";
        
        $stmtUltimo = $conn->prepare($queryUltimo);
        if (!$stmtUltimo) {
            error_log("Error preparando consulta: " . implode(', ', $conn->errorInfo()));
        }
        
        $stmtUltimo->bindValue(1, $id_ciclo);
        $executeResult = $stmtUltimo->execute();
        
        if (!$executeResult) {
            error_log("Error ejecutando consulta: " . implode(', ', $stmtUltimo->errorInfo()));
        }
        
        $ultimoMuestra = $stmtUltimo->fetchAll(PDO::FETCH_ASSOC);
        
        error_log("Resultados encontrados: " . count($ultimoMuestra));
        error_log("Datos del último muestra: " . json_encode($ultimoMuestra));
        
        $response = [
            'success' => true,
            'data' => $ultimoMuestra,
            'total' => count($ultimoMuestra)
        ];
        
        echo json_encode($response);
        http_response_code(200);
        exit();
    }
    
    // Obtener filtros de los parámetros de la consulta
    $filters = [
        'piscina' => isset($_GET['piscina']) && $_GET['piscina'] !== 'todas' ? $_GET['piscina'] : null,
        'startDate' => isset($_GET['startDate']) && !empty($_GET['startDate']) ? $_GET['startDate'] : null,
        'endDate' => isset($_GET['endDate']) && !empty($_GET['endDate']) ? $_GET['endDate'] : null,
        'id_compania' => isset($_GET['id_compania']) && !empty($_GET['id_compania']) ? $_GET['id_compania'] : null
    ];

    // Obtener los tipos de balanceado de la compañía para crear columnas dinámicas
    $tiposBalanceadoQuery = "SELECT id_tipo_balanceado, nombre FROM tipo_balanceado WHERE id_compania = ? ORDER BY id_tipo_balanceado";
    $tiposBalanceadoStmt = $conn->prepare($tiposBalanceadoQuery);
    $tiposBalanceadoStmt->bindValue(1, $filters['id_compania']);
    $tiposBalanceadoStmt->execute();
    $tiposBalanceado = $tiposBalanceadoStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Construir las columnas dinámicas para los tipos de balanceado
    $balanceadoColumns = "";
    foreach ($tiposBalanceado as $tipo) {
        $nombreColumna = str_replace([' ', '.', ',', '(', ')'], '', $tipo['nombre']); // Sanitizar nombre para usar como alias
        $balanceadoColumns .= "COALESCE(SUM(CASE WHEN tb.id_tipo_balanceado = " . intval($tipo['id_tipo_balanceado']) . " AND cb.id_compania = " . intval($filters['id_compania']) . " THEN cb.cantidad ELSE 0 END), 0) AS '" . $tipo['nombre'] . "',\n        ";
    }

    // Crear la consulta base con columnas dinámicas
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
        " . $balanceadoColumns . "s.balanceado_acumulado AS 'Balanceado Acumulado',
        s.convercion_alimenticia AS 'Conversión Alimenticia',
        s.poblacion_actual AS 'Población actual',
        s.indice_supervivencia AS 'Sobrev. Actual %',
        s.observaciones AS 'Observaciones',
        s.fecha_muestra AS 'Fecha Muestra'
    FROM
        piscina p
        INNER JOIN ciclo_productivo cp ON cp.id_piscina = p.id_piscina
        LEFT JOIN muestra s ON cp.id_ciclo = s.id_ciclo
        LEFT JOIN consumo_balanceado cb ON s.id_muestra = cb.id_muestra AND cb.id_compania = " . intval($filters['id_compania']) . "
        LEFT JOIN tipo_balanceado tb ON cb.id_tipo_balanceado = tb.id_tipo_balanceado AND tb.id_compania = " . intval($filters['id_compania']) . "
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
            $whereCondition .= " AND s.fecha_muestra BETWEEN ? AND ?";
            $params[] = $filters['startDate'];
            $params[] = $filters['endDate'];
        } else {
            // Si no hay filtro de fecha, traer solo la última fecha de muestra por piscina
            $whereCondition .= " AND s.fecha_muestra = (
                SELECT MAX(fecha_muestra)
                FROM muestra
                WHERE id_ciclo IN (SELECT id_ciclo FROM ciclo_productivo WHERE id_piscina = p.id_piscina))";
        }
    }

    // Continuar con la consulta
    $query .= $whereCondition . "
    GROUP BY
        p.id_piscina,
        p.codigo,
        p.hectareas,
        cp.fecha_siembra,
        cp.tipo_siembra,
        s.dias_cultivo,
        cp.cantidad_siembra,
        cp.densidad,
        s.peso_promedio,
        s.incremento_peso,
        s.balanceado_acumulado,
        s.convercion_alimenticia,
        s.biomasa_lbs,
        s.poblacion_actual,
        s.indice_supervivencia,
        s.observaciones,
        s.fecha_muestra
    ORDER BY 
        p.id_piscina, s.fecha_muestra desc;";

    // Log para debugging
    error_log("Tipos de balanceado encontrados: " . count($tiposBalanceado));
    error_log("ID Compañía: " . $filters['id_compania']);

    // Preparar y ejecutar la consulta
    $stmt = $conn->prepare($query);

    // Vincular parámetros
    foreach ($params as $key => $value) {
        $stmt->bindValue($key + 1, $value);
    }

    $stmt->execute();

    // Obtener los resultados
    $cicloData = $stmt->fetchAll(PDO::FETCH_ASSOC);
    error_log("Resultados obtenidos: " . count($cicloData));

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
