<?php
/**
 * Clase RequestValidator
 * Centraliza la validación de solicitudes HTTP
 */

require_once __DIR__ . '/Constants.php';
require_once __DIR__ . '/ErrorHandler.php';

class RequestValidator
{
    /**
     * Valida que la conexión a la base de datos esté establecida
     * 
     * @param mixed $conn Conexión PDO
     * @throws Exception Si la conexión no existe
     */
    public static function validateDbConnection($conn)
    {
        if (!isset($conn) || $conn === null) {
            ErrorHandler::handleDatabaseError(
                new Exception(ERROR_DB_CONNECTION),
                HTTP_INTERNAL_SERVER_ERROR
            );
            exit();
        }
    }

    /**
     * Valida que un parámetro requerido esté presente y no esté vacío
     * 
     * @param string $param Nombre del parámetro
     * @param string $source Fuente (GET, POST, etc.) - por defecto GET
     * @param bool $exitOnError Si debe terminar la ejecución en error
     * @return mixed|null Valor del parámetro o null
     */
    public static function validateRequiredParam($param, $source = 'GET', $exitOnError = true)
    {
        $source = strtoupper($source);
        $sourceData = null;

        switch ($source) {
            case 'GET':
                $sourceData = $_GET;
                break;
            case 'POST':
                $sourceData = $_POST;
                break;
            case 'REQUEST':
                $sourceData = $_REQUEST;
                break;
            default:
                $sourceData = $_GET;
        }

        if (!isset($sourceData[$param]) || empty($sourceData[$param])) {
            $errorMsg = $param . ERROR_VALIDATION_REQUIRED_FIELD;
            if ($exitOnError) {
                ErrorHandler::handleValidationError($errorMsg, HTTP_BAD_REQUEST);
                exit();
            }
            return null;
        }

        return $sourceData[$param];
    }

    /**
     * Valida múltiples parámetros requeridos
     * 
     * @param array $params Array de nombres de parámetros a validar
     * @param string $source Fuente (GET, POST, etc.)
     * @param bool $exitOnError Si debe terminar la ejecución en error
     * @return array Array con los parámetros validados
     */
    public static function validateRequiredParams($params, $source = 'GET', $exitOnError = true)
    {
        $validated = [];
        
        foreach ($params as $param) {
            $value = self::validateRequiredParam($param, $source, $exitOnError);
            if ($value === null && $exitOnError) {
                return [];
            }
            $validated[$param] = $value;
        }
        
        return $validated;
    }

    /**
     * Valida que un parámetro sea un número entero válido
     * 
     * @param string $param Nombre del parámetro
     * @param string $source Fuente (GET, POST, etc.)
     * @param bool $exitOnError Si debe terminar la ejecución en error
     * @return int|null Parámetro como entero o null
     */
    public static function validateIntegerParam($param, $source = 'GET', $exitOnError = true)
    {
        $value = self::validateRequiredParam($param, $source, false);
        
        if ($value === null) {
            if ($exitOnError) {
                ErrorHandler::handleValidationError($param . ERROR_VALIDATION_REQUIRED_FIELD, HTTP_BAD_REQUEST);
                exit();
            }
            return null;
        }

        if (!is_numeric($value) || (int)$value != $value) {
            $errorMsg = $param . ERROR_VALIDATION_INVALID_INTEGER;
            if ($exitOnError) {
                ErrorHandler::handleValidationError($errorMsg, HTTP_BAD_REQUEST);
                exit();
            }
            return null;
        }

        return (int)$value;
    }

    /**
     * Valida y decodifica JSON del cuerpo de la solicitud
     * 
     * @param bool $exitOnError Si debe terminar la ejecución en error
     * @return array|null Array decodificado o null
     */
    public static function validateJsonInput($exitOnError = true)
    {
        $input = file_get_contents(INPUT_STREAM);
        
        if (empty($input)) {
            if ($exitOnError) {
                ErrorHandler::handleValidationError(ERROR_VALIDATION_INVALID_JSON, HTTP_BAD_REQUEST);
                exit();
            }
            return null;
        }

        $decoded = json_decode($input, true);

        if ($decoded === null) {
            if ($exitOnError) {
                ErrorHandler::handleValidationError(ERROR_VALIDATION_INVALID_JSON, HTTP_BAD_REQUEST);
                exit();
            }
            return null;
        }

        return $decoded;
    }

