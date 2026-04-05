// Test script to verify persistent login
console.log('🔍 Testing Persistent Login System...');

// Test 1: Check if tokens are stored
const authToken = localStorage.getItem('authToken');
const savedUser = localStorage.getItem('user');

console.log('📊 Token Status:');
console.log('  - Token exists:', !!authToken);
console.log('  - Token length:', authToken ? authToken.length : 0);
console.log('  - Token preview:', authToken ? authToken.substring(0, 10) + '...' : 'NONE');

console.log('👤 User Status:');
console.log('  - User data exists:', !!savedUser);
console.log('  - User preview:', savedUser ? JSON.parse(savedUser).username : 'NONE');

// Test 2: Validate token format
if (authToken) {
  if (authToken.length < 10 || authToken.includes('undefined') || authToken.includes('null')) {
    console.log('❌ Invalid token format detected');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  } else {
    console.log('✅ Token format is valid');
  }
}

// Test 3: Check if we're on admin page
const isAdminPage = window.location.hash === '#/admin' || window.location.pathname === '/admin';
console.log('🏢 Page Type:', isAdminPage ? 'Admin Panel' : 'Frontend App');

// Test 4: Display login status
if (authToken && savedUser) {
  console.log('🎉 Persistent Login Active!');
  console.log('👤 Logged in as:', JSON.parse(savedUser).username);
  console.log('🔄 Refresh this page to test persistence');
} else {
  console.log('🔐 Not logged in');
  console.log('📝 Please login to test persistence');
}

console.log('✅ Persistent login test completed!');
