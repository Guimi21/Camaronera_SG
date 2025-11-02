# Configuración del Servidor para Producción

## Estado Actual del Servidor ✅

La configuración del servidor **ya está optimizada** para producción. Aquí está el análisis:

---

## 1. Detección Automática de Entorno

**Archivo**: `server/config/config.php`

```php
// Detecta si está en producción por el dominio
$isProduction = $_SERVER['HTTP_HOST'] === 'camaron360.com' || 
               $_SERVER['HTTP_HOST'] === 'www.camaron360.com' ||
               strpos($_SERVER['HTTP_HOST'], 'camaron360.com') !== false;

if ($isProduction) {
    // Usa credenciales de producción
    define('DB_HOST', 'localhost');
    define('DB_USER', 'guimialc_root');
    define('DB_PASS', 'bdCamaronera360');
    define('DB_NAME', 'guimialc_sg_camaronera');
} else {
    // Usa credenciales de desarrollo
    define('DB_HOST', 'localhost');
    define('DB_USER', 'root');
    define('DB_PASS', '');
    define('DB_NAME', 'sg_camaronera');
}
```

✅ **Ventaja**: No requiere cambios manuales. El servidor detecta automáticamente si es producción o desarrollo.

---

## 2. CORS Configurado ✅

**Archivo**: `server/helpers/cors.php`

```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');
```

✅ **Ventaja**: Permite solicitudes desde cualquier origen (necesario para el APK)

---

## 3. Protocolo HTTPS ✅

**Detección automática en config.php:**

```php
$protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
```

✅ **Ventaja**: El servidor usa automáticamente HTTPS en producción

---

## Requisitos para Producción

### 1. **Certificado SSL/TLS** (CRÍTICO)

Para que el APK funcione con HTTPS, **camaron360.com debe tener un certificado SSL válido**.

#### Opción A: Let's Encrypt (RECOMENDADO - GRATUITO)

```bash
# En tu servidor (Linux)
sudo apt-get install certbot python3-certbot-apache
sudo certbot certonly --apache -d camaron360.com -d www.camaron360.com
```

Esto genera certificados en:
- `/etc/letsencrypt/live/camaron360.com/cert.pem`
- `/etc/letsencrypt/live/camaron360.com/privkey.pem`

#### Opción B: Certificado Comercial

Comprar en proveedores como:
- Comodo
- DigiCert
- GoDaddy
- Namecheap

### 2. **Configurar Apache para HTTPS**

**Archivo**: `/etc/apache2/sites-available/camaron360.com.conf`

```apache
<VirtualHost *:443>
    ServerName camaron360.com
    ServerAlias www.camaron360.com
    DocumentRoot /var/www/html/camaronera

    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/camaron360.com/cert.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/camaron360.com/privkey.pem
    SSLCertificateChainFile /etc/letsencrypt/live/camaron360.com/chain.pem

    <Directory /var/www/html/camaronera>
        AllowOverride All
        Require all granted
    </Directory>

    # Redirigir HTTP a HTTPS
    RewriteEngine On
    RewriteCond %{REQUEST_URI} !^/.well-known/acme-challenge/
    RewriteRule ^(.*)$ https://%{HTTP_HOST}$1 [R=301,L]
</VirtualHost>

# Puerto 80 (HTTP) redirige a HTTPS
<VirtualHost *:80>
    ServerName camaron360.com
    ServerAlias www.camaron360.com
    RewriteEngine On
    RewriteRule ^(.*)$ https://camaron360.com$1 [R=301,L]
</VirtualHost>
```

**Activar sitio:**
```bash
sudo a2ensite camaron360.com.conf
sudo systemctl restart apache2
```

### 3. **Renovación Automática de Certificados**

```bash
# Crear tarea cron (se ejecuta cada mes)
sudo crontab -e

# Añadir línea:
0 0 1 * * certbot renew --quiet
```

### 4. **Firewall - Puertos Abiertos**

```bash
# Puerto 80 (HTTP)
sudo ufw allow 80/tcp

# Puerto 443 (HTTPS)
sudo ufw allow 443/tcp

# Verificar
sudo ufw status
```

---

## Verificación de Conectividad desde el APK

### 1. **Test Manual desde Terminal**

Desde tu máquina de desarrollo:

```bash
# Verificar que el certificado es válido
curl -I https://camaron360.com/server/auth/login.php

# Debería responder con 200 OK (no errores de certificado)
```

### 2. **Test del API**

```bash
# Probar login
curl -X POST https://camaron360.com/server/auth/login.php \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'

# Debería retornar JSON con datos del usuario o error 401
```

### 3. **Test desde Dispositivo Android**

Una vez instalado el APK:

1. Abre la app
2. Intenta hacer login
3. Verifica logs:
   ```bash
   adb logcat | grep flutter
   ```

---

## Estructura de Rutas del Servidor

El APK accede a las siguientes rutas:

```
https://camaron360.com/server/
├── auth/
│   └── login.php                    (POST) - Autenticación
├── module/
│   ├── ciclosproductivos.php        (GET)  - Listar ciclos
│   ├── tipos_balanceado.php         (GET)  - Listar tipos
│   ├── muestras.php                 (GET/POST) - Muestras
│   ├── companias.php                (GET)  - Compañías
│   └── ... (otros módulos)
└── helpers/
    └── cors.php                     (Configuración CORS)
```

Asegúrate que todas estas rutas están disponibles en el servidor de producción.

---

## Cambios Requeridos en el Servidor: NINGUNO ✅

La configuración actual es suficiente. Solo necesitas:

1. ✅ Instalar certificado SSL (Let's Encrypt)
2. ✅ Configurar Apache para HTTPS
3. ✅ Abrir puerto 443 en firewall
4. ✅ Asegurar que `/server` es accesible desde la web

---

## Checklist Pre-Producción

- [ ] Certificado SSL instalado en camaron360.com
- [ ] Apache configurado para HTTPS
- [ ] Puerto 443 abierto en firewall
- [ ] Base de datos de producción actualizada
- [ ] Credenciales de BD correctas en config.php
- [ ] Prueba manual con curl funciona
- [ ] APK instalado en dispositivo de prueba
- [ ] APK puede conectarse a https://camaron360.com/server
- [ ] Login funciona desde el APK
- [ ] Creación de muestreos sincroniza correctamente

---

## Logs y Debugging

### Ver Logs del Servidor

```bash
# Apache
sudo tail -f /var/log/apache2/error.log
sudo tail -f /var/log/apache2/access.log

# PHP (si está configurado)
sudo tail -f /var/log/php.log
```

### Ver Logs del APK

```bash
adb logcat | grep -i "https\|camaron\|flutter\|error"
```

---

## Problemas Comunes

| Problema | Causa | Solución |
|----------|-------|----------|
| "Certificado no válido" | SSL no instalado | Instalar Let's Encrypt |
| "Conexión rechazada" | Puerto 443 cerrado | Abrir puerto en firewall |
| "Timeout" | Servidor no responde | Verificar Apache está activo |
| "Base de datos no encontrada" | Credenciales incorrectas | Verificar config.php |
| "CORS error" | Headers no configurados | Verificar cors.php se ejecuta |

---

## Resumen

✅ **El servidor está listo para producción**

Solo necesitas:
1. Certificado SSL (Let's Encrypt - gratis)
2. Configuración Apache (estándar)
3. Abrir puerto 443

El código del servidor **no requiere cambios**. Detecta automáticamente producción y usa las credenciales correctas.

---

**Última actualización**: Noviembre 2025
**Versión**: 1.0
