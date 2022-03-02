import {useEffect, useRef, useState} from 'react';
import * as Three from "three";
import Stats from 'three/examples/jsm/libs/stats.module';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import CANNON from "cannon";



const init = (canvas, statsDom) => {
  const renderer = new Three.WebGLRenderer({canvas, antialias: true});
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.setClearColor(0xbfd1e5);

  const scene = new Three.Scene();//step 1 创建场景

  const camera = new Three.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );
  camera.position.x = 40;
  camera.position.y = 52;
  camera.position.z = 78;
  scene.add( camera ); //step 2 场景中添加相机

  scene.add(new Three.AmbientLight(0x888888));
  const light = new Three.DirectionalLight(0xbbbbbb, 1);
  light.position.set(0, 50, 50);
  light.castShadow = true;

  scene.add(light); //step 3 场景中添加另种光源

  let stats;
  if (statsDom) {
    stats = new Stats();
    statsDom.appendChild(stats.dom);
  }

  const orbitControls = new OrbitControls(camera, canvas);
  orbitControls.target.set(0,0,0);
  orbitControls.update();

  return {renderer, camera, scene, stats,orbitControls}
};
export const dispose = (parent,child) => {
  if(child.children.length){
      let arr  = child.children.filter(x=>x);
      arr.forEach(a=>{
          dispose(child,a)
      })
  }
  if(child instanceof Three.Mesh||child instanceof Three.Line){
    if (Array.isArray(child.material)) {
      child.material.forEach((item)=>{
        if(item.map) item.map.dispose();
        item.dispose();
      })
      child.material = null;
    } else {
      if(child.material.map) child.material.map.dispose();
      if (child.material.uniforms) {
        Object.keys(child.material.uniforms).forEach((key)=>{
          if(child.material.uniforms[key].type === 't') {
            child.material.uniforms[key].value.dispose()
          }
        })
      }
      child.material.dispose();
    }
    child.geometry.dispose();
  }
  if(child.material){
    if(child.material.map) child.material.map.dispose();
    if (child.material.uniforms) {
      Object.keys(child.material.uniforms).forEach((key)=>{
        if(child.material.uniforms[key].type === 't') {
          child.material.uniforms[key].value.dispose()
        }
      })
    }
    child.material.dispose();
  } 
  if (child.geometry) {
    child.geometry.dispose();
  }
  child.remove();
  parent.remove(child);
}

const initGround = (scene) => {

  const groundGeom = new Three.BoxBufferGeometry(100, 0.2, 100);
  const texture = new Three.TextureLoader().load(require("./images/ground.png").default);
  texture.wrapS = texture.wrapT = Three.RepeatWrapping;
  texture.repeat.copy(new Three.Vector2(40, 40));
  let groundMate = new Three.MeshPhongMaterial({color: 0xdddddd,map:texture})
  const ground = new Three.Mesh(groundGeom, groundMate);
  ground.position.y = -0.1;
  ground.receiveShadow = true;
  scene.add(ground); //step 5 添加地面网格
  return ground
}

const initCannon = (scene,ground) => {
  const world = new CANNON.World();  ////该方法初始化物理世界，里面包含着物理世界的相关数据（如刚体数据，世界中所受外力等等）
  world.gravity.set(0,-9.8,0)  //设置物理世界的重力为沿y轴向上-9.8米每二次方秒
  world.broadphase = new CANNON.NaiveBroadphase();//NaiveBroadphase是默认的碰撞检测方式，该碰撞检测速度比较高
  world.solver.iterations = 10;//解算器的迭代次数，更高的迭代次数意味着更加精确同时性能将会降低

  //创建一个刚体（物理世界的刚体数据）  这个是地板的刚体数据
  const groundBody = new CANNON.Body({
    position: new CANNON.Vec3(0,-0.1,0),
    mass: 0,   //刚体的质量，这里单位为kg
    linearDamping: 0.01,  //设置线性阻尼   减慢物理形体、模拟大气阻力   线性阻尼控制物理形体或约束抵抗平移的量
    angularDamping: 0.01,  //设置旋转阻尼  为铰链增加抗力  角阻尼控制其抵抗旋转的量
    shape: new CANNON.Box(new CANNON.Vec3(50,0.1,50)),  //刚体的形状（这里是立方体，立方体的参数是一个包含半长、半宽、半高的三维向量
    material:{ //材质数据，里面规定了摩擦系数和弹性系数
      friction: 0.05,  //摩擦系数
      restitution: 0.3,  //弹性系数
    }
  })

  ground.userData.bodyData = groundBody;

  world.addBody(groundBody);

  return world;
}

