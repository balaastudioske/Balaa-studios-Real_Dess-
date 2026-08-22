'use client'
import { useAppStore } from '@/store/useAppStore'

const PROPS_BY_ENVIRONMENT: Record<string, Array<{
  type: 'vinyl' | 'speaker' | 'synth' | 'microphone'
  position: [number, number, number]
  rotation?: [number, number, number]
  scale?: [number, number, number]
}>> = {
  blue_haze: [
    { type: 'vinyl', position: [-3.5, 0.3, -1.2], rotation: [0, Math.PI / 6, 0] },
    { type: 'speaker', position: [-2.5, 0.4, -2.5], rotation: [0, 0, 0] },
    { type: 'speaker', position: [2.5, 0.4, -2.5], rotation: [0, 0, 0] },
    { type: 'microphone', position: [0, 0.6, 1.5] },
  ],
  neon_club: [
    { type: 'synth', position: [-4, 0.5, 0] },
    { type: 'speaker', position: [3, 0.4, -2], rotation: [0, Math.PI, 0] },
    { type: 'speaker', position: [3, 0.4, 0], rotation: [0, Math.PI, 0] },
    { type: 'speaker', position: [3, 0.4, 2], rotation: [0, Math.PI, 0] },
  ],
  cyber_alley: [
    { type: 'speaker', position: [-3, 0.4, -1], rotation: [0, 0.3, 0] },
    { type: 'speaker', position: [3, 0.4, -1], rotation: [0, -0.3, 0] },
  ],
  sunset: [
    { type: 'vinyl', position: [0, 0.3, 0], rotation: [0, 0, 0] },
  ],
}

const PropInstances: Record<string, React.FC<{ position: [number, number, number]; rotation?: [number, number, number]; scale?: [number, number, number] }>> = {
  vinyl: ({ position, rotation, scale }) => (
    <group position={position} rotation={rotation as any} scale={scale || [1, 1, 1]}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.15, 0.15, 0.02, 32]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.3, 16]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      <mesh position={[0, 0.15, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.3, 16]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
    </group>
  ),
  speaker: ({ position, rotation, scale }) => (
    <group position={position} rotation={rotation as any} scale={scale || [1, 1, 1]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.4, 0.6, 0.3]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      <mesh position={[0, 0, 0.18]}>
        <circleGeometry args={[0.15, 16]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.4} />
      </mesh>
    </group>
  ),
  synth: ({ position, rotation, scale }) => (
    <group position={position} rotation={rotation as any} scale={scale || [1, 1, 1]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.3, 0.4]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[1.2, 0.1, 0.4]} />
        <meshStandardMaterial color="#334159" />
      </mesh>
    </group>
  ),
  microphone: ({ position, rotation, scale }) => (
    <group position={position} rotation={rotation as any} scale={scale || [1, 1, 1]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.02, 0.02, 1.2, 16]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
      <mesh position={[0, -0.6, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#94a3b8" />
      </mesh>
    </group>
  ),
}

export const SceneProps = () => {
  const currentEnvironment = useAppStore((s) => s.currentEnvironment)
  const props = PROPS_BY_ENVIRONMENT[currentEnvironment || 'blue_haze'] || []

  return (
    <>
      {props.map((prop, i) => {
        const Comp = PropInstances[prop.type]
        if (!Comp) return null
        return <Comp key={`${prop.type}-${i}`} {...prop} />
      })}
    </>
  )
}