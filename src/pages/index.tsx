'use client';

import Hero from '../components/Hero';
import ServicesSlider from '../components/Categorias';
import { motion } from 'framer-motion';
import { Leaf} from 'lucide-react';

export default function HomePage() {
  return (
    <div>
      <Hero />

      <section className="relative z-20 py-16 px-4 bg-white text-center">
        <div className="max-w-3xl mx-auto relative">
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-accent/10 rounded-full blur-xl"></div>
          <p className="text-[#436E6C] text-lg md:text-xl font-light font-roboto leading-relaxed">
            En <span className="font-semibold">Sentirse Bien</span> buscamos atraer la atención de nuestros clientes a 
            través de experiencias inspiradas en la seducción de los sentidos. Adaptamos las propuestas con el objetivo de que logre
            desconectarse completamente de la rutina y disfrute de un momento de bienestar, en total armonía con la naturaleza.
            <br className="hidden md:block" />
            En respuesta al crecimiento del spa, ahora podés reservar turnos de forma más cómoda y organizada a través de nuestra nueva plataforma web.
          </p>
          <div className="flex justify-center items-center gap-3 my-12">
            <span className="w-2.5 h-2.5 rounded-full bg-accent/60 animate-pulse"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-accent/40 animate-pulse delay-150"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-accent/60 animate-pulse delay-300"></span>
          </div>
        </div>
      </section>

      <section className="pt-16 pb-20 px-4 bg-gradient-to-b from-white via-white to-[#F5F9F8] relative overflow-hidden">
        <h2 className="text-4xl font-lora font-bold text-center mb-16 text-primary relative">
          <span className="relative z-10">¿Por qué elegirnos?</span>
          <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-accent/30 rounded-full"></div>
        </h2>
        <div className="flex flex-col md:flex-row gap-8 max-w-5xl mx-auto justify-center items-stretch relative z-10">
          <motion.div 
            className="flex-1 bg-white rounded-3xl p-10 flex flex-col items-center justify-center shadow-lg border-b-4 border-accent/30 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="w-12 h-12 rounded-full bg-accent/20 mb-6 flex items-center justify-center group-hover:bg-accent/30 transition-colors">
              <Leaf className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-lora font-semibold mb-3 text-primary">Ambiente único</h3>
            <p className="text-base font-roboto text-primary/80">Diseñado para tu desconexión. Luces cálidas, música suave y aromas relajantes.</p>
          </motion.div>
          <motion.div 
            className="flex-1 bg-white rounded-3xl p-10 flex flex-col items-center justify-center shadow-lg border-b-4 border-accent/30 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <div className="w-12 h-12 rounded-full bg-accent/20 mb-6 flex items-center justify-center group-hover:bg-accent/30 transition-colors">
              <Leaf className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-lora font-semibold mb-3 text-primary">Profesionales certificados</h3>
            <p className="text-base font-roboto text-primary/80">Todo nuestro equipo está altamente capacitado para garantizar tu bienestar.</p>
          </motion.div>
          <motion.div 
            className="flex-1 bg-white rounded-3xl p-10 flex flex-col items-center justify-center shadow-lg border-b-4 border-accent/30 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="w-12 h-12 rounded-full bg-accent/20 mb-6 flex items-center justify-center group-hover:bg-accent/30 transition-colors">
              <Leaf className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-lora font-semibold mb-3 text-primary">Resultados comprobables</h3>
            <p className="text-base font-roboto text-primary/80">Miles de clientes satisfechos y transformados desde 2022.</p>
          </motion.div>
        </div>
      </section>

      <ServicesSlider />

      <section className="pt-16 pb-20 px-6 bg-gradient-to-b from-[#F5F9F8] to-white font-roboto text-dark text-center relative overflow-hidden">
        <div className="relative">
          <div className="absolute inset-0 bg-gray-100 opacity-5"></div>
          <h2 className="text-3xl italic font-bold mb-12 font-lora text-primary relative">
            <span className="relative z-10">Lo que dicen nuestros clientes</span>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-accent/30 rounded-full"></div>
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto relative z-10">
          <motion.div
            className="bg-white rounded-2xl p-8 shadow-lg border border-soft2 italic hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="w-8 h-8 mb-4 mx-auto">
              <svg className="w-full h-full text-accent/40" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
            </div>
            <p className="text-base mb-4 font-lora">"Una experiencia mágica. Salí flotando. Volveré sin dudas."</p>
            <p className="text-xs font-semibold text-primary font-lora">— Carla M., 32 años</p>
          </motion.div>
          <motion.div
            className="bg-white rounded-2xl p-8 shadow-lg border border-soft2 italic hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <div className="w-8 h-8 mb-4 mx-auto">
              <svg className="w-full h-full text-accent/40" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
            </div>
            <p className="text-base mb-4 font-lora">"El masaje con piedras calientes me cambió el ánimo. 100% recomendable."</p>
            <p className="text-xs font-semibold text-primary font-lora">— Lucía P., 40 años</p>
          </motion.div>
          <motion.div
            className="bg-white rounded-2xl p-8 shadow-lg border border-soft2 italic hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <div className="w-8 h-8 mb-4 mx-auto">
              <svg className="w-full h-full text-accent/40" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
            </div>
            <p className="text-base mb-4 font-lora">"Todo está pensado para relajar. Hasta los aromas."</p>
            <p className="text-xs font-semibold text-primary font-lora">— Eugenia R., 28 años</p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

