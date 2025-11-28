<?php
require_once __DIR__ . '/../helpers/CustomExceptions.php';
// Incluir archivos necesarios
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/cors.php';

header('Content-Type: application/json');

// Definir constantes
define('PARAM_ID_USUARIO', ':id_usuario');
define('PARAM_USERNAME', ':username');
define('PARAM_NOMBRE', ':nombre');
define('PARAM_PASSWORD_HASH', ':password_hash');
define('PARAM_ESTADO', ':estado');
define('PARAM_ID_GRUPO_EMPRESARIAL', ':id_grupo_empresarial');
define('PARAM_ID_PERFIL', ':id_perfil');
define('PARAM_ID_COMPANIA', ':id_compania');
define('PARAM_ID_USUARIO_EDIT', ':id_usuario_edit');
define('ERROR_DB_PREFIX', 'Error en la base de datos: ');
define('ERROR_SERVER_PREFIX', 'Error del servidor: ');
define('INPUT_STREAM', 'php://input');

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
                u.id_grupo_empresarial,
                u.fecha_creacion,
                u.fecha_actualizacion,
                GROUP_CONCAT(DISTINCT p.nombre ORDER BY p.nombre SEPARATOR ', ') as perfiles,
                GROUP_CONCAT(DISTINCT c.nombre ORDER BY c.nombre SEPARATOR ', ') as companias
            FROM usuario u
            LEFT JOIN usuario_perfil up ON u.id_usuario = up.id_usuario
            LEFT JOIN perfil p ON up.id_perfil = p.id_perfil
            LEFT JOIN usuario_compania uc ON u.id_usuario = uc.id_usuario
            LEFT JOIN compania c ON uc.id_compania = c.id_compania
            WHERE u.id_grupo_empresarial = (
                SELECT id_grupo_empresarial 
                FROM usuario 
                WHERE id_usuario = " . PARAM_ID_USUARIO . "
            )
            GROUP BY u.id_usuario, u.nombre, u.username, u.estado, u.id_grupo_empresarial, u.fecha_creacion, u.fecha_actualizacion
            ORDER BY u.fecha_creacion DESC
        ";

        $stmt = $conn->prepare($query);
        $stmt->bindParam(PARAM_ID_USUARIO, $id_usuario, PDO::PARAM_INT);
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
            'message' => ERROR_DB_PREFIX . $e->getMessage()
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => ERROR_SERVER_PREFIX . $e->getMessage()
        ]);
    }
    exit();
}

