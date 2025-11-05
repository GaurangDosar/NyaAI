// Temporary file to test environment variables
export const TestEnv = () => {
  console.log('=== ENVIRONMENT VARIABLES TEST ===');
  console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('VITE_SUPABASE_PUBLISHABLE_KEY:', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.substring(0, 20) + '...');
  console.log('VITE_SUPABASE_PROJECT_ID:', import.meta.env.VITE_SUPABASE_PROJECT_ID);
  console.log('==================================');
  
  return (
    <div className="p-4 bg-card text-card-foreground rounded-lg">
      <h3 className="font-bold mb-2">Environment Variables Status:</h3>
      <ul className="space-y-1 text-sm">
        <li>✅ VITE_SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL || '❌ NOT LOADED'}</li>
        <li>✅ VITE_SUPABASE_PUBLISHABLE_KEY: {import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? 'Loaded' : '❌ NOT LOADED'}</li>
        <li>✅ VITE_SUPABASE_PROJECT_ID: {import.meta.env.VITE_SUPABASE_PROJECT_ID || '❌ NOT LOADED'}</li>
      </ul>
    </div>
  );
};
