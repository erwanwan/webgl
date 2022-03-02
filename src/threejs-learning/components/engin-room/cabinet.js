import * as Three from "three";

const ThreeBSP = require('jthreebsp')(Three);

export const addCabinet = () => {
  const material = new Three.MeshBasicMaterial( {color: 'red'} );

  // 创建服务器组
  const cabinet = new Three.Group();
  cabinet.layers.set(1);

  //创建机柜
  const geo1 = new Three.BoxBufferGeometry(8,15,6);
  const geo2 = new Three.BoxBufferGeometry(7,14,6);

  const mesh1 = new Three.Mesh(geo1, material);
  mesh1.position.set(0,7.6,0);
  const mesh2 = new Three.Mesh(geo2, material);
  mesh2.position.set(0,7.6,0.5)

  const mesh1BSP = new ThreeBSP(mesh1);
  const mesh2BSP = new ThreeBSP(mesh2);

  const resultBSP =  mesh1BSP.subtract(mesh2BSP);

  const result = resultBSP.toMesh()
  result.geometry.computeFaceNormals();
  result.geometry.computeVertexNormals();
  const texture = new Three.TextureLoader().load( require('./images/rack_panel.jpg').default );
  result.material = new Three.MeshLambertMaterial({
    map:texture,
    color:0x8E8E8E,
  });
  result.layers.set(1)
  cabinet.add(result);
  
  //创建机柜门
  const doorGeometry = new Three.BoxBufferGeometry(8,15,0.2); 
  const mMaterials = [];
  mMaterials.push(
    new Three.MeshLambertMaterial({color:0x999999}),
    new Three.MeshLambertMaterial({color:0x999999}),
    new Three.MeshLambertMaterial({color:0x999999}),
    new Three.MeshLambertMaterial({color:0x999999}),
    new Three.MeshLambertMaterial({
        map: new Three.TextureLoader().load(require('./images/rack_front_door.jpg').default),
        overdraw:true
    }),
    new Three.MeshBasicMaterial({
        map: new Three.TextureLoader().load(require('./images/rack_door_back.jpg').default),
        overdraw:true
    })
  );

  // const doorMaterial = new Three.MeshFaceMaterial(mMaterials);
  const door = new Three.Mesh(doorGeometry,mMaterials);
  door.position.set(-4,0,0.1);
  door.name="cabinet-door";
  door.layers.set(1)

  const doorGroup = new Three.Group();
  doorGroup.layers.set(1);
  doorGroup.name="cabinet-door-group"

  doorGroup.position.set(4, 7.6, 3);

  doorGroup.add(door);

  cabinet.add(doorGroup);


  //创建阴影
  const planeGeo = new Three.PlaneBufferGeometry(12,9.5);
  const m = new Three.MeshLambertMaterial({
    map: new Three.TextureLoader().load( require('./images/roundshadow.png').default),
    transparent: true,
    side: Three.DoubleSide,
    // color:'red'
  })
  // mesh

  const shadowMesh = new Three.Mesh(planeGeo,m);
  shadowMesh.rotateX(Math.PI/2)
  shadowMesh.position.y=0.05;
  shadowMesh.layers.set(1);


  cabinet.add(shadowMesh)

  return  cabinet

};

//服务器开关按钮
const radius = 0.15;
const buttonGeometry = new Three.CylinderBufferGeometry(radius,radius,0.001,32); 

const btnMaterial = new Three.MeshPhongMaterial({
  map:  new Three.TextureLoader().load(require('./images/button-close.jpg').default),
  overdraw:true,
});
const buttonMaterial = [
  new Three.MeshLambertMaterial({color:'#8E8E8E'}),
  btnMaterial,
  btnMaterial,
];

const buttonMesh = new Three.Mesh(buttonGeometry, buttonMaterial);
buttonMesh.rotateX(Math.PI / 2);
buttonMesh.rotateY(Math.PI / 2);
buttonMesh.position.set(0,0,5.5/2);
buttonMesh.name = 'server-button';
buttonMesh.userData.open = false;

//服务器侧面材质
const mMat = new Three.MeshBasicMaterial({//交换机面板材质
  color:'#5f5f5f'
});
const serverArr=[
  {
    num: [1,2],
    texture: new Three.TextureLoader().load(require('./images/switchboard.jpg').default),
    height: 3
  },
  {
    num: [1,2],
    texture: new Three.TextureLoader().load(require('./images/server3.jpg').default),
    height: 2
  },
  {
    num: [1,2,3,4],
    texture: new Three.TextureLoader().load(require('./images/server2.jpg').default),
    height: 1
  },
];
const serverObj = serverArr.reduce((acc,item)=>{
  const serverGeometry1 =  new Three.BoxBufferGeometry(7, item.height, 5.5);
  const serverMaterialsArr1 = [
    mMat,
    mMat,
    mMat,
    mMat,
    new Three.MeshBasicMaterial({
      map: item.texture,
    }),
    mMat
  ];
  const mesh= new Three.Mesh(serverGeometry1,serverMaterialsArr1);
  mesh.name="server-body";
  acc[item.height] = mesh;
  return acc;
},{});


export const addServer = (serverData) => {
  if (!serverData.height) {
    return;
  }
  const server = new Three.Group();
  server.name = "server";
  server.layers.set(1);
 
  const serverCopy = serverObj[serverData.height].clone();
  serverCopy.layers.set(1)
  server.add(serverCopy);
  server.position.set(0,0.5+serverData.index+serverData.height/2,0.25);

  if (serverData.height<3) {
    const btn = buttonMesh.clone();
    //深度克隆按钮的material以变后续单独更改 clone会深度克隆顶点数据，但是material不会
    const material =  btn.material.map((item)=>{
      let itemCopy = item;
      if (item.map) {
        itemCopy = item.clone();
      }
      return itemCopy
    });
    btn.material = material;
    btn.layers.set(1)
    server.add(btn)
  }
  return server;

} 