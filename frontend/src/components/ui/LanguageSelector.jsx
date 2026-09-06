import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN', flag: '🇬🇧' },
  { code: 'mr', label: 'मराठी (Marathi)', short: 'मराठी', flag: '🇮🇳' },
  { code: 'hi', label: 'हिन्दी (Hindi)', short: 'हिन्दी', flag: '🇮🇳' },
  { code: 'te', label: 'తెలుగు (Telugu)', short: 'తెలుగు', flag: '🇮🇳' },
  { code: 'gu', label: 'ગુજરાતી (Gujarati)', short: 'ગુજરાતી', flag: '🇮🇳' },
];

export default function LanguageSelector({ variant = 'compact' }) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'en';

  const handleLanguageChange = (langCode) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('f2f_lang', langCode);
  };

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative inline-flex items-center">
        <select
          value={currentLang}
          onChange={(e) => handleLanguageChange(e.target.value)}
          className="appearance-none bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg pl-6 pr-6 py-1 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-hidden transition-colors"
          title="Select Display Language (§8.4)"
        >
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.short}
            </option>
          ))}
        </select>
        <Globe className="w-3.5 h-3.5 text-slate-500 absolute left-1.5 pointer-events-none" />
      </div>
    </div>
  );
}
