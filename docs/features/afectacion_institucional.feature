Feature: Distribuir porcentajes institucionales sobre los costos acumulados

  Scenario: Ajustar la base y los porcentajes secuenciales del Nivel 4
    Given que el nivel de afectación institucional calcula porcentajes secuenciales sobre los niveles previos seleccionados
    When la persona modifica la base incluida y actualiza los porcentajes de cada paso sobre el total o el remanente
    Then cada paso refleja su subtotal, se recalcula el total del nivel y la base elegida queda persistida en el estado de la página
