import { motion } from 'framer-motion';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { ProblemaComparativo } from '../components/ProblemaComparativo';
import { DemosInteractivas } from '../components/DemosInteractivas';
import { Pricing } from '../components/Pricing';

export const Landing = () => {
  return (
    <div className="bg-slate-50 min-h-screen">
      <Navbar />
      <Hero />
      <ProblemaComparativo />
      <DemosInteractivas />
      <Pricing />
      {/* Añadir secciones de FAQ, Testimonios aquí */}
    </div>
  );
};