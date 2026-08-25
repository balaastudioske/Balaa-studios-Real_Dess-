'use client'

import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

interface TexturedMerchGarmentProps {
  look: number
  position: [number, number, number]
  rotation: [number, number, number]
  maxExtent: number
  onClick: () => void
}

/** 
 * High-performance binary GLB garment with official BALAA PBR diffuse texture.
 * Replaces uncompressed 100MB ASCII OBJ text parsing with instant binary glTF.
 */
export function TexturedMerchGarment({ look, position, rotation, maxExtent, onClick }: TexturedMerchGarmentProps) {
  const [hovered, setHovered] = useState(false)
  const padIndex = String(look).padStart(2, '0')
  const { scene } = useGLTF(`/library/merch/${padIndex}/garment.glb`)
  const floatingRef = useRef<THREE.Group>(null)

  const model = useMemo(() => {
    const copy = clone(scene)
    copy.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return
      const mesh = child as THREE.Mesh
      if (mesh.material) {
        mesh.material = (mesh.material as THREE.Material).clone()
        if ((mesh.material as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
          const std = mesh.material as THREE.MeshStandardMaterial
          std.roughness = 0.75
          std.metalness = 0.08
          std.needsUpdate = true
        }
      }
      mesh.castShadow = true
      mesh.receiveShadow = true
    })

    const box = new THREE.Box3().setFromObject(copy)
    const size = box.getSize(new THREE.Vector3())
    const scale = maxExtent / Math.max(size.x, size.y, size.z, 0.001)
    copy.scale.setScalar(scale)
    const placed = new THREE.Box3().setFromObject(copy)
    copy.position.y -= placed.min.y
    return copy
  }, [scene, maxExtent])

  useFrame(({ clock }, delta) => {
    const group = floatingRef.current
    if (!group) return
    const phase = clock.getElapsedTime() * 1.15 + look * 0.8
    group.position.y = Math.sin(phase) * (hovered ? 0.11 : 0.055)
    group.rotation.y = THREE.MathUtils.damp(group.rotation.y, hovered ? Math.sin(phase * 0.7) * 0.18 : 0, 5, delta)
    const scale = hovered ? 1.1 : 1
    group.scale.setScalar(THREE.MathUtils.damp(group.scale.x, scale, 7, delta))
  })

  return (
    <group
      position={position}
      rotation={rotation}
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
      onPointerOver={(event) => {
        event.stopPropagation()
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={(event) => {
        event.stopPropagation()
        setHovered(false)
        document.body.style.cursor = 'auto'
      }}
    >
      <group ref={floatingRef}>
        <primitive object={model} />
      </group>
    </group>
  )
}

// Preload all 10 GLBs
for (let i = 1; i <= 10; i++) {
  useGLTF.preload(`/library/merch/${String(i).padStart(2, '0')}/garment.glb`)
}

