import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

type EyeModelProps = {
  glowing: boolean
  loggedToday: boolean
}

type AsciiEyeTexture = {
  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D
  texture: THREE.CanvasTexture
}

const CANVAS_WIDTH = 1200
const CANVAS_HEIGHT = 675
const COLUMN_STEP = 15
const ROW_STEP = 22
const BASE_EYE_SCALE = 0.78

const HALO_GLYPHS = ['.', '.', '.', ',', ',', ';', "'"]
const EDGE_GLYPHS = ['.', ',', ',', ';', ';', ':', 'l']
const SCLERA_GLYPHS = [';', ':', 'c', 'c', 'c', 'l', 'l', 'o', 'd', 'x']
const OUTER_IRIS_GLYPHS = ['c', 'c', 'o', 'o', 'O', '0', 'x', 'd']
const INNER_IRIS_GLYPHS = ['l', 'o', 'd', 'x', 'k', 'K', '0', 'O', 'N']
const PUPIL_GLYPHS = ['N', 'M', 'M', 'W', 'W', 'X', 'K', 'O']

function hash(row: number, column: number, salt = 0) {
  let value = Math.imul(column + salt * 17, 374761393) + Math.imul(row + salt * 31, 668265263)
  value = Math.imul(value ^ (value >>> 13), 1274126177)
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295
}

function glyphFrom(glyphs: string[], row: number, column: number, salt = 0) {
  return glyphs[Math.floor(hash(row, column, salt) * glyphs.length)]
}

function createAsciiEyeTexture(): AsciiEyeTexture {
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_WIDTH
  canvas.height = CANVAS_HEIGHT

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Unable to create ASCII eye canvas')
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.NearestFilter
  texture.generateMipmaps = false

  return { canvas, context, texture }
}

function createAsciiSurfaceGeometry() {
  const width = 5.5
  const height = 3.1
  const geometry = new THREE.PlaneGeometry(width, height, 72, 40)
  const positions = geometry.attributes.position

  for (let index = 0; index < positions.count; index += 1) {
    const normalizedX = positions.getX(index) / (width / 2)
    const normalizedY = positions.getY(index) / (height / 2)
    const centerLift = 0.46 * (1 - Math.pow(Math.abs(normalizedX), 1.55))
    const verticalTaper = 0.055 * normalizedY * normalizedY
    positions.setZ(index, 0.08 + centerLift - verticalTaper)
  }

  positions.needsUpdate = true
  geometry.computeVertexNormals()
  return geometry
}

