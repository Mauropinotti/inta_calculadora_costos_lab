Feature: Orientación inicial y exportación global

  Scenario: Exportar supuestos de cálculo en JSON
    Given que la persona usuaria accede a la portada con el panel introductorio y sus atajos de navegación
    When activa el botón "Exportar como JSON" desde el encabezado
    Then la aplicación genera y descarga un archivo JSON con los niveles configurados, los totales y la fecha de generación de la cotización
