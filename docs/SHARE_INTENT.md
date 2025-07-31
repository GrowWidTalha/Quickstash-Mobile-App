# Share Intent Feature

## Overview

The Share Intent feature allows users to share URLs from other apps directly into Quick Stash. When a user shares a URL from their browser, social media app, or any other app, it will automatically open Quick Stash and stash the URL.

## How It Works

### 1. **App Configuration**
- **URL Scheme**: `com.quickstash.app://`
- **Intent Filters**: Configured for both Android and iOS
- **Share Support**: Handles `text/plain` MIME type for URL sharing

### 2. **Share Flow**
```
User shares URL → System shows app picker → Quick Stash selected → URL processed → Stashed automatically
```

### 3. **Offline Support**
- URLs shared while offline are queued
- Automatic sync when connection is restored
- Optimistic UI updates for immediate feedback

## Platform Support

### Android
- **Intent Filter**: Handles `SEND` action with `text/plain` MIME type
- **Deep Linking**: Supports custom URL scheme
- **Share Sheet**: Appears in system share menu

### iOS
- **URL Schemes**: Custom scheme registration
- **Universal Links**: Support for direct URL sharing
- **Share Extension**: Appears in iOS share sheet

## Implementation Details

### Key Components

1. **`ShareIntentContext.tsx`**
   - Manages shared URLs globally
   - Handles deep linking events
   - Processes incoming URLs

2. **`ShareHandler.tsx`**
   - UI for processing shared URLs
   - Shows success/error states
   - Integrates with offline system

3. **`ShareIntentTest.tsx`**
   - Development testing tool
   - Simulates share intents
   - Quick URL testing

### URL Processing

```typescript
// Custom scheme handling
com.quickstash.app://share?url=https://example.com

// Direct URL sharing
https://example.com
```

## Testing

### Development Testing

1. **Use Test Panel**: Tap the 📤 button on homepage
2. **Simulate Share**: Choose from predefined URLs or enter custom URL
3. **Verify Flow**: Check that ShareHandler modal appears
4. **Test Offline**: Enable airplane mode and test sharing

### Real Device Testing

1. **Install App**: Build and install on device
2. **Share from Browser**: Open any website and use share button
3. **Select Quick Stash**: Choose Quick Stash from share sheet
4. **Verify Stashing**: Check that URL appears in saves

### Android Testing

```bash
# Test with adb
adb shell am start -W -a android.intent.action.SEND \
  -d "https://example.com" \
  -t "text/plain" \
  com.quickstash.app
```

### iOS Testing

```bash
# Test with xcrun
xcrun simctl openurl booted "com.quickstash.app://share?url=https://example.com"
```

## User Experience

### Share Intent Flow

1. **User Action**: User taps share in any app
2. **App Selection**: Quick Stash appears in share sheet
3. **Processing**: ShareHandler modal shows processing state
4. **Success**: Confirmation with option to view saves
5. **Offline Notice**: Clear indication if offline

### Visual States

- **Processing**: Loading spinner with "Processing shared URL..."
- **Success**: Green checkmark with success message
- **Error**: Red X with error details
- **Offline**: Amber warning about offline queuing

## Configuration

### App.json Settings

```json
{
  "expo": {
    "scheme": "com.quickstash.app",
    "ios": {
      "infoPlist": {
        "CFBundleURLTypes": [
          {
            "CFBundleURLName": "com.quickstash.app",
            "CFBundleURLSchemes": ["com.quickstash.app"]
          }
        ]
      }
    },
    "android": {
      "intentFilters": [
        {
          "action": "SEND",
          "category": ["DEFAULT"],
          "data": [
            {
              "mimeType": "text/plain"
            }
          ]
        }
      ]
    }
  }
}
```

## Integration with Offline System

### Offline Queue

```typescript
// When offline, URLs are queued
await OfflineStorage.addOfflineAction({
  type: 'add',
  data: { url: sharedUrl }
});
```

### Sync Process

```typescript
// When back online, queued URLs sync
for (const action of offlineActions) {
  if (action.type === 'add') {
    await fetcher("addSave", action.data);
  }
}
```

## Troubleshooting

### Common Issues

1. **App Not in Share Sheet**
   - Check intent filter configuration
   - Verify app installation
   - Clear app data and reinstall

2. **URLs Not Processing**
   - Check URL validation logic
   - Verify deep linking setup
   - Test with simple URLs first

3. **Offline Issues**
   - Check offline storage permissions
   - Verify queue persistence
   - Test sync functionality

### Debug Tools

```typescript
// Check share intent state
const { isShareIntentVisible, sharedUrl } = useShareIntent();

// Test share intent manually
showShareIntent('https://example.com');
```

## Future Enhancements

### Planned Features

1. **Rich Content Support**
   - Image sharing
   - Text snippets
   - File attachments

2. **Smart Processing**
   - URL validation
   - Content extraction
   - Duplicate detection

3. **Advanced Sharing**
   - Batch URL processing
   - Share to specific collections
   - Custom share templates

### Performance Optimizations

1. **Background Processing**
   - Queue processing in background
   - Batch sync operations
   - Memory optimization

2. **Caching**
   - Share intent state persistence
   - URL validation caching
   - Offline queue optimization

## Security Considerations

### URL Validation

```typescript
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};
```

### Input Sanitization

- Validate all incoming URLs
- Sanitize user input
- Prevent malicious URL injection

### Privacy

- No URL logging
- Local processing only
- Secure storage practices 