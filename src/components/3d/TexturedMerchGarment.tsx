'use client'

import { useFrame, useLoader, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

interface TexturedMerchGarmentProps { look: number; position: [number, number, number]; rotation: [number, number, number]; maxExtent: number; onClick: () => void }

/** Authoritative OBJ + PBR textures from `mrch for avatar`, displayed as merchandise—not proxy GLBs. */
export function TexturedMerchGarment({ look, position, rotation, maxExtent, onClick }: TexturedMerchGarmentProps) {
  const [hovered, setHovered] = useState(false)
  const source = useLoader(OBJLoader, `/library/merch-textured/${look}/base.obj`)
  const [map, normalMap, roughnessMap, metalnessMap] = useTexture([
    `/library/merch-textured/${look}/texture_diffuse.png`, `/library/merch-textured/${look}/texture_normal.png`,
    `/library/merch-textured/${look}/texture_roughness.png`, `/library/merch-textured/${look}/texture_metallic.png`,
  ])
  const { gl } = useThree()
  const floatingRef = useRef<THREE.Group>(null)
  const model = useMemo(() => {
    map.colorSpace = THREE.SRGBColorSpace
    const copy = source.clone(true)
    copy.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return
      const mesh = child as THREE.Mesh
      mesh.material = new THREE.MeshStandardMaterial({ map, normalMap, roughnessMap, metalnessMap, roughness: 0.78, metalness: 0.04 })
      mesh.castShadow = true; mesh.receiveShadow = true
    })
    const box = new THREE.Box3().setFromObject(copy)
    const size = box.getSize(new THREE.Vector3())
    const scale = maxExtent / Math.max(size.x, size.y, size.z, 0.001)
    copy.scale.setScalar(scale)
    const placed = new THREE.Box3().setFromObject(copy)
    copy.position.y -= placed.min.y
    return copy
  }, [source, map, normalMap, roughnessMap, metalnessMap, maxExtent, gl])
  useFrame(({ clock }, delta) => {
    const group = floatingRef.current
    if (!group) return
    const phase = clock.getElapsedTime() * 1.15 + look * 0.8
    group.position.y = Math.sin(phase) * (hovered ? 0.11 : 0.055)
    group.rotation.y = THREE.MathUtils.damp(group.rotation.y, hovered ? Math.sin(phase * 0.7) * 0.18 : 0, 5, delta)
    const scale = hovered ? 1.1 : 1
    group.scale.setScalar(THREE.MathUtils.damp(group.scale.x, scale, 7, delta))
  })

  return <group position={position} rotation={rotation} onClick={(event) => { event.stopPropagation(); onClick() }} onPointerOver={(event) => { event.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }} onPointerOut={(event) => { event.stopPropagation(); setHovered(false); document.body.style.cursor = 'auto' }}><group ref={floatingRef}><primitive object={model} /></group></group>
}
