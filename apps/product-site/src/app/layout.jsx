import "./globals.css";
import { Manrope, Sora } from "next/font/google";
import localFont from "next/font/local";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body-loaded",
});

const sora = Sora({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display-loaded",
});

const materialSymbols = localFont({
  src: "./assets/fonts/MaterialSymbolsOutlined.woff2",
  variable: "--font-material-symbols",
  display: "swap",
});

export const metadata = {
  title: "Product Site",
  description: "Pricing, signup, and account management for Hubforj.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={[manrope.variable, sora.variable, materialSymbols.variable].join(" ")}>
      <body>{children}</body>
    </html>
  );
}
