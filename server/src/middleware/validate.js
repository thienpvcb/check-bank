// Simple validation helper
export const validate = (schema) => (req, res, next) => {
  const errors = [];

  for (const [field, rules] of Object.entries(schema)) {
    const value = req.body[field];

    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} là bắt buộc`);
      continue;
    }
    if (value === undefined || value === null) continue;

    if (rules.type === 'number' && typeof value !== 'number') {
      errors.push(`${field} phải là số`);
    }
    if (rules.min !== undefined && value < rules.min) {
      errors.push(`${field} tối thiểu ${rules.min}`);
    }
    if (rules.maxLength && String(value).length > rules.maxLength) {
      errors.push(`${field} tối đa ${rules.maxLength} ký tự`);
    }
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push(`${field} phải là một trong: ${rules.enum.join(', ')}`);
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors[0], errors });
  }
  next();
};
