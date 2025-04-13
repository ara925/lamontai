import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth-config";

// Create the handler using the external auth options
const handler = NextAuth(authOptions);

// Export the handler as GET and POST
export { handler as GET, handler as POST } 