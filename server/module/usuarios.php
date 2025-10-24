<?php
// Incluir archivos necesarios
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

// Manejo de peticiones OPTIONS (preflight)
if ($method === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Manejo de peticiones GET - Obtener usuarios
if ($method === 'GET') {
    try {
        // Verificar que se envió el ID del usuario
        if (!isset($_GET['id_usuario']) || empty($_GET['id_usuario'])) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'message' => 'ID de usuario no proporcionado'
            ]);
            exit();
        }

        $id_usuario = $_GET['id_usuario'];

        // Consulta para obtener usuarios del mismo grupo empresarial
        $query = "
            SELECT 
                u.id_usuario,
                u.nombre,
                u.username,
                u.estado,
                u.tipo_usuario,
                u.id_grupo_empresarial,
                u.fecha_creacion,
                u.fecha_actualizacion
            FROM usuario u
            WHERE u.id_grupo_empresarial = (
                SELECT id_grupo_empresarial 
                FROM usuario 
                WHERE id_usuario = :id_usuario
            )
            ORDER BY u.fecha_creacion DESC
        ";

        $stmt = $conn->prepare($query);
        $stmt->bindParam(':id_usuario', $id_usuario, PDO::PARAM_INT);
        $stmt->execute();

        $usuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $usuarios,
            'message' => 'Usuarios obtenidos correctamente'
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error en la base de datos: ' . $e->getMessage()
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error del servidor: ' . $e->getMessage()
        ]);
    }
    exit();
}

// Manejo de peticiones POST - Crear usuario
if ($method === 'POST') {
    try {
        // Leer el cuerpo de la solicitud JSON
        $input = json_decode(file_get_contents('php://input'), true);

        // Validar campos requeridos
        if (!isset($input['nombre']) || empty(trim($input['nombre']))) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Nombre requerido']);
            exit();
        }

        if (!isset($input['username']) || empty(trim($input['username']))) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Username requerido']);
            exit();
        }

        if (!isset($input['password']) || empty(trim($input['password']))) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Password requerido']);
            exit();
        }

        if (!isset($input['estado']) || empty($input['estado'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Estado requerido']);
            exit();
        }

        if (!isset($input['tipo_usuario']) || empty(trim($input['tipo_usuario']))) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Tipo de usuario requerido']);
            exit();
        }

        if (!isset($input['id_usuario']) || empty($input['id_usuario'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID de usuario requerido']);
            exit();
        }

        // Obtener el id_grupo_empresarial del usuario autenticado (id_usuario enviado en el body)
        $id_usuario = intval($input['id_usuario']);

        $queryGrupo = "SELECT id_grupo_empresarial FROM usuario WHERE id_usuario = :id_usuario";
        $stmtGrupo = $conn->prepare($queryGrupo);
        $stmtGrupo->bindParam(':id_usuario', $id_usuario, PDO::PARAM_INT);
        $stmtGrupo->execute();
        $usuario = $stmtGrupo->fetch(PDO::FETCH_ASSOC);

        if (!$usuario || !$usuario['id_grupo_empresarial']) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'No se pudo obtener el grupo empresarial del usuario']);
            exit();
        }

        $id_grupo_empresarial = intval($usuario['id_grupo_empresarial']);

        $nombre = trim($input['nombre']);
        $username = trim($input['username']);
        // Por el momento almacenamos el password tal cual en password_hash (según instrucción)
        $password_hash = trim($input['password']);
        $estado = trim($input['estado']);
        $tipo_usuario = trim($input['tipo_usuario']);

        // Insertar nuevo usuario
        $insertQuery = "INSERT INTO usuario (nombre, username, password_hash, estado, tipo_usuario, id_grupo_empresarial, fecha_creacion, fecha_actualizacion)
                        VALUES (:nombre, :username, :password_hash, :estado, :tipo_usuario, :id_grupo_empresarial, NOW(), NOW())";

        $insertStmt = $conn->prepare($insertQuery);
        $insertStmt->bindParam(':nombre', $nombre, PDO::PARAM_STR);
        $insertStmt->bindParam(':username', $username, PDO::PARAM_STR);
        $insertStmt->bindParam(':password_hash', $password_hash, PDO::PARAM_STR);
        $insertStmt->bindParam(':estado', $estado, PDO::PARAM_STR);
        $insertStmt->bindParam(':tipo_usuario', $tipo_usuario, PDO::PARAM_STR);
        $insertStmt->bindParam(':id_grupo_empresarial', $id_grupo_empresarial, PDO::PARAM_INT);

        if ($insertStmt->execute()) {
            $new_id = $conn->lastInsertId();
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => 'Usuario creado exitosamente',
                'data' => [
                    'id_usuario' => $new_id,
                    'nombre' => $nombre,
                    'username' => $username,
                    'estado' => $estado,
                    'tipo_usuario' => $tipo_usuario,
                    'id_grupo_empresarial' => $id_grupo_empresarial
                ]
            ]);
            exit();
        } else {
            throw new Exception('Error al insertar el usuario en la base de datos');
        }

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error en la base de datos: ' . $e->getMessage()]);
        exit();
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Error del servidor: ' . $e->getMessage()]);
        exit();
    }
}

// Método no permitido
http_response_code(405);
echo json_encode([
    'success' => false,
    'message' => 'Método no permitido'
]);
exit();
