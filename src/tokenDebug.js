// Token debugging utility to help identify and fix token confusion issues

export const debugTokens = () => {
  console.log('=== TOKEN DEBUG INFO ===');
  
  const authToken = localStorage.getItem('authToken');
  const adminToken = localStorage.getItem('adminToken');
  
  console.log('🔑 User token (authToken):', authToken ? authToken.substring(0, 10) + '...' : 'NONE');
  console.log('🔑 Admin token (adminToken):', adminToken ? adminToken.substring(0, 10) + '...' : 'NONE');
  
  if (authToken === adminToken && authToken !== null) {
    console.error('🚨 CRITICAL ERROR: User and admin tokens are the same!');
    console.error('This will cause messages to be attributed to admin instead of the actual user');
    return false;
  }
  
  console.log('✅ Tokens appear to be different');
  return true;
};

export const clearTokenConfusion = () => {
  console.log('🔧 Clearing token confusion...');
  
  const authToken = localStorage.getItem('authToken');
  const adminToken = localStorage.getItem('adminToken');
  
  if (authToken === adminToken && authToken !== null) {
    console.log('🗑️ Removing conflicting tokens...');
    localStorage.removeItem('authToken');
    localStorage.removeItem('adminToken');
    console.log('✅ Tokens cleared. Please log in again.');
    return true;
  }
  
  console.log('✅ No token confusion detected');
  return false;
};

export const validateCurrentToken = (expectedUsername) => {
  console.log(`🔍 Validating token for expected user: ${expectedUsername}`);
  
  const authToken = localStorage.getItem('authToken');
  if (!authToken) {
    console.log('❌ No auth token found');
    return false;
  }
  
  // This would need to be called from a context where we can make an API call
  // to verify the current user, but for now we'll just check for obvious issues
  const adminToken = localStorage.getItem('adminToken');
  if (authToken === adminToken) {
    console.log('❌ Current token matches admin token - this is the bug!');
    return false;
  }
  
  console.log('✅ Token appears valid (basic checks passed)');
  return true;
};

// Auto-run debug on import in development
if (process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    debugTokens();
  }, 1000);
}
