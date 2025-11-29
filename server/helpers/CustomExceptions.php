<?php

/**
 * Excepción personalizada para errores de preparación de consultas
 */
class QueryPrepareException extends Exception
{
    public function __construct($message = "Error al preparar la consulta", $code = 0, Exception $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }
}

/**
 * Excepción personalizada para errores de ejecución de consultas
 */
class QueryExecutionException extends Exception
{
    public function __construct($message = "Error al ejecutar la consulta", $code = 0, Exception $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }
}

/**
 * Excepción personalizada para errores de inserción de datos
 */
class InsertException extends Exception
{
    public function __construct($message = "Error al insertar datos", $code = 0, Exception $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }
}

/**
 * Excepción personalizada para errores de actualización de datos
 */
class UpdateException extends Exception
{
    public function __construct($message = "Error al actualizar datos", $code = 0, Exception $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }
}

/**
 * Excepción personalizada para errores de eliminación de datos
 */
class DeleteException extends Exception
{
    public function __construct($message = "Error al eliminar datos", $code = 0, Exception $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }
}

/**
 * Excepción personalizada para errores de validación
 */
class ValidationException extends Exception
{
    public function __construct($message = "Error de validación", $code = 0, Exception $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }
}

/**
 * Excepción personalizada para errores de base de datos relacionados con ciclos
 */
class CycleException extends Exception
{
    public function __construct($message = "Error relacionado con ciclos", $code = 0, Exception $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }
}
