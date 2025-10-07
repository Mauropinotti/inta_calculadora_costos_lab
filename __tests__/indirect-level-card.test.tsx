import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { IndirectLevelCard } from "@/components/IndirectLevelCard";
import type {
  IndirectLevelGroupState,
  IndirectSublevelState,
  SharedResourceSublevelState
} from "@/lib/cost-calculation";

describe("IndirectLevelCard", () => {
  const baseLevel: IndirectLevelGroupState = {
    id: "serviciosGenerales",
    name: "Nivel 2 · Costos Indirectos Unitarios",
    description: "",
    type: "indirect-group",
    sublevels: [
      {
        id: "materialesNoDescartables",
        name: "Subnivel 2.1 · Materiales no descartables",
        description: "",
        type: "shared-resource",
        items: [
          {
            id: "item-1",
            concept: "Servicio de limpieza",
            monthlyCost: 25000,
            determinations: 100,
            isCustomDeterminations: false
          }
        ]
      }
    ]
  };

  it("permite personalizar las determinaciones mensuales y marca el override", () => {
    const handleChange = vi.fn<(sublevel: IndirectSublevelState) => void>();
    const { rerender } = render(
      <IndirectLevelCard
        level={baseLevel}
        onSublevelChange={handleChange}
        globalDeterminations={100}
      />
    );

    const row = screen.getByText("Servicio de limpieza").closest("tr");
    if (!row) {
      throw new Error("Row not found");
    }

    const determinationsInput = within(row).getByDisplayValue("100");
    fireEvent.change(determinationsInput, { target: { value: "140" } });

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedSublevel = handleChange.mock.calls[0][0];
    expect(updatedSublevel.items[0].determinations).toBe(140);
    expect(updatedSublevel.items[0].isCustomDeterminations).toBe(true);

    rerender(
      <IndirectLevelCard
        level={{ ...baseLevel, sublevels: [updatedSublevel] }}
        onSublevelChange={handleChange}
        globalDeterminations={100}
      />
    );

    expect(
      screen.getByLabelText("Valor personalizado")
    ).toBeInTheDocument();
  });

  it("muestra la base global de prorrateo en el resumen del nivel", () => {
    render(
      <IndirectLevelCard
        level={baseLevel}
        onSublevelChange={vi.fn()}
        globalDeterminations={120}
      />
    );

    expect(
      screen.getByText(
        /Base global de prorrateo \(DM\): 120 determinaciones\/mes/
      )
    ).toBeInTheDocument();
  });

  it("precarga los rubros fijos de infraestructura utilizando la DM global", () => {
    const infrastructureLevel: IndirectLevelGroupState = {
      id: "serviciosGenerales",
      name: "Nivel 2 · Costos Indirectos Unitarios",
      description: "",
      type: "indirect-group",
      sublevels: [
        {
          id: "infraestructura",
          name: "Subnivel 2.4 · Costos de infraestructura",
          description: "",
          type: "shared-resource",
          items: []
        }
      ]
    };

    const handleChange = vi.fn<(sublevel: IndirectSublevelState) => void>();
    const { rerender } = render(
      <IndirectLevelCard
        level={infrastructureLevel}
        onSublevelChange={handleChange}
        globalDeterminations={80}
      />
    );

    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedSublevel = handleChange.mock.calls[0][0] as SharedResourceSublevelState;
    expect(updatedSublevel.id).toBe("infraestructura");
    expect(updatedSublevel.items).toHaveLength(7);
    expect(updatedSublevel.items.map((item) => item.id)).toEqual([
      "energia",
      "gas",
      "agua",
      "limpieza",
      "administracion",
      "comunicaciones",
      "otro"
    ]);
    expect(
      updatedSublevel.items.every((item) => item.determinations === 80)
    ).toBe(true);

    rerender(
      <IndirectLevelCard
        level={{ ...infrastructureLevel, sublevels: [updatedSublevel] }}
        onSublevelChange={handleChange}
        globalDeterminations={80}
      />
    );

    const fixedInput = screen.getByDisplayValue("Energía");
    expect(fixedInput).toBeDisabled();
    const editableInput = screen.getByDisplayValue("Otro (especificar)");
    expect(editableInput).not.toBeDisabled();
  });

  it("advierte cuando la base global de prorrateo es cero en infraestructura", () => {
    const infrastructureLevel: IndirectLevelGroupState = {
      id: "serviciosGenerales",
      name: "Nivel 2 · Costos Indirectos Unitarios",
      description: "",
      type: "indirect-group",
      sublevels: [
        {
          id: "infraestructura",
          name: "Subnivel 2.4 · Costos de infraestructura",
          description: "",
          type: "shared-resource",
          items: []
        }
      ]
    };

    render(
      <IndirectLevelCard
        level={infrastructureLevel}
        onSublevelChange={vi.fn()}
        globalDeterminations={0}
      />
    );

    expect(
      screen.getByText(
        /Definí la base global de prorrateo \(DM\) para calcular los costos unitarios de infraestructura/
      )
    ).toBeInTheDocument();
  });
});
