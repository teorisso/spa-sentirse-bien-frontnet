'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import PageHero from '../components/PageHero';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [tipoMensaje, setTipoMensaje] = useState<'exito' | 'error' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Obtener el token de la URL
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setMensaje('Enlace inválido. Por favor, solicita un nuevo enlace de recuperación.');
      setTipoMensaje('error');
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!token) {
      setMensaje('Token no válido');
      setTipoMensaje('error');
      return;
    }

    if (password !== confirmPassword) {
      setMensaje('Las contraseñas no coinciden');
      setTipoMensaje('error');
      return;
    }

    if (password.length < 6) {
      setMensaje('La contraseña debe tener al menos 6 caracteres');
      setTipoMensaje('error');
      return;
    }

    setIsLoading(true);
    setMensaje(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_AUTH}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token,
          newPassword: password 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMensaje('Contraseña actualizada exitosamente. Serás redirigido al login.');
        setTipoMensaje('exito');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setMensaje(data.message || 'Error al restablecer la contraseña');
        setTipoMensaje('error');
      }
    } catch (error) {
      console.error('Error al restablecer contraseña:', error);
      setMensaje('Error de conexión. Por favor, inténtalo nuevamente.');
      setTipoMensaje('error');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <PageHero 
        title="Restablecer Contraseña"
        description="Ingresa tu nueva contraseña para completar el proceso de recuperación."
      />

      <main className="py-16 px-4 bg-white font-roboto flex justify-center">
        <motion.div 
          className="bg-[#F5F9F8] p-8 rounded-xl shadow-md w-full max-w-lg text-[#436E6C]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-[#436E6C] mb-2">
              Nueva Contraseña
            </h2>
            <p className="text-sm text-[#436E6C] opacity-80">
              Ingresa tu nueva contraseña para completar el proceso.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#436E6C] mb-1">
                Nueva Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-3 rounded-md border border-[#B6D5C8] focus:outline-none focus:ring-2 focus:ring-[#436E6C]"
                required
                minLength={6}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#436E6C] mb-1">
                Confirmar Contraseña
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-3 rounded-md border border-[#B6D5C8] focus:outline-none focus:ring-2 focus:ring-[#436E6C]"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !token}
              className="w-full bg-[#436E6C] text-white py-3 rounded-md hover:bg-[#5A9A98] transition disabled:bg-opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
            </button>

            {mensaje && (
              <div
                className={`text-sm px-4 py-2 rounded-md mt-2 ${
                  tipoMensaje === 'exito'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {mensaje}
              </div>
            )}

            <div className="text-center text-sm text-[#436E6C]">
              <Link 
                href="/login"
                className="hover:text-[#5A9A98] transition-colors duration-300 underline"
              >
                ← Volver al inicio de sesión
              </Link>
            </div>
          </form>
        </motion.div>
      </main>
    </>
  );
} 