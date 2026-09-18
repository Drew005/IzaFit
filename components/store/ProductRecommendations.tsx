import Link from "next/link";
import { Sparkles, TrendingUp, Flame, ShoppingBag, ArrowRight } from "lucide-react";
import ProductCard from "@/components/store/ProductCard";
import type { RecommendedProduct } from "@/lib/recommendations";

interface ProductRecommendationsProps {
  products: RecommendedProduct[];
  title?: string;
  subtitle?: string;
  showViewAll?: boolean;
  className?: string;
}

const REASON_LABELS: Record<
  NonNullable<RecommendedProduct["recommendationReason"]>,
  { label: string; icon: any; badgeClass: string }
> = {
  bought_together: {
    label: "Comprados juntos",
    icon: ShoppingBag,
    badgeClass: "bg-volt/20 text-volt border-volt/30",
  },
  same_category: {
    label: "Combina com você",
    icon: Sparkles,
    badgeClass: "bg-base text-ink border-base-line",
  },
  top_seller: {
    label: "Mais vendido",
    icon: TrendingUp,
    badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  special_offer: {
    label: "Em promoção",
    icon: Flame,
    badgeClass: "bg-alert/20 text-alert border-alert/30",
  },
  trending: {
    label: "Em alta",
    icon: Sparkles,
    badgeClass: "bg-volt/15 text-volt border-volt/30",
  },
};

export default function ProductRecommendations({
  products,
  title = "Recomendados para você",
  subtitle = "Peças selecionadas com base no seu estilo e nos itens mais procurados",
  showViewAll = false,
  className = "",
}: ProductRecommendationsProps) {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className={`space-y-6 ${className}`}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-volt">
            <Sparkles size={14} />
            <span>Sugestões IzaFit</span>
          </div>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink md:text-3xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>
          )}
        </div>

        {showViewAll && (
          <Link
            href="/produtos"
            className="inline-flex items-center gap-1 text-xs font-medium text-volt hover:text-volt-dim transition-colors pt-1 sm:pt-0"
          >
            Ver todos os produtos
            <ArrowRight size={14} />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-4">
        {products.map((p) => {
          const reasonMeta = p.recommendationReason
            ? REASON_LABELS[p.recommendationReason]
            : null;
          const ReasonIcon = reasonMeta?.icon;

          return (
            <div key={p.id} className="flex flex-col relative group">
              {reasonMeta && (
                <div className="mb-2 flex items-center">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${reasonMeta.badgeClass}`}
                  >
                    {ReasonIcon && <ReasonIcon size={11} />}
                    {reasonMeta.label}
                  </span>
                </div>
              )}
              <ProductCard
                product={p}
                discountById={p.discountById}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
