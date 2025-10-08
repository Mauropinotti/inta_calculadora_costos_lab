Feature: Gestionar costos directos unitarios por subnivel

  Scenario: Registrar un insumo directo en distintas monedas
    Given que la persona utiliza la tabla de "Insumos directos" para detallar cantidades y costos por muestra
    When agrega un insumo nuevo indicando su unidad, cantidad, costo unitario y moneda (ARS o USD)
    Then el sistema calcula automáticamente el costo por muestra en pesos utilizando el tipo de cambio configurado

  Scenario: Sincronizar valores hora del personal con ajustes manuales
    Given que los perfiles laborales del subnivel "Mano de obra directa" se vinculan con la tabla de valores hora almacenada en la aplicación
    When la persona selecciona un perfil vigente o edita manualmente la tarifa hora y marca la modificación como manual
    Then las horas y costos se recalculan, se indica la procedencia manual y es posible volver al valor de la tabla oficial en cualquier momento

  Scenario: Distribuir depreciación y calibración de equipamiento específico
    Given que el subnivel de equipamiento permite cargar vida útil, precios y costos de calibración por determinación
    When la persona completa los campos requeridos y agrega un equipo al listado
    Then la tarjeta calcula automáticamente la depreciación y la calibración unitarias, mostrando el método y la referencia documental configurable
