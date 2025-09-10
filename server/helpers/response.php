<?php
// helpers/response.php
function sendResponse($data, $status = 200) {
    // Establecer el código de estado HTTP
    http_response_code($status);

    // Establecer la cabecera de la respuesta como JSON
    header("Content-Type: application/json");

    // Verificar si el $data es un arreglo o un objeto válido
    if (is_array($data) || is_object($data)) {
        // Enviar los datos como JSON
        echo json_encode($data);
    } else {
        // Si $data no es un objeto o arreglo, generar un mensaje de error
        echo json_encode(["error" => "La respuesta no es un JSON válido"]);
    }
}

?>

