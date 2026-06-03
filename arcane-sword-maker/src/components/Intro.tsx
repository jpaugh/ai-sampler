import { useState, useEffect } from 'react'
import { marked } from 'marked'
import { useAppDispatch, useAppSelector } from '../store/store'
import { setIntroEverSeen } from '../store/settingsSlice'
import { audioThemeManager } from '../utils/audioTheme'

interface IntroProps {
  onComplete?: () => void;
  }

  export function Intro({ onComplete }: IntroProps) {
    const dispatch = useAppDispatch()
    const introEverSeen = useAppSelector((state) => state.settings.introEverSeen)
    const isAmbienceMuted = useAppSelector((state) => state.settings.isAmbienceMuted)
    const [currentSlide, setCurrentSlide] = useState(0)
    const [slides, setSlides] = useState<string[]>([])
    const [fadeOut, setFadeOut] = useState(false)

    const finishIntro = () => {
      dispatch(setIntroEverSeen(true))
      if (onComplete) onComplete()
    }

    useEffect(() => {
      audioThemeManager.getSound('move-weapon')
    }, [])

    useEffect(() => {
      const fetchIntro = async () => {
        try {
          const base = import.meta.env.BASE_URL.endsWith('/')
            ? import.meta.env.BASE_URL
            : `${import.meta.env.BASE_URL}/`
          const response = await fetch(`${base}Intro.md`)
          const text = await response.text()
          const rawSlides = text.split('---').map((slide) => slide.trim()).filter((slide) => slide.length > 0)
          const parsedSlides = await Promise.all(rawSlides.map(slide => marked.parse(slide)))
          setSlides(parsedSlides)
        } catch (error) {
          console.error('Failed to load intro:', error)
          finishIntro()
        }
      }
      fetchIntro()
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [])

    const advanceSlide = () => {
      if (currentSlide < slides.length - 1) {
        setFadeOut(true)
        setTimeout(() => {
          setCurrentSlide(currentSlide + 1)
          setFadeOut(false)
        }, 300)
      } else {
        finishIntro()
      }
    }

    if (slides.length === 0) {
      return null
    }

  const slide = slides[currentSlide]

  return (
    <div
      className="fixed inset-0 bg-neutral-300 flex flex-col items-center justify-center overflow-hidden"
      onClick={advanceSlide}
    >
      <div
        className={`w-full h-full p-8 transition-opacity duration-300 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
        role="region"
        aria-label="Intro slide"
        dangerouslySetInnerHTML={{ __html: slide }}
      />

      {introEverSeen && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            finishIntro()
          }}
          className="absolute top-6 right-6 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-md text-sm font-medium transition-colors"
        >
          Skip
        </button>
      )}

      <button
        disabled
        className="absolute bottom-6 right-6 z-20 px-4 py-2 bg-slate-700 text-white rounded-md text-sm font-medium opacity-50 cursor-not-allowed"
        title="Ambient audio is currently disabled"
      >
        Amb {isAmbienceMuted ? '🔇' : '🔊'}
      </button>

      <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-4">
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (currentSlide > 0) {
              setFadeOut(true)
              setTimeout(() => {
                setCurrentSlide(currentSlide - 1)
                setFadeOut(false)
              }, 300)
            }
          }}
          disabled={currentSlide === 0}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-700"
        >
          Previous
        </button>

        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            {slides.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentSlide ? 'bg-slate-500' : 'bg-slate-300'
                }`}
              />
            ))}
          </div>
          <span className="text-slate-600 text-sm">{currentSlide + 1} / {slides.length}</span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation()
            advanceSlide()
          }}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-md text-sm font-medium transition-colors"
        >
          {currentSlide < slides.length - 1 ? 'Next' : 'Finish'}
        </button>
      </div>

      {currentSlide < slides.length - 1 && !introEverSeen && (
        <div className="absolute bottom-20 text-slate-600 text-sm animate-pulse">
          Click to continue
        </div>
      )}
    </div>
  )
}
