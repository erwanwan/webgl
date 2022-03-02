import TWEEN from "@tweenjs/tween.js";

const genTween = (target,arr,i, cb)=>{
  new TWEEN.Tween(target)
    .to(arr[i], 2000)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .delay(1000)
    .onComplete(()=>{
      if (i<arr.length-1) {
        genTween(target,arr,i+1, cb)
      } else {
        if (cb) {
          cb();
        }
      }
        
    })
    .start();
}

export const autoCruise = ({camera,scene,SERVER_DATA_ARR,orbitControls,setShowAlarm}) => {
  const index = 2;
  const leftRoonDoor = scene.children.find((child)=>child.name==='left-room-door')
  const rightRoonDoor = scene.children.find((child)=>child.name==='right-room-door')
  const cabinetGroup = scene.children.find((child)=> child.name==="cabinet-group") 
  const cabinet = cabinetGroup.children.find((child)=>child.name===`${index+1}机柜`)   //`${index+1}机柜`;
  const cabinetDoorGroup = cabinet.children.find((child)=>child.name==="cabinet-door-group")

  const serverArr = SERVER_DATA_ARR[index].filter((item)=>item.height);
  const serverIndex = Math.round(Math.random()*(serverArr.length -1));
  const serverObjArr = cabinet.children.filter((item)=>item.name==="server")
  const server = serverObjArr[serverIndex];
  // console.log(cabinet)

  const cameraPath = [{x: -53.25533548868843, y: 7.60388516391132, z: -14.183491066165473},]
  const targetPath = [{ x: 0.9039391858749566, y: 0.8920769299045499, z: -11.789837223241074 }]

  const i = Math.ceil(index/6);

  // if (i===2) {
  //   cameraPath.push({x:-39.19048699340177,y:9.820688039020009,z:-10.723842622414688})
  //   targetPath.push({x:-38.767859298511425,y:9.419714991607014,z:0.39953575100856414})
  // } else if (i===3) {
  //   cameraPath.push({x:-39.16109597827743,y:6.945568781561623,z:8.516881411484526})
  //   targetPath.push({x:-33.37639030818647,y:13.715008283719609,z:54.49763535067959})
  // }

  cameraPath.push({ x: cabinet.position.x, y: cabinet.position.y+10, z: cabinet.position.z+23 })
  targetPath.push({ x: cabinet.position.x, y: cabinet.position.y+8, z: cabinet.position.z+5 })

  new TWEEN.Tween(leftRoonDoor.rotation)
    .to({x:0,y:-Math.PI/2,z:0}, 1000)
    .onUpdate(function (val) {
      leftRoonDoor.rotation.set(val.x || 0, val.y || 0, val.z || 0);
    })
    .start();

  new TWEEN.Tween(rightRoonDoor.rotation)
    .to({x:0,y:Math.PI/2,z:0}, 1000)
    .onUpdate(function (val) {
      rightRoonDoor.rotation.set(val.x || 0, val.y || 0, val.z || 0);
    })
    .start();

  genTween(camera.position, cameraPath,0, ()=> {
    new TWEEN.Tween(cabinetDoorGroup.rotation)
    .to({x:0,y:Math.PI/2,z:0}, 1000)
    .onUpdate(function (val) {
      cabinetDoorGroup.rotation.set(val.x || 0, val.y || 0, val.z || 0);
    })
    .onComplete(()=>{
      // const z = parent.position.z > 0.25 ? 0.25 : 2.25
      new TWEEN.Tween(server.position)
        .to({x:server.position.x,y:server.position.y,z: 2.25}, 500)
        .start();

      setShowAlarm(true)
    })
    .start();
  });
  genTween(orbitControls.target, targetPath,0);
}