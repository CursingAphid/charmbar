'use client';

import { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

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
function Model({ path, color, spin, isDragging }: { path: string; color: string; spin: boolean; isDragging: boolean }) {
  const { scene } = useGLTF(path);
  const meshRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (scene) {
      // Center the model
      const box = new THREE.Box3().setFromObject(scene);
      const center = box.getCenter(new THREE.Vector3());
      scene.position.x += (scene.position.x - center.x);
      scene.position.y += (scene.position.y - center.y);
      scene.position.z += (scene.position.z - center.z);
    }
  }, [scene]);

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

  // Use useEffect to handle global pointer up for when dragging ends outside the element
  useEffect(() => {
    if (isDragging) {
      const handleGlobalUp = () => {
        setIsDragging(false);
        onInteractionChange?.(false);
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/571757a8-8a49-401c-b0dc-95cc19c6385f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'C',location:'components/Charm3DIcon.tsx:globalUp',message:'Global pointerup (end drag)',data:{cameraZ},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        
        // Reset to initial position
        if (controlsRef.current && cameraRef.current) {
          cameraRef.current.position.set(0, 0, cameraZ);
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        }
      };

      const handleGlobalCancel = () => {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/571757a8-8a49-401c-b0dc-95cc19c6385f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'E',location:'components/Charm3DIcon.tsx:globalCancel',message:'Global pointercancel',data:{cameraZ},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
      };

      window.addEventListener('pointerup', handleGlobalUp);
      window.addEventListener('pointercancel', handleGlobalCancel);
      return () => {
        window.removeEventListener('pointerup', handleGlobalUp);
        window.removeEventListener('pointercancel', handleGlobalCancel);
      };
    }
  }, [isDragging, onInteractionChange, cameraZ]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    onInteractionChange?.(true);
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/571757a8-8a49-401c-b0dc-95cc19c6385f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'C',location:'components/Charm3DIcon.tsx:pointerdown',message:'Pointer down',data:{glbPath:!!glbPath,isDragging:true},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  };

  return (
    <div 
      className="w-full h-full"
      onPointerDown={handlePointerDown}
    >
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
              <Model path={glbPath} color={color} spin={spin} isDragging={isDragging} />
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
              // #region agent log
              fetch('http://127.0.0.1:7243/ingest/571757a8-8a49-401c-b0dc-95cc19c6385f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'D',location:'components/Charm3DIcon.tsx:controlsStart',message:'OrbitControls start',data:{},timestamp:Date.now()})}).catch(()=>{});
              // #endregion
            }}
            onEnd={() => {
              // #region agent log
              fetch('http://127.0.0.1:7243/ingest/571757a8-8a49-401c-b0dc-95cc19c6385f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'D',location:'components/Charm3DIcon.tsx:controlsEnd',message:'OrbitControls end',data:{},timestamp:Date.now()})}).catch(()=>{});
              // #endregion
            }}
          />
          <Environment preset="sunset" />
        </Suspense>
      </Canvas>
    </div>
  );
}

