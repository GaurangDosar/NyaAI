// Temporary test component to verify Supabase connectivity
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function TestSupabaseConnection() {
  const [status, setStatus] = useState('Testing...');

  useEffect(() => {
    const testConnection = async () => {
      console.log('🧪 Testing Supabase connection...');
      console.log('Supabase URL:', 'https://gexdoytyemjzonxguvhv.supabase.co');
      
      try {
        // Test 1: Check auth session
        console.log('Test 1: Getting auth session...');
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        console.log('Auth session:', sessionData?.session?.user?.email || 'No user');
        if (sessionError) {
          console.error('Auth error:', sessionError);
          setStatus('❌ Auth failed: ' + sessionError.message);
          return;
        }
        
        // Test 2: Try to query profiles table
        console.log('Test 2: Querying profiles table...');
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('count')
          .limit(1);
        
        if (profileError) {
          console.error('❌ Profile query error:', profileError);
          setStatus('❌ Database connection failed: ' + profileError.message);
          return;
        }
        
        console.log('✅ Profile query succeeded:', profileData);
        
        // Test 3: Check if we can access chat tables
        console.log('Test 3: Testing chat_sessions access...');
        const { data: chatData, error: chatError } = await supabase
          .from('chat_sessions')
          .select('count')
          .limit(1);
        
        if (chatError) {
          console.error('❌ Chat query error:', chatError);
          setStatus('❌ Chat tables error: ' + chatError.message);
          return;
        }
        
        console.log('✅ Chat query succeeded');
        setStatus('✅ All tests passed! Supabase is connected.');
        
      } catch (error: any) {
        console.error('❌ Connection test failed:', error);
        setStatus('❌ Connection failed: ' + error.message);
      }
    };

    testConnection();
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      margin: '20px', 
      border: '2px solid #ccc',
      borderRadius: '8px',
      backgroundColor: '#f5f5f5'
    }}>
      <h2>Supabase Connection Test</h2>
      <p style={{ fontSize: '18px', fontWeight: 'bold' }}>{status}</p>
      <p style={{ fontSize: '12px', color: '#666' }}>Check browser console (F12) for detailed logs</p>
    </div>
  );
}
