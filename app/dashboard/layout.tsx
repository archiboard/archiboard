import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <aside className="w-[250px] bg-gray-50 border-r border-gray-200 flex flex-col fixed h-screen">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-gray-200">
          <Link href="/dashboard" className="text-xl font-semibold text-black cursor-pointer">
            ArchiBoard
          </Link>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-4 py-6">
          <ul className="space-y-2">
            <li>
              <Link
                href="/dashboard"
                className="block px-4 py-2 text-gray-900 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
              >
                Проекты
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/contacts"
                className="block px-4 py-2 text-gray-900 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
              >
                Контакты
              </Link>
            </li>
            <li>
              <a
                href="#"
                className="block px-4 py-2 text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                Каталог
              </a>
            </li>
            <li>
              <a
                href="#"
                className="block px-4 py-2 text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                Сметы
              </a>
            </li>
          </ul>
        </nav>

        {/* User Profile */}
        <div className="px-4 py-4 border-t border-gray-200">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-sm font-medium">
              А
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                Имя Пользователя
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-[250px] flex flex-col min-h-screen">
        {children}
      </main>
    </div>
  );
}

