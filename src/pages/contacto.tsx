'use client';

import PageHero from '../components/PageHero';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock, FaWhatsapp } from 'react-icons/fa';

export default function Contacto() {
  const [form, setForm] = useState({ nombre: '', email: '', mensaje: '' });
  const [status, setStatus] = useState<'enviado' | 'error' | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/contacto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus('enviado');
        setForm({ nombre: '', email: '', mensaje: '' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
    setTimeout(() => setStatus(null), 4000);
  };

  return (
    <>
      <PageHero 
        title="Contactanos"
        description="¿Tenés dudas o querés saber más? Escribinos y te responderemos a la brevedad."
      />

      <main className="relative min-h-screen font-roboto">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 gap-12 items-stretch">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-white/80 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-accent/20 p-8 backdrop-blur-sm h-full flex flex-col"
            >
              <h2 className="text-3xl font-lora font-semibold text-primary relative mb-12">
                <span className="relative z-10">Envíanos tu consulta</span>
                <div className="absolute -bottom-4 left-0 w-24 h-1 bg-accent/30 rounded-full"></div>
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6 flex-grow flex flex-col">
                <div className="space-y-2">
                  <label htmlFor="nombre" className="block text-sm font-medium text-primary/90">Nombre completo</label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    className="w-full p-3 rounded-lg border border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30 bg-[#F5F9F8]/90"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-primary/90">Correo electrónico</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full p-3 rounded-lg border border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30 bg-[#F5F9F8]/90"
                    required
                  />
                </div>
                <div className="space-y-2 flex-grow">
                  <label htmlFor="mensaje" className="block text-sm font-medium text-primary/90">Tu mensaje</label>
                  <textarea
                    id="mensaje"
                    name="mensaje"
                    value={form.mensaje}
                    onChange={handleChange}
                    className="w-full h-full min-h-[200px] p-3 rounded-lg border border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30 bg-[#F5F9F8]/90 resize-none"
                    required
                  ></textarea>
                </div>
                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full bg-primary text-white py-3 px-6 rounded-lg hover:bg-primary/90 transition-all font-medium"
                  >
                    Enviar consulta
                  </button>
                </div>
                {status === 'enviado' && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-green-700 bg-green-50 p-4 rounded-lg text-sm"
                  >
                    ✓ Tu mensaje fue enviado con éxito.
                  </motion.p>
                )}
                {status === 'error' && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-700 bg-red-50 p-4 rounded-lg text-sm"
                  >
                    ✕ Ocurrió un error. Intenta nuevamente.
                  </motion.p>
                )}
              </form>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white/80 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-accent/20 p-8 backdrop-blur-sm h-full flex flex-col"
            >
              <h2 className="text-3xl font-lora font-semibold text-primary relative mb-12">
                <span className="relative z-10">Información de contacto</span>
                <div className="absolute -bottom-4 left-0 w-24 h-1 bg-accent/40 rounded-full"></div>
              </h2>

              <div className="space-y-8 flex-grow">
                {[
                  { icon: FaPhone, label: 'Teléfono', value: '(011) 1234-5678' },
                  { icon: FaEnvelope, label: 'Email', value: 'contacto@sentirsebien.com' },
                  { icon: FaMapMarkerAlt, label: 'Dirección', value: 'Av. Bienestar 1234, Buenos Aires' },
                  { icon: FaClock, label: 'Horarios', value: 'Lunes a Viernes de 9 a 18 hs' },
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    className="flex items-center space-x-4 group"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <div className="w-12 h-12 rounded-full bg-[#F5F9F8] flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                      <div className="w-5 h-5 text-primary">
                        <item.icon />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-primary/60">{item.label}</p>
                      <p className="text-lg text-primary">{item.value}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.a
                href="https://wa.me/*************"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex w-full items-center justify-center space-x-2 bg-emerald-500 text-white px-6 py-3 rounded-lg hover:bg-emerald-600 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-5 h-5 text-primary">
                  <FaWhatsapp />
                </div>
                <span className="font-medium">Chatear por WhatsApp</span>
              </motion.a>

              <div className="mt-8 rounded-xl overflow-hidden border border-accent/50 flex-grow">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3282.7923130479853!2d-58.417309384770684!3d-34.60966068046016!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bccb2e3fbd2073%3A0xe2d0f2928e89c561!2sAv.%20Bienestar%201234%2C%20Buenos%20Aires!5e0!3m2!1ses!2sar!4v1713300000000"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="grayscale hover:grayscale-0 transition-all duration-500"
                ></iframe>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </>
  );
}
