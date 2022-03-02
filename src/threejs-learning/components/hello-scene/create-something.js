import { Mesh, MeshPhongMaterial, Object3D, PointLight, SphereBufferGeometry } from "three";

//创建一个球体
const sphere = new SphereBufferGeometry(1, 6, 6) //球体为6边形，目的是为了方便我们观察到他在自转

//创建太阳
const sunMaterial = new MeshPhongMaterial({emissive: 0xFFFF00 });
export const sunMesh = new Mesh(sphere, sunMaterial);
sunMesh.scale.set(4, 4, 4) //将球体尺寸放大 4 倍

//创建地球
const earthMaterial = new MeshPhongMaterial({color: 0x2233FF, emissive: 0x112244});
export const earthMesh = new Mesh(sphere, earthMaterial);

//创建月球
const moonMaterial = new MeshPhongMaterial({color: 0x888888, emissive: 0x222222});
export const moonMesh = new Mesh(sphere, moonMaterial);
moonMesh.scale.set(0.5, 0.5, 0.5) 
moonMesh.position.x = 2;

//创建光源
export const pointLight = new PointLight(0xFFFFFF, 3);

//创建地球空间 容纳地球和月球
export const earthOrbit  = new Object3D();
earthOrbit.add(earthMesh);
earthOrbit.add(moonMesh);
earthOrbit.position.x = 10;

//创建3d空间容纳太阳和地球(含月球)
export const solarSystem = new Object3D();
solarSystem.add(sunMesh);
solarSystem.add(earthOrbit);

