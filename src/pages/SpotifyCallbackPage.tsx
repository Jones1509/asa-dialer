import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSpotify } from '@/hooks/useSpotify';

const SpotifyCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { exchangeCode } = useSpotify();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const err = searchParams.get('error');

    if (err) {
      setError('Spotify-login blev annulleret.');
      setTimeout(() => navigate('/'), 2000);
      return;
    }

    if (code) {
      exchangeCode(code)
        .then(() => navigate('/'))
        .catch((e) => {
          console.error('Spotify exchange error:', e);
          setError('Kunne ikke forbinde til Spotify.');
          setTimeout(() => navigate('/'), 3000);
        });
    } else {
      navigate('/');
    }
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Forbinder til Spotify...</p>
        )}
      </div>
    </div>
  );
};

export default SpotifyCallbackPage;
