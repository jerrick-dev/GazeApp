import { Canvas } from '@react-three/fiber'
import { EyeModel } from './EyeModel'

type EyeStageProps = {
  glowing: boolean
  loggedToday: boolean
  onSelect: () => void
}

export function EyeStage({ glowing, loggedToday, onSelect }: EyeStageProps) {
  return (
    <div
      className={`eye-stage ${glowing ? 'is-glowing' : ''} ${loggedToday ? 'is-logged' : ''}`}
      role="button"
      tabIndex={0}
      aria-label="Open today’s gaze journal"
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect()
        }
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 12.2], fov: 34 }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }}
      >
        <ambientLight intensity={0.3} color="#ffffff" />
        <directionalLight position={[2.8, 2.4, 4.5]} intensity={2.1} color="#f8fbff" />
        <directionalLight position={[-3.4, -1.3, 2.2]} intensity={1.15} color="#9fb7d8" />
        <pointLight position={[0, 0.2, 3.8]} intensity={1.4} color="#ffffff" distance={8} />
        <EyeModel glowing={glowing} loggedToday={loggedToday} />
      </Canvas>
    </div>
  )
}
