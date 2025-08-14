import { useState, useRef, useCallback } from 'react'
import { useVoiceStore } from '@/state/voice'
import { bus } from '@/utils/bus'

export function useVoiceInput() {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const channelRef = useRef<RTCDataChannel | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const start = useCallback(async () => {
    if (isRecording) return
    const pc = new RTCPeerConnection()
    pcRef.current = pc

    pc.ondatachannel = e => {
      channelRef.current = e.channel
      e.channel.onmessage = ev => {
        try {
          const msg = JSON.parse(ev.data)
            if (msg.transcript) {
              setTranscript(msg.transcript)
              useVoiceStore.getState().setThinking(false)
            }
          if (msg.audio) {
            const audio = new Audio('data:audio/wav;base64,' + msg.audio)
            audio.play()
            audioRef.current = audio
          }
        } catch { /* ignore */ }
      }
    }

    pc.ontrack = ev => {
      const audio = new Audio()
      audio.srcObject = ev.streams[0]
      audio.play()
      audioRef.current = audio
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach(t => pc.addTrack(t, stream))

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    const res = await fetch('/voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sdp: offer.sdp, type: offer.type })
    })
    const answer = await res.json()
    await pc.setRemoteDescription(answer)
      setIsRecording(true)
      useVoiceStore.getState().setListening(true)
      useVoiceStore.getState().setThinking(false)
  }, [isRecording])

  const stop = useCallback(() => {
      channelRef.current?.close()
      pcRef.current?.getSenders().forEach(s => s.track?.stop())
      pcRef.current?.close()
      pcRef.current = null
      setIsRecording(false)
      useVoiceStore.getState().setListening(false)
      useVoiceStore.getState().setThinking(true)
      bus.emit('sphere/state:set', { state: 'thinking' })
      bus.emit('voice/state:set', { state: 'thinking' })
  }, [])

  return { startRecording: start, stopRecording: stop, transcript, setTranscript, isRecording, audioRef }
}
