import {useEffect, useRef, useState} from 'react';
import * as Three from "three";
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import {ConvexGeometry} from "three/examples/jsm/geometries/ConvexGeometry";
import CANNON from "cannon";
import { GUI } from "three/examples/jsm/libs/dat.gui.module";

const params = {
  positionX: 0,
  positionY: 0,
  speed: 1,
}

const init = (canvas, statsDom) => {
  const renderer = new Three.WebGLRenderer({canvas, antialias: true});
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.setClearColor(0xbfd1e5);

  const scene = new Three.Scene();//step 1 创建场景

  const camera = new Three.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );
  // camera.position.y = 30;
  // camera.position.z = 20;
  camera.position.set(-5.247569869932584,14.276006042065504,33.750735595170084)
  // camera.lookAt(0,5,0);
  scene.add( camera ); //step 2 场景中添加相机

  scene.add(new Three.AmbientLight(0x888888));
  const light = new Three.DirectionalLight(0xbbbbbb, 1);
  light.position.set(6, 30, 6);

  scene.add(light); //step 3 场景中添加另种光源

  let stats;
  if (statsDom) {
    stats = new Stats();
    statsDom.appendChild(stats.dom);
  }

  const orbitControls = new OrbitControls(camera, canvas);
  orbitControls.target.set(2.950003487705769,6.7018777256986475,-0.5338436102589367);
  orbitControls.update();

  const axesHelper = new Three.AxesHelper( 20 );
  scene.add( axesHelper );

  return {renderer, camera, scene, stats,orbitControls}
};

const initGui = (middleAxis1Body,smallAxisBody,middleAxis3Body,bigAxisBody) => {
  const gui = new GUI();
  gui.add(params, "positionX", -1, 0).onChange(e => {
    middleAxis1Body.position.x = -8.5 + e;
  })
  gui.add(params, "positionY", -8, 13).onChange(e => {
    smallAxisBody.position.y = 8 + e;
    middleAxis3Body.position.y =  e;
    bigAxisBody.position.y = -13 + e;
  })
  gui.add(params, "speed", -5, 5)
};

//逐帧根据物理引擎的数据渲染three场景
const updatePhysics = (world,scene) => {
  world.step(1/60); //第一个参数是以固定步长更新物理世界参数
  scene.children.forEach(d => {//遍历场景中的子对象，如果对象的isMesh属性为true，我们就将更新改对象的position和quaternion属性（他们对应的刚体数据存在对应的userData中）。
    
    if(d.name) {
      // console.log(123)
      if (d.name==='gear1') {
        d.userData.bodyData.angularVelocity.set(0, 0, params.speed);
      }
      d.position.copy(d.userData.bodyData.position);
      d.quaternion.copy(d.userData.bodyData.quaternion);
    }
  })
}

const getTriangleMesh = (sin, cos, radius, length, thickness) => {
  const pointArr = [[sin*radius,cos*radius,thickness/2],[sin*radius,cos*radius,-thickness/2],[-sin*radius,cos*radius,thickness/2],[-sin*radius,cos*radius,-thickness/2],[0, radius+length,thickness/2],[0, radius+length,-thickness/2]];

  const points = pointArr.map(d => new Three.Vector3(d[0],d[1],d[2]));

  const triangle = new ConvexGeometry(points);   //ConvexGeometry 可被用于为传入的一组点生成凸包    所谓凸包就是包围这组点的最小图形。也就是所有的点都在当前模型的体内，而且当前图形还是实现的体积最小的一个模型。

  return new Three.Mesh(triangle, new Three.MeshNormalMaterial());;
};

