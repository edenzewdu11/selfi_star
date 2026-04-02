# Frontend Media Upload Fix Guide

## Problem Status
✅ **BACKEND IS WORKING PERFECTLY** - All media uploads (images, videos, audio) work correctly
❌ **Frontend has issues** - The frontend is not making the upload requests

## What's Working
- Backend API endpoints: ✅
- File storage: ✅ 
- Authentication: ✅
- Content moderation: ✅
- Direct HTTP requests: ✅

## Frontend Issues to Check

### 1. Browser Console Errors
Open browser console (F12) and check for:
- JavaScript errors
- Network request failures
- Permission denied errors

### 2. Microphone/Camera Permissions
For voice/video recording:
```javascript
// Check permissions
navigator.permissions.query({name: 'microphone'})
navigator.permissions.query({name: 'camera'})
```

### 3. Frontend Debug Steps

#### Step 1: Check Token
```javascript
// In browser console
console.log('Token:', localStorage.getItem('authToken'));
```

#### Step 2: Test API Directly
```javascript
// Test API directly in browser console
fetch('http://localhost:8000/api/messages/', {
  method: 'POST',
  headers: {
    'Authorization': 'Token ' + localStorage.getItem('authToken'),
  },
  body: new FormData().append('test', 'test')
}).then(r => r.json()).then(console.log)
```

#### Step 3: Check File Input
```javascript
// Check if file input is working
document.querySelector('input[type="file"]').click();
```

### 4. Common Frontend Issues

#### Issue A: Missing Token
- User not logged in properly
- Token expired
- Token cleared by browser

#### Issue B: Browser Permissions
- Microphone access denied
- Camera access denied
- File access blocked

#### Issue C: JavaScript Errors
- Component not mounted
- Event handlers not bound
- Network errors

### 5. Quick Fixes

#### Fix 1: Re-authenticate
```javascript
// Clear and reset token
localStorage.removeItem('authToken');
// Login again
```

#### Fix 2: Check Network Tab
- Open browser Network tab
- Try uploading a file
- See if request is being made
- Check request status

#### Fix 3: Test with Simple File
```javascript
// Create test file and upload
const blob = new Blob(['test'], {type: 'text/plain'});
const file = new File([blob], 'test.txt', {type: 'text/plain'});
// Try to upload this file
```

## Backend Verification (Already Working)
The backend has been tested and works with:
- ✅ Image uploads: `test.jpg` → Status 201
- ✅ Video uploads: `test.mp4` → Status 201  
- ✅ Audio uploads: `test.mp3` → Status 201
- ✅ File storage: Files saved to `media/message_attachments/`
- ✅ Authentication: Token-based auth working
- ✅ Content moderation: Working with error handling

## Next Steps for User
1. Open browser console (F12)
2. Try uploading a file
3. Check for errors in console
4. Check Network tab for failed requests
5. If still not working, provide console errors

## Emergency Fix
If frontend continues to fail, the user can:
1. Use direct API calls (as shown in tests)
2. Check if browser is blocking file uploads
3. Try a different browser
4. Clear browser cache and cookies
