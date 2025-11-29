<?php
// Bootstrap - Incluir todas las dependencias centralizadas
require_once __DIR__ . '/../bootstrap.php';

// Validar conexión a base de datos
RequestValidator::validateDbConnection($conn);

$method = $_SERVER['REQUEST_METHOD'];
$qb = new DatabaseQueryBuilder($conn);

try {
    // POST con parámetro action=upload_pdf para carga de PDF
    if ($method === 'POST' && isset($_GET['action']) && $_GET['action'] === 'upload_pdf') {
        $file = RequestValidator::validateFileUpload('pdf', false);
        
        $idCiclo = RequestValidator::validateRequiredParam('id_ciclo', 'POST', false);
        $idCompania = RequestValidator::validateRequiredParam('id_compania', 'POST', false);
        
        if (!$idCiclo || !$idCompania) {
            ErrorHandler::handleValidationError('ID de ciclo e ID de compañía requeridos');
            exit();
        }

        // Crear el directorio de informes si no existe
        if (!is_dir(DIR_INFORMES)) {
            mkdir(DIR_INFORMES, 0755, true);
        }

        // Validar que sea un PDF
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
        
        $isValidPdf = ($mimeType === 'application/pdf') || preg_match('/\.pdf$/i', $file['name']);
        
        if (!$isValidPdf) {
            ErrorHandler::handleValidationError('El archivo debe ser un PDF válido');
            exit();
        }

        // Obtener nombre de la compañía
        $compania = $qb->getRecord('compania', 'id_compania = :id_compania', [':id_compania' => $idCompania], 'nombre');
        $nombreCompania = $compania ? $compania['nombre'] : 'desconocida';

        // Generar nombre único para el archivo
        $nombreSinExtension = pathinfo($file['name'], PATHINFO_FILENAME);
        $nombreSinExtension = preg_replace('/[^a-zA-Z0-9_-]/', '', str_replace(' ', '_', $nombreSinExtension));
        $nombreCompaniaArchivo = preg_replace('/[^a-zA-Z0-9_-]/', '', str_replace(' ', '_', $nombreCompania));
        
        $nombreArchivo = 'ciclo_' . $idCiclo . '_' . $nombreCompaniaArchivo . '_' . $nombreSinExtension . '.pdf';
        $rutaArchivo = DIR_INFORMES . '/' . $nombreArchivo;
        $rutaRelativa = 'Informes/' . $nombreArchivo;
        
        // Mover el archivo a la carpeta de informes
        if (!move_uploaded_file($file['tmp_name'], $rutaArchivo)) {
            ErrorHandler::sendErrorResponse('Error al guardar el archivo PDF', HTTP_INTERNAL_SERVER_ERROR);
            exit();
        }
        
        ErrorHandler::sendSuccessResponse(['ruta_pdf' => $rutaRelativa], SUCCESS_FILE_UPLOADED);
        exit();
    }

    // POST - Crear ciclo productivo
    if ($method === 'POST') {
        $input = RequestValidator::validateJsonInput();
        
        $requiredFields = ['id_piscina', 'fecha_siembra', 'cantidad_siembra', 'densidad', 'tipo_siembra', 'id_tipo_alimentacion', 'estado', 'id_compania', 'id_usuario_crea'];
        RequestValidator::validateJsonFields($input, $requiredFields);
        
        $id_usuario_actualiza = isset($input['id_usuario_actualiza']) && !empty($input['id_usuario_actualiza']) 
            ? intval($input['id_usuario_actualiza']) 
            : intval($input['id_usuario_crea']);
        
        $id_ciclo = $qb->insertRecord('ciclo_productivo', [
            'id_piscina' => intval($input['id_piscina']),
            'fecha_siembra' => $input['fecha_siembra'],
            'fecha_cosecha' => $input['fecha_cosecha'] ?? null,
            'cantidad_siembra' => intval($input['cantidad_siembra']),
            'densidad' => $input['densidad'],
            'tipo_siembra' => $input['tipo_siembra'],
            'id_tipo_alimentacion' => intval($input['id_tipo_alimentacion']),
            'biomasa_cosecha' => $input['biomasa_cosecha'] ?? null,
            'libras_por_hectarea' => $input['libras_por_hectarea'] ?? null,
            'promedio_incremento_peso' => $input['promedio_incremento_peso'] ?? null,
            'estado' => $input['estado'],
            'id_compania' => intval($input['id_compania']),
            'id_usuario_crea' => intval($input['id_usuario_crea']),
            'id_usuario_actualiza' => $id_usuario_actualiza,
            'fecha_creacion' => date('Y-m-d H:i:s'),
            'fecha_actualizacion' => date('Y-m-d H:i:s')
        ]);
        
        ErrorHandler::sendCreatedResponse(['id_ciclo' => $id_ciclo]);
        exit();
    }
    
    // PUT - Actualizar ciclo productivo
    if ($method === 'PUT') {
        $input = RequestValidator::validateJsonInput();
        
        $requiredFields = ['id_ciclo', 'id_piscina', 'fecha_siembra', 'cantidad_siembra', 'densidad', 'tipo_siembra', 'id_tipo_alimentacion', 'estado', 'id_compania', 'id_usuario_actualiza'];
        RequestValidator::validateJsonFields($input, $requiredFields);
        
        $id_ciclo = intval($input['id_ciclo']);
        $id_compania = intval($input['id_compania']);
        
        // Verificar que el ciclo pertenece a la compañía
        $cicloExists = $qb->countRecords('ciclo_productivo', 
            'id_ciclo = :id_ciclo AND id_compania = :id_compania',
            [':id_ciclo' => $id_ciclo, ':id_compania' => $id_compania]);
        
        if ($cicloExists === 0) {
            ErrorHandler::sendErrorResponse('Ciclo productivo no encontrado o no pertenece a su compañía', HTTP_NOT_FOUND);
            exit();
        }
        
        // Actualizar ciclo
        $qb->updateRecord('ciclo_productivo', [
            'id_piscina' => intval($input['id_piscina']),
            'fecha_siembra' => $input['fecha_siembra'],
            'fecha_cosecha' => $input['fecha_cosecha'] ?? null,
            'cantidad_siembra' => intval($input['cantidad_siembra']),
            'densidad' => $input['densidad'],
            'tipo_siembra' => $input['tipo_siembra'],
            'id_tipo_alimentacion' => intval($input['id_tipo_alimentacion']),
            'biomasa_cosecha' => $input['biomasa_cosecha'] ?? null,
            'libras_por_hectarea' => $input['libras_por_hectarea'] ?? null,
            'promedio_incremento_peso' => $input['promedio_incremento_peso'] ?? null,
            'ruta_pdf' => $input['ruta_pdf'] ?? null,
            'estado' => $input['estado'],
            'id_usuario_actualiza' => intval($input['id_usuario_actualiza']),
            'fecha_actualizacion' => date('Y-m-d H:i:s')
        ], 'id_ciclo = :id_ciclo AND id_compania = :id_compania',
           [':id_ciclo' => $id_ciclo, ':id_compania' => $id_compania]);
        
        ErrorHandler::sendUpdatedResponse();
        exit();
    }
    
    // GET - Obtener ciclos productivos
    if ($method === 'GET') {
        $id_compania = RequestValidator::validateIntegerParam('id_compania');
        
        // Si se proporciona id_ciclo específico, obtener solo ese ciclo
        if (isset($_GET['id_ciclo']) && !empty($_GET['id_ciclo'])) {
            $id_ciclo = RequestValidator::validateIntegerParam('id_ciclo');
            
            $query = "
                SELECT 
                    cp.id_ciclo, cp.id_piscina, p.codigo AS codigo_piscina, p.hectareas, p.ubicacion,
                    cp.fecha_siembra, cp.fecha_cosecha, cp.cantidad_siembra, cp.densidad, cp.tipo_siembra,
                    cp.id_tipo_alimentacion, ta.nombre AS nombre_tipo_alimentacion, cp.biomasa_cosecha,
                    cp.libras_por_hectarea, cp.promedio_incremento_peso, cp.ruta_pdf, cp.estado,
                    cp.id_compania, cp.fecha_creacion, cp.fecha_actualizacion
                FROM ciclo_productivo cp
                INNER JOIN piscina p ON cp.id_piscina = p.id_piscina
                LEFT JOIN tipo_alimentacion ta ON cp.id_tipo_alimentacion = ta.id_tipo_alimentacion
                WHERE cp.id_ciclo = :id_ciclo AND cp.id_compania = :id_compania";
            
            $ciclo = $qb->executeQuery($query, [':id_ciclo' => $id_ciclo, ':id_compania' => $id_compania], false);
            
            if (!$ciclo) {
                ErrorHandler::sendErrorResponse('Ciclo productivo no encontrado', HTTP_NOT_FOUND);
                exit();
            }
            
            ErrorHandler::sendSuccessResponse($ciclo);
            exit();
        }

        // Obtener todos los ciclos de la compañía
        $query = "
            SELECT 
                cp.id_ciclo, cp.id_piscina, p.codigo AS codigo_piscina, p.hectareas,
                cp.fecha_siembra, cp.fecha_cosecha, cp.cantidad_siembra, cp.densidad, cp.tipo_siembra,
                cp.id_tipo_alimentacion, ta.nombre AS nombre_tipo_alimentacion, cp.biomasa_cosecha,
                cp.libras_por_hectarea, cp.promedio_incremento_peso, cp.ruta_pdf, cp.estado,
                cp.id_compania, cp.fecha_creacion, cp.fecha_actualizacion
            FROM ciclo_productivo cp
            INNER JOIN piscina p ON cp.id_piscina = p.id_piscina
            LEFT JOIN tipo_alimentacion ta ON cp.id_tipo_alimentacion = ta.id_tipo_alimentacion
            WHERE cp.id_compania = :id_compania
            ORDER BY CASE WHEN cp.estado = 'EN_CURSO' THEN 0 ELSE 1 END, cp.fecha_siembra DESC";

        $ciclos = $qb->executeQuery($query, [':id_compania' => $id_compania], true);

        ErrorHandler::sendSuccessResponseWithTotal($ciclos, count($ciclos));
        exit();
    }
    
    // Método no permitido
    ErrorHandler::sendErrorResponse('Método no permitido', HTTP_METHOD_NOT_ALLOWED);
    
} catch (Exception $e) {
    ErrorHandler::handleException($e);
}