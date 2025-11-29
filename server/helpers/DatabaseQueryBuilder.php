<?php
/**
 * Clase DatabaseQueryBuilder
 * Centraliza consultas comunes a la base de datos
 */

require_once __DIR__ . '/Constants.php';
require_once __DIR__ . '/ErrorHandler.php';
require_once __DIR__ . '/CustomExceptions.php';

class DatabaseQueryBuilder
{
    private $conn;

    /**
     * Constructor
     *
     * @param PDO $connection Conexión PDO
     */
    public function __construct($connection)
    {
        $this->conn = $connection;
    }

    /**
     * Obtiene el ID de grupo empresarial de un usuario
     *
     * @param int $userId ID del usuario
     * @return int ID del grupo empresarial
     * @throws QueryExecutionException
     */
    public function getUserGroupId($userId)
    {
        $query = "SELECT id_grupo_empresarial FROM usuario WHERE id_usuario = " . PARAM_ID_USUARIO;

        try {
            $stmt = $this->conn->prepare($query);
            if (!$stmt) {
                throw new QueryPrepareException(ERROR_DB_QUERY_PREPARE);
            }

            $stmt->bindParam(PARAM_ID_USUARIO, $userId, PDO::PARAM_INT);

            if (!$stmt->execute()) {
                throw new QueryExecutionException(ERROR_DB_QUERY_EXECUTE);
            }

            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return $result ? (int)$result['id_grupo_empresarial'] : null;

        } catch (PDOException $e) {
            throw new QueryExecutionException(ERROR_DB_QUERY_EXECUTE . ': ' . $e->getMessage());
        }
    }

    /**
     * Obtiene registros de una tabla con condiciones
     *
     * @param string $table Nombre de la tabla
     * @param string $selectClause Campos a seleccionar (ej: "id, nombre, estado")
     * @param string $whereClause Condición WHERE (sin la palabra WHERE)
     * @param array $params Parámetros para bindear
     * @param string $orderBy Orden (sin la palabra ORDER BY)
     * @param int $limit Límite de registros
     * @param int $offset Offset para paginación
     * @return array Array de registros
     * @throws QueryExecutionException
     */
    public function getRecords($table, $selectClause = '*', $whereClause = '', $params = [], $orderBy = '', $limit = 0, $offset = 0)
    {
        $query = "SELECT {$selectClause} FROM {$table}";

        if (!empty($whereClause)) {
            $query .= " WHERE {$whereClause}";
        }

        if (!empty($orderBy)) {
            $query .= " ORDER BY {$orderBy}";
        }

        if ($limit > 0) {
            $query .= " LIMIT {$limit}";
            if ($offset > 0) {
                $query .= " OFFSET {$offset}";
            }
        }

        try {
            $stmt = $this->conn->prepare($query);
            if (!$stmt) {
                throw new QueryPrepareException(ERROR_DB_QUERY_PREPARE);
            }

            if (!empty($params)) {
                foreach ($params as $key => $value) {
                    $stmt->bindValue($key, $value, is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR);
                }
            }

            if (!$stmt->execute()) {
                throw new QueryExecutionException(ERROR_DB_QUERY_EXECUTE);
            }

            return $stmt->fetchAll(PDO::FETCH_ASSOC);

        } catch (PDOException $e) {
            throw new QueryExecutionException(ERROR_DB_QUERY_EXECUTE . ': ' . $e->getMessage());
        }
    }

    /**
     * Obtiene un único registro
     *
     * @param string $table Nombre de la tabla
     * @param string $whereClause Condición WHERE
     * @param array $params Parámetros para bindear
     * @param string $selectClause Campos a seleccionar
     * @return array|null Registro encontrado o null
     * @throws QueryExecutionException
     */
    public function getRecord($table, $whereClause, $params = [], $selectClause = '*')
    {
        $query = "SELECT {$selectClause} FROM {$table} WHERE {$whereClause}";

        try {
            $stmt = $this->conn->prepare($query);
            if (!$stmt) {
                throw new QueryPrepareException(ERROR_DB_QUERY_PREPARE);
            }

            if (!empty($params)) {
                foreach ($params as $key => $value) {
                    $stmt->bindValue($key, $value, is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR);
                }
            }

            if (!$stmt->execute()) {
                throw new QueryExecutionException(ERROR_DB_QUERY_EXECUTE);
            }

            return $stmt->fetch(PDO::FETCH_ASSOC);

        } catch (PDOException $e) {
            throw new QueryExecutionException(ERROR_DB_QUERY_EXECUTE . ': ' . $e->getMessage());
        }
    }

    /**
     * Cuenta registros en una tabla
     *
     * @param string $table Nombre de la tabla
     * @param string $whereClause Condición WHERE (opcional)
     * @param array $params Parámetros para bindear
     * @return int Total de registros
     * @throws QueryExecutionException
     */
    public function countRecords($table, $whereClause = '', $params = [])
    {
        $query = "SELECT COUNT(*) as total FROM {$table}";

        if (!empty($whereClause)) {
            $query .= " WHERE {$whereClause}";
        }

        try {
            $stmt = $this->conn->prepare($query);
            if (!$stmt) {
                throw new QueryPrepareException(ERROR_DB_QUERY_PREPARE);
            }

            if (!empty($params)) {
                foreach ($params as $key => $value) {
                    $stmt->bindValue($key, $value, is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR);
                }
            }

            if (!$stmt->execute()) {
                throw new QueryExecutionException(ERROR_DB_QUERY_EXECUTE);
            }

            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            return (int)$result['total'];

        } catch (PDOException $e) {
            throw new QueryExecutionException(ERROR_DB_QUERY_EXECUTE . ': ' . $e->getMessage());
        }
    }

