import * as Three from "three";

const ThreeBSP = require('jthreebsp')(Three);

const getCablePoint = (cabinetIndex, serverIndex, positionArr,serverDataArr) => {
  let serverY=0.5;
  const serverData = serverDataArr[cabinetIndex];
  
  serverData.forEach((item,index)=>{
    if (index<serverIndex) {
      serverY = serverY + (item.height || 1)
    }
    if (index === serverIndex) {
      serverY = serverY+ item.height/2
    }
  })
  const cabinetP = positionArr[cabinetIndex];
  const startP = new Three.Vector3(cabinetP.x, serverY, cabinetP.z);
  return startP;

};

const getPathPoint = (startPoint, endPoint, wireRackX) => {
  const {x: sx, y: sy, z: sz} = startPoint
  const {x: ex, y: ey, z: ez} = endPoint
  const start1 = startPoint;
  const start2 = new Three.Vector3(sx, sy, sz - 5);
  const start3 = new Three.Vector3(sx, 15.5, sz- 5);  //机柜高15
  const start4 = new Three.Vector3(sx, 15.5, sz); 

  const wireRack1 = new Three.Vector3(sx, 18, sz);  //18为走线架的y
  const wireRack2 = new Three.Vector3(wireRackX, 18, sz);  //18为走线架的y  wireRack1、wireRack2有可能重合

  const wireRack3 = new Three.Vector3(wireRackX, 18, ez);  //进入end那一排
  const wireRack4 = new Three.Vector3(ex, 18, ez);  // wireRack3、wireRack4有可能重合

  const end1 = new Three.Vector3(ex,15.5,ez);
  const end2 = new Three.Vector3(ex,15.5,ez-5);
  const end3 = new Three.Vector3(ex, ey, ez-5)
  const end4 = endPoint;

  let pointArrOut=[];
  let pointArrIn=[];
  let wireArr1=[];
  let wireArr2=[];
  let wireArr3=[]  //内部小的走线架轮廓
  let wireArr4=[]
  if (sz !== ez) { //不在同一排
    [start1,start2,start3].forEach((point)=>{
      pointArrOut.push(new Three.Vector3(point.x-0.3,point.y, point.z));
      pointArrIn.push(new Three.Vector3(point.x+0.3,point.y, point.z));
    })

    if (sx !== wireRackX ) {  //startPoint不是在走线架所在一列
      pointArrOut.push(new Three.Vector3(start4.x-0.3,start4.y, start4.z+0.3));
      pointArrIn.push(new Three.Vector3(start4.x+0.3,start4.y, start4.z-0.3));

      pointArrOut.push(new Three.Vector3(wireRack1.x-0.3,wireRack1.y, wireRack1.z+0.3));
      pointArrIn.push(new Three.Vector3(wireRack1.x+0.3,wireRack1.y, wireRack1.z-0.3));

      wireArr1.push(new Three.Vector3(wireRack1.x+1,wireRack1.y-1, wireRack1.z+2));
      wireArr2.push(new Three.Vector3(wireRack1.x+1,wireRack1.y-1, wireRack1.z-2));
      wireArr3.push(new Three.Vector3(wireRack1.x+1,wireRack1.y-1, wireRack1.z+1.8));
      wireArr4.push(new Three.Vector3(wireRack1.x+1,wireRack1.y-1, wireRack1.z-1.8));

      pointArrOut.push(new Three.Vector3(wireRack2.x-0.3,wireRack2.y, wireRack2.z+0.3));
      pointArrIn.push(new Three.Vector3(wireRack2.x+0.3,wireRack2.y, wireRack2.z-0.3));

      wireArr1.push(new Three.Vector3(wireRack2.x-2, wireRack2.y-1, wireRack2.z+2));
      wireArr2.push(new Three.Vector3(wireRack2.x+2, wireRack2.y-1, wireRack2.z-2));
      wireArr3.push(new Three.Vector3(wireRack2.x-1.8, wireRack2.y-1, wireRack2.z+1.8));
      wireArr4.push(new Three.Vector3(wireRack2.x+1.8, wireRack2.y-1, wireRack2.z-1.8));
    } else {
      pointArrOut.push(new Three.Vector3(start4.x-0.3,start4.y, start4.z));
      pointArrIn.push(new Three.Vector3(start4.x+0.3,start4.y, start4.z));

      pointArrOut.push(new Three.Vector3(wireRack2.x-0.3,wireRack2.y, wireRack2.z));
      pointArrIn.push(new Three.Vector3(wireRack2.x+0.3,wireRack2.y, wireRack2.z));

      wireArr1.push(new Three.Vector3(wireRack2.x-2, wireRack2.y-1, wireRack2.z+1));
      wireArr2.push(new Three.Vector3(wireRack2.x+2, wireRack2.y-1, wireRack2.z+1));
      wireArr3.push(new Three.Vector3(wireRack2.x-1.8, wireRack2.y-1, wireRack2.z+1));
      wireArr4.push(new Three.Vector3(wireRack2.x+1.8, wireRack2.y-1, wireRack2.z-1));

    }
    
    if (wireRackX !== ex) {
      pointArrOut.push(new Three.Vector3(wireRack3.x-0.3,wireRack3.y, wireRack3.z-0.3));
      pointArrIn.push(new Three.Vector3(wireRack3.x+0.3,wireRack3.y, wireRack3.z+0.3));

      wireArr1.push(new Three.Vector3(wireRack3.x-2, wireRack3.y-1, wireRack3.z-2));
      wireArr2.push(new Three.Vector3(wireRack3.x+2, wireRack3.y-1, wireRack3.z+2));
      wireArr3.push(new Three.Vector3(wireRack3.x-1.8, wireRack3.y-1, wireRack3.z-1.8));
      wireArr4.push(new Three.Vector3(wireRack3.x+1.8, wireRack3.y-1, wireRack3.z+1.8));

      pointArrOut.push(new Three.Vector3(wireRack4.x+0.3,wireRack4.y, wireRack4.z-0.3));
      pointArrIn.push(new Three.Vector3(wireRack4.x-0.3,wireRack4.y, wireRack4.z+0.3));

      wireArr1.push(new Three.Vector3(wireRack4.x+1, wireRack2.y-1, wireRack4.z-2));
      wireArr2.push(new Three.Vector3(wireRack4.x+1, wireRack2.y-1, wireRack4.z+2));
      wireArr3.push(new Three.Vector3(wireRack4.x+1, wireRack2.y-1, wireRack4.z-1.8));
      wireArr4.push(new Three.Vector3(wireRack4.x+1, wireRack2.y-1, wireRack4.z+1.8));

      [end1, end2, end3, end4].forEach((point,index)=>{
        if (index===0) {
          pointArrOut.push(new Three.Vector3(point.x+0.3,point.y, point.z-0.3));
          pointArrIn.push(new Three.Vector3(point.x-0.3,point.y, point.z+0.3));
        } else {
          pointArrOut.push(new Three.Vector3(point.x+0.3,point.y, point.z));
          pointArrIn.push(new Three.Vector3(point.x-0.3,point.y, point.z));
        }
      })
    } else {
      pointArrOut.push(new Three.Vector3(wireRack3.x-0.3,wireRack3.y, wireRack3.z));
      pointArrIn.push(new Three.Vector3(wireRack3.x+0.3,wireRack3.y, wireRack3.z));

      wireArr1.push(new Three.Vector3(wireRack3.x-2, wireRack3.y-1, wireRack3.z-1));
      wireArr2.push(new Three.Vector3(wireRack3.x+2, wireRack3.y-1, wireRack3.z-1));
      wireArr3.push(new Three.Vector3(wireRack3.x-1.8, wireRack3.y-1, wireRack3.z-1));
      wireArr4.push(new Three.Vector3(wireRack3.x+1.8, wireRack3.y-1, wireRack3.z+1));

      [end1,end2,end3,end4].forEach((point)=>{
        pointArrOut.push(new Three.Vector3(point.x-0.3,point.y, point.z));
        pointArrIn.push(new Three.Vector3(point.x+0.3,point.y, point.z));
      })
    }
  
  } else {  //在同一排
    if (sx!==ex) {  //不在同一列
      // pointArr = [start1,start2,start3,start4, wireRack1, wireRack4,end1,end2,end3,end4];
      [start1,start2,start3,start4, wireRack1, wireRack4,end1,end2,end3,end4].forEach((point,index)=>{
        if (index<3) {
          pointArrOut.push(new Three.Vector3(point.x-0.3,point.y, point.z));
          pointArrIn.push(new Three.Vector3(point.x+0.3,point.y, point.z));
        } else if (index===3 || index ===4) {
          pointArrOut.push(new Three.Vector3(point.x-0.3,point.y, point.z+0.3));
          pointArrIn.push(new Three.Vector3(point.x+0.3,point.y, point.z-0.3));
        } else if (index === 5 || index===6) {
          pointArrOut.push(new Three.Vector3(point.x+0.3,point.y, point.z+0.3));
          pointArrIn.push(new Three.Vector3(point.x-0.3,point.y, point.z-0.3));
        } else {
          pointArrOut.push(new Three.Vector3(point.x+0.3,point.y, point.z));
          pointArrIn.push(new Three.Vector3(point.x-0.3,point.y, point.z));
        }
      })
      wireArr1 = [new Three.Vector3(wireRack1.x+1, wireRack1.y-1, wireRack1.z+2), new Three.Vector3(wireRack4.x-1, wireRack4.y-1, wireRack4.z+2)];
      wireArr2 = [new Three.Vector3(wireRack1.x+1, wireRack1.y-1, wireRack1.z-2), new Three.Vector3(wireRack4.x-1, wireRack4.y-1, wireRack4.z-2)];
      wireArr3 = [new Three.Vector3(wireRack1.x+1, wireRack1.y-1, wireRack1.z+1.8), new Three.Vector3(wireRack4.x-1, wireRack4.y-1, wireRack4.z+1.8)];
      wireArr4 = [new Three.Vector3(wireRack1.x+1, wireRack1.y-1, wireRack1.z-1.8), new Three.Vector3(wireRack4.x-1, wireRack4.y-1, wireRack4.z-1.8)];
    } else {  //在同一列
      // pointArr = [start1,start2,end3,end4]
      [start1,start2,end3,end4].forEach((point)=>{
        pointArrOut.push(new Three.Vector3(point.x-0.3,point.y, point.z));
        pointArrIn.push(new Three.Vector3(point.x+0.3,point.y, point.z));
      })
    }
  }

  const pathOut = new Three.CurvePath();
  for (let i = 0; i < pointArrOut.length - 1; i++) {
    const lineCurve = new Three.LineCurve3(pointArrOut[i], pointArrOut[i + 1]); // 每两个点之间形成一条三维直线
    pathOut.curves.push(lineCurve); // curvePath有一个curves属性，里面存放组成该三维路径的各个子路径
  }
  const pathIn = new Three.CurvePath();
  for (let i = 0; i < pointArrIn.length - 1; i++) {
    const lineCurve = new Three.LineCurve3(pointArrIn[i], pointArrIn[i + 1]); // 每两个点之间形成一条三维直线
    pathIn.curves.push(lineCurve); // curvePath有一个curves属性，里面存放组成该三维路径的各个子路径
  }

  const wirePath = [...wireArr1,...wireArr2.reverse()];
  const wirePathSmall = [...wireArr3,...wireArr4.reverse()];

  return { pathOut, pathIn, wirePath, wirePathSmall};
};

