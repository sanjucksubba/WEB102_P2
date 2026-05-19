import "./globals.css";
import { AuthProvider } from "@/contexts/authContext";
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "TikTok Clone",
  description: "A TikTok-like application built with Next.js",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          {children}
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}