import { getServerSession } from "next-auth";
import { authOptions, type OpenFIIsSession } from "@/lib/auth";

export async function requireOpenFIIsSession() {
  const session = await getServerSession(authOptions) as OpenFIIsSession | null;

  if (!session?.user?.id) {
    throw new Error("Usuario nao autenticado pelo PortalAuth.");
  }

  return session;
}
