import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Calculadora de Costos INTA",
  description:
    "Herramienta para estimar los costos de servicios de laboratorio de INTA en cinco niveles de aportación."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-inta-gray-100 text-inta-gray-800">
        {children}
        <footer className="border-t border-inta-gray-200 bg-white px-4 py-6 text-center text-xs leading-relaxed text-inta-gray-600">
          <p className="mx-auto max-w-4xl">
            Herramienta desarrollada por Mauro H. Pinotti (Gerencia de Gestión
            Estratégica de la Investigación y Desarrollo), en base al trabajo de
            Mercedes Goizueta y Andrés Castellanos (INTA EEA Marcos Juárez),
            autores de la <em>Guía metodológica para el costeo de servicios
            rutinarios en laboratorios de INTA</em>, publicada en{" "}
            <a
              href="https://www.argentina.gob.ar/inta/cr-cordoba/guia-metodologica-para-el-costeo-de-servicios-rutinarios-en-laboratorios-de-inta"
              target="_blank"
              rel="noopener noreferrer"
              className="text-inta-blue underline underline-offset-2 hover:text-inta-blue-dark"
            >
              Argentina.gob.ar
            </a>
            .
          </p>
        </footer>
      </body>
    </html>
  );
}
