import { useEffect } from "react";
import { useLocation } from "wouter";

const NotFound = () => {
  const [location] = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location);
  }, [location]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center glass-card p-12 rounded-lg">
        <h1 className="mb-4 text-4xl font-bold text-foreground">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Página não encontrada</p>
        <a href="/" className="text-primary underline hover:text-primary/80 transition-colors">
          Voltar ao início
        </a>
      </div>
    </div>
  );
};

export default NotFound;
