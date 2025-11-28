<?php
require_once __DIR__ . '/../helpers/CustomExceptions.php';
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/cors.php';  // Configuración CORS centralizada

define('QUERY_TIPOS_BALANCEADO', "SELECT id_tipo_balanceado, nombre FROM tipo_balanceado WHERE id_compania = ? ORDER BY id_tipo_balanceado");
define('RESPONSE_SUCCESS', 'success');
define('RESPONSE_MESSAGE', 'message');
define('RESPONSE_DATA', 'data');

// Función auxiliar para construir columnas dinámicas de balanceado
function buildBalanceadoColumns($tiposBalanceado, $idCompania) {
    $balanceadoColumns = "";
    foreach ($tiposBalanceado as $tipo) {
        $balanceadoColumns .= "COALESCE(SUM(CASE WHEN tb.id_tipo_balanceado = " . intval($tipo['id_tipo_balanceado']) . " AND cb.id_compania = " . intval($idCompania) . " THEN cb.cantidad ELSE 0 END), 0) AS '" . $tipo['nombre'] . "',\n        ";
    }
    return $balanceadoColumns;
}

// Verificar que la conexión a la base de datos esté establecida
if (!isset($conn)) {
    $response = [
        RESPONSE_SUCCESS => false,
        RESPONSE_MESSAGE => 'Error de conexión a la base de datos'
    ];
    http_response_code(500);
    echo json_encode($response);
    exit();
}

// Manejar solicitudes POST para crear registros de muestra
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    try {
        // Obtener datos del cuerpo de la solicitud
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            $response = [
                RESPONSE_SUCCESS => false,
                RESPONSE_MESSAGE => 'Datos no válidos'
            ];
            http_response_code(400);
            echo json_encode($response);
            exit();
        }

        // Validar campos requeridos
        if (!isset($input['id_ciclo']) || empty($input['id_ciclo'])) {
            $response = [
                RESPONSE_SUCCESS => false,
                RESPONSE_MESSAGE => 'ID de ciclo requerido'
            ];
            http_response_code(400);
            echo json_encode($response);
            exit();
        }

        if (!isset($input['id_usuario']) || empty($input['id_usuario'])) {
            $response = [
                RESPONSE_SUCCESS => false,
                RESPONSE_MESSAGE => 'ID de usuario requerido'
            ];
            http_response_code(400);
            echo json_encode($response);
            exit();
        }

        if (!isset($input['id_compania']) || empty($input['id_compania'])) {
            $response = [
                RESPONSE_SUCCESS => false,
                RESPONSE_MESSAGE => 'ID de compañía requerido'
            ];
            http_response_code(400);
            echo json_encode($response);
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
            estado,
            id_compania,
            id_usuario_crea,
            id_usuario_actualiza
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                RESPONSE_SUCCESS => false,
                RESPONSE_MESSAGE => 'Ciclo productivo no encontrado o no pertenece a su compañía'
            ];
            http_response_code(404);
            echo json_encode($response);
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
        $estado = isset($input['estado']) ? trim($input['estado']) : 'ACTIVA';
        $stmt->bindValue(12, $estado);
        $stmt->bindValue(13, $input['id_compania']);
        $stmt->bindValue(14, $input['id_usuario']);
        $stmt->bindValue(15, $input['id_usuario']); // Mismo usuario para crea y actualiza en inserción

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
                RESPONSE_SUCCESS => true,
                RESPONSE_MESSAGE => 'Registro de muestra creado exitosamente',
                RESPONSE_DATA => ['id_muestra' => $muestraId]
            ];
            http_response_code(201);
            echo json_encode($response);
        } else {
            throw new InsertException("Error al insertar el registro");
        }

    } catch (Exception $e) {
        error_log("Error al crear muestra: " . $e->getMessage());
        $response = [
            RESPONSE_SUCCESS => false,
            RESPONSE_MESSAGE => 'Error al crear el registro de muestra'
        ];
        http_response_code(500);
        echo json_encode($response);
    }
    exit();
}

