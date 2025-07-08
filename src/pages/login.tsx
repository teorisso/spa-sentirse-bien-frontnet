'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import PageHero from '../components/PageHero';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import jwt_decode from 'jwt-decode';
import UsuarioModal from '@/components/admin/UsuarioModal';
import { authApi, LoginResult } from '@/utils/apiAdapter';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [tipoMensaje, setTipoMensaje] = useState<'exito' | 'error' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  // Estado para el modal de registro
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenRegisterModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseRegisterModal = () => {
    setIsModalOpen(false);
  };

  const handleRegistered = () => {
    // Cuando se crea la cuenta, mostramos un mensaje y cerramos
    setMensaje('Cuenta creada exitosamente. Ahora puedes iniciar sesión.');
    setTipoMensaje('exito');
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setMensaje(null);

    // Usar el nuevo patrón sin excepciones
    const loginResult = await authApi.login(email, password);
    
    if (loginResult.success) {
      // Login exitoso
      await login(loginResult.data.token, loginResult.data.user);
      setMensaje('Inicio de sesión exitoso');
      setTipoMensaje('exito');
      
      const userRole = loginResult.data.user.role;
      setTimeout(() => {
        router.push('/'); // Todos los usuarios van a la página principal
      }, 1000);
    } else {
      // Login falló - mostrar error sin lanzar excepción
      console.error('Error en el inicio de sesión:', loginResult.error);
      setMensaje(loginResult.error);
      setTipoMensaje('error');
    }
    
    setIsLoading(false);
  }

  // Manejo del login con Google - TEMPORALMENTE DESHABILITADO
  async function handleGoogleLogin(cred: CredentialResponse) {
    setMensaje('Google Login temporalmente no disponible. Use email y contraseña.');
    setTipoMensaje('error');
    
    /* TODO: Implementar Google OAuth en la API ASP.NET
    try {
      if (!cred.credential) return;

      // Podemos decodificar el id_token si quisiéramos información extra

      // 2. Enviamos el id_token al backend para validarlo / crear usuario
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_AUTH}/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token: cred.credential }),
      });

      const data = await res.json();

      if (res.ok) {
        await login(data.token, data.user);
        router.push('/');
      } else {
        setMensaje(data.message || 'Error con Google Login');
        setTipoMensaje('error');
      }
    } catch (error: any) {
      console.error('Google login error', error);
      setMensaje('Error interno de Google Login');
      setTipoMensaje('error');
    }
    */
  }

  return (
    <>
      <PageHero 
        title="Iniciar Sesión"
        description="Ingresa a tu cuenta para reservar tus turnos y acceder a todos los beneficios de Sentirse Bien."
      />

      <main className="py-16 px-4 bg-white font-roboto flex justify-center">
        <motion.div 
          className="bg-[#F5F9F8] p-8 rounded-xl shadow-md w-full max-w-lg text-[#436E6C]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#436E6C] mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full p-3 rounded-md border border-[#B6D5C8] focus:outline-none focus:ring-2 focus:ring-[#436E6C]"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#436E6C] mb-1">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-3 rounded-md border border-[#B6D5C8] focus:outline-none focus:ring-2 focus:ring-[#436E6C]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#436E6C] text-white py-3 rounded-md hover:bg-[#5A9A98] transition disabled:bg-opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Procesando...' : 'Iniciar Sesión'}
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
              <button
                type="button"
                onClick={handleOpenRegisterModal}
                className="hover:text-[#5A9A98] transition-colors duration-300 underline"
              >
                ¿No tienes una cuenta? Regístrate
              </button>
            </div>

            {/* Separador */}
            <div className="my-4 text-center text-sm text-[#436E6C]">o ingresa con</div>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => {
                  setMensaje('Falló el inicio con Google');
                  setTipoMensaje('error');
                }}
                useOneTap
              />
            </div>
          </form>
        </motion.div>

        {/* Modal de Registro */}
        {isModalOpen && (
          <UsuarioModal
            isOpen={isModalOpen}
            onClose={handleCloseRegisterModal}
            usuario={null}
            onSave={() => {
              handleRegistered();
              handleCloseRegisterModal();
            }}
          />
        )}
      </main>
    </>
  );
}