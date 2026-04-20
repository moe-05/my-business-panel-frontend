import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '../../components/ui/Button';

interface LocationState {
  credentials?: { email: string; password: string };
}

export function SuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const animRef = useRef<HTMLDivElement>(null);

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState('');

  const credentials = (location.state as LocationState)?.credentials;

  useEffect(() => {
    const el = animRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0) scale(1)';
    });
  }, []);

  const handleContinue = async () => {
    if (!credentials) {
      navigate('/auth/login', { replace: true });
      return;
    }

    setError('');
    setIsLoggingIn(true);

    try {
      await login(credentials);
      navigate('/app/dashboard', { replace: true });
    } catch {
      setError('No se pudo iniciar sesión automáticamente. Intenta de nuevo.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      {/* Fondo decorativo */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(ellipse, rgba(16,16,16,0.08) 0%, transparent 70%)',
          }}
        />
      </div>

      <div
        ref={animRef}
        className="relative text-center max-w-md w-full transition-all duration-700"
        style={{ opacity: 0, transform: 'translateY(24px) scale(0.97)' }}
      >
        {/* Ícono de éxito */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center shadow-lg shadow-gray-200">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
            {/* Pulso decorativo */}
            <div className="absolute inset-0 rounded-full animate-ping bg-gray-200 opacity-30" />
          </div>
        </div>

        {/* Logo */}
        <div className="flex justify-center items-center gap-2 mb-6">
          <div className="w-7 h-7 rounded-lg bg-gray-800 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="3" width="8" height="8" rx="2" fill="white" />
              <rect x="14" y="3" width="8" height="8" rx="2" fill="white" fillOpacity="0.6" />
              <rect x="2" y="13" width="8" height="8" rx="2" fill="white" fillOpacity="0.6" />
              <rect x="14" y="13" width="8" height="8" rx="2" fill="white" />
            </svg>
          </div>
          <span className="font-semibold text-gray-900 text-base" style={{ fontFamily: 'var(--font-display)' }}>
            My Business Panel
          </span>
        </div>

        <h1
          className="text-3xl font-bold text-gray-900 mb-3"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          ¡Tu cuenta está lista!
        </h1>
        <p className="text-gray-500 text-base mb-8 leading-relaxed">
          Tu empresa ha sido configurada exitosamente y tu suscripción está activa.
          Ya puedes comenzar a gestionar tu negocio.
        </p>

        {/* Checkpoints */}
        <div className="text-left space-y-3 mb-10 p-5 rounded-2xl bg-gray-50 border border-gray-200">
          {[
            'Cuenta de usuario creada',
            'Empresa configurada',
            'Sucursal principal asignada',
            'Suscripción activada',
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 text-sm text-gray-700">
              <span className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center shrink-0">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              {item}
            </div>
          ))}
        </div>

        {error && (
          <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        <Button
          fullWidth
          size="lg"
          loading={isLoggingIn}
          onClick={handleContinue}
        >
          {isLoggingIn ? 'Iniciando sesión...' : 'Ir al Panel'}
          {!isLoggingIn && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          )}
        </Button>

        <p className="mt-5 text-xs text-gray-400">
          Si tienes algún problema, contáctanos en{' '}
          <span className="text-gray-900 cursor-pointer hover:underline">soporte@mybusinesspanel.com</span>
        </p>
      </div>
    </div>
  );
}
