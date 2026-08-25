import { create } from 'zustand'

export type LayoutVector = [number, number, number]
export interface StageLayoutItem { id: string; label: string; position: LayoutVector; rotation: LayoutVector; targetHeight: number }

const initialItems: StageLayoutItem[] = [
  // Every merchandise object uses the same largest-axis display size and a
  // shared elevated baseline. Float adds the subtle showroom motion above it.
  ['merch-01', 'Garment 01 · Textured', [-6.8, 1.05, -1.65], 0.78], ['merch-02', 'Garment 02 · Textured', [-5.45, 1.05, -1.05], 0.78],
  ['merch-03', 'Garment 03 · Textured', [-4.1, 1.05, -1.65], 0.78], ['merch-04', 'Garment 04 · Textured', [-6.8, 1.05, -0.25], 0.78],
  ['merch-05', 'Garment 05 · Textured', [-5.45, 1.05, 0.2], 0.78], ['merch-06', 'Garment 06 · Textured', [-4.1, 1.05, -0.25], 0.78],
  ['merch-07', 'Garment 07 · Textured', [-6.8, 1.05, 1.18], 0.78], ['merch-08', 'Garment 08 · Textured', [-5.45, 1.05, 1.52], 0.78],
  ['merch-09', 'Garment 09 · Textured', [-4.1, 1.05, 1.18], 0.78], ['merch-10', 'Garment 10 · Textured', [-5.45, 1.05, 2.2], 0.78],
  ['desk', 'Creative desk', [4.75, 0, -1.25], 1.05], ['console', 'Mixing console', [4.7, 0, -0.8], 0.43],
  ['monitor', 'Monitor speaker', [6.25, 0, -1.3], 1.1], ['audio-rack', 'Audio equipment rack', [6.8, 0, -2.25], 1.55],
  ['equipment-rack', 'Equipment rack', [3.45, 0, -2.3], 1.45], ['synth', 'Synthesizer', [4.55, 0, 0.05], 0.7],
  ['boom', 'Microphone boom', [2.85, 0, -0.85], 2.0], ['cable', 'Coiled audio cable', [3.45, 0.02, 0.8], 0.14],
].map(([id, label, position, targetHeight]) => ({ id: id as string, label: label as string, position: position as LayoutVector, rotation: [0, 0, 0] as LayoutVector, targetHeight: targetHeight as number }))

interface StageLayoutState { items: Record<string, StageLayoutItem>; selectedId: string; select: (id: string) => void; nudge: (axis: 0 | 1 | 2, amount: number) => void; resize: (amount: number) => void; rotate: (amount: number) => void; reset: () => void }
const toMap = () => Object.fromEntries(initialItems.map((item) => [item.id, { ...item, position: [...item.position] as LayoutVector, rotation: [...item.rotation] as LayoutVector }]))
export const useStageLayoutStore = create<StageLayoutState>((set) => ({
  items: toMap(), selectedId: 'merch-02', select: (selectedId) => set({ selectedId }),
  nudge: (axis, amount) => set((state) => { const item = state.items[state.selectedId]; if (!item) return state; const position = [...item.position] as LayoutVector; position[axis] += amount; return { items: { ...state.items, [item.id]: { ...item, position } } } }),
  resize: (amount) => set((state) => {
    const item = state.items[state.selectedId]
    if (!item) return state
    return { items: { ...state.items, [item.id]: { ...item, targetHeight: Math.max(0.12, Math.min(1.85, item.targetHeight + amount)) } } }
  }),
  rotate: (amount) => set((state) => { const item = state.items[state.selectedId]; if (!item) return state; const rotation = [...item.rotation] as LayoutVector; rotation[1] += amount; return { items: { ...state.items, [item.id]: { ...item, rotation } } } }),
  reset: () => set({ items: toMap(), selectedId: 'merch-02' }),
}))
