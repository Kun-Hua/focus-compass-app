'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Header = () => {
  const pathname = usePathname();

  const navLinks = [
    { href: '/vision', label: '願景 (Vision)' },
    { href: '/execute', label: '行動 (Execute)' },
    { href: '/dashboard', label: '儀表板 (Dashboard)' },
    { href: '/league', label: '專注聯賽 (League)' },
    { href: '/partner', label: '夥伴 (Partner)' },
    { href: '/settings', label: '設定 (Settings)' },
  ];

  const linkClasses = (path: string) =>
    `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
      pathname === path
        ? 'bg-black text-white'
        : 'text-gray-600 hover:bg-gray-200 hover:text-black'
    }`;

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b">
      <nav className="container mx-auto flex items-center justify-between p-4">
        <Link href="/vision" className="text-xl font-bold text-gray-800">
          複利指南針
        </Link>
        <div className="flex items-center space-x-4">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={linkClasses(link.href)}>{link.label}</Link>
          ))}
        </div>
      </nav>
    </header>
  );
};

export default Header;