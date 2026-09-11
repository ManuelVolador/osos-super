import React, { useState, useEffect } from 'react';
import {
  Bell,
  Calendar,
  Clock,
  User,
  X,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { NOTICES, type Notice } from '../data/notices';
import { fetchNotices } from '../../services/noticeService';

export const NoticeBoard: React.FC = () => {
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [noticesList, setNoticesList] = useState<Notice[]>(NOTICES);

  useEffect(() => {
    let isMounted = true;
    fetchNotices()
      .then((data) => {
        if (isMounted && data.length > 0) {
          setNoticesList(data);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

  const categories = ['Todas', ...Array.from(new Set(noticesList.map((n) => n.category)))];
  const filteredNotices = selectedCategory === 'Todas'
    ? noticesList
    : noticesList.filter((n) => n.category === selectedCategory);

  return (
    <section id="avisos" className="w-full py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 pb-6 border-b border-stone-200 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
            <Bell size={14} className="text-stone-500" />
            <span>Gaceta Informativa Oficial</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-stone-900 tracking-tight font-serif-warm">
            Canal de Avisos & Novedades
          </h2>
          <p className="text-stone-600 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
            Mantente al día con las cosechas que llegan del campo, promociones especiales, cortes Colanta y comunicados de Supermercado Osos en Santa Rosa de Osos.
          </p>
        </div>

        <div className="text-xs text-stone-500 font-medium self-start md:self-auto flex items-center gap-2">
          <FileText size={15} className="text-stone-400" />
          <span>{filteredNotices.length} {filteredNotices.length === 1 ? 'comunicado' : 'comunicados'} • Edición oficial</span>
        </div>
      </div>

      {/* Category Filter Tabs (Tabular Blog Header) */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-4 mb-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              selectedCategory === cat
                ? 'bg-[#5A3825] text-white font-bold'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200/80'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Desktop Blog Table Layout (No Cards) */}
      <div className="hidden md:block overflow-x-auto bg-white border-y border-stone-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-stone-50/80 text-[11px] font-bold text-stone-500 uppercase tracking-wider border-b border-stone-200">
              <th scope="col" className="py-3 px-4 w-36">Fecha</th>
              <th scope="col" className="py-3 px-4 w-44">Categoría</th>
              <th scope="col" className="py-3 px-6">Aviso / Publicación</th>
              <th scope="col" className="py-3 px-4 w-44">Emisor</th>
              <th scope="col" className="py-3 px-4 w-36 text-right">Lectura</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {filteredNotices.map((notice) => (
              <tr
                key={notice.id}
                onClick={() => setSelectedNotice(notice)}
                className="group hover:bg-orange-50/40 transition-colors cursor-pointer"
              >
                {/* Fecha */}
                <td className="py-4 px-4 align-top text-xs text-stone-500 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Calendar size={13} className="text-stone-400 shrink-0" />
                    <span>{notice.date}</span>
                  </div>
                </td>

                {/* Categoría */}
                <td className="py-4 px-4 align-top whitespace-nowrap">
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm border bg-stone-100 text-stone-700 border-stone-200">
                    {notice.category}
                  </span>
                </td>

                {/* Titular y Extracto */}
                <td className="py-4 px-6 align-top">
                  <div className="space-y-1">
                    <h3 className="font-caledonia text-sm sm:text-base font-bold text-stone-900 group-hover:text-[#F06522] transition-colors leading-snug">
                      {notice.title}
                    </h3>
                    <p className="font-caledonia text-xs text-stone-600 leading-relaxed line-clamp-2">
                      {notice.summary}
                    </p>
                  </div>
                </td>

                {/* Emisor / Autor */}
                <td className="py-4 px-4 align-top text-xs text-stone-500 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 font-medium font-caledonia">
                    <User size={13} className="text-stone-400 shrink-0" />
                    <span>{notice.author}</span>
                  </div>
                </td>

                {/* Lectura & Acción */}
                <td className="py-4 px-4 align-top text-right whitespace-nowrap">
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[11px] text-stone-400 flex items-center gap-1 font-medium font-caledonia">
                      <Clock size={11} />
                      <span>{notice.readTime}</span>
                    </span>
                    <span className="text-xs font-bold text-[#5A3825] group-hover:text-[#F06522] flex items-center gap-1 pt-1 transition-colors font-caledonia">
                      <span>Leer entrada</span>
                      <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Continuous Blog List (No Cards) */}
      <div className="md:hidden divide-y divide-stone-200 border-y border-stone-200 bg-white">
        {filteredNotices.map((notice) => (
          <div
            key={notice.id}
            onClick={() => setSelectedNotice(notice)}
            className="py-4 px-2 space-y-2 cursor-pointer hover:bg-orange-50/40 transition-colors group"
          >
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm border bg-stone-100 text-stone-700 border-stone-200">
                {notice.category}
              </span>
              <span className="text-[11px] text-stone-400 flex items-center gap-1 font-medium font-caledonia">
                <Calendar size={11} />
                {notice.date}
              </span>
            </div>

            <h3 className="font-caledonia text-sm font-bold text-stone-900 group-hover:text-[#F06522] transition-colors leading-snug">
              {notice.title}
            </h3>

            <p className="font-caledonia text-xs text-stone-600 leading-relaxed line-clamp-2">
              {notice.summary}
            </p>

            <div className="flex items-center justify-between pt-1 text-xs text-stone-500">
              <span className="text-[11px] text-stone-400 flex items-center gap-1 font-medium font-caledonia">
                <User size={12} />
                {notice.author}
              </span>
              <span className="font-bold text-[#5A3825] group-hover:text-[#F06522] flex items-center gap-1 text-[11px] transition-colors font-caledonia">
                <span>Leer entrada</span>
                <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Full Notice Reader Modal */}
      {selectedNotice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="notice-modal-title"
        >
          <div
            className="fixed inset-0"
            onClick={() => setSelectedNotice(null)}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-2xl bg-white rounded-2xl p-6 sm:p-8 shadow-2xl z-10 max-h-[85vh] overflow-y-auto border border-stone-200">
            <button
              type="button"
              onClick={() => setSelectedNotice(null)}
              aria-label="Cerrar aviso"
              className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm border bg-stone-100 text-stone-700 border-stone-200">
                {selectedNotice.category}
              </span>
              <span className="text-xs text-stone-400 flex items-center gap-1 font-caledonia">
                <Clock size={12} />
                {selectedNotice.readTime}
              </span>
            </div>

            <h3 id="notice-modal-title" className="text-xl sm:text-2xl font-bold text-stone-900 leading-snug font-caledonia">
              {selectedNotice.title}
            </h3>

            <div className="flex items-center gap-3 text-xs text-stone-400 mt-2 pb-4 border-b border-stone-100 font-caledonia">
              <span className="flex items-center gap-1 font-medium">
                <Calendar size={13} />
                {selectedNotice.date}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <User size={13} />
                {selectedNotice.author}
              </span>
            </div>

            <div className="mt-5 space-y-3.5 text-xs sm:text-sm text-stone-700 leading-relaxed font-caledonia">
              {selectedNotice.content.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>

            <div className="mt-8 pt-5 border-t border-stone-100 flex items-center justify-between font-caledonia">
              <span className="text-xs text-stone-400 font-medium">Publicado por Arango Hermanos S.A.S • Santa Rosa de Osos</span>
              <button
                type="button"
                onClick={() => setSelectedNotice(null)}
                className="px-5 py-2.5 bg-[#5A3825] hover:bg-[#432818] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Cerrar Lectura
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default NoticeBoard;