const creatGear = (scene,world) => {
  const  radius1 = 2, radius2 = 4, radius3 = 6;
  const  length = 0.5, thickness = 3;   //length  齿轮的三角顶点与下面两个点的高度差，thickness齿轮圆柱体的高度
  const  angle1=Math.PI/12,angle2=Math.PI/12/2,angle3=Math.PI/12/2/2;   //小齿轮到大齿轮一次齿轮的角度是30  15 7.5，  所以在计算所有点的时候就是15，7.5，3.75
  const triangleMesh1 = getTriangleMesh(Math.sin(angle1), Math.cos(angle1), radius1, length, thickness);
  const triangleMesh2 = getTriangleMesh(Math.sin(angle2), Math.cos(angle2), radius2, length, thickness);
  const triangleMesh3 = getTriangleMesh(Math.sin(angle3), Math.cos(angle3), radius3, length, thickness);
  const normalMaterial = new Three.MeshNormalMaterial();

  const groupSmall = new Three.Group();
  
  for(let i=0;i<12;i++) {   //小齿轮是30°一个  所以是12
    const mesh = triangleMesh1.clone();
    mesh.rotation.z = i * 30 / 360 * Math.PI * 2
    groupSmall.add(mesh);
  }

  const groupMiddle1 = new Three.Group();
  const groupMiddle2 = new Three.Group();
  const groupMiddle3 = new Three.Group();
  const groupBig = new Three.Group();

  const cylinderGeoSmall = new Three.CylinderGeometry( radius1, radius1, thickness, 32);
  const cylinderMeshSmall = new Three.Mesh(cylinderGeoSmall,normalMaterial);
  cylinderMeshSmall.rotation.x = Math.PI/2
  groupSmall.add(cylinderMeshSmall);

  scene.add(groupSmall)

  for(let i=0;i<24;i++) {   //中齿轮是15°一个  所以是24
    const mesh = triangleMesh2.clone();
    mesh.rotation.z = i * 15 / 360 * Math.PI * 2
    groupMiddle1.add(mesh.clone());
    groupMiddle2.add(mesh.clone());
    groupMiddle3.add(mesh.clone());
  }
  const cylinderGeoMiddle = new Three.CylinderGeometry( radius2, radius2, thickness, 32);
  const cylinderMeshMiddle = new Three.Mesh(cylinderGeoMiddle,normalMaterial);
  cylinderMeshMiddle.rotation.x = Math.PI/2;
  groupMiddle1.add(cylinderMeshMiddle.clone());
  groupMiddle2.add(cylinderMeshMiddle.clone());
  groupMiddle3.add(cylinderMeshMiddle.clone());

  scene.add(groupMiddle1)
  scene.add(groupMiddle2)
  scene.add(groupMiddle3)

  for(let i=0;i<48;i++) {   //中齿轮是7.5°一个  所以是48
    const mesh = triangleMesh3.clone();
    mesh.rotation.z = i * 7.5 / 360 * Math.PI * 2
    groupBig.add(mesh);
  }
  const cylinderGeoBig = new Three.CylinderGeometry( radius3, radius3, thickness, 32);
  const cylinderMeshBig = new Three.Mesh(cylinderGeoBig,normalMaterial);
  cylinderMeshBig.rotation.x = Math.PI/2;
  groupBig.add(cylinderMeshBig);
  scene.add(groupBig)


  const cylindMesh = new Three.Mesh(new Three.CylinderGeometry(0.5,0.5,10,6,1), new Three.MeshPhongMaterial({color: 0xffcc77, flatShading: true}));
  cylindMesh.rotation.x = Math.PI/2;
  const smallCylindMesh = cylindMesh.clone();
  const middleCylindMesh1 = cylindMesh.clone();
  const middleCylindMesh2 = cylindMesh.clone();
  const middleCylindMesh3 = cylindMesh.clone();
  const bigCylindMesh = cylindMesh.clone();
  groupSmall.add(smallCylindMesh);
  groupMiddle1.add(middleCylindMesh1);
  groupMiddle2.add(middleCylindMesh2);
  groupMiddle3.add(middleCylindMesh3);
  groupBig.add(bigCylindMesh);


  //中等齿轮1

  const middleAxis1Body = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Cylinder(0.1, 0.1, 1, 3),
    position: new CANNON.Vec3(-2*radius2-length,0,0),
    // material: bodyMaterial
  });
  const middleAxis2Body = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Cylinder(0.1, 0.1, 1, 3),
    position: new CANNON.Vec3(0,0,0),
    // material: bodyMaterial
  });
  const middleAxis3Body = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Cylinder(0.1, 0.1, 1, 3),
    position: new CANNON.Vec3(2*radius2+length,0,0),
    // material: bodyMaterial
  });
  const smallAxisBody =  new CANNON.Body({
    mass: 0,
    shape: new CANNON.Cylinder(0.1, 0.1, 1, 3),
    position: new CANNON.Vec3(6.4,8,0),
  });
  const bigAxisBody =  new CANNON.Body({
    mass: 0,
    shape: new CANNON.Cylinder(0.1, 0.1, 1, 3),
    position: new CANNON.Vec3(10.6, -13,0),
    // position: new CANNON.Vec3(12, -13,0),
  });
  
  const verts = [
    new CANNON.Vec3(-Math.sin(angle2) * radius1, -(radius1 + length - Math.cos(angle2) * radius1) / 2, thickness / 2),
    new CANNON.Vec3(0, (radius1 + length - Math.cos(angle2) * radius1) / 2, thickness / 2),
    new CANNON.Vec3(Math.sin(angle2) * radius1, -(radius1 + length - Math.cos(angle2) * radius1) / 2, thickness/2),
    new CANNON.Vec3(-Math.sin(angle2) * radius1, -(radius1 + length - Math.cos(angle2) * radius1) / 2, -thickness / 2),
    new CANNON.Vec3(0, (radius1 + length - Math.cos(angle2) * radius1) / 2, -thickness / 2),
    new CANNON.Vec3(Math.sin(angle2) * radius1, -(radius1 + length - Math.cos(angle2) * radius1) / 2, -thickness / 2),
  ];
  let faces = [[0,2,1], [3,4,5], [0,1,3], [1,4,3], [5,4,1], [2,5,1], [3,5,2], [3,2,0]];
 




  let shape = new CANNON.ConvexPolyhedron(verts, faces);
  const middleBody1 = new CANNON.Body({
    mass: 1,
    position: new CANNON.Vec3(-2*radius2-length,0,0)
  });
 

  const middleBody2 = new CANNON.Body({
    mass: 1,
    position: new CANNON.Vec3(0,0,0)
  });
 
  const middleBody3 = new CANNON.Body({
    mass: 1,
    position: new CANNON.Vec3(2*radius2+length,0,0)
  });

  const smallBody =  new CANNON.Body({
    mass: 1,
    position: new CANNON.Vec3(6.4,8,0)
  });

  const bigBody =  new CANNON.Body({
    mass: 1,
    position: new CANNON.Vec3(10.6, -13,0)
  });


  // //为齿轮刚体添加齿
  for(let i=0; i<24; i++) {
    let angle = i / 24 * Math.PI * 2;
    const cneterR = radius2*Math.cos(angle2)+(radius2+length - radius2*Math.cos(angle2))/2;
    const x = Math.sin(angle) * cneterR;
    const y = Math.cos(angle)*cneterR;
    // addShape ( shape  offset  quaternion )   向body添加具有局部偏移和方向的shape。
    //offset 偏移向量 
    middleBody1.addShape(shape, new CANNON.Vec3(x, y, 0), new CANNON.Quaternion().setFromEuler(0, 0, -angle));
    middleBody2.addShape(shape, new CANNON.Vec3(x, y, 0), new CANNON.Quaternion().setFromEuler(0, 0, -angle));
    middleBody3.addShape(shape, new CANNON.Vec3(x, y, 0), new CANNON.Quaternion().setFromEuler(0, 0, -angle));
  }
  // //为齿轮刚体添加齿
  for(let i=0; i<12; i++) {
    let angle = i / 12 * Math.PI * 2;
    const cneterR = radius1*Math.cos(angle1)+(radius1+length - radius1*Math.cos(angle1))/2;
    const x = Math.sin(angle) * cneterR;
    const y = Math.cos(angle)*cneterR;
    // addShape ( shape  offset  quaternion )   向body添加具有局部偏移和方向的shape。
    //offset 偏移向量 
    smallBody.addShape(shape, new CANNON.Vec3(x, y, 0), new CANNON.Quaternion().setFromEuler(0, 0, -angle));
  }

  for(let i=0; i<48; i++) {
    let angle = i / 48 * Math.PI * 2;
    const cneterR = radius3*Math.cos(angle3)+(radius3+length - radius3*Math.cos(angle3))/2;
    const x = Math.sin(angle) * cneterR;
    const y = Math.cos(angle)*cneterR;
    // addShape ( shape  offset  quaternion )   向body添加具有局部偏移和方向的shape。
    //offset 偏移向量 
    bigBody.addShape(shape, new CANNON.Vec3(x, y, 0), new CANNON.Quaternion().setFromEuler(0, 0, -angle));
  }
 
  middleBody1.angularDamping=0.9
  middleBody2.angularDamping=0.9
  middleBody3.angularDamping=0.9
  smallBody.angularDamping=0.9
  bigBody.angularDamping=0.9

  world.addBody(middleBody1)
  world.addBody(middleBody2)
  world.addBody(middleBody3)
  world.addBody(smallBody)
  world.addBody(bigBody)

  //为轮和齿设置铰链约束
  const c1 = new CANNON.HingeConstraint(middleAxis1Body, middleBody1, { 
    pivotA: new CANNON.Vec3(0, 0, 0),
    axisA: new CANNON.Vec3(0, 0, 1),
    pivotB: new CANNON.Vec3(0, 0, 0),
    axisB: new CANNON.Vec3(0, 0, 1),
    maxForce: 100
  });
  const c2 = new CANNON.HingeConstraint(middleAxis2Body, middleBody2, { 
    pivotA: new CANNON.Vec3(0, 0, 0),
    axisA: new CANNON.Vec3(0, 0, 1),
    pivotB: new CANNON.Vec3(0, 0, 0),
    axisB: new CANNON.Vec3(0, 0, 1),
    maxForce: 100
  });
  const c3 = new CANNON.HingeConstraint(middleAxis3Body, middleBody3, { 
    pivotA: new CANNON.Vec3(0, 0, 0),
    axisA: new CANNON.Vec3(0, 0, 1),
    pivotB: new CANNON.Vec3(0, 0, 0),
    axisB: new CANNON.Vec3(0, 0, 1),
    maxForce: 100
  });
  const c4 = new CANNON.HingeConstraint(smallAxisBody, smallBody, { 
    pivotA: new CANNON.Vec3(0, 0, 0),
    axisA: new CANNON.Vec3(0, 0, 1),
    pivotB: new CANNON.Vec3(0, 0, 0),
    axisB: new CANNON.Vec3(0, 0, 1),
    maxForce: 100
  });
  const c5 = new CANNON.HingeConstraint(bigAxisBody, bigBody, { 
    pivotA: new CANNON.Vec3(0, 0, 0),
    axisA: new CANNON.Vec3(0, 0, 1),
    pivotB: new CANNON.Vec3(0, 0, 0),
    axisB: new CANNON.Vec3(0, 0, 1),
    maxForce: 100
  });

  world.addConstraint(c1);
  world.addConstraint(c2);
  world.addConstraint(c3);
  world.addConstraint(c4);
  world.addConstraint(c5);
  //让齿轮不断的动起来

  groupMiddle1.userData.bodyData = middleBody1;
  groupMiddle1.name = "gear1"

  groupMiddle2.userData.bodyData = middleBody2;
  groupMiddle2.name = "gear2"

  groupMiddle3.userData.bodyData = middleBody3;
  groupMiddle3.name = "gear3"

  groupSmall.userData.bodyData = smallBody;
  groupSmall.name = "gear4"

  groupBig.userData.bodyData = bigBody;
  groupBig.name = "gear5"


  
  return {middleAxis1Body,smallAxisBody,middleAxis3Body,bigAxisBody}


}

