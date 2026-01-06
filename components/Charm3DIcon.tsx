'use client';

import { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import LoadingSpinner from './LoadingSpinner';

interface Charm3DIconProps {
  iconName?: string;
  glbPath?: string;
  size?: number;
  color?: string;
  spin?: boolean;
  onInteractionChange?: (isInteracting: boolean) => void;
  cameraZ?: number;
}

// Helper component to handle disposal
function SceneCleanup() {
  const { gl } = useThree();
  useEffect(() => {
    return () => {
      // Force dispose of the WebGL context when the component unmounts
      gl.dispose();
    };
  }, [gl]);
  return null;
}

// Model component for GLB files
function Model({ path, color, spin, isDragging, onLoad }: { path: string; color: string; spin: boolean; isDragging: boolean; onLoad?: () => void }) {
  const { scene } = useGLTF(path);
  const meshRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (scene && meshRef.current) {
      // Center the model by adjusting the mesh position instead of modifying scene
      const box = new THREE.Box3().setFromObject(scene);
      const center = box.getCenter(new THREE.Vector3());
      meshRef.current.position.set(-center.x, -center.y, -center.z);
      // Call onLoad when the model is ready
      onLoad?.();
    }
  }, [scene, onLoad]);

  useFrame((state) => {
    if (meshRef.current && !isDragging) {
      meshRef.current.rotation.y = state.clock.elapsedTime * (spin ? 1 : 0.5);
    }
  });

  return <primitive ref={meshRef} object={scene} />;
}

// Preload common GLB models
useGLTF.preload('/images/charms/heart_with_wings.glb');
useGLTF.preload('/images/charms/tree_in_circle.glb');
useGLTF.preload('/images/charms/half_moon.glb');
useGLTF.preload('/images/charms/golden_ripple_charm.glb');

// Simple 3D icon component using basic geometries
function Icon3D({ iconName, color, spin, isDragging }: { iconName: string; color: string; spin: boolean; isDragging: boolean }) {
  const meshRef = useRef<THREE.Group>(null);
  const initialRotation = useRef(0);
  const rotationSpeed = useRef(1);

  useFrame((state) => {
    if (meshRef.current && !isDragging) {
      // Only rotate when not dragging
      meshRef.current.rotation.y = initialRotation.current + state.clock.elapsedTime * rotationSpeed.current * (spin ? 1 : 0.5);
    }
  });

  switch (iconName) {
    case 'Heart':
      return (
        <group ref={meshRef}>
          <mesh>
            <torusGeometry args={[0.5, 0.2, 8, 16]} />
            <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
          </mesh>
        </group>
      );
    case 'Snowflake':
      return (
        <group ref={meshRef}>
          {Array.from({ length: 6 }).map((_, i) => {
            const angle = (i / 6) * Math.PI * 2;
            return (
              <mesh key={i} rotation={[0, 0, angle]}>
                <cylinderGeometry args={[0.05, 0.05, 1, 8]} />
                <meshStandardMaterial color={color} />
              </mesh>
            );
          })}
        </group>
      );
    case 'Tree':
      return (
        <group ref={meshRef}>
          <mesh position={[0, -0.3, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.3, 8]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0, 0.1, 0]}>
            <coneGeometry args={[0.4, 0.5, 8]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </group>
      );
    case 'Star':
      return (
        <group ref={meshRef}>
          <mesh>
            <octahedronGeometry args={[0.5, 0]} />
            <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
          </mesh>
        </group>
      );
    case 'Moon':
      return (
        <group ref={meshRef}>
          <mesh>
            <sphereGeometry args={[0.4, 16, 16]} />
            <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
          </mesh>
        </group>
      );
    default:
      return (
        <group ref={meshRef}>
          <mesh>
            <sphereGeometry args={[0.4, 16, 16]} />
            <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
          </mesh>
        </group>
      );
  }
}

export default function Charm3DIcon({
  iconName = 'Heart',
  glbPath,
  size = 1,
  color = '#ec4899',
  spin = false,
  onInteractionChange,
  cameraZ = 3
}: Charm3DIconProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoaded, setIsLoaded] = useState(!glbPath); // Initialize as loaded if no glbPath (using Icon3D)

  // Use useEffect to handle global pointer up for when dragging ends outside the element
  useEffect(() => {
    if (isDragging) {
      const handleGlobalUp = () => {
        setIsDragging(false);
        onInteractionChange?.(false);

        // Reset to initial position
        if (controlsRef.current && cameraRef.current) {
          cameraRef.current.position.set(0, 0, cameraZ);
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        }
      };

      window.addEventListener('pointerup', handleGlobalUp);
      return () => {
        window.removeEventListener('pointerup', handleGlobalUp);
      };
    }
  }, [isDragging, onInteractionChange, cameraZ]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    onInteractionChange?.(true);
  };

  return (
    <div
      className="w-full h-full relative"
      onPointerDown={handlePointerDown}
    >
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <LoadingSpinner size="md" color="#ec4899" />
        </div>
      )}
      <Canvas
        camera={{ position: [0, 0, cameraZ], fov: 50 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onCreated={({ camera }) => {
          cameraRef.current = camera as THREE.PerspectiveCamera;
        }}
      >
        <SceneCleanup />
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <pointLight position={[-10, -10, -5]} intensity={0.5} />
          <group scale={size}>
            {glbPath ? (
              <Model path={glbPath} color={color} spin={spin} isDragging={isDragging} onLoad={() => setIsLoaded(true)} />
            ) : (
              <Icon3D iconName={iconName} color={color} spin={spin} isDragging={isDragging} />
            )}
          </group>
          <OrbitControls
            ref={controlsRef}
            enableZoom={false}
            enablePan={false}
            autoRotate={false}
          />
          <Environment preset="sunset" />
        </Suspense>
      </Canvas>
    </div>
  );
}

