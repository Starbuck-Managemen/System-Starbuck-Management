import prisma from "@/lib/prisma"
import ResetPasswordForm from "./ResetPasswordForm"
import { ShieldAlert } from "lucide-react"

export default async function ResetPasswordPage(props: { params: Promise<{ token: string }> }) {
  const params = await props.params;
  const token = params.token

  // Cek validitas token
  const user = await prisma.user.findUnique({
    where: { resetToken: token }
  })

  const isInvalid = !user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()

  if (isInvalid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4 font-inter">
        <div className="max-w-md w-full bg-[#1e293b]/80 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
              <ShieldAlert className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Tautan Tidak Valid</h2>
          <p className="text-slate-400 mb-6">
            Tautan reset password ini sudah kadaluarsa atau tidak valid. Silakan lakukan permintaan reset password baru.
          </p>
          <a href="/login" className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all">
            Kembali ke Login
          </a>
        </div>
      </div>
    )
  }

  return <ResetPasswordForm token={token} />
}
