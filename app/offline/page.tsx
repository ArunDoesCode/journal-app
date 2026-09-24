import { WifiOff } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function OfflinePage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <WifiOff className="mx-auto mb-2 h-10 w-10 text-muted-foreground" />
          <CardTitle className="text-2xl">You&apos;re offline</CardTitle>
          <CardDescription>
            Reconnect to the internet to keep tracking your measurements and
            journal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground">
            This page will keep working once your connection is back.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
