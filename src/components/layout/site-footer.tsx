export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border/60 bg-background">
      <div className="container py-6">
        <p className="text-center text-xs text-muted-foreground">
          © {year} 岸上见 · 公考备考助手
        </p>
      </div>
    </footer>
  );
}