import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the current URL hash for OAuth callback
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          toast({
            title: "Authentication Error",
            description: error.message,
            variant: "destructive"
          });
          navigate('/');
          return;
        }

        if (data.session?.user) {
          // User successfully authenticated
          toast({
            title: "Welcome!",
            description: "You've been successfully signed in.",
          });
          
          // Check if we should continue checkout
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.get('continue_checkout') === 'true') {
            // Redirect to menu with checkout continuation flag
            navigate('/?continue_checkout=true');
          } else {
            // Regular sign in, redirect to menu
            navigate('/');
          }
        } else {
          // No session found, redirect to home
          navigate('/');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        toast({
          title: "Authentication Error",
          description: "An unexpected error occurred during authentication.",
          variant: "destructive"
        });
        navigate('/');
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold mb-2">Completing Sign In...</h2>
        <p className="text-muted-foreground">Please wait while we finish setting up your account.</p>
      </div>
    </div>
  );
};

export default AuthCallback;