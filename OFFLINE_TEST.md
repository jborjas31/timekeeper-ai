# Offline Functionality Test Guide

This guide helps you test that the TimeKeeper app works reliably when offline.

## Quick Offline Test

### 1. Basic Offline Test
1. Open TimeKeeper in your browser
2. Open Developer Tools (F12) and go to Console
3. Add a few tasks to verify the app is working
4. **Simulate offline**: In DevTools, go to Network tab and set "Throttling" to "Offline"
5. Try to:
   - Add new tasks
   - Mark tasks complete/incomplete
   - Switch between Schedule and Tasks tabs
   - Refresh the page

**Expected Result**: App should work normally with a red "📴 Offline" indicator in top-left

### 2. Real Network Offline Test
1. Disconnect your internet/WiFi
2. Open TimeKeeper (or refresh if already open)
3. Perform all the same actions as above

**Expected Result**: Same as simulation test

### 3. Data Persistence Test
1. While offline, add several tasks and mark some complete
2. Close the browser completely
3. Reopen browser and navigate to TimeKeeper
4. Verify all your offline changes are still there

**Expected Result**: All offline changes should be preserved

## Advanced Testing

### Debug Console Commands

Open browser console and try these commands to test different scenarios:

```javascript
// Check current storage status
DebugUtils.getStorageStatus()

// Force offline mode (for testing)
DebugUtils.forceOfflineMode()

// Force online mode
DebugUtils.forceOnlineMode()

// Check if app is using localStorage
app.storageController.getLocalStorageInfo()
```

### Manual Offline Scenarios

#### Scenario 1: Start Offline
1. Disconnect internet
2. Open TimeKeeper in new browser tab
3. Add tasks and use the app
4. Reconnect internet
5. **Expected**: App should work offline, then sync when online

#### Scenario 2: Go Offline Mid-Use
1. Open TimeKeeper with internet connected
2. Add some tasks (should sync to Firestore if configured)
3. Disconnect internet
4. Continue using app (add more tasks, mark complete)
5. Reconnect internet
6. **Expected**: All offline changes should sync to cloud

#### Scenario 3: Firestore Unavailable
1. Open TimeKeeper with FirebaseConfig not configured (default state)
2. Use the app normally
3. **Expected**: App should work in localStorage-only mode

#### Scenario 4: Firebase Timeout
1. Configure Firebase but simulate slow/unreliable connection
2. **Expected**: App should fallback to localStorage quickly (5 second timeout)

## Status Indicators

Watch for these status indicators in the top-left corner:

- **No indicator**: Online and syncing normally
- **📴 Offline**: No internet connection, saving locally only
- **💾 Local mode**: Firebase unavailable, using localStorage
- **🔄 Syncing X changes**: Background sync in progress

## Expected Behavior

### ✅ Should Work Offline:
- Adding new tasks
- Editing existing tasks  
- Marking tasks complete/incomplete
- Viewing schedule and task list
- Time updates and current hour highlighting
- Task dependencies and scheduling
- All UI interactions

### ✅ Data Persistence:
- All changes saved to localStorage immediately
- Data survives browser refresh/restart
- Changes sync to Firestore when connection returns
- No data loss in any scenario

### ✅ Performance:
- No delays when offline (localStorage is instant)
- Fast fallback when Firestore is unavailable (5 second timeout)
- UI remains responsive at all times

## Troubleshooting Offline Issues

### App Not Working Offline
1. Check browser console for errors
2. Verify localStorage is enabled in browser
3. Clear browser cache and try again

### Data Not Syncing When Online
1. Check Firebase configuration in `js/config/firebase-config.js`
2. Verify Firestore rules allow your user to write
3. Check console for sync errors

### Status Indicator Not Showing
1. Refresh the page
2. Check if `navigator.onLine` works in your browser
3. Try manually toggling airplane mode

## Debug Information

### Console Logs to Look For:

**Offline Mode:**
```
💾 Tasks loaded from localStorage (offline mode)
💾 Completions loaded from localStorage (offline mode)
📴 Offline mode - all changes saved locally
```

**Online Mode with Sync:**
```
🔄 Tasks synced to Firestore in background
🔄 Completions synced from Firestore
✅ User initialized: [user-id]
```

**Fallback Mode:**
```
💾 Operating in offline-first mode
🔧 Firebase not configured - using localStorage only
```

## Performance Notes

- **localStorage operations**: Instant (< 1ms)
- **Firestore timeout**: 5 seconds max before fallback
- **Background sync**: Non-blocking, happens in background
- **UI responsiveness**: Always immediate, never waits for network

## Single User Optimizations

The app is optimized for single-user offline operation:

1. **Offline-first storage**: localStorage is primary, Firestore is backup/sync
2. **Fast fallback**: Quick timeout prevents hanging on slow connections
3. **Background sync**: Network operations don't block UI
4. **Conflict-free**: Single user means no data conflicts
5. **Reliable persistence**: Data always saved locally first