import { Skeleton } from '@/components/ui/skeleton'

export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden" role="status" aria-label="Carregando dados">
      <div className="grid h-11 items-center gap-5 bg-secondary/60 px-5" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: columns }).map((_, index) => <Skeleton key={index} className="h-3 w-2/3" />)}
      </div>
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="grid min-h-16 items-center gap-5 border-t border-border px-5" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }).map((__, column) => (
            <Skeleton key={column} className={column === 0 ? 'h-4 w-4/5' : 'h-3 w-2/3'} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="grid gap-6" role="status" aria-label="Carregando métricas">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-border bg-card px-5 py-5 shadow-sm">
            <Skeleton className="size-10 rounded-xl" />
            <Skeleton className="mt-3 h-9 w-24" />
            <Skeleton className="mt-2 h-4 w-36" />
          </div>
        ))}
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, section) => (
          <section key={section} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <Skeleton className="h-5 w-44" />
            <div className="mt-6 grid gap-4">
              {Array.from({ length: 5 }).map((__, row) => (
                <div key={row} className="grid grid-cols-[9rem_1fr_2rem] items-center gap-3">
                  <Skeleton className="h-4" /><Skeleton className="h-3 rounded-full" /><Skeleton className="h-4" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

export function CategoriesSkeleton() {
  return (
    <div className="grid gap-6" role="status" aria-label="Carregando categorias">
      <section className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <Skeleton className="size-10 rounded-xl" /><Skeleton className="mt-3 h-9 w-16" /><Skeleton className="mt-2 h-4 w-40" />
          </div>
        ))}
      </section>
      <Skeleton className="h-10 w-full max-w-md" />
      <div className="grid gap-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <article key={index} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border bg-secondary/30 px-6 py-4"><Skeleton className="h-6 w-52" /><Skeleton className="mt-2 h-4 w-full max-w-xl" /></div>
            <div className="grid gap-3 p-6 sm:grid-cols-2"><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
          </article>
        ))}
      </div>
    </div>
  )
}

export function KanbanCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card px-3.5 py-3 shadow-sm">
      <Skeleton className="h-3 w-24" /><Skeleton className="mt-3 h-4 w-3/4" />
      <Skeleton className="mt-2 h-3 w-28" />
      <div className="mt-3 flex gap-2"><Skeleton className="h-5 w-20 rounded-full" /><Skeleton className="h-5 w-16 rounded-full" /></div>
      <div className="mt-3 border-t border-border pt-2"><Skeleton className="h-3 w-24" /></div>
    </div>
  )
}

export function KanbanColumnSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <section className="flex h-full min-h-[24rem] flex-col overflow-hidden rounded-2xl border border-border bg-secondary/55 shadow-sm" role="status" aria-label="Atualizando etapa">
      <div className="flex h-12 items-center justify-between bg-primary/75 px-4"><Skeleton className="h-4 w-28 bg-primary-foreground/35" /><Skeleton className="size-6 rounded-full bg-primary-foreground/35" /></div>
      <div className="grid gap-3 p-3">
        <Skeleton className="h-9 w-full" />
        {Array.from({ length: compact ? 2 : 3 }).map((_, index) => <KanbanCardSkeleton key={index} />)}
      </div>
    </section>
  )
}

export function KanbanSkeleton() {
  return <div className="grid h-full min-h-0 auto-rows-[32rem] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:auto-rows-fr xl:grid-cols-5">{Array.from({ length: 5 }).map((_, index) => <KanbanColumnSkeleton key={index} compact />)}</div>
}

export function FormSkeleton() {
  return (
    <section className="px-6 py-6 lg:px-8" role="status" aria-label="Carregando formulário">
      <div className="mx-auto grid max-w-7xl gap-6">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm"><Skeleton className="h-40 w-full" /></div>
        {Array.from({ length: 2 }).map((_, section) => (
          <div key={section} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <Skeleton className="h-6 w-44" />
            <div className="mt-6 grid gap-4"><Skeleton className="h-11 w-full" /><Skeleton className="h-11 w-full" /><Skeleton className="ml-auto h-10 w-32 rounded-full" /></div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function ProtocolDetailSkeleton() {
  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm" role="status" aria-label="Consultando protocolo">
      <div className="flex items-center justify-between border-b border-border bg-secondary/50 px-6 py-5">
        <div><Skeleton className="h-3 w-20" /><Skeleton className="mt-2 h-6 w-48" /></div>
        <Skeleton className="h-7 w-28 rounded-full" />
      </div>
      <div className="grid gap-px bg-border sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => <div key={index} className="bg-card px-6 py-4"><Skeleton className="h-3 w-20" /><Skeleton className="mt-2 h-4 w-4/5" /></div>)}
      </div>
      <div className="border-t border-border px-6 py-6"><Skeleton className="h-5 w-44" /><div className="mt-5 grid gap-4"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div></div>
    </section>
  )
}

export function PageSkeleton() {
  return (
    <div className="min-h-[60dvh] px-6 py-6 lg:px-8" role="status" aria-label="Carregando página">
      <Skeleton className="h-8 w-64" /><Skeleton className="mt-3 h-4 w-full max-w-xl" />
      <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm"><Skeleton className="h-12 w-full" /><div className="mt-6"><TableSkeleton rows={5} columns={4} /></div></div>
    </div>
  )
}
