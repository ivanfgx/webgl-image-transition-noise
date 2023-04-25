import react, { useRef, Suspense, useState, useEffect } from 'react'
// Gsap
import gsap from 'gsap'
// R3F and Drei
import { Canvas, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
// Shaders
import TransitionShaderMaterial from './Shaders/TransitionShader.js'
// Assets
import cakes from './Assets/cakes.jpg'
import canap from './Assets/canap.jpg'
import eliott from './Assets/eliott.jpg'
const images = [canap, eliott, cakes]

function Scene({ image }) {
  const { viewport } = useThree()
  const texture = useTexture(image)
  const shaderMaterialRef = useRef()
  const lastTexture = useRef()
  const lastTween = useRef()

  useEffect(() => {
    const duration = 0.9
    const lastTextClosure = lastTexture.current
    const progressClosure = shaderMaterialRef.current.uProgress
    const animation = {
      uProgress: 1.0,
      duration,
      onStart: () => {
        shaderMaterialRef.current.uTexture1 = lastTextClosure
        shaderMaterialRef.current.uTexture2 = texture
      },
      onComplete: () => {
        shaderMaterialRef.current.uTexture1 = texture
        shaderMaterialRef.current.uProgress = 0.0
      },
      ease: 'circ.inOut'
    }

    // If previous tween running, go to 0.5 and run from start
    if (lastTween.current && lastTween.current.isActive()) {
      lastTween.current.kill()
      lastTween.current = gsap
        .timeline()
        .to(shaderMaterialRef.current, {
          uProgress: 0.5,
          duration: (progressClosure - 0.5) * (duration / 2),
          ease: 'circ.in'
        })
        .to(shaderMaterialRef.current, animation)
    } else {
      lastTween.current = gsap.to(shaderMaterialRef.current, animation)
    }

    // always update texture
    lastTexture.current = texture
  }, [texture])

  return (
    <sprite scale={[viewport.width / 2, viewport.width / 2, 0]}>
      <transitionShaderMaterial ref={shaderMaterialRef} attach="material" />
    </sprite>
  )
}

export default function App() {
  const [current, setCurrent] = useState(0)

  const move = (distance) => {
    setCurrent((x) => (images.length + x + distance) % images.length)
  }

  return (
    <div className="App">
      <Canvas>
        <Suspense fallback={null}>
          <Scene image={images[current]} />
        </Suspense>
      </Canvas>
      <button onClick={() => move(1)}>heeeeeeey {current}</button>
    </div>
  )
}
