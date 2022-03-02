import * as Three from "three";

import { loadGltfModel } from "./util";

const ThreeBSP = require('jthreebsp')(Three);

export const addWall = (scene) => {

  // const material = new Three.MeshBasicMaterial( {color: '#a1b9d8'} );
  const material = new Three.MeshPhysicalMaterial( {
    // color: '#a1b9d8', 
    color: '#58ACFA', 
    // reflectivity:0.5,
    metalness: 0,
    roughness: 0,
    opacity: 0.2,
    transparent: true,
    envMapIntensity: 10,
    premultipliedAlpha: true
  } );
  const material1 = new Three.MeshBasicMaterial( {color: '#ffffff',opacity:0.5,transparent: true } );
  const doorRightTexture = new Three.MeshBasicMaterial( {map:  new Three.TextureLoader().load( require('./images/door-right.png').default ),transparent: true} );
  const doorLeftTexture = new Three.MeshBasicMaterial( {map:  new Three.TextureLoader().load( require('./images/door-left.png').default ),transparent: true} );
  const windowsillM1 = new Three.MeshBasicMaterial({color: '#9bafcf'});
  const windowsillM2 = new Three.MeshBasicMaterial({color: '#b5c7de'});

  const rightDoorM = [
    doorLeftTexture,
    doorRightTexture,
    material1,
    material1,
    material1,
    material1
  ];
  const leftDoorM = [
    doorRightTexture,
    doorLeftTexture,
    material1,
    material1,
    material1,
    material1
  ];
  const windowsillM = [
    windowsillM1,
    windowsillM1,
    windowsillM2,
    windowsillM2,
    windowsillM1,
    windowsillM1,
  ]
 
 //重新赋值一个纹理
 const ShaderBar = {
    uniforms: {
      // wallColor: {value: new Three.Color('#a1b9d8')},
      wallColor: {value: new Three.Color('#99b3d3')},
      wallColor1: {value: new Three.Color('#d4e5ed')},

      // windowColor: {value: new Three.Color('#ffedca')},
      windowColor: {value: new Three.Color('#b5c7de')},
    },
    vertexShader: `
        varying vec3 v_position; 

        void main(){
          v_position = position; 
          gl_Position	= projectionMatrix * modelViewMatrix * vec4(position, 1.0); 
        }
    `,
    fragmentShader: `
        uniform vec3	wallColor;
        uniform vec3	wallColor1;
        uniform vec3	windowColor;
        uniform vec3	color1;
        varying vec3	v_position;

        void main(){
          if (((abs(v_position.x) >= 40.0 && abs(v_position.x) <= 41.0 && abs(v_position.y)<=6.0) || (abs(v_position.x)<= 40.0 && abs(v_position.y)>=5.0 && abs(v_position.y)<=6.0)) && abs(v_position.z) == 0.5 ) {   //垂直
            gl_FragColor = vec4(windowColor.r, windowColor.g, windowColor.b, 1);
          } else if ((abs(v_position.x)<40.0 && abs(v_position.y)==5.0) || (abs(v_position.x)==40.0 && abs(v_position.y)<5.0)) {
            gl_FragColor = vec4(windowColor.r*wallColor.r, windowColor.g*wallColor.g, windowColor.b* wallColor.b, 1);
          } else if(v_position.y==10.0) {
            gl_FragColor = vec4(wallColor1.r, wallColor1.g, wallColor1.b, 1);
          } else {
            gl_FragColor = vec4(wallColor.r, wallColor.g, wallColor.b, 1);
          }
          
        }
    `,
    fragmentShaderRight:`
      uniform vec3	wallColor;
      uniform vec3	wallColor1;
      uniform vec3	windowColor;
      uniform vec3	color1;
      varying vec3	v_position;

      void main(){
        if (((abs(v_position.z) >= 25.0 && abs(v_position.z) <= 26.0 && abs(v_position.y)<=6.0) || (abs(v_position.z)<= 25.0 && abs(v_position.y)>=5.0 && abs(v_position.y)<=6.0)) && abs(v_position.x) == 0.5) {   //垂直
          gl_FragColor = vec4(windowColor.r, windowColor.g, windowColor.b, 1);
        } else if ((abs(v_position.x)<0.5 && abs(v_position.y)==5.0) || (abs(v_position.z)==25.0 && abs(v_position.y)<5.0)) {
          gl_FragColor = vec4(windowColor.r*wallColor.r, windowColor.g*wallColor.g, windowColor.b* wallColor.b, 1);
        } else if(v_position.y==10.0) {
          gl_FragColor = vec4(wallColor1.r, wallColor1.g, wallColor1.b, 1);
        } else {
          gl_FragColor = vec4(wallColor.r, wallColor.g, wallColor.b, 1);
        }

        // if (v_position.y==10.0) {
        //   gl_FragColor = vec4(wallColor1.r, wallColor1.g, wallColor1.b, 1);
        // } else {
        //   gl_FragColor = vec4(wallColor.r, wallColor.g, wallColor.b, 1);
        // }
        
      }
    `,
    fragmentShaderBefore: `
      uniform vec3	wallColor;
      uniform vec3	wallColor1;
      uniform vec3	windowColor;
      uniform vec3	color1;
      varying vec3	v_position;

      void main(){
        if ( ( (((v_position.z >=0.0 && v_position.z <= 1.0) || (v_position.z>=25.0 && v_position.z<=26.0)) && abs(v_position.y)<=6.0 ) || ( (v_position.z>=1.0 && v_position.z<=25.0) && abs(v_position.y) >=5.0&& abs(v_position.y)<=6.0 ) || ( ((v_position.z <= -5.0 &&  v_position.z >= -6.0) || (v_position.z <= -24.0 &&  v_position.z >= -25.0)) && v_position.y>=-10.0 && v_position.y<=9.0) || (v_position.z >= -24.0 && v_position.z <=-6.0 && v_position.y>=8.0 && v_position.y<=9.0 ) ) && abs(v_position.x) == 0.5 ) {   
          gl_FragColor = vec4(windowColor.r, windowColor.g, windowColor.b, 1);
        } else if ( (abs(v_position.x)<0.5 && abs(v_position.y)==5.0) || ( (v_position.z == 1.0 ||  v_position.z == 25.0) &&  abs(v_position.y)<=5.0 ) || ( (v_position.z==-6.0 || v_position.z==-24.0) && v_position.y>=-10.0 && v_position.y<=8.0 ) || ( v_position.y==8.0 && v_position.z>-24.0 && v_position.z<-6.0) ) {
          gl_FragColor = vec4(windowColor.r*wallColor.r, windowColor.g*wallColor.g, windowColor.b* wallColor.b, 1);
        } else if (v_position.y==10.0) {
          gl_FragColor = vec4(wallColor1.r, wallColor1.g, wallColor1.b, 1);
        }else {
          gl_FragColor = vec4(wallColor.r, wallColor.g, wallColor.b, 1);
        }
        
      }

    `
  };
  const materialWall = new Three.ShaderMaterial({
    uniforms: ShaderBar.uniforms,
    vertexShader: ShaderBar.vertexShader,
    fragmentShader: ShaderBar.fragmentShader,
  });
  const materialRightWall = new Three.ShaderMaterial({
    uniforms: ShaderBar.uniforms,
    vertexShader: ShaderBar.vertexShader,
    fragmentShader: ShaderBar.fragmentShaderRight,
  });
  const materialBeforeWall = new Three.ShaderMaterial({
    uniforms: ShaderBar.uniforms,
    vertexShader: ShaderBar.vertexShader,
    fragmentShader: ShaderBar.fragmentShaderBefore,
  });

  const wallArr = [
    {s: [1, 20, 91], p: [-45, 10, 0], dir: 'z', hasDoor: true, ds: [1, 18, 18], dp: [-45, 9, -15], hasWindow: true, ws: [1, 10, 24], wp: [-45, 10, 13],hasWindowsill: true, wsills: [3, 0.5,24],wsillp: [-47, 4.75, 13], material:materialBeforeWall}, 
    {s: [1, 20, 91], p: [45, 10, 0], dir: 'z', hasDoor: false, hasWindow: true, ws: [1, 10, 50], wp: [45, 10, 0], material: materialRightWall}, 
    // {s: [46, 20, 1], p: [22.5, 10, 30], dir: 'x', hasDoor: false, hasWindow: true, ws: [30, 10, 1], wp: [22.5, 10, 30]}, 
    // {s: [46, 20, 1], p: [-22.5, 10, 30], dir: 'x', hasDoor: false, hasWindow: true, ws: [30, 10, 1], wp: [-22.5, 10, 30]}, 
    // {s: [46, 20, 1], p: [22.5, 10, -30], dir: 'x', hasDoor: false, hasWindow: true, ws: [30, 10, 1], wp: [22.5, 10, -30]},
    // {s: [46, 20, 1], p: [-22.5, 10, -30], dir: 'x', hasDoor: false, hasWindow: true, ws: [30, 10, 1], wp: [-22.5, 10, -30]},
    {s: [91, 20, 1], p: [0, 10, 45], dir: 'x', hasDoor: false, hasWindow: true, ws: [80, 10, 1], wp: [0, 10, 45], material: materialWall}, 
    {s: [91, 20, 1], p: [0, 10, -45], dir: 'x', hasDoor: false, hasWindow: true, ws: [80, 10, 1], wp: [0, 10, -45], material: materialWall}
  ];

  wallArr.forEach((item,index)=>{
    const geometryWall = new Three.BoxBufferGeometry(...item.s);

    // const geometryWindow = new Three.BoxBufferGeometry(...item.ws);
    // const cubew1 = new Three.Mesh( geometryWindow, material );
    // cubew1.position.set(...item.wp);

    let doorBSP
    if (item.hasDoor) {
      const geometryDoor = new Three.BoxBufferGeometry(...item.ds)
      const cubed1 = new Three.Mesh( geometryDoor, material );
      cubed1.position.set(...item.dp);
      doorBSP = new ThreeBSP(cubed1);
    }

    let windowBSP

    if (item.hasWindow) {
      const geometryWindow = new Three.BoxBufferGeometry(...item.ws);
      const cubew1 = new Three.Mesh( geometryWindow, material );
      cubew1.position.set(...item.wp);
      scene.add(cubew1);  //玻璃窗
      windowBSP = new ThreeBSP(cubew1);
    }

    if (doorBSP || windowBSP) {
      const wall = new Three.Mesh( geometryWall, material );
      wall.position.set(...item.p);
      const wallBSP = new ThreeBSP(wall);

      const resultBSP = doorBSP ?  wallBSP.subtract(windowBSP).subtract(doorBSP) : wallBSP.subtract(windowBSP);
      //从BSP对象内获取到处理完后的mesh模型数据
      const result = resultBSP.toMesh();
      //更新模型的面和顶点的数据
      result.geometry.computeFaceNormals();
      result.geometry.computeVertexNormals();
      result.material = item.material
      scene.add(result);
    } else {
      const wall = new Three.Mesh(geometryWall,item.material);
      wall.position.set(...item.p);
      scene.add(wall)
    }

    
    

    if (item.hasWindowsill) {  //窗台
      const geometry = new Three.BoxBufferGeometry(...item.wsills);
      const mesh = new Three.Mesh( geometry, windowsillM );
      mesh.position.set(...item.wsillp);
      scene.add(mesh); 
    }
  });

  const rightDoorGroup = new Three.Group();
  rightDoorGroup.name="right-room-door"
  const leftDoorGroup = new Three.Group();
  leftDoorGroup.name="left-room-door"
  scene.add(rightDoorGroup);
  scene.add(leftDoorGroup);

  const doorGeometry = new Three.BoxBufferGeometry(1,18,9);
  const doorRight = new Three.Mesh(doorGeometry, rightDoorM)
  const doorLeft = new Three.Mesh(doorGeometry, leftDoorM)

  doorRight.position.z = -4.5;
  doorRight.name = 'right-door';

  doorLeft.position.z = 4.5;
  doorLeft.name = 'left-door';

  rightDoorGroup.position.x= -45;
  rightDoorGroup.position.y= 9;
  rightDoorGroup.position.z = -6;
  // rightDoorGroup.rotateY(Math.PI/2);
  rightDoorGroup.add(doorRight);

  leftDoorGroup.position.x = -45;
  leftDoorGroup.position.y = 9;
  leftDoorGroup.position.z = -24;
  leftDoorGroup.add(doorLeft);
  // leftDoorGroup.rotateY(-Math.PI/2);

};

