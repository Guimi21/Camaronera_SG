import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/muestra.dart';

class ApiService {
  static const String baseUrl = 'http://10.0.2.2:5000';

  /// Realiza el login del usuario y retorna los datos del usuario autenticado
  static Future<Map<String, dynamic>> login(
    String username,
    String password,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login.php'),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: jsonEncode({
          'username': username,
          'password': password,
        }),
      ).timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          throw Exception('Tiempo de conexión agotado');
        },
      );

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        return {
          'success': true,
          'data': jsonResponse,
        };
      } else if (response.statusCode == 401) {
        final jsonResponse = jsonDecode(response.body);
        return {
          'success': false,
          'error': jsonResponse['error'] ?? 'Credenciales incorrectas',
        };
      } else if (response.statusCode == 400) {
        final jsonResponse = jsonDecode(response.body);
        return {
          'success': false,
          'error': jsonResponse['error'] ?? 'Datos inválidos',
        };
      } else {
        return {
          'success': false,
          'error': 'Error del servidor: ${response.statusCode}',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Error de conexión: ${e.toString()}',
      };
    }
  }

  /// Obtiene los ciclos productivos disponibles para una compañía
  static Future<Map<String, dynamic>> obtenerCiclosProductivos(
    int idCompania,
  ) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/module/ciclosproductivos.php?id_compania=$idCompania'),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ).timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          throw Exception('Tiempo de conexión agotado');
        },
      );

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        if (jsonResponse['success'] == true) {
          // Filtrar solo los ciclos que estén EN_CURSO
          List<dynamic> ciclos = jsonResponse['data'] ?? [];
          List<CicloProductivo> ciclosEnCurso = ciclos
              .where((ciclo) => ciclo['estado'] == 'EN_CURSO')
              .map((ciclo) => CicloProductivo.fromJson(ciclo))
              .toList();
          return {
            'success': true,
            'data': ciclosEnCurso,
          };
        } else {
          return {
            'success': false,
            'error': jsonResponse['message'] ?? 'Error al obtener ciclos',
          };
        }
      } else {
        return {
          'success': false,
          'error': 'Error del servidor: ${response.statusCode}',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Error de conexión: ${e.toString()}',
      };
    }
  }

  /// Obtiene los tipos de balanceado disponibles para una compañía
  static Future<Map<String, dynamic>> obtenerTiposBalanceado(
    int idCompania,
  ) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/module/tipos_balanceado.php?id_compania=$idCompania'),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ).timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          throw Exception('Tiempo de conexión agotado');
        },
      );

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        if (jsonResponse['success'] == true) {
          List<dynamic> tipos = jsonResponse['data'] ?? [];
          List<TipoBalanceado> tiposBalanceado = tipos
              .map((tipo) => TipoBalanceado.fromJson(tipo))
              .toList();
          return {
            'success': true,
            'data': tiposBalanceado,
          };
        } else {
          return {
            'success': false,
            'error': jsonResponse['message'] ?? 'Error al obtener tipos de balanceado',
          };
        }
      } else {
        return {
          'success': false,
          'error': 'Error del servidor: ${response.statusCode}',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Error de conexión: ${e.toString()}',
      };
    }
  }

  /// Obtiene el último muestreo de un ciclo productivo
  static Future<Map<String, dynamic>> obtenerUltimoMuestreo(
    int idCiclo,
  ) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/module/muestras.php?id_ciclo=$idCiclo&ultimo=true'),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ).timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          throw Exception('Tiempo de conexión agotado');
        },
      );

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        if (jsonResponse['success'] == true &&
            jsonResponse['data'] != null &&
            (jsonResponse['data'] as List).isNotEmpty) {
          return {
            'success': true,
            'data': Muestra.fromJson(jsonResponse['data'][0]),
          };
        } else {
          // No hay muestras anteriores para este ciclo
          return {
            'success': true,
            'data': null,
          };
        }
      } else {
        return {
          'success': false,
          'error': 'Error del servidor: ${response.statusCode}',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Error de conexión: ${e.toString()}',
      };
    }
  }

  /// Crea un nuevo muestreo en la base de datos
  static Future<Map<String, dynamic>> crearMuestreo(Muestra muestra) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/module/muestras.php'),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: jsonEncode(muestra.toJson()),
      ).timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          throw Exception('Tiempo de conexión agotado');
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final jsonResponse = jsonDecode(response.body);
        if (jsonResponse['success'] == true) {
          return {
            'success': true,
            'data': jsonResponse['data'],
            'message': jsonResponse['message'],
          };
        } else {
          return {
            'success': false,
            'error': jsonResponse['message'] ?? 'Error al crear muestreo',
          };
        }
      } else if (response.statusCode == 400) {
        final jsonResponse = jsonDecode(response.body);
        return {
          'success': false,
          'error': jsonResponse['message'] ?? 'Datos inválidos',
        };
      } else {
        return {
          'success': false,
          'error': 'Error del servidor: ${response.statusCode}',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Error de conexión: ${e.toString()}',
      };
    }
  }

  /// Obtiene las compañías disponibles para un usuario
  static Future<Map<String, dynamic>> obtenerCompanias(int idUsuario) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/module/companias.php?id_usuario=$idUsuario'),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ).timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          throw Exception('Tiempo de conexión agotado');
        },
      );

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        if (jsonResponse['success'] == true) {
          return {
            'success': true,
            'data': jsonResponse['data'] ?? [],
          };
        } else {
          return {
            'success': false,
            'error': jsonResponse['message'] ?? 'Error al obtener compañías',
          };
        }
      } else {
        return {
          'success': false,
          'error': 'Error del servidor: ${response.statusCode}',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': 'Error de conexión: ${e.toString()}',
      };
    }
  }
}
