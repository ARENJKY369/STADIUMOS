import { useState, useCallback } from 'react';

/**
 * useForm Hook - Form state management with validation
 * Supports touches, errors, async validation
 */
export function useForm(initialValues = {}, validationSchema = null) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = useCallback((name, value) => {
    if (!validationSchema) return null;
    const fieldSchema = validationSchema[name];
    if (!fieldSchema) return null;

    if (fieldSchema.required && !value) return `${name} is required`;
    if (fieldSchema.minLength && value.length < fieldSchema.minLength) return `${name} must be at least ${fieldSchema.minLength} characters`;
    if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) return `${name} must be at most ${fieldSchema.maxLength} characters`;
    if (fieldSchema.pattern && !fieldSchema.pattern.test(value)) return fieldSchema.message || `${name} is invalid`;
    if (fieldSchema.validate) {
      const customError = fieldSchema.validate(value, values);
      if (customError) return customError;
    }
    return null;
  }, [validationSchema, values]);

  const handleChange = useCallback((event) => {
    const { name, value, type, checked } = event.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    setValues(prev => ({ ...prev, [name]: fieldValue }));
    if (touched[name]) {
      const error = validateField(name, fieldValue);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [touched, validateField]);

  const handleBlur = useCallback((event) => {
    const { name, value } = event.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  }, [validateField]);

  const setFieldValue = useCallback((field, value) => {
    setValues(prev => ({ ...prev, [field]: value }));
  }, []);

  const setFieldError = useCallback((field, error) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  const handleSubmit = useCallback((callback) => async (event) => {
    if (event) event.preventDefault();
    setIsSubmitting(true);
    const newErrors = {};
    let hasError = false;

    // Validate all fields
    Object.keys(validationSchema || values).forEach(fieldName => {
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        hasError = true;
      }
    });

    setErrors(newErrors);
    setTouched(Object.keys(values).reduce((acc, key) => ({ ...acc, [key]: true }), {}));

    if (!hasError) {
      try {
        await callback(values);
      } catch (err) {
        console.error('Form submit error', err);
      }
    }
    setIsSubmitting(false);
  }, [values, validationSchema, validateField]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const isValid = Object.values(errors).every(err => !err);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFieldValue,
    setFieldError,
    setValues,
  };
}
