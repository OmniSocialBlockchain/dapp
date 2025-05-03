import { useAccount } from "wagmi"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Activity {
  id: string
  type: string
  user: {
    address: string
    name: string
  }
  content: string
  timestamp: string
}

export function ActivityFeed() {
  const { address } = useAccount()
  const activities: Activity[] = [
    {
      id: "1",
      type: "post",
      user: {
        address: "0x123...456",
        name: "User 1",
      },
      content: "Just posted a new update!",
      timestamp: "2 hours ago",
    },
    {
      id: "2",
      type: "comment",
      user: {
        address: "0x789...012",
        name: "User 2",
      },
      content: "Great post!",
      timestamp: "1 hour ago",
    },
  ]

  return (
    <Card>
      <CardContent className="p-6">
        <ScrollArea className="h-[600px]">
          <div className="space-y-4">
            {activities.map((activity) => (
              <Card key={activity.id}>
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <Avatar>
                      <AvatarImage
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activity.user.address}`}
                      />
                      <AvatarFallback>{activity.user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium leading-none">
                          {activity.user.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {activity.timestamp}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {activity.content}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
} 