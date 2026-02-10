"use client";

import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useMemo } from "react";
import { DEVNET_RPC } from "@/lib/constants";
import { ThemeProvider } from "@/lib/theme-context";

import "@solana/wallet-adapter-react-ui/styles.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10000,
      retry: 2,
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <QueryClientProvider client={queryClient}>
      <ConnectionProvider endpoint={DEVNET_RPC}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </QueryClientProvider>
  );
}
