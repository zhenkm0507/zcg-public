// 'use client';

// import { Canvas } from '@react-three/fiber';
// import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

// function Scene() {
//   return (
//     <>
//       <PerspectiveCamera makeDefault position={[0, 0, 5]} />
//       <OrbitControls enableZoom={false} enablePan={false} />
//       <ambientLight intensity={0.5} />
//       <directionalLight position={[10, 10, 5]} intensity={1} />
//       <mesh>
//         <boxGeometry args={[1, 1, 1]} />
//         <meshStandardMaterial color="#8B4513" />
//       </mesh>
//     </>
//   );
// }

export default function Background() {
  return (
    <div className="fixed inset-0 -z-10">
      {/* <Canvas>
        <Scene />
      </Canvas> */}
    </div>
  );
} 