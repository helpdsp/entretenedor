/**
 * Preguntas UX fijas concatenadas despues de las generadas por IA en clarify_brief.
 * Fuente: config/ux-clarification.json (si existe y es valida); si no, valores por defecto embebidos.
 */

const fs = require("fs");
const path = require("path");

const DEFAULT_UX_QUESTIONS = [
  {
    id: "ux_theming",
    prompt: "Theming / apariencia: como debe manejarse el aspecto visual (skins, claro/oscuro)?",
    options: [
      "Un solo tema visual fijo (sin cambio por usuario)",
      "Claro y oscuro conmutables (sin mas skins)",
      "Multiples skins o temas elegibles por el usuario",
      "Definir mas adelante / minimo viable sin preferencias"
    ]
  },
  {
    id: "ux_responsive",
    prompt: "Dispositivos y layout: que alcance de pantalla priorizamos?",
    options: [
      "Solo escritorio (ancho fijo o minimo)",
      "Responsive (escritorio y tablet)",
      "Mobile-first (movil como referencia principal)",
      "Escritorio y movil con experiencias diferenciadas"
    ]
  },
  {
    id: "ux_visual_style",
    prompt: "Estilo visual de referencia para la UI?",
    options: [
      "Minimal / neutro (pocas decoraciones)",
      "Alineado a un sistema conocido (Material, Fluent, etc.)",
      "Marca corporativa estricta (guia ya definida o pendiente)",
      "Sin preferencia aun; decidir en diseno"
    ]
  },
  {
    id: "ux_density",
    prompt: "Densidad y complejidad de la interfaz?",
    options: [
      "Flujo simple: pocas opciones visibles, asistentes",
      "Equilibrado: formularios y listas estandar",
      "Power-user: tablas densas, atajos, mucha informacion en pantalla"
    ]
  },
  {
    id: "ux_accessibility",
    prompt: "Objetivo de accesibilidad para la primera version?",
    options: [
      "Basico: legibilidad y contraste razonable",
      "WCAG 2.1 AA donde aplique (teclado, foco, etiquetas)",
      "Maxima prioridad a11y desde el inicio",
      "Explicitamente fuera de alcance en v1"
    ]
  }
];

function isValidQuestionEntry(q) {
  return (
    q &&
    typeof q.id === "string" &&
    q.id.trim().length > 0 &&
    typeof q.prompt === "string" &&
    Array.isArray(q.options) &&
    q.options.length >= 2 &&
    q.options.every((o) => typeof o === "string" && o.trim().length > 0)
  );
}

/**
 * @param {string} root - project root
 * @returns {Array<{ id: string, prompt: string, options: string[] }>}
 */
function loadFixedUxQuestions(root) {
  const configPath = path.join(root, "config", "ux-clarification.json");
  if (!fs.existsSync(configPath)) {
    return DEFAULT_UX_QUESTIONS.slice();
  }
  try {
    const raw = JSON.parse(fs.readFileSync(configPath, "utf8"));
    if (!Array.isArray(raw) || raw.length === 0) {
      return DEFAULT_UX_QUESTIONS.slice();
    }
    const valid = raw.filter(isValidQuestionEntry);
    return valid.length > 0 ? valid : DEFAULT_UX_QUESTIONS.slice();
  } catch (_err) {
    return DEFAULT_UX_QUESTIONS.slice();
  }
}

/**
 * Anexa preguntas UX fijas que no choquen por id con las ya generadas.
 *
 * @param {Array<{ id: string, prompt: string, options: string[] }>} aiQuestions
 * @param {string} root
 * @returns {Array<{ id: string, prompt: string, options: string[] }>}
 */
function mergeFixedUxQuestions(aiQuestions, root) {
  const existing = new Set((aiQuestions || []).map((q) => q.id));
  const fixed = loadFixedUxQuestions(root);
  const merged = (aiQuestions || []).slice();
  fixed.forEach((q) => {
    if (!existing.has(q.id)) {
      merged.push(q);
      existing.add(q.id);
    }
  });
  return merged;
}

module.exports = {
  loadFixedUxQuestions,
  mergeFixedUxQuestions,
  DEFAULT_UX_QUESTIONS
};