export const genCable = ({start,end,positionArr,textureObj,serverDataArr}) => {
  const startP = getCablePoint(start.cabinetIndex, start.serverIndex, positionArr,serverDataArr);
  const endP = getCablePoint(end.cabinetIndex, end.serverIndex, positionArr,serverDataArr);
  const wireRackX = positionArr[5].x;
  const {pathOut, pathIn, wirePath, wirePathSmall} = getPathPoint(startP,endP,wireRackX);

  const cableArr = [];
  [pathOut, pathIn].forEach((path,index)=>{
    const geometry = new Three.TubeGeometry( path, 15000, 0.1);
    const lenArr = path.getCurveLengths();
    const len = lenArr[lenArr.length - 1];
    const texture = index > 0 ? textureObj.in : textureObj.out;
    texture.repeat.set(len/2,1);
    const material= new Three.MeshBasicMaterial({
      map: texture
    });
    const mesh = new Three.Mesh(geometry, material);
    cableArr.push(mesh);
  })

  let wire;
  if (wirePath.length && wirePathSmall.length) {
    const shape = new Three.Shape();
    wirePath.forEach((point, index)=>{
      if (index===0) {
        shape.moveTo(point.x, point.z) //移动到某个点
      } else {
        shape.lineTo(point.x, point.z)
      }
    });

    const shapeS = new Three.Shape();
    wirePathSmall.forEach((point, index)=>{
      if (index===0) {
        shapeS.moveTo(point.x, point.z) //移动到某个点
      } else {
        shapeS.lineTo(point.x, point.z)
      }
    })

    const wireGeometry = new Three.ExtrudeGeometry( shape, {
      depth:2,
      curveSegments: 1,
      bevelEnabled: false
    });
    const wireGeometrySmall = new Three.ExtrudeGeometry( shapeS, {
      depth:1.6,
      curveSegments: 1,
      bevelEnabled: false
    });
    const m= new Three.MeshBasicMaterial({color: 'red'});
    const mesh1 = new Three.Mesh(wireGeometry,m);
    const mesh2 = new Three.Mesh(wireGeometrySmall,m);
    mesh2.position.z = 0.25

    const mesh1BSP = new ThreeBSP(mesh1);
    const mesh2BSP = new ThreeBSP(mesh2);

    const resultBSP =  mesh1BSP.subtract(mesh2BSP);

    wire = resultBSP.toMesh()
    wire.geometry.computeFaceNormals();
    wire.geometry.computeVertexNormals();

    const  loader = new Three.TextureLoader();
    const wireTexture = loader.load( require("./images/wire.png").default );
    wireTexture.anisotropy = 16;
    wireTexture.wrapS=wireTexture.wrapT=Three.RepeatWrapping;

    const wireM = new Three.MeshLambertMaterial( {
      map: wireTexture,
      transparent: true,
      side: Three.DoubleSide,
    } );
    wire.material = wireM;
    wire.rotateX(Math.PI/2)
    wire.position.y = wirePath[0].y+1+1;
  }  
  return {cableArr, wire}
}