const createRandomMaterial = () => {
  const material = new Three.MeshPhongMaterial();  //HSL(0.4,0.8,0.5) ~ HSL(0,0.8,0.5)就是从绿色到红色
  material.color.setHSL(0.4 - 0.4 * Math.random(), 0.8, 0.5);
  return material
};

const createSphere = (scene,world,p,v) => {
  const geometry = new Three.SphereBufferGeometry(1.5, 32, 16);
  const sphere = new Three.Mesh( geometry, createRandomMaterial());
  sphere.position.set(p.x,p.y,p.z);
  sphere.castShadow = true;
  sphere.receiveShadow = true;
  const speed = 50;
  const sphereBody = new CANNON.Body({
    mass: 1,
    position: new CANNON.Vec3(p.x,p.y,p.z),
    shape: new CANNON.Sphere(1.5),
    material: new CANNON.Material({friction: 0.1, restitution: 0.1}),
    velocity: new CANNON.Vec3(v.x*speed,v.y*speed,v.z*speed)  //初始速度
  });
  sphereBody.collisionResponse = 0.01;
  world.addBody(sphereBody);
  sphere.userData.bodyData = sphereBody;
  scene.add(sphere)

  setTimeout(() => {
    scene.remove(sphere);
    sphere.material.dispose();
    sphere.geometry.dispose();
    world.removeBody(sphereBody);
  }, 60000)
};


//逐帧根据物理引擎的数据渲染three场景
const updatePhysics = (world,scene) => {
  world.step(1/60); //第一个参数是以固定步长更新物理世界参数
  scene.children.forEach(d => {//遍历场景中的子对象，如果对象的isMesh属性为true，我们就将更新改对象的position和quaternion属性（他们对应的刚体数据存在对应的userData中）。
    if(d.isGroup == true) {
      d.children.forEach((item)=>{
        if (item.isMesh) {
          item.position.copy(item.userData.bodyData.position);
          item.quaternion.copy(item.userData.bodyData.quaternion);
        }
       
      })
        
    } else if (d.isMesh) {
      d.position.copy(d.userData.bodyData.position);
      d.quaternion.copy(d.userData.bodyData.quaternion);
    }
  })
}

