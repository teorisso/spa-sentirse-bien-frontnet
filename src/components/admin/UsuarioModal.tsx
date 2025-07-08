import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { X, User, Mail, Lock, Shield, Save } from 'lucide-react';
import { IUser, IUserBase } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useRouter } from 'next/navigation';
import { authApi } from '@/utils/apiAdapter';

interface UsuarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  usuario?: IUser | null; // Opcional: presente en edición, ausente en creación
  onSave: () => void;
}

export default function UsuarioModal({ isOpen, onClose, usuario, onSave }: UsuarioModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<IUserBase & { _id?: string }>({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'cliente',
    is_admin: false
  });
  const [showPassword, setShowPassword] = useState(false);

  // Saber si el usuario autenticado es admin
  const { isAdmin, login, user: authUser } = useAuth();
  const router = useRouter();

  // Reset form when modal opens/closes o cambia el usuario
  useEffect(() => {
    if (isOpen) {
      if (usuario) {
        // Modo edición
        setFormData({
          _id: usuario._id,
          first_name: usuario.first_name,
          last_name: usuario.last_name,
          email: usuario.email,
          role: usuario.role,
          is_admin: usuario.is_admin,
          password: '' // No pre-llenar contraseña por seguridad
        });
      } else {
        // Modo creación: campos vacíos
        setFormData({
          first_name: '',
          last_name: '',
          email: '',
          role: 'cliente',
          is_admin: false,
          password: ''
        });
      }
    }
  }, [isOpen, usuario]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateForm = (): boolean => {
    if (!formData.first_name.trim()) {
      toast.error('El nombre es requerido');
      return false;
    }
    if (!formData.last_name.trim()) {
      toast.error('El apellido es requerido');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('El email es requerido');
      return false;
    }
    if (!formData.email.match(/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/)) {
      toast.error('Ingresa un email válido');
      return false;
    }
    if (!usuario && formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    if (usuario && formData.password && formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Determinar si la acción requiere autenticación (editar o admin creando)
      const isEditMode = !!usuario;
      const requiresAuth = isEditMode || isAdmin;

      let token: string | null = null;
      if (requiresAuth) {
        token = localStorage.getItem('token');
        if (!token) {
          toast.error('No se encontró token de autenticación');
          return;
        }
      }

      let result: any;

      if (isEditMode) {
        // MODO EDICIÓN - Usar la API anterior por ahora
        const dataToSend: any = {
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          email: formData.email.trim(),
          role: isAdmin ? formData.role : 'cliente',
          is_admin: isAdmin ? formData.is_admin : false
        };

        if (formData.password) {
          dataToSend.password = formData.password;
        }

        const url = `${process.env.NEXT_PUBLIC_API_USER}/${usuario!._id}?token=${token}`;
        
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(dataToSend)
        });

        if (!response.ok) {
          const errorData = await response.text();
          let errorMessage = 'Error al procesar la solicitud';
          
          try {
            const parsed = JSON.parse(errorData);
            errorMessage = parsed.message || errorMessage;
          } catch {
            if (errorData.includes('duplicate key error') || errorData.includes('email')) {
              errorMessage = 'Este email ya está registrado';
            }
          }
          
          throw new Error(errorMessage);
        }

        result = await response.json();
      } else {
        // MODO CREACIÓN - Usar la nueva API ASP.NET
        const registerData = {
          firstName: formData.first_name.trim(),
          lastName: formData.last_name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: isAdmin ? formData.role : 'cliente'
        };

        result = await authApi.register(registerData);
        
        // Si es un registro normal (no admin), logear automáticamente
        if (!isAdmin && result.token && result.user) {
          await login(result.token, result.user);
        }
      }
      
      // Si el usuario está editando su propio perfil, actualizar AuthContext
      if (isEditMode && authUser && result._id === authUser._id) {
        const storedToken = localStorage.getItem('token') || '';
        login(storedToken, result);
      }

      toast.success(isEditMode ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente');
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Manejo del registro/login con Google - TEMPORALMENTE DESHABILITADO
  async function handleGoogleRegister(cred: CredentialResponse) {
    toast.error('Google OAuth temporalmente no disponible. Use el formulario de registro.');
    
    /* TODO: Implementar Google OAuth en la API ASP.NET
    try {
      if (!cred.credential) return;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_AUTH}/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token: cred.credential }),
      });

      const data = await res.json();

      if (res.ok) {
        // guardar sesión
        await login(data.token, data.user);
        toast.success('Registro e inicio de sesión con Google exitoso');
        onSave();
        onClose();
        router.push('/');
      } else {
        toast.error(data.message || 'Error con Google');
      }
    } catch (error) {
      console.error('Google register error', error);
      toast.error('Error interno de Google');
    }
    */
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <User className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-lora font-semibold text-primary">
                {usuario ? 'Editar Usuario' : 'Crear Usuario'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Cerrar modal"
              title="Cerrar modal"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre *
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                placeholder="Ingresa el nombre"
                required
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Apellido *
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                placeholder="Ingresa el apellido"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="usuario@email.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {usuario ? 'Nueva Contraseña (opcional)' : 'Contraseña *'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder={usuario ? 'Dejar vacío para mantener actual' : 'Ingresa la contraseña'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Role y privilegios solo para administradores */}
            {isAdmin && (
              <>
                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rol *
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent appearance-none"
                      required
                      aria-label="Seleccionar rol de usuario"
                      title="Seleccionar rol de usuario"
                    >
                      <option value="cliente">Cliente</option>
                      <option value="profesional">Profesional</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                </div>

                {/* Is Admin Checkbox */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_admin"
                    name="is_admin"
                    checked={formData.is_admin}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-accent focus:ring-accent border-gray-300 rounded"
                  />
                  <label htmlFor="is_admin" className="text-sm font-medium text-gray-700">
                    Privilegios de administrador
                  </label>
                </div>
              </>
            )}

            {/* Submit Button */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>{usuario ? 'Actualizar' : 'Crear'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Separador y Google login solo para modo creación y usuarios no-admin */}
            {!isAdmin && !usuario && (
              <>
                <div className="my-4 text-center text-sm text-gray-500">o registra con</div>
                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleRegister}
                    onError={() => toast.error('Falló el registro con Google')}
                    useOneTap
                  />
                </div>
              </>
            )}
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}