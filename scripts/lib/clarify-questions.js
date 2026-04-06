/**
 * Shared helper: generate clarification questions via the IDE AI.
 *
 * The AI reads the provided context documents and returns 4-6 questions
 * specific to the project — no static questions, fully contextual.
 */

const { runLocalIdeAiJson } = require('./local-ide-ai-client');

const DOMAIN_PROMPTS = {
  brief: [
    'Analiza los documentos de referencia del proyecto.',
    'Genera entre 4 y 6 preguntas de clarificacion que un PM necesita responder para escribir un brief preciso.',
    'Incluye SIEMPRE al menos una pregunta sobre experiencia de usuario / interfaz entre las 4-6: por ejemplo theming (tema fijo, claro/oscuro, skins multiples),',
    'dispositivos y layout (solo escritorio, responsive, movil-first), estilo visual (minimal, sistema tipo Material, marca corporativa, neutral),',
    'densidad o complejidad de UI (flujo simple vs power-user), y accesibilidad (nivel deseado: teclado, contraste, WCAG).',
    'Completa el resto con: objetivo de negocio, audiencia, alcance, restricciones tecnicas y criterios de exito.',
    'Evita duplicar exactamente las mismas dimensiones si ya estan cubiertas en los refdocs; adapta el redactado al contexto.',
  ].join(' '),

  spec_kit: [
    'Analiza el brief del proyecto.',
    'Genera entre 4 y 6 preguntas de clarificacion necesarias para crear un Spec Kit completo (PRD, technical-spec, api-spec, data-model, epics, stories).',
    'Enfocate en: decisiones de arquitectura, integraciones externas, reglas de negocio ambiguas y dependencias criticas.',
    'Incluye cuando aplique preguntas sobre implementacion de UI/UX: libreria o sistema de componentes, design tokens, internacionalizacion (i18n),',
    'y como reflejar en historias y PRD las decisiones de experiencia ya definidas o pendientes.',
  ].join(' '),

  sprints: [
    'Analiza el Spec Kit del proyecto (epics, stories, PRD, technical-spec, sprint-plan).',
    'Genera entre 4 y 6 preguntas de clarificacion necesarias para planificar los sprints de forma realista.',
    'CRÍTICO: Incluye al menos 1-2 preguntas sobre contexto arquitectónico:',
    '- Para RFs frontend-heavy (RF-05 dashboard, RF-08 track detail, RF-07 catalog), ¿en qué ruta del PRD §6.4 se implementan?',
    '- ¿Qué componentes/páginas específicos requiere cada RF? (ej: TrackDetailPage vs DashboardPage)',
    '- ¿Hay confusión entre features similares que van en rutas diferentes? (ej: dashboard summary vs track detail graph)',
    'Enfócate además en: priorización de features, dependencias entre historias, velocidad esperada del equipo y criterios de done por sprint.',
  ].join(' '),

  sprint: [
    'Analiza el plan del sprint indicado (goal, stories, tasks, qa-plan).',
    'Genera entre 3 y 5 preguntas de clarificacion que el equipo debe resolver antes de comenzar el sprint.',
    'Enfocate en: dependencias tecnicas no resueltas, asignacion de roles, entorno de desarrollo y criterios de aceptacion ambiguos.',
  ].join(' '),
};

/**
 * Generate questions for a given domain using the IDE AI.
 *
 * @param {string} root       - Project root path
 * @param {Array}  contextDocs - [{ path, content }] documents to analyze
 * @param {string} domain     - "brief" | "spec_kit" | "sprints" | "sprint"
 * @returns {{ questions: Array<{ id, prompt, options }> }}
 */
function generateClarificationQuestions(root, contextDocs, domain) {
  const instruction = DOMAIN_PROMPTS[domain] || DOMAIN_PROMPTS.brief;

  const result = runLocalIdeAiJson({
    root,
    taskName: `clarify-${domain}-questions`,
    payload: {
      instruction: [
        instruction,
        "Devuelve JSON con la clave 'questions' como array de objetos.",
        'Cada objeto debe tener: id (snake_case), prompt (pregunta clara), options (array de 3-4 strings con opciones concretas).',
        "Si una pregunta admite respuesta libre, incluye la opcion '0. Respuesta libre'.",
      ].join(' '),
      context: contextDocs,
      output_schema: {
        questions: [
          {
            id: 'string (snake_case, unique)',
            prompt: 'string (pregunta)',
            options: ['string (opcion 1)', 'string (opcion 2)', 'string (...)'],
          },
        ],
      },
    },
  });

  if (
    !result ||
    !Array.isArray(result.questions) ||
    result.questions.length === 0
  ) {
    throw new Error(
      'El AI no devolvio preguntas validas. Verifica que LOCAL_IDE_AI_COMMAND esta configurado correctamente.',
    );
  }

  return result.questions;
}

module.exports = { generateClarificationQuestions };
