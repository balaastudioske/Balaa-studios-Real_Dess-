'use client'

import { Float, Text } from '@react-three/drei'
import { useState } from 'react'
import type { BalaaStageMode } from '@/lib/balaa-catalog'

interface StageInteractiveWallProps {
  activeMode: BalaaStageMode
  onSetMode: (mode: BalaaStageMode) => void
}

interface WallButtonProps {
  label: string
  position: [number, number, number]
  active?: boolean
  width?: number
  onClick: () => void
}

function WallButton({ label, position, active = false, width = 1.9, onClick }: WallButtonProps) {
  const [hovered, setHovered] = useState(false)
  const color = active ? '#f59e0b' : hovered ? '#1e293b' : '#0b1220'
  const textColor = active ? '#09090b' : '#e2e8f0'
  return (
    <group position={position}>
      <mesh
        onClick={(event) => { event.stopPropagation(); onClick() }}
        onPointerOver={(event) => { event.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
        onPointerOut={(event) => { event.stopPropagation(); setHovered(false); document.body.style.cursor = 'auto' }}
      >
        <boxGeometry args={[width, 0.48, 0.08]} />
        <meshStandardMaterial color={color} emissive={active ? '#5f3700' : '#000000'} emissiveIntensity={active ? 0.75 : 0} roughness={0.38} metalness={0.55} />
      </mesh>
      <Text position={[0, 0, 0.055]} fontSize={0.14} color={textColor} anchorX="center" anchorY="middle" letterSpacing={0.025}>
        {label.toUpperCase()}
      </Text>
    </group>
  )
}

/** A world-space wall anchored at the rear of the four-pillar stage. */
export function StageInteractiveWall({ activeMode, onSetMode }: StageInteractiveWallProps) {
  const modes: { label: string; mode: BalaaStageMode }[] = [
    { label: 'Catalog', mode: 'catalog' },
    { label: 'Wardrobe', mode: 'wardrobe' },
    { label: 'Licensing', mode: 'licensing' },
    { label: 'Services', mode: 'services' },
    { label: 'Support', mode: 'support' },
  ]

  return (
    <group name="BALAA_INTERACTIVE_STAGE_FLOATING_CONTROLS" position={[0, 3.25, -3.02]}>
      {/* Each control is a world-space artwork object. There is deliberately no
          backing wall: it hovers between the pillars and stays stage-anchored. */}
      {modes.map((item, index) => (
        <Float key={item.mode} speed={1.1 + index * 0.08} floatIntensity={0.16} rotationIntensity={0}>
          <WallButton label={item.label} position={[-4.2 + index * 2.1, 0.55, 0]} width={1.9} active={activeMode === item.mode} onClick={() => onSetMode(item.mode)} />
        </Float>
      ))}
    </group>
  )
}
