import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import db from "@/lib/db";
import { nextCookies } from "better-auth/next-js";
import VerificationEmail from "@/components/emails/verification-email";
import { Resend } from "resend";
import env from "./env";
import PasswordResetEmail from "@/components/emails/reset-email";

const resend = new Resend(env.RESEND_API_KEY);

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // or "mysql", "sqlite"
  }),
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await resend.emails.send({
        from: "giftora@resend.dev",
        to: [user.email],
        subject: "Reset your password",
        react: PasswordResetEmail({
          userName: user.name,
          resetUrl: url,
          requestTime: new Date().toLocaleString(),
        }),
      });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      const { data, error } = await resend.emails.send({
        from: "giftora@resend.dev",
        to: [user.email],
        subject: "Verify your email address",
        react: VerificationEmail({
          userName: user.name,
          verificationUrl: url,
        }),
      });
      if (error) {
        console.error("Failed to send verification email:", error);
      } else {
        console.log("Verification email sent successfully", data);
      }
    },
    sendOnSignUp: true,
  },
  plugins: [nextCookies()],
});