// Manejo de peticiones POST - Crear usuario
if ($method === 'POST') {
    try {
        // Leer el cuerpo de la solicitud JSON
        $input = json_decode(file_get_contents(INPUT_STREAM), true);

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

        if (!isset($input['perfiles']) || !is_array($input['perfiles']) || count($input['perfiles']) === 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Al menos un perfil es requerido']);
            exit();
        }

        // companias es opcional para Superadministrador
        $companias = isset($input['companias']) && is_array($input['companias']) ? $input['companias'] : [];
        
        // Validar que si no se proporciona idGrupoEmpresarial (no es Superadministrador), tenga al menos una compañía
        $isSuperadmin = isset($input['idGrupoEmpresarial']) && !empty($input['idGrupoEmpresarial']);
        if (empty($companias) && !$isSuperadmin) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Al menos una compañía es requerida']);
            exit();
        }

        if (!isset($input['id_usuario']) || empty($input['id_usuario'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID de usuario requerido']);
            exit();
        }

        // Obtener el id_grupo_empresarial del usuario autenticado (id_usuario enviado en el body)
        $id_usuario = intval($input['id_usuario']);

        // Obtener el id_grupo_empresarial
        $id_grupo_empresarial = null;

        // Si se proporciona idGrupoEmpresarial (Superadministrador), usar ese
        if (isset($input['idGrupoEmpresarial']) && !empty($input['idGrupoEmpresarial'])) {
            $id_grupo_empresarial = intval($input['idGrupoEmpresarial']);
            
            // Validar que el grupo empresarial existe
            $queryGrupoValida = "SELECT id_grupo_empresarial FROM grupo_empresarial WHERE id_grupo_empresarial = :id_grupo";
            $stmtGrupoValida = $conn->prepare($queryGrupoValida);
            $stmtGrupoValida->bindParam(':id_grupo', $id_grupo_empresarial, PDO::PARAM_INT);
            $stmtGrupoValida->execute();
            
            if ($stmtGrupoValida->rowCount() === 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Grupo empresarial inválido']);
                exit();
            }
        } else {
            // Si no se proporciona, obtener el del usuario autenticado
            $queryGrupo = "SELECT id_grupo_empresarial FROM usuario WHERE id_usuario = " . PARAM_ID_USUARIO . "";
            $stmtGrupo = $conn->prepare($queryGrupo);
            $stmtGrupo->bindParam(PARAM_ID_USUARIO, $id_usuario, PDO::PARAM_INT);
            $stmtGrupo->execute();
            $usuario = $stmtGrupo->fetch(PDO::FETCH_ASSOC);

            if (!$usuario || !$usuario['id_grupo_empresarial']) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'No se pudo obtener el grupo empresarial del usuario']);
                exit();
            }

            $id_grupo_empresarial = intval($usuario['id_grupo_empresarial']);
        }

        $nombre = trim($input['nombre']);
        $username = trim($input['username']);
        
        // Validar que el username no exista en la base de datos
        $queryUsernameExists = "SELECT id_usuario FROM usuario WHERE username = " . PARAM_USERNAME . "";
        $stmtUsernameExists = $conn->prepare($queryUsernameExists);
        $stmtUsernameExists->bindParam(PARAM_USERNAME, $username, PDO::PARAM_STR);
        $stmtUsernameExists->execute();
        
        if ($stmtUsernameExists->rowCount() > 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'El Usuario (username) ya existe en el sistema']);
            exit();
        }
        
        // Hashear la contraseña usando password_hash() de PHP
        $password_hash = password_hash(trim($input['password']), PASSWORD_BCRYPT);
        $estado = trim($input['estado']);
        $perfiles = $input['perfiles']; // Array de IDs de perfiles
        // $companias ya fue procesada antes, no reasignar

        // Insertar nuevo usuario
        $insertQuery = "INSERT INTO usuario (nombre, username, password_hash, estado, id_grupo_empresarial, fecha_creacion, fecha_actualizacion)
                        VALUES (" . PARAM_NOMBRE . ", " . PARAM_USERNAME . ", " . PARAM_PASSWORD_HASH . ", " . PARAM_ESTADO . ", " . PARAM_ID_GRUPO_EMPRESARIAL . ", NOW(), NOW())";

        $insertStmt = $conn->prepare($insertQuery);
        $insertStmt->bindParam(PARAM_NOMBRE, $nombre, PDO::PARAM_STR);
        $insertStmt->bindParam(PARAM_USERNAME, $username, PDO::PARAM_STR);
        $insertStmt->bindParam(PARAM_PASSWORD_HASH, $password_hash, PDO::PARAM_STR);
        $insertStmt->bindParam(PARAM_ESTADO, $estado, PDO::PARAM_STR);
        $insertStmt->bindParam(PARAM_ID_GRUPO_EMPRESARIAL, $id_grupo_empresarial, PDO::PARAM_INT);

        if ($insertStmt->execute()) {
            $new_id = $conn->lastInsertId();
            
            // Insertar relaciones usuario-perfil
            $insertPerfilQuery = "INSERT INTO usuario_perfil (id_usuario, id_perfil) VALUES (" . PARAM_ID_USUARIO . ", " . PARAM_ID_PERFIL . ")";
            $insertPerfilStmt = $conn->prepare($insertPerfilQuery);
            
            foreach ($perfiles as $id_perfil) {
                $insertPerfilStmt->bindParam(PARAM_ID_USUARIO, $new_id, PDO::PARAM_INT);
                $insertPerfilStmt->bindParam(PARAM_ID_PERFIL, $id_perfil, PDO::PARAM_INT);
                $insertPerfilStmt->execute();
            }
            
            // Insertar relaciones usuario-compañía (solo si existen compañías)
            if (!empty($companias)) {
                $insertCompaniaQuery = "INSERT INTO usuario_compania (id_usuario, id_compania) VALUES (" . PARAM_ID_USUARIO . ", " . PARAM_ID_COMPANIA . ")";
                $insertCompaniaStmt = $conn->prepare($insertCompaniaQuery);
                
                foreach ($companias as $id_compania) {
                    $insertCompaniaStmt->bindParam(PARAM_ID_USUARIO, $new_id, PDO::PARAM_INT);
                    $insertCompaniaStmt->bindParam(PARAM_ID_COMPANIA, $id_compania, PDO::PARAM_INT);
                    $insertCompaniaStmt->execute();
                }
            }
            
            // Obtener nombres de perfiles asignados
            $queryPerfiles = "SELECT p.nombre FROM perfil p 
                             JOIN usuario_perfil up ON p.id_perfil = up.id_perfil 
                             WHERE up.id_usuario = " . PARAM_ID_USUARIO . "";
            $stmtPerfiles = $conn->prepare($queryPerfiles);
            $stmtPerfiles->bindParam(PARAM_ID_USUARIO, $new_id, PDO::PARAM_INT);
            $stmtPerfiles->execute();
            $perfilesNombres = $stmtPerfiles->fetchAll(PDO::FETCH_COLUMN);
            
            // Obtener nombres de compañías asignadas
            $queryCompanias = "SELECT c.nombre FROM compania c 
                              JOIN usuario_compania uc ON c.id_compania = uc.id_compania 
                              WHERE uc.id_usuario = " . PARAM_ID_USUARIO . "";
            $stmtCompanias = $conn->prepare($queryCompanias);
            $stmtCompanias->bindParam(PARAM_ID_USUARIO, $new_id, PDO::PARAM_INT);
            $stmtCompanias->execute();
            $companiasNombres = $stmtCompanias->fetchAll(PDO::FETCH_COLUMN);
            
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => 'Usuario creado exitosamente',
                'data' => [
                    'id_usuario' => $new_id,
                    'nombre' => $nombre,
                    'username' => $username,
                    'estado' => $estado,
                    'perfiles' => implode(', ', $perfilesNombres),
                    'companias' => implode(', ', $companiasNombres),
                    'id_grupo_empresarial' => $id_grupo_empresarial
                ]
            ]);
            exit();
        } else {
            throw new InsertException('Error al insertar el usuario en la base de datos');
        }

    } catch (PDOException $e) {
        // Verificar si es un error de clave duplicada (username)
        if ($e->getCode() == '23000') {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'El Usuario (username) ya existe en el sistema']);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => ERROR_DB_PREFIX . $e->getMessage()]);
        }
        exit();
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => ERROR_SERVER_PREFIX . $e->getMessage()]);
        exit();
    }
}

