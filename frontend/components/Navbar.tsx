"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const path = usePathname();
  const links = [
    { href: "/",        label: "🏠 Dashboard" },
    { href: "/courses", label: "📚 My Courses" },
    { href: "/chatbot", label: "🤖 BLC Chatbot" },
    { href: "/ews",     label: "⚠️ Early Warning" },
  ];
  return (
    <nav className="bg-blue-900 text-white px-6 py-4 flex items-center gap-8 shadow-lg">
      <span className="text-xl font-bold tracking-wide">🎓 LearnGuard AI</span>
      <div className="flex gap-6">
        {links.map(l => (
          <Link key={l.href} href={l.href}
            className={`text-sm font-medium hover:text-yellow-300 transition-colors ${
              path === l.href ? "text-yellow-300 border-b-2 border-yellow-300 pb-1" : ""
            }`}>
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}