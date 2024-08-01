import { Inter } from "next/font/google";
import "./globals.css";
import { Icon } from "@mui/material";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Pantry Easy",
  description: "Simplify your pantry management",
  icons: {
    icon: './favicon.ico', // Use root-relative path for public directory
    apple: '/icon.png' // Use correct path for apple touch icon
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