const initCannon = () => {
  const world = new CANNON.World();  ////该方法初始化物理世界，里面包含着物理世界的相关数据（如刚体数据，世界中所受外力等等）
  world.quatNormalizeSkip = 0;
  world.quatNormalizeFast = false;
  world.gravity.set(0,-9.8,0)  //设置物理世界的重力为沿y轴向上-9.8米每二次方秒
  world.broadphase = new CANNON.NaiveBroadphase();//NaiveBroadphase是默认的碰撞检测方式，该碰撞检测速度比较高
  world.solver.iterations = 20;//解算器的迭代次数，更高的迭代次数意味着更加精确同时性能将会降低
  
  return world;
}


const CannonGear = () => {
  const canvasRef = useRef(null);
  const statsRef = useRef(null);

  useEffect(()=>{
    const {renderer, camera, scene, stats,orbitControls} = init(canvasRef.current, statsRef.current);

    const resizeHandle = () => {
      //根据窗口大小变化，重新修改渲染器的视椎
      if (renderer === null) {
        return;
      }
      const canvas = renderer.domElement
      camera.aspect = canvas.clientWidth / canvas.clientHeight
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(canvas.clientWidth, canvas.clientHeight, false)
    };
  
    resizeHandle();

    // const ground = initGround(scene);
    const world = initCannon();
    const {middleAxis1Body,smallAxisBody,middleAxis3Body,bigAxisBody} = creatGear(scene,world)
    initGui(middleAxis1Body,smallAxisBody,middleAxis3Body,bigAxisBody)
    
   
  
    const update = () => {
      
      
      stats.update();
      orbitControls.update();
      updatePhysics(world,scene)

      renderer.render(scene,camera);
      
      window.requestAnimationFrame(update);

    }
   
    update();

    window.addEventListener('resize', resizeHandle);
    return () => {
      window.removeEventListener('resize',resizeHandle)
    }
  },[])
  
 
  return(
    <>
      <div ref={statsRef}></div>
      <canvas ref={canvasRef}></canvas>
    </>
  ) 
}

export default CannonGear;