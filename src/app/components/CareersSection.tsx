import React, { useState, useRef } from 'react';
import {
  Briefcase,
  Upload,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { saveJobApplication } from '../../services/careerService';

interface CareersSectionProps {
  onOpenPrivacyPolicy?: (tab?: 'manual' | 'anexo1' | 'anexo2') => void;
}

export const CareersSection: React.FC<CareersSectionProps> = ({ onOpenPrivacyPolicy }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [position, setPosition] = useState('cajas');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [acceptedDataPolicy, setAcceptedDataPolicy] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; file?: string; policy?: string }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      if (errors.file) setErrors((prev) => ({ ...prev, file: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { email?: string; file?: string; policy?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'El correo electrónico es obligatorio.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Ingresa un correo electrónico válido.';
    }

    if (!acceptedDataPolicy) {
      newErrors.policy = 'Debes autorizar el tratamiento de datos para vinculación laboral de ARANGO HERMANOS S.A.S.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    void saveJobApplication({
      fullName: name,
      phone,
      email,
      position,
      message,
      cvFilename: file?.name,
    });
    setIsSubmitted(true);
  };

  const handleReset = () => {
    setName('');
    setPhone('');
    setEmail('');
    setPosition('cajas');
    setMessage('');
    setFile(null);
    setAcceptedDataPolicy(false);
    setIsSubmitted(false);
  };

  return (
    <section id="empleo" className="w-full py-12 sm:py-16 bg-[#FAF7F4] border-t border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-stone-200 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
              <Briefcase size={14} className="text-stone-500" />
              <span>Oportunidades Laborales</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight font-serif-warm">
              ¡Trabaja con nosotros!
            </h2>
            <p className="text-stone-600 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
              Forma parte del equipo humano de <strong>Supermercado Osos (Arango Hermanos S.A.S)</strong>. Buscamos personas comprometidas con el servicio y la calidad en Santa Rosa de Osos.
            </p>
          </div>

          <div className="text-xs text-stone-500 font-medium self-start md:self-auto flex items-center gap-2">
            <ShieldCheck size={15} className="text-stone-400" />
            <span>Contratación formal con todas las prestaciones</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-12 items-start">
          {/* Left Info Column */}
          <div className="lg:col-span-5 space-y-6">
            {/* Unified Corporate Values & Benefits List (Zero floating cards) */}
            <div className="divide-y divide-stone-200 border-y border-stone-200 text-xs sm:text-sm">
              <div className="flex items-start gap-4 py-4">
                <div className="w-9 h-9 rounded-lg bg-stone-100 text-stone-800 border border-stone-200/80 flex items-center justify-center shrink-0">
                  <UserCheck size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 text-xs sm:text-sm font-caledonia tracking-wide">Estabilidad y Bienestar</h4>
                  <p className="text-stone-600 text-xs mt-0.5 font-caledonia leading-relaxed">Contratación directa con todas las prestaciones sociales y garantías de ley vigentes.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 py-4">
                <div className="w-9 h-9 rounded-lg bg-stone-100 text-stone-800 border border-stone-200/80 flex items-center justify-center shrink-0">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 text-xs sm:text-sm font-caledonia tracking-wide">Capacitación Continua</h4>
                  <p className="text-stone-600 text-xs mt-0.5 font-caledonia leading-relaxed">Formación permanente en atención al cliente, logística comercial y manipulación higiénica de alimentos.</p>
                </div>
              </div>

              <div className="flex items-start gap-4 py-4">
                <div className="w-9 h-9 rounded-lg bg-stone-100 text-stone-800 border border-stone-200/80 flex items-center justify-center shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 text-xs sm:text-sm font-caledonia tracking-wide">Desarrollo en Santa Rosa de Osos</h4>
                  <p className="text-stone-600 text-xs mt-0.5 font-caledonia leading-relaxed">Oportunidades de empleo formal y crecimiento personal para las familias de nuestro municipio.</p>
                </div>
              </div>
            </div>

            <div className="text-xs text-stone-600 leading-relaxed pt-1 font-caledonia">
              <p className="font-semibold text-stone-800 mb-1">Perfiles habituales de vinculación:</p>
              <p>Cajas y atención al cliente, maestros carniceros Colanta, surtido y bodega, logística de domicilios y administración comercial.</p>
            </div>
          </div>

          {/* Right Application Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-stone-200 shadow-lg shadow-stone-900/5 text-stone-900">
              {isSubmitted ? (
                <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-stone-900">¡Postulación Recibida!</h3>
                  <p className="text-stone-600 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
                    Tu hoja de vida ha sido radicada ante el área de Gestión Humana de Arango Hermanos S.A.S. Nos pondremos en contacto contigo para las convocatorias activas.
                  </p>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="mt-4 px-6 py-2.5 bg-[#5A3825] hover:bg-[#432818] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    Nueva postulación
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm" noValidate>
                  <h3 className="text-base sm:text-lg font-bold text-stone-900 pb-2 border-b border-stone-100 font-serif-warm">
                    Formulario de Postulación de Empleo
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label htmlFor="career-name" className="block text-xs font-semibold text-stone-700 mb-1">
                        Nombre completo
                      </label>
                      <input
                        id="career-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Tu nombre y apellidos"
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:border-[#F06522] focus:bg-white text-stone-900"
                      />
                    </div>

                    <div>
                      <label htmlFor="career-phone" className="block text-xs font-semibold text-stone-700 mb-1">
                        Teléfono de contacto
                      </label>
                      <input
                        id="career-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Ej. 310 555 0199"
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:border-[#F06522] focus:bg-white text-stone-900"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label htmlFor="career-email" className="block text-xs font-semibold text-stone-700 mb-1">
                        Correo electrónico*
                      </label>
                      <input
                        id="career-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                        }}
                        placeholder="ejemplo@correo.com"
                        className={`w-full px-3.5 py-2.5 bg-stone-50 border rounded-xl focus:outline-hidden focus:bg-white ${
                          errors.email ? 'border-rose-500' : 'border-stone-300 focus:border-[#F06522]'
                        }`}
                      />
                      {errors.email && (
                        <p className="text-[11px] text-rose-600 font-semibold mt-1">{errors.email}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="career-position" className="block text-xs font-semibold text-stone-700 mb-1">
                        Área de Interés
                      </label>
                      <select
                        id="career-position"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:border-[#F06522] text-stone-900 cursor-pointer"
                      >
                        <option value="cajas">Cajas y Atención al Cliente</option>
                        <option value="carniceria">Carnicería y Cortes (Colanta)</option>
                        <option value="surtido">Surtido y Bodega</option>
                        <option value="domicilios">Domiciliario Motorizado</option>
                        <option value="administracion">Administración y Contabilidad</option>
                      </select>
                    </div>
                  </div>

                  {/* File Attachment for CV */}
                  <div>
                    <label htmlFor="career-cv" className="block text-xs font-semibold text-stone-700 mb-1">
                      Adjuntar Hoja de Vida (PDF o Word)
                    </label>
                    <input
                      id="career-cv"
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="p-3.5 border-2 border-dashed border-stone-300 hover:border-[#F06522] bg-stone-50 rounded-2xl flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 border border-stone-200 flex items-center justify-center">
                          <Upload size={16} />
                        </div>
                        <span className="text-xs text-stone-600 font-medium truncate max-w-[220px]">
                          {file ? file.name : 'Haz clic para seleccionar tu archivo (PDF, DOCX)'}
                        </span>
                      </div>
                      {file ? (
                        <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                          <FileCheck size={14} /> Listo
                        </span>
                      ) : (
                        <span className="text-[11px] text-stone-400 font-semibold">Examinar</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="career-message" className="block text-xs font-semibold text-stone-700 mb-1">
                      Mensaje o Experiencia Previa
                    </label>
                    <textarea
                      id="career-message"
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Cuéntanos brevemente sobre tu experiencia laboral previa..."
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:border-[#F06522] text-stone-900 resize-none"
                    />
                  </div>

                  {/* Personal Data Consent Checkbox (Anexo 1 - Vinculación Laboral) */}
                  <div>
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
                        Consiento y autorizo de manera previa, expresa e inequívoca para que mis datos personales suministrados para efectos de vinculación laboral a <strong>ARANGO HERMANOS S.A.S</strong> sean tratados conforme al{' '}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            onOpenPrivacyPolicy?.('anexo1');
                          }}
                          className="text-[#F06522] underline font-semibold hover:text-[#d94f13] cursor-pointer"
                        >
                          Documento de Autorización (Anexo 1)
                        </button>{' '}
                        y el Manual de Tratamiento de Datos.
                      </span>
                    </label>
                    {errors.policy && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1">{errors.policy}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#F06522] hover:bg-[#ea580c] text-white font-bold rounded-xl shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Postularse Ahora</span>
                    <ArrowRight size={15} />
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

export default CareersSection;
