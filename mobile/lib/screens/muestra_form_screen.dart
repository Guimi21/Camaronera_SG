import 'package:flutter/material.dart';
import '../models/muestra.dart';
import '../services/api_service.dart';
import '../utils/calculos_muestra.dart';
import '../main.dart';

class MuestraFormScreen extends StatefulWidget {
  final UsuarioAutenticado usuario;

  const MuestraFormScreen({
    super.key,
    required this.usuario,
  });

  @override
  State<MuestraFormScreen> createState() => _MuestraFormScreenState();
}

class _MuestraFormScreenState extends State<MuestraFormScreen> {
  // Controladores de formulario
  late Map<String, TextEditingController> _controllers;
  late Map<int, TextEditingController> _balanceadoControllers;

  // Estado del formulario
  int? _cicloSeleccionado;
  int? _companiaSeleccionada;
  DateTime _fechaMuestra = DateTime.now();

  // Datos cargados
  List<CicloProductivo> _ciclos = [];
  List<TipoBalanceado> _tiposBalanceado = [];
  Muestra? _ultimoMuestreo;

  // Estados de carga
  bool _cargandoCiclos = false;
  bool _enviandoMuestreo = false;

  // Errores de validación
  final Map<String, String> _erroresValidacion = {};

  // Valores calculados
  Map<String, dynamic> _valoresCalculados = {
    'diasCultivo': 0,
    'incrementoPeso': null,
    'poblacionActual': null,
    'biomasa': null,
    'balanceadoAcumulado': 0.0,
    'conversionAlimenticia': null,
  };

  @override
  void initState() {
    super.initState();
    _inicializarControladores();
    _companiaSeleccionada = widget.usuario.idCompania;
    _cargarDatos();
  }

  void _inicializarControladores() {
    _controllers = {
      'fechaMuestra': TextEditingController(
        text: CalculosMuestra.formatearFecha(_fechaMuestra),
      ),
      'peso': TextEditingController(),
      'supervivencia': TextEditingController(),
      'observaciones': TextEditingController(),
    };
    _balanceadoControllers = {};
  }

  Future<void> _cargarDatos() async {
    if (_companiaSeleccionada == null) return;

    // Cargar ciclos
    await _cargarCiclos();

    // Cargar tipos de balanceado
    await _cargarTiposBalanceado();
  }

  Future<void> _cargarCiclos() async {
    setState(() => _cargandoCiclos = true);

    final resultado = await ApiService.obtenerCiclosProductivos(_companiaSeleccionada!);

    setState(() {
      if (resultado['success']) {
        _ciclos = resultado['data'] ?? [];
      } else {
        _mostrarError('Error', resultado['error'] ?? 'No se pudieron cargar los ciclos');
      }
      _cargandoCiclos = false;
    });
  }

  Future<void> _cargarTiposBalanceado() async {
    final resultado = await ApiService.obtenerTiposBalanceado(_companiaSeleccionada!);

    setState(() {
      if (resultado['success']) {
        _tiposBalanceado = resultado['data'] ?? [];
        // Crear controladores para cada tipo de balanceado
        _balanceadoControllers.clear();
        for (var tipo in _tiposBalanceado) {
          _balanceadoControllers[tipo.idTipoBalanceado] = TextEditingController();
        }
      } else {
        _mostrarError('Error', resultado['error'] ?? 'No se pudieron cargar los tipos de balanceado');
      }
    });
  }

  Future<void> _cargarUltimoMuestreo() async {
    if (_cicloSeleccionado == null) {
      setState(() => _ultimoMuestreo = null);
      return;
    }

    final resultado = await ApiService.obtenerUltimoMuestreo(_cicloSeleccionado!);

    setState(() {
      if (resultado['success']) {
        _ultimoMuestreo = resultado['data'];
        _recalcularValores();
      }
    });
  }