export const addFloor = (scene) => {
  const floorTexture = new Three.TextureLoader().load( require('./images/floor.jpg').default );
  floorTexture.wrapS = floorTexture.wrapT = Three.RepeatWrapping;//两个方向都重复
  floorTexture.repeat.set(14,10);//两个方向上的重复数
  const geometry = new Three.BoxGeometry(400,2,300);
  const material = new Three.MeshLambertMaterial({
    color:0xffffff,
    map:floorTexture
  });
  const floor = new Three.Mesh(geometry,material);
  floor.position.set(0,-1,0);
  floor.receiveShadow = true;
  scene.add(floor);
};

export const addPlant = async (scene) => {
  try {
    const flowerGltf = await loadGltfModel(require('./model/flower-processed.glb').default);
    const flower = flowerGltf.scene;
    flower.scale.set(0.1,0.1,0.1);
    [[-35,0,49],[0,0,49],[35,0,49],[-35,0,-49],[0,0,-49],[35,0,-49],[49,0,20],[49,0,-20]].forEach((position)=>{
      const flowerCopy = flower.clone();
      flowerCopy.position.set(...position);
      scene.add(flowerCopy); 
    });

    // const brushPlantGltf = await loadGltfModel(require('./model/brush-plant.glb').default);
    // const brushPlant = brushPlantGltf.scene;
    // brushPlant.scale.set(3,3,3);
    // [[49,0,25],[49,0,-25]].forEach((position)=>{
    //   const brushCopy = brushPlant.clone();
    //   brushCopy.position.set(...position);
    //   scene.add(brushCopy); 
    // });

    const boxWoodGltf = await loadGltfModel(require('./model/box-wood-processed.glb').default);
    // console.log(boxWoodGltf)
    const boxWood = boxWoodGltf.scene;
    boxWood.scale.set(5,5,5);
    [[-47,5,5],[-47,5,20]].forEach((position)=>{
      const boxWoodCopy = boxWood.clone();
      boxWoodCopy.position.set(...position);
      scene.add(boxWoodCopy); 
    })   
  }catch(e) {
    console.log(e)
  };
  
};

