# Deployment Guide

This guide covers how to deploy the Real-Time Orderbook Viewer to various platforms.

## 🚀 Production Deployment

### Vercel (Recommended)

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Deploy on Vercel**:
   - Visit [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure build settings (auto-detected)
   - Deploy

3. **Environment Variables** (if needed):
   - No environment variables required for this demo
   - All exchanges use public APIs

### Netlify

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Deploy**:
   - Upload the `.next` folder to Netlify
   - Configure redirects for Next.js routing

### Docker Deployment

1. **Create Dockerfile**:
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Build and run**:
   ```bash
   docker build -t orderbook-viewer .
   docker run -p 3000:3000 orderbook-viewer
   ```

## ⚙️ Configuration

### Environment Variables

Create `.env.local` for any custom configurations:

```env
# Optional: Custom API endpoints (if needed in future)
# NEXT_PUBLIC_API_URL=https://your-api.com

# Optional: Analytics (if added)
# NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### Next.js Configuration

Update `next.config.js` for production optimizations:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  // Add security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
```

## 🔧 Performance Optimization

### Build Optimization

1. **Analyze bundle size**:
   ```bash
   npm install --save-dev @next/bundle-analyzer
   ```

2. **Enable compression**:
   ```bash
   npm install compression
   ```

3. **Optimize images**:
   - Use Next.js Image component
   - Implement lazy loading

### Caching Strategy

1. **Static Assets**: Cache CSS, JS, images with long TTL
2. **API Responses**: Implement appropriate cache headers
3. **Service Worker**: Consider adding for offline support

## 🛡️ Security Considerations

### Production Security

1. **HTTPS Only**: Ensure SSL certificate is configured
2. **Content Security Policy**: Add CSP headers
3. **Rate Limiting**: Implement API rate limiting
4. **CORS Configuration**: Properly configure CORS policies

### API Security

1. **Public APIs Only**: No sensitive API keys required
2. **Rate Limiting**: Respect exchange rate limits
3. **Input Validation**: Validate all user inputs
4. **Error Handling**: Don't expose internal errors

## 📊 Monitoring

### Application Monitoring

1. **Error Tracking**: Implement Sentry or similar
2. **Performance Monitoring**: Monitor Core Web Vitals
3. **Uptime Monitoring**: Set up health check endpoints
4. **Real-Time Monitoring**: Monitor WebSocket connections

### Health Check Endpoint

Add a health check endpoint in `/app/api/health/route.ts`:

```typescript
export async function GET() {
  return Response.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
}
```

## 🚦 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test
      
      - name: Build application
        run: npm run build
      
      - name: Deploy to Vercel
        uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 📱 Mobile App Deployment

### Progressive Web App (PWA)

1. **Add manifest.json**:
   ```json
   {
     "name": "Orderbook Viewer",
     "short_name": "Orderbook",
     "description": "Real-time orderbook viewer",
     "start_url": "/",
     "display": "standalone",
     "background_color": "#0f172a",
     "theme_color": "#0ea5e9",
     "icons": [
       {
         "src": "/icon-192x192.png",
         "sizes": "192x192",
         "type": "image/png"
       }
     ]
   }
   ```

2. **Add service worker**: Implement offline functionality

### React Native (Future)

1. **Expo Configuration**: Set up Expo for mobile deployment
2. **Platform-Specific Code**: Handle iOS/Android differences
3. **App Store Deployment**: Configure for app stores

## 🔍 Testing Production

### Pre-Deployment Checklist

- [ ] All API endpoints working
- [ ] WebSocket connections stable
- [ ] Responsive design tested
- [ ] Error handling working
- [ ] Performance metrics acceptable
- [ ] Security headers configured
- [ ] Analytics configured (if applicable)

### Load Testing

1. **WebSocket Connections**: Test multiple concurrent connections
2. **API Rate Limits**: Verify rate limiting works correctly
3. **Memory Usage**: Monitor for memory leaks
4. **Error Recovery**: Test reconnection logic

## 📈 Scaling Considerations

### Horizontal Scaling

1. **Load Balancing**: Distribute traffic across instances
2. **Session Management**: Handle sticky sessions for WebSockets
3. **Database Scaling**: If adding data persistence
4. **CDN Integration**: Use CDN for static assets

### Vertical Scaling

1. **Server Resources**: Monitor CPU and memory usage
2. **Connection Limits**: Monitor WebSocket connection limits
3. **API Throttling**: Implement intelligent rate limiting

## 🔄 Rollback Strategy

### Deployment Rollback

1. **Version Control**: Tag all releases
2. **Blue-Green Deployment**: Maintain two production environments
3. **Database Migrations**: Ensure backward compatibility
4. **Monitoring**: Set up alerts for deployment issues

### Emergency Procedures

1. **Immediate Rollback**: Quick rollback to previous version
2. **Circuit Breakers**: Automatically disable failing features
3. **Maintenance Mode**: Temporary maintenance page
4. **Communication Plan**: User notification strategy

---

**Note**: This deployment guide covers the essential steps for production deployment. Adjust configurations based on your specific requirements and hosting platform. 