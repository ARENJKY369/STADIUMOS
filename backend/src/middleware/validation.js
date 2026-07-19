const { body, param, query, validationResult } = require('express-validator');
const Joi = require('joi');

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

// Express-validator chains
const validateRegister = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password min 8 chars').matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must contain uppercase, lowercase, number and special char'),
  body('firstName').trim().notEmpty().withMessage('First name required').isLength({ max: 100 }),
  body('lastName').trim().notEmpty().withMessage('Last name required').isLength({ max: 100 }),
  body('role').optional().isIn(['admin','manager','staff','security','medical','viewer','fan']),
  handleValidationErrors,
];

const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
  handleValidationErrors,
];

const validateEvent = [
  body('name').trim().notEmpty().withMessage('Event name required'),
  body('stadiumId').isUUID().withMessage('Valid stadium ID required'),
  body('startTime').isISO8601().withMessage('Valid start time required'),
  body('expectedAttendance').optional().isInt({ min: 0 }),
  handleValidationErrors,
];

const validateIncident = [
  body('title').trim().notEmpty().withMessage('Title required').isLength({ max: 255 }),
  body('description').trim().notEmpty().withMessage('Description required'),
  body('type').isIn(['medical','security','crowd','technical','safety','weather','other']).withMessage('Valid type required'),
  body('severity').isIn(['low','medium','high','critical']).withMessage('Valid severity required'),
  body('stadiumId').isUUID().withMessage('Valid stadium ID required'),
  handleValidationErrors,
];

const validateZone = [
  body('name').trim().notEmpty().withMessage('Zone name required'),
  body('stadiumId').isUUID().withMessage('Stadium ID required'),
  body('code').trim().notEmpty().withMessage('Zone code required'),
  body('type').isIn(['entrance','exit','seating','concourse','concession','restroom','vip','media','field','parking','medical','security']),
  body('capacity').isInt({ min: 0 }).withMessage('Capacity must be >=0'),
  handleValidationErrors,
];

// Joi schemas for complex validations
const schemas = {
  crowdMetric: Joi.object({
    zoneId: Joi.string().uuid().required(),
    stadiumId: Joi.string().uuid().required(),
    eventId: Joi.string().uuid().optional(),
    density: Joi.number().min(0).max(100).required(),
    flowRate: Joi.number().min(0).optional(),
    occupancyCount: Joi.number().integer().min(0).required(),
    temperature: Joi.number().optional(),
    noiseLevel: Joi.number().optional(),
  }),
  notification: Joi.object({
    title: Joi.string().max(255).required(),
    message: Joi.string().required(),
    type: Joi.string().valid('info','warning','critical','emergency','update').required(),
    recipientId: Joi.string().uuid().optional(),
    isBroadcast: Joi.boolean().optional(),
    broadcastZones: Joi.array().items(Joi.string().uuid()).optional(),
  }),
  sustainability: Joi.object({
    category: Joi.string().valid('transport','waste','energy','water','food').required(),
    metricName: Joi.string().required(),
    value: Joi.number().required(),
    unit: Joi.string().required(),
    transportMode: Joi.string().optional(),
    distanceKm: Joi.number().optional(),
  }),
};

function validateJoi(schemaName) {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) return next();
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors: error.details.map(d => ({ field: d.path.join('.'), message: d.message })),
      });
    }
    next();
  };
}

module.exports = {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateEvent,
  validateIncident,
  validateZone,
  validateJoi,
  schemas,
};
