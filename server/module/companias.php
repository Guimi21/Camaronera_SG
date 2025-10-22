<?php
require_once(__DIR__ . '/../config/config.php');
require_once(__DIR__ . '/../helpers/response.php');
require_once(__DIR__ . '/../helpers/cors.php');

header('Content-Type: application/json');

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

// Determinar el método de la solicitud
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        // Obtener el id_usuario desde los parámetros de la URL
        if (!isset($_GET['id_usuario']) || empty($_GET['id_usuario'])) {
            $response = [
                'success' => false,
                'message' => 'ID de usuario requerido'
            ];
            echo json_encode($response);
            http_response_code(400);
            exit();
        }
        
        $id_usuario = intval($_GET['id_usuario']);
        
        // Consulta para obtener todas las compañías del mismo grupo empresarial del usuario
        $query = "SELECT 
                    c.id_compania,
                    c.nombre,
                    c.direccion,
                    c.telefono,
                    c.estado,
                    c.fecha_creacion,
                    c.fecha_actualizacion,
                    COALESCE(ge.nombre, 'Sin grupo') as grupo_empresarial
                FROM compania c
                LEFT JOIN grupo_empresarial ge ON c.id_grupo_empresarial = ge.id_grupo_empresarial
                WHERE c.id_grupo_empresarial = (
                    SELECT id_grupo_empresarial 
                    FROM usuario 
                    WHERE id_usuario = :id_usuario
                )
                ORDER BY c.id_compania ASC";
        
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':id_usuario', $id_usuario, PDO::PARAM_INT);
        $stmt->execute();
        
        $companias = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $response = [
            'success' => true,
            'message' => 'Compañías obtenidas exitosamente',
            'data' => $companias
        ];
        echo json_encode($response);
        http_response_code(200);
        
    } elseif ($method === 'POST') {
        // Leer el cuerpo de la solicitud JSON
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Validar campos requeridos
        if (!isset($input['nombre']) || empty($input['nombre'])) {
            $response = [
                'success' => false,
                'message' => 'Nombre de compañía requerido'
            ];
            echo json_encode($response);
            http_response_code(400);
            exit();
        }
        
        if (!isset($input['estado']) || empty($input['estado'])) {
            $response = [
                'success' => false,
                'message' => 'Estado requerido'
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
        
        // Obtener el id_grupo_empresarial del usuario
        $id_usuario = intval($input['id_usuario']);
        
        $queryGrupo = "SELECT id_grupo_empresarial FROM usuario WHERE id_usuario = :id_usuario";
        $stmtGrupo = $conn->prepare($queryGrupo);
        $stmtGrupo->bindParam(':id_usuario', $id_usuario, PDO::PARAM_INT);
        $stmtGrupo->execute();
        $usuario = $stmtGrupo->fetch(PDO::FETCH_ASSOC);
        
        if (!$usuario || !$usuario['id_grupo_empresarial']) {
            $response = [
                'success' => false,
                'message' => 'No se pudo obtener el grupo empresarial del usuario'
            ];
            echo json_encode($response);
            http_response_code(400);
            exit();
        }
        
        $id_grupo_empresarial = intval($usuario['id_grupo_empresarial']);
        $nombre = trim($input['nombre']);
        $direccion = isset($input['direccion']) && !empty(trim($input['direccion'])) ? trim($input['direccion']) : null;
        $telefono = isset($input['telefono']) && !empty(trim($input['telefono'])) ? trim($input['telefono']) : null;
        $estado = $input['estado'];
        
        // Insertar nueva compañía
        $insertQuery = "INSERT INTO compania (nombre, direccion, telefono, estado, id_grupo_empresarial, fecha_creacion, fecha_actualizacion) 
                        VALUES (:nombre, :direccion, :telefono, :estado, :id_grupo_empresarial, NOW(), NOW())";
        
        $insertStmt = $conn->prepare($insertQuery);
        $insertStmt->bindParam(':nombre', $nombre, PDO::PARAM_STR);
        $insertStmt->bindParam(':direccion', $direccion, PDO::PARAM_STR);
        $insertStmt->bindParam(':telefono', $telefono, PDO::PARAM_STR);
        $insertStmt->bindParam(':estado', $estado, PDO::PARAM_STR);
        $insertStmt->bindParam(':id_grupo_empresarial', $id_grupo_empresarial, PDO::PARAM_INT);
        
        if ($insertStmt->execute()) {
            $id_compania = $conn->lastInsertId();
            
            $response = [
                'success' => true,
                'message' => 'Compañía creada exitosamente',
                'data' => [
                    'id_compania' => $id_compania,
                    'nombre' => $nombre,
                    'direccion' => $direccion,
                    'telefono' => $telefono,
                    'estado' => $estado,
                    'id_grupo_empresarial' => $id_grupo_empresarial
                ]
            ];
            echo json_encode($response);
            http_response_code(201);
        } else {
            throw new Exception('Error al insertar la compañía en la base de datos');
        }
        
    } else {
        $response = [
            'success' => false,
            'message' => 'Método no permitido'
        ];
        echo json_encode($response);
        http_response_code(405);
    }
    
} catch (PDOException $e) {
    $response = [
        'success' => false,
        'message' => 'Error en el servidor: ' . $e->getMessage()
    ];
    echo json_encode($response);
    http_response_code(500);
}
?>
