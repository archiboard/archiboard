export default function Contacts() {
  return (
    <>
      {/* Header */}
      <header className="px-8 py-6 border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-black">Контакты</h1>
      </header>

      {/* Content */}
      <div className="flex-1 p-8">
        <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Имя
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Роль
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Телефон
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Иван Петров
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  Прораб
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  +7 900 123 45 67
                </td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Мария Студия Света
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  Поставщик
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  +7 900 234 56 78
                </td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Алексей Мебель
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  Поставщик
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  +7 900 345 67 89
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

