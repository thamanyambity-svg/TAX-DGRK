import type { Metadata } from "next";
import { Inter, Source_Code_Pro, Merriweather } from "next/font/google";
import "./globals.css";


const inter = Inter({ subsets: ["latin"] });
const sourceCodePro = Source_Code_Pro({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-source-code-pro" });
const merriweather = Merriweather({ subsets: ["latin"], weight: ["400", "700"], style: ["normal", "italic"], variable: "--font-merriweather" });

export const metadata: Metadata = {
  title: "Tax Portal",
  description: "Portail de déclaration fiscale",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning className={`${sourceCodePro.variable} ${merriweather.variable}`}>
      <body className={`${inter.className} antialiased bg-gray-50`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
