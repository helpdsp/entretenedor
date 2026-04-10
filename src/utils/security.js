/**
 * @generated_by_model gemini-3-flash
 * @generated_at 2026-04-09T23:30:00Z
 * @agent_roles engineering-backend-architect
 * @vision_command start_sprint --sprint 1
 * @task_id T-005
 */

/**
 * Masks a credit card number, leaving only the last 4 digits visible.
 * @param {string} cardNumber - The full card number
 * @returns {string} The masked card number
 */
export const maskCardNumber = (cardNumber) => {
  if (!cardNumber) return '';
  const cleanNumber = cardNumber.replace(/\D/g, '');
  if (cleanNumber.length < 4) return '****';
  
  const lastFour = cleanNumber.slice(-4);
  const maskedSection = '*'.repeat(Math.max(0, cleanNumber.length - 4))
    .replace(/(.{4})/g, '$1 ')
    .trim();
    
  return `${maskedSection.length > 0 ? maskedSection.slice(0, -4) + '****' : '****'} ${lastFour}`;
};

/**
 * Simpler version: returns fixed length mask + last 4
 */
export const simpleMask = (cardNumber) => {
  if (!cardNumber) return '';
  const clean = cardNumber.replace(/\D/g, '');
  const lastFour = clean.slice(-4);
  return `**** **** **** ${lastFour}`;
};
