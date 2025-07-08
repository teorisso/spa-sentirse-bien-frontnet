'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { IUser } from '@/types';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface AuthContextType {
  user: IUser | null;
  isAdmin: boolean;
  isAuthLoaded: boolean;
  login: (token: string, userData: IUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  isAuthLoaded: false,
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);
  const isAdmin = !!user?.is_admin;
  const router = useRouter();

  // Referencia para evitar múltiples toasts/redirects simultáneos
  const hasHandledSessionExpiry = useRef(false);

  useEffect(() => {
    // Intenta cargar el usuario desde localStorage al iniciar
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        // Verificar que el usuario tenga un ID válido
        if (parsedUser && parsedUser._id) {
          setUser(parsedUser);
        } else {
          console.warn('Datos de usuario incompletos en localStorage, eliminando sesión');
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      }
    } catch (error) {
      console.error('Error al cargar usuario desde localStorage:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    } finally {
      setIsAuthLoaded(true);
    }
  }, []);

  useEffect(() => {
    console.log("Auth state changed:", {
      isLoggedIn: !!user,
      userId: user?._id,
      isAuthLoaded
    });
  }, [user, isAuthLoaded]);

  // Interceptar todas las llamadas fetch para detectar expiración de sesión
  useEffect(() => {
    // Evitar doble registro en hot-reload de React en desarrollo
    if ((window as any).__FETCH_WITH_EXPIRY_HANDLER__) return;

    const originalFetch = window.fetch.bind(window);

    async function fetchWithExpiry(
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> {
      const response = await originalFetch(input, init);

      // Si el backend devuelve 401, verificamos si se debe a token inválido/expirado
      if (response.status === 401) {
        try {
          const cloned = response.clone();
          const data = await cloned.json();
          const tokenError = data?.message === 'Invalid token' || data?.message === 'No authentication token provided';

          if (tokenError && !hasHandledSessionExpiry.current) {
            hasHandledSessionExpiry.current = true;

            // Limpiar sesión local
            logout();

            // Mostrar mensaje al usuario
            toast.error('La sesión ha expirado. Por favor inicia sesión nuevamente.');

            // Redirigir al login (evitar redirección si ya estamos allí)
            if (window.location.pathname !== '/login') {
              router.push('/login');
            }

            // Resetear bandera luego de un breve lapso para admitir futuros logins
            setTimeout(() => {
              hasHandledSessionExpiry.current = false;
            }, 3000);
          }
        } catch (err) {
          // No se pudo parsear el cuerpo, omitimos
        }
      }

      return response;
    }

    window.fetch = fetchWithExpiry;
    (window as any).__FETCH_WITH_EXPIRY_HANDLER__ = true;

    // Cleanup al desmontar
    return () => {
      window.fetch = originalFetch;
      delete (window as any).__FETCH_WITH_EXPIRY_HANDLER__;
    };
  }, [logout, router]);

  const login = async (token: string, userData: any) => {
    console.log("Login function called with:", { 
      token: !!token,
      userData: !!userData,
      userHasId: userData && '_id' in userData
    });
    
    // If userData is missing _id but has email, fetch complete user data
    if (userData && !userData._id && userData.email) {
      try {
        console.log("User data missing ID, attempting to fetch complete user data by email");
        const apiUserUrl = `${process.env.NEXT_PUBLIC_API_USER}/correo/${userData.email}`;
        console.log("Fetching user data from:", apiUserUrl);
        
        const userResponse = await fetch(apiUserUrl);
        if (userResponse.ok) {
          const completeUserData = await userResponse.json();
          console.log("Retrieved complete user data:", !!completeUserData);
          
          // Use the complete user data with ID
          userData = completeUserData;
        } else {
          console.error("Failed to fetch complete user data");
        }
      } catch (error) {
        console.error("Error fetching complete user data:", error);
      }
    }
    
    // Final check for _id
    if (!userData || !userData._id) {
      console.error('Intento de login con datos de usuario incompletos', userData);
      return;
    }
    
    // Guardar en estado y localStorage
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    
    // Verify storage was successful
    console.log("Login state saved:", {
      contextUser: !!userData,
      localStorageUser: !!localStorage.getItem('user'),
      localStorageToken: !!localStorage.getItem('token')
    });
  };

  // Declarar logout como función para que esté hoisted y evitar advertencias de uso antes de definir
  function logout() {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }

  return (
    <AuthContext.Provider value={{ user, isAdmin, isAuthLoaded, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);