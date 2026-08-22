import * as THREE from 'three'

export const DES_AXIS_SWAP = new THREE.Matrix4().set(
  0, 1, 0, 0,
  1, 0, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1,
)

export function fixAvatarAxes(group: THREE.Object3D): void {
  group.traverse((node: any) => {
    if (node.isSkinnedMesh) {
      node.geometry.applyMatrix4(DES_AXIS_SWAP)
      node.geometry.computeVertexNormals()
      node.geometry.computeBoundingSphere()

      node.bindMatrix.multiply(DES_AXIS_SWAP)
      node.bindMatrixInverse.copy(node.bindMatrix).invert()

      if (node.skeleton) {
        node.bind(node.skeleton, node.bindMatrix)
      }
      node.frustumCulled = false
      node.skeleton?.update()

      if (node.material) {
        const materials = Array.isArray(node.material) ? node.material : [node.material]
        materials.forEach((m: any) => {
          if (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial) {
            m.side = THREE.DoubleSide
          }
        })
      }
    }
  })
}
