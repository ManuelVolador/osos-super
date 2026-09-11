import React, { useState } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle2,
  Clock,
  MessageSquare,
} from 'lucide-react';
import { saveContactMessage } from '../../services/contactService';

interface ContactSectionProps {
  onOpenPrivacyPolicy?: () => void;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ onOpenPrivacyPolicy }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [acceptedDataPolicy, setAcceptedDataPolicy] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; policy?: string }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { email?: string; policy?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'El correo electrónico es obligatorio.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Ingresa un correo electrónico válido.';
    }

    if (!acceptedDataPolicy) {
      newErrors.policy = 'Debes autorizar el tratamiento de tus datos personales conforme a la política de privacidad.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    void saveContactMessage({
      name,
      email,
      phone,
      message,
    });
    setIsSubmitted(true);
  };

  const handleReset = () => {
    setName('');
    setEmail('');
    setPhone('');
    setMessage('');
    setAcceptedDataPolicy(false);
    setIsSubmitted(false);
  };

  return (
    <section id="contacto" className="w-full py-12 sm:py-16 bg-[#FAF7F4] border-t border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-12 items-start">
          {/* Left Info Column */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                <MessageSquare size={14} className="text-stone-500" />
                <span>Atención al Cliente</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight font-serif-warm">
                Comunícate con nosotros
              </h2>
              <p className="text-stone-600 text-xs sm:text-sm mt-2 leading-relaxed">
                Estamos atentos a responder tus inquietudes, solicitudes institucionales, cotizaciones y sugerencias en Santa Rosa de Osos.
              </p>
            </div>

            {/* Continuous Editorial Contact Channels (Zero isolated cards) */}
            <div className="divide-y divide-stone-200 border-y border-stone-200 text-xs sm:text-sm">
              <div className="flex items-start gap-4 py-4">
                <div className="w-9 h-9 rounded-lg bg-stone-100 text-stone-800 border border-stone-200/80 flex items-center justify-center shrink-0">
                  <MapPin size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 text-xs sm:text-sm font-caledonia tracking-wide">Sede Central</h4>
                  <p className="text-stone-600 text-xs mt-0.5 font-caledonia leading-relaxed">Parque Principal, Santa Rosa de Osos, Antioquia, Colombia</p>
                </div>
              </div>

              <div className="flex items-start gap-4 py-4">
                <div className="w-9 h-9 rounded-lg bg-stone-100 text-stone-800 border border-stone-200/80 flex items-center justify-center shrink-0">
                  <Phone size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 text-xs sm:text-sm font-caledonia tracking-wide">Línea Telefónica & WhatsApp</h4>
                  <p className="text-stone-600 text-xs mt-0.5 font-caledonia leading-relaxed">
                    Tel: <a href="tel:6048608899" className="font-semibold text-stone-900 hover:text-[#F06522]">(604) 860-8899</a> • WhatsApp: <a href="https://wa.me/573105550199" target="_blank" rel="noopener noreferrer" className="font-semibold text-stone-900 hover:text-[#F06522]">310 555 0199</a>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 py-4">
                <div className="w-9 h-9 rounded-lg bg-stone-100 text-stone-800 border border-stone-200/80 flex items-center justify-center shrink-0">
                  <Mail size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 text-xs sm:text-sm font-caledonia tracking-wide">Servicio al Cliente & Habeas Data</h4>
                  <p className="text-stone-600 text-xs mt-0.5 font-caledonia leading-relaxed">
                    <a href="mailto:marian@nutrinor.com.co" className="font-semibold text-stone-900 hover:text-[#F06522]">marian@nutrinor.com.co</a>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 py-4">
                <div className="w-9 h-9 rounded-lg bg-stone-100 text-stone-800 border border-stone-200/80 flex items-center justify-center shrink-0">
                  <Clock size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 text-xs sm:text-sm font-caledonia tracking-wide">Horario de Atención</h4>
                  <p className="text-stone-600 text-xs mt-0.5 font-caledonia leading-relaxed">Lunes a Domingo y Festivos: 7:00 AM a 9:00 PM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form Column */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 shadow-lg shadow-stone-900/5">
              {isSubmitted ? (
                <div className="py-10 text-center space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-stone-900">¡Mensaje Enviado con Éxito!</h3>
                  <p className="text-stone-600 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
                    Gracias por comunicarte con Supermercado Osos (Arango Hermanos S.A.S). Nuestro equipo de atención al cliente responderá a tu correo en breve.
                  </p>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="mt-4 px-6 py-2.5 bg-[#5A3825] hover:bg-[#432818] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    Enviar otro mensaje
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm" noValidate>
                  <h3 className="text-lg font-bold text-stone-900 pb-2 border-b border-stone-100">
                    Escríbenos directamente
                  </h3>

                  <div>
                    <label htmlFor="contact-name" className="block text-xs font-semibold text-stone-700 mb-1">
                      Nombre
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Tu nombre completo"
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:border-[#F06522] focus:bg-white focus:ring-2 focus:ring-[#F06522]/15 text-stone-900 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="contact-email" className="block text-xs font-semibold text-stone-700 mb-1">
                        Correo electrónico*
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                        }}
                        placeholder="ejemplo@correo.com"
                        className={`w-full px-4 py-2.5 bg-stone-50 border rounded-xl focus:outline-hidden focus:bg-white focus:ring-2 transition-all ${
                          errors.email
                            ? 'border-rose-500 focus:ring-rose-500/20'
                            : 'border-stone-300 focus:border-[#F06522] focus:ring-[#F06522]/15'
                        }`}
                      />
                      {errors.email && (
                        <p className="text-[11px] text-rose-600 font-semibold mt-1">{errors.email}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="contact-phone" className="block text-xs font-semibold text-stone-700 mb-1">
                        Teléfono
                      </label>
                      <input
                        id="contact-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Ej. 310 555 0199"
                        className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:border-[#F06522] focus:bg-white focus:ring-2 focus:ring-[#F06522]/15 text-stone-900 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contact-message" className="block text-xs font-semibold text-stone-700 mb-1">
                      Mensaje
                    </label>
                    <textarea
                      id="contact-message"
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="¿En qué podemos ayudarte hoy? (Pedidos, cotización institucional, sugerencias...)"
                      className="w-full px-4 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:border-[#F06522] focus:bg-white focus:ring-2 focus:ring-[#F06522]/15 text-stone-900 transition-all resize-none"
                    />
                  </div>

                  {/* Privacy Policy Treatment of Personal Data Consent */}
                  <div className="pt-2">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={acceptedDataPolicy}
                        onChange={(e) => {
                          setAcceptedDataPolicy(e.target.checked);
                          if (errors.policy) setErrors((prev) => ({ ...prev, policy: undefined }));
                        }}
                        className="mt-0.5 rounded border-stone-300 text-[#F06522] focus:ring-[#F06522]"
                      />
                      <span className="text-[11px] text-stone-600 leading-snug">
                        Autorizo el tratamiento de mis datos personales a <strong>ARANGO HERMANOS S.A.S</strong> de acuerdo con la Ley 1581 de 2012 y el{' '}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            onOpenPrivacyPolicy?.();
                          }}
                          className="text-[#F06522] underline font-semibold hover:text-[#d94f13] cursor-pointer"
                        >
                          Manual de Tratamiento de Datos Personales
                        </button>
                        .
                      </span>
                    </label>
                    {errors.policy && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1">{errors.policy}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto px-8 py-3 bg-[#F06522] hover:bg-[#ea580c] text-white font-bold rounded-xl shadow-md shadow-orange-950/15 hover:shadow-orange-500/25 transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Send size={15} />
                    <span>Enviar Mensaje</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
