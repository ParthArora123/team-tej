import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import * as THREE from "three";

function Shape({ position, color, speed, scale, geometry }: {
  position: [number, number, number];
  color: string;
  speed: number;
  scale: number;
  geometry: "ico" | "torus" | "sphere";
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const m = ref.current;
    if (!m) return;
    m.rotation.x = t * 0.15 * speed;
    m.rotation.y = t * 0.2 * speed;
    m.position.y = position[1] + Math.sin(t * 0.6 * speed) * 0.35;
    m.position.x = position[0] + Math.cos(t * 0.4 * speed) * 0.25;
  });
  const geo = useMemo(() => {
    if (geometry === "ico") return new THREE.IcosahedronGeometry(1, 0);
    if (geometry === "torus") return new THREE.TorusGeometry(0.7, 0.22, 16, 48);
    return new THREE.SphereGeometry(1, 32, 32);
  }, [geometry]);
  return (
    <mesh ref={ref} position={position} scale={scale}>
      <primitive object={geo} attach="geometry" />
      <meshStandardMaterial
        color={color}
        roughness={0.35}
        metalness={0.55}
        emissive={color}
        emissiveIntensity={0.15}
        transparent
        opacity={0.75}
      />
    </mesh>
  );
}

export default function Scene() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 8], fov: 45 }}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      frameloop="always"
    >
      <ambientLight intensity={0.4} />
      <pointLight position={[6, 4, 6]} intensity={1.2} color="#ffb46b" />
      <pointLight position={[-6, -3, 4]} intensity={0.8} color="#7a3bff" />
      <Shape position={[-4.2, 1.6, -1]} color="#ffb46b" speed={0.9} scale={0.8} geometry="ico" />
      <Shape position={[4.5, -1.2, -2]} color="#ff7a3b" speed={0.7} scale={0.6} geometry="torus" />
      <Shape position={[0, 2.4, -4]}    color="#7a3bff" speed={0.5} scale={0.5} geometry="sphere" />
      <Shape position={[-2.5, -2.2, -3]} color="#ffd28c" speed={0.6} scale={0.4} geometry="ico" />
    </Canvas>
  );
}
