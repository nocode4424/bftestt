import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface GoogleTokenRequest {
  credential: string;
  client_id: string;
}

Deno.serve(async (req) => {
  try {
    const { credential, client_id }: GoogleTokenRequest = await req.json();

    if (!credential || !client_id) {
      return new Response(JSON.stringify({ error: 'Missing credential or client_id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify the JWT token with Google
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    
    if (!response.ok) {
      console.error('Google token verification failed:', response.status, response.statusText);
      return new Response(JSON.stringify({ error: 'Token verification failed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const tokenData = await response.json();

    // Verify the audience matches our client ID
    if (tokenData.aud !== client_id) {
      console.error('Token audience mismatch:', tokenData.aud, 'vs', client_id);
      return new Response(JSON.stringify({ error: 'Token audience mismatch' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (tokenData.exp && parseInt(tokenData.exp) < now) {
      console.error('Token expired:', tokenData.exp, 'vs', now);
      return new Response(JSON.stringify({ error: 'Token expired' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Return the user data
    const user = {
      id: tokenData.sub,
      email: tokenData.email || '',
      name: tokenData.name || '',
      picture: tokenData.picture || '',
      email_verified: tokenData.email_verified === 'true'
    };

    console.log('Token verified successfully for user:', user.email);

    return new Response(JSON.stringify({ user }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    return new Response(JSON.stringify({ 
      error: 'Token verification failed',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});