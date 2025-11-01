import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  static const String baseUrl = 'http://10.0.2.2:5000';

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
}
