'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Facebook, Instagram, MapPin, Phone, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Footer() {
  return (
    <footer className="bg-primary text-soft py-12 font-roboto w-full relative overflow-hidden">
      <div className="w-full px-4 max-w-6xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 text-center items-start">
          <motion.div
            className="flex flex-col items-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <Image
              src="/images/logo.png"
              alt="Logo Sentirse Bien"
              width={70}
              height={70}
              className="rounded-full border-2 border-accent shadow-lg mb-3 hover:shadow-xl transition-shadow duration-300"
            />
            <h2 className="text-lg font-lora font-bold mt-1 tracking-tight text-accent">
              SPA <span className="italic font-normal text-soft">Sentirse Bien</span>
            </h2>
            <p className="text-xs italic text-soft/80">Dra. Ana Felicidad</p>
          </motion.div>

          <motion.div
            className="flex flex-col items-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h3 className="text-base font-lora font-semibold mb-4 text-accent">Accesos rápidos</h3>
            <ul className="space-y-2 text-sm">
              {[
                { href: '/', label: 'Inicio' },
                { href: '/servicios', label: 'Servicios' },
                { href: '/turnos', label: 'Mis Turnos' },
                { href: '/contacto', label: 'Contacto' }
              ].map((link, index) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Link
                    href={link.href}
                    className="relative px-1 py-0.5 transition-all duration-300 text-soft2 hover:text-accent
                      before:content-[''] before:absolute before:left-0 before:-bottom-0.5 before:w-0 before:h-[2px]
                      before:bg-accent before:transition-all before:duration-300
                      hover:before:w-full"
                  >
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            className="flex flex-col items-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h3 className="text-base font-lora font-semibold mb-4 text-accent">Contacto</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center justify-center gap-2 text-soft2">
                <MapPin className="w-4 h-4 text-accent flex-shrink-0" />
                <span className="break-words">Av. Siempreviva 742</span>
              </li>
              <li className="flex items-center justify-center gap-2 text-soft2">
                <Phone className="w-4 h-4 text-accent flex-shrink-0" />
                <span>+54 11 1234-5678</span>
              </li>
              <li className="flex items-center justify-center gap-2 text-soft2">
                <Mail className="w-4 h-4 text-accent flex-shrink-0" />
                <span className="break-words">info@sentirsebien.com</span>
              </li>
            </ul>
          </motion.div>

          <motion.div
            className="flex flex-col items-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <h3 className="text-base font-lora font-semibold mb-4 text-accent">Seguinos</h3>
            <div className="flex gap-4 justify-center">
              <motion.a
                href="https://www.instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-full p-2 transition-all duration-300 hover:bg-accent/30"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Seguinos en Instagram"
              >
                <Instagram className="w-6 h-6 group-hover:text-accent transition-colors duration-300" />
              </motion.a>
              <motion.a
                href="https://www.facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-full p-2 transition-all duration-300 hover:bg-accent/30"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Seguinos en Facebook"
              >
                <Facebook className="w-6 h-6 group-hover:text-accent transition-colors duration-300" />
              </motion.a>
            </div>
          </motion.div>
        </div>

        <motion.div
          className="border-t border-accent/30 mt-12 pt-6 text-center text-xs text-soft/80"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
        >
          © {new Date().getFullYear()} Sentirse Bien. Todos los derechos reservados.
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0] pointer-events-none">
        <svg
          className="relative block w-[calc(150%+1.3px)] h-[80px]"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            fill="#F5F9F8"
            d="M0,40 Q360,80 720,40 T1440,40 L1440,80 L0,80 Z"
          />
        </svg>
        <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-b from-[#F5F9F8]/0 to-[#F5F9F8] pointer-events-none" />
      </div>
    </footer>
  );
}