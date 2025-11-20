# Camaronera SG - Aplicación Móvil Flutter

## Descripción General

Aplicación móvil Flutter para la gestión de muestras (muestreos) en camaroneras. Los usuarios con perfil de **Administrador** o **Directivo** pueden registrar muestras de camarón con información detallada sobre peso, supervivencia, consumo de balanceado y otros parámetros de producción.

La aplicación realiza cálculos automáticos de biomasa, conversión alimenticia y otras métricas, validando todos los datos antes de enviarlos al servidor backend.

## Tabla de Contenidos

1. [Arquitectura General](#arquitectura-general)
2. [Flujo de Autenticación](#flujo-de-autenticación)
3. [Estructura de Archivos](#estructura-de-archivos)
4. [Modelos de Datos](#modelos-de-datos)
5. [Servicios API](#servicios-api)
6. [Pantallas](#pantallas)
7. [Cálculos y Validaciones](#cálculos-y-validaciones)
8. [Guía de Implementación](#guía-de-implementación)
9. [Pruebas](#pruebas)

---

## Arquitectura General

La aplicación sigue una arquitectura cliente-servidor con las siguientes capas:

```
┌─────────────────────────────────────────┐
│     Pantallas (Screens)                 │
│  - HomeScreen                           │
│  - LoginScreen                          │
│  - MuestraFormScreen                    │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│     Lógica de Negocio                   │
│  - Cálculos (CalculosMuestra)          │
│  - Validaciones                         │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│     Servicios (ApiService)              │
│  - Login                                │
│  - Ciclos Productivos                   │
│  - Tipos de Balanceado                  │
│  - Muestreos                            │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│     Backend (PHP/API REST)              │
│  - http://10.0.2.2:5000                │
└─────────────────────────────────────────┘
```

### Modelos de Datos (lib/models/)

- **UsuarioAutenticado**: Información del usuario logueado
- **CicloProductivo**: Ciclo productivo de una piscina
- **TipoBalanceado**: Tipos de alimento disponibles
- **Muestra**: Registro de un muestreo
- **BalanceadoConsumo**: Consumo de balanceado en un muestreo

### Utilidades (lib/utils/)

- **CalculosMuestra**: Funciones de cálculo automático
  - Días de cultivo
  - Incremento de peso
  - Población actual
  - Biomasa
  - Conversión alimenticia
  - Validaciones

---

## Flujo de Autenticación

### 1. Pantalla de Inicio (HomeScreen)

```
┌─────────────────────────────┐
│   CAMARONERA SG             │
│                             │
│   [INICIAR SESIÓN]         │
└─────────────────────────────┘
```

**Ubicación**: `lib/main.dart`

**Comportamiento**:
- Muestra logo, nombre de la aplicación
- Botón que navega a LoginScreen
- Diseño con gradiente azul

### 2. Pantalla de Login (LoginScreen)

```
┌──────────────────────────────┐
│   INICIAR SESIÓN            │
│                              │
│   [Usuario        ]          │
│   [Contraseña  👁]          │
│                              │
│   [Entrar]                   │
│                              │
│   [Volver al inicio]         │
└──────────────────────────────┘
```

**Ubicación**: `lib/main.dart`

**Campos**:
- Usuario (validación: no vacío)
- Contraseña (con botón mostrar/ocultar)

**Validaciones**:
- Ambos campos obligatorios
- Se muestra spinner durante login

**Respuesta Exitosa**:
```json
{
  "id_usuario": 1,
  "nombre": "Juan Pérez",
  "usuario": "jperez",
  "perfil": "Administrador",
  "id_compania": 5,
  "nombre_compania": "Camaronera del Sur",
  "grupo_empresarial": "Grupo Camarón 360",
  "companias": [
    {"id_compania": 5, "nombre": "Camaronera del Sur"},
    {"id_compania": 6, "nombre": "Camaronera del Centro"}
  ]
}
```

**Flujo**:
1. Usuario ingresa credenciales
2. Se validan campos
3. Se envía solicitud POST a `/auth/login.php`
4. Si es exitoso y el perfil es "Administrador" o "Directivo":
   - Se muestra diálogo de éxito
   - Se navega a MuestraFormScreen
5. Si falla o perfil no autorizado:
   - Se muestra diálogo de error
   - Usuario permanece en login

### 3. Pantalla de Formulario (MuestraFormScreen)

```
┌────────────────────────────────────┐
│ REGISTRO DE MUESTREO              │
├────────────────────────────────────┤
│ [Grupo Empresarial]  [Usar Sesión] │
│ [Compañía ▼]         [Cerrar Ses.] │
├────────────────────────────────────┤
│ Nuevo Registro de Muestreo         │
│                                    │
│ Ciclo Productivo ▼                │
│ Fecha de Muestreo [●●●●-●●-●●]    │
│                                    │
│ Información de Producción:         │
│ Días de Cultivo     [  ]  (calc)   │
│ Peso (g)            [  ]  *        │
│ Incremento Peso     [  ]  (calc)   │
│ Supervivencia (%)   [  ]  *        │
│ Población Actual    [  ]  (calc)   │
│ Biomasa (lbs)       [  ]  (calc)   │
│                                    │
│ Información de Alimentación:       │
│ [Tipo Balanceado 1] [  ]  *        │
│ [Tipo Balanceado 2] [  ]           │
│ Balanceado Acumulado [  ] (calc)   │
│ Conv. Alimenticia   [  ]  (calc)   │
│                                    │
│ Observaciones:                     │
│ [                               ]  │
│                                    │
│ [Guardar Registro] [Limpiar]       │
└────────────────────────────────────┘
```

**Ubicación**: `lib/screens/muestra_form_screen.dart`

**Funcionalidades principales**:
- Header con información de usuario y grupo empresarial
- Selector de compañía (si el usuario tiene múltiples)
- Formulario con cálculos automáticos
- Validaciones en tiempo real
- Diálogos de éxito/error

---

## Estructura de Archivos

```
lib/
├── main.dart                          # HomeScreen y LoginScreen
├── models/
│   └── muestra.dart                   # Todos los modelos de datos
├── screens/
│   └── muestra_form_screen.dart       # Pantalla del formulario
├── services/
│   └── api_service.dart               # Servicios HTTP
└── utils/
    └── calculos_muestra.dart          # Funciones de cálculo
```

---

## Modelos de Datos

### Perfil

```dart
class Perfil {
  final int idPerfil;
  final String nombre;  // "Administrador", "Directivo", etc.
}
```

### UsuarioAutenticado

```dart
class UsuarioAutenticado {
  final int idUsuario;
  final String nombre;
  final String usuario;
  final List<Perfil> perfiles;      // Array de perfiles del usuario
  final int idCompania;
  final String nombreCompania;
  final String grupoEmpresarial;
  final List<dynamic> companias;    // Lista de compañías disponibles
  final List<dynamic> menus;        // Menús configurados para el usuario

  // Método helper para verificar permisos
  String get perfilActivo => perfiles.isNotEmpty ? perfiles[0].nombre : '';
  
  bool tienePermiso(String nombrePerfil) {
    return perfiles.any((p) => p.nombre == nombrePerfil);
  }
}
```

**Características**:
- Conversión segura de tipos (int/string)
- Manejo de múltiples perfiles
- Método `tienePermiso()` para verificar autorización
- Propiedad `perfilActivo` para obtener el primer perfil

### CicloProductivo

```dart
class CicloProductivo {
  final int idCiclo;
  final int idCompania;
  final String codigoPiscina;       // Ej: "P001"
  final DateTime fechaSiembra;
  final String estado;              // "EN_CURSO", "FINALIZADO"
  final double hectareas;
  final String tipoSiembra;        // Densidad de siembra
  final double densidad;
  final int cantidadSiembra;        // Población inicial
}
```

### TipoBalanceado

```dart
class TipoBalanceado {
  final int idTipoBalanceado;
  final String nombre;              // Ej: "Balanceado 35%"
  final String unidad;              // Ej: "kg"
}
```

### BalanceadoConsumo

```dart
class BalanceadoConsumo {
  final int idTipoBalanceado;
  final double cantidad;            // En la unidad especificada
}
```

### Muestra

```dart
class Muestra {
  final int? idMuestra;
  final int idCiclo;
  final int diasCultivo;            // Calculado automáticamente
  final double peso;                // En gramos
  final double incrementoPeso;      // En gramos, puede ser null
  final double biomasaLbs;          // Calculado automáticamente
  final List<BalanceadoConsumo> balanceados;
  final double balanceadoAcumulado; // Calculado automáticamente
  final double conversionAlimenticia; // Calculado automáticamente
  final int poblacionActual;        // Calculado automáticamente
  final double supervivencia;       // En porcentaje (0-100)
  final String observaciones;
  final DateTime fechaMuestra;
  final int idUsuario;
  final int idCompania;
}
```

---

## Servicios API

### ApiService

Ubicación: `lib/services/api_service.dart`

**Métodos principales**:

#### 1. login(username, password)

```dart
Future<Map<String, dynamic>> login(String username, String password)
```

- **URL**: `POST /auth/login.php`
- **Retorna**: Mapa con `success` y `data` (UsuarioAutenticado) o `error`
- **Timeout**: 10 segundos

#### 2. obtenerCiclosProductivos(idCompania)

```dart
Future<Map<String, dynamic>> obtenerCiclosProductivos(int idCompania)
```

- **URL**: `GET /module/ciclosproductivos.php?id_compania=:id`
- **Retorna**: Lista de CicloProductivo filtrados por estado "EN_CURSO"
- **Timeout**: 10 segundos

#### 3. obtenerTiposBalanceado(idCompania)

```dart
Future<Map<String, dynamic>> obtenerTiposBalanceado(int idCompania)
```

- **URL**: `GET /module/tipos_balanceado.php?id_compania=:id`
- **Retorna**: Lista de TipoBalanceado
- **Timeout**: 10 segundos

#### 4. obtenerUltimoMuestreo(idCiclo)

```dart
Future<Map<String, dynamic>> obtenerUltimoMuestreo(int idCiclo)
```

- **URL**: `GET /module/muestras.php?id_ciclo=:id&ultimo=true`
- **Retorna**: Último Muestra del ciclo (o null si no hay)
- **Timeout**: 10 segundos

#### 5. crearMuestreo(muestra)

```dart
Future<Map<String, dynamic>> crearMuestreo(Muestra muestra)
```

- **URL**: `POST /module/muestras.php`
- **Body**: JSON del objeto Muestra
- **Retorna**: Confirmación con id_muestra o error
- **Timeout**: 10 segundos

---

## Pantallas

### HomeScreen

**Ubicación**: `lib/main.dart`

**Responsabilidades**:
- Punto de entrada a la aplicación
- Muestra logo y nombre
- Botón para acceder a login
- Diseño introductorio

**Propiedades**:
- Gradiente azul de fondo
- Icono de gota de agua
- Botón ElevatedButton

### LoginScreen

**Ubicación**: `lib/main.dart`

**Responsabilidades**:
- Autenticación del usuario
- Validación de credenciales
- Navegación según perfil

**Estado**:
- `_usuarioController`: Controlador para username
- `_passwordController`: Controlador para password
- `_showPassword`: Toggle para mostrar/ocultar contraseña
- `_isLoading`: Estado de carga

**Métodos principales**:
- `_handleLogin()`: Procesa el login
- `_showSuccessDialog()`: Muestra diálogo de éxito
- `_showErrorDialog()`: Muestra diálogo de error

### MuestraFormScreen

**Ubicación**: `lib/screens/muestra_form_screen.dart`

**Responsabilidades**:
- Captura de datos de muestreo
- Cálculos automáticos
- Validaciones
- Envío al servidor

**Estado**:
- `_controllers`: Controladores de formulario
- `_balanceadoControllers`: Controladores dinámicos para balanceados
- `_cicloSeleccionado`: ID del ciclo seleccionado
- `_companiaSeleccionada`: ID de la compañía
- `_fechaMuestra`: Fecha del muestreo
- `_ciclos`: Lista de ciclos disponibles
- `_tiposBalanceado`: Lista de tipos de balanceado
- `_ultimoMuestreo`: Último muestreo del ciclo
- `_valoresCalculados`: Mapa con valores calculados
- `_erroresValidacion`: Errores de validación
- `_enviandoMuestreo`: Estado de envío

**Métodos principales**:

#### _cargarDatos()
Carga ciclos y tipos de balanceado

#### _cargarCiclos()
Obtiene ciclos productivos en curso

#### _cargarTiposBalanceado()
Obtiene tipos de balanceado configurados

#### _cargarUltimoMuestreo()
Obtiene el último muestreo del ciclo para comparativas

#### _recalcularValores()
Ejecuta todos los cálculos automáticos

#### _cambiarCompania(nuevaCompaniaId)
Cambia la compañía y recarga datos

#### _enviarMuestreo()
Valida y envía el formulario al servidor

#### _cerrarSesion()
Cierra sesión y regresa a HomeScreen

**Métodos constructores**:
- `_construirHeader()`: Encabezado con información de usuario
- `_construirFormulario()`: Formulario principal
- `_construirCampoSeleccion()`: Selector de ciclo
- `_construirCampoFecha()`: Selector de fecha
- `_construirSeccionProduccion()`: Campos de producción
- `_construirSeccionBalanceado()`: Campos dinámicos de balanceado
- `_construirCampoObservaciones()`: Área de observaciones
- `_construirCampoNumerico()`: Campo de entrada numérica
- `_construirCampoCalculado()`: Campo de solo lectura para valores calculados
- `_construirBotonesAccion()`: Botones guardar/limpiar

---

## Cálculos y Validaciones

### Clase CalculosMuestra

Ubicación: `lib/utils/calculos_muestra.dart`

Todas las funciones son estáticas y pueden ser llamadas sin instanciar la clase.

#### 1. calcularDiasCultivo(fechaSiembra, fechaMuestra)

```dart
static int calcularDiasCultivo(DateTime fechaSiembra, DateTime fechaMuestra)
```

**Fórmula**: `fechaMuestra - fechaSiembra` (en días)

**Validación**:
- Si `fechaMuestra < fechaSiembra`, retorna 0
- Siempre retorna un entero positivo

**Ejemplo**:
```dart
int dias = CalculosMuestra.calcularDiasCultivo(
  DateTime(2024, 1, 1),
  DateTime(2024, 1, 31)
);
// dias = 30
```

#### 2. calcularIncrementoPeso(pesoActual, pesoAnterior)

```dart
static double? calcularIncrementoPeso(double pesoActual, double? pesoAnterior)
```

**Fórmula**:
- Si no hay peso anterior: `incremento = pesoActual`
- Si hay peso anterior: `incremento = pesoActual - pesoAnterior`

**Validaciones**:
- `pesoActual` debe ser > 0
- Retorna `null` si `pesoActual` es inválido

**Ejemplo**:
```dart
// Primer muestreo del ciclo
double? inc1 = CalculosMuestra.calcularIncrementoPeso(15.5, null);
// inc1 = 15.5

// Muestreo posterior
double? inc2 = CalculosMuestra.calcularIncrementoPeso(18.0, 15.5);
// inc2 = 2.5
```

#### 3. calcularPoblacionActual(supervivencia, cantidadSiembra)

```dart
static int? calcularPoblacionActual(double supervivencia, int cantidadSiembra)
```

**Fórmula**: `cantidadSiembra × (supervivencia ÷ 100)`

**Validaciones**:
- `supervivencia` debe estar entre 0 y 100
- `cantidadSiembra` debe ser > 0
- Retorna `null` si hay error

**Ejemplo**:
```dart
int? poblacion = CalculosMuestra.calcularPoblacionActual(93.33, 100000);
// poblacion = 93330 individuos
```

#### 4. calcularBiomasa(pesoGramos, poblacionActual)

```dart
static double? calcularBiomasa(double pesoGramos, int poblacionActual)
```

**Fórmula**: `(pesoGramos ÷ 454) × poblacionActual`

**Notas**:
- 1 libra = 454 gramos
- Resultado en libras

**Validaciones**:
- `pesoGramos` debe ser > 0
- `poblacionActual` debe ser > 0
- Retorna `null` si hay error

**Ejemplo**:
```dart
double? biomasa = CalculosMuestra.calcularBiomasa(15.5, 93330);
// biomasa ≈ 3017.34 lbs
```

#### 5. calcularBalanceadoAcumulado(balanceadosActuales, balanceadoAnterior)

```dart
static double calcularBalanceadoAcumulado(
  Map<int, double> balanceadosActuales,
  double balanceadoAnterior
)
```

**Fórmula**: `balanceadoAnterior + sum(balanceadosActuales)`

**Validaciones**:
- Solo cuenta balanceados > 0
- Si no hay datos anteriores, `balanceadoAnterior` es 0

**Ejemplo**:
```dart
Map<int, double> consumos = {
  1: 500.0,  // Balanceado tipo 1
  2: 250.0,  // Balanceado tipo 2
};
double acumulado = CalculosMuestra.calcularBalanceadoAcumulado(
  consumos,
  5000.0  // Acumulado anterior
);
// acumulado = 5750.0 kg
```

#### 6. calcularConversionAlimenticia(balanceadoAcumulado, biomasaLbs)

```dart
static double? calcularConversionAlimenticia(
  double balanceadoAcumulado,
  double biomasaLbs
)
```

**Fórmula**: `balanceadoAcumulado ÷ biomasaLbs`

**Validaciones**:
- Ambos valores deben ser > 0
- Retorna `null` si hay error o división por cero

**Ejemplo**:
```dart
double? conversion = CalculosMuestra.calcularConversionAlimenticia(5750.0, 3017.34);
// conversion ≈ 1.906
```

#### 7. validarFormulario()

```dart
static Map<String, String> validarFormulario({
  required int idCiclo,
  required double peso,
  required double supervivencia,
  required Map<int, double> balanceados,
})
```

**Retorna**: Mapa de errores (vacío si es válido)

**Validaciones**:
- `idCiclo` > 0
- `peso` > 0
- `supervivencia` entre 0 y 100
- Al menos un balanceado > 0

**Ejemplo**:
```dart
Map<String, String> errores = CalculosMuestra.validarFormulario(
  idCiclo: 0,
  peso: -5.0,
  supervivencia: 150.0,
  balanceados: {1: 0, 2: 0},
);
// errores = {
//   'ciclo': 'Selecciona un ciclo productivo',
//   'peso': 'Ingresa un peso válido (mayor a 0)',
//   'supervivencia': 'La supervivencia debe estar entre 0 y 100%',
//   'balanceado': 'Ingresa al menos un tipo de balanceado',
// }
```

#### 8. formatearFecha(fecha)

```dart
static String formatearFecha(DateTime fecha)
```

**Formato**: `YYYY-MM-DD`

#### 9. formatearFechaDisplay(fecha)

```dart
static String formatearFechaDisplay(DateTime fecha)
```

**Formato**: `"D de mes de YYYY"` (localizado en español)

**Ejemplo**:
```dart
String fecha = CalculosMuestra.formatearFechaDisplay(DateTime(2024, 3, 15));
// fecha = "15 de marzo de 2024"
```

---

## Guía de Implementación

### Requisitos Previos

- Flutter SDK >= 3.0.0
- Dart >= 3.0.0
- Android SDK (para emulador Android) o Xcode (para iOS)

### Instalación

1. **Clonar el repositorio**:
```bash
cd mobile
```

2. **Obtener dependencias**:
```bash
flutter pub get
```

3. **Configurar la URL del servidor** (si es necesario):
   - Editar `lib/services/api_service.dart`
   - Cambiar `baseUrl` en la clase ApiService
   - URL actual: `http://10.0.2.2:5000` (para emulador Android)

### Ejecución

**En emulador Android**:
```bash
flutter run
```

**En dispositivo físico**:
```bash
flutter run -d <device_id>
```

**Con modo debug**:
```bash
flutter run -v
```

**Build para producción**:
```bash
flutter build apk --release      # Android
flutter build ios --release      # iOS
```

### Configuración del Backend

El backend debe exponer los siguientes endpoints:

#### POST /auth/login.php

**Request**:
```json
{
  "username": "usuario",
  "password": "contraseña"
}
```

**Response (exitoso)**:
```json
{
  "success": true,
  "id_usuario": 3,
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
}
```

**Notas importantes**:
- El backend retorna `perfiles` como un array, no como un string único
- El campo `compania` contiene el nombre, mientras que `id_compania` contiene el ID
- Se incluyen `menus` para futuras implementaciones
- La aplicación verifica `usuario.tienePermiso('Administrador')` para validar acceso
- Los IDs pueden venir como int o string, ambos son manejados correctamente

#### GET /module/ciclosproductivos.php?id_compania=:id

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id_ciclo": 1,
      "id_compania": 5,
      "codigo_piscina": "P001",
      "fecha_siembra": "2024-01-01",
      "estado": "EN_CURSO",
      "hectareas": 1.5,
      "tipo_siembra": "Densidad media",
      "densidad": 50000,
      "cantidad_siembra": 75000
    }
  ]
}
```

#### GET /module/tipos_balanceado.php?id_compania=:id

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id_tipo_balanceado": 1,
      "nombre": "Balanceado 35%",
      "unidad": "kg"
    },
    {
      "id_tipo_balanceado": 2,
      "nombre": "Balanceado 28%",
      "unidad": "kg"
    }
  ]
}
```

#### GET /module/muestras.php?id_ciclo=:id&ultimo=true

**Response (con datos)**:
```json
{
  "success": true,
  "data": [
    {
      "id_muestra": 10,
      "id_ciclo": 1,
      "dias_cultivo": 30,
      "peso": 15.5,
      "incremento_peso": 2.5,
      "biomasa_lbs": 2500.0,
      "balanceados": [
        {"id_tipo_balanceado": 1, "cantidad": 500}
      ],
      "balanceado_acumulado": 5750.0,
      "conversion_alimenticia": 1.906,
      "poblacion_actual": 93330,
      "supervivencia": 93.33,
      "observaciones": "",
      "fecha_muestra": "2024-01-31",
      "id_usuario": 1,
      "id_compania": 5
    }
  ]
}
```

#### POST /module/muestras.php

**Request**:
```json
{
  "id_ciclo": 1,
  "dias_cultivo": 30,
  "peso": 15.5,
  "incremento_peso": 2.5,
  "biomasa_lbs": 2500.0,
  "balanceados": [
    {"id_tipo_balanceado": 1, "cantidad": 500},
    {"id_tipo_balanceado": 2, "cantidad": 250}
  ],
  "balanceado_acumulado": 5750.0,
  "conversion_alimenticia": 1.906,
  "poblacion_actual": 93330,
  "supervivencia": 93.33,
  "observaciones": "Observaciones importantes",
  "fecha_muestra": "2024-01-31",
  "id_usuario": 1,
  "id_compania": 5
}
```

**Response (exitoso)**:
```json
{
  "success": true,
  "message": "Muestreo registrado exitosamente",
  "data": {
    "id_muestra": 11
  }
}
```

---

## Validaciones

### En el Formulario

#### 1. Ciclo Productivo
- **Requerido**: Sí
- **Validación**: Debe seleccionar uno de la lista
- **Mensaje de error**: "Selecciona un ciclo productivo"

#### 2. Peso (g)
- **Requerido**: Sí
- **Tipo**: Decimal positivo
- **Rango**: > 0
- **Decimales**: Hasta 2
- **Mensaje de error**: "Ingresa un peso válido (mayor a 0)"

#### 3. Supervivencia (%)
- **Requerido**: Sí
- **Tipo**: Decimal
- **Rango**: 0 a 100
- **Decimales**: Hasta 2
- **Mensaje de error**: "La supervivencia debe estar entre 0 y 100%"

#### 4. Balanceados
- **Requerido**: Al menos uno > 0
- **Tipo**: Decimal positivo
- **Decimales**: Hasta 2
- **Mensaje de error**: "Ingresa al menos un tipo de balanceado"

#### 5. Observaciones
- **Requerido**: No
- **Tipo**: Texto
- **Máximo**: Sin límite específico

#### 6. Fecha de Muestreo
- **Requerido**: Sí
- **Rango**: Desde 1900 hasta hoy
- **Formato**: YYYY-MM-DD

### Mensajes de Error

Los errores se muestran de forma visual:
- En rojo debajo del campo
- En un diálogo AlertDialog con todos los errores
- Se valida antes de enviar

### Validación del Lado del Servidor

El servidor debe validar:
- Permisos del usuario
- Existencia del ciclo para esa compañía
- Datos coherentes
- Integridad referencial

---

## Flujo Completo de Uso

### Caso: Usuario registra un nuevo muestreo

```
1. [Inicio] 
   ↓
2. [Usuario inicia sesión]
   - Ingresa usuario y contraseña
   - Click en "Entrar"
   ↓
3. [Login exitoso]
   - Se valida perfil (Administrador/Directivo)
   - Se muestra diálogo de éxito
   - Se navega a MuestraFormScreen
   ↓
4. [En formulario]
   - Sistema carga ciclos y tipos de balanceado
   - Usuario selecciona ciclo
   - Se carga último muestreo del ciclo
   ↓
5. [Usuario ingresa datos]
   - Ingresa peso
   - Ingresa supervivencia
   - Ingresa consumo de balanceados
   - Sistema calcula automáticamente:
     * Días de cultivo
     * Incremento de peso
     * Población actual
     * Biomasa
     * Balanceado acumulado
     * Conversión alimenticia
   ↓
6. [Usuario verifica datos]
   - Revisa valores calculados
   - Agrega observaciones (opcional)
   - Click en "Guardar Registro"
   ↓
7. [Validación]
   - Sistema valida todos los campos
   - Si hay errores: muestra diálogo con mensajes
   - Si es válido: continúa
   ↓
8. [Envío al servidor]
   - Se crea objeto Muestra
   - Se envía POST a /module/muestras.php
   - Spinner de carga
   ↓
9. [Respuesta del servidor]
   - Si exitoso: diálogo con resumen del muestreo
   - Si error: diálogo con mensaje de error
   ↓
10. [Usuario acepta diálogo]
    - Formulario se limpia
    - Usuario puede registrar otro muestreo
    ↓
11. [Cerrar sesión]
    - Usuario click en "Cerrar Sesión"
    - Confirma acción
    - Se regresa a HomeScreen
```

---

## Pruebas

### Pruebas Unitarias Recomendadas

#### Para CalculosMuestra

```dart
// test/utils/calculos_muestra_test.dart

test('calcularDiasCultivo retorna diferencia correcta', () {
  final resultado = CalculosMuestra.calcularDiasCultivo(
    DateTime(2024, 1, 1),
    DateTime(2024, 1, 31),
  );
  expect(resultado, 30);
});

test('calcularPoblacionActual con supervivencia del 93.33%', () {
  final resultado = CalculosMuestra.calcularPoblacionActual(93.33, 100000);
  expect(resultado, 93330);
});

test('calcularBiomasa con peso 15.5g y población 93330', () {
  final resultado = CalculosMuestra.calcularBiomasa(15.5, 93330);
  expect(resultado, closeTo(3017.34, 0.01));
});

test('validarFormulario retorna errores cuando falta ciclo', () {
  final errores = CalculosMuestra.validarFormulario(
    idCiclo: 0,
    peso: 15.5,
    supervivencia: 93.33,
    balanceados: {1: 500},
  );
  expect(errores.containsKey('ciclo'), true);
});
```

### Pruebas de Integración Recomendadas

1. **Login**: Usuario válido/inválido
2. **Carga de ciclos**: Verificar filtrado por compañía
3. **Cálculos**: Verificar que se actualizan automáticamente
4. **Envío**: Registrar muestreo exitosamente
5. **Validación**: Mostrar errores correctamente
6. **Navegación**: Entre pantallas
7. **Sesión**: Cerrar sesión regresa a inicio

### Datos de Prueba

**Usuario válido**:
- Usuario: `test_admin`
- Contraseña: `password123`
- Perfil: `Administrador`

**Usuario inválido**:
- Usuario: `no_existe`
- Contraseña: `error123`

---

## Changelog

### [1.0.1] - 2025-11-01

#### Fixed
- **Corrección de Cálculo de Incremento de Peso**: El backend devolvía campos numéricos como strings (ej: `"peso":"2.00"`), causando que la conversión en `Muestra.fromJson()` fallara. Se implementó conversión segura de tipos con métodos `_toDouble()` y `_toInt()` que manejan automáticamente conversión de int, double y string a los tipos requeridos.
  - Antes: Incremento de peso = 10 (incorrecto)
  - Después: Incremento de peso = 10 - 2 = 8 (correcto)
  - Archivos modificados: `lib/models/muestra.dart`
  - Tests agregados: `test/muestra_parsing_test.dart`

#### Changed
- Mejorada robustez de parseo JSON en todos los modelos
- Aplicada conversión segura a todos los campos numéricos en `Muestra`, `CicloProductivo`, `TipoBalanceado`

### [1.0.0] - 2025-10-30

#### Added
- Versión inicial de la aplicación móvil
- Autenticación con roles (Administrador, Directivo)
- Formulario de registro de muestras
- Cálculos automáticos de biomasa y conversión alimenticia
- Validaciones comple de formulario
- Manejo de errores y dialogs informativos

---

## Troubleshooting

### Error: "Tiempo de conexión agotado"

**Causa**: El servidor no está disponible o es muy lento

**Solución**:
1. Verificar que el backend está corriendo
2. Verificar la URL en `api_service.dart`
3. Aumentar timeout en los métodos si es necesario

### Error: "Acceso denegado"

**Causa**: Usuario no tiene perfil de Administrador o Directivo

**Solución**:
1. Asegurar que el usuario tiene el perfil correcto
2. Contactar administrador para cambiar el perfil

### Error: "No hay ciclos productivos"

**Causa**: No hay ciclos en estado "EN_CURSO"

**Solución**:
1. Crear ciclo productivo en el backend
2. Asegurar estado es "EN_CURSO"

### Valores calculados no se actualizan

**Causa**: Posible error en `_recalcularValores()`

**Solución**:
1. Verificar que ciclo está seleccionado
2. Revisar logs en consola
3. Reiniciar la app

### La app cierra al cambiar compañía

**Causa**: Error al cargar nuevos datos

**Solución**:
1. Verificar conexión de red
2. Revisar logs en Flutter DevTools
3. Asegurar que la nueva compañía tiene ciclos

---

## Mejoras Futuras

1. **Caché local**: Almacenar datos en SQLite
2. **Sincronización offline**: Guardar localmente si no hay conexión
3. **Gráficos**: Mostrar tendencias de muestreos
4. **Reportes**: Generar reportes PDF
5. **Múltiples idiomas**: Localización para otros idiomas
6. **Notificaciones**: Push notifications para recordatorios
7. **Cámara**: Foto de la piscina con muestreo
8. **Exportación**: Exportar datos a CSV/Excel

---

## Soporte y Contacto

Para reportar bugs o solicitar mejoras, contactar al equipo de desarrollo.

---

**Versión**: 1.0.1  
**Última actualización**: Noviembre 1, 2025  
**Autor**: Equipo de Desarrollo Camaronera SG
