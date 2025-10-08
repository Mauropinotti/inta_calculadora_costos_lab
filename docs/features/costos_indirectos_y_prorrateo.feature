Feature: Gestionar costos indirectos y prorrateo por determinaciones mensuales

  Scenario: Ajustar las determinaciones mensuales para prorratear costos
    Given que el Nivel 2 solicita la cantidad de determinaciones mensuales del laboratorio (DM)
    When la persona actualiza ese valor con un entero mayor a cero
    Then los subniveles compartidos y de equipamiento menor actualizan sus determinaciones y costos unitarios utilizando ese DM

  Scenario: Documentar la infraestructura base sugerida
    Given que la calculadora inicializa el subnivel de infraestructura con conceptos predeterminados de servicios generales
    When se generan los ítems de infraestructura según las determinaciones globales por defecto
    Then cada concepto queda disponible para registrar su costo mensual y prorratearlo automáticamente