    /**
     * Inserta un registro
     *
     * @param string $table Nombre de la tabla
     * @param array $data Array asociativo con los datos
     * @return int ID del registro insertado
     * @throws InsertException
     */
    public function insertRecord($table, $data)
    {
        if (empty($data)) {
            throw new InsertException(ERROR_DB_INSERT . ': No hay datos para insertar');
        }

        $columns = array_keys($data);
        $placeholders = array_map(function ($col) {
            return ':' . $col;
        }, $columns);

        $query = "INSERT INTO {$table} (" . implode(',', $columns) . ") VALUES (" . implode(',', $placeholders) . ")";

        try {
            $stmt = $this->conn->prepare($query);
            if (!$stmt) {
                throw new QueryPrepareException(ERROR_DB_QUERY_PREPARE);
            }

            foreach ($data as $key => $value) {
                $stmt->bindValue(':' . $key, $value, is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR);
            }

            if (!$stmt->execute()) {
                throw new InsertException(ERROR_DB_INSERT);
            }

            return (int)$this->conn->lastInsertId();

        } catch (PDOException $e) {
            throw new InsertException(ERROR_DB_INSERT . ': ' . $e->getMessage());
        }
    }

    /**
     * Actualiza registros
     *
     * @param string $table Nombre de la tabla
     * @param array $data Array asociativo con los datos a actualizar
     * @param string $whereClause Condición WHERE
     * @param array $whereParams Parámetros para la condición WHERE
     * @return int Número de registros afectados
     * @throws UpdateException
     */
    public function updateRecord($table, $data, $whereClause, $whereParams = [])
    {
        if (empty($data)) {
            throw new UpdateException(ERROR_DB_UPDATE . ': No hay datos para actualizar');
        }

        $setClauses = [];
        foreach ($data as $key => $value) {
            $setClauses[] = $key . ' = :' . $key;
        }

        $query = "UPDATE {$table} SET " . implode(', ', $setClauses) . " WHERE {$whereClause}";

        try {
            $stmt = $this->conn->prepare($query);
            if (!$stmt) {
                throw new QueryPrepareException(ERROR_DB_QUERY_PREPARE);
            }

            foreach ($data as $key => $value) {
                $stmt->bindValue(':' . $key, $value, is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR);
            }

            if (!empty($whereParams)) {
                foreach ($whereParams as $key => $value) {
                    $stmt->bindValue($key, $value, is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR);
                }
            }

            if (!$stmt->execute()) {
                throw new UpdateException(ERROR_DB_UPDATE);
            }

            return $stmt->rowCount();

        } catch (PDOException $e) {
            throw new UpdateException(ERROR_DB_UPDATE . ': ' . $e->getMessage());
        }
    }

    /**
     * Elimina registros
     *
     * @param string $table Nombre de la tabla
     * @param string $whereClause Condición WHERE
     * @param array $whereParams Parámetros para la condición WHERE
     * @return int Número de registros eliminados
     * @throws DeleteException
     */
    public function deleteRecord($table, $whereClause, $whereParams = [])
    {
        if (empty($whereClause)) {
            throw new DeleteException(ERROR_DB_DELETE . ': Condición WHERE requerida');
        }

        $query = "DELETE FROM {$table} WHERE {$whereClause}";

        try {
            $stmt = $this->conn->prepare($query);
            if (!$stmt) {
                throw new QueryPrepareException(ERROR_DB_QUERY_PREPARE);
            }

            if (!empty($whereParams)) {
                foreach ($whereParams as $key => $value) {
                    $stmt->bindValue($key, $value, is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR);
                }
            }

            if (!$stmt->execute()) {
                throw new DeleteException(ERROR_DB_DELETE);
            }

            return $stmt->rowCount();

        } catch (PDOException $e) {
            throw new DeleteException(ERROR_DB_DELETE . ': ' . $e->getMessage());
        }
    }

    /**
     * Ejecuta una consulta personalizada
     *
     * @param string $query Consulta SQL
     * @param array $params Parámetros para bindear
     * @param bool $fetchAll Si debe traer todos los registros
     * @return array|int Resultado de la consulta
     * @throws QueryExecutionException
     */
    public function executeQuery($query, $params = [], $fetchAll = true)
    {
        try {
            $stmt = $this->conn->prepare($query);
            if (!$stmt) {
                throw new QueryPrepareException(ERROR_DB_QUERY_PREPARE);
            }

            if (!empty($params)) {
                foreach ($params as $key => $value) {
                    $stmt->bindValue($key, $value, is_int($value) ? PDO::PARAM_INT : PDO::PARAM_STR);
                }
            }

            if (!$stmt->execute()) {
                throw new QueryExecutionException(ERROR_DB_QUERY_EXECUTE);
            }

            if ($fetchAll) {
                return $stmt->fetchAll(PDO::FETCH_ASSOC);
            } else {
                return $stmt->fetch(PDO::FETCH_ASSOC);
            }

        } catch (PDOException $e) {
            throw new QueryExecutionException(ERROR_DB_QUERY_EXECUTE . ': ' . $e->getMessage());
        }
    }

    /**
     * Inicia una transacción
     */
    public function beginTransaction()
    {
        $this->conn->beginTransaction();
    }

    /**
     * Confirma una transacción
     */
    public function commit()
    {
        $this->conn->commit();
    }

    /**
     * Revierte una transacción
     */
    public function rollback()
    {
        $this->conn->rollback();
    }
}
