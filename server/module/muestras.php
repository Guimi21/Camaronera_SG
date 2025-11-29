<?php
// Bootstrap - Incluir todas las dependencias centralizadas
require_once __DIR__ . '/../bootstrap.php';

// Validar conexión a base de datos
RequestValidator::validateDbConnection($conn);

$method = $_SERVER['REQUEST_METHOD'];
$qb = new DatabaseQueryBuilder($conn);

try {
    // POST - Crear nueva muestra
    if ($method === 'POST') {
        $input = RequestValidator::validateJsonInput();
        RequestValidator::validateJsonFields($input, ['id_ciclo', 'id_usuario', 'id_compania']);

        $id_ciclo = (int)$input['id_ciclo'];
        $id_usuario = (int)$input['id_usuario'];
        $id_compania = (int)$input['id_compania'];

        // Verificar que el ciclo productivo existe y pertenece a la compañía
        $cicloExists = $qb->countRecords('ciclo_productivo',
            'id_ciclo = ' . PARAM_ID_CICLO . AND_ID_COMPANIA,
            [PARAM_ID_CICLO => $id_ciclo, PARAM_ID_COMPANIA_LITERAL => $id_compania]
        );

        if ($cicloExists === 0) {
            ErrorHandler::handleValidationError('Ciclo productivo no encontrado o no pertenece a su compañía', HTTP_NOT_FOUND);
            exit();
        }

        // Insertar muestra
        $muestraId = $qb->insertRecord('muestra', [
            'id_ciclo' => $id_ciclo,
            'dias_cultivo' => $input['dias_cultivo'] ?? null,
            'peso_promedio' => $input['peso'] ?? null,
            'incremento_peso' => $input['incremento_peso'] ?? null,
            'biomasa_lbs' => $input['biomasa_lbs'] ?? null,
            'balanceado_acumulado' => $input['balanceado_acumulado'] ?? null,
            'convercion_alimenticia' => $input['conversion_alimenticia'] ?? null,
            'poblacion_actual' => $input['poblacion_actual'] ?? null,
            'indice_supervivencia' => $input['supervivencia'] ?? null,
            'observaciones' => $input['observaciones'] ?? null,
            'fecha_muestra' => $input['fecha_muestra'] ?? date('Y-m-d'),
            'estado' => isset($input['estado']) ? trim($input['estado']) : 'ACTIVA',
            'id_compania' => $id_compania,
            'id_usuario_crea' => $id_usuario,
            'id_usuario_actualiza' => $id_usuario
        ]);

        // Insertar consumos de balanceado si están presentes
        if (!empty($input['balanceados']) && is_array($input['balanceados'])) {
            foreach ($input['balanceados'] as $balanceado) {
                if (isset($balanceado['id_tipo_balanceado'], $balanceado['cantidad']) && $balanceado['cantidad'] > 0) {
                    $qb->insertRecord('consumo_balanceado', [
                        'id_muestra' => $muestraId,
                        'id_tipo_balanceado' => (int)$balanceado['id_tipo_balanceado'],
                        'cantidad' => $balanceado['cantidad'],
                        'id_compania' => $id_compania,
                        'id_usuario_crea' => $id_usuario,
                        'id_usuario_actualiza' => $id_usuario
                    ]);
                }
            }
        }

        ErrorHandler::sendCreatedResponse(['id_muestra' => $muestraId]);

    // PUT - Actualizar muestra
    } elseif ($method === 'PUT') {
        $input = RequestValidator::validateJsonInput();
        RequestValidator::validateJsonFields($input, ['id_muestra', 'id_compania']);

        $id_muestra = (int)$input['id_muestra'];
        $id_compania = (int)$input['id_compania'];
        $id_usuario = $input['id_usuario'] ?? null;

        // Verificar que la muestra existe y pertenece a la compañía
        $muestraExists = $qb->countRecords('muestra',
            WHERE_CLAUSE_ID_MUESTRA . PARAM_ID_MUESTRA . AND_ID_COMPANIA,
            [PARAM_ID_MUESTRA => $id_muestra, PARAM_ID_COMPANIA_LITERAL => $id_compania]
        );

        if ($muestraExists === 0) {
            ErrorHandler::handleValidationError('Muestra no encontrada o no pertenece a su compañía', HTTP_NOT_FOUND);
            exit();
        }

        // Actualizar muestra
        $updates = [
            'dias_cultivo' => $input['dias_cultivo'] ?? null,
            'peso_promedio' => $input['peso'] ?? null,
            'incremento_peso' => $input['incremento_peso'] ?? null,
            'biomasa_lbs' => $input['biomasa_lbs'] ?? null,
            'balanceado_acumulado' => $input['balanceado_acumulado'] ?? null,
            'convercion_alimenticia' => $input['conversion_alimenticia'] ?? null,
            'poblacion_actual' => $input['poblacion_actual'] ?? null,
            'indice_supervivencia' => $input['supervivencia'] ?? null,
            'observaciones' => $input['observaciones'] ?? null,
            'fecha_muestra' => $input['fecha_muestra'] ?? date('Y-m-d'),
            'id_usuario_actualiza' => $id_usuario
        ];

        $qb->updateRecord('muestra', $updates, WHERE_CLAUSE_ID_MUESTRA . PARAM_ID_MUESTRA, [PARAM_ID_MUESTRA => $id_muestra]);

        // Actualizar consumos de balanceado (eliminar antiguos e insertar nuevos)
        $qb->deleteRecord('consumo_balanceado', WHERE_CLAUSE_ID_MUESTRA . PARAM_ID_MUESTRA, [PARAM_ID_MUESTRA => $id_muestra]);

        if (!empty($input['balanceados']) && is_array($input['balanceados'])) {
            foreach ($input['balanceados'] as $balanceado) {
                if (isset($balanceado['id_tipo_balanceado'], $balanceado['cantidad']) && $balanceado['cantidad'] > 0) {
                    $qb->insertRecord('consumo_balanceado', [
                        'id_muestra' => $id_muestra,
                        'id_tipo_balanceado' => (int)$balanceado['id_tipo_balanceado'],
                        'cantidad' => $balanceado['cantidad'],
                        'id_compania' => $id_compania,
                        'id_usuario_crea' => $id_usuario,
                        'id_usuario_actualiza' => $id_usuario
                    ]);
                }
            }
        }

        ErrorHandler::sendUpdatedResponse();

    // GET - Obtener muestras
    } elseif ($method === 'GET') {
        $id_muestra = RequestValidator::getParamWithDefault('id_muestra', null, 'GET');
        $id_ciclo = RequestValidator::getParamWithDefault('id_ciclo', null, 'GET');
        $id_compania = RequestValidator::getParamWithDefault('id_compania', null, 'GET');

        // Caso 1: Obtener muestra específica por ID
        if ($id_muestra) {
            $query = "SELECT id_muestra FROM muestra WHERE " . WHERE_ID_MUESTRA . AND_ID_COMPANIA;
            $existe = $qb->executeQuery($query, [PARAM_ID_MUESTRA => $id_muestra, PARAM_ID_COMPANIA_LITERAL => $id_compania], true);

            if (empty($existe)) {
                ErrorHandler::handleValidationError('Muestra no encontrada', HTTP_NOT_FOUND);
                exit();
            }

            // Obtener detalles de la muestra
            $query = "SELECT
                s.id_muestra, s.id_ciclo, p.codigo as Piscina, p.hectareas as Has,
                cp.fecha_siembra as 'Fecha de siembra', s.dias_cultivo as 'Dias cultivo',
                cp.cantidad_siembra as 'Siembra / Larvas', cp.densidad as Densidad,
                cp.tipo_siembra as 'Tipo Siembra', s.peso_promedio as Peso,
                s.incremento_peso as 'Inc.P', s.biomasa_lbs as 'Biomasa Lbs',
                s.balanceado_acumulado as 'Balanceado Acumulado',
                s.convercion_alimenticia as 'Conversión Alimenticia',
                s.poblacion_actual as 'Población actual',
                s.indice_supervivencia as 'Sobrev. Actual %', s.observaciones as Observaciones,
                s.estado as Estado, s.fecha_muestra as 'Fecha Muestra',
                s.fecha_creacion as 'Fecha Creación', s.fecha_actualizacion as 'Última Actualización'
            FROM muestra s
            INNER JOIN ciclo_productivo cp ON cp.id_ciclo = s.id_ciclo
            INNER JOIN piscina p ON cp.id_piscina = p.id_piscina
            WHERE s.id_muestra = " . PARAM_ID_MUESTRA . AND_S_ID_COMPANIA . "";

            $muestras = $qb->executeQuery($query, [PARAM_ID_MUESTRA => $id_muestra, PARAM_ID_COMPANIA_LITERAL => $id_compania], true);

            // Procesar resultado para agregar tipos de balanceado
            if (!empty($muestras)) {
                $muestra = $muestras[0];
                $id_muestra_val = $muestra['id_muestra'];

                // Obtener tipos de balanceado y sus cantidades para esta muestra
                $balanceadoQuery = "SELECT tb.nombre, COALESCE(cb.cantidad, 0) as cantidad
                    FROM tipo_balanceado tb
                    LEFT JOIN consumo_balanceado cb ON " . WHERE_ID_MUESTRA_SIMPLE . " AND cb.id_tipo_balanceado = tb.id_tipo_balanceado
                    WHERE tb.id_compania = (SELECT id_compania FROM muestra WHERE id_muestra = :id_muestra_val)
                    ORDER BY tb.nombre";

                $balanceados = $qb->executeQuery($balanceadoQuery,
                    [PARAM_ID_MUESTRA => $id_muestra_val, ':id_muestra_val' => $id_muestra_val], true);

                // Agregar cada tipo de balanceado como columna
                foreach ($balanceados as $balanceado) {
                    $muestra[$balanceado['nombre']] = $balanceado['cantidad'];
                }

                $muestras[0] = $muestra;
            }

            ErrorHandler::sendSuccessResponse($muestras);

        // Caso 2: Contar muestras de un ciclo
        } elseif ($id_ciclo && isset($_GET['count'])) {
            $total = $qb->countRecords('muestra', 'id_ciclo = ' . PARAM_ID_CICLO, [PARAM_ID_CICLO => $id_ciclo]);
            ErrorHandler::sendSuccessResponse([
                'id_ciclo' => $id_ciclo,
                'total_muestras' => $total,
                'tiene_muestras' => $total > 0
            ]);

        // Caso 3: Obtener promedio de incremento de peso
        } elseif ($id_ciclo && isset($_GET['promedio_incremento_peso'])) {
            $query = "SELECT
                AVG(incremento_peso) as promedio_incremento_peso,
                COUNT(*) as total_muestras
            FROM muestra
            WHERE id_ciclo = " . PARAM_ID_CICLO . " AND incremento_peso IS NOT NULL";

            $resultado = $qb->executeQuery($query, [PARAM_ID_CICLO => $id_ciclo], true);
            $data = $resultado[0] ?? [];

            ErrorHandler::sendSuccessResponse([
                'id_ciclo' => $id_ciclo,
                'promedio_incremento_peso' => $data['promedio_incremento_peso'] ? floatval($data['promedio_incremento_peso']) : null,
                'total_muestras' => (int)($data['total_muestras'] ?? 0)
            ]);

        // Caso 4: Obtener última muestra de un ciclo
        } elseif ($id_ciclo && isset($_GET['ultimo'])) {
            $query = "SELECT
                peso_promedio as peso, balanceado_acumulado, fecha_muestra,
                id_muestra, id_ciclo, fecha_creacion
            FROM muestra
            WHERE id_ciclo = " . PARAM_ID_CICLO . "
            ORDER BY fecha_muestra DESC, fecha_creacion DESC
            LIMIT 1";

            $muestras = $qb->executeQuery($query, [PARAM_ID_CICLO => $id_ciclo], true);
            ErrorHandler::sendSuccessResponse($muestras);

        // Caso 5: Obtener penúltima muestra de un ciclo
        } elseif ($id_ciclo && isset($_GET['penultimo'])) {
            $query = "SELECT
                s.id_muestra, s.id_ciclo, p.codigo as Piscina, p.hectareas as Has,
                cp.fecha_siembra as 'Fecha de siembra', s.dias_cultivo as 'Dias cultivo',
                cp.cantidad_siembra as 'Siembra / Larvas', cp.densidad as Densidad,
                cp.tipo_siembra as 'Tipo Siembra', s.peso_promedio as Peso,
                s.incremento_peso as 'Inc.P', s.biomasa_lbs as 'Biomasa Lbs',
                s.balanceado_acumulado as 'Balanceado Acumulado',
                s.convercion_alimenticia as 'Conversión Alimenticia',
                s.poblacion_actual as 'Población actual',
                s.indice_supervivencia as 'Sobrev. Actual %', s.observaciones as Observaciones,
                s.estado as Estado, s.fecha_muestra as 'Fecha Muestra',
                s.fecha_creacion as 'Fecha Creación', s.fecha_actualizacion as 'Última Actualización'
            FROM muestra s
            INNER JOIN ciclo_productivo cp ON cp.id_ciclo = s.id_ciclo
            INNER JOIN piscina p ON cp.id_piscina = p.id_piscina
            WHERE s.id_ciclo = " . PARAM_ID_CICLO . AND_S_ID_COMPANIA . "
            ORDER BY s.fecha_muestra DESC, s.fecha_creacion DESC
            LIMIT 1 OFFSET 1";

            $muestras = $qb->executeQuery($query,
                [PARAM_ID_CICLO => $id_ciclo, PARAM_ID_COMPANIA_LITERAL => $id_compania], true);

            // Procesar resultado para agregar tipos de balanceado
            if (!empty($muestras)) {
                foreach ($muestras as $index => $muestra) {
                    $id_muestra_val = $muestra['id_muestra'];

                    // Obtener tipos de balanceado y sus cantidades para esta muestra
                    $balanceadoQuery = "SELECT tb.nombre, COALESCE(cb.cantidad, 0) as cantidad
                        FROM tipo_balanceado tb
                        LEFT JOIN consumo_balanceado cb ON " . WHERE_ID_MUESTRA_SIMPLE . " AND cb.id_tipo_balanceado = tb.id_tipo_balanceado
                        WHERE tb.id_compania = " . PARAM_ID_COMPANIA_LITERAL . "
                        ORDER BY tb.nombre";

                    $balanceados = $qb->executeQuery($balanceadoQuery,
                        [PARAM_ID_MUESTRA => $id_muestra_val, PARAM_ID_COMPANIA_LITERAL => $id_compania], true);

                    // Agregar cada tipo de balanceado como columna
                    foreach ($balanceados as $balanceado) {
                        $muestra[$balanceado['nombre']] = $balanceado['cantidad'];
                    }

                    $muestras[$index] = $muestra;
                }
            }

            ErrorHandler::sendSuccessResponse($muestras);

        // Caso 6: Obtener todas las muestras con filtros
        } else {
            $piscina = RequestValidator::getParamWithDefault('piscina', null, 'GET');
            $startDate = RequestValidator::getParamWithDefault('startDate', null, 'GET');
            $endDate = RequestValidator::getParamWithDefault('endDate', null, 'GET');

            $query = "SELECT
                s.id_muestra, p.codigo as Piscina, p.hectareas as Has,
                cp.fecha_siembra as 'Fecha de siembra', s.dias_cultivo as 'Dias cultivo',
                cp.cantidad_siembra as 'Siembra / Larvas', cp.densidad as Densidad,
                cp.tipo_siembra as 'Tipo Siembra', s.peso_promedio as Peso,
                s.incremento_peso as 'Inc.P', s.biomasa_lbs as 'Biomasa Lbs',
                s.balanceado_acumulado as 'Balanceado Acumulado',
                s.convercion_alimenticia as 'Conversión Alimenticia',
                s.poblacion_actual as 'Población actual',
                s.indice_supervivencia as 'Sobrev. Actual %', s.observaciones as Observaciones,
                s.estado as Estado, s.fecha_muestra as 'Fecha Muestra',
                s.fecha_creacion as 'Fecha Creación', s.fecha_actualizacion as 'Última Actualización',
                tb.nombre as tipo_balanceado, COALESCE(cb.cantidad, 0) as cantidad_balanceado
            FROM piscina p
            INNER JOIN ciclo_productivo cp ON cp.id_piscina = p.id_piscina
            LEFT JOIN muestra s ON cp.id_ciclo = s.id_ciclo
            CROSS JOIN tipo_balanceado tb
            LEFT JOIN consumo_balanceado cb ON cb.id_muestra = s.id_muestra AND cb.id_tipo_balanceado = tb.id_tipo_balanceado
            WHERE 1 = 1";

            $params = [];

            if ($id_compania) {
                $query .= " AND s.id_compania = " . PARAM_ID_COMPANIA_LITERAL . " AND tb.id_compania = " . PARAM_ID_COMPANIA_LITERAL;
                $params[PARAM_ID_COMPANIA_LITERAL] = $id_compania;
            }

            if ($piscina && $piscina !== 'todas') {
                $query .= " AND p.codigo = :piscina";
                $params[':piscina'] = $piscina;
            } else {
                // Si no hay filtro de piscina específica, traer último muestra por piscina
                if ($startDate && $endDate) {
                    $query .= " AND s.fecha_muestra BETWEEN :startDate AND :endDate";
                    $params[':startDate'] = $startDate;
                    $params[':endDate'] = $endDate;
                } else {
                    $query .= " AND s.fecha_muestra = (
                        SELECT MAX(fecha_muestra) FROM muestra
                        WHERE id_ciclo IN (SELECT id_ciclo FROM ciclo_productivo WHERE id_piscina = p.id_piscina))";
                }
            }

            $query .= " ORDER BY p.id_piscina, s.fecha_muestra DESC, s.fecha_creacion DESC, tb.nombre";

            $rawMuestras = $qb->executeQuery($query, $params, true);

            // Procesar resultado para pivotar tipos de balanceado
            $muestra_map = [];
            foreach ($rawMuestras as $row) {
                $id_muestra = $row['id_muestra'];

                if (!isset($muestra_map[$id_muestra])) {
                    // Primera vez que vemos esta muestra, crear entrada base
                    $muestra_map[$id_muestra] = $row;
                    // Remover las columnas de balanceado que no queremos repetidas
                    unset($muestra_map[$id_muestra]['tipo_balanceado']);
                    unset($muestra_map[$id_muestra]['cantidad_balanceado']);
                }

                // Agregar el tipo de balanceado como columna con su cantidad
                if ($row['tipo_balanceado']) {
                    $muestra_map[$id_muestra][$row['tipo_balanceado']] = $row['cantidad_balanceado'];
                }
            }

            $muestras = array_values($muestra_map);
            ErrorHandler::sendSuccessResponse($muestras);
        }

        exit();

    } else {
        ErrorHandler::sendErrorResponse('Método no permitido', HTTP_METHOD_NOT_ALLOWED);
    }

    exit();

} catch (Exception $e) {
    ErrorHandler::handleException($e);
}
