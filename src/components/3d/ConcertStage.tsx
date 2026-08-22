'use client'
import { useMemo } from 'react'
import * as THREE from 'three'
import { STAGE_DIMENSIONS } from '@/lib/stage-constraints'

interface ConcertStageProps {
  conceptMode?: boolean
}

/**
 * Clean Flat Four-Pillar Performance Stage
 * Canonical specifications:
 * - One flat performance floor (width 16.5m, depth 7.0m, top surface at exact Y = 0)
 * - Four supporting corner pillars at [±7.8, 3.225, ±3.1]
 * - Lighting fixtures mounted directly to the four pillars
 * - Zero raised bumps, zero middle/back/side walls, zero instruments/speakers on walking floor
 */
export const ConcertStage: React.FC<ConcertStageProps> = ({ conceptMode = true }) => {
  const { width, depth, roofBottomY, pillarPositions } = STAGE_DIMENSIONS
  const pillarHeight = roofBottomY
  const floorThickness = 0.4

  // Materials
  const materials = useMemo(() => {
    if (conceptMode) {
      const wireframeMat = new THREE.MeshBasicMaterial({
        color: '#334155', // dark slate gray wireframe
        wireframe: true,
        transparent: true,
        opacity: 0.6,
      })
      return {
        floor: wireframeMat,
        pillar: wireframeMat,
        light: wireframeMat,
      }
    }

    return {
      floor: new THREE.MeshStandardMaterial({
        color: '#18181b', // dark charcoal non-slip deck
        roughness: 0.7,
        metalness: 0.15,
      }),
      pillar: new THREE.MeshStandardMaterial({
        color: '#71717a', // aluminum metallic
        roughness: 0.35,
        metalness: 0.85,
      }),
      light: new THREE.MeshStandardMaterial({
        color: '#27272a',
        roughness: 0.4,
        metalness: 0.7,
      }),
    }
  }, [conceptMode])

  return (
    <group name="real_des_four_pillar_flat_stage">
      {/* 1. Flat Performance Floor (Top surface at exact Y = 0.00) */}
      <mesh
        name="stage_floor_deck"
        position={[0, -floorThickness / 2, 0]}
        receiveShadow
      >
        <boxGeometry args={[width, floorThickness, depth]} />
        <primitive object={materials.floor} attach="material" />
      </mesh>

      {/* 2. Four open-air pillars with directly mounted light fixtures */}
      {pillarPositions.map((pos, idx) => (
        <group key={`pillar_${idx}`} name={`stage_corner_pillar_0${idx + 1}`} position={pos}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.14, 0.14, pillarHeight, 16]} />
            <primitive object={materials.pillar} attach="material" />
          </mesh>
          <group name={`pillar_light_fixture_${idx + 1}`} position={[0, pillarHeight / 2 - 0.42, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.19, 0.15, 0.32, 12]} />
              <primitive object={materials.light} attach="material" />
            </mesh>
            <mesh position={[0, 0, 0.17]}>
              <circleGeometry args={[0.115, 16]} />
              <meshBasicMaterial color={idx % 2 ? '#60a5fa' : '#fef08a'} />
            </mesh>
          </group>
        </group>
      ))}

      {/* Concept Stage Boundary Line Indicator on Floor Surface */}
      {conceptMode && (
        <group position={[0, 0.002, 0]}>
          {/* Outer Boundary Ring */}
          <lineLoop>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[
                  new Float32Array([
                    -7.55, 0, -2.8,
                    7.55, 0, -2.8,
                    7.55, 0, 2.8,
                    -7.55, 0, 2.8,
                    -7.55, 0, -2.8,
                  ]),
                  3,
                ]}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#38bdf8" />
          </lineLoop>


          {/* Center Performance Marker */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
            <ringGeometry args={[0.40, 0.44, 32]} />
            <meshBasicMaterial color="#eab308" side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}
    </group>
  )
}
