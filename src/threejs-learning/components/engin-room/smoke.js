import particleFire from './fire/three-particle-fire';
import SPE from './particleEngine/spe';
import * as Three from "three";
import { DoubleSide } from 'three';

export const genSmoke = (camera) => {
  const particleGroup = new SPE.Group({ 
    texture: { 
      value: new Three.TextureLoader().load( require('./images/smokeparticle.png').default ) 
    }, 
    blending: Three.NormalBlending 
  }); 

  const emitter = new SPE.Emitter({ 
    maxAge: { value: 12 }, 
    position: { 
      value: new Three.Vector3(0, 0, 0), 
      spread: new Three.Vector3(1, 0, 2), 
    }, 
    size: { 
      value: [ 2, 8 ], 
      spread: [ 0, 1, 2] 
    }, 
    acceleration: { 
      value: new Three.Vector3(0, 0, 0), 
    }, 
    rotation: { 
      axis: new Three.Vector3(0, 1, 0), 
      spread: new Three.Vector3(0, 20, 0), 
      angle: 100 * Math.PI/180, 
    }, 
    velocity: { 
      value: new Three.Vector3(0, 1, 0), 
      spread: new Three.Vector3(0.25, 0.1, 0.25) 
    }, 
    opacity: { 
      value: [ 0.2, 0.5, 0 ] 
    }, 
    color: { 
      value: [ new Three.Color(0x333333), new Three.Color(0x111111) ], 
      spread: [ new Three.Vector3(0.2, 0.1, 0.1), new Three.Vector3(0, 0, 0) ] 
    }, 
    particleCount: 600, 
  }); 

  particleGroup.addEmitter( emitter );

  particleFire.install( { THREE: Three } );
  const fireRadius = 0.2;
  const fireHeight = 6;
  const particleCount = 25;

  const geometry = new particleFire.Geometry( fireRadius, fireHeight, particleCount );
  const material = new particleFire.Material();
  material.setPerspective( camera.fov, window.innerHeight );
  const particleFireMesh = new Three.Points( geometry, material );

  


  return {particleGroup, particleFireMesh}
};

export const genArrow = () => {
  const points = [
    {
      x:0,
      z:Math.sqrt(3)/2
    },
    {
      x:1/2,
      z:0
    },
    {
      x:-1/2,
      z:0
    }
  ];
  const pointSmall = [
    {
      x:0,
      z:7*Math.sqrt(3)/18
    },
    {
      x:1/3,
      z:Math.sqrt(3)/18
    },
    {
      x:-1/3,
      z:Math.sqrt(3)/18
    }
  ];

  const shape = new Three.Shape();
  points.forEach((point, index)=>{
    if (index===0) {
      shape.moveTo(point.x, point.z) //移动到某个点
    } else {
      shape.lineTo(point.x, point.z)
    }
  });

  const holes = new Three.Shape();
  pointSmall.forEach((point, index)=>{
    if (index===0) {
      holes.moveTo(point.x, point.z) //移动到某个点
    } else {
      holes.lineTo(point.x, point.z)
    }
  });

  shape.holes.push(holes)


  const wireGeometry = new Three.ExtrudeGeometry( shape, {
    depth:0.05,
    curveSegments: 1,
    bevelEnabled: false
  });
  const m = new Three.MeshBasicMaterial({color: '#fdff72'})

  const mesh = new Three.Mesh(wireGeometry,m);
  mesh.rotateZ(Math.PI);
  mesh.scale.set(2,2,2)

  return mesh;
};

