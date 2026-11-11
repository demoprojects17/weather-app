import "./globals.css";
export const metadata = {
  title: "ცის ქვეშ — ამინდი",
  description: "მოძებნე ქალაქი და ნახე მიმდინარე ამინდი და 5-დღიანი პროგნოზი.",
};
export const viewport = { themeColor: "#101014" };
export default function RootLayout({ children }) {
  return (
    <html lang="ka">
      <body>{children}</body>
    </html>
  );
}
