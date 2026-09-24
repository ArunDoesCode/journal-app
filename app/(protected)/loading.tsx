import { Spinner } from "@/components/ui/spinner"

const loading = () => {
  return (
    <div className="flex h-screen items-center justify-center">
      <Spinner />
    </div>
  )
}

export default loading
