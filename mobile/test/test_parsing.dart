/// Test de parseo de respuesta del backend
/// 
/// Esto es una prueba para verificar que los modelos pueden parsear
/// correctamente la respuesta del backend sin errores de tipo

void main() {
  // Simular la respuesta del backend
  Map<String, dynamic> respuestaBackend = {
    "id_usuario": 3,  // Puede ser int o string
    "nombre": "Jefferson Toledo",
    "usuario": "admin01",
    "perfiles": [
      {
        "id_perfil": 3,
        "nombre": "Administrador"
      }
    ],
    "grupo_empresarial": "TAXTRUSA",
    "companias": [
      {
        "id_compania": 2,
        "nombre": "Compañía B"
      },
      {
        "id_compania": 1,
        "nombre": "SPARTAN"
      }
    ],
    "compania": "Compañía B",
    "id_compania": 2,
    "menus": [
      {
        "id_menu": 7,
        "nombre": "Balanceados",
        "ruta": "/dashboard/monitoreo-balanceados",
        "icono": "FaLeaf",
        "estado": "A",
        "modulo": "Balanceados"
      }
    ]
  };

  // Aquí iría el código de prueba real
  // Para ahora, esto es solo documentación del formato esperado
  print('Formato de respuesta esperado del backend:');
  print(respuestaBackend.toString());
}
