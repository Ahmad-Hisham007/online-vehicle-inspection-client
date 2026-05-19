import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  /**
   * User structure for WordPress JWT
   */
  interface User {
    id: string;
    wpId: number;
    accessToken: string;
    name: string;
    email: string;
    emailVerified: Date | null;
  }

  /**
   * session.user-ke strictly amader User type-e set kora hochche.
   * Library-r default properties (emailVerified) ekhane ar ashbe na.
   */
  interface Session {
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    user: {
      id: string;
      wpId: number;
      accessToken: string;
      name: string;
      email: string;
      emailVerified: Date | null;
    };
  }
}
