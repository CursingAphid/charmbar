'use client';

import { Suspense, useRef, useState, useEffect, useMemo, useCallback } from 'react';
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
  const groupRef = useRef<THREE.Group>(null);
  const frozenRotationRef = useRef<number | null>(null);
  const onLoadRef = useRef(onLoad);

  useEffect(() => {
    onLoadRef.current = onLoad;
  }, [onLoad]);

  // Clone the cached GLTF scene per instance so we don't mutate the shared cache (prevents jumps on re-render)
  const clonedScene = useMemo(() => {
    // Deep clone: isolates position/rotation changes from other instances and from StrictMode double-effects
    return scene.clone(true);
  }, [scene]);

  useEffect(() => {
    if (clonedScene && groupRef.current) {
      // Center the model by adjusting a wrapper group (do NOT mutate the cached scene)
      const box = new THREE.Box3().setFromObject(clonedScene);
      const center = box.getCenter(new THREE.Vector3());
      groupRef.current.position.set(-center.x, -center.y, -center.z);
      // Call onLoad when the model is ready
      onLoadRef.current?.();
    }
  }, [clonedScene, path]);

  useFrame((state) => {
    if (groupRef.current) {
      if (spin && !isDragging) {
        // Continue/update spinning
        groupRef.current.rotation.y = state.clock.elapsedTime * 0.5;
        frozenRotationRef.current = null; // Clear frozen rotation
      } else if (spin && isDragging) {
        // Freeze rotation at current position during drag
        if (frozenRotationRef.current === null) {
          frozenRotationRef.current = groupRef.current.rotation.y;
        }
        groupRef.current.rotation.y = frozenRotationRef.current;
      }
      // If not spinning at all, do nothing
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} />
    </group>
  );
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
  const frozenRotationRef = useRef<number | null>(null);

  useFrame((state) => {
    if (meshRef.current) {
      if (spin && !isDragging) {
        // Continue/update spinning
        meshRef.current.rotation.y = initialRotation.current + state.clock.elapsedTime * rotationSpeed.current * 0.5;
        frozenRotationRef.current = null; // Clear frozen rotation
      } else if (spin && isDragging) {
        // Freeze rotation at current position during drag
        if (frozenRotationRef.current === null) {
          frozenRotationRef.current = meshRef.current.rotation.y;
        }
        meshRef.current.rotation.y = frozenRotationRef.current;
      }
      // If not spinning at all, do nothing
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
  const handleModelLoaded = useCallback(() => setIsLoaded(true), []);

  const dragStartRef = useRef<{
    cam: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number };
    didMove: boolean;
    lastChangeLogTs: number;
  } | null>(null);

  const endDrag = () => {
    setIsDragging(false);
    onInteractionChange?.(false);

    const didMove = dragStartRef.current?.didMove ?? false;

    // Only reset camera position if the user actually moved the controls (not just clicked)
    if (didMove && controlsRef.current && cameraRef.current) {
      // Smooth transition back to initial position
      cameraRef.current.position.set(0, 0, cameraZ);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }

    dragStartRef.current = null;
  };

  // Use useEffect to handle global pointer up for when dragging ends outside the element
  useEffect(() => {
    if (isDragging) {
      const handleGlobalUp = () => {
        endDrag();
      };

      window.addEventListener('pointerup', handleGlobalUp);
      return () => {
        window.removeEventListener('pointerup', handleGlobalUp);
      };
    }
  }, [isDragging, cameraZ]); // endDrag closes over latest cameraZ


  return (
    <div
      className="w-full h-full relative"
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
              <Model path={glbPath} color={color} spin={spin} isDragging={isDragging} onLoad={handleModelLoaded} />
            ) : (
              <Icon3D iconName={iconName} color={color} spin={spin} isDragging={isDragging} />
            )}
          </group>
          <OrbitControls
            ref={controlsRef}
            enableZoom={false}
            enablePan={false}
            autoRotate={false}
            onStart={() => {
              setIsDragging(true);
              // Record start pose; we only count as "interaction" if we actually move
              if (cameraRef.current && controlsRef.current) {
                dragStartRef.current = {
                  cam: { x: cameraRef.current.position.x, y: cameraRef.current.position.y, z: cameraRef.current.position.z },
                  target: { x: controlsRef.current.target.x, y: controlsRef.current.target.y, z: controlsRef.current.target.z },
                  didMove: false,
                  lastChangeLogTs: 0,
                };
              }
              onInteractionChange?.(true);
            }}
            onChange={() => {
              const s = dragStartRef.current;
              const cam = cameraRef.current;
              const ctl = controlsRef.current;
              if (!s || !cam || !ctl) return;

              const moved =
                Math.abs(cam.position.x - s.cam.x) > 0.02 ||
                Math.abs(cam.position.y - s.cam.y) > 0.02 ||
                Math.abs(cam.position.z - s.cam.z) > 0.02 ||
                Math.abs(ctl.target.x - s.target.x) > 0.02 ||
                Math.abs(ctl.target.y - s.target.y) > 0.02 ||
                Math.abs(ctl.target.z - s.target.z) > 0.02;

              if (moved && !s.didMove) {
                s.didMove = true;
              }
            }}
            onEnd={() => {
              endDrag();
            }}
          />
          <Environment preset="sunset" />
        </Suspense>
      </Canvas>
    </div>
  );
}

