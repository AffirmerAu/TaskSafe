import { useEffect } from "react";
import { SignIn, SignedIn, SignedOut, useAuth } from "@clerk/clerk-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { useLocation } from "wouter";

export default function AdminLogin() {
  const { isSignedIn, isLoaded } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      setLocation("/admin");
    }
  }, [isLoaded, isSignedIn, setLocation]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold">TaskSafe Admin</CardTitle>
            <p className="text-muted-foreground">Sign in with your Clerk account to access the dashboard</p>
          </CardHeader>
          <CardContent>
            <SignedOut>
              <SignIn
                routing="hash"
                afterSignInUrl="/admin"
                appearance={{
                  elements: {
                    formButtonPrimary: "bg-primary hover:bg-primary/90",
                  },
                }}
              />
            </SignedOut>
            <SignedIn>
              <div className="text-center py-6 text-sm text-muted-foreground">
                Redirecting to your dashboard...
              </div>
            </SignedIn>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}