function drawAsciiEye(
  asset: AsciiEyeTexture,
  gazeX: number,
  gazeY: number,
  brightness: number,
) {
  const { context } = asset
  const centerX = CANVAS_WIDTH / 2
  // Offset the grid origin to center the asymmetrical upper/lower lid bounds.
  const centerY = CANVAS_HEIGHT * 0.477
  const halfWidth = CANVAS_WIDTH * 0.455
  const halfHeight = CANVAS_HEIGHT * 0.39
  const irisX = centerX + CANVAS_WIDTH * 0.028 + gazeX
  const irisY = centerY - CANVAS_HEIGHT * 0.025 + gazeY
  const irisRadiusX = CANVAS_WIDTH * 0.142
  const irisRadiusY = CANVAS_HEIGHT * 0.285
  const pupilRadiusX = irisRadiusX * 0.51
  const pupilRadiusY = irisRadiusY * 0.57

  context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
  context.font = '700 23px Menlo, Monaco, Consolas, "Courier New", monospace'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.shadowBlur = 0

  const rowCount = Math.ceil(CANVAS_HEIGHT / ROW_STEP)
  const columnCount = Math.ceil(CANVAS_WIDTH / COLUMN_STEP)

  const getEyeRegion = (pixelX: number, pixelY: number) => {
    const normalizedX = (pixelX - centerX) / halfWidth
    const absoluteX = Math.abs(normalizedX)
    const curve = Math.pow(Math.max(0, 1 - Math.pow(Math.min(absoluteX, 1), 1.64)), 0.58)
    const cornerTilt = normalizedX * -0.075
    const normalizedY = (pixelY - centerY) / halfHeight - cornerTilt
    const upperLid = -0.84 * curve
    const lowerLid = 0.96 * curve

    return {
      absoluteX,
      normalizedY,
      upperLid,
      lowerLid,
      inside: absoluteX <= 1 && normalizedY >= upperLid && normalizedY <= lowerLid,
    }
  }

  const drawGlyph = (glyph: string, pixelX: number, pixelY: number, alpha: number) => {
    context.fillStyle = `rgba(255, 255, 255, ${Math.min(alpha, 1)})`
    context.fillText(glyph, pixelX, pixelY)
  }

  for (let row = 0; row <= rowCount; row += 1) {
    for (let column = 0; column <= columnCount; column += 1) {
      const baseX = column * COLUMN_STEP
      const baseY = row * ROW_STEP
      const region = getEyeRegion(baseX, baseY)
      const { absoluteX, normalizedY, upperLid, lowerLid, inside } = region
      if (absoluteX > 1.08) continue

      const haloDistance = Math.min(
        Math.abs(normalizedY - upperLid),
        Math.abs(normalizedY - lowerLid),
      )

      let glyph = ''
      let alpha = brightness

      if (!inside) {
        const inHalo = absoluteX <= 1.045 && haloDistance < 0.15
        const haloChance = 0.46 * (1 - haloDistance / 0.15)
        if (!inHalo || hash(row, column, 2) > haloChance) continue

        glyph = glyphFrom(HALO_GLYPHS, row, column, 3)
        alpha *= 0.56 + hash(row, column, 4) * 0.3
      } else {
        const span = Math.max(lowerLid - upperLid, 0.001)
        const edgeDistance = Math.min(
          (normalizedY - upperLid) / span,
          (lowerLid - normalizedY) / span,
          (1 - absoluteX) * 0.72,
        )
        const irisDistance = Math.hypot(
          (baseX - irisX) / irisRadiusX,
          (baseY - irisY) / irisRadiusY,
        )
        if (irisDistance <= 1.16) continue

        if (edgeDistance < 0.105) {
          if (hash(row, column, 11) < 0.18) continue
          glyph = glyphFrom(EDGE_GLYPHS, row, column, 12)
          alpha *= 0.76 + hash(row, column, 13) * 0.24
        } else {
          if (hash(row, column, 14) < 0.2) continue
          glyph = glyphFrom(SCLERA_GLYPHS, row, column, 15)
          alpha *= 0.78 + hash(row, column, 16) * 0.22
        }
      }

      const jitterX = (hash(row, column, 17) - 0.5) * 3.2
      const jitterY = (hash(row, column, 18) - 0.5) * 2.2
      drawGlyph(glyph, baseX + jitterX, baseY + jitterY, alpha)
    }
  }

  const irisColumnRadius = Math.ceil(irisRadiusX / COLUMN_STEP)
  const irisRowRadius = Math.ceil(irisRadiusY / ROW_STEP)

  for (let localRow = -irisRowRadius; localRow <= irisRowRadius; localRow += 1) {
    for (let localColumn = -irisColumnRadius; localColumn <= irisColumnRadius; localColumn += 1) {
      const localX = localColumn * COLUMN_STEP
      const localY = localRow * ROW_STEP
      const irisDistance = Math.hypot(localX / irisRadiusX, localY / irisRadiusY)
      if (irisDistance > 1) continue

      const pixelX = irisX + localX
      const pixelY = irisY + localY
      if (!getEyeRegion(pixelX, pixelY).inside) continue

      const pupilDistance = Math.hypot(localX / pupilRadiusX, localY / pupilRadiusY)
      const patternRow = localRow + irisRowRadius
      const patternColumn = localColumn + irisColumnRadius
      let glyph = ''
      let alpha = brightness

      if (pupilDistance <= 1) {
        if (hash(patternRow, patternColumn, 5) < 0.07) continue
        glyph = glyphFrom(PUPIL_GLYPHS, patternRow, patternColumn, 6)
        alpha *= 0.94 + hash(patternRow, patternColumn, 7) * 0.06
      } else {
        if (pupilDistance < 1.11) continue
        if (hash(patternRow, patternColumn, 8) < 0.09) continue
        const irisGlyphs = irisDistance > 0.76 ? OUTER_IRIS_GLYPHS : INNER_IRIS_GLYPHS
        glyph = glyphFrom(irisGlyphs, patternRow, patternColumn, 9)
        alpha *= 0.88 + hash(patternRow, patternColumn, 10) * 0.12
      }

      const jitterX = (hash(patternRow, patternColumn, 17) - 0.5) * 3.2
      const jitterY = (hash(patternRow, patternColumn, 18) - 0.5) * 2.2
      drawGlyph(glyph, pixelX + jitterX, pixelY + jitterY, alpha)
    }
  }

  asset.texture.needsUpdate = true
}

