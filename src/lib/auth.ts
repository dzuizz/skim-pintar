import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { supabase } from './supabase'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const { data: admin, error } = await supabase
          .from('admins')
          .select('*')
          .eq('email', credentials.email)
          .single()

        if (error || !admin) return null

        const isValid = await bcrypt.compare(credentials.password, admin.password_hash)
        if (!isValid) return null

        return {
          id: String(admin.id),
          name: admin.name,
          email: admin.email,
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/admin/login' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).id = token.id
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
