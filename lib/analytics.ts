export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/**
 * Registra una vista de pantalla (screen_view) personalizada para aplicaciones SPA.
 * @param screenName Nombre de la pantalla (ej. 'dashboard', 'nivel1', 'resumen')
 */
export const trackPageView = (screenName: string) => {
  if (typeof window !== "undefined" && (window as any).gtag && GA_MEASUREMENT_ID) {
    (window as any).gtag("event", "screen_view", {
      screen_name: screenName,
      page_title: `Calculadora - ${screenName}`,
    });
  }
};

/**
 * Registra un evento personalizado en Google Analytics.
 * @param action Nombre de la acción/evento (ej. 'download_pdf')
 * @param category Categoría del evento (ej. 'Report')
 * @param label Etiqueta descriptiva opcional (ej. 'PDF Report: Nombre del servicio')
 * @param value Valor numérico opcional asociado al evento
 */
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (typeof window !== "undefined" && (window as any).gtag && GA_MEASUREMENT_ID) {
    (window as any).gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};
