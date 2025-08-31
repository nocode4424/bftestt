import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          setStatus('error');
          setMessage('Authentication failed. Please try again.');
          return;
        }

        if (data.session) {
          setStatus('success');
          setMessage('Email confirmed successfully! You can now continue with your order.');
          
          // Redirect to menu after a short delay
          setTimeout(() => {
            navigate('/');
          }, 3000);
        } else {
          setStatus('error');
          setMessage('No active session found. Please try signing up again.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {status === 'loading' && 'Confirming Email...'}
            {status === 'success' && 'Email Confirmed!'}
            {status === 'error' && 'Authentication Error'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            {status === 'loading' && (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            )}
            {status === 'success' && (
              <div className="text-green-600 text-4xl mb-2">✅</div>
            )}
            {status === 'error' && (
              <div className="text-red-600 text-4xl mb-2">❌</div>
            )}
            <p className="text-gray-600">{message}</p>
          </div>
          
          {status === 'success' && (
            <Button 
              onClick={() => navigate('/')} 
              className="w-full"
            >
              Continue to Menu
            </Button>
          )}
          
          {status === 'error' && (
            <Button 
              onClick={() => navigate('/')} 
              className="w-full"
            >
              Back to Menu
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthCallback;
