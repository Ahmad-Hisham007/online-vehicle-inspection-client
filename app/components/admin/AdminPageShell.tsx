interface AdminPageShellProps {
  title: string;
  children: React.ReactNode;
}

export default function AdminPageShell({
  title,
  children,
}: AdminPageShellProps) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="mb-2 text-lg font-semibold text-primary">{title}</h1>
      {children}
    </div>
  );
}
