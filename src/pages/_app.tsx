import "@/styles/globals.css";
import "@/styles/app.css";
import "animate.css";
import "react-toastify/dist/ReactToastify.css";
import { ReactNode, useEffect } from "react";
import type { AppProps } from "next/app";
import { IconContext } from "react-icons";
import Head from "next/head";
import Footer from "@/components/Footer";
import { useAuth } from "../hook/useAuth";
import { ThemeProvider } from "../lib/ThemeContext";
import RPC from "../services/solanaRPC";

const Layout = ({ children }: { children: ReactNode }) => (
  <div id="page-container">
    <main>{children}</main>
    <Footer />
  </div>
);

function AppContent({ Component, pageProps }: AppProps) {
  const { initAuth, handleLogin, handleLogout, provider, loggedIn } = useAuth();
  const rpc = provider ? new RPC(provider) : null;

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <IconContext.Provider value={{ style: { verticalAlign: "middle" } }}>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content="Win gems, manage your amusement park rewards"
        />
        <meta name="author" content="GemQuest Team" />
        <link rel="icon" href="/favicon.ico" />
        <title>GemQuest</title>
      </Head>
      <Layout>
        <Component
          {...pageProps}
          login={handleLogin}
          logout={handleLogout}
          loggedIn={loggedIn}
          provider={provider}
          rpc={rpc}
        />
      </Layout>
    </IconContext.Provider>
  );
}

export default function App(props: AppProps) {
  return (
    <ThemeProvider>
      <AppContent {...props} />
    </ThemeProvider>
  );
}
