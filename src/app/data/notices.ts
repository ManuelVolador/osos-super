export interface Notice {
  id: string;
  title: string;
  date: string;
  category: string;
  readTime: string;
  summary: string;
  content: string[];
  tagColor: string;
  author: string;
}

export const NOTICES: Notice[] = [
  {
    id: 'aviso-colanta',
    title: 'Nueva Llegada de Cortes Certificados Carnicería Colanta',
    date: '10 de Septiembre, 2026',
    category: 'Carnicería Colanta',
    readTime: '3 min de lectura',
    tagColor: 'bg-stone-100 text-stone-700 border-stone-200',
    author: 'Maestro Carnicero Osos',
    summary: 'Recibimos cortes frescos seleccionados con la tradicional calidad lechera y ganadera del Norte antioqueño, listos para tu mesa.',
    content: [
      'En Supermercado Osos nos enorgullece contar con el respaldo de Carnicería Colanta, ofreciendo cortes de res y cerdo de la más alta terneza y frescura garantizada.',
      'Esta semana contamos con disponibilidad especial de lomo fino, costilla especial para asar, punta de anca madurada y carne molida 100% magra.',
      'Nuestros maestros carniceros en Santa Rosa de Osos realizan los cortes según tu preferencia: para asar, sudar, moler o porcionar al vacío para congelar.',
      'Pide hoy mismo tus cortes a domicilio o visítanos en nuestro punto central de Santa Rosa de Osos.',
    ],
  },
  {
    id: 'aviso-ofertas-permanentes',
    title: 'Ofertas Permanentes: Ahorro Garantizado con Nuestros Proveedores',
    date: '8 de Septiembre, 2026',
    category: 'Ofertas Permanentes',
    readTime: '2 min de lectura',
    tagColor: 'bg-stone-100 text-stone-700 border-stone-200',
    author: 'Departamento Comercial',
    summary: 'En colaboración con todos nuestros proveedores, estamos realizando permanentemente ofertas y descuentos para que puedas ahorrar en cada compra.',
    content: [
      'En colaboración con todos nuestros proveedores, estamos realizando permanentemente ofertas y descuentos para que puedas ahorrar.',
      'Nuestra alianza directa con productores de abarrotes, aseo del hogar y canasta básica nos permite ofrecer precios imbatibles sin sacrificar la frescura ni la calidad.',
      'Consulta semanalmente nuestro catálogo digital o visita los pasillos de granos, lácteos y aseo para aprovechar promociones activas de 2x1 y descuentos del 15% al 30%.',
      '¡Tu presupuesto rinde mucho más en Supermercado Osos!',
    ],
  },
  {
    id: 'aviso-cosecha-local',
    title: 'Cosecha de Fresas y Legumbres Frescas de Santa Rosa de Osos',
    date: '5 de Septiembre, 2026',
    category: 'Campo Local',
    readTime: '3 min de lectura',
    tagColor: 'bg-stone-100 text-stone-700 border-stone-200',
    author: 'Comité de Compras Agrícolas',
    summary: 'Apoyamos el trabajo de los campesinos santarrosanos recibiendo a diario fresas seleccionadas, plátanos, aguacates y hortalizas de primera.',
    content: [
      'Cada madrugada llegan a nuestro supermercado canastillas repletas de fresas aromáticas cosechadas en las veredas altas de Santa Rosa de Osos, reconocidas por su dulzura natural.',
      'Asimismo, fortalecemos el comercio justo con nuestros agricultores locales, trayendo legumbres, hortalizas, papas y verduras recién cortadas del surco a tu alacena.',
      'Al mercar en Osos, no solo llevas frescura insuperable a tu familia, sino que impulsas directamente la economía rural de nuestro municipio.',
    ],
  },
  {
    id: 'aviso-servicios-institucionales',
    title: 'Ventas Institucionales y Domicilios Ágiles para Negocios y Hogares',
    date: '2 de Septiembre, 2026',
    category: 'Servicios Especiales',
    readTime: '2 min de lectura',
    tagColor: 'bg-stone-100 text-stone-700 border-stone-200',
    author: 'Gerencia de Operaciones',
    summary: 'Conoce nuestras líneas de atención para hoteles, restaurantes, colegios y pedidos al por mayor con despacho prioritario.',
    content: [
      'Supermercado Osos pone a disposición su canal de Ventas Institucionales y Ventas al por Mayor con listas de precios preferenciales y facturación electrónica para entidades.',
      'Atendemos restaurantes, cafeterías, instituciones educativas y empresas de Santa Rosa de Osos con entregas programadas y empacado sanitario de alta rigurosidad.',
      'Para hogares, nuestro Servicio a Domicilio Express continúa operando de lunes a domingo de 7:00 AM a 9:00 PM con cobertura completa en todos los barrios y sectores del municipio.',
    ],
  },
];
