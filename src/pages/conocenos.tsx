'use client';

import PageHero from '../components/PageHero';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function ConocenosPage() {
  return (
    <>
      <PageHero 
        title="Conócenos"
        description="Sumérgete en la historia de Sentirse Bien y descubre la pasión que nos mueve día a día."
      />

      <main className="bg-white font-roboto">
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative w-full h-[300px] md:h-[400px] rounded-xl overflow-hidden shadow-lg"
            >
              <Image
                src="/images/spa_interior.png"
                alt="Interior del spa"
                fill
                style={{ objectFit: 'cover' }}
                className="rounded-xl"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="space-y-6 text-[#436E6C]"
            >
              <h2 className="text-3xl font-semibold text-[#436E6C]">Nuestra historia</h2>
              <p className="text-lg leading-relaxed">
                Fundado por la Dra. Ana Felicidad, <span className="font-semibold">Sentirse Bien</span> nació en 2022
                como un refugio de paz en el corazón de la ciudad. Desde entonces hemos crecido
                incorporando nuevas terapias y formando un equipo de profesionales dedicados a tu bienestar.
              </p>
              <p className="text-lg leading-relaxed">
                Con una filosofía centrada en la armonía cuerpo-mente, cada tratamiento está diseñado
                para ayudarte a desconectarte de la rutina y reconectar con tu equilibrio interior.
              </p>
            </motion.div>
          </div>
        </section>
        
        <section className="py-16 px-4 bg-[#F5F9F8]">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-semibold text-[#436E6C] text-center mb-12">Nuestros Pilares</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-xl shadow-md border border-[#B6D5C8]"
              >
                <h3 className="text-2xl font-semibold text-[#436E6C] mb-4">Nuestra Misión</h3>
                <p className="text-[#436E6C] leading-relaxed">
                  Brindar experiencias de bienestar físico y emocional, en un entorno sereno y seguro,
                  que fomenten la armonía y la renovación del cuerpo.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-xl shadow-md border border-[#B6D5C8]"
              >
                <h3 className="text-2xl font-semibold text-[#436E6C] mb-4">Nuestra Visión</h3>
                <p className="text-[#436E6C] leading-relaxed">
                  Ser reconocidos como el spa líder en calidad y calidez, donde cada visitante
                  sienta un antes y un después tras su visita.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-xl shadow-md border border-[#B6D5C8]"
              >
                <h3 className="text-2xl font-semibold text-[#436E6C] mb-4">Nuestros Valores</h3>
                <ul className="space-y-2 text-[#436E6C]">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-[#436E6C] rounded-full mr-2"></span>
                    Profesionalismo
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-[#436E6C] rounded-full mr-2"></span>
                    Compromiso
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-[#436E6C] rounded-full mr-2"></span>
                    Respeto
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-[#436E6C] rounded-full mr-2"></span>
                    Calidad
                  </li>
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Sección de Desarrollo y Equipo (versión discreta) */}
        <section className="py-8 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center text-[#436E6C] space-y-4"
          >
            <h3 className="text-xl font-semibold">OpenDevs – Desarrollo de la Web</h3>
            <p className="text-sm leading-relaxed">
              Desarrollado por <span className="font-semibold">Risso</span>, <span className="font-semibold">Teo</span> y
              <span className="font-semibold"> Grosso Gina</span>; estudiantes de <span className="font-semibold">Tecnicatura Universitaria en Programación </span>
               (UTN – Facultad Regional Resistencia).
            </p>
            <p className="text-xs text-[#436E6C]/80">
              Tecnologías: Next.js, React + TypeScript, Tailwind CSS, Framer Motion, Node.js &amp; Express, MongoDB, JWT.
            </p>
          </motion.div>
        </section>
      </main>
    </>
  );
}
