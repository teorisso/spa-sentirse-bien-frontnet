'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react'; // Agregar useEffect
import { IService } from '../types';

interface ServiciosProps {
  services: IService[];
  isAdmin?: boolean;
  onEdit?: (service: IService | null) => void;  // Cambiado para aceptar null
  onDelete?: (id: string) => void;
  onReservarClick?: (service: IService) => void;
}

export default function Servicios({ services, isAdmin, onEdit, onDelete, onReservarClick }: ServiciosProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Calcular rango de precios dinámicamente basado en los servicios
  const getPriceRange = () => {
    if (!services || services.length === 0) return { min: 0, max: 60000 };
    
    const prices = services
      .map(service => Number(service.precio))
      .filter(price => !isNaN(price) && price > 0);
    
    if (prices.length === 0) return { min: 0, max: 60000 };
    
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    };
  };
  
  const dynamicPriceRange = getPriceRange();
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>(dynamicPriceRange);

  // Actualizar el rango cuando cambien los servicios
  useEffect(() => {
    const newRange = getPriceRange();
    setPriceRange(newRange);
  }, [services]);

  // ✅ Validación: si services es undefined o no es array, mostramos mensaje de error
  if (!services || !Array.isArray(services)) {
    return (
      <div className="text-center mt-10 text-red-500">
        No se pudieron cargar los servicios. Intenta más tarde.
      </div>
    );
  }

  console.log('Todos los servicios recibidos:', services);
  console.log('Rango dinámico de precios:', dynamicPriceRange);
  const categoriasUnicas = Array.from(new Set(services.map(s => s.tipo))).filter(Boolean);
  console.log('Categorías únicas encontradas:', categoriasUnicas);

  const servicesGroupedByCategory = services.reduce((acc: Record<string, IService[]>, service) => {
    const category = service.tipo.trim();
    console.log('Procesando servicio:', service.nombre, 'con categoría:', category);
    if (!acc[category]) acc[category] = [];
    acc[category].push(service);
    return acc;
  }, {});

  console.log('Servicios agrupados por categoría:', servicesGroupedByCategory);
  
  const filtered = Object.entries(servicesGroupedByCategory).map(([category, items]) => ({
    category,
    services: items.filter(service => {
      const price = Number(service.precio);
      console.log('Filtrando servicio:', service.nombre, 'categoría:', category, 'precio:', price, 'rango:', priceRange);
      const matchesCategory = !selectedCategory || selectedCategory === category;
      const matchesPrice = !isNaN(price) && price >= priceRange.min && price <= priceRange.max;
      return matchesCategory && matchesPrice;
    }),
  }));

  console.log('Servicios filtrados:', filtered);

  return (
    <main className="relative min-h-screen font-roboto">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex flex-col md:flex-row gap-8">

           <div className="md:w-64 w-full bg-white/80 rounded-3xl shadow-lg p-6 h-fit backdrop-blur-sm border border-accent/20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-lora font-semibold text-primary">Filtrar por</h3>
              {(selectedCategory || priceRange.max < dynamicPriceRange.max) && (
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setPriceRange(dynamicPriceRange); // Resetear al rango dinámico completo
                  }}
                  className="text-sm text-accent hover:text-accent/80 transition-colors"
                >
                  Limpiar filtros
                </button>
              )}
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-medium text-primary/80 mb-2">Categoría</h4>
              <div className="space-y-2">
                {categoriasUnicas.map(category => (
                  <label key={category} className="flex items-center space-x-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === category}
                      onChange={() =>
                        setSelectedCategory(selectedCategory === category ? null : category)
                      }
                      className="text-accent focus:ring-accent cursor-pointer"
                    />
                    <span className="text-sm group-hover:text-accent transition-colors">{category}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-primary/80 mb-2">Rango de Precio</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span>${priceRange.min}</span>
                  <span>${priceRange.max}</span>
                </div>
                <label htmlFor="price-range-slider" className="sr-only">Ajustar precio máximo</label>
                <input
                  id="price-range-slider"
                  type="range"
                  min={dynamicPriceRange.min}
                  max={dynamicPriceRange.max}
                  step="500"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) })}
                  className="w-full accent-accent"
                  aria-label="Ajustar precio máximo"
                  title="Desliza para ajustar el precio máximo"
                />
              </div>
            </div>
          </div>

          <div className="flex-1">
            {isAdmin && (
              <div className="flex justify-end mb-6">
                <button 
                  onClick={() => onEdit?.(null)}  // Pasar un objeto vacío para indicar creación nueva
                  className="bg-primary text-white py-3 px-8 rounded-lg shadow-sm hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                  Agregar Servicio +
                </button>
              </div>
            )}
            {/* Ajustado el grid para mostrar menos tarjetas por fila en pantallas medianas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
              {filtered.flatMap(({ category, services }) =>
                services.map((service, idx) => {
                  console.log('Servicio:', service.nombre, 'Image:', service.Image);
                  return (
                    <motion.div
                      key={`${category}-${idx}`}
                      className="flex flex-col w-full max-w-[260px] mx-auto bg-white shadow-md hover:shadow-xl rounded-3xl group transition-all duration-300 backdrop-blur-sm border border-gray-200/60 overflow-hidden"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: idx * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <div className="p-2 pb-0">
                        <div className="rounded-3xl overflow-hidden border border-gray-300 shadow-sm">
                          <figure className="w-full aspect-square relative">
                            <Image
                              src={service.Image || '/default-service.jpg'}
                              alt={service.nombre}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" 
                              priority={idx < 3}
                            />
                          </figure>
                        </div>
                      </div>
                      
                      <div className="p-4 pt-2 flex flex-col flex-grow">
                        <h2 className="text-md font-lora font-semibold text-gray-700 mb-1" title={service.nombre}>
                          {service.nombre}
                        </h2>
                        
                        <p className="text-xs text-gray-500 mb-2 line-clamp-2"> 
                          {service.descripcion}
                        </p>

                        <p className="text-[10px] uppercase font-medium text-gray-500 mb-2">
                          {service.tipo || 'General'}
                        </p>
                        
                        {/* Contenedor para precio y botón */}
                        <div className="mt-auto flex justify-between items-center pt-2"> 
                          <p className="text-lg text-gray-700">
                            ${service.precio}
                          </p>
                          
                          {!isAdmin && (
                            <button 
                              onClick={() => onReservarClick?.(service)}
                              className="bg-primary text-white font-medium py-1.5 px-4 rounded-lg shadow-sm hover:bg-primary/90 transition-colors text-xs"
                            >
                              Reservar
                            </button>
                          )}
                        </div>
                        
                        {isAdmin && (
                            <div className="mt-auto flex justify-end space-x-3 pt-2">
                              <button 
                                onClick={() => onEdit?.(service)}
                                className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors px-2 py-1 rounded-full hover:bg-gray-100"
                                title="Editar servicio"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                  <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                                </svg>
                                <span>Editar</span>
                              </button>
                              <button 
                                onClick={() => onDelete?.(service._id)}
                                className="flex items-center gap-1 text-xs text-gray-500 hover:text-primary/60 transition-colors px-2 py-1 rounded-full hover:bg-gray-100"
                                title="Eliminar servicio"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                  <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z"/>
                                  <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z"/>
                                </svg>
                                <span>Eliminar</span>
                              </button>
                            </div>
                          )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