export const addPunchCardMachine = (scene) => {
  const geometry = new Three.BoxBufferGeometry(0.5,2.5,3);
  const material = new Three.MeshBasicMaterial({
    map: new Three.TextureLoader().load( require('./images/punch-card.jpg').default )
  });
  const material1 = new Three.MeshBasicMaterial({color: '#606062'});
  const materials = [
    material1,
    material,
    material1,
    material1,
    material1,
    material1
  ]
  const mesh = new Three.Mesh(geometry, materials);
  mesh.position.set(-45.5, 12, -27.5);
  mesh.name="punch-card"
  scene.add(mesh)
};

const addCamera = async(scene) => {
  const cameraGltf = await loadGltfModel(require('./model/camera.glb').default);
  const cameraModel = cameraGltf.scene;
  cameraModel.scale.set(20,20,20);

  [[42,16,-43],[42,16,43]].forEach((position,index)=>{
    const cameraModelCopy = cameraModel.clone();
    cameraModelCopy.position.set(...position);
    if (index === 0) {
      cameraModelCopy.rotateY(-Math.PI/3)
      cameraModelCopy.rotateX(Math.PI/18)
    } else {
      cameraModelCopy.rotateY(-Math.PI/18*12)
    }
   
    // cameraModelCopy.rotateZ(-Math.PI/2)
    scene.add(cameraModelCopy);
  });
}

export const loadFireExtinguisher = async(scene) => {
  const model = await loadGltfModel(require('./model/alat_pemadam.glb').default);
  const fireExtinguisher = model.scene;

  [[43,1.5,-43],[43,1.5,-40],[43,1.5,-37]].forEach((p)=>{
    const objClone = fireExtinguisher.clone();
    objClone.position.set(...p)
    scene.add(objClone)
  });
}

export const initRoom = (scene) => {
  addWall(scene);
  addFloor(scene);
  addPlant(scene);
  addPunchCardMachine(scene);
  addCamera(scene);
  loadFireExtinguisher(scene);
}