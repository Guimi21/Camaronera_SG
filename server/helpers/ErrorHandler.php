<?php
/**
 * Clase ErrorHandler
 * Centraliza el manejo de errores y excepciones
 */

require_once __DIR__ . '/Constants.php';

class ErrorHandler
{
    /**
     * Maneja errores de validación
     * 
     * @param string $message Mensaje de error
     * @param int $httpCode Código HTTP
     */
    public static function handleValidationError($message, $httpCode = HTTP_BAD_REQUEST)
    {
        self::sendErrorResponse($message, $httpCode);
    }

    /**
     * Maneja errores de base de datos
     * 
     * @param Exception $e Excepción lanzada
     * @param int $httpCode Código HTTP
     * @param bool $debug Si debe mostrar detalles en desarrollo
     */
    public static function handleDatabaseError($e, $httpCode = HTTP_INTERNAL_SERVER_ERROR, $debug = false)
    {
        $message = ERROR_DB_CONNECTION;

        // En desarrollo, mostrar más detalles
        if ($debug && defined('DEBUG_MODE') && DEBUG_MODE) {
            $message = ERROR_DB_PREFIX . $e->getMessage();
        }

        self::sendErrorResponse($message, $httpCode);
    }

    /**
     * Maneja errores del servidor
     * 
     * @param Exception $e Excepción lanzada
     * @param int $httpCode Código HTTP
     * @param bool $debug Si debe mostrar detalles en desarrollo
     */
    public static function handleServerError($e, $httpCode = HTTP_INTERNAL_SERVER_ERROR, $debug = false)
    {
        $message = ERROR_SERVER_INTERNAL;

        // En desarrollo, mostrar más detalles
        if ($debug && defined('DEBUG_MODE') && DEBUG_MODE) {
            $message = ERROR_SERVER_PREFIX . $e->getMessage();
        }

        self::sendErrorResponse($message, $httpCode);
    }

    /**
     * Maneja excepciones personalizadas
     * 
     * @param Exception $exception Excepción capturada
     * @param int $defaultHttpCode Código HTTP por defecto
     * @param bool $debug Si debe mostrar detalles en desarrollo
     */
    public static function handleException($exception, $defaultHttpCode = HTTP_INTERNAL_SERVER_ERROR, $debug = false)
    {
        $message = ERROR_SERVER_INTERNAL;
        $httpCode = $defaultHttpCode;

        // Mapear tipos de excepciones conocidas
        if (class_exists('QueryPrepareException') && $exception instanceof QueryPrepareException) {
            $message = ERROR_DB_QUERY_PREPARE;
        } elseif (class_exists('QueryExecutionException') && $exception instanceof QueryExecutionException) {
            $message = ERROR_DB_QUERY_EXECUTE;
        } elseif (class_exists('InsertException') && $exception instanceof InsertException) {
            $message = ERROR_DB_INSERT;
        } elseif (class_exists('UpdateException') && $exception instanceof UpdateException) {
            $message = ERROR_DB_UPDATE;
        } elseif (class_exists('DeleteException') && $exception instanceof DeleteException) {
            $message = ERROR_DB_DELETE;
        }

        // En desarrollo, mostrar más detalles
        if ($debug && defined('DEBUG_MODE') && DEBUG_MODE) {
            $message = $exception->getMessage();
        }

        self::sendErrorResponse($message, $httpCode);
    }

    /**
     * Envía una respuesta de error JSON
     * 
     * @param string $message Mensaje de error
     * @param int $httpCode Código HTTP
     */
    public static function sendErrorResponse($message, $httpCode = HTTP_INTERNAL_SERVER_ERROR)
    {
        http_response_code($httpCode);
        header('Content-Type: application/json; charset=utf-8');

        echo json_encode([
            RESPONSE_SUCCESS => false,
            RESPONSE_MESSAGE => $message
        ]);
    }

    /**
     * Envía una respuesta de éxito JSON
     * 
     * @param mixed $data Datos a enviar
     * @param string $message Mensaje de éxito
     * @param int $httpCode Código HTTP
     */
    public static function sendSuccessResponse($data = null, $message = SUCCESS_DATA_RETRIEVED, $httpCode = HTTP_OK)
    {
        http_response_code($httpCode);
        header('Content-Type: application/json; charset=utf-8');

        $response = [
            RESPONSE_SUCCESS => true,
            RESPONSE_MESSAGE => $message
        ];

        if ($data !== null) {
            $response[RESPONSE_DATA] = $data;
        }

        echo json_encode($response);
    }

    /**
     * Envía una respuesta de éxito JSON con datos y total
     * 
     * @param mixed $data Datos a enviar
     * @param int $total Total de registros
     * @param string $message Mensaje de éxito
     * @param int $httpCode Código HTTP
     */
    public static function sendSuccessResponseWithTotal($data, $total, $message = SUCCESS_DATA_RETRIEVED, $httpCode = HTTP_OK)
    {
        http_response_code($httpCode);
        header('Content-Type: application/json; charset=utf-8');

        echo json_encode([
            RESPONSE_SUCCESS => true,
            RESPONSE_MESSAGE => $message,
            RESPONSE_DATA => $data,
            RESPONSE_TOTAL => $total
        ]);
    }

    /**
     * Envía una respuesta de creación exitosa
     * 
     * @param mixed $data Datos creados
     * @param string $message Mensaje de éxito
     */
    public static function sendCreatedResponse($data = null, $message = SUCCESS_RECORD_CREATED)
    {
        self::sendSuccessResponse($data, $message, HTTP_CREATED);
    }

    /**
     * Envía una respuesta de actualización exitosa
     * 
     * @param mixed $data Datos actualizados
     * @param string $message Mensaje de éxito
     */
    public static function sendUpdatedResponse($data = null, $message = SUCCESS_RECORD_UPDATED)
    {
        self::sendSuccessResponse($data, $message, HTTP_OK);
    }

    /**
     * Envía una respuesta de eliminación exitosa
     * 
     * @param mixed $data Datos
     * @param string $message Mensaje de éxito
     */
    public static function sendDeletedResponse($data = null, $message = SUCCESS_RECORD_DELETED)
    {
        self::sendSuccessResponse($data, $message, HTTP_OK);
    }

    /**
     * Registra un error en un archivo de log
     * 
     * @param string $message Mensaje a registrar
     * @param string $level Nivel (ERROR, WARNING, INFO)
     */
    public static function logError($message, $level = 'ERROR')
    {
        if (!is_dir(DIR_LOGS)) {
            mkdir(DIR_LOGS, 0755, true);
        }

        $logFile = DIR_LOGS . '/error.log';
        $timestamp = date('Y-m-d H:i:s');
        $logMessage = "[{$timestamp}] [{$level}] {$message}" . PHP_EOL;

        file_put_contents($logFile, $logMessage, FILE_APPEND);
    }
}