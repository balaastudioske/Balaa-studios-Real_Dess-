'use client'
import { useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '@/store/useAppStore'
import { useSceneDirector } from '@/hooks/useSceneDirector'
import { AudioTrack } from '@/types/tracks'
import { getAllTracks } from '@/lib/sequences'
import { VIDEO_FOR_PERFORMANCE_TRACK } from '@/lib/balaa-catalog'
import { Clock, Music } from 'lucide-react'

export const SongSelector = () => {
  const tracks = getAllTracks()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const setTrack = useAppStore((s) => s.setTrack)
  const setActiveMediaId = useAppStore((s) => s.setActiveMediaId)
  const { runSequence, cancel } = useSceneDirector()

  const handleSelect = (track: AudioTrack) => {
    cancel()
    setSelectedId(track.id)
    setTrack(track)
    const videoId = VIDEO_FOR_PERFORMANCE_TRACK[track.id]
    if (videoId) setActiveMediaId(videoId)
    runSequence(track)
  }

  return (
    <div className="flex flex-col gap-3">
      {tracks.map((track) => (
        <button
          key={track.id}
          onClick={() => handleSelect(track)}
          className="group relative flex items-center gap-3 text-left bg-slate-900/50 border border-slate-700/50 hover:bg-slate-800/50 rounded-xl p-2 hover:border-purple-500/50 transition-all duration-200"
        >
          <div className="w-16 h-16 rounded-md overflow-hidden bg-slate-800 shrink-0">
            <img
              src={track.coverArt}
              alt={track.title}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                ;(e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x400/1e293b/94a3b8?text=No+Cover'
              }}
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-100 group-hover:text-purple-300 transition-colors truncate">
              {track.title}
            </h3>
            <p className="text-xs text-slate-400 truncate">{track.artist}</p>
            <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {Math.floor(track.duration / 60)}:{Math.floor(track.duration % 60).toString().padStart(2, '0')}
              </span>
              <span className="flex items-center gap-1">
                <Music className="w-3 h-3" />
                {track.bpm} BPM
              </span>
            </div>
          </div>

          {selectedId === track.id && (
            <div className="absolute inset-0 border-2 border-purple-500/50 rounded-xl animate-pulse" />
          )}
        </button>
      ))}
    </div>
  )
}

export const TrackNowPlaying = () => {
  const { currentTrack, isPlaying } = useAppStore(useShallow((s) => ({
    currentTrack: s.currentTrack,
    isPlaying: s.isPlaying,
  })))

  if (!currentTrack) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur border-t border-slate-700 px-4 py-3">
      <div className="flex items-center gap-4 max-w-4xl mx-auto">
        <div className="w-12 h-12 rounded bg-slate-800 overflow-hidden">
          <img src={currentTrack.coverArt} alt={currentTrack.title} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-slate-200">{currentTrack.title}</div>
          <div className="text-xs text-slate-400">{currentTrack.artist}</div>
        </div>
        <div className="text-xs text-slate-500">
          {isPlaying ? 'Now performing' : 'Loading sequence...'}
        </div>
      </div>
    </div>
  )
}
