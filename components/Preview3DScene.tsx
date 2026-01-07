'use client';

import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { Charm } from '@/lib/db';

interface Preview3DSceneProps {
  selectedCharms: Array<{ charm: Charm; quantity: number }>;
  braceletColor?: 'gold' | 'silver';
}

// Simple 3D icon component
function Icon3D({ iconName, color }: { iconName: string; color: string }) {
  switch (iconName) {
    case 'Heart':
      return (
        <mesh>
          <torusGeometry args={[0.3, 0.1, 8, 16]} />
          <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
        </mesh>
      );
    case 'Snowflake':
      return (
        <group>
          {Array.from({ length: 6 }).map((_, i) => {
            const angle = (i / 6) * Math.PI * 2;
            return (
              <mesh key={i} rotation={[0, 0, angle]}>
                <cylinderGeometry args={[0.03, 0.03, 0.6, 8]} />
                <meshStandardMaterial color={color} />
              </mesh>
            );
          })}
        </group>
      );
    case 'Tree':
      return (
        <group>
          <mesh position={[0, -0.2, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.2, 8]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0, 0.05, 0]}>
            <coneGeometry args={[0.2, 0.25, 8]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </group>
      );
    case 'Star':
      return (
        <mesh>
          <octahedronGeometry args={[0.25, 0]} />
          <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
        </mesh>
      );
    default:
      return (
        <mesh>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
        </mesh>
      );
  }
}

// Rotating chain component
function Chain({ color = 'gold' }: { color?: 'gold' | 'silver' }) {
  const chainRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (chainRef.current) {
      chainRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  const chainColor = color === 'gold' ? '#fbbf24' : '#c0c0c0';

  return (
    <group ref={chainRef}>
      {/* Chain links - simplified representation */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const radius = 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        return (
          <mesh key={i} position={[x, 0, z]} rotation={[0, angle, 0]}>
            <torusGeometry args={[0.1, 0.05, 8, 16]} />
            <meshStandardMaterial color={chainColor} metalness={0.8} roughness={0.2} />
          </mesh>
        );
      })}
    </group>
  );
}

// Charm component positioned on chain
function CharmOnChain({ 
  charm, 
  position, 
  index 
}: { 
  charm: Charm; 
  position: [number, number, number];
  index: number;
}) {
  const charmRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (charmRef.current) {
      // Gentle floating animation
      charmRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + index) * 0.1;
      charmRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
  });

  const iconName = charm.icon3d || 'Heart';

  return (
    <group ref={charmRef} position={position}>
      <Icon3D iconName={iconName} color="#ec4899" />
    </group>
  );
}

export default function Preview3DScene({ 
  selectedCharms, 
  braceletColor = 'gold' 
}: Preview3DSceneProps) {
  // Calculate positions for charms around the chain
  const charmPositions: Array<[number, number, number]> = [];
  let charmIndex = 0;

  selectedCharms.forEach((selectedCharm) => {
    for (let i = 0; i < selectedCharm.quantity; i++) {
      const angle = (charmIndex / Math.max(selectedCharms.reduce((sum, sc) => sum + sc.quantity, 0), 1)) * Math.PI * 2;
      const radius = 2.2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      charmPositions.push([x, 0.3, z]);
      charmIndex++;
    }
  });

  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 2, 6], fov: 50 }}>
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <pointLight position={[-10, -10, -5]} intensity={0.5} />
          <spotLight position={[0, 10, 0]} angle={0.3} penumbra={1} intensity={1} />

          {/* Chain */}
          <Chain color={braceletColor} />

          {/* Charms on chain */}
          {selectedCharms.map((selectedCharm, itemIndex) => {
            let positionIndex = 0;
            for (let i = 0; i < itemIndex; i++) {
              positionIndex += selectedCharms[i].quantity;
            }

            return Array.from({ length: selectedCharm.quantity }).map((_, instanceIndex) => {
              const currentIndex = positionIndex + instanceIndex;
              const position = charmPositions[currentIndex];
              
              if (!position) return null;

              return (
                <CharmOnChain
                  key={`${selectedCharm.charm.id}-${instanceIndex}`}
                  charm={selectedCharm.charm}
                  position={position}
                  index={currentIndex}
                />
              );
            });
          })}

          {/* Controls */}
          <OrbitControls
            enableZoom={true}
            enablePan={false}
            minDistance={4}
            maxDistance={10}
            autoRotate={true}
            autoRotateSpeed={1}
          />

          {/* Environment */}
          <Environment preset="sunset" />
        </Suspense>
      </Canvas>
    </div>
  );
}

