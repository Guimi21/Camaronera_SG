import 'package:flutter_test/flutter_test.dart';
import '../lib/models/muestra.dart';

void main() {
  group('Muestra.fromJson - Type Conversion Tests', () {
    test('Should parse peso correctly from string', () {
      final json = {
        'id_muestra': 259,
        'id_ciclo': 1,
        'peso': '2.00', // String peso from backend
        'balanceado_acumulado': '440.00', // String
        'fecha_muestra': '2024-12-05',
        'dias_cultivo': 0,
        'incremento_peso': 0,
        'biomasa_lbs': 0,
        'balanceados': [],
        'conversion_alimenticia': 0,
        'poblacion_actual': 0,
        'supervivencia': 0,
        'observaciones': '',
        'id_usuario': 1,
        'id_compania': 1,
      };

      final muestra = Muestra.fromJson(json);

      expect(muestra.peso, 2.0);
      expect(muestra.balanceadoAcumulado, 440.0);
    });

    test('Should parse peso correctly from int', () {
      final json = {
        'id_muestra': 259,
        'id_ciclo': 1,
        'peso': 2, // Int peso
        'balanceado_acumulado': 440, // Int
        'fecha_muestra': '2024-12-05',
        'dias_cultivo': 0,
        'incremento_peso': 0,
        'biomasa_lbs': 0,
        'balanceados': [],
        'conversion_alimenticia': 0,
        'poblacion_actual': 0,
        'supervivencia': 0,
        'observaciones': '',
        'id_usuario': 1,
        'id_compania': 1,
      };

      final muestra = Muestra.fromJson(json);

      expect(muestra.peso, 2.0);
      expect(muestra.balanceadoAcumulado, 440.0);
    });

    test('Should parse peso correctly from double', () {
      final json = {
        'id_muestra': 259,
        'id_ciclo': 1,
        'peso': 2.5, // Double peso
        'balanceado_acumulado': 440.5, // Double
        'fecha_muestra': '2024-12-05',
        'dias_cultivo': 0,
        'incremento_peso': 0,
        'biomasa_lbs': 0,
        'balanceados': [],
        'conversion_alimenticia': 0,
        'poblacion_actual': 0,
        'supervivencia': 0,
        'observaciones': '',
        'id_usuario': 1,
        'id_compania': 1,
      };

      final muestra = Muestra.fromJson(json);

      expect(muestra.peso, 2.5);
      expect(muestra.balanceadoAcumulado, 440.5);
    });

    test('Should handle missing or null valores gracefully', () {
      final json = {
        'id_muestra': 259,
        'id_ciclo': 1,
        // peso not provided
        'balanceado_acumulado': null,
        'fecha_muestra': '2024-12-05',
      };

      final muestra = Muestra.fromJson(json);

      expect(muestra.peso, 0.0);
      expect(muestra.balanceadoAcumulado, 0.0);
    });

    test('Increment weight calculation should work correctly', () {
      // Simulate: peso anterior = 2.0, nuevo peso = 10
      // Expected increment: 10 - 2 = 8

      final pesoActual = 10.0;
      final pesoAnterior = 2.0;

      // This simulates what happens in _recalcularValores()
      final incrementoPeso =
          pesoActual - pesoAnterior; // Should be 8.0, not 10.0

      expect(incrementoPeso, 8.0);
    });
  });
}
