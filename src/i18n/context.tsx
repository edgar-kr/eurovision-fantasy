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
    "results": "RESULTS",
    "close": "CLOSE",
    "help": "HELP",
    "how_to_join": "How to join the game",
    "how_to_join_desc": "Click 'JOIN' next to your name in the 'Party Guests' list. If you don't see your name, ask the host to add you.",
    "how_to_vote": "How to vote",
    "how_to_vote_desc": "For each country, assign points from 1 to 12. With 25 countries, you have 2 sets of mandatory points (two 12s, two 10s, etc.). Additionally, you have 5 Joker slots which can be any points (even duplicates, e.g., five 12s) for any remaining countries.",
    "how_to_view_results": "How to view results",
    "how_to_view_results_desc": "Click the 'RESULTS' button in the header or use the navigation at the bottom to see the live leaderboard and detailed voting matrix.",
    "rules_title": "Game Rules (25 Countries)",
    "rules_sets": "2 sets of points: {sets}",
    "rules_jokers": "Joker slots: {jokers}",
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
    "syncing": "Syncing with the Cloud...",
    "party_joined": "Someone joined the party!",
    "list_updated": "The country list was updated.",
    "voting_locked_toast": "VOTING IS NOW LOCKED! 🚫",
    "voting_unlocked_toast": "VOTING IS NOW UNLOCKED! 💜",
    "points_given": "{name} just gave {points} points to {country}!",
    "everyone_voted": "Everyone has finished voting for {country}!",
    "host_party": "Host the ultimate watch party. Real-time voting, live leaderboards, and zero math required.",
    "waiting_official": "Waiting for official results...",
    "official_selection": "Official Top 10 Selection",
    "selected_count": "{count} / 10 SELECTED",
    "match_count": "{count}/10 MATCH",
    "find_country": "Find country...",
    "page_info": "Page {current} of {total}",
    "no_countries_found": "No countries found matching \"{term}\"",
    "freeze_voting": "FREEZE VOTING",
    "unfreeze_voting": "UNFREEZE VOTING",
    "locked_badge": "LOCKED",
    "used": "USED",
    "joker_slots_used": "Joker Slots USED",
    "joker_point": "Joker Point",
    "no_slots_left": "No slots left",
    "confirm_remove_participant": "Are you sure you want to remove this participant? All their votes will be lost.",
    "country_exists": "This country is already in the list!",
    "participant_exists": "This participant is already in the list!",
    "off": "OFF",
    "pts": "PTS",
    "join_session_loading": "...",
  },
  ua: {
    "title": "ЄВРО ТУСА",
    "create_session": "ЗАМУТИТИ НОВУ СЕСІЮ",
    "copy_link": "Скопіювати лінк",
    "link_copied": "Лінк скопійовано!",
    "results": "РЕЗУЛЬТАТИ",
    "close": "ЗАКРИТИ",
    "help": "ДОВІДКА",
    "how_to_join": "Як приєднатися до гри",
    "how_to_join_desc": "Натисніть 'ЗАЛІТАЮ' біля свого імені у списку 'Гості туси'. Якщо ви не бачите свого імені, попросіть хоста додати вас.",
    "how_to_vote": "Як голосувати",
    "how_to_vote_desc": "Для кожної країни призначте бали від 1 до 12. При 25 країнах ви маєте 2 набори обов'язкових балів (дві 12-ки, дві 10-ки і т.д.). Крім того, у вас є 5 слотів-джокерів, які можуть бути будь-якими балами (навіть дублікатами, наприклад, п'ять 12-ток) для решти країн.",
    "how_to_view_results": "Як переглянути результати",
    "how_to_view_results_desc": "Натисніть кнопку 'РЕЗУЛЬТАТИ' у шапці або використовуйте навігацію внизу, щоб побачити таблицю лідерів та детальну матрицю голосування.",
    "rules_title": "Правила гри (25 країн)",
    "rules_sets": "2 набори балів: {sets}",
    "rules_jokers": "Слоти-джокери: {jokers}",
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
    "syncing": "Синхронізація з хмарою...",
    "party_joined": "Хтось залетів на тусу!",
    "list_updated": "Список країн оновлено.",
    "voting_locked_toast": "ГОЛОСУВАННЯ ЗАБЛОКОВАНО! 🚫",
    "voting_unlocked_toast": "ГОЛОСУВАННЯ РОЗБЛОКОВАНО! 💜",
    "points_given": "{name} дає {points} балів {country}!",
    "everyone_voted": "Всі проголосували за {country}!",
    "host_party": "Влаштуй найкращу вечірку. Голосування в реальному часі, живі таблиці лідерів і ніякої математики.",
    "waiting_official": "Чекаємо на офіційні результати...",
    "official_selection": "Вибір офіційної топ-десятки",
    "selected_count": "ВИБРАНО: {count} / 10",
    "match_count": "СПІВПАЛО: {count}/10",
    "find_country": "Знайти країну...",
    "page_info": "Сторінка {current} з {total}",
    "no_countries_found": "Країн за запитом \"{term}\" не знайдено",
    "freeze_voting": "ЗАМОРОЗИТИ",
    "unfreeze_voting": "РОЗМОРОЗИТИ",
    "locked_badge": "ЗАБЛОКОВАНО",
    "used": "ВИКОРИСТАНО",
    "joker_slots_used": "Джокерів ВИКОРИСТАНО",
    "joker_point": "Джокер-бал",
    "no_slots_left": "Слоти закінчились",
    "confirm_remove_participant": "Ви впевнені, що хочете видалити цього учасника? Всі його голоси буде втрачено.",
    "country_exists": "Ця країна вже є у списку!",
    "participant_exists": "Цей учасник вже є у списку!",
    "off": "ВИМК",
    "pts": "БАЛІВ",
    "join_session_loading": "...",
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
