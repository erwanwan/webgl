import * as Three from "three";

export const genWaterLeakAlarm = (POSITION_ARR) => {
  const boxGeometry = new Three.BoxBufferGeometry(8,15,6);
  const boxMaterial = new Three.MeshBasicMaterial({
    color: '#000',
    opacity:0.1,
    transparent: true
  });
  const boxMesh = new Three.Mesh(boxGeometry,boxMaterial);

  const waterLeakGroup = new Three.Group();
  waterLeakGroup.name="water-leak-group";
  // scene.add(waterLeakGroup)


  POSITION_ARR.forEach((item,index)=>{
    const boxMeshObj = boxMesh.clone();
    boxMeshObj.position.set(item.x,7.5,item.z)
    waterLeakGroup.add(boxMeshObj)
  })

  const texture = new Three.TextureLoader().load(require("./images/green-line1.jpg").default);
  texture.wrapS = Three.RepeatWrapping;
  texture.wrapT = Three.RepeatWrapping;
  texture.repeat.set(50,1);
  const lineMaterial = new Three.MeshLambertMaterial({
    map: texture
  });

  const waterPoints = [];

  [1,2,3].forEach((item)=>{
    const points = [];
    points.push( new Three.Vector3( POSITION_ARR[item*6-1].x+8, 0.1, POSITION_ARR[item*6-1].z + 6 ));
    points.push( new Three.Vector3( POSITION_ARR[(item - 1)*6].x-8, 0.1, POSITION_ARR[(item - 1)*6].z + 6 ) );
    points.push( new Three.Vector3( POSITION_ARR[(item - 1)*6].x-8, 0.1, POSITION_ARR[(item - 1)*6].z - 6 )  );
    points.push( new Three.Vector3( POSITION_ARR[item*6-1].x+8, 0.1, POSITION_ARR[item*6-1].z - 6  ) );
    points.push( new Three.Vector3( POSITION_ARR[item*6-1].x+8, 0.1, POSITION_ARR[item*6-1].z + 6) );

    const curvePath = new Three.CurvePath();
    for (let i = 0; i < points.length - 1; i++) {
      const lineCurve = new Three.LineCurve3(points[i], points[i + 1]); // 每两个点之间形成一条三维直线
      // curvePath.curves.push(lineCurve); // curvePath有一个curves属性，里面存放组成该三维路径的各个子路径
      curvePath.add(lineCurve)
    }


    const geometry = new Three.TubeGeometry( curvePath, 1000, 0.25);


    // const geometry = new Three.BufferGeometry().setFromPoints( points );
  
    const line = new Three.Mesh( geometry, lineMaterial );

    waterLeakGroup.add(line);

    const waterPoint = curvePath.getSpacedPoints();
    waterPoints.push(...waterPoint);

  })


  const waterShape = new Three.Shape();

  waterShape.absellipse(
    0,  0,            // ax, aY
    2, 1.6,           // xRadius, yRadius
    0,  2 * Math.PI,  // aStartAngle, aEndAngle
    false,            // aClockwise
    0                 // aRotation
  );
  const waterGeometry = new Three.ExtrudeGeometry( waterShape, {
    depth: 0.01,
    bevelEnabled: false,
  });

  const waterMaterial = new Three.MeshBasicMaterial({color: '#99c7cb'});

  const waterMesh = new Three.Mesh(waterGeometry,waterMaterial)

  waterMesh.rotateX(-Math.PI/2)

  const waterIndex = Math.round(Math.random()*123);

  const waterP = waterPoints[waterIndex]
  if (waterP.x === POSITION_ARR[5].x+8 || waterP.x === POSITION_ARR[0].x+8) {
    waterMesh.rotateZ(Math.PI/2)
  }
  waterMesh.position.set(waterP.x,0.01,waterP.z)

  waterLeakGroup.add(waterMesh);


  const alertGeometry = new Three.PlaneBufferGeometry(3,5);

  const alert = new Three.TextureLoader().load( require("./images/alert.png").default );
  const material = new Three.MeshBasicMaterial( { map: alert,side:Three.DoubleSide,transparent:true } );

  const sprite = new Three.Mesh(alertGeometry, material );

  sprite.position.set(waterP.x,2.5,waterP.z)

  waterLeakGroup.add(sprite);

  return waterLeakGroup

}