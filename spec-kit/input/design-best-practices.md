# Mejores Prácticas para Diseño de Formularios

Para el framework **VISION**, se recomiendan las siguientes pautas de diseño que mejoran la velocidad de captura y reducen el error humano:

## 1. Jerarquía Visual y Acciones
*   **Posicionamiento de Botones (Regla de la Terminación)**: La acción primaria (Confirmar, Siguiente, Enviar) siempre debe situarse a la derecha. La acción secundaria (Cancelar, Atrás) a la izquierda.
*   **Estilo Diferenciado**: El botón primario debe tener un color sólido y llamativo (ej. el degradado azul actual), mientras que el secundario debe ser más sutil (outline o fondo neutro) para evitar clics accidentales.

## 2. Estructura y Layout
*   **Una Sola Columna**: Los formularios de una sola columna se completan más rápido y con menos errores que los de varias columnas, ya que el camino visual es directo hacia abajo.
*   **Agrupación Lógica**: Utilizar espacios en blanco o divisores sutiles para agrupar campos relacionados (ej. "Datos Generales" vs "Datos de Pago").
*   **Etiquetas sobre el Campo**: Colocar los `label` encima del input (como lo tenemos ahora) es mejor que a los lados o dentro (placeholder), ya que el usuario no pierde el contexto al empezar a escribir.

## 3. Retroalimentación Inmediata
*   **Validación en Tiempo Real**: Mostrar errores de formato (ej. email inválido) en cuanto el usuario sale del campo (*onBlur*), no solo al intentar enviar el formulario.
*   **Micro-confirmaciones**: El uso de iconos (como el `CheckCircle` que añadimos) refuerza la sensación de éxito en la operación.

## 4. Eficiencia de Entrada
*   **Auto-enfoque**: Enfocar automáticamente el primer campo del formulario al cargar la página.
*   **Máscaras de Entrada**: Ayudar al usuario con el formato del número de tarjeta o teléfono mientras escribe, añadiendo espacios o guiones automáticamente.

---
> [!TIP]
> **Accesibilidad**: Asegurar que todos los campos sean navegables mediante la tecla `TAB` y que tengan estados de `hover` y `focus` claramente visibles.
