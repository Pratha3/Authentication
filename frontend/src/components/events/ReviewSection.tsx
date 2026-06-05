'use client'

import React, { useState, useEffect } from 'react'
import { Star, MessageSquare, Sparkles, Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { reviewsApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth.store'

interface Review {
  _id: string
  eventId: string
  userId: string
  userName: string
  rating: number
  comment: string
  createdAt: string
}

interface ReviewSectionProps {
  eventId: string
  isAttendee: boolean
  isCompleted: boolean
}

export function ReviewSection({ eventId, isAttendee, isCompleted }: ReviewSectionProps) {
  const { user } = useAuthStore()
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function loadReviews() {
      try {
        const data = await reviewsApi.getReviews(eventId)
        if (data.reviews) {
          setReviews(data.reviews as Review[])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    loadReviews()
  }, [eventId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const data = await reviewsApi.addReview(eventId, rating, comment.trim())
      if (data.review) {
        setReviews(prev => [data.review as Review, ...prev])
        setComment('')
        setRating(5)
        toast.success('Review submitted successfully!')
      }
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Failed to submit review.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const reviewCount = reviews.length
  const avgRating = reviewCount > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1)
    : '0.0'
  const hasReviewed = !!user && reviews.some((review) => String(review.userId) === user.id)

  return (
    <section className="glass border border-border/30 rounded-2xl p-6 sm:p-8 flex flex-col gap-6 w-full shadow-lg">
      <div className="flex items-center gap-2 border-b border-border/20 pb-4">
        <Sparkles className="h-5 w-5 text-primary animate-pulse" />
        <h2 className="text-xl font-bold text-foreground">Reviews & Ratings</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        <div className="md:col-span-4 flex flex-col items-center justify-center border border-border/20 rounded-2xl p-6 bg-background/20 text-center gap-2">
          <span className="text-5xl font-extrabold tracking-tight text-foreground">{avgRating}</span>
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star 
                key={i} 
                className={cn(
                  "h-5 w-5 fill-current", 
                  i < Math.round(Number(avgRating)) ? "text-yellow-500" : "text-muted-foreground/30"
                )} 
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground font-medium">Based on {reviewCount} reviews</span>
        </div>

        <div className="md:col-span-8 flex flex-col gap-4 w-full">
          {isAttendee && isCompleted && !hasReviewed && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 border border-primary/20 rounded-2xl p-5 bg-primary/5 animate-in fade-in">
              <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                Write a review
              </span>
              
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground font-semibold">Your Rating:</span>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const starVal = i + 1
                    return (
                      <button
                        type="button"
                        key={i}
                        onClick={() => setRating(starVal)}
                        onMouseEnter={() => setHoverRating(starVal)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="cursor-pointer transition-transform hover:scale-110 active:scale-95"
                      >
                        <Star 
                          className={cn(
                            "h-6 w-6 fill-current",
                            starVal <= (hoverRating ?? rating) ? "text-yellow-500" : "text-muted-foreground/30"
                          )}
                        />
                      </button>
                    )
                  })}
                </div>
              </div>

              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience at this event..."
                maxLength={1000}
                className="rounded-xl border-border/40 bg-background/40 min-h-20 focus-visible:ring-primary/40 text-sm"
                required
                disabled={isSubmitting}
              />

              <Button
                type="submit"
                disabled={!comment.trim() || isSubmitting}
                className="self-end rounded-xl font-bold px-5 flex gap-1.5 items-center cursor-pointer shadow-md shadow-primary/20"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Review
                  </>
                )}
              </Button>
            </form>
          )}

          {isAttendee && isCompleted && hasReviewed && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm font-medium text-foreground">
              You have already reviewed this event.
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center border border-dashed border-border/40 rounded-xl py-12 text-center text-muted-foreground/40 gap-2">
              <MessageSquare className="h-8 w-8 stroke-[1.25]" />
              <span className="text-xs font-semibold">No reviews yet for this event</span>
            </div>
          ) : (
            <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
              {reviews.map((review) => (
                <div key={review._id} className="border border-border/20 rounded-2xl p-4 bg-background/10 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-foreground/90">{review.userName}</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={cn(
                            "h-3.5 w-3.5 fill-current",
                            i < review.rating ? "text-yellow-500" : "text-muted-foreground/30"
                          )} 
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed font-medium whitespace-pre-wrap">{review.comment}</p>
                  <span className="text-[10px] text-muted-foreground/50 self-end">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
