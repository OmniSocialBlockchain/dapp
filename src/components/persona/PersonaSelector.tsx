import { usePersona } from "@/hooks/usePersona"
import { Button } from "@/components/ui/button"
import { Persona } from "@/types"

export function PersonaSwitcher() {
  const { personas, currentPersona, switchPersona } = usePersona()

  return (
    <div className="flex items-center gap-2">
      {personas.map((persona: Persona) => (
        <Button
          key={persona.id}
          variant={currentPersona?.id === persona.id ? "default" : "outline"}
          onClick={() => switchPersona(persona.id)}
        >
          {persona.name}
        </Button>
      ))}
    </div>
  )
} 