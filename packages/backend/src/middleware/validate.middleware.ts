import { Request, Response, NextFunction } from 'express';

type ValidationRule = {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'email' | 'phone' | 'array';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  oneOf?: string[];
};

function isValidEmail(v: string): boolean {
  // Basic format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return false;
  const domain = v.split('@')[1];
  if (!domain) return false;
  const parts = domain.split('.');
  // TLD must be at least 2 letters (only letters)
  const tld = parts[parts.length - 1];
  if (!/^[a-zA-Z]{2,}$/.test(tld)) return false;
  // Domain name (before TLD) must contain at least one letter
  const domainName = parts.slice(0, -1).join('.');
  if (!/[a-zA-Z]/.test(domainName)) return false;
  return true;
}

function isValidPhone(v: string): boolean {
  return /^\+?[\d\s\-()]{6,20}$/.test(v);
}

export function validate(rules: ValidationRule[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: { field: string; message: string }[] = [];

    for (const rule of rules) {
      const value = req.body[rule.field];

      // Required check
      if (rule.required) {
        if (value === undefined || value === null || (typeof value === 'string' && !value.trim())) {
          errors.push({ field: rule.field, message: `${rule.field} is required` });
          continue;
        }
      }

      // Skip further checks if value is empty and not required
      if (value === undefined || value === null || value === '') continue;

      // Type checks
      if (rule.type === 'string' && typeof value !== 'string') {
        errors.push({ field: rule.field, message: `${rule.field} must be a string` });
        continue;
      }

      if (rule.type === 'number') {
        const num = Number(value);
        if (isNaN(num)) {
          errors.push({ field: rule.field, message: `${rule.field} must be a number` });
          continue;
        }
        if (rule.min !== undefined && num < rule.min) {
          errors.push({ field: rule.field, message: `${rule.field} must be at least ${rule.min}` });
        }
        if (rule.max !== undefined && num > rule.max) {
          errors.push({ field: rule.field, message: `${rule.field} must be at most ${rule.max}` });
        }
      }

      if (rule.type === 'email' && !isValidEmail(String(value))) {
        errors.push({ field: rule.field, message: `${rule.field} must be a valid email` });
      }

      if (rule.type === 'phone' && !isValidPhone(String(value))) {
        errors.push({ field: rule.field, message: `${rule.field} must be a valid phone number` });
      }

      if (rule.type === 'array' && !Array.isArray(value)) {
        errors.push({ field: rule.field, message: `${rule.field} must be an array` });
      }

      // String length checks
      if (typeof value === 'string') {
        if (rule.minLength !== undefined && value.trim().length < rule.minLength) {
          errors.push({ field: rule.field, message: `${rule.field} must be at least ${rule.minLength} characters` });
        }
        if (rule.maxLength !== undefined && value.trim().length > rule.maxLength) {
          errors.push({ field: rule.field, message: `${rule.field} must be at most ${rule.maxLength} characters` });
        }
      }

      // OneOf check
      if (rule.oneOf && !rule.oneOf.includes(String(value))) {
        errors.push({ field: rule.field, message: `${rule.field} must be one of: ${rule.oneOf.join(', ')}` });
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'validationError', details: errors });
    }

    next();
  };
}
