<?php
require_once __DIR__ . '/../helpers/CustomExceptions.php';

define('RESPONSE_SUCCESS', 'success');
define('RESPONSE_MESSAGE', 'message');
define('RESPONSE_DATA', 'data');
define('ERROR_SERVER', 'Error en el servidor: ');
define('VALIDATION_ID_USUARIO_REQUIRED', 'ID de usuario requerido');
define('VALIDATION_ID_COMPANIA_REQUIRED', 'ID de compañía requerido');
define('PARAM_GRUPO_EMPRESARIAL', ':id_grupo_empresarial');
define('PARAM_ID_USUARIO', ':id_usuario');
define('PARAM_NOMBRE', ':nombre');
define('PARAM_ID_COMPANIA', ':id_compania');
define('QUERY_USUARIO_GRUPO', "SELECT id_grupo_empresarial FROM usuario WHERE id_usuario = " . PARAM_ID_USUARIO . "");
define('SUBQUERY_USUARIO_GRUPO', "SELECT id_grupo_empresarial FROM usuario WHERE id_usuario = " . PARAM_ID_USUARIO . "");

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/cors.php';

header('Content-Type: application/json');

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

// Determinar el método de la solicitud
$method = $_SERVER['REQUEST_METHOD'];

try {
    if ($method === 'GET') {
        // Obtener el id_usuario desde los parámetros de la URL
        if (!isset($_GET['id_usuario']) || empty($_GET['id_usuario'])) {
            $response = [
                RESPONSE_SUCCESS => false,
                RESPONSE_MESSAGE => VALIDATION_ID_USUARIO_REQUIRED
            ];
            http_response_code(400);
            echo json_encode($response);
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
                    " . SUBQUERY_USUARIO_GRUPO . "
                )
                ORDER BY c.id_compania ASC";
        
        $stmt = $conn->prepare($query);
        $stmt->bindParam(PARAM_ID_USUARIO, $id_usuario, PDO::PARAM_INT);
        $stmt->execute();
        
        $companias = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $response = [
            RESPONSE_SUCCESS => true,
            RESPONSE_MESSAGE => 'Compañías obtenidas exitosamente',
            RESPONSE_DATA => $companias
        ];
        http_response_code(200);
        echo json_encode($response);
        
    } elseif ($method === 'POST') {
        // Leer el cuerpo de la solicitud JSON
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Validar campos requeridos
        if (!isset($input['nombre']) || empty($input['nombre'])) {
            $response = [
                RESPONSE_SUCCESS => false,
                RESPONSE_MESSAGE => 'Nombre de compañía requerido'
            ];
            http_response_code(400);
            echo json_encode($response);
            exit();
        }
        
        if (!isset($input['estado']) || empty($input['estado'])) {
            $response = [
                RESPONSE_SUCCESS => false,
                RESPONSE_MESSAGE => 'Estado requerido'
            ];
            http_response_code(400);
            echo json_encode($response);
            exit();
        }
        
        if (!isset($input['id_usuario']) || empty($input['id_usuario'])) {
            $response = [
                RESPONSE_SUCCESS => false,
                RESPONSE_MESSAGE => VALIDATION_ID_USUARIO_REQUIRED
            ];
            http_response_code(400);
            echo json_encode($response);
            exit();
        }
        
        // Obtener el id_grupo_empresarial del usuario
        $id_usuario = intval($input['id_usuario']);
        
        $queryGrupo = QUERY_USUARIO_GRUPO;
        $stmtGrupo = $conn->prepare($queryGrupo);
        $stmtGrupo->bindParam(PARAM_ID_USUARIO, $id_usuario, PDO::PARAM_INT);
        $stmtGrupo->execute();
        $usuario = $stmtGrupo->fetch(PDO::FETCH_ASSOC);
        
        if (!$usuario || !$usuario['id_grupo_empresarial']) {
            $response = [
                RESPONSE_SUCCESS => false,
                RESPONSE_MESSAGE => 'No se pudo obtener el grupo empresarial del usuario'
            ];
            http_response_code(400);
            echo json_encode($response);
            exit();
        }
        
        $id_grupo_empresarial = intval($usuario['id_grupo_empresarial']);
        $nombre = trim($input['nombre']);
        $direccion = isset($input['direccion']) && !empty(trim($input['direccion'])) ? trim($input['direccion']) : null;
        $telefono = isset($input['telefono']) && !empty(trim($input['telefono'])) ? trim($input['telefono']) : null;
        $estado = $input['estado'];
        
        // Verificar que no exista una compañía con el mismo nombre en el mismo grupo empresarial
        $checkQuery = "SELECT id_compania FROM compania WHERE nombre = " . PARAM_NOMBRE . " AND id_grupo_empresarial = " . PARAM_GRUPO_EMPRESARIAL . "";
        $checkStmt = $conn->prepare($checkQuery);
        $checkStmt->bindParam(PARAM_NOMBRE, $nombre, PDO::PARAM_STR);
        $checkStmt->bindParam(PARAM_GRUPO_EMPRESARIAL, $id_grupo_empresarial, PDO::PARAM_INT);
        $checkStmt->execute();
        
        if ($checkStmt->fetch()) {
            $response = [
                RESPONSE_SUCCESS => false,
                RESPONSE_MESSAGE => 'Ya existe una compañía con este nombre para este grupo empresarial'
            ];
            http_response_code(400);
            echo json_encode($response);
            exit();
        }
        
        // Insertar nueva compañía
        $insertQuery = "INSERT INTO compania (nombre, direccion, telefono, estado, id_grupo_empresarial, fecha_creacion, fecha_actualizacion) 
                        VALUES (" . PARAM_NOMBRE . ", :direccion, :telefono, :estado, " . PARAM_GRUPO_EMPRESARIAL . ", NOW(), NOW())";
        
        $insertStmt = $conn->prepare($insertQuery);
        $insertStmt->bindParam(PARAM_NOMBRE, $nombre, PDO::PARAM_STR);
        $insertStmt->bindParam(':direccion', $direccion, PDO::PARAM_STR);
        $insertStmt->bindParam(':telefono', $telefono, PDO::PARAM_STR);
        $insertStmt->bindParam(':estado', $estado, PDO::PARAM_STR);
        $insertStmt->bindParam(PARAM_GRUPO_EMPRESARIAL, $id_grupo_empresarial, PDO::PARAM_INT);
        
        if ($insertStmt->execute()) {
            $id_compania = $conn->lastInsertId();
            
            $response = [
                RESPONSE_SUCCESS => true,
                RESPONSE_MESSAGE => 'Compañía creada exitosamente',
                RESPONSE_DATA => [
                    'id_compania' => $id_compania,
                    'nombre' => $nombre,
                    'direccion' => $direccion,
                    'telefono' => $telefono,
                    'estado' => $estado,
                    'id_grupo_empresarial' => $id_grupo_empresarial
                ]
            ];
            http_response_code(201);
            echo json_encode($response);
        } else {
            throw new InsertException('Error al insertar la compañía en la base de datos');
        }
        
    } elseif ($method === 'PUT') {
        // Leer el cuerpo de la solicitud JSON
        $input = json_decode(file_get_contents('php://input'), true);
        
        // Validar campos requeridos
        if (!isset($input['id_compania']) || empty($input['id_compania'])) {
            $response = [
                RESPONSE_SUCCESS => false,
                RESPONSE_MESSAGE => VALIDATION_ID_COMPANIA_REQUIRED
            ];
            http_response_code(400);
            echo json_encode($response);
            exit();
        }
        
        if (!isset($input['nombre']) || empty($input['nombre'])) {
            $response = [
                RESPONSE_SUCCESS => false,
                RESPONSE_MESSAGE => 'Nombre de compañía requerido'
            ];
            http_response_code(400);
            echo json_encode($response);
            exit();
        }
        
        if (!isset($input['estado']) || empty($input['estado'])) {
            $response = [
                RESPONSE_SUCCESS => false,
                RESPONSE_MESSAGE => 'Estado requerido'
            ];
            http_response_code(400);
            echo json_encode($response);
            exit();
        }
        
        if (!isset($input['id_usuario']) || empty($input['id_usuario'])) {
            $response = [
                RESPONSE_SUCCESS => false,
                RESPONSE_MESSAGE => VALIDATION_ID_USUARIO_REQUIRED
            ];
            http_response_code(400);
            echo json_encode($response);
            exit();
        }
        
        $id_compania = intval($input['id_compania']);
        $id_usuario = intval($input['id_usuario']);
        $nombre = trim($input['nombre']);
        $direccion = isset($input['direccion']) && !empty(trim($input['direccion'])) ? trim($input['direccion']) : null;
        $telefono = isset($input['telefono']) && !empty(trim($input['telefono'])) ? trim($input['telefono']) : null;
        $estado = $input['estado'];
        
        // Verificar que la compañía pertenece al mismo grupo empresarial del usuario
        $queryVerify = "SELECT c.id_compania 
                        FROM compania c
                        WHERE c.id_compania = " . PARAM_ID_COMPANIA . " 
                        AND c.id_grupo_empresarial = (
                            " . SUBQUERY_USUARIO_GRUPO . "
                        )";
        
        $stmtVerify = $conn->prepare($queryVerify);
        $stmtVerify->bindParam(PARAM_ID_COMPANIA, $id_compania, PDO::PARAM_INT);
        $stmtVerify->bindParam(PARAM_ID_USUARIO, $id_usuario, PDO::PARAM_INT);
        $stmtVerify->execute();
        
        if (!$stmtVerify->fetch()) {
            $response = [
                RESPONSE_SUCCESS => false,
                RESPONSE_MESSAGE => 'No tiene permiso para editar esta compañía'
            ];
            http_response_code(403);
            echo json_encode($response);
            exit();
        }

        // Verificar que no exista otra compañía con el mismo nombre en el mismo grupo empresarial
        $checkQuery = "SELECT id_compania FROM compania WHERE nombre = " . PARAM_NOMBRE . " AND id_grupo_empresarial = (
            " . SUBQUERY_USUARIO_GRUPO . "
        ) AND id_compania != " . PARAM_ID_COMPANIA . "";
        
        $checkStmt = $conn->prepare($checkQuery);
        $checkStmt->bindParam(PARAM_NOMBRE, $nombre, PDO::PARAM_STR);
        $checkStmt->bindParam(PARAM_ID_USUARIO, $id_usuario, PDO::PARAM_INT);
        $checkStmt->bindParam(PARAM_ID_COMPANIA, $id_compania, PDO::PARAM_INT);
        $checkStmt->execute();
        
        if ($checkStmt->fetch()) {
            $response = [
                RESPONSE_SUCCESS => false,
                RESPONSE_MESSAGE => 'Ya existe una compañía con este nombre para este grupo empresarial'
            ];
            http_response_code(400);
            echo json_encode($response);
            exit();
        }
        
        // Actualizar la compañía
        $updateQuery = "UPDATE compania 
                        SET nombre = " . PARAM_NOMBRE . ", 
                            direccion = :direccion, 
                            telefono = :telefono, 
                            estado = :estado, 
                            fecha_actualizacion = NOW() 
                        WHERE id_compania = " . PARAM_ID_COMPANIA . "";
        
        $updateStmt = $conn->prepare($updateQuery);
        $updateStmt->bindParam(PARAM_NOMBRE, $nombre, PDO::PARAM_STR);
        $updateStmt->bindParam(':direccion', $direccion, PDO::PARAM_STR);
        $updateStmt->bindParam(':telefono', $telefono, PDO::PARAM_STR);
        $updateStmt->bindParam(':estado', $estado, PDO::PARAM_STR);
        $updateStmt->bindParam(PARAM_ID_COMPANIA, $id_compania, PDO::PARAM_INT);
        
        if ($updateStmt->execute()) {
            $response = [
                RESPONSE_SUCCESS => true,
                RESPONSE_MESSAGE => 'Compañía actualizada exitosamente',
                RESPONSE_DATA => [
                    'id_compania' => $id_compania,
                    'nombre' => $nombre,
                    'direccion' => $direccion,
                    'telefono' => $telefono,
                    'estado' => $estado
                ]
            ];
            http_response_code(200);
            echo json_encode($response);
        } else {
            throw new UpdateException('Error al actualizar la compañía en la base de datos');
        }
        
    } else {
        $response = [
            RESPONSE_SUCCESS => false,
            RESPONSE_MESSAGE => 'Método no permitido'
        ];
        http_response_code(405);
        echo json_encode($response);
    }
    
} catch (PDOException $e) {
    $response = [
        RESPONSE_SUCCESS => false,
        RESPONSE_MESSAGE => ERROR_SERVER . $e->getMessage()
    ];
    http_response_code(500);
    echo json_encode($response);
}