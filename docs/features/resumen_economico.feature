Feature: Resumen económico y exportaciones finales

  Scenario: Visualizar y exportar el resumen del servicio
    Given que el panel de resumen muestra los datos del servicio, el tipo de cambio aplicado y la procedencia de los valores hora
    When la persona revisa los subtotales por nivel y la conversión estimada a USD
    Then puede descargar el resumen en formato JSON o CSV incluyendo totales, desglose y metadatos de contexto
