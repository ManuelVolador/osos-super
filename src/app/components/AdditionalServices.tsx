import React from 'react';
import {
  Beef,
  Truck,
  Building2,
  Boxes,
  Tag,
  ShieldCheck,
  CheckCircle2,
  PhoneCall,
  ArrowRight,
} from 'lucide-react';

interface AdditionalServicesProps {
  onSelectCategory?: (catId: string) => void;
  onOpenCart?: () => void;
  onContactClick?: () => void;
}

interface ServiceItem {
  id: string;
  number: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  quote?: string;
  features: string[];
  ctaText: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  action: 'carniceria' | 'domicilio' | 'institucional' | 'mayorista' | 'ofertas';
}

const SERVICES: ServiceItem[] = [
  {
    id: 'carniceria',
    number: '01',
    badge: 'Alianza Oficial',
    title: 'CARNICERIA COLANTA',
    subtitle: 'Cortes certificados con el sello y la tradición ganadera de Colanta',
    description:
      'Cortes certificados con el sello y la tradición ganadera de Colanta. Terneza garantizada en res y cerdo, con porcionado al gusto y empaque higiénico al vacío.',
    features: [
      'Lomo fino, costilla especial y punta de anca',
      'Porcionado personalizado por maestros carniceros',
    ],
    ctaText: 'Ver Cortes en Catálogo',
    icon: Beef,
    action: 'carniceria',
  },
  {
    id: 'domicilios',
    number: '02',
    badge: 'Express 25-35 min',
    title: 'SERVICIO A DOMICILIO',
    subtitle: 'Entrega ágil y confiable en la puerta de tu hogar o trabajo',
    description:
      'Entrega ágil y confiable en la puerta de tu hogar o lugar de trabajo en Santa Rosa de Osos. Tus víveres llegan frescos, con datáfono inalámbrico o cambio exacto.',
    features: [
      'Cobertura en Centro, El Carmelo, Los Osos y más',
      'Envío GRATIS en compras desde $50.000 COP',
    ],
    ctaText: 'Pedir a Domicilio Ahora',
    icon: Truck,
    action: 'domicilio',
  },
  {
    id: 'institucionales',
    number: '03',
    badge: 'Empresas & Entidades',
    title: 'VENTAS INSTITUCIONALES',
    subtitle: 'Atención corporativa personalizada con facturación electrónica',
    description:
      'Atención corporativa personalizada para colegios, restaurantes, hoteles, hospitales y fundaciones en el Norte antioqueño, con facturación electrónica reglamentaria.',
    features: [
      'Descuentos por volumen y crédito institucional',
      'Atención directa con asesores comerciales',
    ],
    ctaText: 'Solicitar Asesor Institucional',
    icon: Building2,
    action: 'institucional',
  },
  {
    id: 'mayoristas',
    number: '04',
    badge: 'Precios Mayoristas',
    title: 'VENTAS AL POR MAYOR',
    subtitle: 'Abastecimiento confiable para tiendas y minimercados del Norte',
    description:
      'Abastecimiento confiable y precios directos para tiendas de barrio, minimercados, cafeterías y negocios del Norte antioqueño.',
    features: [
      'Precios diferenciales por bulto y paca',
      'Entregas programadas en tu negocio',
    ],
    ctaText: 'Cotizar Pedido Mayorista',
    icon: Boxes,
    action: 'mayorista',
  },
  {
    id: 'ofertas',
    number: '05',
    badge: 'Compromiso de Ahorro',
    title: 'OFERTAS PERMANENTES',
    subtitle: 'Alianzas continuas con todos nuestros proveedores para tu economía',
    quote:
      '“En colaboración con todos nuestros proveedores, estamos realizando permanentemente ofertas y descuentos para que puedas ahorrar.”',
    description:
      'En colaboración con todos nuestros proveedores, estamos realizando permanentemente ofertas y descuentos para que puedas ahorrar en cada compra.',
    features: [
      'Descuentos semanales en granos, lácteos y aseo',
      'Ahorro del 15% al 30% en canasta básica',
    ],
    ctaText: 'Explorar Ofertas Activas',
    icon: Tag,
    action: 'ofertas',
  },
];

