import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

/**
 *middleware for signup
 * Matches frontend SignupForm fields: month, day, year, username, password, gender
 */
export const validateSignup = [
  // Birthday validation
  body('month')
    .notEmpty()
    .withMessage('Please select your birth month')
    .isIn([
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ])
    .withMessage('Invalid month selected'),

  body('day')
    .notEmpty()
    .withMessage('Please select your birth day')
    .isInt({ min: 1, max: 31 })
    .withMessage('Invalid day selected'),

  body('year')
    .notEmpty()
    .withMessage('Please select your birth year')
    .isInt({ min: 1900, max: new Date().getFullYear() })
    .withMessage('Invalid year selected'),

  // Username validation
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Please enter a username')
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be 3-20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores')
    .custom((value) => {
      const lower = value.toLowerCase();
      // Reserved/blocked usernames
      const blocked = ['admin', 'administrator', 'moderator', 'staff', 'support', 'adventureblox', 'roblox'];
      if (blocked.includes(lower)) {
        throw new Error('This username is not available');
      }
      // Spam/attack prefix blocklist
      const spamPrefixes = ['benisgay', 'daw', 'fucku', 'fuckу', 'spam', 'bot_', 'script'];
      if (spamPrefixes.some(prefix => lower.startsWith(prefix))) {
        throw new Error('Username not allowed');
      }
      return true;
    }),

  // Password validation
  body('password')
    .notEmpty()
    .withMessage('Please enter a password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password needs uppercase, lowercase, and a number'),

  // Gender validation (optional)
  body('gender')
    .optional()
    .isIn(['male', 'female'])
    .withMessage('Invalid gender selection'),

  // Smart validation handler - progressive error display
  (req: Request, res: Response, next: NextFunction): void | Response => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const { username, password, month, day, year } = req.body;
      
      // Check if form is completely empty
      const isFormEmpty = !username && !password && !month && !day && !year;
      
      if (isFormEmpty) {
        return res.status(400).json({
          success: false,
          message: 'Please enter your details to sign up',
          errors: [],
        });
      }
      
      // Progressive validation - show errors in order of importance
      const errorArray = errors.array();
      const errorsByField = new Map<string, string>();
      
      errorArray.forEach((error: any) => {
        if (!errorsByField.has(error.path)) {
          errorsByField.set(error.path, error.msg);
        }
      });
      
      // Priority order: birthday -> username -> password
      const priorityOrder = ['month', 'day', 'year', 'username', 'password'];
      const orderedErrors: string[] = [];
      
      for (const field of priorityOrder) {
        if (errorsByField.has(field)) {
          orderedErrors.push(errorsByField.get(field)!);
          // Only show first error in the priority chain
          break;
        }
      }
      
      // If no priority errors, show all remaining errors
      if (orderedErrors.length === 0) {
        errorsByField.forEach((msg) => orderedErrors.push(msg));
      }
      
      return res.status(400).json({
        success: false,
        message: orderedErrors[0],
        errors: [],
      });
    }
    next();
  },
];

/**
 * Validation middleware for login
 * Matches frontend LoginPage fields: username, password
 */
export const validateLogin = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Please enter your username'),

  body('password')
    .notEmpty()
    .withMessage('Please enter your password'),

  // Smart validation handler
  (req: Request, res: Response, next: NextFunction): void | Response => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const { username, password } = req.body;
      
      // Check if form is completely empty
      const isFormEmpty = !username && !password;
      
      if (isFormEmpty) {
        return res.status(400).json({
          success: false,
          message: 'Please enter your credentials',
          errors: [],
        });
      }
      
      // Get only the first error for each field
      const errorMap = new Map<string, string>();
      errors.array().forEach((error: any) => {
        if (!errorMap.has(error.path)) {
          errorMap.set(error.path, error.msg);
        }
      });
      
      return res.status(400).json({
        success: false,
        message: 'Please fix the errors below',
        errors: Array.from(errorMap.values()).map(msg => ({ msg })),
      });
    }
    next();
  },
];

/**
 * Validation middleware for email verification
 */
export const validateEmail = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),

  (req: Request, res: Response, next: NextFunction): void | Response => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }
    next();
  },
];

/**
 * Validation middleware for password reset
 */
export const validatePasswordReset = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),

  (req: Request, res: Response, next: NextFunction): void | Response => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }
    next();
  },
];