const pointToPointConstraint = (scene,world) => {
  const space = 0.1;   //相邻两个刚体之间的间隔的一半
  const mass= 0;  //刚体质量
  const width = 10;  //刚体半宽
  const hHeight = 1;  //刚体半高
  let last;  //上一个相连的刚体

  const halfVec = new CANNON.Vec3(width,hHeight,0.2);
  const shapeBox = new CANNON.Box(halfVec);
  const boxGeometry = new Three.BoxBufferGeometry(2*halfVec.x,2*halfVec.y,2*halfVec.z);
  const boxMaterial = new Three.MeshLambertMaterial( { color: 0xffaa00 } );

  const group = new Three.Group();
  group.name = 'point';
  scene.add(group);
  
  for(let i=0;i<20;i++){
    const boxMesh = new Three.Mesh(boxGeometry,boxMaterial);
    boxMesh.position.y = (20 - i + 5) * (hHeight * 2 + space*2);
    boxMesh.castShadow = true;
    boxMesh.receiveShadow = true;
    const boxBody = new CANNON.Body({
      position: new CANNON.Vec3(0,boxMesh.position.y,0),
      mass: i===0 ? 0 : 1,
      shape: shapeBox,
      material: {
        friction: 0.05,  //摩擦系数
        restitution: 0.1,  //弹性系数
      }
    });
    world.addBody(boxBody);
    boxMesh.userData.bodyData = boxBody;

    group.add(boxMesh);
    
    //从第二个刚体往后都会创建两个点对点的约束
    //PointToPointConstraint （ bodyA  pivotA  bodyB  pivotB  maxForce ）
    // bodyA – 刚体A
    // pivotA – 相对于刚体A质心的点，刚体A被约束到该点。
    // bodyB – 将被约束到与刚体A相同的点的主体。因此，我们将获得刚体A和刚体B之间的链接。如果未指定，刚体A将被约束到一个静态点。
    // pivotB – 相对于刚体B质心的点，刚体B被约束到该点。  pivotB和pivotA是同一个点
    // maxForce – 约束物体应施加的最大力（如果施加的力过大，刚体A和刚体B之间的链接就会被拉长）
    if (i>0) {
      const ptp1 = new CANNON.PointToPointConstraint(boxBody,new CANNON.Vec3(-width,hHeight+space,0),last,new CANNON.Vec3(-width,-hHeight-space,0),(20 - i) / 4);
      const  ptp2 = new CANNON.PointToPointConstraint(boxBody,new CANNON.Vec3(width,hHeight+space,0),last,new CANNON.Vec3(width,-hHeight-space,0),(20 - i) / 4);
      world.addConstraint(ptp1);  //将约束添加到物理世界
      world.addConstraint(ptp2);
                                                     
    }
    last = boxBody;
  }

};

const lockConstraint = (scene,world) => {
  const space = 0.1;   //相邻两个刚体之间的间隔的一半
  const mass= 1;  //刚体质量
  const width = 1;  //刚体半宽
  let last;  //上一个相连的刚体

  const boxGeomery = new Three.BoxBufferGeometry(2*width,2*width,2*width);
  const shapeBox = new CANNON.Box(new CANNON.Vec3(width,width,width));
  const material = new Three.MeshNormalMaterial();
  const bodyMaterial = {
    friction: 0.05,  //摩擦系数
    restitution: 0.3,  //弹性系数
  }
  const boxMesh = new Three.Mesh(boxGeomery,material)
  const group = new Three.Group();
  group.name = 'lock';
  scene.add(group);
  let meshBody;
  for(let i=0;i<12;i++) {
    const mesh = boxMesh.clone();
    if (i===0) {
      const x = -4.5*2*width-4.5*2*space
      mesh.position.set(x,width,0);
      meshBody = new CANNON.Body({
        position: new CANNON.Vec3(x,width,0),
        mass:0,
        shape: shapeBox,
        material: bodyMaterial,
      })
    } else if (i===11) {
      const x=(-4.5*2*width-4.5*2*space)+9*(2*width+2*space)
      mesh.position.set(x,width,0);
      meshBody = new CANNON.Body({
        position: new CANNON.Vec3(x,width,0),
        mass:0,
        shape: shapeBox,
        material: bodyMaterial
      })

    } else {
      const x = (-4.5*2*width-4.5*2*space)+(i-1)*(2*width+2*space);
      const y = 12*width;
      
      mesh.position.set(x,y,0);

      meshBody = new CANNON.Body({
        position: new CANNON.Vec3(x,y,0),
        mass,
        shape: shapeBox,
        material: bodyMaterial,
      })
    }
    world.addBody(meshBody);
    mesh.userData.bodyData = meshBody;

    if (i>1 && i<11) {
      //LockConstraint ( bodyA  bodyB { maxForce } )
      const lock = new CANNON.LockConstraint(meshBody,last)
      world.addConstraint(lock);  //将约束添加到物理世界
    }

    last = meshBody;
    group.add(mesh);
  }
};

