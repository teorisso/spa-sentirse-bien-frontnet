import { motion } from 'framer-motion';
import Image from 'next/image';

interface PageHeroProps {
  title: string;
  description: string;
  backgroundImage?: string;
}

export default function PageHero({ title, description, backgroundImage = '/images/heropages.png' }: PageHeroProps) {
  return (
    <section className="relative bg-gradient-to-b from-[#F5F9F8] to-white text-primary font-roboto pt-32 pb-10 px-2 text-center overflow-hidden mt-0">

      <div className="absolute inset-0">
        <Image
          src={backgroundImage}
          alt=""
          fill
          className="object-cover opacity-30"
        />
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-b from-primary/80 to-transparent h-40"></div>
      
      <motion.div 
        className="relative z-10 max-w-4xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="text-4xl md:text-5xl font-lora italic mb-6">{title}</h1>
        <p className="text-lg md:text-xl font-light">
          {description}
        </p>
        <div className="flex justify-center items-center gap-3 my-8">
          <span className="w-2.5 h-2.5 rounded-full bg-accent/60 animate-pulse"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-accent/40 animate-pulse delay-150"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-accent/60 animate-pulse delay-300"></span>
        </div>
      </motion.div>
    </section>
  );
}