// Manejar solicitudes PUT para actualizar registros de muestra
if ($_SERVER['REQUEST_METHOD'] == 'PUT') {
    try {
        // Obtener datos del cuerpo de la solicitud
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            $response = [
                RESPONSE_SUCCESS => false,
                RESPONSE_MESSAGE => 'Datos no válidos'
            ];
            http_response_code(400);
            echo json_encode($response);
            exit();
        }

        // Validar campos requeridos
        if (!isset($input['id_muestra']) || empty($input['id_muestra'])) {
            $response = [
                RESPONSE_SUCCESS => false,
                RESPONSE_MESSAGE => 'ID de muestra requerido'
            ];
            http_response_code(400);
            echo json_encode($response);
            exit();
        }

        if (!isset($input['id_compania']) || empty($input['id_compania'])) {
            $response = [
                RESPONSE_SUCCESS => false,
                RESPONSE_MESSAGE => 'ID de compañía requerido'
            ];
            http_response_code(400);
            echo json_encode($response);
            exit();
        }

        // Verificar que la muestra existe y pertenece a esta compañía
        $muestraQuery = "SELECT id_muestra FROM muestra WHERE id_muestra = ? AND id_compania = ?";
        $muestraStmt = $conn->prepare($muestraQuery);
        $muestraStmt->bindValue(1, $input['id_muestra']);
        $muestraStmt->bindValue(2, $input['id_compania']);
        $muestraStmt->execute();
        $muestraExists = $muestraStmt->fetch(PDO::FETCH_ASSOC);

        if (!$muestraExists) {
            $response = [
                RESPONSE_SUCCESS => false,
                RESPONSE_MESSAGE => 'Muestra no encontrada o no pertenece a su compañía'
            ];
            http_response_code(404);
            echo json_encode($response);
            exit();
        }

        // Actualizar muestra
        $updateQuery = "
        UPDATE muestra SET
            dias_cultivo = ?,
            peso_promedio = ?,
            incremento_peso = ?,
            biomasa_lbs = ?,
            balanceado_acumulado = ?,
            convercion_alimenticia = ?,
            poblacion_actual = ?,
            indice_supervivencia = ?,
            observaciones = ?,
            fecha_muestra = ?,
            id_usuario_actualiza = ?
        WHERE id_muestra = ?
        ";

        $updateStmt = $conn->prepare($updateQuery);
        $updateStmt->bindValue(1, $input['dias_cultivo'] ?? null);
        $updateStmt->bindValue(2, $input['peso'] ?? null);
        $updateStmt->bindValue(3, $input['incremento_peso'] ?? null);
        $updateStmt->bindValue(4, $input['biomasa_lbs'] ?? null);
        $updateStmt->bindValue(5, $input['balanceado_acumulado'] ?? null);
        $updateStmt->bindValue(6, $input['conversion_alimenticia'] ?? null);
        $updateStmt->bindValue(7, $input['poblacion_actual'] ?? null);
        $updateStmt->bindValue(8, $input['supervivencia'] ?? null);
        $updateStmt->bindValue(9, $input['observaciones'] ?? null);
        $updateStmt->bindValue(10, $input['fecha_muestra'] ?? date('Y-m-d'));
        $updateStmt->bindValue(11, $input['id_usuario'] ?? null);
        $updateStmt->bindValue(12, $input['id_muestra']);

        if ($updateStmt->execute()) {
            // Eliminar consumos de balanceado antiguos
            $deleteBalanceadoQuery = "DELETE FROM consumo_balanceado WHERE id_muestra = ?";
            $deleteStmt = $conn->prepare($deleteBalanceadoQuery);
            $deleteStmt->execute([$input['id_muestra']]);

            // Insertar nuevos consumos de balanceado
            if (!empty($input['balanceados']) && is_array($input['balanceados'])) {
                error_log("Actualizando registros de balanceado dinámicos para muestra ID: " . $input['id_muestra']);
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
                                $input['id_muestra'], 
                                $balanceado['id_tipo_balanceado'], 
                                $balanceado['cantidad'], 
                                $input['id_compania'], 
                                $input['id_usuario'], 
                                $input['id_usuario']
                            ]);
                        }
                    }
                } catch (Exception $balanceadoError) {
                    error_log("Error al insertar balanceado: " . $balanceadoError->getMessage());
                }
            }

            $response = [
                RESPONSE_SUCCESS => true,
                RESPONSE_MESSAGE => 'Registro de muestra actualizado exitosamente'
            ];
            http_response_code(200);
            echo json_encode($response);
        } else {
            throw new UpdateException("Error al actualizar el registro");
        }

    } catch (Exception $e) {
        error_log("Error al actualizar muestra: " . $e->getMessage());
        $response = [
            RESPONSE_SUCCESS => false,
            RESPONSE_MESSAGE => 'Error al actualizar el registro de muestra'
        ];
        http_response_code(500);
        echo json_encode($response);
    }
    exit();
}

