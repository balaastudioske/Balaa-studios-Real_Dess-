'use client'
import { useLayoutEffect, useRef, useMemo } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { GPUComputationRenderer, Variable } from 'three/examples/jsm/misc/GPUComputationRenderer.js'
import { positionComputeShader, velocityComputeShader } from '@/lib/shaders/curl-noise'

const TEXTURE_SIZE = 256

export const GPGPUParticleSystem = () => {
  const { gl } = useThree()
  const pointsRef = useRef<THREE.Points>(null!)
  const gpuComputeRef = useRef<GPUComputationRenderer | null>(null)
  const positionVariableRef = useRef<Variable | null>(null)
  const velocityVariableRef = useRef<Variable | null>(null)
  const renderMaterialRef = useRef<THREE.ShaderMaterial>(null!)

  // Initialize GPUComputationRenderer
  useLayoutEffect(() => {
    if (!gl) return

    const gpuCompute = new GPUComputationRenderer(TEXTURE_SIZE, TEXTURE_SIZE, gl)
    gpuComputeRef.current = gpuCompute

    // Create initial position texture (random positions in a sphere)
    const positionTexture = gpuCompute.createTexture()
    const positionData = positionTexture.image.data as Float32Array
    for (let i = 0; i < positionData.length; i += 4) {
      const radius = 2.0
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      positionData[i] = radius * Math.sin(phi) * Math.cos(theta)
      positionData[i + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positionData[i + 2] = radius * Math.cos(phi)
      positionData[i + 3] = 1.0
    }

    // Create initial velocity texture (random small velocities)
    const velocityTexture = gpuCompute.createTexture()
    const velocityData = velocityTexture.image.data as Float32Array
    for (let i = 0; i < velocityData.length; i += 4) {
      velocityData[i] = (Math.random() - 0.5) * 0.1
      velocityData[i + 1] = (Math.random() - 0.5) * 0.1
      velocityData[i + 2] = (Math.random() - 0.5) * 0.1
      velocityData[i + 3] = 1.0
    }

    // Add variables
    const positionVariable = gpuCompute.addVariable('uPositionTexture', positionComputeShader, positionTexture)
    const velocityVariable = gpuCompute.addVariable('uVelocityTexture', velocityComputeShader, velocityTexture)

    positionVariableRef.current = positionVariable
    velocityVariableRef.current = velocityVariable

    // Set dependencies: position depends on both, velocity depends on both
    gpuCompute.setVariableDependencies(positionVariable, [positionVariable, velocityVariable])
    gpuCompute.setVariableDependencies(velocityVariable, [positionVariable, velocityVariable])

    // Set shared uniforms
    const sharedUniforms = {
      uTime: { value: 0 },
    }

    // uSpherePosition is only used by velocity shader, not position shader
    Object.assign(velocityVariable.material.uniforms, sharedUniforms)
    velocityVariable.material.uniforms.uSpherePosition = { value: new THREE.Vector3(0, 0, 0) }

    // Initialize
    const error = gpuCompute.init()
    if (error) {
      console.error('[GPGPUParticleSystem] GPUComputationRenderer init error:', error)
      return
    }

    return () => {
      gpuCompute.dispose()
      renderMaterialRef.current?.dispose()
    }
  }, [gl])

  // Compute textures each frame
  useFrame(({ clock }, delta) => {
    if (!gpuComputeRef.current || !positionVariableRef.current || !velocityVariableRef.current) return

    const elapsedTime = clock.elapsedTime
    positionVariableRef.current.material.uniforms.uTime.value = elapsedTime

    velocityVariableRef.current.material.uniforms.uTime.value = elapsedTime
    velocityVariableRef.current.material.uniforms.uSpherePosition.value = new THREE.Vector3(
      Math.sin(elapsedTime * 0.3) * 1.5,
      Math.cos(elapsedTime * 0.2) * 0.5,
      Math.cos(elapsedTime * 0.3) * 1.5
    )

    // Update render material with current position texture
    renderMaterialRef.current.uniforms.uPositionTexture.value =
      gpuComputeRef.current.getCurrentRenderTarget(positionVariableRef.current).texture
    renderMaterialRef.current.uniforms.uTime.value = elapsedTime

    // Run compute
    gpuComputeRef.current.compute()
  })

  // Create vertex attributes for a grid of particles
  const { positions, uvs } = useMemo(() => {
    const positions = new Float32Array(TEXTURE_SIZE * TEXTURE_SIZE * 3)
    const uvs = new Float32Array(TEXTURE_SIZE * TEXTURE_SIZE * 2)

    let pi = 0
    let ui = 0
    for (let y = 0; y < TEXTURE_SIZE; y++) {
      for (let x = 0; x < TEXTURE_SIZE; x++) {
        positions[pi] = (x / TEXTURE_SIZE) * 2 - 1
        positions[pi + 1] = (y / TEXTURE_SIZE) * 2 - 1
        positions[pi + 2] = 0
        pi += 3

        uvs[ui] = x / TEXTURE_SIZE
        uvs[ui + 1] = y / TEXTURE_SIZE
        ui += 2
      }
    }

    return { positions, uvs }
  }, [])

  const renderMaterial = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uPositionTexture: { value: null },
        uTime: { value: 0 },
      },
      vertexShader: `
precision highp float;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 pos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  gl_PointSize = 3.0;
}
`,
      fragmentShader: `
precision highp float;
uniform sampler2D uPositionTexture;
uniform float uTime;
varying vec2 vUv;

void main() {
  vec3 pos = texture2D(uPositionTexture, vUv).xyz;
  vec3 color = 0.5 + 0.5 * sin(uTime + pos * 0.5);
  gl_FragColor = vec4(color, 0.8);
}
`,
      transparent: true,
      depthWrite: false,
    })
    renderMaterialRef.current = mat
    return mat
  }, [])

  return (
    <points ref={pointsRef} material={renderMaterial}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-uv" args={[uvs, 2]} />
      </bufferGeometry>
    </points>
  )
}
