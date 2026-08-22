"""
Build script: Create a VRM-compatible avatar GLB with skeleton and placeholder meshes.

Output: src/assets/models/avatar_merged.glb

Uses raw GLB binary format construction for reliability.
"""
import os
import struct
import json
import numpy as np
import copy


# Bone name mapping: Mixamo -> VRM (ported from Godot desktop_studio.gd)
MIXAMO_TO_VRM = {
    'mixamorig_Hips': 'Hips',
    'mixamorig_Spine': 'Spine',
    'mixamorig_Spine1': 'Chest',
    'mixamorig_Spine2': 'UpperChest',
    'mixamorig_Neck': 'Neck',
    'mixamorig_Head': 'Head',
    'mixamorig_LeftShoulder': 'LeftShoulder',
    'mixamorig_LeftArm': 'LeftUpperArm',
    'mixamorig_LeftForeArm': 'LeftLowerArm',
    'mixamorig_LeftHand': 'LeftHand',
    'mixamorig_RightShoulder': 'RightShoulder',
    'mixamorig_RightArm': 'RightUpperArm',
    'mixamorig_RightForeArm': 'RightLowerArm',
    'mixamorig_RightHand': 'RightHand',
    'mixamorig_LeftUpLeg': 'LeftUpperLeg',
    'mixamorig_LeftLeg': 'LeftLowerLeg',
    'mixamorig_LeftFoot': 'LeftFoot',
    'mixamorig_LeftToeBase': 'LeftToes',
    'mixamorig_RightUpLeg': 'RightUpperLeg',
    'mixamorig_RightLeg': 'RightLowerLeg',
    'mixamorig_RightFoot': 'RightFoot',
    'mixamorig_RightToeBase': 'RightToes',
}