  void _recalcularValores() {
    if (_cicloSeleccionado == null) return;

    final ciclo = _ciclos.firstWhere(
      (c) => c.idCiclo == _cicloSeleccionado,
      orElse: () => CicloProductivo(
        idCiclo: 0,
        idCompania: 0,
        codigoPiscina: '',
        fechaSiembra: DateTime.now(),
        estado: '',
        hectareas: 0,
        tipoSiembra: '',
        densidad: 0,
        cantidadSiembra: 0,
      ),
    );

    if (ciclo.idCiclo == 0) return;

    // Calcular días de cultivo
    int diasCultivo = CalculosMuestra.calcularDiasCultivo(ciclo.fechaSiembra, _fechaMuestra);

    // Calcular incremento de peso si existe
    double? incrementoPeso;
    final pesoStr = _controllers['peso']!.text;
    if (pesoStr.isNotEmpty) {
      final peso = double.tryParse(pesoStr);
      if (peso != null) {
        incrementoPeso =
            CalculosMuestra.calcularIncrementoPeso(peso, _ultimoMuestreo?.peso);
      }
    }

    // Calcular población actual si existe supervivencia
    int? poblacionActual;
    final supervivenciaStr = _controllers['supervivencia']!.text;
    if (supervivenciaStr.isNotEmpty) {
      final supervivencia = double.tryParse(supervivenciaStr);
      if (supervivencia != null) {
        poblacionActual = CalculosMuestra.calcularPoblacionActual(
          supervivencia,
          ciclo.cantidadSiembra,
        );
      }
    }

    // Calcular biomasa si existen peso y población
    double? biomasa;
    if (incrementoPeso != null && poblacionActual != null) {
      biomasa = CalculosMuestra.calcularBiomasa(
        double.tryParse(_controllers['peso']!.text) ?? 0,
        poblacionActual,
      );
    }

    // Calcular balanceado acumulado
    Map<int, double> balanceadosActuales = {};
    for (var entry in _balanceadoControllers.entries) {
      final valor = double.tryParse(entry.value.text) ?? 0;
      if (valor > 0) {
        balanceadosActuales[entry.key] = valor;
      }
    }

    double balanceadoAcumulado = CalculosMuestra.calcularBalanceadoAcumulado(
      balanceadosActuales,
      _ultimoMuestreo?.balanceadoAcumulado ?? 0,
    );

    // Calcular conversión alimenticia
    double? conversionAlimenticia;
    if (balanceadoAcumulado > 0 && biomasa != null && biomasa > 0) {
      conversionAlimenticia =
          CalculosMuestra.calcularConversionAlimenticia(balanceadoAcumulado, biomasa);
    }

    setState(() {
      _valoresCalculados = {
        'diasCultivo': diasCultivo,
        'incrementoPeso': incrementoPeso,
        'poblacionActual': poblacionActual,
        'biomasa': biomasa,
        'balanceadoAcumulado': balanceadoAcumulado,
        'conversionAlimenticia': conversionAlimenticia,
      };
    });
  }

  Future<void> _cambiarCompania(int nuevaCompaniaId) async {
    setState(() {
      _companiaSeleccionada = nuevaCompaniaId;
      _cicloSeleccionado = null;
      _ciclos = [];
      _ultimoMuestreo = null;
      _balanceadoControllers.clear();
      _limpiarFormulario();
    });

    await _cargarDatos();
  }

  void _limpiarFormulario() {
    _controllers['peso']!.clear();
    _controllers['supervivencia']!.clear();
    _controllers['observaciones']!.clear();
    for (var controller in _balanceadoControllers.values) {
      controller.clear();
    }
    _erroresValidacion.clear();
  }

