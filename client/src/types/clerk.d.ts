declare module "@clerk/clerk-react" {
  import type { ReactNode, FC } from "react";

  export const ClerkProvider: FC<{ children: ReactNode; publishableKey: string }>;
  export const SignIn: FC<any>;
  export const SignedIn: FC<{ children?: ReactNode }>;
  export const SignedOut: FC<{ children?: ReactNode }>;
  export const UserButton: FC<any>;
  export function useAuth(): {
    isLoaded: boolean;
    isSignedIn: boolean;
    signOut: (options?: unknown) => Promise<void>;
  };
}

declare module "@clerk/express" {
  import type { RequestHandler } from "express";

  export interface LooseAuthProp {
    auth?: {
      userId?: string | null;
    };
  }

  export function ClerkExpressWithAuth(): RequestHandler;
}

declare module "@clerk/backend" {
  export function Clerk(config: { secretKey: string }): {
    users: {
      createUser(params: any): Promise<{ id: string }>;
      updateUser(userId: string, params: any): Promise<void>;
      deleteUser(userId: string): Promise<void>;
    };
  };
}
