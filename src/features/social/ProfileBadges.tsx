import React from 'react';
import { useUser } from '@/context/UserContext';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Date;
}

const mockBadges: Badge[] = [
  {
    id: 'first-transaction',
    name: 'First Transaction',
    description: 'Completed your first transaction',
    icon: '🚀',
    earnedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
  },
  {
    id: 'dao-member',
    name: 'DAO Member',
    description: 'Participated in DAO governance',
    icon: '🏛️',
    earnedAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
  },
  {
    id: 'social-butterfly',
    name: 'Social Butterfly',
    description: 'Connected with 10+ users',
    icon: '🦋',
    earnedAt: new Date(Date.now() - 1000 * 60 * 60 * 72), // 3 days ago
  },
];

export function ProfileBadges() {
  const { address } = useUser();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Badges</h3>
      <div className="flex flex-wrap gap-2">
        <TooltipProvider>
          {mockBadges.map((badge) => (
            <Tooltip key={badge.id}>
              <TooltipTrigger>
                <Badge variant="secondary" className="text-lg">
                  {badge.icon} {badge.name}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{badge.description}</p>
                <p className="text-xs text-muted-foreground">
                  Earned {new Date(badge.earnedAt).toLocaleDateString()}
                </p>
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>
    </div>
  );
} 