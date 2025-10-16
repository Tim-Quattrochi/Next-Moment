import Link from "next/link";
import { Heart } from "lucide-react";
import { useUser } from "@stackframe/stack";
// Note: NavigationMenu and UserMenu components need to be created or imported from correct location
// import { NavigationMenu } from "@/components/navigation/NavigationMenu";
// import { UserMenu } from "@/components/navigation/UserMenu";


interface HeaderProps {
  onOpenRepair?: () => void;
}

export default function Header({ onOpenRepair }: HeaderProps) {
  const user = useUser();

  const isAuthenticated = !!user;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          {/* NavigationMenu component needs to be created */}
          {/* {isAuthenticated && onOpenRepair && (
            <NavigationMenu onOpenRepair={onOpenRepair} />
          )} */}

  <Link href="/" className="flex items-center gap-2" aria-label="Navigate to home">
  <img
    src="/logo-4.png"
    alt="Next Moment Logo"

    decoding="async"
    fetchPriority="high"
    className="h-38 w-auto object-contain"
  />
</Link>


          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-6 ml-6">
              <Link
                href="/daily-ritual"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                data-testid="nav-link-daily-ritual"
              >
                Daily Ritual
              </Link>
              <Link
                href="/journal"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                data-testid="nav-link-journal"
              >
                Journal
              </Link>
            </nav>
          )}
        </div>

        {/* UserMenu component needs to be created */}
        {/* {isAuthenticated && onOpenRepair && (
          <div className="hidden md:block">
            <UserMenu onOpenRepair={onOpenRepair} />
          </div>
        )} */}
      </div>
    </header>
  );
}
