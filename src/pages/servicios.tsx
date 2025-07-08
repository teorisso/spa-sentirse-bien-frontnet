'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { IService } from '@/types';
import PageHero from '@/components/PageHero';
import Servicios from '@/components/Servicios';
import ServicioModal from '@/components/admin/ServicioModal';
import ReservaModal from '@/components/ReservaModal'; // Import ReservaModal
import { toast } from 'react-hot-toast'; // Import toast
import { useRouter } from 'next/router'; // Import useRouter
import { Plus } from 'lucide-react'; // Import Plus icon

export default function ServiciosPage() {
  const [services, setServices] = useState<IService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawData, setRawData] = useState(null);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const router = useRouter(); // Initialize useRouter

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<IService | null>(null);

  // State for ReservaModal
  const [isReservaModalOpen, setIsReservaModalOpen] = useState(false);
  // const [serviceToReserve, setServiceToReserve] = useState<IService | null>(null); // Optional: if you want to pre-select service in modal

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_SERVICE}`);
        if (!res.ok) {
          const errorData = await res.text();
          try {
            const parsedError = JSON.parse(errorData);
            throw new Error(parsedError.message || 'Error al cargar servicios');
          } catch (e) {
            throw new Error(errorData || 'Error al cargar servicios');
          }
        }
        const data = await res.json();
        setServices(data);
        setRawData(data); // Store raw data for debugging
      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : 'No se pudieron cargar los servicios');
        toast.error(err instanceof Error ? err.message : 'No se pudieron cargar los servicios');
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const handleEditService = (service: IService | null) => {
  if (!isAdmin) return;
  setSelectedService(service);
  setIsModalOpen(true);
};

  const handleDeleteService = async (id: string) => {
    if (!isAdmin || !confirm('¿Estás seguro de que deseas eliminar este servicio?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_SERVICE}/delete/${id}?token=${token}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar el servicio');
      }
      toast.success('Servicio eliminado con éxito');
      setServices(services.filter(s => s._id !== id));
    } catch (err) {
      console.error('Error:', err);
      toast.error(err instanceof Error ? err.message : 'Error al eliminar el servicio');
    }
  };

  const handleSaveService = async (serviceData: Omit<IService, '_id' | 'Image'> & { Image?: string }) => {
    if (!isAdmin) return;
    const method = selectedService ? 'PUT' : 'POST';
    const url = selectedService
      ? `${process.env.NEXT_PUBLIC_API_SERVICE}/edit/${selectedService._id}`
      : `${process.env.NEXT_PUBLIC_API_SERVICE}/create`;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${url}?token=${token}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al guardar el servicio');
      }
      const savedService = await response.json();
      if (selectedService) {
        setServices(services.map(s => (s._id === savedService._id ? savedService : s)));
        toast.success('Servicio actualizado con éxito');
      } else {
        setServices([...services, savedService]);
        toast.success('Servicio creado con éxito');
      }
      setIsModalOpen(false);
      setSelectedService(null);
    } catch (err) {
      console.error('Error:', err);
      toast.error(err instanceof Error ? err.message : 'Error al guardar el servicio');
    }
  };

  const handleOpenReservaModal = (service: IService) => {
    // setServiceToReserve(service); // Optional: if you want to pass the service to the modal
    if (!user) {
      toast.error('Debes iniciar sesión para reservar un turno.');
      router.push('/login');
      return;
    }
    setIsReservaModalOpen(true);
  };

  const handleReservaSuccess = () => {
    setIsReservaModalOpen(false);
    // toast.success('Turno reservado con éxito! Redirigiendo a Mis Turnos...'); // Toast is handled inside ReservaModal
    router.push('/turnos');
  };

  return (
    <>
      <PageHero
        title="Nuestros Servicios"
        description="Descubre la variedad de tratamientos que ofrecemos para tu bienestar."
      />
      {loading && (
        <div className="flex flex-col items-center mt-10 p-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
          <p className="text-lg text-primary">Cargando servicios...</p>
        </div>
      )}
      {error && !loading && (
        <div className="text-center mt-10 p-4 bg-red-50 text-red-700 rounded-md max-w-2xl mx-auto">
          <p className="font-semibold">Error al cargar los servicios:</p>
          <p>{error}</p>
          <details className="mt-4 text-left text-xs text-gray-600">
            <summary className="cursor-pointer">Detalles técnicos</summary>
            <pre className="mt-2 overflow-auto p-2 bg-gray-100">{JSON.stringify(rawData, null, 2)}</pre>
          </details>
        </div>
      )}
      {!loading && !error && services.length > 0 && (
        <Servicios 
          services={services} 
          isAdmin={isAdmin}
          onEdit={handleEditService}
          onDelete={handleDeleteService}
          onReservarClick={handleOpenReservaModal} // Pass the handler
        />
      )}
      {!loading && !error && services.length === 0 && (
        <div className="text-center mt-10 p-4">
          <p className="text-amber-600">No hay servicios disponibles actualmente.</p>
          {isAdmin && (
             <button
                onClick={() => { setSelectedService(null); setIsModalOpen(true); }}
                className="flex items-center space-x-2 bg-primary text-white px-4 py-3 rounded-lg shadow-sm hover:bg-primary/90 transition-colors mt-4"
              >
                <Plus className="h-5 w-5" />
                <span>Agregar servicio</span>
              </button>
          )}
        </div>
      )}
      
      {isAdmin && (
        <ServicioModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedService(null);
          }}
          servicio={selectedService || undefined}
          onSave={handleSaveService}
        />
      )}

      {/* Add ReservaModal */}
      <ReservaModal
        isOpen={isReservaModalOpen}
        onClose={() => setIsReservaModalOpen(false)}
        onSuccess={handleReservaSuccess}
        // selectedService={serviceToReserve} // Optional: if you want to pre-select
      />
    </>
  );
}