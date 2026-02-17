'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, Book, FileText, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  // Check if we're inside a specific project (has ID in path)
  // For example: /dashboard/projects/5
  // Then hide the global menu so the project page renders its own.
  const isProjectPage = pathname.includes('/dashboard/projects/');

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Render global menu ONLY if we're NOT in a project */}
      {!isProjectPage && (
        <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800">ArchiBoard</h1>
          </div>
          
          <nav className="flex-1 px-4 space-y-2">
            <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <LayoutDashboard size={20} />
              <span className="font-medium">Projects</span>
            </Link>
            <Link href="/dashboard/contacts" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Users size={20} />
              <span className="font-medium">Contacts</span>
            </Link>
            <Link href="/dashboard/catalog" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Book size={20} />
              <span className="font-medium">Catalog</span>
            </Link>
            <Link href="/dashboard/estimates" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <FileText size={20} />
              <span className="font-medium">Estimates</span>
            </Link>
          </nav>

          <div className="p-4 border-t border-gray-200">
             <div className="flex items-center gap-3 px-4 py-3 text-gray-600">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">N</div>
                <div className="text-sm font-medium">User Name</div>
             </div>
             <button
               onClick={handleSignOut}
               className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-2"
             >
               <LogOut size={20} />
               <span className="font-medium">Log Out</span>
             </button>
          </div>
        </aside>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}