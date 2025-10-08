Feature: Gestor de valores hora con persistencia local

  Scenario: Administrar perfiles, duplicar registros y exportar respaldos
    Given que la tabla permite agregar, editar, duplicar o eliminar perfiles con sus tarifas y vigencias, guardados en el almacenamiento local del navegador
    When la persona crea o actualiza filas y decide exportar la información
    Then puede obtener archivos JSON o CSV con la tabla y la fecha de sincronización registrada

  Scenario: Previsualizar e importar una tabla de valores hora
    Given que el panel acepta arrastrar o seleccionar un archivo JSON o CSV previamente exportado
    When el contenido se analiza y se presenta la previsualización con totales y perfiles detectados
    Then la persona puede cancelar o confirmar la importación, actualizando la tabla local con metadatos de sincronización de tipo "import"
