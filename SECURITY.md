# Security Guide

## 🔐 Critical Security Steps

### 1. Environment Variables
- **Never commit `.env` files to version control**
- Use `.env.example` files with placeholder values
- Set real environment variables in your deployment platform

### 2. API Key Management
- Generate a new OpenAI API key for each deployment
- Use environment variables, never hardcode API keys
- Regularly rotate your API keys
- Monitor API usage for unexpected activity

### 3. Assistant ID
- Create a new Assistant for each deployment
- Keep your Assistant ID private
- Consider using different Assistants for development/production

### 4. CORS Configuration
The backend currently allows all origins (`origin: true`). For production:
```typescript
fastify.register(cors, {
  origin: ['https://your-frontend-domain.com'],
  credentials: true,
});
```

### 5. Rate Limiting
Consider adding rate limiting to prevent abuse:
```bash
npm install @fastify/rate-limit
```

### 6. Input Validation
- The current implementation has basic validation
- Consider adding more robust input sanitization
- Implement message length limits

### 7. Error Handling
- Avoid exposing internal error details in production
- Log errors securely without exposing sensitive data

## 🚨 If You've Exposed Credentials

1. **Immediately revoke the exposed API key** in your OpenAI dashboard
2. **Generate a new API key**
3. **Create a new Assistant** if the ID was exposed
4. **Update all deployment environment variables**
5. **Check your git history** and consider using `git filter-branch` to remove sensitive data

## 🔍 Security Checklist

- [ ] Environment files are in `.gitignore`
- [ ] No API keys in code or documentation
- [ ] CORS properly configured for production
- [ ] Rate limiting implemented
- [ ] Input validation in place
- [ ] Error handling doesn't expose sensitive data
- [ ] HTTPS enabled in production
- [ ] Regular security updates applied 