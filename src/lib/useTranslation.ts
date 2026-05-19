import { useStore } from '../store/useStore';
import { translations } from './i18n';

export function useTranslation() {
  const { profile } = useStore();
  const lang = profile.language || 'en';
  
  const t = (path: string) => {
    const keys = path.split('.');
    let result: any = translations[lang];
    
    for (const key of keys) {
      if (result && result[key]) {
        result = result[key];
      } else {
        return path;
      }
    }
    return result;
  };

  return { t, lang };
}
