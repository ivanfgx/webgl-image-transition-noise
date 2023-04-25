import * as THREE from 'three'
// React Three Fiber
import { extend } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import glsl from 'glslify'
// Shaders

const TransitionShaderMaterial = shaderMaterial(
  // Uniforms
  {
    uProgress: 0,
    uTexture1: new THREE.Texture(),
    uTexture2: new THREE.Texture(),
    uFrequency: 2, // Frequency for the wavy effect
    uAmplitude: 1 // Amplitude for the wavy effect
  },
  glsl`
    precision mediump float;

    varying vec2 vUv;
    uniform float uTime; 

    void main()
    {
      vUv = uv;

      vec4 modelPosition = modelMatrix * vec4(position, 1.0);
      vec4 viewPosition = viewMatrix * modelPosition;
      vec4 projectedPosition = projectionMatrix * viewPosition;

      gl_Position = projectedPosition;
    }
  `,
  glsl`
    //
    // Description : Array and textureless GLSL 2D simplex noise function.
    //      Author : Ian McEwan, Ashima Arts.
    //  Maintainer : ijm
    //     Lastmod : 20110822 (ijm)
    //     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
    //               Distributed under the MIT License. See LICENSE file.
    //               https://github.com/ashima/webgl-noise
    //
    
    vec3 mod289(vec3 x) {
      return x - floor(x * (1.0 / 289.0)) * 289.0;
    }
    
    vec2 mod289(vec2 x) {
      return x - floor(x * (1.0 / 289.0)) * 289.0;
    }
    
    vec3 permute(vec3 x) {
      return mod289(((x*34.0)+1.0)*x);
    }
    
    float snoise(vec2 v)
      {
      const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                          0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                        -0.577350269189626,  // -1.0 + 2.0 * C.x
                          0.024390243902439); // 1.0 / 41.0
    // First corner
      vec2 i  = floor(v + dot(v, C.yy) );
      vec2 x0 = v -   i + dot(i, C.xx);
    
    // Other corners
      vec2 i1;
      //i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0
      //i1.y = 1.0 - i1.x;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      // x0 = x0 - 0.0 + 0.0 * C.xx ;
      // x1 = x0 - i1 + 1.0 * C.xx ;
      // x2 = x0 - 1.0 + 2.0 * C.xx ;
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
    
    // Permutations
      i = mod289(i); // Avoid truncation effects in permutation
      vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));
    
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m ;
      m = m*m ;
    
    // Gradients: 41 points uniformly over a line, mapped onto a diamond.
    // The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)
    
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
    
    // Normalise gradients implicitly by scaling m
    // Approximation of: m *= inversesqrt( a0*a0 + h*h );
      m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    
    // Compute final noise value at P
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    //
    // Utilities

    vec3 blendMultiply(vec3 base, vec3 blend) {
      return base*blend;
    }
    vec3 blendMultiply(vec3 base, vec3 blend, float opacity) {
      return (blendMultiply(base, blend) * opacity + base * (1.0 - opacity));
    }
    float cubicOut(float t) {
      float f = t - 1.0;
      return f * f * f + 1.0;
    }
    float invLerp(float from, float to, float value){
      return (value - from) / (to - from);
    }
    float remap(float origFrom, float origTo, float targetFrom, float targetTo, float value){
      float rel = invLerp(origFrom, origTo, value);
      return mix(targetFrom, targetTo, rel);
    }
    
    //
    // Main

    precision mediump float;
    uniform sampler2D uTexture1;
    uniform sampler2D uTexture2;
    uniform float uProgress;
    varying vec2 vUv;

    // noise config
    float noiseMax = 0.9;
    float noiseFrequency = 2.1;
    float noiseAmplitude = 0.2;

    void main() {

      // brand color - rgb(90.0, 50, 255)
      vec3 u_color = vec3(0.35, 0.2, 1.0);

      // min and max opacity for multiply blend with background
      float blendMin = 0.15;
      float blendMax = 0.6;

      // noise transforms
      float noise = snoise(vUv * noiseFrequency) * noiseAmplitude;
      float noiseProgress = uProgress * noise;
      float noise1 = noise * mix(0.0, noiseMax, uProgress);
      float noise2 = noise * mix(noiseMax, 0.0, uProgress);

      // translations transform
      float translateY1 = mix(0.0, 1.0, uProgress);
      float translateY2 = mix(-1.0, 0.0, uProgress);

      // apply transforms
      vec2 uv1 = vUv + vec2(noise1, noise1 + translateY1);
      vec2 uv2 = vUv + vec2(noise2, noise2 + translateY2);
      vec3 img1 = texture2D(uTexture1, uv1).rgb;
      vec3 img2 = texture2D(uTexture2, uv2).rgb;

      // blend with solid background
      vec3 blend1 = blendMultiply(
        u_color,
        img1,
        remap(0.0, 0.5, blendMax, blendMin, uProgress)
      );
      vec3 blend2 = blendMultiply(
        u_color,
        img2,
        remap(0.5, 1.0, blendMin, blendMax, uProgress)
      );
      vec3 imageBlend = mix(blend1, blend2, step(0.5, uProgress));

      // voilà
      gl_FragColor = vec4(imageBlend, 1.0);
    }
  `
)

extend({
  TransitionShaderMaterial
})

export default TransitionShaderMaterial