// Manejar solicitudes GET (código existente)
try {
    // Verificar si se solicita una muestra específica por ID
    if (isset($_GET['id_muestra']) && !isset($_GET['count']) && !isset($_GET['ultimo'])) {
        $id_muestra = $_GET['id_muestra'];
        $id_compania = $_GET['id_compania'] ?? null;
        
        // Obtener tipos de balanceado de la compañía
        $tiposBalanceadoQuery = QUERY_TIPOS_BALANCEADO;
        $tiposBalanceadoStmt = $conn->prepare($tiposBalanceadoQuery);
        $tiposBalanceadoStmt->bindValue(1, $id_compania);
        $tiposBalanceadoStmt->execute();
        $tiposBalanceado = $tiposBalanceadoStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Construir las columnas dinámicas para los tipos de balanceado
        $balanceadoColumns = buildBalanceadoColumns($tiposBalanceado, $id_compania);

        // Consulta para obtener la muestra específica
        $query = "
        SELECT
            s.id_muestra AS 'id_muestra',
            s.id_ciclo AS 'id_ciclo',
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
            muestra s
            INNER JOIN ciclo_productivo cp ON cp.id_ciclo = s.id_ciclo
            INNER JOIN piscina p ON cp.id_piscina = p.id_piscina
            LEFT JOIN consumo_balanceado cb ON s.id_muestra = cb.id_muestra AND cb.id_compania = " . intval($id_compania) . "
            LEFT JOIN tipo_balanceado tb ON cb.id_tipo_balanceado = tb.id_tipo_balanceado AND tb.id_compania = " . intval($id_compania) . "
        WHERE
            s.id_muestra = ? AND s.id_compania = ?
        GROUP BY
            s.id_muestra, s.id_ciclo, p.id_piscina, cp.id_ciclo
        ";

        $stmt = $conn->prepare($query);
        $stmt->bindValue(1, $id_muestra);
        $stmt->bindValue(2, $id_compania);
        $stmt->execute();
        $muestraData = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $response = [
            'success' => true,
            'data' => $muestraData,
            'total' => count($muestraData)
        ];

        http_response_code(200);
        echo json_encode($response);
        exit();
    }
    
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
        
        http_response_code(200);
        echo json_encode($response);
        exit();
    }
    
    // Verificar si se solicita el promedio de incremento de peso de un ciclo específico
    if (isset($_GET['id_ciclo']) && isset($_GET['promedio_incremento_peso'])) {
        $id_ciclo = $_GET['id_ciclo'];
        
        // Consulta para calcular el promedio de incremento de peso del ciclo
        $promedioQuery = "
            SELECT 
                AVG(incremento_peso) as promedio_incremento_peso,
                COUNT(*) as total_muestras
            FROM muestra 
            WHERE id_ciclo = ? AND incremento_peso IS NOT NULL
        ";
        $promedioStmt = $conn->prepare($promedioQuery);
        $promedioStmt->bindValue(1, $id_ciclo);
        $promedioStmt->execute();
        $promedioResult = $promedioStmt->fetch(PDO::FETCH_ASSOC);
        
        $response = [
            'success' => true,
            'data' => [
                'id_ciclo' => $id_ciclo,
                'promedio_incremento_peso' => $promedioResult['promedio_incremento_peso'] ? floatval($promedioResult['promedio_incremento_peso']) : null,
                'total_muestras' => (int)$promedioResult['total_muestras']
            ]
        ];
        
        http_response_code(200);
        echo json_encode($response);
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
            s.id_ciclo,
            s.fecha_creacion
        FROM 
            muestra s 
        WHERE 
            s.id_ciclo = ?
        ORDER BY 
            s.fecha_muestra DESC,
            s.fecha_creacion DESC
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
        
        http_response_code(200);
        echo json_encode($response);
        exit();
    }
    
    // Verificar si se solicita la penúltima muestra de un ciclo específico
    if (isset($_GET['id_ciclo']) && isset($_GET['penultimo'])) {
        $id_ciclo = $_GET['id_ciclo'];
        $id_compania = $_GET['id_compania'] ?? null;
        error_log("Buscando penúltima muestra para ciclo ID: " . $id_ciclo);
        
        // Obtener tipos de balanceado de la compañía
        $tiposBalanceadoQuery = QUERY_TIPOS_BALANCEADO;
        $tiposBalanceadoStmt = $conn->prepare($tiposBalanceadoQuery);
        $tiposBalanceadoStmt->bindValue(1, $id_compania);
        $tiposBalanceadoStmt->execute();
        $tiposBalanceado = $tiposBalanceadoStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Construir las columnas dinámicas para los tipos de balanceado
        $balanceadoColumns = buildBalanceadoColumns($tiposBalanceado, $id_compania);
        
        // Consulta para obtener la penúltima muestra del ciclo
        $query = "
        SELECT
            s.id_muestra AS 'id_muestra',
            s.id_ciclo AS 'id_ciclo',
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
            s.estado AS 'Estado',
            s.fecha_muestra AS 'Fecha Muestra',
            s.fecha_creacion AS 'Fecha Creación',
            s.fecha_actualizacion AS 'Última Actualización'
        FROM
            muestra s
            INNER JOIN ciclo_productivo cp ON cp.id_ciclo = s.id_ciclo
            INNER JOIN piscina p ON cp.id_piscina = p.id_piscina
            LEFT JOIN consumo_balanceado cb ON s.id_muestra = cb.id_muestra AND cb.id_compania = " . intval($id_compania) . "
            LEFT JOIN tipo_balanceado tb ON cb.id_tipo_balanceado = tb.id_tipo_balanceado AND tb.id_compania = " . intval($id_compania) . "
        WHERE
            s.id_ciclo = ? AND s.id_compania = ?
        GROUP BY
            s.id_muestra, s.id_ciclo, p.id_piscina, cp.id_ciclo, s.observaciones, s.estado, s.fecha_creacion, s.fecha_actualizacion
        ORDER BY 
            s.fecha_muestra DESC,
            s.fecha_creacion DESC
        LIMIT 1 OFFSET 1
        ";

        $stmt = $conn->prepare($query);
        $stmt->bindValue(1, $id_ciclo);
        $stmt->bindValue(2, $id_compania);
        $stmt->execute();
        $penultimaMuestra = $stmt->fetchAll(PDO::FETCH_ASSOC);

        error_log("Resultados encontrados: " . count($penultimaMuestra));
        error_log("Datos de la penúltima muestra: " . json_encode($penultimaMuestra));

        $response = [
            'success' => true,
            'data' => $penultimaMuestra,
            'total' => count($penultimaMuestra)
        ];

        http_response_code(200);
        echo json_encode($response);
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
    $tiposBalanceadoQuery = QUERY_TIPOS_BALANCEADO;
    $tiposBalanceadoStmt = $conn->prepare($tiposBalanceadoQuery);
    $tiposBalanceadoStmt->bindValue(1, $filters['id_compania']);
    $tiposBalanceadoStmt->execute();
    $tiposBalanceado = $tiposBalanceadoStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Construir las columnas dinámicas para los tipos de balanceado
    $balanceadoColumns = buildBalanceadoColumns($tiposBalanceado, $filters['id_compania']);

    // Crear la consulta base con columnas dinámicas
    $query = "
    SELECT
        s.id_muestra AS 'id_muestra',
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
        s.estado AS 'Estado',
        s.fecha_muestra AS 'Fecha Muestra',
        s.fecha_creacion AS 'Fecha Creación',
        s.fecha_actualizacion AS 'Última Actualización'
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
        s.id_muestra,
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
        s.estado,
        s.fecha_muestra,
        s.fecha_creacion,
        s.fecha_actualizacion
    ORDER BY 
        p.id_piscina, s.fecha_muestra desc, s.fecha_creacion desc;";

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

    http_response_code(200);
    echo json_encode($response);

} catch (PDOException $e) {
    error_log("Error en la consulta: " . $e->getMessage());
    
    $response = [
        'success' => false,
        'message' => 'Error al obtener los datos',
        'error' => $e->getMessage()
    ];
    
    http_response_code(500);
    echo json_encode($response);
    
} catch (Exception $e) {
    error_log("Error general: " . $e->getMessage());
    
    $response = [
        'success' => false,
        'message' => 'Error interno del servidor'
    ];
    
    http_response_code(500);
    echo json_encode($response);
}