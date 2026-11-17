# Game Atlas V238 — Prueba de compilación gratuita iOS

Repositorio **PÚBLICO** dedicado a una sola función: generar y comprobar el cliente iOS de Game Atlas mediante GitHub Actions en macOS estándar.

## Antes de publicarlo

Al crear este repositorio como público, **todo el contenido que subas será visible y copiable por terceros**. El paquete contiene el código fuente del cliente iOS, no el backend de noticias, ni certificados privados, ni claves Apple. Los recursos de mapa tienen su archivo de atribución dentro de `ios-v220/www/assets/`.

## Primera prueba (sin certificados)

1. Abrir la pestaña **Actions** de este repositorio.
2. Elegir **Game Atlas V238 - Prueba iOS gratuita**.
3. Pulsar **Run workflow** → **Run workflow**.
4. Entrar al trabajo `comprobar-ios`. Si está verde, compiló para **simulador**, aún **no es una IPA**.

El workflow `workflow_dispatch` no corre en cada commit y no utiliza ningún secreto Apple.

## Publicar después de superar la primera prueba

La futura generación de una **IPA firmada** requerirá configurar la firma Apple de forma segura, subir a **TestFlight**, instalar la aplicación en un iPhone y tomar capturas reales. Los certificados y claves **nunca deben añadirse al repositorio** ni adjuntarse a los mensajes.

Información oficial: https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax

## Fuentes

Las fuentes de `ios-v220/` proceden del archivo `Game_Atlas_V220_IOS_V238_SOLO_IOS.zip` suministrado. No se modificó el cliente; el único contenido añadido es este README, la configuración del workflow y el lanzador para Windows. Ninguna prueba de Xcode se ha ejecutado aún como parte de este paquete.
