import Link from "next/link";

export default function StoreFooter() {
  return (
    <footer className="border-t border-base-line bg-base-raised">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-4 md:px-6">
        <div className="md:col-span-2">
          <p className="font-display text-lg font-semibold tracking-tight text-ink">
            IzaFit
          </p>
          <p className="mt-2 max-w-sm text-sm text-ink-soft">
            Moda esportiva e fitness para quem leva o treino a sério. Roupas,
            acessórios e suplementos para a sua melhor versão.
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-ink">Navegação</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            <li>
              <Link href="/" className="transition-colors hover:text-ink">
                Início
              </Link>
            </li>
            <li>
              <Link href="/produtos" className="transition-colors hover:text-ink">
                Loja
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-medium text-ink">Institucional</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            <li>
              <Link href="/admin" className="transition-colors hover:text-ink">
                Acesso administrativo
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-base-line px-4 py-4 text-center text-xs text-ink-soft">
        © {new Date().getFullYear()} IzaFit — Todos os direitos reservados.
      </div>
    </footer>
  );
}
