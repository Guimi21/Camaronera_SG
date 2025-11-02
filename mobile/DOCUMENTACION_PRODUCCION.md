# 📱 Documentación de Producción - Mobile

**Última actualización**: 1 Noviembre 2025  
**Versión**: 1.0

---

## 📑 ÍNDICE DE CONTENIDOS

1. [Quick Start (5 minutos)](#quick-start-5-minutos)
2. [Guía Completa de Producción](#guía-completa-de-producción)
3. [Detección Automática de Entorno](#detección-automática-de-entorno)
4. [Troubleshooting](#troubleshooting)

---

## QUICK START (5 MINUTOS)

**Tiempo total**: ~15 minutos (primera vez) o ~5 minutos (siguientes)

### Paso 1: Verificar Requisitos (1 min)

```powershell
flutter doctor
```

Debe mostrar ✓ en:
- Flutter
- Android SDK
- Android Studio

### Paso 2: Preparar Keystore (Solo primera vez - 5 min)

```powershell
cd "d:\Trabajo Camaron360\Camaronera_SG\mobile"

# Generar keystore
& "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe" -genkey -v -keystore key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias camaronera_key
```

Responde con:
- Contraseña: `[TU_CONTRASEÑA_SEGURA]`
- Nombre: `Camaronera SG`
- Otros campos: Completa según corresponda

**⚠️ Guarda la contraseña en un lugar seguro.**

### Paso 3: Crear Archivo de Configuración (1 min)

Crea `android/key.properties`:

```properties
storePassword=[TU_CONTRASEÑA_SEGURA]
keyPassword=[TU_CONTRASEÑA_SEGURA]
keyAlias=camaronera_key
storeFile=d:/Trabajo Camaron360/Camaronera_SG/mobile/key.jks
```

⚠️ Usa slashes `/` no backslashes `\` en rutas de Windows.

### Paso 4: Descargar Dependencias (2 min)

```powershell
flutter pub get
```

### Paso 5: Generar APK (5 min)

```powershell
flutter build apk --release
```

**Espera a que se complete.** Verás:

```
✓ Built build/app/outputs/flutter-apk/app-release.apk (XX.X MB)
```

### Paso 6: Localizar APK (5 segundos)

```powershell
ls build/app/outputs/flutter-apk/app-release.apk
```

**Ruta**: `d:\Trabajo Camaron360\Camaronera_SG\mobile\build\app\outputs\flutter-apk\app-release.apk`

### Paso 7: Instalar en Dispositivo (2 min - Opcional)

**En Dispositivo Físico:**
```powershell
adb devices
adb install build/app/outputs/flutter-apk/app-release.apk
```

**En Emulador:**
```powershell
flutter install --release
```

### Verificación

Una vez instalado, abre la app y verifica:
- ✓ Se conecta a `https://camaron360.com/server` (en producción)
- ✓ Login funciona
- ✓ Puede guardar muestreos
- ✓ No hay errores de certificado

### Variables de Entorno

| Entorno | URL Base | Comando |
|---------|----------|---------|
| **Desarrollo** | `http://10.0.2.2:5000` | `flutter run` |
| **Producción** | `https://camaron360.com/server` | `flutter build apk --release` |

### APK Split por Arquitectura (Opcional)

Si el APK es muy grande (>50 MB), genera versiones separadas:

```powershell
flutter build apk --release --split-per-abi
```

Genera:
- `app-armeabi-v7a-release.apk` (~25 MB)
- `app-arm64-v8a-release.apk` (~28 MB)
- `app-x86_64-release.apk` (~30 MB)

### Troubleshooting Rápido

| Problema | Solución |
|----------|----------|
| "Keystore not found" | Verificar ruta en `key.properties` |
| "Invalid password" | Verificar contraseña en `key.properties` |
| "JAVA_HOME not set" | Ejecutar: `$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"` |
| "Build failed" | Ejecutar: `flutter clean` y reintentar |

### Archivos Importantes

| Archivo | Propósito |
|---------|-----------|
| `key.jks` | Keystore para firmar (GUARDAR EN LUGAR SEGURO) |
| `android/key.properties` | Credenciales del keystore (NO SUBIR A GIT) |
| `android/app/build.gradle.kts` | Configuración de build |
| `pubspec.yaml` | Dependencias y versión |

### Próximas Actualizaciones

Cada vez que actualices el app:

1. Incrementar versión en `pubspec.yaml`:
   ```yaml
   version: 1.0.1+2
   ```

2. Ejecutar:
   ```powershell
   flutter clean
   flutter pub get
   flutter build apk --release
   ```

3. Guardar con nombre descriptivo:
   ```
   app-release-v1.0.1.apk
   ```

---

## GUÍA COMPLETA DE PRODUCCIÓN

### Tabla de Contenidos
1. [Requisitos Previos](#requisitos-previos-completo)
2. [Configuración del Entorno](#configuración-del-entorno-completo)
3. [Generación del APK](#generación-del-apk-completo)
4. [Configuración de URLs](#configuración-de-urls-completo)
5. [Requisitos del Servidor](#requisitos-del-servidor-completo)
6. [Pruebas en Producción](#pruebas-en-producción-completo)
7. [Solución de Problemas](#solución-de-problemas-completo)

### Requisitos Previos (Completo)

**Software Necesario:**
- **Flutter SDK**: Versión 3.0 o superior
  - Descargar desde: https://flutter.dev/docs/get-started/install
  - Añadir a PATH del sistema

- **Android SDK**: Versión 34 (API level 34) o superior
  - Se instala automáticamente con Android Studio
  - O mediante `flutter doctor`

- **Android Studio**: Última versión recomendada
  - Descargar desde: https://developer.android.com/studio

- **Java Development Kit (JDK)**: Versión 11 o superior
  - Viene incluido con Android Studio

**Verificación del Entorno:**
```bash
flutter doctor
```

Debería mostrar:
- ✓ Flutter (sin advertencias críticas)
- ✓ Android toolchain
- ✓ Android SDK
- ✓ Android Studio

### Configuración del Entorno (Completo)

**1. Proyecto:**
```bash
cd "d:\Trabajo Camaron360\Camaronera_SG\mobile"
```

**2. Dependencias:**
```bash
flutter pub get
```

**3. Verificar:**
```bash
flutter doctor -v
```

### Generación del APK (Completo)

#### Paso 1: Generar Keystore (Primera vez)

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
keytool -genkey -v -keystore key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias camaronera_key
```

**Responde:**
```
Ingrese la contraseña del almacén de claves: [CONTRASEÑA_SEGURA]
¿Cuál es su nombre?                          Camaronera SG
¿Cuál es su unidad organizativa?             Tecnología
¿Cuál es su organización?                    Camaronera 360
¿Cuál es su ciudad?                          [Tu ciudad]
¿Cuál es su provincia/estado?                [Tu provincia]
¿Cuál es el código de país de 2 letras?      CO (u otro país)
¿Está correcto? (sí/no)                      sí
```

**Guarda la contraseña en lugar seguro.**

#### Paso 2: Configurar Build

Crea `android/key.properties`:

```properties
storePassword=[LA_CONTRASEÑA_QUE_INGRESASTE]
keyPassword=[LA_CONTRASEÑA_QUE_INGRESASTE]
keyAlias=camaronera_key
storeFile=D:/Trabajo Camaron360/Camaronera_SG/mobile/key.jks
```

#### Paso 3: Generar APK

```powershell
flutter build apk --release
```

**Proceso:**
- Compila Dart a código nativo
- Genera recursos optimizados
- Firma con keystore
- Crea APK final (~5-10 minutos)

**Salida esperada:**
```
✓ Built build/app/outputs/flutter-apk/app-release.apk (XX.X MB)
```

#### Paso 4: Ubicación

```
mobile/build/app/outputs/flutter-apk/app-release.apk
```

### Configuración de URLs (Completo)

#### En Desarrollo (Emulador)
- **URL**: `http://10.0.2.2:5000`
- **Explicación**: IP especial para localhost desde emulador

#### En Producción (APK)
- **URL**: `https://camaron360.com/server`
- **Explicación**: Dominio de producción con HTTPS

#### Cómo Funciona

En `lib/services/api_service.dart`:

```dart
bool isProduction = const bool.fromEnvironment('dart.vm.product');

if (isProduction) {
  return 'https://camaron360.com/server';
} else {
  return 'http://10.0.2.2:5000';
}
```

**En desarrollo** (`flutter run`):
- `dart.vm.product` = `false`
- Usa `http://10.0.2.2:5000`

**En producción** (APK firmado):
- `dart.vm.product` = `true`
- Usa `https://camaron360.com/server`

### Requisitos del Servidor (Completo)

#### 1. Certificado SSL/TLS (Obligatorio)
- Obtener de autoridad confiable (Let's Encrypt, Comodo, etc.)
- Instalar en Apache/Nginx
- Renovación automática

#### 2. Configuración Actual

El archivo `server/config/config.php` ya detecta automáticamente:

```php
if ($isProduction) {
    // En producción
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $hostname = $_SERVER['HTTP_HOST'] ?? 'camaron360.com';
    define('BASE_URL', $protocol . '://' . $hostname);
    // ... credenciales BD producción
} else {
    // En desarrollo
    define('BASE_URL', 'http://localhost:3000');
    // ... credenciales BD desarrollo
}
```

#### 3. Rutas del API

- `POST /server/auth/login.php` - Autenticación
- `GET /server/module/ciclosproductivos.php` - Ciclos
- `GET /server/module/tipos_balanceado.php` - Tipos
- `GET /server/module/muestras.php` - Muestras
- `POST /server/module/muestras.php` - Crear
- `GET /server/module/companias.php` - Compañías

#### 4. CORS

Ya configurado en `server/helpers/cors.php`:

```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');
```

✅ Permite acceso desde cualquier origen.

### Pruebas en Producción (Completo)

#### Opción 1: Dispositivo Físico

**Conectar:**
1. USB a teléfono
2. Habilitar "Depuración de USB"
3. Ejecutar:
```powershell
adb devices
```

**Instalar:**
```powershell
adb install build/app/outputs/flutter-apk/app-release.apk
```

#### Opción 2: Emulador

```powershell
flutter install --release
```

#### Opción 3: Distribuir

1. **Google Play Store** (recomendado):
   - Cuenta desarrollador ($25 USD)
   - Subir APK
   - Revisar en 24-48 horas

2. **APK Directo**:
   - Compartir `app-release.apk`
   - Usuarios instalan manualmente

#### Pruebas Recomendadas

**Login:**
- Usuario válido ✓
- Credenciales inválidas ✓
- Conexión perdida ✓

**Formulario:**
- Cargar ciclos ✓
- Guardar muestreos ✓
- Validaciones ✓

**Conectividad:**
- HTTPS funciona ✓
- Manejo de errores ✓
- Sincronización ✓

### Solución de Problemas (Completo)

#### "Certificado SSL no válido"
**Causa**: Certificado no instalado
**Solución**: Instalar Let's Encrypt o certificado comercial

#### "Conexión rechazada"
**Causa**: Servidor no responde o puerto bloqueado
**Solución**:
- Verificar servidor activo
- Abrir puerto 443 en firewall

#### "CORS bloqueado"
**Causa**: Headers CORS no configurados
**Solución**:
- Verificar `cors.php` se ejecuta
- Revisar headers en respuesta

#### "Base de datos no encontrada"
**Causa**: Credenciales incorrectas
**Solución**:
- Verificar `config.php`
- Confirmar usuario/contraseña

#### "APK muy grande"
**Tamaño esperado**: 30-50 MB
**Si > 100 MB**:
```bash
flutter build apk --release --split-per-abi
```

#### "App se cierra al iniciar"
**Verificar**:
```bash
adb logcat | Select-String "flutter"
```

### Comandos de Referencia

| Tarea | Comando |
|-------|---------|
| Verificar entorno | `flutter doctor -v` |
| Dependencias | `flutter pub get` |
| Desarrollo | `flutter run` |
| APK release | `flutter build apk --release` |
| APK por arquitectura | `flutter build apk --release --split-per-abi` |
| Instalar | `adb install app-release.apk` |
| Logs | `adb logcat` |
| Dispositivos | `adb devices` |

### Notas Importantes

✅ **Certificado SSL**: Obligatorio para HTTPS  
✅ **Keystore Seguro**: Guardar en lugar seguro  
✅ **Versionado**: Incrementar versión en `build.gradle.kts`  
✅ **Pruebas**: Probar antes de distribuir  
✅ **Monitoreo**: Revisar logs del servidor  

---

## DETECCIÓN AUTOMÁTICA DE ENTORNO

### ¿Cómo Sabe la App?

Mediante la variable de compilación `dart.vm.product`:

```dart
static String get baseUrl {
  bool isProduction = const bool.fromEnvironment('dart.vm.product');
  
  if (isProduction) {
    return 'https://camaron360.com/server';
  } else {
    return 'http://10.0.2.2:5000';
  }
}
```

### Comandos y Resultados

**Desarrollo (flutter run):**
```powershell
flutter run
# → dart.vm.product = false
# → baseUrl = http://10.0.2.2:5000
# → Conecta a backend local
```

**Desarrollo Debug (flutter run --debug):**
```powershell
flutter run --debug
# → dart.vm.product = false
# → baseUrl = http://10.0.2.2:5000
# → Conecta a backend local
```

**Producción APK (flutter build apk --release):**
```powershell
flutter build apk --release
# → dart.vm.product = true
# → baseUrl = https://camaron360.com/server
# → Conecta a servidor de producción
```

**Producción AAB (flutter build appbundle --release):**
```powershell
flutter build appbundle --release
# → dart.vm.product = true
# → baseUrl = https://camaron360.com/server
# → Para Google Play Store
```

### ¿Por qué `const bool.fromEnvironment()`?

La palabra clave **`const`** es importante:

1. **Se evalúa en tiempo de compilación** (no en runtime)
2. **Se optimiza** - código innecesario se elimina
3. **Sin sobrecarga** - sin verificación en cada petición

**Ejemplo de Optimización:**

Modo Debug (después de compilar):
```dart
// Flutter OPTIMIZA a:
final baseUrl = 'http://10.0.2.2:5000';
// Rama de producción eliminada
```

Modo Release (después de compilar):
```dart
// Flutter OPTIMIZA a:
final baseUrl = 'https://camaron360.com/server';
// Rama de desarrollo eliminada
```

### Comparación: Antes vs Después

**ANTES (Hardcodeado):**
```dart
class ApiService {
  static const String baseUrl = 'http://10.0.2.2:5000';
}
```

Problemas:
- ❌ Necesita cambiar código
- ❌ Riesgo de olvidar
- ❌ Imposible probar producción localmente

**AHORA (Dinámico):**
```dart
class ApiService {
  static String get baseUrl {
    bool isProduction = const bool.fromEnvironment('dart.vm.product');
    if (isProduction) {
      return 'https://camaron360.com/server';
    } else {
      return 'http://10.0.2.2:5000';
    }
  }
}
```

Ventajas:
- ✅ Automático según compilación
- ✅ Sin cambios de código
- ✅ Seguro y confiable
- ✅ Igual que web (config.js)

### Flujo Técnico Detallado

**En flutter run (Desarrollo):**
```
1. flutter run
   ↓
2. Compilador Flutter modo DEBUG
   ↓
3. dart.vm.product = false (por defecto)
   ↓
4. const bool.fromEnvironment('dart.vm.product') = false
   ↓
5. if (false) {...} salta, else {...} ejecuta
   ↓
6. baseUrl = 'http://10.0.2.2:5000'
   ↓
7. App conecta a localhost:5000
   ↓
8. ✓ Backend de desarrollo
```

**En flutter build apk --release (Producción):**
```
1. flutter build apk --release
   ↓
2. Compilador Flutter modo RELEASE
   ↓
3. dart.vm.product = true (automático)
   ↓
4. const bool.fromEnvironment('dart.vm.product') = true
   ↓
5. if (true) {...} ejecuta, else {...} salta
   ↓
6. baseUrl = 'https://camaron360.com/server'
   ↓
7. App conecta a camaron360.com/server
   ↓
8. ✓ Backend de producción
```

### Verificación en Logs

**Ver qué URL está usando:**
```bash
flutter run
# En logs, busca:
# http.post('$baseUrl/auth/login.php')
# Debería mostrar:
# http.post('http://10.0.2.2:5000/auth/login.php')
```

**Ver variable de entorno:**
```dart
// Dentro de un método en la app
print('isProduction: ${const bool.fromEnvironment('dart.vm.product')}');
print('baseUrl: ${ApiService.baseUrl}');
```

Verás en logs:
- **Development**: `isProduction: false, baseUrl: http://10.0.2.2:5000`
- **Production**: `isProduction: true, baseUrl: https://camaron360.com/server`

### Casos de Uso Avanzados

**Caso 1: Cambiar URL de desarrollo (dispositivo físico):**
```dart
static String get baseUrl {
  bool isProduction = const bool.fromEnvironment('dart.vm.product');
  
  if (isProduction) {
    return 'https://camaron360.com/server';
  } else {
    return 'http://192.168.1.100:5000';  // IP local del PC
  }
}
```

**Caso 2: URL diferente por flavor:**
```dart
static String get baseUrl {
  const String flavor = String.fromEnvironment('FLUTTER_FLAVOR');
  
  switch (flavor) {
    case 'production':
      return 'https://camaron360.com/server';
    case 'staging':
      return 'https://staging.camaron360.com/server';
    default:
      return 'http://10.0.2.2:5000';
  }
}
```

Compilar:
```bash
flutter run --flavor production
flutter run --flavor staging
flutter run --flavor development
```

### Preguntas Frecuentes

**P: ¿Funciona con `flutter pub run`?**
R: No. Para compilar usa `flutter run` o `flutter build`.

**P: ¿Puedo cambiar URLs sin recompilar?**
R: No. Es variable de compilación (const). Necesitas recompilar.

**P: ¿Funciona en web?**
R: Para web usa `--dart-define`:
```bash
flutter build web --dart-define="dart.vm.product=true"
```

**P: ¿Qué pasa si no defino `dart.vm.product`?**
R: Por defecto: `false` en debug, `true` en release.

**P: ¿Es seguro poner la URL en el código?**
R: La URL es pública (visible al descompilar APK). Usa HTTPS para seguridad (que ya tenemos).

### Equivalencias con Otros Frameworks

| Framework | Variable | Comando |
|-----------|----------|---------|
| Flutter (Android) | `dart.vm.product` | `flutter build apk --release` |
| React (Web) | `process.env.NODE_ENV` | `npm run build` |
| React Native | `__DEV__` | `npm run build:production` |
| Kotlin | `BuildConfig.DEBUG` | `./gradlew build --release` |

### Resumen

✅ **Automático**: No necesitas configurar nada  
✅ **Seguro**: Variable de compilación  
✅ **Eficiente**: Se optimiza en compilación  
✅ **Probado**: Usado en miles de apps  

**Para cambiar entre dev/prod**: Solo recompila con `flutter run` o `flutter build apk --release`

---

## TROUBLESHOOTING

### Problemas Comunes

#### "No puedo conectar a backend"
**Problema**: Error de conexión en `flutter run`

**Solución**:
1. Verificar backend ejecutándose:
   ```bash
   cd server && php -S 0.0.0.0:5000
   ```
2. Ver logs:
   ```bash
   adb logcat | grep flutter
   ```
3. Probar URL:
   ```bash
   curl http://localhost:5000/auth/login.php
   ```

#### "Certificado SSL no válido"
**Problema**: APK no puede conectar a `https://camaron360.com`

**Causa**: Certificado SSL no instalado

**Solución**: Ver sección "Requisitos del Servidor"

#### "flutter build apk failed"
**Problema**: Error durante compilación

**Solución**:
```bash
flutter clean
flutter pub get
flutter build apk --release
```

Si persiste:
- Keystore en ruta correcta
- Contraseña en `key.properties` correcta
- Java instalado: `$env:JAVA_HOME`

#### "CORS bloqueado"
**Problema**: Frontend web no puede conectar

**Solución**:
1. Verificar `cors.php` se ejecuta
2. Ver headers CORS:
   ```bash
   curl -I http://localhost:5000/auth/login.php
   ```

#### "Connection refused"
**Problema**: Backend no puede conectar a MySQL

**Solución**:
1. MySQL corriendo
2. Credenciales en `config.php` correctas
3. BD existe

#### "APK muy grande"
**Tamaño esperado**: 30-50 MB (normal)

**Si > 100 MB**:
```bash
flutter build apk --release --split-per-abi
```

#### "App se cierra al iniciar"
**Verificar**:
```bash
adb logcat | Select-String "flutter"
```

Busca errores de conexión o excepción de BD

---

## 📊 COMPARATIVA: ANTES vs AHORA

| Aspecto | Antes | Después |
|---------|-------|---------|
| Entornos | 1 (dev) | 2 (dev+prod) ✅ |
| URLs hardcodeadas | Sí ❌ | No ✅ |
| HTTPS en prod | No ❌ | Sí ✅ |
| BDs separadas | No ❌ | Sí ✅ |
| Documentación | 3 archivos | 1 archivo ✅ |

---

## ✨ CONCLUSIÓN

✅ **Automático**: URLs se detectan automáticamente  
✅ **Seguro**: HTTPS en producción  
✅ **Consolidado**: Todo en un archivo  
✅ **Claro**: Instrucciones paso a paso  

**Status**: 🟢 LISTO PARA PRODUCCIÓN

---

**Última actualización**: 1 Noviembre 2025  
**Versión**: 1.0  
**Consolidación**: 3 archivos → 1 archivo ✅