def build_avatar_glb(output_path: str) -> bool:
    """Build a VRM-compatible avatar GLB with skeleton, meshes, and idle animation."""

    # === Bone hierarchy ===
    bone_names = [
        'Root', 'Hips', 'Spine', 'Chest', 'UpperChest',
        'Neck', 'Head',
        'LeftShoulder', 'LeftUpperArm', 'LeftLowerArm', 'LeftHand',
        'RightShoulder', 'RightUpperArm', 'RightLowerArm', 'RightHand',
        'LeftUpperLeg', 'LeftLowerLeg', 'LeftFoot', 'LeftToes',
        'RightUpperLeg', 'RightLowerLeg', 'RightFoot', 'RightToes',
    ]

    parent_map = {
        'Hips': 'Root',
        'Spine': 'Hips', 'Chest': 'Spine', 'UpperChest': 'Chest',
        'Neck': 'UpperChest', 'Head': 'Neck',
        'LeftShoulder': 'UpperChest', 'LeftUpperArm': 'LeftShoulder',
        'LeftLowerArm': 'LeftUpperArm', 'LeftHand': 'LeftLowerArm',
        'RightShoulder': 'UpperChest', 'RightUpperArm': 'RightShoulder',
        'RightLowerArm': 'RightUpperArm', 'RightHand': 'RightLowerArm',
        'LeftUpperLeg': 'Hips', 'LeftLowerLeg': 'LeftUpperLeg',
        'LeftFoot': 'LeftLowerLeg', 'LeftToes': 'LeftFoot',
        'RightUpperLeg': 'Hips', 'RightLowerLeg': 'RightUpperLeg',
        'RightFoot': 'RightLowerLeg', 'RightToes': 'RightFoot',
    }

    bone_node_idx = {name: i for i, name in enumerate(bone_names)}

    # === Vertex data ===
    # Body (box): 8 vertices
    body_pos = np.array([
        -0.15, 0.6, 0.08,   0.15, 0.6, 0.08,   0.15, -0.2, 0.08,  -0.15, -0.2, 0.08,
        -0.15, 0.6, -0.08,  -0.15, -0.2, -0.08,  0.15, -0.2, -0.08,  0.15, 0.6, -0.08,
    ], dtype=np.float32)

    body_idx = np.array([
        0,1,2, 0,2,3, 4,7,6, 4,6,5, 0,3,7, 0,7,4, 1,5,6, 1,6,2, 0,4,5, 0,5,1, 3,2,6, 3,6,7,
    ], dtype=np.uint16)

    # Head (sphere-ish): 5 vertices
    head_pos = np.array([
        -0.12, 0.62, 0.12,  0.12, 0.62, 0.12,  0.12, 0.62, -0.12,
        -0.12, 0.62, -0.12,  0, 0.78, 0,
    ], dtype=np.float32)

    head_idx = np.array([
        0,1,2, 0,2,3, 0,3,4, 1,4,2, 2,4,3,
    ], dtype=np.uint16) + 5  # offset by body vertex count

    # Hair (box): 8 vertices
    hair_pos = np.array([
        -0.18, 0.6, 0.1,  0.18, 0.6, 0.1,  0.18, 0.6, -0.1,  -0.18, 0.6, -0.1,
        -0.18, 0.85, 0.1,  0.18, 0.85, 0.1,  0.18, 0.85, -0.1,  -0.18, 0.85, -0.1,
    ], dtype=np.float32)

    hair_idx = np.array([
        0,1,2, 0,2,3, 4,5,6, 4,6,7,
        0,3,6, 0,6,7, 1,4,7, 1,7,2,
        0,4,5, 0,5,1, 3,2,6, 3,6,7,
    ], dtype=np.uint16) + 13  # offset by body + head count

    all_pos = np.concatenate([body_pos, head_pos, hair_pos])
    all_idx = np.concatenate([body_idx, head_idx, hair_idx])

    vertex_count = len(all_pos) // 3
    vertex_count_body = len(body_pos) // 3
    vertex_count_head = len(head_pos) // 3
    vertex_count_hair = len(hair_pos) // 3

    # Joint/weight data (all bind to Hips = index 1)
    joints_count = len(all_pos) // 3
    joints_data = np.zeros((joints_count, 4), dtype=np.uint16)
    weights_data = np.zeros((joints_count, 4), dtype=np.float32)
    for i in range(joints_count):
        joints_data[i, 0] = 1  # Hips joint index
        weights_data[i, 0] = 1.0

    # === Animation data ===
    # Idle: Hips translation bounce
    times = np.array([0.0, 0.5, 1.0], dtype=np.float32)
    translations = np.array([
        [0.0, 0.0, 0.0],
        [0.0, 0.01, 0.0],
        [0.0, 0.0, 0.0],
    ], dtype=np.float32)

    # === Assemble binary blob ===
    bin_data = bytearray()

    # Vertex positions
    pos_offset = len(bin_data)
    pos_size = len(all_pos) * 4
    bin_data.extend(all_pos.tobytes())

    # JOINTS_0
    joints_offset = len(bin_data)
    joints_size = len(joints_data) * 8
    bin_data.extend(joints_data.tobytes())

    # WEIGHTS_0
    weights_offset = len(bin_data)
    weights_size = len(weights_data) * 16
    bin_data.extend(weights_data.tobytes())

    # Indices (combined for all primitives)
    idx_offset = len(bin_data)
    idx_size = len(all_idx) * 2
    bin_data.extend(all_idx.tobytes())

    # IBM (inverse bind matrices) - identity, per joint
    ibm_data = np.eye(4, dtype=np.float32)
    ibm_data = np.tile(ibm_data.flatten(), (len(bone_names), 1))
    ibm_offset = len(bin_data)
    ibm_size = len(ibm_data) * 4 * 16  # count * 16 floats
    bin_data.extend(ibm_data.tobytes())

    # Animation time
    time_offset = len(bin_data)
    time_size = len(times) * 4
    bin_data.extend(times.tobytes())

    # Animation translation values
    trans_offset = len(bin_data)
    trans_size = len(translations) * 12
    bin_data.extend(translations.tobytes())

    # === Build GLB JSON ===
    # Buffer views
    views = []

    # positions (for body primitive)
    views.append({
        "buffer": 0, "byteOffset": pos_offset,
        "byteLength": vertex_count * 12, "target": 34963,
        "byteStride": 12
    })
    pos_acc_idx = 0  # accessor index

    # joints
    views.append({
        "buffer": 0, "byteOffset": joints_offset,
        "byteLength": joints_count * 8, "target": 34963,
        "byteStride": 8
    })
    joints_acc_idx = len(views)  # accessor index will be after this

    # weights
    views.append({
        "buffer": 0, "byteOffset": weights_offset,
        "byteLength": joints_count * 16, "target": 34963,
        "byteStride": 16
    })

    # indices
    views.append({
        "buffer": 0, "byteOffset": idx_offset,
        "byteLength": len(all_idx) * 2, "target": 34965,
    })
    idx_acc_idx = len(views)

    # IBM
    views.append({
        "buffer": 0, "byteOffset": ibm_offset,
        "byteLength": ibm_size,
    })
    ibm_acc_idx = len(views)

    # Animation time
    views.append({
        "buffer": 0, "byteOffset": time_offset,
        "byteLength": time_size,
    })
    time_acc_idx = len(views)

    # Animation translation
    views.append({
        "buffer": 0, "byteOffset": trans_offset,
        "byteLength": trans_size,
    })
    trans_acc_idx = len(views)

    # Accessors
    accessors = []

    # Position accessor (body + head + hair all share, but we need separate for primitives)
    # Actually, for skinned meshes in glTF, we need one set of position accessors per mesh primitive
    # For simplicity, all primitives share the same position buffer but use subsets
    accessors.append({
        "bufferView": 0, "componentType": 5126, "count": vertex_count,
        "type": "VEC3",
        "max": [float(all_pos[0::3].max()), float(all_pos[1::3].max()), float(all_pos[2::3].max())],
        "min": [float(all_pos[0::3].min()), float(all_pos[1::3].min()), float(all_pos[2::3].min())],
    })

    # JOINTS_0
    accessors.append({
        "bufferView": 1, "componentType": 5123, "count": joints_count,
        "type": "VEC4",
    })

    # WEIGHTS_0
    accessors.append({
        "bufferView": 2, "componentType": 5126, "count": joints_count,
        "type": "VEC4",
    })

    # Indices (for all primitives combined - we'll use one accessor with different ranges)
    # Actually, glTF requires separate index accessors for each primitive
    # Let's create separate index accessors
    accessors.append({
        "bufferView": 3, "componentType": 5123, "count": len(body_idx),
        "type": "SCALAR",
    })
    body_idx_acc = len(accessors) - 1

    accessors.append({
        "bufferView": 3, "byteOffset": 0,
        "componentType": 5123, "count": len(head_idx),
        "type": "SCALAR",
    })
    head_idx_acc = len(accessors) - 1

    accessors.append({
        "bufferView": 3, "byteOffset": len(body_idx) * 2,
        "componentType": 5123, "count": len(hair_idx),
        "type": "SCALAR",
    })
    hair_idx_acc = len(accessors) - 1

    # IBM accessor
    accessors.append({
        "bufferView": 4, "componentType": 5126, "count": len(bone_names),
        "type": "MAT4",
    })

    # Animation time accessor
    accessors.append({
        "bufferView": 5, "componentType": 5126, "count": 3,
        "type": "SCALAR",
    })

    # Animation translation accessor
    accessors.append({
        "bufferView": 6, "componentType": 5126, "count": 3,
        "type": "VEC3",
    })

    # Materials
    materials = [
        {
            "name": "skin_mat",
            "pbrMetallicRoughness": {
                "baseColorFactor": [0.9, 0.7, 0.55, 1.0],
                "metallicFactor": 0.1,
                "roughnessFactor": 0.8,
            }
        },
        {
            "name": "top_mat",
            "pbrMetallicRoughness": {
                "baseColorFactor": [0.15, 0.25, 0.55, 1.0],
                "metallicFactor": 0.2,
                "roughnessFactor": 0.6,
            }
        },
        {
            "name": "hair_mat",
            "pbrMetallicRoughness": {
                "baseColorFactor": [0.1, 0.05, 0.02, 1.0],
                "metallicFactor": 0.0,
                "roughnessFactor": 0.95,
            }
        },
        {
            "name": "earrings_mat",
            "pbrMetallicRoughness": {
                "baseColorFactor": [0.95, 0.85, 0.2, 1.0],
                "metallicFactor": 0.9,
                "roughnessFactor": 0.3,
            }
        },
    ]

    # Mesh
    mesh = {
        "name": "avatar",
        "primitives": [
            {
                "material": 0,  # skin
                "attributes": {
                    "POSITION": 0,
                    "JOINTS_0": 1,
                    "WEIGHTS_0": 2,
                },
                "indices": body_idx_acc,
            },
            {
                "material": 1,  # top
                "attributes": {
                    "POSITION": 0,
                    "JOINTS_0": 1,
                    "WEIGHTS_0": 2,
                },
                "indices": head_idx_acc,
            },
            {
                "material": 2,  # hair
                "attributes": {
                    "POSITION": 0,
                    "JOINTS_0": 1,
                    "WEIGHTS_0": 2,
                },
                "indices": hair_idx_acc,
            },
        ]
    }

    # Nodes
    nodes = []
    for i, bone_name in enumerate(bone_names):
        node = {
            "name": bone_name,
            "rotation": [0, 0, 0, 1],
            "scale": [1, 1, 1],
            "translation": [0, 0, 0],
        }
        # Set up hierarchy
        parent = parent_map.get(bone_name)
        if parent:
            parent_idx = bone_node_idx[parent]
            # We'll set children via parent's children list
            child_idx = len(nodes)
        nodes.append(node)

    # Set children relationships
    for i, bone_name in enumerate(bone_names):
        children = [j for j, b in enumerate(bone_names) if parent_map.get(b) == bone_name]
        if children:
            nodes[i]["children"] = children

    # Add mesh to Hips node
    hips_idx = bone_node_idx['Hips']
    nodes[hips_idx]["mesh"] = 0
    nodes[hips_idx]["skin"] = 0

    # Armature node
    armature_idx = len(nodes)
    nodes.append({
        "name": "Armature",
        "rotation": [0, 0, 0, 1],
        "scale": [1, 1, 1],
        "children": [bone_node_idx['Root']],
    })

    # Scene
    scenes = [{"nodes": [armature_idx]}]

    # Skin
    skins = [{
        "joints": [bone_node_idx[name] for name in bone_names],
        "skeleton": bone_node_idx['Root'],
        "inverseBindMatrices": len(accessors) - 3,  # IBM accessor
    }]

    # Animation
    animations = [{
        "name": "idle",
        "channels": [
            {
                "sampler": 0,
                "target": {
                    "node": bone_node_idx['Hips'],
                    "path": "translation",
                }
            }
        ],
        "samplers": [
            {
                "input": len(accessors) - 2,  # time accessor
                "output": len(accessors) - 1,  # translation accessor
                "interpolation": "LINEAR",
            }
        ]
    }]

    # === Assemble GLB ===
    glb_json = {
        "asset": {"version": "2.0", "generator": "MidnightStudio-merge-script"},
        "scene": 0,
        "scenes": scenes,
        "nodes": nodes,
        "meshes": [mesh],
        "materials": materials,
        "accessors": accessors,
        "bufferViews": [
            {"buffer": 0, **v} for v in views
        ],
        "skins": skins,
        "animations": animations,
        "buffers": [{
            "byteLength": len(bin_data)
        }],
    }

    # Convert to JSON
    json_str = json.dumps(glb_json, separators=(',', ':'))
    json_bytes = json_str.encode('utf-8')

    # Pad JSON to 4-byte boundary
    while len(json_bytes) % 4 != 0:
        json_bytes += b' '

    # Build GLB
    glb = bytearray()
    glb.extend(struct.pack('<I', 0x46546C67))  # magic
    glb.extend(struct.pack('<I', 2))  # version
    glb.extend(struct.pack('<I', 0))  # length placeholder

    # JSON chunk
    glb.extend(struct.pack('<I', len(json_bytes)))
    glb.extend(b'JSON')
    glb.extend(json_bytes)

    # BIN chunk
    bin_aligned = bin_data
    while len(bin_aligned) % 4 != 0:
        bin_aligned.extend(b'\x00')
    glb.extend(struct.pack('<I', len(bin_aligned)))
    glb.extend(b'BIN\0')
    glb.extend(bin_aligned)

    # Fix total length in header (bytes 8-12)
    glb[8:12] = struct.pack('<I', len(glb))

    with open(output_path, 'wb') as f:
        f.write(glb)

    print(f"Created avatar GLB: {output_path} ({len(glb)} bytes)")

    # Verify
    verify_glb(output_path)
    return True


