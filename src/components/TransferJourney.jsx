import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function FloatingFile({ position, color, delay, isPaused }) {
  const fileRef = useRef(null);

  useFrame(({ clock }) => {
    if (!fileRef.current) return;
    if (isPaused) return;
    const time = clock.elapsedTime + delay;
    fileRef.current.position.y = position[1] + Math.sin(time * 1.8) * 0.12;
    fileRef.current.rotation.y = Math.sin(time) * 0.18;
    fileRef.current.rotation.z = Math.cos(time * 0.7) * 0.05;
  });

  return (
    <group ref={fileRef} position={position}>
      <mesh castShadow>
        <boxGeometry args={[0.38, 0.5, 0.07]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.08} />
      </mesh>
      {[0.1, 0, -0.1].map((y) => (
        <mesh key={y} position={[0, y, 0.041]}>
          <planeGeometry args={[0.22, 0.025]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}
    </group>
  );
}

function GlowingParticle({ position, color, delay, isPaused }) {
  const particleRef = useRef(null);

  useFrame(({ clock }) => {
    if (!particleRef.current) return;
    if (isPaused) return;
    const pulse = 0.7 + Math.sin(clock.elapsedTime * 2.5 + delay) * 0.3;
    particleRef.current.scale.setScalar(pulse);
    particleRef.current.position.y = position[1] + Math.sin(clock.elapsedTime + delay) * 0.08;
  });

  return (
    <mesh ref={particleRef} position={position}>
      <sphereGeometry args={[0.035, 8, 8]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

function Road() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.12, 0]} receiveShadow>
        <planeGeometry args={[12, 7]} />
        <meshStandardMaterial color="#e7f2fc" roughness={0.95} />
      </mesh>
      <mesh position={[0, -0.035, 0.1]} receiveShadow>
        <boxGeometry args={[10, 0.12, 1.45]} />
        <meshStandardMaterial color="#61778b" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.028, 0.1]}>
        <boxGeometry args={[9.9, 0.012, 0.035]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {Array.from({ length: 10 }, (_, index) => (
        <mesh key={index} position={[-4.5 + index, 0.03, 0.1]}>
          <boxGeometry args={[0.42, 0.015, 0.045]} />
          <meshBasicMaterial color="#f4d57a" />
        </mesh>
      ))}
      <mesh position={[0, 0.015, 0.9]}>
        <boxGeometry args={[10, 0.04, 0.16]} />
        <meshStandardMaterial color="#b4d7ed" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Background({ isPaused }) {
  const cloudRefs = useRef([]);

  useFrame((_, delta) => {
    if (isPaused) return;
    cloudRefs.current.forEach((cloud, index) => {
      if (!cloud) return;
      cloud.position.x += delta * (index % 2 ? 0.025 : -0.018);
      if (cloud.position.x > 4.5) cloud.position.x = -4.5;
      if (cloud.position.x < -4.5) cloud.position.x = 4.5;
    });
  });

  return (
    <group>
      {[-3.4, -2.35, 2.7, 3.65].map((x, index) => (
        <group key={x} position={[x, 0, -1.6]}>
          <mesh position={[0, 0.55 + (index % 2) * 0.18, 0]}>
            <boxGeometry args={[0.6, 1.1 + (index % 2) * 0.35, 0.28]} />
            <meshStandardMaterial color={index % 2 ? '#c8e1f3' : '#d4e8f6'} roughness={0.95} />
          </mesh>
          {[0, 1, 2].map((window) => (
            <mesh key={window} position={[-0.13 + (window % 2) * 0.26, 0.52 + Math.floor(window / 2) * 0.3, 0.15]}>
              <planeGeometry args={[0.07, 0.1]} />
              <meshBasicMaterial color="#f8fcff" />
            </mesh>
          ))}
        </group>
      ))}
      {[-2.8, 3.15].map((x) => (
        <group key={x} position={[x, 0, -0.9]}>
          <mesh position={[0, 0.38, 0]}>
            <cylinderGeometry args={[0.055, 0.075, 0.75, 8]} />
            <meshStandardMaterial color="#8c694d" />
          </mesh>
          <mesh position={[0, 0.95, 0]}>
            <sphereGeometry args={[0.42, 12, 10]} />
            <meshStandardMaterial color="#76bd9b" roughness={0.9} />
          </mesh>
          <mesh position={[-0.2, 0.82, 0.12]}>
            <sphereGeometry args={[0.28, 12, 10]} />
            <meshStandardMaterial color="#8acbaa" roughness={0.9} />
          </mesh>
        </group>
      ))}
      {[-2.2, 0.2, 2.4].map((x, index) => (
        <group
          key={x}
          ref={(element) => { cloudRefs.current[index] = element; }}
          position={[x, 2.45 + (index % 2) * 0.25, -2.2]}
        >
          <mesh>
            <sphereGeometry args={[0.31, 12, 10]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0.27, -0.06, 0]}>
            <sphereGeometry args={[0.22, 12, 10]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[-0.24, -0.08, 0]}>
            <sphereGeometry args={[0.2, 12, 10]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Motorcycle({ wheelsRef, moving }) {
  return (
    <group position={[0, 0.08, 0.08]}>
      {[-0.55, 0.55].map((x, index) => (
        <group
          key={x}
          ref={(element) => { wheelsRef.current[index] = element; }}
          position={[x, 0.27, 0]}
        >
          <mesh>
            <torusGeometry args={[0.22, 0.055, 12, 28]} />
            <meshStandardMaterial color="#202b38" roughness={0.78} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.105, 0.105, 0.14, 18]} />
            <meshStandardMaterial color="#aec6d9" metalness={0.72} roughness={0.28} />
          </mesh>
          <mesh position={[0, 0, 0.075]}>
            <circleGeometry args={[0.045, 16]} />
            <meshBasicMaterial color="#3e617d" />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.49, 0]} rotation={[0, 0, Math.PI / 2 - 0.2]}>
        <capsuleGeometry args={[0.07, 0.72, 4, 8]} />
        <meshStandardMaterial color="#0878d5" metalness={0.35} roughness={0.32} />
      </mesh>
      <mesh position={[-0.28, 0.45, 0.015]} rotation={[0, 0, -0.65]}>
        <cylinderGeometry args={[0.035, 0.035, 0.48, 8]} />
        <meshStandardMaterial color="#8199ad" metalness={0.8} roughness={0.25} />
      </mesh>
      <mesh position={[0.34, 0.52, 0.015]} rotation={[0, 0, 0.35]}>
        <cylinderGeometry args={[0.035, 0.035, 0.42, 8]} />
        <meshStandardMaterial color="#8199ad" metalness={0.8} roughness={0.25} />
      </mesh>
      <mesh position={[-0.08, 0.69, 0]}>
        <boxGeometry args={[0.38, 0.1, 0.24]} />
        <meshStandardMaterial color="#182c40" roughness={0.5} />
      </mesh>
      <mesh position={[0.1, 0.62, 0.03]} scale={[1, 0.65, 0.8]}>
        <sphereGeometry args={[0.19, 16, 12]} />
        <meshStandardMaterial color="#0b70c3" metalness={0.28} roughness={0.3} />
      </mesh>
      <mesh position={[0.5, 0.87, 0.035]}>
        <sphereGeometry args={[0.075, 12, 10]} />
        <meshStandardMaterial color="#fff4c2" emissive="#ffc957" emissiveIntensity={moving ? 1.4 : 0.5} />
      </mesh>
      <mesh position={[0.56, 0.77, -0.02]} rotation={[0, 0, -0.35]}>
        <cylinderGeometry args={[0.025, 0.025, 0.35, 8]} />
        <meshStandardMaterial color="#9bb4c9" metalness={0.8} />
      </mesh>
      <mesh position={[0.55, 0.94, -0.02]}>
        <boxGeometry args={[0.34, 0.035, 0.05]} />
        <meshStandardMaterial color="#263d55" metalness={0.5} />
      </mesh>
    </group>
  );
}

function Courier({ stage, progress, isPaused }) {
  const courierRef = useRef(null);
  const bodyRef = useRef(null);
  const wheelsRef = useRef([]);
  const isRiding = stage === 2 && !isPaused;

  useFrame(({ clock }, delta) => {
    if (!courierRef.current) return;
    const travel = stage >= 2 ? THREE.MathUtils.clamp(progress / 100, 0, 1) : 0;
    const targetX = -2.05 + travel * 4.1;
    courierRef.current.position.x = THREE.MathUtils.damp(
      courierRef.current.position.x,
      targetX,
      1.6,
      delta
    );
    const bounce = isRiding ? Math.sin(clock.elapsedTime * 12) * 0.022 : 0;
    courierRef.current.position.y = bounce;
    if (bodyRef.current) {
      bodyRef.current.rotation.z = isRiding ? -0.14 + Math.sin(clock.elapsedTime * 6) * 0.015 : -0.04;
    }
    if (stage >= 2 && !isPaused && stage < 3) {
      wheelsRef.current.forEach((wheel) => {
        if (wheel) wheel.rotation.z -= delta * 9;
      });
    }
  });

  return (
    <group ref={courierRef} position={[-2.05, 0, 0.2]}>
      {stage >= 1 && <Motorcycle wheelsRef={wheelsRef} moving={isRiding} />}
      <mesh position={[-0.08, 0.42, 0.08]}>
        <capsuleGeometry args={[0.09, 0.36, 5, 10]} />
        <meshStandardMaterial color="#26364a" roughness={0.75} />
      </mesh>
      <mesh position={[0.2, 0.45, 0.08]} rotation={[0, 0, -0.55]}>
        <capsuleGeometry args={[0.085, 0.34, 5, 10]} />
        <meshStandardMaterial color="#26364a" roughness={0.75} />
      </mesh>
      <mesh position={[-0.05, 1.02, 0]}>
        <boxGeometry args={[0.44, 0.57, 0.3]} />
        <meshStandardMaterial color="#0878d5" roughness={0.52} />
      </mesh>
      <group ref={bodyRef} position={[-0.05, 1.02, 0]}>
        <mesh position={[-0.28, 0.04, 0]} rotation={[0, 0, -0.8]}>
          <capsuleGeometry args={[0.065, 0.34, 4, 8]} />
          <meshStandardMaterial color="#0878d5" />
        </mesh>
        <mesh position={[0.28, 0.02, 0]} rotation={[0, 0, 0.55]}>
          <capsuleGeometry args={[0.065, 0.34, 4, 8]} />
          <meshStandardMaterial color="#0878d5" />
        </mesh>
      </group>
      <mesh position={[-0.34, 1.08, -0.18]}>
        <boxGeometry args={[0.34, 0.48, 0.24]} />
        <meshStandardMaterial color="#075db0" roughness={0.4} metalness={0.12} />
      </mesh>
      <mesh position={[-0.34, 1.08, -0.05]}>
        <boxGeometry args={[0.12, 0.12, 0.015]} />
        <meshBasicMaterial color="#dff5ff" />
      </mesh>
      <mesh position={[0, 1.53, 0.02]}>
        <sphereGeometry args={[0.17, 24, 18]} />
        <meshStandardMaterial color="#d99b78" roughness={0.75} />
      </mesh>
      <mesh position={[0, 1.63, 0.02]}>
        <sphereGeometry args={[0.19, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
        <meshStandardMaterial color="#172b47" roughness={0.38} metalness={0.08} />
      </mesh>
      <mesh position={[0.025, 1.55, 0.175]}>
        <sphereGeometry args={[0.07, 16, 12]} />
        <meshPhysicalMaterial color="#a9e3ff" transparent opacity={0.62} roughness={0.12} metalness={0.15} />
      </mesh>
    </group>
  );
}

function Destination() {
  return (
    <group position={[2.9, 0, -0.45]}>
      <mesh position={[0, 0.62, 0]}>
        <boxGeometry args={[0.8, 1.15, 0.5]} />
        <meshStandardMaterial color="#fffaf0" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.29, 0]}>
        <coneGeometry args={[0.66, 0.52, 4]} />
        <meshStandardMaterial color="#ef8e72" roughness={0.8} />
      </mesh>
      <mesh position={[0.18, 0.45, 0.26]}>
        <boxGeometry args={[0.2, 0.42, 0.025]} />
        <meshStandardMaterial color="#7abbdc" roughness={0.35} />
      </mesh>
      <mesh position={[-0.18, 0.64, 0.26]}>
        <boxGeometry args={[0.18, 0.18, 0.025]} />
        <meshStandardMaterial color="#a8d8ee" roughness={0.35} />
      </mesh>
      <mesh position={[-0.72, 0.2, 0.18]}>
        <cylinderGeometry args={[0.13, 0.16, 0.34, 8]} />
        <meshStandardMaterial color="#ed9a65" roughness={0.7} />
      </mesh>
      <mesh position={[-0.72, 0.39, 0.18]}>
        <boxGeometry args={[0.2, 0.08, 0.28]} />
        <meshStandardMaterial color="#ed9a65" roughness={0.7} />
      </mesh>
      <mesh position={[0.64, 0.63, 0.12]}>
        <sphereGeometry args={[0.16, 16, 12]} />
        <meshStandardMaterial color="#d99b78" roughness={0.75} />
      </mesh>
      <mesh position={[0.64, 0.71, 0.12]}>
        <sphereGeometry args={[0.17, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial color="#5b7591" roughness={0.7} />
      </mesh>
      <mesh position={[0.64, 0.31, 0.12]}>
        <capsuleGeometry args={[0.12, 0.38, 4, 8]} />
        <meshStandardMaterial color="#ed8e69" roughness={0.7} />
      </mesh>
    </group>
  );
}

function MotionLines({ active, isPaused }) {
  const linesRef = useRef([]);

  useFrame((_, delta) => {
    if (!active || isPaused) return;
    linesRef.current.forEach((line) => {
      if (!line) return;
      line.position.x -= delta * 1.2;
      if (line.position.x < -2.5) line.position.x = 2.5;
    });
  });

  return (
    <group>
      {[0, 1, 2, 3].map((index) => (
        <mesh
          key={index}
          ref={(element) => { linesRef.current[index] = element; }}
          position={[1.8 - index * 0.65, 1.1 + (index % 2) * 0.3, 0.3]}
          visible={active}
        >
          <boxGeometry args={[0.34 + (index % 2) * 0.16, 0.018, 0.018]} />
          <meshBasicMaterial color={index % 2 ? '#ffffff' : '#78d1ff'} transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function JourneyScene({ stage, progress, isPaused }) {
  const isRiding = stage === 2 && !isPaused;
  return (
    <>
      <color attach="background" args={['#dff0ff']} />
      <fog attach="fog" args={['#dff0ff', 8, 18]} />
      <ambientLight intensity={1.3} />
      <directionalLight position={[4, 7, 5]} intensity={2} castShadow />
      <pointLight position={[0, 3, 3]} intensity={0.45} color="#c5e8ff" />
      <Background isPaused={isPaused} />
      <Road />
      <Destination />
      {stage < 2 && (
        <>
          <FloatingFile position={[-2.25, 1.85, 0.35]} color="#56b9ff" delay={0} isPaused={isPaused} />
          <FloatingFile position={[-1.65, 2.1, 0.25]} color="#a88cff" delay={1} isPaused={isPaused} />
          <FloatingFile position={[-2.7, 1.35, 0.2]} color="#ffbd65" delay={2} isPaused={isPaused} />
        </>
      )}
      {Array.from({ length: 12 }, (_, index) => (
        <GlowingParticle
          key={index}
          position={[-3.2 + (index % 6) * 1.25, 0.35 + Math.floor(index / 6) * 1.1, -0.15]}
          color={index % 3 === 0 ? '#ffd37a' : '#8dd8ff'}
          delay={index * 0.7}
          isPaused={isPaused}
        />
      ))}
      <MotionLines active={isRiding} isPaused={isPaused} />
      <Courier stage={stage} progress={progress} isPaused={isPaused} />
    </>
  );
}

const stages = [
  'Gathering your files',
  'Packing the delivery',
  'Courier on the move',
  'Safely delivered'
];

export default function TransferJourney({ progress, isCompleted, isPaused }) {
  const stage = isCompleted ? 3 : progress < 3 ? 0 : progress < 15 ? 1 : 2;

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-[#dbeaf6] bg-[#e3f2ff]">
      <div className="h-52 sm:h-60">
        <Canvas
          camera={{ position: [0, 2.65, 8.5], fov: 40 }}
          dpr={[1, 1.5]}
          shadows="soft"
          fallback={<div className="flex h-full items-center justify-center text-sm text-[#475569]">3D preview is unavailable in this browser.</div>}
        >
          <JourneyScene stage={stage} progress={progress} isPaused={isPaused} />
        </Canvas>
      </div>
      <div className="border-t border-[#d5e8f7] bg-white/80 px-4 py-3 text-center" aria-live="polite">
        <p className="text-sm font-bold text-[#145b91]">{isPaused ? 'Courier taking a short break' : stages[stage]}</p>
        <div className="mt-2 flex justify-center gap-1.5" aria-label={`Transfer journey stage ${stage + 1} of 4`}>
          {stages.map((label, index) => (
            <span
              key={label}
              className={`h-1.5 w-8 rounded-full ${index <= stage ? 'bg-[#1684d4]' : 'bg-[#dce7f0]'}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
