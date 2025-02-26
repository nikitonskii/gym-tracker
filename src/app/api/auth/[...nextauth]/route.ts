import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { connectToDB } from "@/lib/mongodb"
import User from "@/models/User"
import bcrypt from "bcryptjs"
import { Session } from 'next-auth'

interface CustomUser {
  id: string
  nickname: string
  email?: string
}

interface CustomSession extends Session {
  user: {
    id: string
    nickname: string
    email?: string
    image?: string
  }
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        nickname: { label: "Nickname", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.nickname || !credentials?.password) return null;
        
        await connectToDB();
        const user = await User.findOne({ nickname: credentials.nickname });
        if (!user) return null;
        
        const isPasswordMatch = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordMatch) return null;
        
        return {
          id: user._id.toString(),
          nickname: user.nickname,
          email: user.email
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const customUser = user as CustomUser;
        token.id = customUser.id;
        token.nickname = customUser.nickname;
      }
      return token;
    },
    async session({ session, token }): Promise<CustomSession> {
      return {
        ...session,
        user: {
          id: token.id as string,
          nickname: token.nickname as string,
          email: session.user?.email || undefined,
          image: session.user?.image || undefined
        }
      };
    }
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST } 