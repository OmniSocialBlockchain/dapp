'use client'

import { usePersona } from "@/hooks/usePersona"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

export function Feed() {
  const { currentPersona } = usePersona()

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Social Feed</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <div className="space-y-4">
            {/* Feed items will be added here */}
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">
                No posts yet. Start following people to see their content!
              </p>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
} 