/// Modelo que representa un tipo de balanceado con su información
class TipoBalanceado {
  final int idTipoBalanceado;
  final String nombre;
  final String unidad;

  TipoBalanceado({
    required this.idTipoBalanceado,
    required this.nombre,
    required this.unidad,
  });

  factory TipoBalanceado.fromJson(Map<String, dynamic> json) {
    int idTipoBalanceado = 0;
    final idRaw = json['id_tipo_balanceado'];
    if (idRaw is int) {
      idTipoBalanceado = idRaw;
    } else if (idRaw is String) {
      idTipoBalanceado = int.tryParse(idRaw) ?? 0;
    }

    return TipoBalanceado(
      idTipoBalanceado: idTipoBalanceado,
      nombre: json['nombre'] ?? '',
      unidad: json['unidad'] ?? 'kg',
    );
  }
}

/// Modelo que representa un ciclo productivo
class CicloProductivo {
  final int idCiclo;
  final int idCompania;
  final String codigoPiscina;
  final DateTime fechaSiembra;
  final String estado;
  final double hectareas;
  final String tipoSiembra;
  final double densidad;
  final int cantidadSiembra;

  CicloProductivo({
    required this.idCiclo,
    required this.idCompania,
    required this.codigoPiscina,
    required this.fechaSiembra,
    required this.estado,
    required this.hectareas,
    required this.tipoSiembra,
    required this.densidad,
    required this.cantidadSiembra,
  });

  factory CicloProductivo.fromJson(Map<String, dynamic> json) {
    // Conversión segura de int
    int idCiclo = _toInt(json['id_ciclo']);
    int idCompania = _toInt(json['id_compania']);
    int cantidadSiembra = _toInt(json['cantidad_siembra']);
    double hectareas = _toDouble(json['hectareas']);
    double densidad = _toDouble(json['densidad']);

    return CicloProductivo(
      idCiclo: idCiclo,
      idCompania: idCompania,
      codigoPiscina: json['codigo_piscina'] ?? '',
      fechaSiembra: json['fecha_siembra'] != null
          ? DateTime.parse(json['fecha_siembra'].toString())
          : DateTime.now(),
      estado: json['estado'] ?? '',
      hectareas: hectareas,
      tipoSiembra: json['tipo_siembra'] ?? '',
      densidad: densidad,
      cantidadSiembra: cantidadSiembra,
    );
  }

  static int _toInt(dynamic value) {
    if (value is int) return value;
    if (value is String) return int.tryParse(value) ?? 0;
    if (value is double) return value.toInt();
    return 0;
  }

  static double _toDouble(dynamic value) {
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }
}

/// Modelo que representa un balanceado consumido en un muestreo
class BalanceadoConsumo {
  final int idTipoBalanceado;
  final double cantidad;

  BalanceadoConsumo({
    required this.idTipoBalanceado,
    required this.cantidad,
  });

  Map<String, dynamic> toJson() {
    return {
      'id_tipo_balanceado': idTipoBalanceado,
      'cantidad': cantidad,
    };
  }
}

/// Modelo que representa un muestreo (muestra) de camarón
class Muestra {
  final int? idMuestra; // Null cuando es nuevo registro
  final int idCiclo;
  final int diasCultivo;
  final double peso; // en gramos
  final double incrementoPeso; // en gramos
  final double biomasaLbs;
  final List<BalanceadoConsumo> balanceados;
  final double balanceadoAcumulado;
  final double conversionAlimenticia;
  final int poblacionActual;
  final double supervivencia; // en porcentaje
  final String observaciones;
  final DateTime fechaMuestra;
  final int idUsuario;
  final int idCompania;

  Muestra({
    this.idMuestra,
    required this.idCiclo,
    required this.diasCultivo,
    required this.peso,
    required this.incrementoPeso,
    required this.biomasaLbs,
    required this.balanceados,
    required this.balanceadoAcumulado,
    required this.conversionAlimenticia,
    required this.poblacionActual,
    required this.supervivencia,
    required this.observaciones,
    required this.fechaMuestra,
    required this.idUsuario,
    required this.idCompania,
  });

  /// Convierte el modelo a un mapa JSON para enviar al servidor
  Map<String, dynamic> toJson() {
    return {
      'id_ciclo': idCiclo,
      'dias_cultivo': diasCultivo,
      'peso': peso,
      'incremento_peso': incrementoPeso,
      'biomasa_lbs': biomasaLbs,
      'balanceados': balanceados.map((b) => b.toJson()).toList(),
      'balanceado_acumulado': balanceadoAcumulado,
      'conversion_alimenticia': conversionAlimenticia,
      'poblacion_actual': poblacionActual,
      'supervivencia': supervivencia,
      'observaciones': observaciones,
      'fecha_muestra': fechaMuestra.toIso8601String().split('T')[0],
      'id_usuario': idUsuario,
      'id_compania': idCompania,
    };
  }

