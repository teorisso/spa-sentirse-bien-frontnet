'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';
import ReservaModal from './ReservaModal';

export default function Hero() {
  const [isReservaModalOpen, setIsReservaModalOpen] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const handleReservaClick = () => {
    if (!user) {
      toast.error('Debes iniciar sesión para reservar un turno.');
      router.push('/login');
      return;
    }
    setIsReservaModalOpen(true);
  };

  const handleReservaSuccess = () => {
    setIsReservaModalOpen(false);
    // Redirigir a la página de turnos después de reservar exitosamente
    router.push('/turnos');
  };

  return (
    <>
      <section
        className="relative h-[80vh] flex items-center justify-center font-roboto text-center bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/hero.png')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-primary/50 to-primary/40 backdrop-blur-[2px]"></div>
        <motion.div 
          className="relative z-10 max-w-4xl px-4 mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h2 
            className="text-4xl md:text-6xl italic font-semibold font-lora text-white mb-6 drop-shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Tu refugio de serenidad te espera
          </motion.h2>
          <motion.p 
            className="text-white text-lg md:text-xl font-light mb-8 drop-shadow"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Vive la experiencia de un descanso profundo para el alma.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <button 
              onClick={handleReservaClick}
              className="inline-block px-10 py-4 bg-primary text-white rounded-2xl shadow-lg text-lg hover:bg-primary/80 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              Reservá tu turno
            </button>
          </motion.div>
        </motion.div>
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] pointer-events-none">
          <svg
            className="relative block w-[calc(150%+1.3px)] h-[120px]"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="svg-fade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
                <stop offset="60%" stopColor="#ffffff" stopOpacity="0.2" />
                <stop offset="80%" stopColor="#ffffff" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
              </linearGradient>
            </defs>
            <path
              fill="url(#svg-fade)"
              d="M0,64L48,69.3C96,75,192,85,288,85.3C384,85,480,75,576,64C672,53,768,43,864,53.3C960,64,1056,96,1152,90.7C1248,85,1344,43,1392,21.3L1440,0L1440,120L0,120Z"
            />
          </svg>
          <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-b from-[#ffffff]/0 to-[#ffffff] pointer-events-none" />
        </div>
      </section>

      {/* Modal de Reserva */}
      <ReservaModal
        isOpen={isReservaModalOpen}
        onClose={() => setIsReservaModalOpen(false)}
        onSuccess={handleReservaSuccess}
      />
    </>
  );
}
