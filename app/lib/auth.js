// app/lib/auth.js
import CredentialsProvider from "next-auth/providers/credentials";
import User from "@/app/models/user";
import mongoose from "mongoose"; // 👈 Mongoose direct use karein connection ke liye
import { getConnectionString } from "@/app/lib/mongodb"; // 👈 Aapka existing helper
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      async authorize(credentials) {
        // ✅ Aapki API jaisa connection logic
        if (mongoose.connection.readyState === 0) {
          await mongoose.connect(getConnectionString());
        }

        const user = await User.findOne({ email: credentials.email }).select("+password");

        if (!user || user.status === "disabled") {
          throw new Error("Invalid credentials or account disabled");
        }

        const isMatch = await bcrypt.compare(credentials.password, user.password);
        if (!isMatch) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          access: user.access,
        };
      },
    }),
  ],
  callbacks: {
  async jwt({ token, user }) {
  if (user) {
    // MongoDB ki _id ya return ki hui id, dono ko handle karein
    token.id = user.id || user._id; 
    token.role = user.role;
    token.access = user.access;
  }
  return token;
},
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.access = token.access;
      }
      return session;
    },
  },
  pages: {
    signIn: "/signin",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};