  /// Convierte un JSON del servidor a modelo Muestra
  factory Muestra.fromJson(Map<String, dynamic> json) {
    return Muestra(
      idMuestra: json['id_muestra'],
      idCiclo: _toInt(json['id_ciclo']),
      diasCultivo: _toInt(json['dias_cultivo']),
      peso: _toDouble(json['peso']),
      incrementoPeso: _toDouble(json['incremento_peso']),
      biomasaLbs: _toDouble(json['biomasa_lbs']),
      balanceados: (json['balanceados'] as List?)
              ?.map((b) => BalanceadoConsumo(
                    idTipoBalanceado: _toInt(b['id_tipo_balanceado']),
                    cantidad: _toDouble(b['cantidad']),
                  ))
              .toList() ??
          [],
      balanceadoAcumulado: _toDouble(json['balanceado_acumulado']),
      conversionAlimenticia: _toDouble(json['conversion_alimenticia']),
      poblacionActual: _toInt(json['poblacion_actual']),
      supervivencia: _toDouble(json['supervivencia']),
      observaciones: json['observaciones'] ?? '',
      fechaMuestra: json['fecha_muestra'] != null
          ? DateTime.parse(json['fecha_muestra'])
          : DateTime.now(),
      idUsuario: _toInt(json['id_usuario']),
      idCompania: _toInt(json['id_compania']),
    );
  }

  /// Convierte cualquier tipo a int de forma segura
  static int _toInt(dynamic value) {
    if (value is int) return value;
    if (value is String) return int.tryParse(value) ?? 0;
    if (value is double) return value.toInt();
    return 0;
  }

  /// Convierte cualquier tipo a double de forma segura
  static double _toDouble(dynamic value) {
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }
}

/// Modelo que representa un perfil de usuario
class Perfil {
  final int idPerfil;
  final String nombre;

  Perfil({
    required this.idPerfil,
    required this.nombre,
  });

  factory Perfil.fromJson(Map<String, dynamic> json) {
    int idPerfil = 0;
    final idRaw = json['id_perfil'];
    if (idRaw is int) {
      idPerfil = idRaw;
    } else if (idRaw is String) {
      idPerfil = int.tryParse(idRaw) ?? 0;
    }

    return Perfil(
      idPerfil: idPerfil,
      nombre: json['nombre'] ?? '',
    );
  }
}

/// Modelo para almacenar información del usuario autenticado
class UsuarioAutenticado {
  final int idUsuario;
  final String nombre;
  final String usuario;
  final List<Perfil> perfiles;
  final int idCompania;
  final String nombreCompania;
  final String grupoEmpresarial;
  final List<dynamic> companias; // Lista de compañías disponibles
  final List<dynamic> menus;

  UsuarioAutenticado({
    required this.idUsuario,
    required this.nombre,
    required this.usuario,
    required this.perfiles,
    required this.idCompania,
    required this.nombreCompania,
    required this.grupoEmpresarial,
    required this.companias,
    required this.menus,
  });

  /// Obtiene el primer perfil del usuario
  String get perfilActivo => perfiles.isNotEmpty ? perfiles[0].nombre : '';

  /// Verifica si el usuario tiene un perfil específico
  bool tienePermiso(String nombrePerfil) {
    return perfiles.any((p) => p.nombre == nombrePerfil);
  }

  factory UsuarioAutenticado.fromJson(Map<String, dynamic> json) {
    // Procesar perfiles
    List<Perfil> perfiles = [];
    if (json['perfiles'] != null && json['perfiles'] is List) {
      perfiles = (json['perfiles'] as List)
          .map((p) => Perfil.fromJson(p as Map<String, dynamic>))
          .toList();
    }

    // Procesar menús
    List<dynamic> menus = [];
    if (json['menus'] != null && json['menus'] is List) {
      menus = json['menus'] as List;
    }

    // Conversión segura de id_usuario a int
    int idUsuario = 0;
    final idUsuarioRaw = json['id_usuario'];
    if (idUsuarioRaw is int) {
      idUsuario = idUsuarioRaw;
    } else if (idUsuarioRaw is String) {
      idUsuario = int.tryParse(idUsuarioRaw) ?? 0;
    }

    // Conversión segura de id_compania a int
    int idCompania = 0;
    final idCompaniaRaw = json['id_compania'];
    if (idCompaniaRaw is int) {
      idCompania = idCompaniaRaw;
    } else if (idCompaniaRaw is String) {
      idCompania = int.tryParse(idCompaniaRaw) ?? 0;
    }

    return UsuarioAutenticado(
      idUsuario: idUsuario,
      nombre: json['nombre'] ?? '',
      usuario: json['usuario'] ?? '',
      perfiles: perfiles,
      idCompania: idCompania,
      nombreCompania: json['compania'] ?? json['nombre_compania'] ?? '',
      grupoEmpresarial: json['grupo_empresarial'] ?? '',
      companias: json['companias'] ?? [],
      menus: menus,
    );
  }
}
