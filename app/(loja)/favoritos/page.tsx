"use client";

import Link from "next/link";
import { Heart, HeartOff, Shirt } from "lucide-react";
import { useFavorites } from "@/components/store/FavoritesProvider";
import { currency } from "@/lib/format";

export default function FavoritosPage() {
  const { items, toggle, count } = useFavorites();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
        Meus favoritos
      </h1>
      <p className="mt-1 text-sm text-ink-soft">
        {count} {count === 1 ? "produto salvo" : "produtos salvos"}
      </p>

      {items.length === 0 ? (
        <div className="mt-10 rounded-md border border-dashed border-base-line bg-base-raised p-14 text-center">
          <Heart size={40} className="mx-auto text-ink-soft/40" />
          <p className="mt-4 text-ink-soft">
            Você ainda não tem produtos favoritos.
          </p>
          <Link
            href="/produtos"
            className="mt-4 inline-block rounded-sm bg-volt px-5 py-2.5 text-sm font-medium text-base transition-colors hover:bg-volt-dim"
          >
            Explorar produtos
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="group flex flex-col overflow-hidden rounded-md border border-base-line bg-base-raised transition-all hover:border-volt/60 hover:shadow-lg"
            >
              <Link
                href={`/produtos/${item.id}`}
                className="relative block h-48 w-full overflow-hidden bg-[#14161b]"
              >
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center">
                    <Shirt size={40} className="text-ink-soft/40" />
                  </div>
                )}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    toggle(item);
                  }}
                  className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-base/90 text-alert shadow-sm transition-colors hover:bg-alert hover:text-base"
                  title="Remover dos favoritos"
                >
                  <HeartOff size={15} />
                </button>
              </Link>
              <div className="flex flex-1 flex-col p-3">
                <Link
                  href={`/produtos/${item.id}`}
                  className="line-clamp-2 font-medium text-ink transition-colors group-hover:text-volt"
                >
                  {item.name}
                </Link>
                <div className="mt-auto pt-2">
                  {item.price !== null ? (
                    <p className="font-display text-lg text-ink">
                      {currency(item.price)}
                    </p>
                  ) : (
                    <p className="text-sm text-ink-soft">Consultar</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
