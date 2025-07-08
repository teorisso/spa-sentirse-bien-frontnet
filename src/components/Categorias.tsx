'use client';

import Image from 'next/image';
import Link from 'next/link';

const services = [
  {
    category: 'Masajes',
    image: '/images/masajes.png',
    anchor: 'masajes',
  },
  {
    category: 'Belleza',
    image: '/images/belleza.png',
    anchor: 'belleza',
  },
  {
    category: 'Tratamientos Corporales',
    image: '/images/corporales.png',
    anchor: 'tratamientoscorporales',
  },
  {
    category: 'Tratamientos Faciales',
    image: '/images/faciales.png',
    anchor: 'tratamientosfaciales',
  },
  {
    category: 'Servicios Grupales',
    image: '/images/grupales.png',
    anchor: 'tratamientosgrupales',
  },
];

export default function Categorias() {
  return (
    <section className="py-16 px-4 bg-soft font-roboto text-primary">
      <h2 className="text-4xl font-lora font-bold text-center mb-14 tracking-tight">Categorías</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10 max-w-7xl mx-auto">
        {services.map((service) => (
          <div
            key={service.category}
            className="group border border-accent/30 bg-white/60 shadow-lg hover:shadow-2xl transition-all duration-300 p-7 flex flex-col items-center text-center h-full rounded-[2.5rem] backdrop-blur-lg"
          >
            <div className="overflow-hidden rounded-3xl mb-5 w-[140px] h-[140px] shadow-lg group-hover:shadow-xl transition">
              <Image
                src={service.image}
                alt={service.category}
                width={140}
                height={140}
                className="object-cover w-full h-full group-hover:scale-105 transition duration-300"
              />
            </div>
            <h3 className="text-lg font-roboto font-semibold mb-4">{service.category}</h3>
            <div className="flex-grow" />
            <Link href={{ pathname: '/servicios', hash: service.anchor }} className="w-full flex justify-center">
              <button className="px-6 py-2 rounded-full border border-primary bg-white/80 text-primary font-roboto shadow-sm hover:bg-primary hover:text-white transition-all duration-200 mt-auto">
                Ver más
              </button>
            </Link>
          </div>
        ))}
      </div>
      <div className="w-full h-10 bg-gradient-to-b from-white/0 to-[#F5F9F8]" />
      <div className="w-full overflow-hidden leading-[0] pointer-events-none">
        <svg
          className="relative block w-full h-[40px]"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 40"
          preserveAspectRatio="none"
        >
          <path
            fill="#F5F9F8"
            fillOpacity="1"
            d="M0,16 C360,40 1080,0 1440,24 L1440,40 L0,40 Z"
            style={{ opacity: 0.5 }}
          />
        </svg>
      </div>
    </section>
  );
}

