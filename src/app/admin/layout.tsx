export default function AdminLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return <div className="min-h-screen flex flex-col">{children}</div>
  }
