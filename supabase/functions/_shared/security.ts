/**
 * Environment Variable Validation Utility
 * For Supabase Edge Functions
 */

export interface EnvValidationResult {
  isValid: boolean
  missing: string[]
  warnings: string[]
  errors: string[]
}

/**
 * Validate required environment variables
 * @param requiredVars - Array of required environment variable names
 * @param optionalVars - Array of optional environment variable names
 * @returns Validation result
 */
export function validateEnvironmentVariables(
  requiredVars: string[],
  optionalVars: string[] = []
): EnvValidationResult {
  const missing: string[] = []
  const warnings: string[] = []
  const errors: string[] = []

  // Check required variables
  for (const varName of requiredVars) {
    const value = Deno.env.get(varName)
    if (!value || value.trim() === '') {
      missing.push(varName)
      errors.push(`Missing required environment variable: ${varName}`)
    } else {
      // Security checks for sensitive data
      if (varName.includes('KEY') || varName.includes('SECRET') || varName.includes('PASSWORD')) {
        if (value.length < 10) {
          warnings.push(`Environment variable ${varName} appears to be too short`)
        }
        if (value.includes('test') || value.includes('demo') || value.includes('example')) {
          warnings.push(`Environment variable ${varName} appears to contain test/demo value`)
        }
      }
    }
  }

  // Check optional variables (warnings only)
  for (const varName of optionalVars) {
    const value = Deno.env.get(varName)
    if (!value || value.trim() === '') {
      warnings.push(`Optional environment variable ${varName} is not set`)
    }
  }

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
    errors
  }
}

/**
 * Create standardized error response
 * @param message - Error message
 * @param status - HTTP status code
 * @param details - Additional error details (optional)
 * @returns Response object
 */
export function createErrorResponse(
  message: string,
  status: number = 500,
  details?: unknown
): Response {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block'
  })

  const errorResponse = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    ...(details && { details })
  }

  // Log error for monitoring (but not in production responses)
  console.error(`Error ${status}: ${message}`, details || '')

  return new Response(JSON.stringify(errorResponse), {
    status,
    headers
  })
}

/**
 * Create standardized success response
 * @param data - Response data
 * @param status - HTTP status code (default 200)
 * @returns Response object
 */
export function createSuccessResponse(
  data: unknown,
  status: number = 200
): Response {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block'
  })

  const successResponse = {
    success: true,
    data,
    timestamp: new Date().toISOString()
  }

  return new Response(JSON.stringify(successResponse), {
    status,
    headers
  })
}

/**
 * Validate and sanitize input data
 * @param input - Input data to validate
 * @param rules - Validation rules
 * @returns Validation result
 */
export function validateInput(
  input: Record<string, unknown>,
  rules: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object'
    required?: boolean
    minLength?: number
    maxLength?: number
    min?: number
    max?: number
    pattern?: RegExp
    enum?: unknown[]
  }>
): { isValid: boolean; errors: string[]; sanitized: Record<string, unknown> } {
  const errors: string[] = []
  const sanitized: Record<string, unknown> = {}

  for (const [field, rule] of Object.entries(rules)) {
    const value = input[field]

    // Check required fields
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`)
      continue
    }

    // Skip validation for optional empty fields
    if (!rule.required && (value === undefined || value === null || value === '')) {
      sanitized[field] = value
      continue
    }

    // Type validation and sanitization
    switch (rule.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`${field} must be a string`)
          continue
        }
        
        let stringValue = value.trim()
        
        // Length validation
        if (rule.minLength && stringValue.length < rule.minLength) {
          errors.push(`${field} must be at least ${rule.minLength} characters`)
          continue
        }
        if (rule.maxLength && stringValue.length > rule.maxLength) {
          stringValue = stringValue.substring(0, rule.maxLength).trim()
        }
        
        // Pattern validation
        if (rule.pattern && !rule.pattern.test(stringValue)) {
          errors.push(`${field} format is invalid`)
          continue
        }
        
        // Enum validation
        if (rule.enum && !rule.enum.includes(stringValue)) {
          errors.push(`${field} must be one of: ${rule.enum.join(', ')}`)
          continue
        }
        
        sanitized[field] = stringValue
        break

      case 'number':
        const numValue = Number(value)
        if (isNaN(numValue)) {
          errors.push(`${field} must be a number`)
          continue
        }
        
        if (rule.min !== undefined && numValue < rule.min) {
          errors.push(`${field} must be at least ${rule.min}`)
          continue
        }
        if (rule.max !== undefined && numValue > rule.max) {
          errors.push(`${field} must be at most ${rule.max}`)
          continue
        }
        
        sanitized[field] = numValue
        break

      case 'boolean':
        sanitized[field] = Boolean(value)
        break

      case 'array':
        if (!Array.isArray(value)) {
          errors.push(`${field} must be an array`)
          continue
        }
        sanitized[field] = value
        break

      case 'object':
        if (typeof value !== 'object' || Array.isArray(value)) {
          errors.push(`${field} must be an object`)
          continue
        }
        sanitized[field] = value
        break

      default:
        errors.push(`Unknown validation type for field ${field}`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  }
}

/**
 * Security headers for all responses
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'"
}

/**
 * CORS headers for cross-origin requests
 */
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}