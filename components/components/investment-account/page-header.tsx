type PageHeaderProps = {
  title: string
  description: string
}

export function PageHeader({ title }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
    </div>
  )
}
