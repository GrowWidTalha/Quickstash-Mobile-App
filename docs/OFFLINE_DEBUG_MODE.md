# Offline Debug Mode - Testing Guide

## Overview

A debug toolbar has been added to help you test offline functionality without disconnecting from your dev server. This tool is **only visible in development mode** (`__DEV__`) and will not appear in production builds.

## Where to Find It

The debug toolbar appears at the bottom of the screen on:
- **Splash/Index screen** (`app/index.tsx`)
- **Home screen** (`app/(tabs)/home.tsx`)

## How to Use

### Initial State
When you first launch the app, the debug toolbar is collapsed and shows:
```
🔧 DEBUG MODE ▲ | Status: 🟢 ONLINE
```

### Expand the Toolbar
Tap the header to expand the toolbar and see all debug options.

### Available Tools

#### 1. **Toggle Offline Mode**
- **Green button (📡 Go Online)**: Currently simulating offline mode
- **Red button (✈️ Go Offline)**: Currently online, tap to simulate offline

This overrides the actual network state without disconnecting from your dev server.

#### 2. **Check Cache**
Displays current cache status:
- ✅ User Cached - Shows if user data is stored
- ✅ UserId Cached - Shows if database user ID is stored
- ✅ Saves Cached - Shows if saves data is stored (with count)

#### 3. **Clear Cache**
Removes all cached offline data:
- `offline_last_user`
- `offline_user_id`
- `cached_saves`
- `cached_save_details_meta`

**Note**: After clearing cache, restart the app to see changes.

## Testing Workflow

### Test Case 1: First-time Sign In
1. **Clear cache** using the debug tool
2. **Restart the app**
3. **Sign in** while in ONLINE mode
4. **Check cache** - should show all data cached ✅
5. **Toggle to OFFLINE mode**
6. **Restart the app** (close and reopen)
7. **Expected**: App loads with cached user, navigates to home

### Test Case 2: Offline Error Message
1. **Clear cache** using the debug tool
2. **Toggle to OFFLINE mode**
3. **Restart the app**
4. **Expected**: Shows "You're Offline" error screen with retry button

### Test Case 3: Offline Data Access
1. **Sign in** while ONLINE
2. Browse some articles (they get cached)
3. **Check cache** - verify saves are cached
4. **Toggle to OFFLINE mode**
5. **Expected**: Can still view cached articles, network indicator shows offline

### Test Case 4: Sign Up with userId Caching
1. **Clear cache**
2. **Sign up** a new account while ONLINE
3. Watch console logs for:
   - `~ 🚀: UserId fetched: [id]`
   - `~ 🚀: UserId stored in AsyncStorage: [id]`
4. **Check cache** - should show user and userId ✅
5. **Toggle to OFFLINE and restart**
6. **Expected**: App loads with cached credentials

## Troubleshooting

### Debug tool not showing
- Make sure you're in development mode (`__DEV__ === true`)
- Check that you're on splash screen or home screen

### Toggle doesn't work
- Try restarting the app after toggling
- Check console logs for network state changes

### Cache shows empty after sign in
- Wait a few seconds for async operations to complete
- Check console for error messages
- Verify your backend API is returning userId correctly

## Console Logs to Watch

When testing, look for these key logs:

```
~ 🚀: Loading session from Supabase...
~ 🚀: Initial session found
~ 🚀: UserId fetched: [id]
~ 🚀: UserId stored in AsyncStorage: [id]
~ 🚀: Hydrated user from offline cache: [email]
~ 🚀: Hydrated userId from offline cache: [id]
```

## Technical Details

### How It Works

1. **Debug State**: `debugOfflineMode` boolean state
2. **Network Override**: When `debugOfflineMode` is true, `isOnline` is forced to false
3. **No Server Disconnect**: Your app stays connected to Metro bundler
4. **Cache Inspection**: Direct AsyncStorage access to show cached data

### Files Modified

- `components/OfflineDebugger.tsx` - Debug toolbar component
- `app/index.tsx` - Added debug mode to splash
- `app/(tabs)/home.tsx` - Added debug mode to home

## Tips

- Keep the toolbar expanded while testing for quick access
- Use "Check Cache" frequently to verify data is being stored
- Watch the status indicator (🟢 ONLINE / 🔴 OFFLINE) in the header
- Clear cache between tests for consistent results

## Removing Debug Tool

The debug tool automatically disappears in production builds. If you want to remove it from development:

1. Remove `<OfflineDebugger />` component from your screens
2. Delete `components/OfflineDebugger.tsx`

No other changes needed - it's completely isolated!

