import { SignUp } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className='flex items-center justify-center min-h-screen bg-linear-to-br from-stone-700 via-gray-950 to-gray-600'>
    <SignUp />
    </div>
    
)
}