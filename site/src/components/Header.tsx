import { useState, useEffect } from 'react';
import { Sun, Moon, Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { siteConfig } from '../site.config';

const navItems = [
  { path: '/', label: 'Home' },
  { path: '/about', label: 'About' },
  { path: '/blog', label: 'Blog' },
  { path: '/ebook', label: 'eBook' },
  { path: '/ai', label: 'AI' },
  { path: '/projects', label: 'Projects' },
  { path: '/certifications', label: 'Certifications' },
  { path: '/events', label: 'Events' },
  { path: '/resources', label: 'Resources' },
  { path: '/contact', label: 'Contact' },
];

export default function Header() {
  const [isDark, setIsDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState('/');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setCurrentPath(window.location.pathname);
    setIsDark(document.documentElement.classList.contains('dark'));

    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function toggleTheme() {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  }

  const isActive = (path: string) => {
    if (path === '/') return currentPath === '/';
    return currentPath.startsWith(path);
  };

  return (
    <header
      className={`sticky top-0 z-50 backdrop-blur-lg transition-shadow duration-300 ${
        scrolled ? 'shadow-sm' : ''
      }`}
      style={{
        backgroundColor: 'color-mix(in srgb, var(--color-bg) 85%, transparent)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <a href="/" className="flex items-center space-x-3 group">
            <span
              className="text-2xl font-extrabold"
              style={{
                fontFamily: 'var(--font-heading)',
                color: 'var(--color-accent)',
              }}
            >
              KK
            </span>
            <span
              className="text-lg font-bold hidden sm:block"
              style={{
                fontFamily: 'var(--font-heading)',
                color: 'var(--color-text)',
              }}
            >
              {siteConfig.name}
            </span>
          </a>

          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <a
                key={item.path}
                href={item.path}
                className="relative px-3 py-2 text-sm font-medium transition-colors"
                style={{
                  fontFamily: 'var(--font-heading)',
                  color: isActive(item.path) ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                }}
              >
                {item.label}
                {isActive(item.path) && (
                  <span
                    className="absolute bottom-0 left-3 right-3 h-0.5"
                    style={{ backgroundColor: 'var(--color-accent)' }}
                  />
                )}
              </a>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
              aria-label="Toggle theme"
            >
              <motion.div
                key={isDark ? 'sun' : 'moon'}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </motion.div>
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg"
              style={{ color: 'var(--color-text-secondary)' }}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.25 }}
              className="lg:hidden py-4"
              style={{ borderTop: '1px solid var(--color-border)' }}
            >
              {navItems.map((item) => (
                <a
                  key={item.path}
                  href={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-sm font-medium mb-1 rounded-lg transition-colors"
                  style={{
                    fontFamily: 'var(--font-heading)',
                    color: isActive(item.path) ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                    borderLeft: isActive(item.path) ? '3px solid var(--color-accent)' : '3px solid transparent',
                  }}
                >
                  {item.label}
                </a>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