    /**
     * Valida que un parámetro JSON sea un campo requerido
     * 
     * @param array $data Array de datos JSON
     * @param string $field Nombre del campo
     * @param bool $exitOnError Si debe terminar la ejecución en error
     * @return mixed|null Valor del campo o null
     */
    public static function validateJsonField($data, $field, $exitOnError = true)
    {
        if (!isset($data[$field]) || empty($data[$field])) {
            $errorMsg = $field . ERROR_VALIDATION_REQUIRED_FIELD;
            if ($exitOnError) {
                ErrorHandler::handleValidationError($errorMsg, HTTP_BAD_REQUEST);
                exit();
            }
            return null;
        }

        return $data[$field];
    }

    /**
     * Valida múltiples campos JSON requeridos
     * 
     * @param array $data Array de datos JSON
     * @param array $fields Array de nombres de campos a validar
     * @param bool $exitOnError Si debe terminar la ejecución en error
     * @return array Array con los campos validados
     */
    public static function validateJsonFields($data, $fields, $exitOnError = true)
    {
        $validated = [];
        
        foreach ($fields as $field) {
            $value = self::validateJsonField($data, $field, $exitOnError);
            if ($value === null && $exitOnError) {
                return [];
            }
            $validated[$field] = $value;
        }
        
        return $validated;
    }

    /**
     * Valida el método HTTP de la solicitud
     * 
     * @param string|array $allowedMethods Métodos permitidos
     * @param bool $exitOnError Si debe terminar la ejecución en error
     * @return bool True si el método es válido
     */
    public static function validateHttpMethod($allowedMethods, $exitOnError = true)
    {
        if (!is_array($allowedMethods)) {
            $allowedMethods = [$allowedMethods];
        }

        $method = strtoupper($_SERVER['REQUEST_METHOD']);
        
        if (!in_array($method, $allowedMethods)) {
            if ($exitOnError) {
                ErrorHandler::sendErrorResponse(
                    'Método no permitido',
                    HTTP_METHOD_NOT_ALLOWED
                );
                exit();
            }
            return false;
        }

        return true;
    }

    /**
     * Maneja solicitudes OPTIONS (preflight)
     * 
     * @return void
     */
    public static function handleOptions()
    {
        if ($_SERVER['REQUEST_METHOD'] === METHOD_OPTIONS) {
            http_response_code(HTTP_OK);
            exit(0);
        }
    }

    /**
     * Valida que un archivo haya sido enviado correctamente
     * 
     * @param string $fileKey Clave del archivo en $_FILES
     * @param array $allowedTypes Tipos MIME permitidos (opcional)
     * @param bool $exitOnError Si debe terminar la ejecución en error
     * @return array|null Array del archivo o null
     */
    public static function validateFileUpload($fileKey, $allowedTypes = [], $exitOnError = true)
    {
        if (!isset($_FILES[$fileKey]) || $_FILES[$fileKey]['error'] !== UPLOAD_ERR_OK) {
            if ($exitOnError) {
                ErrorHandler::handleValidationError(ERROR_FILE_NOT_RECEIVED, HTTP_BAD_REQUEST);
                exit();
            }
            return null;
        }

        $file = $_FILES[$fileKey];

        if (!empty($allowedTypes) && !in_array($file['type'], $allowedTypes)) {
            if ($exitOnError) {
                ErrorHandler::handleValidationError(ERROR_FILE_INVALID_TYPE, HTTP_BAD_REQUEST);
                exit();
            }
            return null;
        }

        if ($file['size'] > MAX_UPLOAD_SIZE) {
            if ($exitOnError) {
                ErrorHandler::handleValidationError('Archivo demasiado grande', HTTP_BAD_REQUEST);
                exit();
            }
            return null;
        }

        return $file;
    }

    /**
     * Obtiene un parámetro con valor por defecto si no existe
     * 
     * @param string $param Nombre del parámetro
     * @param mixed $default Valor por defecto
     * @param string $source Fuente (GET, POST, etc.)
     * @return mixed Valor del parámetro o valor por defecto
     */
    public static function getParamWithDefault($param, $default = null, $source = 'GET')
    {
        $source = strtoupper($source);
        $sourceData = null;

        switch ($source) {
            case 'GET':
                $sourceData = $_GET;
                break;
            case 'POST':
                $sourceData = $_POST;
                break;
            default:
                $sourceData = $_GET;
        }

        return isset($sourceData[$param]) && !empty($sourceData[$param]) ? $sourceData[$param] : $default;
    }

    /**
     * Alias intuitivo para validateIntegerParam
     * Obtiene y valida un parámetro como número entero requerido
     * 
     * @param string $param Nombre del parámetro
     * @param string $source Fuente (GET, POST, etc.)
     * @param bool $exitOnError Si debe terminar la ejecución en error
     * @return int|null Parámetro como entero o null
     */
    public static function getRequiredParamInt($param, $source = 'GET', $exitOnError = true)
    {
        return self::validateIntegerParam($param, $source, $exitOnError);
    }
}