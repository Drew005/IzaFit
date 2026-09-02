import { getCurrentCustomer } from "@/lib/customer-auth";
import { CartProvider } from "@/components/store/CartProvider";
import { FavoritesProvider } from "@/components/store/FavoritesProvider";
import StoreHeader from "@/components/store/StoreHeader";
import StoreFooter from "@/components/store/StoreFooter";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const customer = await getCurrentCustomer();

  return (
    <FavoritesProvider>
      <CartProvider>
        <div className="flex min-h-screen flex-col">
          <StoreHeader customer={customer} />
          <main className="flex-1">{children}</main>
          <StoreFooter />
        </div>
      </CartProvider>
    </FavoritesProvider>
  );
}
