import { Navbar } from "./navbar";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
      <Navbar />
      <main className="flex-1 w-full">
        {children}
      </main>
      <footer className="border-t py-6 md:py-0 bg-muted/30">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 md:h-16">
          <p className="text-sm text-muted-foreground">
            &copy; 2025 এগ্রোবাংলা (AgroBangla). সর্বস্বত্ব সংরক্ষিত।
          </p>
          <p className="text-sm text-muted-foreground">
             স্মার্ট কৃষি, সমৃদ্ধ বাংলাদেশ
          </p>
        </div>
      </footer>
    </div>
  );
}
