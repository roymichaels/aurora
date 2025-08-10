import { useState, useCallback } from 'react'

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY as string | undefined

export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false)

  const speak = useCallback(async (text: string) => {
    if (!text) return
    try {
      const apiKey = ELEVENLABS_API_KEY

      if (apiKey) {
        const voiceId = '21m00Tcm4TlvDq8ikWAM'
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': apiKey
          },
          body: JSON.stringify({ text })
        })

        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)
        setIsSpeaking(true)
        audio.onended = () => {
          setIsSpeaking(false)
          URL.revokeObjectURL(url)
        }
        await audio.play()
      } else {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.onend = () => setIsSpeaking(false)
        setIsSpeaking(true)
        speechSynthesis.speak(utterance)
      }
    } catch (err) {
      console.error('TTS error', err)
      const utter = new SpeechSynthesisUtterance(text)
      utter.onend = () => setIsSpeaking(false)
      setIsSpeaking(true)
      speechSynthesis.speak(utter)
    }
  }, [])

  return { speak, isSpeaking }
}
