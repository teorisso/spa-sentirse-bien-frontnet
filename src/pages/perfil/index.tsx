'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import PageHero from '@/components/PageHero';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import UsuarioModal from '@/components/admin/UsuarioModal';

export default function ProfilePage() {
    const router = useRouter();
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        // campos solo vistos antes, ya no necesarios
    });

    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    const handleProfileSaved = () => {
        toast.success('Perfil actualizado');
        // Refrescar datos locales con los nuevos valores
        setFormData(prev => ({
            ...prev,
            firstName: user?.first_name || prev.firstName,
            lastName: user?.last_name || prev.lastName,
            email: user?.email || prev.email
        }));
    };

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                firstName: user.first_name || '',
                lastName: user.last_name || '',
                email: user.email || ''
            }));
        } else {
            router.push('/login');
        }
    }, [user, router]);

    if (!user) {
        return null;
    }

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_USER}/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    email: formData.email
                })
            });

            if (!res.ok) {
                throw new Error('Error al actualizar el perfil');
            }

            toast.success('Perfil actualizado correctamente');
        } catch (error) {
            toast.error('Error al actualizar el perfil');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <PageHero
                title="Mi Perfil"
                description="Gestiona tu información personal y contraseña"
            />

            <main className="bg-white font-roboto py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                    <motion.div 
                        className="grid md:grid-cols-1 gap-8"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        {/* Datos personales */}
                        <motion.div 
                            className="bg-[#F5F9F8] rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-accent/20 p-8 backdrop-blur-sm"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                                    <User className="w-5 h-5 text-primary" />
                                </div>
                                <h2 className="text-2xl font-lora font-semibold text-primary relative">
                                    <span className="relative z-10">Información Personal</span>
                                    <div className="absolute -bottom-2 left-0 w-20 h-1 bg-accent/30 rounded-full"></div>
                                </h2>
                            </div>

                            {/* Mostrar datos básicos y botón editar */}
                            <div className="space-y-4 mb-4 text-primary/90">
                                <p><strong>Nombre:</strong> {user.first_name}</p>
                                <p><strong>Apellido:</strong> {user.last_name}</p>
                                <p><strong>Email:</strong> {user.email}</p>
                            </div>

                            <button
                                onClick={openModal}
                                className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-all"
                            >
                                Editar Perfil
                            </button>

                            {/* Antiguo formulario, opcional, se puede eliminar más tarde */}
                            {/*
                            <form onSubmit={handleUpdateProfile} className="space-y-5 hidden">
                                <div className="space-y-2">
                                    ...
                                </div>
                            </form>*/}
                        </motion.div>

                        {/* Sección de cambio de contraseña eliminada: ahora se maneja desde el modal */}
                    </motion.div>
                </div>

                {/* Modal de edición de perfil */}
                {isModalOpen && (
                    <UsuarioModal
                        isOpen={isModalOpen}
                        onClose={closeModal}
                        usuario={user}
                        onSave={() => {
                            handleProfileSaved();
                            closeModal();
                        }}
                    />
                )}
            </main>
        </>
    );
}