  void _mostrarError(String titulo, String mensaje) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        icon: const Icon(Icons.error, color: Colors.red, size: 50),
        title: Text(titulo),
        content: Text(mensaje),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Aceptar'),
          ),
        ],
      ),
    );
  }

  void _mostrarExito(Muestra muestreo) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        icon: const Icon(Icons.check_circle, color: Colors.green, size: 50),
        title: const Text('¡Éxito!'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Muestreo registrado correctamente'),
              const SizedBox(height: 20),
              _construirResumenMuestreo(muestreo),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _limpiarFormulario();
            },
            child: const Text('Aceptar'),
          ),
        ],
      ),
    );
  }

  Widget _construirResumenMuestreo(Muestra muestreo) {
    // Obtener el ciclo seleccionado para mostrar datos
    final ciclo = _ciclos.firstWhere((c) => c.idCiclo == muestreo.idCiclo, orElse: () => _ciclos.first);
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Sección: Información del ciclo
        const Padding(
          padding: EdgeInsets.only(top: 8.0, bottom: 8.0),
          child: Text('📋 Información del Ciclo', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
        ),
        _construirFilaResumen('Ciclo:', 'Piscina ${ciclo.codigoPiscina}'),
        _construirFilaResumen('Fecha siembra:', CalculosMuestra.formatearFecha(ciclo.fechaSiembra)),
        _construirFilaResumen('Cantidad siembra:', '${ciclo.cantidadSiembra} ind'),
        
        // Sección: Fecha y días
        const Padding(
          padding: EdgeInsets.only(top: 12.0, bottom: 8.0),
          child: Text('📅 Fecha del Muestreo', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
        ),
        _construirFilaResumen('Fecha muestreo:', CalculosMuestra.formatearFecha(muestreo.fechaMuestra)),
        _construirFilaResumen('Días de cultivo:', '${muestreo.diasCultivo} días'),
        
        // Sección: Producción
        const Padding(
          padding: EdgeInsets.only(top: 12.0, bottom: 8.0),
          child: Text('⚖️ Datos de Producción', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
        ),
        _construirFilaResumen('Peso:', '${muestreo.peso.toStringAsFixed(2)}g'),
        _construirFilaResumen('Incremento de peso:', '${muestreo.incrementoPeso.toStringAsFixed(2)}g'),
        _construirFilaResumen('Supervivencia:', '${muestreo.supervivencia.toStringAsFixed(2)}%'),
        _construirFilaResumen('Población actual:', '${muestreo.poblacionActual} ind'),
        _construirFilaResumen('Biomasa:', '${muestreo.biomasaLbs.toStringAsFixed(2)} lbs'),
        
        // Sección: Balanceado
        const Padding(
          padding: EdgeInsets.only(top: 12.0, bottom: 8.0),
          child: Text('🥫 Balanceado Consumido', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
        ),
        ...muestreo.balanceados.map((balanceado) {
          final tipoNombre = _obtenerNombreTipoBalanceado(balanceado.idTipoBalanceado);
          return _construirFilaResumen('$tipoNombre:', '${balanceado.cantidad.toStringAsFixed(2)} kg');
        }),
        
        // Sección: Cálculos finales
        const Padding(
          padding: EdgeInsets.only(top: 12.0, bottom: 8.0),
          child: Text('📊 Cálculos Finales', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
        ),
        _construirFilaResumen(
          'Balanceado acumulado:',
          '${muestreo.balanceadoAcumulado.toStringAsFixed(2)} kg',
        ),
        _construirFilaResumen(
          'Conversión alimenticia:',
          muestreo.conversionAlimenticia.toStringAsFixed(3),
        ),
        
        // Sección: Observaciones (si las hay)
        if (muestreo.observaciones.isNotEmpty) ...[
          const Padding(
            padding: EdgeInsets.only(top: 12.0, bottom: 8.0),
            child: Text('📝 Observaciones', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
          ),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey.shade300),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(muestreo.observaciones, style: const TextStyle(fontSize: 12)),
          ),
        ],
      ],
    );
  }

  Widget _construirFilaResumen(String etiqueta, String valor) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(etiqueta, style: const TextStyle(fontWeight: FontWeight.bold)),
          Text(valor),
        ],
      ),
    );
  }

  String _obtenerNombreTipoBalanceado(int idTipo) {
    try {
      return _tiposBalanceado.firstWhere((t) => t.idTipoBalanceado == idTipo).nombre;
    } catch (e) {
      return 'Balanceado';
    }
  }

  Future<void> _enviarMuestreo() async {
    // Validar
    _erroresValidacion.clear();

    if (_cicloSeleccionado == null) {
      _erroresValidacion['ciclo'] = 'Selecciona un ciclo productivo';
    }

    final pesoStr = _controllers['peso']!.text.trim();
    final peso = double.tryParse(pesoStr);
    if (peso == null || peso <= 0) {
      _erroresValidacion['peso'] = 'Ingresa un peso válido';
    }

    final supervivenciaStr = _controllers['supervivencia']!.text.trim();
    final supervivencia = double.tryParse(supervivenciaStr);
    if (supervivencia == null || supervivencia < 0 || supervivencia > 100) {
      _erroresValidacion['supervivencia'] = 'La supervivencia debe estar entre 0 y 100%';
    }

    bool tieneBalanceado = false;
    for (var controller in _balanceadoControllers.values) {
      final valor = double.tryParse(controller.text.trim());
      if (valor != null && valor > 0) {
        tieneBalanceado = true;
        break;
      }
    }
    if (!tieneBalanceado) {
      _erroresValidacion['balanceado'] = 'Ingresa al menos un tipo de balanceado';
    }

    if (_erroresValidacion.isNotEmpty) {
      setState(() {});
      _mostrarError(
        'Validación',
        _erroresValidacion.values.join('\n'),
      );
      return;
    }

    setState(() => _enviandoMuestreo = true);

    try {
      // Construir objeto Muestra
      final balanceadosList = <BalanceadoConsumo>[];
      for (var entry in _balanceadoControllers.entries) {
        final valor = double.tryParse(entry.value.text.trim()) ?? 0;
        if (valor > 0) {
          balanceadosList.add(BalanceadoConsumo(
            idTipoBalanceado: entry.key,
            cantidad: valor,
          ));
        }
      }

      final ciclo = _ciclos.firstWhere((c) => c.idCiclo == _cicloSeleccionado);
      final poblacionActual = CalculosMuestra.calcularPoblacionActual(
        supervivencia!,
        ciclo.cantidadSiembra,
      );
      final biomasa = CalculosMuestra.calcularBiomasa(peso!, poblacionActual!);
      final balanceadoAcumulado = _valoresCalculados['balanceadoAcumulado'] as double;
      final conversionAlimenticia =
          CalculosMuestra.calcularConversionAlimenticia(balanceadoAcumulado, biomasa!);

      final muestreo = Muestra(
        idCiclo: _cicloSeleccionado!,
        diasCultivo: _valoresCalculados['diasCultivo'] as int,
        peso: peso,
        incrementoPeso: _valoresCalculados['incrementoPeso'] as double? ?? 0,
        biomasaLbs: biomasa,
        balanceados: balanceadosList,
        balanceadoAcumulado: balanceadoAcumulado,
        conversionAlimenticia: conversionAlimenticia ?? 0,
        poblacionActual: poblacionActual,
        supervivencia: supervivencia,
        observaciones: _controllers['observaciones']!.text.trim(),
        fechaMuestra: _fechaMuestra,
        idUsuario: widget.usuario.idUsuario,
        idCompania: _companiaSeleccionada!,
      );

      final resultado = await ApiService.crearMuestreo(muestreo);

      if (resultado['success']) {
        _mostrarExito(muestreo);
      } else {
        _mostrarError('Error', resultado['error'] ?? 'Error al registrar el muestreo');
      }
    } catch (e) {
      _mostrarError('Error', 'Error inesperado: ${e.toString()}');
    } finally {
      setState(() => _enviandoMuestreo = false);
    }
  }

  void _cerrarSesion() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cerrar Sesión'),
        content: const Text('¿Estás seguro de que deseas cerrar sesión?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (context) => const LoginScreen()),
              );
            },
            child: const Text('Cerrar Sesión'),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    for (var controller in _controllers.values) {
      controller.dispose();
    }
    for (var controller in _balanceadoControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Registro de Muestreo',
          style: TextStyle(color: Colors.white),
        ),
        backgroundColor: Colors.blue.shade900,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Header personalizado
            _construirHeader(),

            // Formulario
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: _construirFormulario(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _construirHeader() {
    return Container(
      color: Colors.blue.shade900,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.usuario.grupoEmpresarial,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  if (widget.usuario.companias.length > 1)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: DropdownButton<int>(
                        value: _companiaSeleccionada,
                        style: const TextStyle(color: Colors.white),
                        dropdownColor: Colors.blue.shade900,
                        items: widget.usuario.companias
                            .map<DropdownMenuItem<int>>((compania) {
                          return DropdownMenuItem<int>(
                            value: compania['id_compania'] ?? 0,
                            child: Text(compania['nombre'] ?? 'Compañía'),
                          );
                        }).toList(),
                        onChanged: (value) {
                          if (value != null) {
                            _cambiarCompania(value);
                          }
                        },
                      ),
                    )
                  else
                    Text(
                      widget.usuario.nombreCompania,
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 14,
                      ),
                    ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    widget.usuario.nombre,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton.icon(
                    icon: const Icon(Icons.logout, size: 18),
                    label: const Text('Cerrar Sesión'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      textStyle: const TextStyle(fontSize: 12),
                    ),
                    onPressed: _cerrarSesion,
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _construirFormulario() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Nuevo Registro de Muestreo',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 20),

            // Seleccionar ciclo
            _construirCampoSeleccion(),
            const SizedBox(height: 20),

            // Fecha de muestreo
            _construirCampoFecha(),
            const SizedBox(height: 20),

            // Información de producción
            _construirSeccionProduccion(),
            const SizedBox(height: 20),

            // Tipos de balanceado
            if (_tiposBalanceado.isNotEmpty) ...[
              _construirSeccionBalanceado(),
              const SizedBox(height: 20),
            ],

            // Observaciones
            _construirCampoObservaciones(),
            const SizedBox(height: 20),

            // Botones de acción
            _construirBotonesAccion(),
          ],
        ),
      ),
    );
  }

  Widget _construirCampoSeleccion() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Seleccionar Ciclo Productivo *',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        if (_cargandoCiclos)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 8),
            child: CircularProgressIndicator(),
          )
        else
          DropdownButton<int>(
            value: _cicloSeleccionado,
            isExpanded: true,
            hint: const Text('Selecciona un ciclo productivo'),
            items: _ciclos.map<DropdownMenuItem<int>>((ciclo) {
              final fechaSiembra = ciclo.fechaSiembra.toLocal();
              return DropdownMenuItem<int>(
                value: ciclo.idCiclo,
                child: Text(
                  'Piscina ${ciclo.codigoPiscina} - Siembra: ${fechaSiembra.toLocal().toIso8601String().split('T')[0]}',
                ),
              );
            }).toList(),
            onChanged: (value) {
              setState(() => _cicloSeleccionado = value);
              if (value != null) {
                _cargarUltimoMuestreo();
              }
            },
          ),
        if (_erroresValidacion.containsKey('ciclo'))
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(
              _erroresValidacion['ciclo']!,
              style: const TextStyle(color: Colors.red, fontSize: 12),
            ),
          ),
        const SizedBox(height: 6),
        const Text(
          'Solo se muestran ciclos productivos con estado "EN_CURSO". Selecciona uno para agregar datos de muestreo.',
          style: TextStyle(fontSize: 12, color: Colors.grey),
        ),
      ],
    );
  }

  Widget _construirCampoFecha() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Fecha de Muestreo *',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: () async {
            final fecha = await showDatePicker(
              context: context,
              initialDate: _fechaMuestra,
              firstDate: DateTime(2020),
              lastDate: DateTime.now(),
            );
            if (fecha != null) {
              setState(() => _fechaMuestra = fecha);
              _controllers['fechaMuestra']!.text =
                  CalculosMuestra.formatearFecha(fecha);
              _recalcularValores();
            }
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(_controllers['fechaMuestra']!.text),
                const Icon(Icons.calendar_today),
              ],
            ),
          ),
        ),
        const SizedBox(height: 6),
        const Text(
          'Selecciona la fecha del muestreo',
          style: TextStyle(fontSize: 12, color: Colors.grey),
        ),
      ],
    );
  }

  Widget _construirSeccionProduccion() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Información de Producción',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
        const SizedBox(height: 12),
        _construirCampoCalculado(
          'Días de Cultivo',
          _valoresCalculados['diasCultivo'].toString(),
          helpText: 'Calculado desde la fecha de siembra hasta la fecha de muestra',
        ),
        const SizedBox(height: 12),
        _construirCampoNumerico(
          'Peso (g) *',
          'peso',
          'Ej: 15.5',
          onChanged: (_) => _recalcularValores(),
          helpText: _ultimoMuestreo != null
              ? 'Peso anterior: ${_ultimoMuestreo!.peso.toStringAsFixed(2)}g'
              : _cicloSeleccionado != null
                  ? 'Buscando último muestreo...'
                  : 'Selecciona un ciclo primero',
        ),
        const SizedBox(height: 12),
        _construirCampoCalculado(
          'Incremento Peso (g)',
          _valoresCalculados['incrementoPeso']?.toStringAsFixed(2) ?? '-',
          helpText: 'Diferencia entre el peso actual y el peso del último muestreo',
        ),
        const SizedBox(height: 12),
        _construirCampoNumerico(
          'Supervivencia (%) *',
          'supervivencia',
          'Ej: 93.33',
          maxValue: 100,
          onChanged: (_) => _recalcularValores(),
          helpText: _cicloSeleccionado != null && _ciclos.isNotEmpty
              ? (() {
                  final cicloSeleccionado = _ciclos.firstWhere(
                    (c) => c.idCiclo == _cicloSeleccionado,
                    orElse: () => CicloProductivo(
                      idCiclo: 0,
                      idCompania: 0,
                      codigoPiscina: '',
                      fechaSiembra: DateTime.now(),
                      estado: '',
                      hectareas: 0,
                      tipoSiembra: '',
                      densidad: 0,
                      cantidadSiembra: 0,
                    ),
                  );
                  if (cicloSeleccionado.cantidadSiembra > 0) {
                    return 'Cantidad siembra: ${cicloSeleccionado.cantidadSiembra.toStringAsFixed(0)} individuos';
                  } else {
                    return 'Selecciona un ciclo primero para ver la cantidad de siembra';
                  }
                })()
              : 'Selecciona un ciclo primero para ver la cantidad de siembra',
        ),
        const SizedBox(height: 12),
        _construirCampoCalculado(
          'Población Actual',
          _valoresCalculados['poblacionActual']?.toString() ?? '-',
          helpText: 'Cantidad de siembra × (Supervivencia % ÷ 100)',
        ),
        const SizedBox(height: 12),
        _construirCampoCalculado(
          'Biomasa (lbs)',
          _valoresCalculados['biomasa']?.toStringAsFixed(2) ?? '-',
          helpText: '(Peso en g ÷ 454) × Población actual',
        ),
      ],
    );
  }

  Widget _construirSeccionBalanceado() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Información de Alimentación',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
        ),
        const SizedBox(height: 12),
        ..._tiposBalanceado.map((tipo) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _construirCampoNumerico(
              tipo.nombre,
              'balanceado_${tipo.idTipoBalanceado}',
              'Ej: 500',
              controller: _balanceadoControllers[tipo.idTipoBalanceado],
              onChanged: (_) => _recalcularValores(),
              helpText: 'Cantidad consumida en este muestreo',
            ),
          );
        }),
        _construirCampoCalculado(
          'Balanceado Acumulado',
          _valoresCalculados['balanceadoAcumulado'].toStringAsFixed(2),
          helpText: _ultimoMuestreo != null && _ultimoMuestreo!.balanceadoAcumulado > 0
              ? 'Acumulado anterior: ${_ultimoMuestreo!.balanceadoAcumulado.toStringAsFixed(2)} + consumo actual'
              : 'Suma del consumo actual (primer muestreo del ciclo)',
        ),
        const SizedBox(height: 12),
        _construirCampoCalculado(
          'Conversión Alimenticia',
          _valoresCalculados['conversionAlimenticia']?.toStringAsFixed(3) ?? '-',
          helpText: 'Balanceado acumulado ÷ Biomasa (lbs)',
        ),
      ],
    );
  }

  Widget _construirCampoObservaciones() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Observaciones (Opcional)',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _controllers['observaciones'],
          maxLines: 4,
          decoration: InputDecoration(
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
            hintText: 'Ingresa cualquier observación relevante...',
          ),
        ),
        const SizedBox(height: 6),
        const Text(
          'Registra cualquier información adicional relevante para el muestreo',
          style: TextStyle(fontSize: 12, color: Colors.grey),
        ),
      ],
    );
  }

  Widget _construirCampoNumerico(
    String label,
    String fieldName,
    String hint, {
    TextEditingController? controller,
    double? maxValue,
    required Function(String) onChanged,
    String? helpText,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller ?? _controllers[fieldName],
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          decoration: InputDecoration(
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
            hintText: hint,
            errorText: _erroresValidacion[fieldName],
          ),
          onChanged: onChanged,
        ),
        if (helpText != null) ...[
          const SizedBox(height: 6),
          Text(
            helpText,
            style: const TextStyle(
              fontSize: 12,
              color: Colors.grey,
            ),
          ),
        ],
      ],
    );
  }

  Widget _construirCampoCalculado(String label, String valor, {String? helpText}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
        ),
        const SizedBox(height: 6),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          decoration: BoxDecoration(
            border: Border.all(color: Colors.grey.shade300),
            borderRadius: BorderRadius.circular(8),
            color: Colors.grey.shade100,
          ),
          child: Text(
            valor,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              color: Colors.grey,
            ),
          ),
        ),
        if (helpText != null) ...[
          const SizedBox(height: 6),
          Text(
            helpText,
            style: const TextStyle(
              fontSize: 12,
              color: Colors.grey,
            ),
          ),
        ],
      ],
    );
  }

  Widget _construirBotonesAccion() {
    return Row(
      children: [
        Expanded(
          child: ElevatedButton.icon(
            icon: const Icon(Icons.save),
            label: const Text('Guardar Registro'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blue,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
            onPressed: _enviandoMuestreo ? null : _enviarMuestreo,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: OutlinedButton.icon(
            icon: const Icon(Icons.clear),
            label: const Text('Limpiar'),
            onPressed: _enviandoMuestreo ? null : _limpiarFormulario,
          ),
        ),
      ],
    );
  }
}
