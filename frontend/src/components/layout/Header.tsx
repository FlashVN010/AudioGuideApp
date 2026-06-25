import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, LayoutDashboard, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import ThemeToggle from '@/components/ui/ThemeToggle';
import SearchBar from '@/components/search/SearchBar';
import { cn } from '@/utils/cn';
import { useAuth } from '@/hooks/useAuth';

interface HeaderProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  showSearch?: boolean;
}

const LANGUAGES = [
  { code: 'en', label: 'EN', full: 'English',      flag: '🇺🇸' },
  { code: 'vi', label: 'VI', full: 'Tiếng Việt',   flag: '🇻🇳' },
];

export default function Header({ searchQuery, onSearchChange, showSearch = true }: HeaderProps) {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, role, setLoginModalOpen } = useAuth();
  const [langOpen, setLangOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentLang = LANGUAGES.find(l => l.code === i18n.language) ?? LANGUAGES[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setLangOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full bg-surface/90 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">

        {/* Wordmark */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0 select-none">
          {/* Minimal square mark */}
          <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-primary flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="1" width="5" height="5" rx="1" fill="white"/>
              <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity="0.6"/>
              <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity="0.6"/>
              <rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity="0.3"/>
            </svg>
          </div>
          <span className="font-semibold text-sm tracking-tight text-text-primary group-hover:text-text-secondary transition-colors">
            VK Atlas
          </span>
        </Link>

        {/* Search */}
        {showSearch && onSearchChange !== undefined && searchQuery !== undefined ? (
          <div className="hidden md:flex flex-1 justify-center max-w-md">
            <SearchBar
              query={searchQuery}
              onChange={onSearchChange}
              placeholder={t('header.searchPlaceholder', 'Search places...')}
            />
          </div>
        ) : (
          <div className="hidden md:block flex-1" />
        )}

        {/* Controls */}
        <div className="flex items-center gap-1.5 shrink-0">

          <ThemeToggle />

          {/* Language selector */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setLangOpen(p => !p)}
              className={cn(
                'flex items-center gap-1 h-8 px-2.5 rounded-[var(--radius-md)] text-xs font-medium',
                'border border-border bg-card text-text-secondary hover:text-text-primary hover:border-border-hover',
                'transition-colors cursor-pointer outline-none select-none',
                langOpen && 'border-border-hover text-text-primary'
              )}
              aria-expanded={langOpen}
            >
              <span className="text-sm">{currentLang.flag}</span>
              <span>{currentLang.label}</span>
              <ChevronDown size={11} className={cn('transition-transform duration-150 text-text-muted', langOpen && 'rotate-180')} />
            </button>

            {langOpen && (
              <div className="absolute right-0 mt-1 w-36 rounded-[var(--radius-md)] border border-border bg-card shadow-md py-0.5 z-50 animate-slide-in-top">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => { i18n.changeLanguage(lang.code); setLangOpen(false); }}
                    className={cn(
                      'flex items-center gap-2 w-full text-left px-3 py-1.5 text-xs font-medium cursor-pointer outline-none',
                      'text-text-secondary hover:text-text-primary hover:bg-surface-alt transition-colors',
                      lang.code === i18n.language && 'text-text-primary font-semibold bg-surface-alt'
                    )}
                  >
                    <span className="text-sm">{lang.flag}</span>
                    <span>{lang.full}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Auth */}
          {isAuthenticated ? (
            <Link
              to={role === 'admin' ? '/admin' : '/owner'}
              className="hidden md:flex items-center gap-1.5 h-8 px-3 rounded-[var(--radius-md)] text-xs font-medium border border-border text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors outline-none cursor-pointer"
            >
              <LayoutDashboard size={13} />
              {role === 'admin' ? t('nav.adminDashboard', 'Admin') : t('nav.ownerDashboard', 'Dashboard')}
            </Link>
          ) : (
            <button
              onClick={() => setLoginModalOpen(true)}
              className="hidden md:flex items-center gap-1.5 h-8 px-3 rounded-[var(--radius-md)] text-xs font-semibold text-white bg-primary hover:bg-primary-hover transition-colors outline-none cursor-pointer"
            >
              <LogIn size={13} />
              {t('nav.login', 'Sign in')}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}