import "./globals.css";
import { Manrope, Sora, Space_Grotesk } from "next/font/google";
import localFont from "next/font/local";
import { defaultTheme } from "@/lib/theme/default-theme";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body-manrope",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display-sora",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display-space-grotesk",
  display: "swap",
});

const materialSymbols = localFont({
  src: "./assets/fonts/MaterialSymbolsOutlined.woff2",
  variable: "--font-material-symbols",
  display: "swap",
});

export const metadata = {
  title: "Hub Platform",
  description: "Multi-hub operations platform with branded public site delivery.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      data-theme={defaultTheme}
      className={[manrope.variable, sora.variable, spaceGrotesk.variable, materialSymbols.variable].join(" ")}
    >
      <body>{children}</body>
    </html>
  );
}
