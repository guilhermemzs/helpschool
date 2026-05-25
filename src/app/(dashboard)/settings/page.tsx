export default function SettingsPage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Configurações</h1>
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3 text-sm text-gray-600">
        <div className="flex justify-between py-2 border-b border-gray-100"><span className="font-medium">Sistema</span><span className="text-gray-400">Help School v2.0</span></div>
        <div className="flex justify-between py-2 border-b border-gray-100"><span className="font-medium">Framework</span><span className="text-gray-400">Next.js 14 + TypeScript</span></div>
        <div className="flex justify-between py-2 border-b border-gray-100"><span className="font-medium">Banco</span><span className="text-gray-400">PostgreSQL + Prisma</span></div>
        <div className="flex justify-between py-2"><span className="font-medium">Auth</span><span className="text-gray-400">NextAuth.js</span></div>
      </div>
    </div>
  )
}