// Manejo de peticiones PUT - Actualizar usuario
if ($method === 'PUT') {
    try {
        // Leer el cuerpo de la solicitud JSON
        $input = json_decode(file_get_contents(INPUT_STREAM), true);

        // Validar campos requeridos
        if (!isset($input['nombre']) || empty(trim($input['nombre']))) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Nombre requerido']);
            exit();
        }

        if (!isset($input['perfiles']) || !is_array($input['perfiles']) || count($input['perfiles']) === 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Al menos un perfil es requerido']);
            exit();
        }

        if (!isset($input['companias']) || !is_array($input['companias'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Compañías debe ser un array']);
            exit();
        }

        if (!isset($input['estado']) || empty($input['estado'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Estado requerido']);
            exit();
        }

        if (!isset($input['id_usuario_edit']) || empty($input['id_usuario_edit'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID de usuario a editar requerido']);
            exit();
        }

        if (!isset($input['id_usuario']) || empty($input['id_usuario'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID de usuario autenticado requerido']);
            exit();
        }

        $id_usuario_edit = intval($input['id_usuario_edit']);
        $id_usuario_autenticado = intval($input['id_usuario']);
        $nombre = trim($input['nombre']);
        $estado = trim($input['estado']);
        $perfiles = $input['perfiles'];
        $companias = $input['companias'];
        
        // Procesar contraseña solo si se proporciona
        $password_hash = null;
        if (isset($input['password']) && !empty(trim($input['password']))) {
            $password_hash = password_hash(trim($input['password']), PASSWORD_BCRYPT);
        }

        // Actualizar datos del usuario
        if ($password_hash) {
            // Incluir actualización de contraseña
            $updateQuery = "UPDATE usuario SET nombre = " . PARAM_NOMBRE . ", estado = " . PARAM_ESTADO . ", password_hash = " . PARAM_PASSWORD_HASH . ", fecha_actualizacion = NOW()
                            WHERE id_usuario = " . PARAM_ID_USUARIO_EDIT . "";
            $updateStmt = $conn->prepare($updateQuery);
            $updateStmt->bindParam(PARAM_NOMBRE, $nombre, PDO::PARAM_STR);
            $updateStmt->bindParam(PARAM_ESTADO, $estado, PDO::PARAM_STR);
            $updateStmt->bindParam(PARAM_PASSWORD_HASH, $password_hash, PDO::PARAM_STR);
            $updateStmt->bindParam(PARAM_ID_USUARIO_EDIT, $id_usuario_edit, PDO::PARAM_INT);
        } else {
            // Sin actualización de contraseña
            $updateQuery = "UPDATE usuario SET nombre = " . PARAM_NOMBRE . ", estado = " . PARAM_ESTADO . ", fecha_actualizacion = NOW()
                            WHERE id_usuario = " . PARAM_ID_USUARIO_EDIT . "";
            $updateStmt = $conn->prepare($updateQuery);
            $updateStmt->bindParam(PARAM_NOMBRE, $nombre, PDO::PARAM_STR);
            $updateStmt->bindParam(PARAM_ESTADO, $estado, PDO::PARAM_STR);
            $updateStmt->bindParam(PARAM_ID_USUARIO_EDIT, $id_usuario_edit, PDO::PARAM_INT);
        }

        if (!$updateStmt->execute()) {
            throw new UpdateException('Error al actualizar el usuario');
        }

        // Eliminar perfiles antiguos
        $deletePerfilQuery = "DELETE FROM usuario_perfil WHERE id_usuario = " . PARAM_ID_USUARIO . "";
        $deletePerfilStmt = $conn->prepare($deletePerfilQuery);
        $deletePerfilStmt->bindParam(PARAM_ID_USUARIO, $id_usuario_edit, PDO::PARAM_INT);
        $deletePerfilStmt->execute();

        // Insertar nuevos perfiles
        $insertPerfilQuery = "INSERT INTO usuario_perfil (id_usuario, id_perfil) VALUES (" . PARAM_ID_USUARIO . ", " . PARAM_ID_PERFIL . ")";
        $insertPerfilStmt = $conn->prepare($insertPerfilQuery);

        foreach ($perfiles as $id_perfil) {
            $insertPerfilStmt->bindParam(PARAM_ID_USUARIO, $id_usuario_edit, PDO::PARAM_INT);
            $insertPerfilStmt->bindParam(PARAM_ID_PERFIL, $id_perfil, PDO::PARAM_INT);
            $insertPerfilStmt->execute();
        }

        // Eliminar compañías antiguas
        $deleteCompaniaQuery = "DELETE FROM usuario_compania WHERE id_usuario = " . PARAM_ID_USUARIO . "";
        $deleteCompaniaStmt = $conn->prepare($deleteCompaniaQuery);
        $deleteCompaniaStmt->bindParam(PARAM_ID_USUARIO, $id_usuario_edit, PDO::PARAM_INT);
        $deleteCompaniaStmt->execute();

        // Insertar nuevas compañías
        $insertCompaniaQuery = "INSERT INTO usuario_compania (id_usuario, id_compania) VALUES (" . PARAM_ID_USUARIO . ", " . PARAM_ID_COMPANIA . ")";
        $insertCompaniaStmt = $conn->prepare($insertCompaniaQuery);

        foreach ($companias as $id_compania) {
            $insertCompaniaStmt->bindParam(PARAM_ID_USUARIO, $id_usuario_edit, PDO::PARAM_INT);
            $insertCompaniaStmt->bindParam(PARAM_ID_COMPANIA, $id_compania, PDO::PARAM_INT);
            $insertCompaniaStmt->execute();
        }

        // Obtener datos actualizados del usuario
        $queryPerfiles = "SELECT p.nombre FROM perfil p 
                         JOIN usuario_perfil up ON p.id_perfil = up.id_perfil 
                         WHERE up.id_usuario = " . PARAM_ID_USUARIO . "";
        $stmtPerfiles = $conn->prepare($queryPerfiles);
        $stmtPerfiles->bindParam(PARAM_ID_USUARIO, $id_usuario_edit, PDO::PARAM_INT);
        $stmtPerfiles->execute();
        $perfilesNombres = $stmtPerfiles->fetchAll(PDO::FETCH_COLUMN);

        $queryCompanias = "SELECT c.nombre FROM compania c 
                          JOIN usuario_compania uc ON c.id_compania = uc.id_compania 
                          WHERE uc.id_usuario = " . PARAM_ID_USUARIO . "";
        $stmtCompanias = $conn->prepare($queryCompanias);
        $stmtCompanias->bindParam(PARAM_ID_USUARIO, $id_usuario_edit, PDO::PARAM_INT);
        $stmtCompanias->execute();
        $companiasNombres = $stmtCompanias->fetchAll(PDO::FETCH_COLUMN);

        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Usuario actualizado exitosamente',
            'data' => [
                'id_usuario' => $id_usuario_edit,
                'nombre' => $nombre,
                'estado' => $estado,
                'perfiles' => implode(', ', $perfilesNombres),
                'companias' => implode(', ', $companiasNombres)
            ]
        ]);
        exit();

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => ERROR_DB_PREFIX . $e->getMessage()]);
        exit();
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => ERROR_SERVER_PREFIX . $e->getMessage()]);
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