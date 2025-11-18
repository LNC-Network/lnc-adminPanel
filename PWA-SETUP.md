# PWA Setup Instructions

## LNC Admin Panel - Progressive Web App

The LNC Admin Panel is now a fully functional Progressive Web App (PWA) that can be installed on any device.

### Features

✅ **Installable** - Add to home screen on mobile and desktop
✅ **Offline Support** - Basic caching for offline functionality  
✅ **Push Notifications** - Receive updates and alerts
✅ **App-like Experience** - Full-screen mode without browser UI
✅ **Fast Loading** - Service worker caching for better performance
✅ **Responsive** - Optimized for all screen sizes
✅ **Background Sync** - Queue actions when offline

### Installation

#### Mobile (iOS/Android)

1. Open the app in your mobile browser
2. Tap the "Install" button when prompted, OR
3. **Android**: Tap menu (⋮) → "Add to Home Screen"
4. **iOS**: Tap Share (⎋) → "Add to Home Screen"

#### Desktop (Chrome/Edge)

1. Look for the install icon (⊕) in the address bar
2. Click "Install" when prompted
3. The app will open in its own window

### Files Added

- `public/manifest.json` - PWA configuration
- `public/service-worker.js` - Offline caching & background sync
- `components/pwa-register.tsx` - Service worker registration
- `public/icons/` - App icons (various sizes)
- `scripts/generate-icons.js` - Icon generation script

### Generate Icons

To create all required icon sizes:

```bash
# Install sharp (if not already installed)
npm install sharp

# Run the icon generator
node scripts/generate-icons.js
```

Or manually create PNG icons in `public/icons/` with these sizes:

- 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512

### Testing

1. **Local Testing**:

   ```bash
   npm run build
   npm start
   ```

   Visit https://localhost:3000 (PWAs require HTTPS)

2. **Lighthouse Audit**:

   - Open Chrome DevTools
   - Go to "Lighthouse" tab
   - Check "Progressive Web App"
   - Click "Generate report"

3. **Service Worker**:
   - DevTools → Application → Service Workers
   - Verify registration status

### Customization

Edit `public/manifest.json` to customize:

- App name and description
- Theme colors
- Display mode (standalone, fullscreen, minimal-ui)
- Shortcuts (quick actions)
- Screenshots

### Push Notifications

To enable push notifications:

1. Request permission (already handled in PWARegister)
2. Subscribe user to push service
3. Send notifications from backend using Web Push API

Example backend implementation needed for:

- New chat messages
- Ticket updates
- System alerts

### Offline Support

Current offline features:

- Dashboard loads from cache
- Basic UI is accessible
- Queue actions for when online

Future improvements:

- Sync queued messages
- Offline database with IndexedDB
- Conflict resolution

### Browser Support

| Feature            | Chrome | Firefox | Safari | Edge |
| ------------------ | ------ | ------- | ------ | ---- |
| Install            | ✅     | ✅      | ✅     | ✅   |
| Service Worker     | ✅     | ✅      | ✅     | ✅   |
| Push Notifications | ✅     | ✅      | ❌     | ✅   |
| Background Sync    | ✅     | ❌      | ❌     | ✅   |

### Troubleshooting

**Install button not showing?**

- Ensure you're using HTTPS
- Check service worker is registered
- Verify manifest.json is valid

**Service worker not updating?**

- Hard refresh (Ctrl+Shift+R)
- Clear cache in DevTools
- Unregister old service worker

**Icons not displaying?**

- Run icon generator script
- Check files exist in public/icons/
- Verify manifest.json paths

### Next Steps

1. ✅ Generate proper app icons
2. ⏳ Implement push notification backend
3. ⏳ Add IndexedDB for offline data
4. ⏳ Create app screenshots for stores
5. ⏳ Optimize caching strategy
6. ⏳ Add update notification when new version available

### Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
