/* Integración opcional con Google Maps Platform.
   Al añadir tu clave de Google Cloud restringida a tu dominio,
   se mostrarán reseñas actuales en lugar de la muestra inicial.
   Activa "Maps JavaScript API" y "Places API (New)" en Google Cloud.
   Las claves web se ven en el navegador: restringe el HTTP referrer y APIs. */
window.MAKI_GOOGLE_CONFIG = {
  apiKey: 'AIzaSyD-ekXQ9s4M3CfEOuBK70bdpG7bt8tnTkI', // Pega aquí una clave web restringida de Google Maps Platform
  placeId: 'ChIJnZGEmlV9P44RuatYlHqCpno'
};
