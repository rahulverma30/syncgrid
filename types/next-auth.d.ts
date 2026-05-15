import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      companyId: string;
      roles: string[];
      permissions: string[];
      status: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    companyId: string;
    roles: string[];
    permissions: string[];
    status: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    companyId?: string;
    roles?: string[];
    permissions?: string[];
    status?: string;
  }
}
