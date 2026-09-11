import React, { useState } from 'react';
import { Mail, CheckCircle2, ShieldCheck, ArrowRight, Flame } from 'lucide-react';
import { subscribeNewsletter } from '../../services/newsletterService';

interface NewsletterSectionProps {
  onOpenPrivacyPolicy?: () => void;
}

export const NewsletterSection: React.FC<NewsletterSectionProps> = ({ onOpenPrivacyPolicy }) => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('Te mantendremos al tanto de las mejores ofertas de ahorro.');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Por favor ingresa un correo electrónico válido.');
      return;
    }

    setError(null);
    void subscribeNewsletter(email).then((res) => {
      if (res?.message) {
        setFeedbackMsg(res.message);
      }
    });
    setIsSubscribed(true);
  };

  return (
    <section className="w-full py-12 sm:py-16 bg-[#5A3825] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 bg-black/20 p-8 sm:p-10 rounded-3xl border border-white/10">
          <div className="max-w-xl text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/10 backdrop-blur-md text-[#FED7AA] text-xs font-bold border border-white/15 mb-3">
              <Flame size={14} />
              <span>Ahorro Permanente</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-serif-warm">
              Suscríbete a Nuestras Ofertas y Avisos
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 mt-2 leading-relaxed">
              Recibe semanalmente en tu correo electrónico las promociones permanentes de proveedores, cosechas del día y novedades de Supermercado Osos en Santa Rosa de Osos.
            </p>
          </div>

          <div className="w-full lg:max-w-md">
            {isSubscribed ? (
              <div className="p-4 bg-emerald-500/20 border border-emerald-400/40 rounded-2xl flex items-center gap-3 text-white text-xs sm:text-sm">
                <CheckCircle2 size={22} className="text-emerald-400 shrink-0" />
                <div>
                  <p className="font-bold">¡Gracias por suscribirte!</p>
                  <p className="text-xs text-stone-200">{feedbackMsg}</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError(null);
                      }}
                      placeholder="Ingresa tu correo electrónico..."
                      aria-label="Correo electrónico para suscripción"
                      className="w-full pl-10 pr-4 py-3 bg-white text-stone-900 placeholder:text-stone-400 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-[#F06522]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-[#F06522] hover:bg-[#ea580c] text-white text-xs sm:text-sm font-bold rounded-xl transition-all active:scale-95 cursor-pointer shadow-lg flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <span>Registrarse</span>
                    <ArrowRight size={15} />
                  </button>
                </div>

                {error && <p className="text-xs text-rose-300 font-semibold">{error}</p>}

                <p className="text-[11px] text-stone-400 pt-1 flex items-center gap-1">
                  <ShieldCheck size={13} className="text-[#FED7AA] shrink-0" />
                  <span>
                    Tus datos se tratan bajo la Ley 1581 de 2012 de{' '}
                    <button
                      type="button"
                      onClick={onOpenPrivacyPolicy}
                      className="underline text-stone-200 hover:text-white cursor-pointer"
                    >
                      ARANGO HERMANOS S.A.S
                    </button>
                    .
                  </span>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;
