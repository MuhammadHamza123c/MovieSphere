import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { getStreamUrl, fetchDetail, fetchSeasonEpisodes, saveProgress, getWatchPartyToken } from '../api/endpoints'
import { Room } from 'livekit-client'
import { useRecentlyViewed } from '../hooks/useRecentlyViewed'
import QRCode from 'qrcode'

export default function WatchPage() {
  const { type, id, season, epi } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  // Watch party room ID
  const queryParams = new URLSearchParams(location.search)
  const room = queryParams.get('room')

  const iframeRef = useRef(null)
  const [streamUrl, setStreamUrl] = useState('')
  const [error, setError] = useState('')
  const [cinema, setCinema] = useState(false)
  const [seasons, setSeasons] = useState([])
  const [episodes, setEpisodes] = useState([])
  const [autoNextCountdown, setAutoNextCountdown] = useState(null)
  const [watchTitle, setWatchTitle] = useState('')
  const [watchPoster, setWatchPoster] = useState('')
  const [streamSources, setStreamSources] = useState([])
  const [currentServer, setCurrentServer] = useState(0)
  const { saveRecentlyViewed } = useRecentlyViewed()

  // Watch Party States
  const [remoteStream, setRemoteStream] = useState(null)
  const [partyLogs, setPartyLogs] = useState([])
  const [copied, setCopied] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [cinemaChatOpen, setCinemaChatOpen] = useState(false)
  const [chatDisabled, setChatDisabled] = useState(true)
  const [hasUnread, setHasUnread] = useState(false)
  const [emojiReactions, setEmojiReactions] = useState([])
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [qrModal, setQrModal] = useState(false)
  const liveKitRoomRef = useRef(null)
  const chatScrollRef = useRef(null)
  const unreadTimerRef = useRef(null)
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const [localCamPos, setLocalCamPos] = useState({ x: 0, y: 0 })
  const [cinemaLocalPos, setCinemaLocalPos] = useState({ x: 0, y: 0 })
  const [cinemaRemotePos, setCinemaRemotePos] = useState({ x: 0, y: 0 })
  const draggingRef = useRef(null)
  const dragRafRef = useRef(null)
  const localCamRef = useRef(null)
  const remoteCamRef = useRef(null)
  const activeStreamRef = useRef(null)
  const remoteStreamRef = useRef(null)

  const seasonNum = Number(season || 1)
  const epiNum = Number(epi || 1)
  const nextEpi = epiNum + 1
  const prevEpi = epiNum - 1
  const currentEpisode = episodes.find(e => e.episode_number === epiNum)
  const nextEpisode = episodes.find(e => e.episode_number === nextEpi)
  const availableSeasons = useMemo(() => (
    seasons
      .map(s => ({
        number: s.season_number || s.Season_number,
        name: s.name || s.Name,
        episodeCount: s.episode_count || s.Episode_count,
      }))
      .filter(s => s.number != null && !s.name?.toLowerCase().includes('specials'))
  ), [seasons])
  const currentSeasonIndex = availableSeasons.findIndex(s => Number(s.number) === seasonNum)
  const nextSeason = currentSeasonIndex >= 0 ? availableSeasons[currentSeasonIndex + 1] : null
  const nextTarget = useMemo(() => {
    if (nextEpisode) return { season: seasonNum, episode: nextEpi, name: nextEpisode.name, stillPath: nextEpisode.still_path, overview: nextEpisode.overview }
    if (nextSeason) return { season: Number(nextSeason.number), episode: 1 }
    return null
  }, [nextEpisode, nextSeason, nextEpi, seasonNum])

  const displayUrl = streamSources[currentServer] || streamUrl

  const addLog = (msg) => {
    setPartyLogs(prev => [...prev.slice(-15), `[${new Date().toLocaleTimeString()}] ${msg}`])
  }

  // Load Stream and save recently viewed
  useEffect(() => {
    setStreamUrl('')
    setError('')
    saveRecentlyViewed({
      id: Number(id),
      media_type: type,
      title: watchTitle || (type === 'tv' ? `S${seasonNum} E${epiNum}` : ''),
      poster_path: watchPoster,
      year: '',
      timestamp: Date.now(),
    })
    getStreamUrl(id, season, epi).then(res => {
      if (!res || res.url?.startsWith('Error')) { setError('Stream not available for this title') }
      else {
        setStreamUrl(res.url || res.sources?.[0] || '')
        setStreamSources(res.sources || [res.url || ''])
        setCurrentServer(Number(queryParams.get('server')) || 0)
      }
    }).catch(() => setError('Failed to load stream'))
  }, [id, season, epi, type, seasonNum, epiNum, saveRecentlyViewed, watchTitle, watchPoster])

  // Set default volume to mid level via postMessage to vidlink player
  useEffect(() => {
    if (!streamUrl) return
    const t = setInterval(() => {
      if (!iframeRef.current?.contentWindow) return
      try {
        iframeRef.current.contentWindow.postMessage({ volume: 0.5 }, '*')
        iframeRef.current.contentWindow.postMessage({ type: 'setVolume', volume: 0.5 }, '*')
        iframeRef.current.contentWindow.postMessage({ event: 'command', func: 'setVolume', args: [0.5] }, '*')
      } catch {}
      clearInterval(t)
    }, 1000)
    return () => clearInterval(t)
  }, [streamUrl])

  // TV episodes
  useEffect(() => {
    if (type === 'tv') {
      fetchSeasonEpisodes(id, seasonNum).then(setEpisodes).catch(() => setEpisodes([]))
    }
  }, [id, seasonNum, type])

  useEffect(() => {
    fetchDetail('', id, type)
      .then(detail => {
        setWatchTitle(detail?.Title || detail?.title || detail?.name || '')
        setWatchPoster(detail?.Poster_path || detail?.poster_path || '')
        if (type === 'tv') {
          setSeasons(detail?.['Seasons/Episode'] || detail?.Seasons || detail?.seasons || [])
        }
      })
      .catch(() => { if (type === 'tv') setSeasons([]) })
  }, [id, type])

  // Auto progression
  useEffect(() => {
    const handler = (event) => {
      if (event.origin !== 'https://vidlink.pro') return

      if (event.data?.type === 'PLAYER_EVENT') {
        const ev = event.data.data

        if (ev.event === 'ended') {
          if (type === 'tv' && nextTarget) {
            setAutoNextCountdown(5)
          } else if (type === 'tv') {
            navigate(`/tv/${id}`)
          }
        }

        if (ev.event === 'timeupdate' && ev.currentTime != null && ev.duration != null) {
          saveProgress({
            media_id: String(id),
            media_type: type,
            season: type === 'tv' ? seasonNum : undefined,
            episode: type === 'tv' ? epiNum : undefined,
            title: type === 'tv' ? (currentEpisode?.name || `S${seasonNum} E${epiNum}`) : (watchTitle || undefined),
            poster_url: type === 'tv' ? (currentEpisode?.still_path || '') : (watchPoster || undefined),
            progress_seconds: Math.round(ev.currentTime),
            total_seconds: Math.round(ev.duration),
          }).catch(() => {})
        }
      }
    }

    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [type, id, seasonNum, epiNum, nextTarget, currentEpisode, navigate, watchTitle, watchPoster])

  useEffect(() => {
    if (autoNextCountdown === null) return
    if (autoNextCountdown <= 0) {
      setAutoNextCountdown(null)
      if (nextTarget) {
        goTo(nextTarget.season, nextTarget.episode)
      }
      return
    }
    const t = setTimeout(() => setAutoNextCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [autoNextCountdown, id, nextTarget, navigate, room])

  // Watch Party Signaling with LiveKit
  useEffect(() => {
    if (!room) return

    const myId = Math.random().toString(36).substring(2, 10)
    let mounted = true

    const addLog = (msg) => {
      setPartyLogs(prev => [...prev.slice(-15), `[${new Date().toLocaleTimeString()}] ${msg}`])
    }

    addLog(`Joined room: ${room}`)

    const setupCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        activeStreamRef.current = stream
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }
        addLog('Webcam and mic active.')
      } catch (err) {
        addLog(`Camera blocked: ${err.message}`)
      }
    }

    ;(async () => {
      await setupCamera()
      if (!mounted) return

      try {
        const { token, url } = await getWatchPartyToken(room, myId)
        addLog('Got LiveKit token.')

        const liveKitRoom = new Room({
          adaptiveStream: true,
          dynacast: true,
        })

        liveKitRoom.on('trackSubscribed', (track, publication, participant) => {
          if (track.kind === 'video') {
            addLog("Friend's webcam stream active!")
            const mediaStream = new MediaStream([track.mediaStreamTrack])
            remoteStreamRef.current = mediaStream
            setRemoteStream(mediaStream)
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = mediaStream
            }
          }
        })

        liveKitRoom.on('trackUnsubscribed', (track) => {
          if (track.kind === 'video') {
            addLog('Friend disconnected.')
            setRemoteStream(null)
          }
        })

        liveKitRoom.on('disconnected', () => {
          addLog('Disconnected from room.')
        })

        liveKitRoom.on('dataReceived', (payload, participant) => {
          if (!participant) return
          try {
            const msg = JSON.parse(new TextDecoder().decode(payload))
            if (msg.type === 'emoji') {
              const id = Date.now() + Math.random()
              setEmojiReactions(prev => [...prev, { id, emoji: msg.emoji }])
              setTimeout(() => setEmojiReactions(prev => prev.filter(r => r.id !== id)), 2000)
              return
            }
            setChatMessages(prev => [...prev, { text: msg.text, sender: participant.identity || 'friend', isMe: false }])
            if (unreadTimerRef.current) clearTimeout(unreadTimerRef.current)
            setHasUnread(true)
            unreadTimerRef.current = setTimeout(() => setHasUnread(false), 2500)
          } catch {}
        })

        liveKitRoom.on('participantConnected', () => {
          setChatDisabled(false)
        })

        liveKitRoom.on('participantDisconnected', () => {
          if (liveKitRoom.remoteParticipants.size === 0) {
            setChatDisabled(true)
          }
        })

        await liveKitRoom.connect(url, token)
        liveKitRoomRef.current = liveKitRoom
        setIsConnected(true)
        if (liveKitRoom.remoteParticipants.size > 0) setChatDisabled(false)
        addLog('Connected to LiveKit room.')

        if (activeStreamRef.current) {
          await liveKitRoom.localParticipant.publishTrack(
            activeStreamRef.current.getVideoTracks()[0],
            { source: 1, name: 'camera' }
          )
          addLog('Published local camera.')
        }
      } catch (err) {
        addLog(`LiveKit error: ${err.message}`)
      }
    })()

    return () => {
      mounted = false
      setIsConnected(false)
      if (unreadTimerRef.current) clearTimeout(unreadTimerRef.current)
      if (liveKitRoomRef.current) {
        liveKitRoomRef.current.disconnect()
        liveKitRoomRef.current = null
      }
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach(track => track.stop())
        activeStreamRef.current = null
      }
      setRemoteStream(null)
    }
  }, [room])

  // Re-attach camera streams when DOM elements re-create (cinema mode toggle)
  useEffect(() => {
    if (activeStreamRef.current && localVideoRef.current) {
      localVideoRef.current.srcObject = activeStreamRef.current
    }
    if (remoteStreamRef.current && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStreamRef.current
    }
  }, [cinema, room, remoteStream])

  // Camera drag handlers
  const handleCamPointerDown = (cam, e, mode = 'sidebar') => {
    const pos = mode === 'cinema'
      ? (cam === 'local' ? cinemaLocalPos : cinemaRemotePos)
      : (cam === 'local' ? localCamPos : { x: 0, y: 0 })
    draggingRef.current = {
      cam,
      mode,
      startX: e.clientX ?? e.touches?.[0]?.clientX ?? 0,
      startY: e.clientY ?? e.touches?.[0]?.clientY ?? 0,
      currentX: e.clientX ?? e.touches?.[0]?.clientX ?? 0,
      currentY: e.clientY ?? e.touches?.[0]?.clientY ?? 0,
      origX: pos.x,
      origY: pos.y,
    }
  }

  useEffect(() => {
    const handleMove = (e) => {
      if (!draggingRef.current) return
      draggingRef.current.currentX = e.clientX ?? e.touches?.[0]?.clientX ?? 0
      draggingRef.current.currentY = e.clientY ?? e.touches?.[0]?.clientY ?? 0
      if (!dragRafRef.current) {
        dragRafRef.current = requestAnimationFrame(() => {
          dragRafRef.current = null
          const { cam, mode, startX, startY, origX, origY, currentX, currentY } = draggingRef.current
          const dx = currentX - startX
          const dy = currentY - startY
          if (mode === 'cinema') {
            if (cam === 'local') setCinemaLocalPos({ x: origX + dx, y: origY + dy })
            else setCinemaRemotePos({ x: origX + dx, y: origY + dy })
          } else {
            if (cam === 'local') setLocalCamPos({ x: origX + dx, y: origY + dy })
          }
        })
      }
    }
    const handleUp = () => {
      if (dragRafRef.current) { cancelAnimationFrame(dragRafRef.current); dragRafRef.current = null }
      draggingRef.current = null
    }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    window.addEventListener('touchmove', handleMove, { passive: true })
    window.addEventListener('touchend', handleUp)
    return () => {
      if (dragRafRef.current) cancelAnimationFrame(dragRafRef.current)
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
      window.removeEventListener('touchmove', handleMove)
      window.removeEventListener('touchend', handleUp)
    }
  }, [])

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [chatMessages.length])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      switch (e.key.toLowerCase()) {
        case 'f':
          if (!document.fullscreenElement) iframeRef.current?.requestFullscreen()
          else document.exitFullscreen()
          break
        case 'c':
          setCinema(c => !c)
          break
        case 'arrowleft':
          if (type === 'tv' && prevEpi >= 1) goTo(seasonNum, prevEpi)
          break
        case 'arrowright':
          if (type === 'tv' && nextTarget) goTo(nextTarget.season, nextTarget.episode)
          break
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [type, prevEpi, nextTarget, seasonNum])

  const cancelAutoNext = () => setAutoNextCountdown(null)

  const goTo = (s, e) => {
    setAutoNextCountdown(null)
    const params = new URLSearchParams()
    if (room) params.set('room', room)
    if (currentServer > 0) params.set('server', String(currentServer))
    const qs = params.toString()
    if (type === 'tv') {
      navigate(`/watch/tv/${id}/${s}/${e}${qs ? `?${qs}` : ''}`)
    } else {
      navigate(`/watch/${type}/${id}${qs ? `?${qs}` : ''}`)
    }
  }

  const startWatchParty = () => {
    const roomId = Math.random().toString(36).substring(2, 9)
    const base = `/watch/${type}/${id}`
    const path = type === 'tv' ? `${base}/${seasonNum}/${epiNum}` : base
    navigate(`${path}?room=${roomId}`)
  }

  const copyInviteLink = () => {
    const base = window.location.href.split('?')[0]
    const params = new URLSearchParams()
    if (room) params.set('room', room)
    if (currentServer > 0) params.set('server', String(currentServer))
    navigator.clipboard.writeText(`${base}?${params.toString()}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const showQr = useCallback(async () => {
    const base = window.location.href.split('?')[0]
    const params = new URLSearchParams()
    if (room) params.set('room', room)
    if (currentServer > 0) params.set('server', String(currentServer))
    const url = `${base}?${params.toString()}`
    setQrDataUrl(null)
    const dataUrl = await QRCode.toDataURL(url, { width: 300, margin: 2, color: { dark: '#6366f1', light: '#ffffff' } })
    setQrDataUrl(dataUrl)
    setQrModal(true)
  }, [qrDataUrl, room, currentServer])

  const sendChatMessage = () => {
    const text = chatInput.trim()
    if (!text || !liveKitRoomRef.current || chatDisabled) return
    setChatMessages(prev => [...prev, { text, sender: 'You', isMe: true }])
    setChatInput('')
    liveKitRoomRef.current.localParticipant.publishData(new TextEncoder().encode(JSON.stringify({ text })))
  }

  const EMOJIS = ['❤️', '😂', '😱', '🔥', '👍']

  const sendEmoji = (emoji) => {
    if (!liveKitRoomRef.current) return
    const id = Date.now() + Math.random()
    setEmojiReactions(prev => [...prev, { id, emoji }])
    setTimeout(() => setEmojiReactions(prev => prev.filter(r => r.id !== id)), 2000)
    liveKitRoomRef.current.localParticipant.publishData(new TextEncoder().encode(JSON.stringify({ type: 'emoji', emoji })))
  }

  if (cinema && streamUrl) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center group">
        <button
          onClick={() => setCinema(false)}
          className="absolute top-5 right-5 z-20 w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white/70 hover:text-white rounded-full transition-all cursor-pointer backdrop-blur-sm border border-white/10 text-sm opacity-0 hover:opacity-100 group-hover:opacity-100"
          title="Exit Cinema Mode"
        >✕</button>
        {streamSources.length > 1 && (
          <div className="absolute top-5 left-5 z-20 flex items-center gap-2 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity">
            <span className="text-[11px] text-gray-400 font-medium bg-black/60 px-2 py-1 rounded-md backdrop-blur-sm">Server {currentServer + 1}/{streamSources.length}</span>
            <button onClick={() => setCurrentServer(i => (i + 1) % streamSources.length)} className="px-2.5 py-1 bg-black/60 hover:bg-black/80 text-gray-300 hover:text-white text-xs rounded-md transition-all cursor-pointer backdrop-blur-sm border border-white/10">Switch</button>
          </div>
        )}
        <div className="w-full h-full max-w-[98vw] max-h-[98vh] p-4">
          <iframe ref={iframeRef} src={displayUrl} allowFullScreen allow="autoplay; encrypted-media" className="w-full h-full border-0 rounded-lg" />
        </div>
        {/* Floating camera feeds in cinema mode — individually draggable */}
        {room && (
          <>
            <div ref={localCamRef}
              onMouseDown={(e) => handleCamPointerDown('local', e, 'cinema')}
              onTouchStart={(e) => handleCamPointerDown('local', e, 'cinema')}
              className="fixed z-20 w-28 sm:w-36 lg:w-44 aspect-video bg-black/80 rounded-xl overflow-hidden border border-gray-700/60 cursor-grab active:cursor-grabbing select-none group"
              style={{ left: `calc(50% + ${cinemaLocalPos.x}px)`, top: `calc(20% + ${cinemaLocalPos.y}px)`, transform: 'translate(-50%, -50%)' }}
            >
              <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]"></video>
              <button onClick={() => localVideoRef.current?.requestFullscreen()}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-black/80 rounded text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer flex items-center justify-center"
                      title="Full screen">⛶</button>
              <div className="absolute bottom-1.5 left-1.5 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-bold border border-white/5">You</div>
            </div>
            <div ref={remoteCamRef}
              onMouseDown={(e) => handleCamPointerDown('remote', e, 'cinema')}
              onTouchStart={(e) => handleCamPointerDown('remote', e, 'cinema')}
              className="fixed z-20 w-28 sm:w-36 lg:w-44 aspect-video bg-black/80 rounded-xl overflow-hidden border border-gray-700/60 cursor-grab active:cursor-grabbing select-none group flex items-center justify-center"
              style={{ left: `calc(50% + ${cinemaRemotePos.x}px)`, top: `calc(45% + ${cinemaRemotePos.y}px)`, transform: 'translate(-50%, -50%)' }}
            >
              <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
              <button onClick={() => remoteVideoRef.current?.requestFullscreen()}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-black/80 rounded text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer flex items-center justify-center"
                      title="Full screen">⛶</button>
              <div className="absolute bottom-1.5 left-1.5 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-bold border border-white/5">Friend</div>
              {!remoteStream && (
                <div className="absolute inset-0 bg-gray-950/90 flex items-center justify-center text-center p-2">
                  <p className="text-[8px] text-gray-500 font-medium leading-normal">Waiting for friend's camera...</p>
                </div>
              )}
            </div>
          </>
        )}
        {room && isConnected && (
          <>
            <button onClick={() => { setCinemaChatOpen(!cinemaChatOpen); if (!cinemaChatOpen) setHasUnread(false) }}
              className={`fixed top-16 left-4 z-20 w-9 h-9 flex items-center justify-center rounded-full transition-all cursor-pointer backdrop-blur-sm border text-sm ${
                hasUnread ? 'bg-red-500/80 border-red-400/60 text-white shadow-lg shadow-red-500/30 animate-pulse' : 'bg-white/10 border-white/10 text-white/70 hover:bg-white/20 hover:text-white opacity-0 hover:opacity-100 group-hover:opacity-100'
              }`}
              title="Chat">💬</button>
            {cinemaChatOpen && (
              <div className="fixed top-24 left-1/2 -translate-x-1/2 md:left-4 md:translate-x-0 z-30 w-[calc(100vw-2rem)] sm:w-72 md:w-80 bg-[#12142a]/95 border border-indigo-500/40 rounded-xl overflow-hidden shadow-2xl shadow-indigo-500/10 backdrop-blur-md">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-indigo-500/20 bg-indigo-500/5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
                  <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Live Chat</span>
                </div>
                <div ref={chatScrollRef} className="h-60 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                      <span className={`max-w-[80%] text-sm px-3 py-1.5 rounded-2xl leading-relaxed shadow-sm ${
                        msg.isMe ? 'bg-indigo-500 text-white shadow-indigo-500/30' : 'bg-gray-700/80 text-gray-100'
                      }`}>{msg.text}</span>
                    </div>
                  ))}
                </div>
                <div className="flex border-t border-gray-700/60">
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !chatDisabled && sendChatMessage()}
                    placeholder={chatDisabled ? 'Waiting for friend to join...' : 'Type a message...'}
                    disabled={chatDisabled}
                    className="flex-1 bg-transparent text-sm text-gray-300 placeholder-gray-600 px-3 py-2.5 outline-none disabled:opacity-40"
                  />
                  <button onClick={sendChatMessage} disabled={chatDisabled} className="px-4 py-2.5 text-indigo-400 hover:text-indigo-300 text-sm font-bold cursor-pointer disabled:opacity-40 disabled:cursor-default">Send</button>
                </div>
                <div className="flex gap-2 px-3 py-2 border-t border-gray-700/60">
                  {EMOJIS.map(e => (
                    <button key={e} onClick={() => sendEmoji(e)} disabled={chatDisabled} className="text-lg hover:scale-125 transition-transform cursor-pointer disabled:opacity-40">{e}</button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-[98vw]">
      {/* Video Content Panel */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-4 mb-5 flex-wrap">
          <button onClick={() => navigate(-1)} className="px-3.5 py-2 border border-gray-700 rounded-lg text-sm text-gray-400 hover:text-gray-200 hover:bg-[#1e2040] transition-all cursor-pointer bg-transparent">&larr; Back</button>
          <h2 className="text-lg font-extrabold text-gray-100">Now Watching</h2>
          {type === 'tv' && currentEpisode && (
            <span className="text-sm text-gray-500">
              {currentEpisode.name || `Episode ${epiNum}`}
            </span>
          )}
          {streamUrl && (
            <button onClick={() => setCinema(true)} className="ml-auto flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-semibold rounded-lg transition-all cursor-pointer shadow-lg shadow-indigo-500/25">
              Cinema Mode
            </button>
          )}
          {streamSources.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-500 font-medium">Server {currentServer + 1}/{streamSources.length}</span>
              <button onClick={() => setCurrentServer(i => (i + 1) % streamSources.length)} className="px-3 py-1.5 border border-gray-700 rounded-lg text-xs text-gray-400 hover:text-gray-200 hover:bg-[#1e2040] transition-all cursor-pointer bg-transparent">Switch</button>
            </div>
          )}
        </div>

        {error ? (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-4">{error}</p>
            <button onClick={() => navigate(-1)} className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-lg transition-all cursor-pointer">Go Back</button>
          </div>
        ) : !streamUrl ? (
          <div className="aspect-video rounded-xl bg-black flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="aspect-video rounded-xl overflow-hidden bg-black shadow-xl shadow-black/50 relative">
              <iframe ref={iframeRef} src={displayUrl} allowFullScreen allow="autoplay; encrypted-media" className="w-full h-full border-0" />
              {emojiReactions.map(r => (
                <span key={r.id} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl pointer-events-none animate-bounce z-10" style={{ animationDuration: '2s' }}>{r.emoji}</span>
              ))}
            </div>
            {autoNextCountdown !== null && nextTarget && (
              <div className="mt-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-indigo-300 font-semibold">Next episode in {autoNextCountdown}s</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Season {nextTarget.season}, Episode {nextTarget.episode}
                    {nextTarget.name ? ` - ${nextTarget.name}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={cancelAutoNext} className="px-3 py-1.5 border border-gray-700/50 rounded-lg text-xs text-gray-400 hover:text-gray-200 hover:border-gray-600 transition-all cursor-pointer bg-transparent">Cancel</button>
                  <button onClick={() => { cancelAutoNext(); goTo(nextTarget.season, nextTarget.episode) }} className="px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer">Play Now</button>
                </div>
              </div>
            )}
            {type === 'tv' && nextTarget && !autoNextCountdown && (
              <div className="mt-4 bg-[#12142a]/40 rounded-2xl border border-dashed border-gray-800/50 hover:border-indigo-500/30 transition-all cursor-pointer overflow-hidden"
                   onClick={() => goTo(nextTarget.season, nextTarget.episode)}>
                <div className="flex items-center gap-4 p-4">
                  <div className="w-20 sm:w-28 aspect-video bg-[#1e2040] rounded-lg overflow-hidden flex-shrink-0 relative">
                    {nextTarget.stillPath ? (
                      <img src={nextTarget.stillPath} alt={nextTarget.name || ''} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a1c36] to-[#0f1123]">
                        <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>
                      </div>
                    )}
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 rounded text-[9px] font-bold text-white">E{nextTarget.episode}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wider mb-0.5">Up Next</p>
                    <h4 className="text-sm font-bold text-gray-200 truncate">S{nextTarget.season} E{nextTarget.episode} - {nextTarget.name || `Episode ${nextTarget.episode}`}</h4>
                    {nextTarget.overview && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{nextTarget.overview}</p>}
                  </div>
                  <button className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-500/90 hover:bg-indigo-500 flex items-center justify-center transition-all shadow-lg shadow-indigo-500/20">
                    <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  </button>
                </div>
              </div>
            )}
            {type === 'tv' && !nextTarget && !autoNextCountdown && episodes.length > 0 && (
              <div className="mt-4 p-5 bg-[#12142a]/40 rounded-2xl border border-dashed border-gray-800/50 text-center">
                <p className="text-sm text-gray-400 mb-3">You've reached the end of Season {seasonNum}</p>
                <button onClick={() => navigate(`/tv/${id}`)} className="px-5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-lg transition-all shadow-lg shadow-indigo-500/20 cursor-pointer">Back to Show</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Watch Party Sidebar Grid — always visible */}
      <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
        <div className="bg-[#12142a]/80 border border-gray-800 rounded-2xl p-5 shadow-2xl">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="text-base font-bold text-gray-100 flex items-center gap-2">
              🍿 Watch Party
            </h3>
            {room ? (
              <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold rounded border border-indigo-500/25 uppercase tracking-wide">Active</span>
            ) : (
              <span className="px-2 py-0.5 bg-gray-500/10 text-gray-400 text-[10px] font-bold rounded border border-gray-500/25 uppercase tracking-wide">Offline</span>
            )}
          </div>

          {!room ? (
            <div className="bg-[#181a36]/50 rounded-xl p-4 border border-gray-800 text-center">
              <p className="text-sm text-gray-400 mb-3">Watch together with friends in real-time!</p>
              <button
                onClick={startWatchParty}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-500/25"
              >
                🍿 Start Watch Party
              </button>
              <p className="text-[9px] text-gray-600 mt-3">Creates a room and shares the invite link</p>
            </div>
          ) : (
            <>
              {/* Invite Info */}
              <div className="bg-[#181a36]/50 rounded-xl p-3 border border-gray-800 mb-4">
                <p className="text-xs text-gray-400 font-medium mb-2">Invite friends to watch with you:</p>
                <div className="flex gap-2">
                  <button onClick={copyInviteLink} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow active:scale-[0.98]">{copied ? '✓ Link Copied!' : 'Copy Invite Link'}</button>
                  <button onClick={showQr} className="py-2 px-3 bg-[#1e2040] hover:bg-[#2a2b4a] text-indigo-300 text-xs font-bold rounded-lg transition-all cursor-pointer border border-indigo-500/30">QR</button>
                </div>
              </div>

              {/* Camera Feeds */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                  {/* Local Camera — draggable */}
                  <div ref={localCamRef}
                    className="bg-black/60 rounded-xl aspect-video overflow-hidden border border-gray-800/80 relative cursor-grab active:cursor-grabbing select-none group"
                    style={{ transform: `translate(${localCamPos.x}px, ${localCamPos.y}px)`, zIndex: 10 }}
                    onMouseDown={(e) => handleCamPointerDown('local', e)}
                    onTouchStart={(e) => handleCamPointerDown('local', e)}
                  >
                    <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]"></video>
                    <button onClick={() => localVideoRef.current?.requestFullscreen()}
                            className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-black/80 rounded text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer flex items-center justify-center"
                            title="Full screen">⛶</button>
                    <div className="absolute bottom-1.5 left-1.5 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-bold border border-white/5">
                      You
                    </div>
                  </div>
                  {/* Remote Camera */}
                  <div ref={remoteCamRef}
                    className="bg-black/60 rounded-xl aspect-video overflow-hidden border border-gray-800/80 relative group flex items-center justify-center"
                  >
                    <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
                    <button onClick={() => remoteVideoRef.current?.requestFullscreen()}
                            className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-black/80 rounded text-white text-[10px] opacity-0 group-hover:opacity-100 transition-opacity z-10 cursor-pointer flex items-center justify-center"
                            title="Full screen">⛶</button>
                    <div className="absolute bottom-1.5 left-1.5 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-bold border border-white/5">
                      Friend
                    </div>
                    {!remoteStream && (
                      <div className="absolute inset-0 bg-gray-950/90 flex items-center justify-center text-center p-2">
                        <p className="text-[8px] text-gray-500 font-medium leading-normal">Waiting for friend's camera...</p>
                      </div>
                    )}
                  </div>
                </div>

              {/* Chat */}
              {isConnected && (
              <div className="bg-[#181a36]/50 rounded-xl border border-indigo-500/30 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-indigo-500/20">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Chat</span>
                </div>
                <div ref={chatScrollRef} className="h-40 overflow-y-auto p-2 space-y-1 scrollbar-thin bg-[#0f1123]/60">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                      <span className={`max-w-[80%] text-xs px-3 py-1.5 rounded-2xl leading-relaxed shadow-sm ${
                        msg.isMe ? 'bg-indigo-500 text-white shadow-indigo-500/30' : 'bg-gray-700/80 text-gray-100'
                      }`}>{msg.text}</span>
                    </div>
                  ))}
                </div>
                <div className="flex border-t border-gray-800">
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !chatDisabled && sendChatMessage()}
                    placeholder={chatDisabled ? 'Waiting for friend to join...' : 'Type a message...'}
                    disabled={chatDisabled}
                    className="flex-1 bg-transparent text-xs text-gray-300 placeholder-gray-600 px-3 py-2 outline-none disabled:opacity-40"
                  />
                  <button onClick={sendChatMessage} disabled={chatDisabled} className="px-3 py-2 text-indigo-400 hover:text-indigo-300 text-sm font-bold cursor-pointer disabled:opacity-40 disabled:cursor-default">Send</button>
                </div>
                <div className="flex gap-1.5 px-2 py-1.5 border-t border-gray-800/50">
                  {EMOJIS.map(e => (
                    <button key={e} onClick={() => sendEmoji(e)} disabled={chatDisabled} className="text-sm hover:scale-125 transition-transform cursor-pointer disabled:opacity-40">{e}</button>
                  ))}
                </div>
              </div>
              )}
          </>
        )}
        {/* Floating emoji reactions */}
        {emojiReactions.map(r => (
          <span key={r.id} className="fixed bottom-1/2 left-1/2 -translate-x-1/2 z-30 text-4xl pointer-events-none animate-bounce" style={{ animationDuration: '2s' }}>{r.emoji}</span>
        ))}
      </div>
      {/* QR Modal */}
      {qrModal && (
        <div className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center" onClick={() => setQrModal(false)}>
          <div className="bg-[#12142a] rounded-2xl p-6 border border-indigo-500/30 shadow-2xl flex flex-col items-center gap-4" onClick={e => e.stopPropagation()}>
            <p className="text-sm font-bold text-gray-200">Scan to join Watch Party</p>
            {qrDataUrl && <img src={qrDataUrl} alt="QR Code" className="w-48 h-48 rounded-lg" />}
            <button onClick={() => setQrModal(false)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer">Close</button>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
