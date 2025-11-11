import { SignIn } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-gray-600 via-gray-950 to-stone-700">
  <SignIn />
</div>
  )
}