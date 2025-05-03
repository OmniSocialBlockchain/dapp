import { useAccount } from "wagmi"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ActivityFeed } from "@/features/social/ActivityFeed"
import { PortfolioAnalytics } from "@/features/analytics/PortfolioAnalytics"

export default function Dashboard() {
  const { address } = useAccount()

  if (!address) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Card>
          <CardHeader>
            <CardTitle>Connect your wallet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Please connect your wallet to view your dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="activity" className="w-full">
        <TabsList>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="activity">
          <ActivityFeed />
        </TabsContent>
        <TabsContent value="analytics">
          <PortfolioAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  )
} 