export function EyeModel({ glowing, loggedToday }: EyeModelProps) {
  const group = useRef<THREE.Group>(null)
  const eyeBody = useRef<THREE.Group>(null)
  const asset = useMemo(() => createAsciiEyeTexture(), [])
  const asciiSurface = useMemo(() => createAsciiSurfaceGeometry(), [])
  const gaze = useRef({
    x: 0,
    y: 0,
    velocityX: 0,
    velocityY: 0,
    renderedX: Number.NaN,
    renderedY: Number.NaN,
  })
  const motion = useRef({ rotationX: 0, rotationY: 0, velocityX: 0, velocityY: 0 })
  const brightness = glowing ? 1 : loggedToday ? 0.97 : 0.94

  useEffect(() => {
    drawAsciiEye(asset, gaze.current.x, gaze.current.y, brightness)
    gaze.current.renderedX = gaze.current.x
    gaze.current.renderedY = gaze.current.y
  }, [asset, brightness])

  useEffect(() => () => asset.texture.dispose(), [asset])
  useEffect(() => () => asciiSurface.dispose(), [asciiSurface])

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime
    const frameDelta = Math.min(delta, 1 / 30)
    const targetX = state.pointer.x * CANVAS_WIDTH * 0.04
    const targetY = -state.pointer.y * CANVAS_HEIGHT * 0.035
    gaze.current.velocityX += (targetX - gaze.current.x) * 36 * frameDelta
    gaze.current.velocityY += (targetY - gaze.current.y) * 36 * frameDelta
    const gazeDamping = Math.exp(-8 * frameDelta)
    gaze.current.velocityX *= gazeDamping
    gaze.current.velocityY *= gazeDamping
    gaze.current.x += gaze.current.velocityX * frameDelta
    gaze.current.y += gaze.current.velocityY * frameDelta

    const targetRotationX = -state.pointer.y * 0.115
    const targetRotationY = state.pointer.x * 0.18
    motion.current.velocityX += (targetRotationX - motion.current.rotationX) * 24 * frameDelta
    motion.current.velocityY += (targetRotationY - motion.current.rotationY) * 24 * frameDelta
    const rotationDamping = Math.exp(-6.2 * frameDelta)
    motion.current.velocityX *= rotationDamping
    motion.current.velocityY *= rotationDamping
    motion.current.rotationX += motion.current.velocityX * frameDelta
    motion.current.rotationY += motion.current.velocityY * frameDelta

    if (group.current) {
      group.current.rotation.x = motion.current.rotationX
      group.current.rotation.y = motion.current.rotationY
      group.current.position.y = Math.sin(time * 0.72) * 0.012
    }

    if (eyeBody.current) {
      const movement = Math.min(
        1,
        Math.abs(motion.current.velocityX) * 3.2 + Math.abs(motion.current.velocityY) * 2.2,
      )
      const breathing = Math.sin(time * 1.05) * 0.012
      const targetScaleX = BASE_EYE_SCALE * (1 + movement * 0.018 - breathing * 0.35)
      const targetScaleY = BASE_EYE_SCALE * (1 - movement * 0.024 + breathing)
      eyeBody.current.scale.x = THREE.MathUtils.lerp(eyeBody.current.scale.x, targetScaleX, 0.08)
      eyeBody.current.scale.y = THREE.MathUtils.lerp(eyeBody.current.scale.y, targetScaleY, 0.08)
      eyeBody.current.rotation.z = THREE.MathUtils.lerp(
        eyeBody.current.rotation.z,
        motion.current.velocityY * -0.045,
        0.06,
      )
    }

    if (
      Math.abs(gaze.current.x - gaze.current.renderedX) > 0.35
      || Math.abs(gaze.current.y - gaze.current.renderedY) > 0.35
    ) {
      drawAsciiEye(asset, gaze.current.x, gaze.current.y, brightness)
      gaze.current.renderedX = gaze.current.x
      gaze.current.renderedY = gaze.current.y
    }
  })

  return (
    <group ref={group}>
      <group ref={eyeBody} scale={BASE_EYE_SCALE}>
        <mesh scale={[1.72, 1.46, 1.36]}>
          <sphereGeometry args={[1, 128, 96]} />
          <meshPhysicalMaterial
            color="#0b0c11"
            emissive="#020306"
            emissiveIntensity={0.22}
            metalness={0.12}
            roughness={0.34}
            clearcoat={0.7}
            clearcoatRoughness={0.2}
          />
        </mesh>

        <mesh position={[0, 0, 0.98]}>
          <primitive object={asciiSurface} attach="geometry" />
          <meshBasicMaterial
            map={asset.texture}
            transparent
            alphaTest={0.02}
            depthWrite={false}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>

        <mesh scale={[1.76, 1.5, 1.41]}>
          <sphereGeometry args={[1, 128, 96]} />
          <meshPhysicalMaterial
            color="#dce9ff"
            transparent
            opacity={0.06}
            roughness={0.08}
            metalness={0.05}
            clearcoat={1}
            clearcoatRoughness={0.06}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  )
}
