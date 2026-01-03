# Edge Function Template

This directory contains a template for creating new Supabase Edge Functions that follow our established security patterns and best practices.

## Files

- `index.ts` - Complete template with all security patterns
- `config.toml` - Configuration file for deployment

## Usage

1. Copy the template to create a new function:
   ```bash
   cp -r _template ../your-function-name
   ```

2. Update the template:
   - Change interface names (`YourRequestData`, `YourResponseData`)
   - Update validation rules in `validateInput()`
   - Implement your business logic in `yourBusinessLogic()`
   - Add any AI integration if needed
   - Update the configuration file

3. Test your function locally:
   ```bash
   supabase functions serve your-function-name
   ```

4. Deploy to production:
   ```bash
   supabase functions deploy your-function-name
   ```

## Security Features Included

✅ Environment variable validation  
✅ Input validation and sanitization  
✅ Standardized error responses  
✅ Security headers (CORS, XSS protection)  
✅ Timeout protection for external calls  
✅ Comprehensive error handling  
✅ TypeScript interfaces for type safety  

## Customization Checklist

- [ ] Update interface definitions
- [ ] Modify validation rules
- [ ] Implement business logic
- [ ] Add environment variables to Supabase dashboard
- [ ] Update configuration file
- [ ] Test with invalid inputs
- [ ] Test error scenarios
- [ ] Verify CORS works from frontend

## Best Practices

- Always validate environment variables first
- Use the shared security utilities
- Implement timeout protection for external APIs
- Log errors with context for debugging
- Test with edge cases and invalid data
- Follow the established response formats

For detailed documentation, see `EDGE_FUNCTION_GUIDE.md` in the project root.