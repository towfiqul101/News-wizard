import "./globals.css";
export const metadata = {
  title: "News Wizard — by Towfiqul Alam",
  description: "বাংলা সংবাদ বানান পরীক্ষা, সম্পাদনা ও ইংরেজি অনুবাদ। Built by Towfiqul Alam.",
};
export default function RootLayout({ children }) {
  return (
    <html lang="bn">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@400;500;600;700;800;900&family=Cormorant+Garamond:wght@600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
