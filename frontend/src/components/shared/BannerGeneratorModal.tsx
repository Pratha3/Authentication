'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Image as ImageIcon, Check, AlertCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { aiApi } from '@/lib/api'
import Image from 'next/image'

interface BannerGeneratorModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectImage: (url: string) => void
}

export function BannerGeneratorModal({ isOpen, onClose, onSelectImage }: BannerGeneratorModalProps) {
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [generatedUrl, setGeneratedUrl] = useState('')
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return
    setIsLoading(true)
    setError('')
    setGeneratedUrl('')

    try {
      const data = await aiApi.generateBanner(prompt.trim())
      if (data.imageUrl) {
        setGeneratedUrl(data.imageUrl)
      } else {
        setError('Failed to generate image.')
      }
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Something went wrong during generation.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirm = () => {
    if (generatedUrl) {
      onSelectImage(generatedUrl)
      onClose()
      setPrompt('')
      setGeneratedUrl('')
      setError('')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] glass border border-border/30 rounded-2xl p-6 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            Generate Event Banner
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Describe the visual style of your event, and our AI will generate a beautiful 16:9 banner banner.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 my-4">
          <div className="flex gap-2">
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. A neon-lit indoor hacking marathon, digital style..."
              className="flex-1 rounded-xl bg-background/40 border-border/40 focus-visible:ring-primary/40"
              disabled={isLoading}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
            <Button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isLoading}
              className="rounded-xl px-4 font-bold shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex gap-1.5 items-center shrink-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-xl animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {generatedUrl ? (
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-border/40 bg-muted/20 animate-in fade-in zoom-in-95 shadow-inner">
              <Image
                src={generatedUrl}
                alt="AI Generated Banner"
                fill
                className="object-cover"
                sizes="(max-width: 480px) 100vw, 480px"
              />
            </div>
          ) : (
            !isLoading && (
              <div className="flex flex-col items-center justify-center border border-dashed border-border/40 rounded-xl aspect-[16/9] w-full bg-background/20 text-muted-foreground/40 gap-2">
                <ImageIcon className="h-10 w-10 stroke-[1.25]" />
                <span className="text-xs font-semibold">Your banner preview will appear here</span>
              </div>
            )
          )}
          
          {isLoading && (
            <div className="flex flex-col items-center justify-center border border-border/40 rounded-xl aspect-[16/9] w-full bg-background/10 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-xs font-bold text-foreground animate-pulse">Painting your banner...</span>
                <span className="text-[10px] text-muted-foreground">This may take 10-15 seconds</span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onClose} disabled={isLoading} className="rounded-xl border border-border/40 cursor-pointer">
            Cancel
          </Button>
          {generatedUrl && (
            <Button
              onClick={handleConfirm}
              className="rounded-xl font-bold bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-500/20 cursor-pointer flex gap-1.5 items-center"
            >
              <Check className="h-4 w-4" />
              Use Generated Image
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
