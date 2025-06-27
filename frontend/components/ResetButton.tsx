import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'

interface ResetButtonProps {
  onReset: () => void
  disabled: boolean
}

export default function ResetButton({ onReset, disabled }: ResetButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onReset}
      disabled={disabled}
      className="flex items-center gap-2"
    >
      <RotateCcw size={16} />
      Reset Chat
    </Button>
  )
} 