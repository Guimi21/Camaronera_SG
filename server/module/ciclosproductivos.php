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
    http_response_code(500);
    echo json_encode($response);
    exit();
}

// Determinar el método de la solicitud
$method = $_SERVER['REQUEST_METHOD'];

try {
    // Primero, verificar si es una solicitud de carga de PDF
    if ($method === 'POST' && isset($_GET['action']) && $_GET['action'] === 'upload_pdf') {
        // Crear el directorio de informes si no existe
        $informesDir = __DIR__ . '/../Informes';
        if (!is_dir($informesDir)) {
            mkdir($informesDir, 0755, true);
        }
        
        // Validar que exista el archivo PDF
        if (!isset($_FILES['pdf']) || $_FILES['pdf']['error'] !== UPLOAD_ERR_OK) {
            $response = [
                'success' => false,
                'message' => 'No se recibió ningún archivo PDF o hubo un error en la carga'
            ];
            http_response_code(400);
            echo json_encode($response);
            exit();
        }
        
        $pdfFile = $_FILES['pdf'];
        $idCiclo = isset($_POST['id_ciclo']) ? $_POST['id_ciclo'] : null;
        $idCompania = isset($_POST['id_compania']) ? $_POST['id_compania'] : null;
        
        // Obtener el nombre de la compañía
        $nombreCompania = '';
        if ($idCompania) {
            $queryCompania = "SELECT nombre FROM compania WHERE id_compania = :id_compania";
            $stmtCompania = $conn->prepare($queryCompania);
            $stmtCompania->bindParam(':id_compania', $idCompania);
            $stmtCompania->execute();
            $resultCompania = $stmtCompania->fetch(PDO::FETCH_ASSOC);
            if ($resultCompania) {
                $nombreCompania = $resultCompania['nombre'];
            }
        }
        
        // Validar que sea un PDF
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $pdfFile['tmp_name']);
        finfo_close($finfo);
        
        $isValidPdf = ($mimeType === 'application/pdf') || preg_match('/\.pdf$/i', $pdfFile['name']);
        
        if (!$isValidPdf) {
            $response = [
                'success' => false,
                'message' => 'El archivo debe ser un PDF válido'
            ];
            http_response_code(400);
            echo json_encode($response);
            exit();
        }
        
        // Generar nombre único para el archivo
        // Extraer el nombre sin extensión y reemplazar espacios con guiones
        $nombreSinExtension = pathinfo($pdfFile['name'], PATHINFO_FILENAME);
        $nombreSinExtension = str_replace(' ', '_', $nombreSinExtension);
        // Remover caracteres especiales que no sean guiones bajos y letras/números
        $nombreSinExtension = preg_replace('/[^a-zA-Z0-9_-]/', '', $nombreSinExtension);
        
        // Limpiar el nombre de la compañía para el archivo
        $nombreCompaniaArchivo = str_replace(' ', '_', $nombreCompania);
        $nombreCompaniaArchivo = preg_replace('/[^a-zA-Z0-9_-]/', '', $nombreCompaniaArchivo);
        
        $nombreArchivo = 'ciclo_' . $idCiclo . '_' . $nombreCompaniaArchivo . '_' . $nombreSinExtension . '.pdf';
        $rutaArchivo = $informesDir . '/' . $nombreArchivo;
        $rutaRelativa = 'Informes/' . $nombreArchivo;
        
        // Mover el archivo a la carpeta de informes
        if (!move_uploaded_file($pdfFile['tmp_name'], $rutaArchivo)) {
            $response = [
                'success' => false,
                'message' => 'Error al guardar el archivo PDF'
            ];
            http_response_code(500);
            echo json_encode($response);
            exit();
        }
        
        $response = [
            'success' => true,
            'message' => 'PDF cargado exitosamente',
            'ruta_pdf' => $rutaRelativa
        ];
        
        http_response_code(200);
        echo json_encode($response);
        exit();
    }

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
            http_response_code(400);
            echo json_encode($response);
            exit();
        }
        
        if (!isset($input['fecha_siembra']) || empty($input['fecha_siembra'])) {
            $response = [
                'success' => false,
                'message' => 'Fecha de siembra requerida'
            ];
            http_response_code(400);
            echo json_encode($response);
            exit();
        }
        
        if (!isset($input['cantidad_siembra']) || empty($input['cantidad_siembra'])) {
            $response = [
                'success' => false,
                'message' => 'Cantidad de siembra requerida'
            ];
            http_response_code(400);
            echo json_encode($response);
            exit();
        }
        
        if (!isset($input['densidad']) || empty($input['densidad'])) {
            $response = [
                'success' => false,
                'message' => 'Densidad requerida'
            ];
            http_response_code(400);
            echo json_encode($response);
            exit();
        }
        
        if (!isset($input['tipo_siembra']) || empty($input['tipo_siembra'])) {
            $response = [
                'success' => false,
                'message' => 'Tipo de siembra requerido'
            ];
            http_response_code(400);
            echo json_encode($response);
            exit();
        }
        
        if (!isset($input['id_tipo_alimentacion']) || empty($input['id_tipo_alimentacion'])) {
            $response = [
                'success' => false,
                'message' => 'Tipo de alimentación requerido'
            ];
            http_response_code(400);
            echo json_encode($response);
            exit();
        }
        
        if (!isset($input['estado']) || empty($input['estado'])) {
            $response = [
                'success' => false,
                'message' => 'Estado requerido'
            ];
            http_response_code(400);
            echo json_encode($response);
            exit();
        }
        
        if (!isset($input['id_compania']) || empty($input['id_compania'])) {
            $response = [
                'success' => false,
                'message' => 'ID de compañía requerido'
            ];
            http_response_code(400);
            echo json_encode($response);
            exit();
        }
        
        if (!isset($input['id_usuario_crea']) || empty($input['id_usuario_crea'])) {
            $response = [
                'success' => false,
                'message' => 'ID de usuario requerido'
            ];
            http_response_code(400);
            echo json_encode($response);
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
                id_tipo_alimentacion,
                biomasa_cosecha,
                libras_por_hectarea,
                promedio_incremento_peso,
                estado,
                id_compania,
                id_usuario_crea,
                id_usuario_actualiza
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ";
        
        $stmt = $conn->prepare($query);
        $stmt->bindValue(1, $input['id_piscina'], PDO::PARAM_INT);
        $stmt->bindValue(2, $input['fecha_siembra']);
        $stmt->bindValue(3, $input['fecha_cosecha'] ?? null);
        $stmt->bindValue(4, $input['cantidad_siembra'], PDO::PARAM_INT);
        $stmt->bindValue(5, $input['densidad']);
        $stmt->bindValue(6, $input['tipo_siembra']);
        $stmt->bindValue(7, $input['id_tipo_alimentacion'], PDO::PARAM_INT);
        $stmt->bindValue(8, $input['biomasa_cosecha'] ?? null);
        $stmt->bindValue(9, $input['libras_por_hectarea'] ?? null);
        $stmt->bindValue(10, $input['promedio_incremento_peso'] ?? null);
        $stmt->bindValue(11, $input['estado']);
        $stmt->bindValue(12, $input['id_compania'], PDO::PARAM_INT);
        $stmt->bindValue(13, $input['id_usuario_crea'], PDO::PARAM_INT);
        $stmt->bindValue(14, $id_usuario_actualiza, PDO::PARAM_INT);
        
        $stmt->execute();
        
        $id_ciclo = $conn->lastInsertId();
        
        $response = [
            'success' => true,
            'message' => 'Ciclo productivo creado exitosamente',
            'id_ciclo' => $id_ciclo
        ];
        
        http_response_code(201);
        echo json_encode($response);
        exit();
    }
    
    // Manejar solicitud PUT para actualizar un ciclo productivo existente
    if ($method === 'PUT') {
        // Leer el cuerpo de la solicitud JSON
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Validar que se envíe el ID del ciclo a actualizar
        if (!isset($input['id_ciclo']) || empty($input['id_ciclo'])) {
            $response = [
                'success' => false,
                'message' => 'ID de ciclo requerido'
            ];
            http_response_code(400);
            echo json_encode($response);
            exit();
        }
        
        // Validar campos requeridos
        if (!isset($input['id_piscina']) || empty($input['id_piscina'])) {
            $response = [
                'success' => false,
                'message' => 'ID de piscina requerido'
            ];
            http_response_code(400);
            echo json_encode($response);
            exit();
        }
        
        if (!isset($input['fecha_siembra']) || empty($input['fecha_siembra'])) {
            $response = [
                'success' => false,
                'message' => 'Fecha de siembra requerida'
            ];
            http_response_code(400);
            echo json_encode($response);
            exit();
        }
        
        if (!isset($input['cantidad_siembra']) || empty($input['cantidad_siembra'])) {
            $response = [
                'success' => false,
                'message' => 'Cantidad de siembra requerida'
            ];
            http_response_code(400);
            echo json_encode($response);
            exit();
        }
        
        if (!isset($input['densidad']) || empty($input['densidad'])) {
            $response = [
                'success' => false,
                'message' => 'Densidad requerida'
            ];
            http_response_code(400);
            echo json_encode($response);
            exit();
        }
        
        if (!isset($input['tipo_siembra']) || empty($input['tipo_siembra'])) {
            $response = [
                'success' => false,
                'message' => 'Tipo de siembra requerido'
            ];
            http_response_code(400);
            echo json_encode($response);
            exit();
        }
        
        if (!isset($input['id_tipo_alimentacion']) || empty($input['id_tipo_alimentacion'])) {
            $response = [
                'success' => false,
                'message' => 'Tipo de alimentación requerido'
            ];
            http_response_code(400);
            echo json_encode($response);
            exit();
        }
        
        if (!isset($input['estado']) || empty($input['estado'])) {
            $response = [
                'success' => false,
                'message' => 'Estado requerido'
            ];
            http_response_code(400);
            echo json_encode($response);
            exit();
        }
        
        if (!isset($input['id_compania']) || empty($input['id_compania'])) {
            $response = [
                'success' => false,
                'message' => 'ID de compañía requerido'
            ];
            http_response_code(400);
            echo json_encode($response);
            exit();
        }
        
        if (!isset($input['id_usuario_actualiza']) || empty($input['id_usuario_actualiza'])) {
            $response = [
                'success' => false,
                'message' => 'ID de usuario requerido'
            ];
            http_response_code(400);
            echo json_encode($response);
            exit();
        }
        
        // Verificar que el ciclo pertenece a la compañía del usuario
        $verifyQuery = "SELECT id_ciclo FROM ciclo_productivo WHERE id_ciclo = ? AND id_compania = ?";
        $verifyStmt = $conn->prepare($verifyQuery);
        $verifyStmt->bindValue(1, $input['id_ciclo'], PDO::PARAM_INT);
        $verifyStmt->bindValue(2, $input['id_compania'], PDO::PARAM_INT);
        $verifyStmt->execute();
        
        if ($verifyStmt->rowCount() === 0) {
            $response = [
                'success' => false,
                'message' => 'Ciclo productivo no encontrado o no pertenece a su compañía'
            ];
            http_response_code(404);
            echo json_encode($response);
            exit();
        }
        
        // Actualizar el ciclo productivo
        $query = "
            UPDATE ciclo_productivo SET
                id_piscina = ?,
                fecha_siembra = ?,
                fecha_cosecha = ?,
                cantidad_siembra = ?,
                densidad = ?,
                tipo_siembra = ?,
                id_tipo_alimentacion = ?,
                biomasa_cosecha = ?,
                libras_por_hectarea = ?,
                promedio_incremento_peso = ?,
                ruta_pdf = ?,
                estado = ?,
                id_usuario_actualiza = ?,
                fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE id_ciclo = ? AND id_compania = ?
        ";
        
        $stmt = $conn->prepare($query);
        $stmt->bindValue(1, $input['id_piscina'], PDO::PARAM_INT);
        $stmt->bindValue(2, $input['fecha_siembra']);
        $stmt->bindValue(3, $input['fecha_cosecha'] ?? null);
        $stmt->bindValue(4, $input['cantidad_siembra'], PDO::PARAM_INT);
        $stmt->bindValue(5, $input['densidad']);
        $stmt->bindValue(6, $input['tipo_siembra']);
        $stmt->bindValue(7, $input['id_tipo_alimentacion'], PDO::PARAM_INT);
        $stmt->bindValue(8, $input['biomasa_cosecha'] ?? null);
        $stmt->bindValue(9, $input['libras_por_hectarea'] ?? null);
        $stmt->bindValue(10, $input['promedio_incremento_peso'] ?? null);
        $stmt->bindValue(11, $input['ruta_pdf'] ?? null);
        $stmt->bindValue(12, $input['estado']);
        $stmt->bindValue(13, $input['id_usuario_actualiza'], PDO::PARAM_INT);
        $stmt->bindValue(14, $input['id_ciclo'], PDO::PARAM_INT);
        $stmt->bindValue(15, $input['id_compania'], PDO::PARAM_INT);
        
        $stmt->execute();
        
        $response = [
            'success' => true,
            'message' => 'Ciclo productivo actualizado exitosamente'
        ];
        
        http_response_code(200);
        echo json_encode($response);
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
            http_response_code(400);
            echo json_encode($response);
            exit();
        }

        // Si se proporciona un id_ciclo específico, obtener solo ese ciclo
        if (isset($_GET['id_ciclo']) && !empty($_GET['id_ciclo'])) {
            $id_ciclo = $_GET['id_ciclo'];
            
            $query = "
            SELECT 
                cp.id_ciclo,
                cp.id_piscina,
                p.codigo AS codigo_piscina,
                p.hectareas,
                p.ubicacion,
                cp.fecha_siembra,
                cp.fecha_cosecha,
                cp.cantidad_siembra,
                cp.densidad,
                cp.tipo_siembra,
                cp.id_tipo_alimentacion,
                ta.nombre AS nombre_tipo_alimentacion,
                cp.biomasa_cosecha,
                cp.libras_por_hectarea,
                cp.promedio_incremento_peso,
                cp.ruta_pdf,
                cp.estado,
                cp.id_compania,
                cp.fecha_creacion,
                cp.fecha_actualizacion
            FROM 
                ciclo_productivo cp
                INNER JOIN piscina p ON cp.id_piscina = p.id_piscina
                LEFT JOIN tipo_alimentacion ta ON cp.id_tipo_alimentacion = ta.id_tipo_alimentacion
            WHERE 
                cp.id_ciclo = ? AND cp.id_compania = ?
            ";
            
            $stmt = $conn->prepare($query);
            $stmt->bindValue(1, $id_ciclo, PDO::PARAM_INT);
            $stmt->bindValue(2, $id_compania, PDO::PARAM_INT);
            $stmt->execute();
            
            $ciclo = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$ciclo) {
                $response = [
                    'success' => false,
                    'message' => 'Ciclo productivo no encontrado'
                ];
                http_response_code(404);
                echo json_encode($response);
                exit();
            }
            
            $response = [
                'success' => true,
                'data' => $ciclo
            ];
            
            http_response_code(200);
            echo json_encode($response);
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
            cp.id_tipo_alimentacion,
            ta.nombre AS nombre_tipo_alimentacion,
            cp.biomasa_cosecha,
            cp.libras_por_hectarea,
            cp.promedio_incremento_peso,
            cp.ruta_pdf,
            cp.estado,
            cp.id_compania,
            cp.fecha_creacion,
            cp.fecha_actualizacion
        FROM 
            ciclo_productivo cp
            INNER JOIN piscina p ON cp.id_piscina = p.id_piscina
            LEFT JOIN tipo_alimentacion ta ON cp.id_tipo_alimentacion = ta.id_tipo_alimentacion
        WHERE 
            cp.id_compania = ?
        ORDER BY 
            CASE WHEN cp.estado = 'EN_CURSO' THEN 0 ELSE 1 END,
            cp.fecha_siembra DESC
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

        http_response_code(200);
        echo json_encode($response);
        exit();
    }
    
    // Método no permitido
    $response = [
        'success' => false,
        'message' => 'Método no permitido'
    ];
    http_response_code(405);
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