const sanitizeHtml = require('sanitize-html');

function sanitize(obj) {
  if (typeof obj === 'string') {
    return sanitizeHtml(obj, { allowedTags: [], allowedAttributes: {} }).trim();
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitize);
  }
  if (obj && typeof obj === 'object') {
    const clean = {};
    for (const [key, val] of Object.entries(obj)) {
      clean[key] = sanitize(val);
    }
    return clean;
  }
  return obj;
}

function validateBody(schema) {
  return (req, res, next) => {
    req.body = sanitize(req.body);
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field];

      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} es requerido`);
        continue;
      }

      if (value === undefined || value === null || value === '') continue;

      if (rules.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors.push(`${field} debe ser un email válido`);
      }

      if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
        errors.push(`${field} no puede tener más de ${rules.maxLength} caracteres`);
      }

      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`${field} debe ser uno de: ${rules.enum.join(', ')}`);
      }

      if (rules.type === 'array' && !Array.isArray(value)) {
        errors.push(`${field} debe ser un array`);
      }

      if (rules.type === 'array' && Array.isArray(value) && rules.enumItems) {
        const invalid = value.filter(v => !rules.enumItems.includes(v));
        if (invalid.length) {
          errors.push(`${field} contiene valores inválidos: ${invalid.join(', ')}`);
        }
      }
    }

    if (errors.length) {
      return res.status(400).json({ error: 'Validación fallida', details: errors });
    }
    next();
  };
}

module.exports = { validateBody, sanitize };