def verify_glb(path: str):
    """Verify the GLB was written correctly."""
    with open(path, 'rb') as f:
        data = f.read()

    magic = struct.unpack('<I', data[0:4])[0]
    assert magic == 0x46546C67, f"Bad magic: {magic:#x}"

    version = struct.unpack('<I', data[4:8])[0]
    total_length = struct.unpack('<I', data[8:12])[0]

    # GLB chunk layout: chunkLength(4) + chunkType(4) + chunkData
    offset = 12
    json_len = struct.unpack('<I', data[offset:offset+4])[0]
    json_type = data[offset+4:offset+8].decode('ascii')
    assert json_type == 'JSON', f"Bad chunk type: {json_type}"

    json_data = data[offset+8:offset+8+json_len]
    glb_json = json.loads(json_data.decode('utf-8'))

    print(f"  Verified: {len(glb_json['nodes'])} nodes, {len(glb_json['meshes'])} meshes, {len(glb_json['animations'])} animations, {len(glb_json['skins'])} skins")
    for n in glb_json['nodes']:
        if n.get('name'):
            print(f"    node: {n['name']}")
    for a in glb_json['animations']:
        print(f"    anim: {a['name']}, channels: {len(a['channels'])}")


def main():
    output_path = os.path.join('src', 'assets', 'models', 'avatar_merged.glb')
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    # Check for existing master_avatar GLBs
    chars_dir = os.path.join('library', 'characters')
    master_files = []
    if os.path.exists(chars_dir):
        master_files = [
            f for f in os.listdir(chars_dir)
            if f.startswith('master_avatar_') and f.endswith('.glb')
        ]

    if master_files:
        import shutil
        shutil.copy2(os.path.join(chars_dir, master_files[0]), output_path)
        print(f"Using existing avatar: {master_files[0]} -> {output_path}")
        verify_glb(output_path)
    else:
        print("Creating placeholder avatar GLB")
        build_avatar_glb(output_path)

    print(f"Done. Avatar at: {output_path}")


if __name__ == '__main__':
    main()
