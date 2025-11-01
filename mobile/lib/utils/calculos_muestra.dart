/// Clase que contiene todas las funciones de cálculo para muestras de camarón
/// Sigue la misma lógica que en MuestraForm.js
class CalculosMuestra {
  /// Calcula los días de cultivo entre dos fechas
  static int calcularDiasCultivo(DateTime fechaSiembra, DateTime fechaMuestra) {
    if (fechaMuestra.isBefore(fechaSiembra)) return 0;
    return fechaMuestra.difference(fechaSiembra).inDays;
  }

  /// Calcula el incremento de peso (peso actual - peso anterior)
  /// Si no hay peso anterior (primer muestra), retorna el peso actual
  static double? calcularIncrementoPeso(
    double pesoActual,
    double? pesoAnterior,
  ) {
    if (pesoActual <= 0) return null;

    // Si no hay peso anterior, el incremento es el peso actual
    if (pesoAnterior == null || pesoAnterior <= 0) {
      return pesoActual;
    }

    return pesoActual - pesoAnterior;
  }

  /// Calcula el balanceado acumulado (anterior + consumo actual)
  static double calcularBalanceadoAcumulado(
    Map<int, double> balanceadosActuales,
    double balanceadoAnterior,
  ) {
    // Sumar todos los valores de balanceado ingresados
    double sumaActual = 0;
    balanceadosActuales.forEach((_, cantidad) {
      if (cantidad > 0) {
        sumaActual += cantidad;
      }
    });

    return balanceadoAnterior + sumaActual;
  }

  /// Calcula la población actual basada en supervivencia
  static int? calcularPoblacionActual(
    double supervivencia,
    int cantidadSiembra,
  ) {
    if (supervivencia < 0 || supervivencia > 100 || cantidadSiembra <= 0) {
      return null;
    }

    // Convertir supervivencia de porcentaje a decimal
    double supervivenciaDecimal = supervivencia / 100;
    return (cantidadSiembra * supervivenciaDecimal).round();
  }

  /// Calcula la biomasa en libras
  /// Fórmula: (peso en gramos / 454) * población actual
  static double? calcularBiomasa(double pesoGramos, int poblacionActual) {
    if (pesoGramos <= 0 || poblacionActual <= 0) return null;

    // Convertir peso de gramos a libras (1 libra = 454 gramos)
    double pesoLibras = pesoGramos / 454;
    return pesoLibras * poblacionActual;
  }

  /// Calcula la conversión alimenticia
  /// Fórmula: balanceado acumulado / biomasa en libras
  static double? calcularConversionAlimenticia(
    double balanceadoAcumulado,
    double biomasaLbs,
  ) {
    if (balanceadoAcumulado <= 0 || biomasaLbs <= 0) return null;

    return balanceadoAcumulado / biomasaLbs;
  }

  /// Valida si todos los campos requeridos tienen valores válidos
  static Map<String, String> validarFormulario({
    required int idCiclo,
    required double peso,
    required double supervivencia,
    required Map<int, double> balanceados,
  }) {
    Map<String, String> errores = {};

    if (idCiclo <= 0) {
      errores['ciclo'] = 'Selecciona un ciclo productivo';
    }

    if (peso <= 0) {
      errores['peso'] = 'Ingresa un peso válido (mayor a 0)';
    }

    if (supervivencia < 0 || supervivencia > 100) {
      errores['supervivencia'] = 'La supervivencia debe estar entre 0 y 100%';
    }

    bool tieneBalanceado = balanceados.values.any((cantidad) => cantidad > 0);
    if (!tieneBalanceado) {
      errores['balanceado'] = 'Ingresa al menos un tipo de balanceado';
    }

    return errores;
  }

  /// Redondea un número a cierta cantidad de decimales
  static double redondear(double valor, int decimales) {
    int multiplicador = 10 ^ decimales;
    return (valor * multiplicador).round() / multiplicador;
  }

  /// Formatea una fecha en formato YYYY-MM-DD
  static String formatearFecha(DateTime fecha) {
    return fecha.toIso8601String().split('T')[0];
  }

  /// Formatea una fecha para mostrar al usuario en formato localizado
  static String formatearFechaDisplay(DateTime fecha) {
    final meses = [
      'enero',
      'febrero',
      'marzo',
      'abril',
      'mayo',
      'junio',
      'julio',
      'agosto',
      'septiembre',
      'octubre',
      'noviembre',
      'diciembre'
    ];
    return '${fecha.day} de ${meses[fecha.month - 1]} de ${fecha.year}';
  }
}