const distanceConstraint = (scene,world) => {
  const group = new Three.Group();
  group.name = 'distance';
  scene.add(group);

  const sphereGeometry = new Three.SphereGeometry( 4, 32, 16 );
  const material = new Three.MeshNormalMaterial();
  const sphere = new Three.Mesh( sphereGeometry, material );
  sphere.position.set(0,4,0);
  group.add(sphere);

  const bodyMaterial = {
    friction: 0.05,  //摩擦系数
    restitution: 0.3,  //弹性系数
  }
  const sphereBody = new CANNON.Body({
    mass:0,
    position: new CANNON.Vec3(0,4,0),
    shape:new CANNON.Sphere(4),
    material: bodyMaterial
  });
  sphere.userData.bodyData = sphereBody;
  world.addBody(sphereBody);

  const row=15;
  const col=15;

  const bodyArr = [];
  const size = 0.2;  //小球半径
  const dis = 0.5;  //距离
  const sphereShape = new CANNON.Sphere(size);
  const mass = 1;

  for (let r=0;r<row;r++) {
    const arr = [];
    for(let c=0;c<col;c++) {
      const body = new CANNON.Body({
        mass,
        position: new CANNON.Vec3(c*dis-(col/2-0.5)*dis ,9, r*dis-(row/2-0.5)*dis),
        shape: sphereShape,
        material: bodyMaterial
      })
      arr.push(body);
      world.addBody(body);
    }
    bodyArr.push(arr)
  }

  const geometry = new Three.SphereGeometry( size, 32, 16 );

  for (let r=0;r<row;r++) {
    for(let c=0;c<col;c++) {
      const mesh = new Three.Mesh(geometry,material);
      const meshBody = bodyArr[r][c];
      mesh.userData.bodyData = meshBody;
      group.add(mesh);
      //DistanceConstraint ( bodyA bodyB distance maxForce )  距离约束将两个物体约束为彼此重心的距离恒定
      //bodyA — 刚体A。 bodyB — 刚体B。 distance — 要保持的距离。如果未定义，它将被设置为刚体A和刚体B之间的当前距离。 maxForce — 约束物体应施加的最大力
      if (r<row-1) {  //不是最后一排，需要与下一排的对应的小球做绑定
        const constraint = new CANNON.DistanceConstraint(meshBody,bodyArr[r+1][c],dis,5);
        world.addConstraint(constraint);
      }
      if(c<col-1) {  //不知最后一列，需要与右侧小球做绑定
        const constraint = new CANNON.DistanceConstraint(meshBody,bodyArr[r][c+1],dis,5);
        world.addConstraint(constraint);
      }

    }
  }

};

const hingeConstraint = (scene,world) => {
  const bodyMaterial = {
    friction: 0.05,  //摩擦系数
    restitution: 0.3,  //弹性系数
  }

  let bodyA = new CANNON.Body({
    mass: 0,
    shape: new CANNON.Box(new CANNON.Vec3(0.2, 4, 0.2)),
    position: new CANNON.Vec3(-3.2, 5, 0),
    // material: bodyMaterial
  })
 
  let bodyB = new CANNON.Body({
      mass: 1,
      shape: new CANNON.Box(new CANNON.Vec3(3, 4, 0.2)),
      position: new CANNON.Vec3(0, 5, 0),
      // material: pubMaterial
  })

  bodyB.velocity.set(0, 0, -10);

  
  world.add(bodyA);
  world.add(bodyB);

  //HingeConstraint （ bodyA  bodyB  { pivotA axisA pivotB axisB maxForce } ）
  //bodyA — 刚体A。 bodyB — 刚体B。 
  //pivotA — 相对于刚体A的质心的点，刚体A被约束到该点  A point defined locally in bodyA. This defines the offset of axisA.。 
  //axisA — 在刚体A中局部定义的刚体A可以绕其旋转的轴。 
  //pivotB — 相对于刚体B的质心的点，刚体B被约束到该点。 
  //axisB — 在刚体B中局部定义的刚体B可以绕其旋转的轴。 
  //maxForce — 约束物体应施加的最大力

  var c = new CANNON.HingeConstraint(bodyA, bodyB, { 
      pivotA: new CANNON.Vec3(0.2, 0, 0),
      axisA: new CANNON.Vec3(0, 1, 0),
      pivotB: new CANNON.Vec3(-3.2, 0, 0),
      axisB: new CANNON.Vec3(0, 1, 0),
      maxForce: 2
  });
  world.addConstraint(c);

  let meshA = new Three.Mesh(new Three.BoxBufferGeometry(0.4, 8, 0.4), new Three.MeshNormalMaterial());
  let meshB = new Three.Mesh(new Three.BoxBufferGeometry(6, 8, 0.4), new Three.MeshNormalMaterial());
  // meshes.push(meshA);
  // meshes.push(meshB);
  meshA.userData.bodyData = bodyA
  meshB.userData.bodyData = bodyB
  scene.add(meshA);
  scene.add(meshB);

};


