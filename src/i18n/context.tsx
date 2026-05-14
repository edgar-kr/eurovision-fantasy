import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'ua';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    "title": "EURO PARTY",
    "create_session": "CREATE NEW SESSION",
    "copy_link": "Copy Link",
    "link_copied": "Link Copied!",
    "winner": "WINNER",
    "close": "CLOSE",
    "standings": "STANDINGS",
    "overview": "OVERVIEW",
    "advanced": "ADVANCED",
    "rank": "Rank",
    "country": "Country",
    "points": "Points",
    "total": "TOTAL",
    "management": "MANAGEMENT",
    "nations": "Nations",
    "add_country": "Add country...",
    "guests": "Party Guests",
    "friend_name": "Friend's name...",
    "join": "JOIN",
    "you": "YOU",
    "ready_to_vote": "READY TO VOTE?",
    "join_instructions": "Click \"JOIN\" on your name in the guest list to start assigning your Eurovision points!",
    "your_ballot": "Your Ballot",
    "sign_out": "Sign Out",
    "mandatory_points": "Mandatory Points",
    "joker_slots": "Joker Slots",
    "show": "Show",
    "mandatory_rank": "Mandatory Rank",
    "joker": "Joker",
    "live_session": "Live Session",
  },
  ua: {
    "title": "ЄВРО ТУСА",
    "create_session": "ЗАМУТИТИ НОВУ СЕСІЮ",
    "copy_link": "Скопіювати лінк",
    "link_copied": "Лінк скопійовано!",
    "winner": "ПЕРЕМОЖЦІ",
    "close": "ЗАКРИТИ",
    "standings": "РЕЙТИНГ",
    "overview": "ОГЛЯД",
    "advanced": "ДЕТАЛЬНО",
    "rank": "Місце",
    "country": "Країна",
    "points": "Бали",
    "total": "ЗАГАЛОМ",
    "management": "МЕНЕДЖМЕНТ",
    "nations": "Країни",
    "add_country": "Додати країну...",
    "guests": "Гості туси",
    "friend_name": "Ім'я друга...",
    "join": "ЗАЛІТАЮ",
    "you": "ТИ",
    "ready_to_vote": "ГОТОВИЙ ГОЛОСУВАТИ?",
    "join_instructions": "Тисни \"ЗАЛІТАЮ\" на своєму імені у списку гостей, щоб почати роздавати бали!",
    "your_ballot": "Твій бюлетень",
    "sign_out": "Вийти",
    "mandatory_points": "Обов'язкові бали",
    "joker_slots": "Джокери",
    "show": "Показати",
    "mandatory_rank": "Бали",
    "joker": "Джокер",
    "live_session": "Сесія",
  }
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useTranslation must be used within a LanguageProvider');
  return context;
};
