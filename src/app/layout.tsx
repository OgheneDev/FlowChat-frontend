import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/layout/ClientLayout";
import { ToastContainer } from "@/components/ui/ToastContainer";

const poppins = Poppins({ subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: "FlowChat",
  description: "Real-time chat web application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={poppins.className}>
        <ClientLayout>
          {children}
          <ToastContainer />
        </ClientLayout>
      </body>
    </html>
  );
}
