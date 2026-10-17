import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Compass } from "lucide-react";
import asaDialerLogo from "@/assets/asa-dialer-logo.svg";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404: route findes ikke:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <div className="card-surface flex w-full max-w-md flex-col items-center p-8 text-center">
        <img src={asaDialerLogo} alt="ASA Dialer" className="mb-4 h-14 w-auto" />
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent">
          <Compass size={24} strokeWidth={1.75} className="text-primary" aria-hidden="true" />
        </div>
        <h1 className="font-heading text-4xl font-bold text-navy">404</h1>
        <p className="mt-2 text-base text-muted-foreground">Siden findes ikke. Linket kan være forældet, eller adressen er tastet forkert.</p>
        <Link to="/" className="btn-primary mt-6">
          Gå til forsiden
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