const CannonConstraint = () => {
  const canvasRef = useRef(null);
  const statsRef = useRef(null);
  const cameraRef = useRef(null);
  const sceneRef = useRef(null);
  const wordRef = useRef(null);
  const [type,setType] = useState('point');
  const typeFun = useRef({
    'point': pointToPointConstraint,
    "lock":lockConstraint,
    "distance":distanceConstraint,
    "hinge":hingeConstraint
  });

  useEffect(()=>{
    const {renderer, camera, scene, stats,orbitControls} = init(canvasRef.current, statsRef.current);
    
    cameraRef.current = camera;
    sceneRef.current = scene;

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

    const ground = initGround(scene);
    const world = initCannon(scene,ground);
    wordRef.current = world;
    // createBox(scene,world)
    pointToPointConstraint(scene,world)
  
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
  },[]);

  const handleClick = (event) => {
    //将鼠标位置归一化为设备坐标。x 和 y 方向的取值范围是 (-1 to +1)
    const x = ( event.clientX / window.innerWidth ) * 2 - 1;
    const y = -( event.clientY / window.innerHeight ) * 2 + 1;
    const p = new Three.Vector3(x, y, -1).unproject(cameraRef.current);  //将此向量(坐标)从相机的标准化设备坐标 (NDC) 空间投影到世界空间。 得到鼠标对应三维空间点
    const v = p.sub(cameraRef.current.position).normalize();//用鼠标对应的三维空间点减去相机的位置向量，然后归一化得到小球的射出方向的单位向量
    createSphere(sceneRef.current,wordRef.current,cameraRef.current.position, v );
  }
  const handleChangeType = (selectType) =>{
    if (selectType===type) {
      return;
    }
    const group = sceneRef.current.getObjectByName(type);
    dispose(sceneRef.current, group);
    const bodies = [...wordRef.current.bodies]
    bodies.forEach((body,index)=>{
      if (index>0) {  //第一个是地板 不能消除
        wordRef.current.removeBody(body)
      }      
     
    })
    const constraints = [...wordRef.current.constraints]
    constraints.forEach((item)=>{
      wordRef.current.removeConstraint (item)
    })
    typeFun.current[selectType](sceneRef.current,wordRef.current);
    setType(selectType);
  }
  
 
  return(
    <>
      <div ref={statsRef}></div>
      <div className="btns">
        <div className="item" onClick={()=>handleChangeType('point')}>点对点束缚</div>
        <div className="item" onClick={()=>handleChangeType('lock')}>锁定束缚</div>
        <div className="item" onClick={()=>handleChangeType('distance')}>距离束缚</div>
        <div className="item" onClick={()=>handleChangeType('hinge')}>铰链束缚</div>
        
      </div>
      <canvas ref={canvasRef} onClick={handleClick} ></canvas>
    </>
  ) 
}

export default CannonConstraint;