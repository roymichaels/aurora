import { useState, useRef, useCallback } from 'react'

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY as string | undefined

export function useVoiceInput() {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const start = useCallback(async () => {
    if (isRecording) return
    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
      const Rec = (window.SpeechRecognition || window.webkitSpeechRecognition)!
      const recognition = new Rec()
      recognition.lang = 'en-US'
      recognition.interimResults = false
      recognition.onresult = e => {
        const text = Array.from(e.results).map(r => r[0].transcript).join(' ')
        setTranscript(text)
      }
      recognition.onend = () => setIsRecording(false)
      recognition.onerror = () => setIsRecording(false)
      recognition.start()
      recognitionRef.current = recognition
      setIsRecording(true)
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const recorder = new MediaRecorder(stream)
        chunksRef.current = []
        recorder.ondataavailable = e => {
          if (e.data.size > 0) chunksRef.current.push(e.data)
        }
        recorder.onstop = async () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
          try {
            const formData = new FormData()
            formData.append('file', blob, 'recording.webm')
            formData.append('model', 'whisper-1')

            const apiKey = OPENAI_API_KEY
            if (!apiKey) throw new Error('Missing OpenAI API key')

            const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${apiKey}`
              },
              body: formData
            })
            const data = await res.json()
            if (data?.text) setTranscript(data.text)
          } catch (err) {
            console.error('Whisper transcription failed', err)
          }
          setIsRecording(false)
        }
        recorder.start()
        mediaRecorderRef.current = recorder
        setIsRecording(true)
      } catch (err) {
        console.error('Unable to access microphone', err)
      }
    }
  }, [isRecording])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current = null
    }
  }, [])

  return { startRecording: start, stopRecording: stop, transcript, setTranscript, isRecording }
}