export const AdditionalServices: React.FC<AdditionalServicesProps> = ({
  onSelectCategory,
  onOpenCart,
  onContactClick,
}) => {
  const handleAction = (action: ServiceItem['action']) => {
    switch (action) {
      case 'carniceria':
        onSelectCategory?.('carnes');
        break;
      case 'domicilio':
        onOpenCart?.();
        break;
      case 'institucional':
      case 'mayorista':
        onContactClick?.();
        break;
      case 'ofertas':
        onSelectCategory?.('ofertas');
        break;
    }
  };

  return (
    <section id="servicios" className="w-full py-12 sm:py-16 bg-[#FAF7F4] border-t border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-stone-200 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
              <ShieldCheck size={14} className="text-stone-500" />
              <span>Garantía Oficial • ARANGO HERMANOS S.A.S</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight font-serif-warm">
              SERVICIOS ADICIONALES
            </h2>
            <p className="text-stone-600 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
              Soluciones integrales de abastecimiento para hogares, comerciantes e instituciones de Santa Rosa de Osos con respaldo directo.
            </p>
          </div>

          <a
            href="tel:6048608899"
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-lg bg-white border border-stone-300 text-stone-800 text-xs font-semibold hover:border-[#F06522] hover:text-[#F06522] transition-colors self-start md:self-auto shadow-2xs"
          >
            <PhoneCall size={14} className="text-stone-600" />
            <span>Llamar a Servicio al Cliente: (604) 860-8899</span>
          </a>
        </div>

        {/* Continuous Editorial Dossier List (Zero floating cards/boxes) */}
        <div className="divide-y divide-stone-200 border-y border-stone-200">
          {SERVICES.map((srv) => {
            const Icon = srv.icon;
            return (
              <article
                key={srv.id}
                className="py-8 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start hover:bg-stone-50/50 transition-colors px-2 sm:px-4 rounded-xl"
              >
                {/* Left Col: Header & Badges */}
                <div className="lg:col-span-5 space-y-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-bold text-stone-400">{srv.number}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm border bg-stone-100 text-stone-700 border-stone-200">
                      {srv.badge}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-800 border border-stone-200/80 flex items-center justify-center shrink-0">
                      <Icon size={18} />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight font-caledonia">
                      {srv.title}
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm font-semibold text-stone-600 leading-snug font-caledonia">
                    {srv.subtitle}
                  </p>
                </div>

                {/* Right Col: Details, Quote, Checklist & CTA */}
                <div className="lg:col-span-7 space-y-4">
                  {srv.quote && (
                    <blockquote className="my-2.5 pl-3.5 border-l-2 border-stone-300 text-xs sm:text-sm italic font-caledonia text-stone-800 leading-relaxed">
                      {srv.quote}
                    </blockquote>
                  )}

                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-caledonia">
                    {srv.description}
                  </p>

                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-caledonia">
                    {srv.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-xs sm:text-sm text-stone-700">
                        <CheckCircle2 size={15} className="text-stone-600 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-3 flex items-center justify-between gap-4 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleAction(srv.action)}
                      className="px-5 py-2.5 rounded-lg bg-[#F06522] hover:bg-[#ea580c] text-white font-bold text-xs sm:text-sm transition-all shadow-xs active:scale-98 flex items-center gap-2 cursor-pointer"
                    >
                      <span>{srv.ctaText}</span>
                      <ArrowRight size={14} />
                    </button>
                    <span className="text-[11px] text-stone-400 font-medium">
                      Atención en Santa Rosa de Osos: Lunes a Domingo 7:00 AM - 9:00 PM
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AdditionalServices;
