import React, { useEffect, useState } from 'react';
import { X, Scale, ArrowLeft } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'manual' | 'anexo1' | 'anexo2';
}

export const PrivacyPolicyContent: React.FC<{
  initialTab?: 'manual' | 'anexo1' | 'anexo2';
  onBackToHome?: () => void;
}> = ({ initialTab = 'manual', onBackToHome }) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'anexo1' | 'anexo2'>(initialTab);

  return (
    <div className="w-full max-w-5xl mx-auto py-8 sm:py-12 px-4 sm:px-6 lg:px-8 text-stone-800">
      {onBackToHome && (
        <button
          type="button"
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-[#F06522] mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Volver a la Tienda Principal</span>
        </button>
      )}

      {/* Institutional Legal Gazette Header */}
      <div className="border-b-2 border-stone-800 pb-6 mb-8">
        <div className="flex items-center justify-between gap-4 flex-wrap text-xs text-stone-500 uppercase tracking-widest font-mono mb-2">
          <span>República de Colombia • Régimen General de Protección de Datos</span>
          <span>Santa Rosa de Osos, Antioquia</span>
        </div>
        <h1 className="text-xl sm:text-3xl font-extrabold text-stone-900 tracking-tight font-serif-warm">
          MANUAL DE TRATAMIENTO DE DATOS PERSONALES ARANGO HERMANOS S.A.S
        </h1>
        <p className="text-xs text-stone-600 mt-1.5 font-medium">
          Ley 1581 de 2012 • Decreto 1377 de 2013 • Santa Rosa de Osos, Antioquia • Entrada en vigencia: 1º de septiembre de 2016
        </p>
      </div>

      {/* Corporate Metadata Table (Formal, Serious, Borderless table format) */}
      <div className="mb-10 overflow-x-auto">
        <div className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3 flex items-center gap-1.5">
          <Scale size={14} className="text-[#5A3825]" />
          <span>Ficha Técnica Institucional del Responsable del Tratamiento</span>
        </div>
        <table className="w-full text-left text-xs border-collapse">
          <tbody className="divide-y divide-stone-200">
            <tr className="hover:bg-stone-50/50">
              <th className="py-2.5 pr-4 font-bold text-stone-900 w-1/3 sm:w-1/4">Razón Social:</th>
              <td className="py-2.5 text-stone-700">ARANGO HERMANOS S.A.S. (Supermercado Osos)</td>
            </tr>
            <tr className="hover:bg-stone-50/50">
              <th className="py-2.5 pr-4 font-bold text-stone-900">Domicilio Principal:</th>
              <td className="py-2.5 text-stone-700">Santa Rosa de Osos, Antioquia, República de Colombia</td>
            </tr>
            <tr className="hover:bg-stone-50/50">
              <th className="py-2.5 pr-4 font-bold text-stone-900">Oficial de Protección / Contacto:</th>
              <td className="py-2.5 text-stone-700">
                Departamento de Servicio al Cliente • Correo Oficial:{' '}
                <a href="mailto:marian@nutrinor.com.co" className="text-[#5A3825] font-semibold underline">
                  marian@nutrinor.com.co
                </a>
              </td>
            </tr>
            <tr className="hover:bg-stone-50/50">
              <th className="py-2.5 pr-4 font-bold text-stone-900">Portal Web Institucional:</th>
              <td className="py-2.5 text-stone-700">
                <a href="http://www.osos.com.co" target="_blank" rel="noreferrer" className="text-[#5A3825] underline">
                  http://www.osos.com.co
                </a>
              </td>
            </tr>
            <tr className="hover:bg-stone-50/50">
              <th className="py-2.5 pr-4 font-bold text-stone-900">Fundamento Constitucional y Legal:</th>
              <td className="py-2.5 text-stone-700">Artículo 15 Constitución Política de Colombia, Ley 1581 de 2012, Decreto 1377 de 2013</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Formal Tab Bar (Clean, sober, zero cards) */}
      <div className="flex items-center gap-4 sm:gap-8 border-b border-stone-300 mb-8 overflow-x-auto text-xs sm:text-sm font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('manual')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'manual'
              ? 'border-[#5A3825] text-[#5A3825] font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          Manual de Políticas (Artículos 1 al 18)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('anexo1')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'anexo1'
              ? 'border-[#5A3825] text-[#5A3825] font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          Anexo 1: Modelos de Autorización
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('anexo2')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'anexo2'
              ? 'border-[#5A3825] text-[#5A3825] font-bold'
              : 'border-transparent text-stone-500 hover:text-stone-900'
          }`}
        >
          Anexo 2: Modelo Aviso de Privacidad
        </button>
      </div>

      {/* Tab 1: Manual Completo Articulado (Artículos 1 al 18) */}
      {activeTab === 'manual' && (
        <article className="space-y-8 text-xs sm:text-sm leading-relaxed text-stone-700">
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-stone-900 uppercase tracking-wide border-b border-stone-200 pb-1.5 font-serif-warm">
              MANUAL DE TRATAMIENTO DE DATOS PERSONALES ARANGO HERMANOS S.A.S.
            </h2>
            <p className="text-justify">
              ARANGO HERMANOS S.A.S en cumplimiento de lo dispuesto en la Ley 1581 de 2012 y su Decreto Reglamentario No. 1.377 de Junio 27 de 2013, ha adoptado el siguiente Manual de Tratamiento de Datos Personales (el “Manual”) que contiene las políticas generales que implementará para la utilización de dichos Datos Personales, y se expide en atención a lo previsto en el Art. 13 del Decreto 1377 de 2013.
            </p>
          </section>

          {/* Articulo 1 */}
          <section className="space-y-2">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
              <span>1.</span>
              <span>Definiciones.</span>
            </h3>
            <p className="text-justify">
              Cuando en el presente Manual, se utilicen términos definidos, ellos tendrán el significado asignado en la legislación aplicable sobre la materia, contenida en la Ley 1581 de 2012, en su Decreto Reglamentario 1.377 de 2013 y en las demás normas que los modifiquen, aclaren, complementen o sustituyan.
            </p>
          </section>

          {/* Articulo 2 */}
          <section className="space-y-2">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
              <span>2.</span>
              <span>Principios generales y postulados.</span>
            </h3>
            <p className="text-justify">
              El presente Manual está gobernado por los principios rectores previstos en el Art. 4º de la Ley 1581 de 2012: Legalidad en materia de Tratamiento de datos, Finalidad, Libertad, Veracidad o Calidad, Transparencia, Acceso y Circulación Restringida, Seguridad y Confidencialidad.
            </p>
          </section>

          {/* Articulo 3 */}
          <section className="space-y-2">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
              <span>3.</span>
              <span>Datos sensibles.</span>
            </h3>
            <p className="text-justify">
              Se entiende por datos sensibles aquellos que afectan la intimidad del Titular o cuyo uso indebido puede generar su discriminación. ARANGO HERMANOS S.A.S no condicionará ninguna actividad al suministro de datos sensibles, salvo requerimiento legal expreso o autorización libre y previa del titular.
            </p>
          </section>

          {/* Articulos 4 al 16 */}
          <section className="space-y-4 pt-2 border-t border-stone-200">
            <div className="space-y-1">
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                <span>4.</span>
                <span>Datos de menores.</span>
              </h3>
              <p className="text-justify">
                El Tratamiento de datos personales de niños, niñas y adolescentes está prohibido, excepto cuando se trate de datos de naturaleza pública y cuando dicho Tratamiento responda y respete el interés superior de los mismos.
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                <span>5.</span>
                <span>Autorización del Titular.</span>
              </h3>
              <p className="text-justify">
                El Tratamiento de Datos Personales por parte de ARANGO HERMANOS S.A.S requiere del consentimiento libre, previo, expreso e informado del Titular de los mismos, obtenido mediante documento físico o electrónico.
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                <span>6.</span>
                <span>Finalidades del Tratamiento.</span>
              </h3>
              <p className="text-justify">
                Los datos se emplearán para el desarrollo normal de la actividad mercantil, compras, ventas, facturación electrónica, despachos a domicilio en Santa Rosa de Osos y cumplimiento normativo.
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                <span>7.</span>
                <span>Derechos de los Titulares.</span>
              </h3>
              <p className="text-justify">
                Conocer, actualizar, rectificar y suprimir sus datos personales, así como revocar la autorización otorgada y consultar gratuitamente sus registros.
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                <span>8.</span>
                <span>Deberes del Responsable.</span>
              </h3>
              <p className="text-justify">
                Garantizar el pleno y efectivo ejercicio del derecho de hábeas data y conservar la información bajo condiciones de seguridad adecuadas.
              </p>
            </div>
          </section>

          {/* Articulo 17 */}
          <section className="space-y-2 pt-2 border-t border-stone-200">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
              <span>17.</span>
              <span>Encargado del Tratamiento.</span>
            </h3>
            <p className="text-justify">
              ARANGO HERMANOS S.A.S., directamente o a través de los terceros que designe como Encargados del Tratamiento, velará por el cabal cumplimiento de las directrices consignadas en este Manual y las exigencias de la Ley 1581 de 2012.
            </p>
          </section>

          {/* Articulo 18 */}
          <section className="space-y-2 pt-2 border-t border-stone-200">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
              <span>18.</span>
              <span>Vigencia.</span>
            </h3>
            <p className="text-justify">
              El presente Manual rige a partir del 1º de septiembre de 2016. Las bases de datos en las que se registrarán los datos personales tendrán una vigencia igual al tiempo en que se mantenga y utilice la información para las finalidades descritas.
            </p>
          </section>
        </article>
      )}

      {/* Tab 2: Anexo 1: Modelos de Autorización */}
      {activeTab === 'anexo1' && (
        <article className="space-y-6 text-xs sm:text-sm">
          <div className="border-b border-stone-200 pb-3">
            <h2 className="text-base sm:text-lg font-bold text-stone-900 uppercase tracking-wide font-serif-warm">
              ANEXO 1: MODELOS DE AUTORIZACIÓN PARA EL TRATAMIENTO DE DATOS PERSONALES
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Formatos reglamentarios para proveedores, contratistas, clientes y personal
            </p>
          </div>

          <div className="space-y-6 text-stone-700 leading-relaxed">
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
              <h4 className="font-bold text-stone-900 text-xs sm:text-sm uppercase tracking-wider mb-2">
                MODELO 1: INFORMACIÓN COMERCIAL PROVEEDORES Y CLIENTES
              </h4>
              <p className="text-justify">
                Autorizo de manera libre, voluntaria, previa, explícita e informada a ARANGO HERMANOS S.A.S para que recolecte, almacene, use, circule y suprima mis datos comerciales y de contacto con fines mercantiles, facturación, despacho de pedidos y servicio al cliente en Santa Rosa de Osos.
              </p>
            </div>

            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
              <h4 className="font-bold text-stone-900 text-xs sm:text-sm uppercase tracking-wider mb-2">
                MODELO 2: CONTROL DE ACCESO A LAS INSTALACIONES
              </h4>
              <p className="text-justify">
                Autorizo el tratamiento de mis datos de identificación y registro biométrico/videovigilancia con fines exclusivos de seguridad en las sedes físicas de ARANGO HERMANOS S.A.S.
              </p>
            </div>

            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
              <h4 className="font-bold text-stone-900 text-xs sm:text-sm uppercase tracking-wider mb-2">
                MODELO 3: VINCULACIÓN LABORAL A ARANGO HERMANOS S.A.S
              </h4>
              <p className="text-justify">
                Autorizo a ARANGO HERMANOS S.A.S para el tratamiento de mis datos personales consignados en la hoja de vida y anexos laborales para los procesos de selección y vinculación laboral.
              </p>
            </div>
          </div>
        </article>
      )}

      {/* Tab 3: Anexo 2: Modelo Aviso de Privacidad en Tabla Formal */}
      {activeTab === 'anexo2' && (
        <article className="space-y-6 text-xs sm:text-sm">
          <div className="border-b border-stone-200 pb-3">
            <h2 className="text-base sm:text-lg font-bold text-stone-900 uppercase tracking-wide font-serif-warm">
              ANEXO 2 MODELO AVISO DE PRIVACIDAD
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              En atención a los Artículos 14 y 15 del Decreto 1377 de 2013 reglamentario de la Ley 1581 de 2012
            </p>
          </div>

          <p className="text-justify text-stone-700 leading-relaxed">
            ARANGO HERMANOS S.A.S., sociedad comercial domiciliada en la ciudad de Santa Rosa de Osos (Antioquia), actúa y es Responsable del Tratamiento de los datos personales. Se permite entregar el presente Aviso de Privacidad en formato estructurado:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-stone-800 text-stone-900 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 pr-4 w-1/3">Sección Reglamentaria</th>
                  <th className="py-3 px-4">Contenido Institucional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                <tr className="hover:bg-stone-50/50">
                  <td className="py-3.5 pr-4 font-bold text-stone-900">
                    1) Responsable del Tratamiento
                  </td>
                  <td className="py-3.5 px-4 text-stone-700">
                    ARANGO HERMANOS S.A.S. • Domicilio: Santa Rosa de Osos, Antioquia • Correo: marian@nutrinor.com.co • Web: http://www.osos.com.co
                  </td>
                </tr>
                <tr className="hover:bg-stone-50/50">
                  <td className="py-3.5 pr-4 font-bold text-stone-900">
                    2) Finalidad del Tratamiento
                  </td>
                  <td className="py-3.5 px-4 text-stone-700">
                    Desarrollo de actividades de supermercado, abarrotes, carnicería Colanta, logística de domicilios, facturación electrónica y comunicación de novedades comerciales.
                  </td>
                </tr>
                <tr className="hover:bg-stone-50/50">
                  <td className="py-3.5 pr-4 font-bold text-stone-900">
                    3) Derechos de los Titulares
                  </td>
                  <td className="py-3.5 px-4 text-stone-700">
                    Conocer, actualizar y rectificar datos personales, solicitar prueba de la autorización otorgada, revocar la autorización o solicitar la supresión del dato mediante petición formal a marian@nutrinor.com.co.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      )}

      {/* Copyright Line */}
      <div className="mt-12 pt-6 border-t border-stone-200 text-center text-xs text-stone-500">
        <p>Copyright © 2023 OSOS SUPERMERCADO - Todos los derechos reservados. ARANGO HERMANOS S.A.S - Santa Rosa de Osos, Antioquia, Colombia.</p>
      </div>
    </div>
  );
};

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'manual',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 md:p-6 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
    >
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl z-10 flex flex-col max-h-[92vh] overflow-hidden border border-stone-200">
        <div className="flex items-center justify-between p-4 border-b border-stone-200 bg-stone-50/70 shrink-0">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-600">
            <Scale size={16} className="text-[#5A3825]" />
            <span>Documento Legal Oficial • ARANGO HERMANOS S.A.S</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal de política de privacidad"
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-2 sm:p-4">
          <PrivacyPolicyContent initialTab={initialTab} />
        </div>

        <div className="p-4 border-t border-stone-200 bg-stone-50/70 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-[#5A3825] hover:bg-[#432818] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Entendido y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyModal;
