# Game Atlas iOS — compilar, probar y publicar desde Windows

**Estado comprobado:** Game Atlas iOS `1.0 (build 10)` se compiló, se firmó y se envió correctamente a Apple por GitHub Actions el 16/11/2026 (hora de Argentina). [Ejecución exitosa](https://github.com/BautistaL99/game-atlas-ios-build-free/actions/runs/43998970767).

Este repositorio es **público** y contiene exclusivamente el cliente iOS (Capacitor). No se modifica Android ni la web principal. Nunca incluir certificados, archivos `.p8`, `.p12`, contraseñas, perfiles, ni datos privados en commits.

## Probar ahora la compilación enviada
1. Abrir [App Store Connect](https://appstoreconnect.apple.com/apps) > Game Atlas > TestFlight.
2. En la build `1.0 (10)`, pulsar **Gestionar** para contestar la declaración de cifrado/exportación correctamente.
3. Crear un grupo de **Pruebas internas**, agregar la build e invitar una cuenta autorizada de App Store Connect.
4. Instalar **TestFlight** en el iPhone, aceptar invitación e instalar la app.
5. Probar funciones y tomar capturas antes de enviar a revisión pública.

## Próximas versiones: preparación única de la firma
La primera subida utilizó un certificado temporal de distribución cuya clave privada se destruyó al finalizar el runner. **Ese certificado no se puede reutilizar**. El workflow actual se modificó para usar un certificado persistente almacenado en **GitHub Actions Secrets**, evitando generar uno nuevo cada ejecución.

Antes de usarlo por primera vez, ejecutar en Windows el asistente `01_CONFIGURAR_FIRMA_PERMANENTE.bat` del paquete de guía entregado en el chat. El asistente usa el archivo API `AuthKey_*.p8` local, crea una sola firma de distribución y almacena únicamente estos secretos cifrados en GitHub:

- `GA_DIST_P12_B64`
- `GA_DIST_P12_PASSWORD`
- `GA_PROFILE_B64`
- `GA_APPLE_TEAM_ID`

El asistente también guarda un respaldo privado en `%USERPROFILE%\GameAtlas_FIRMA_IOS_PRIVADA\`. **Nunca subir esa carpeta al repositorio público**. No ejecutar nuevas builds antes de guardar esos cuatro secretos; en caso contrario, el workflow fallará de forma segura con un mensaje explicativo.

La instalación de secretos desde Windows aún requiere completarse. El flujo de firma reutilizable no se ha ejecutado ni validado en una compilación real. La subida inicial `1.0 (10)` sí está confirmada.

## Compilar después
1. Actualizar el código fuente en `ios-v220/www/`; confirmar que son los últimos cambios aprobados.
2. Abrir [Game Atlas V238 - iOS a TestFlight](https://github.com/BautistaL99/game-atlas-ios-build-free/actions/workflows/game-atlas-ios-testflight.yml).
3. Pulsar **Run workflow** sobre la rama `main`.
4. Completar `version`: usar `1.0` para corregir la primera versión aún no publicada, o `1.1` (etc.) para una actualización pública posterior.
5. El workflow genera un build único con Xcode, instala la firma guardada, exporta la IPA y la envía a **TestFlight**. No se adjunta la IPA como artefacto público.
6. Tras procesarse en Apple, añadir la build al grupo interno de TestFlight, probarla en iPhone, y cuando esté lista **seleccionar esa misma build en App Store Connect para enviarla a App Review**.

**Subir una IPA a TestFlight no publica la app para usuarios finales**. Las versiones públicas deben presentarse y aprobarse desde App Store Connect.

Fuentes: [Testers internos](https://developer.apple.com/help/app-store-connect/test-a-beta-version/add-internal-testers/), [Export compliance](https://developer.apple.com/help/app-store-connect/test-a-beta-version/provide-export-compliance-information-for-beta-builds/), [Nueva versión pública](https://developer.apple.com/help/app-store-connect/update-your-app/create-a-new-version/), [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions).
