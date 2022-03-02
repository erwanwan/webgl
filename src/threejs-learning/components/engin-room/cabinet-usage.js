import * as Three from "three";

export const genCabinetUsageData = (serverData) => {
  const usageData = serverData.reduce((acc,item,index)=>{
    if(index===0) {
      acc.push({
        usable: !item.height,
        height: item.height || 1
      })
    } else {
      if(!!item.height === !!serverData[index-1].height) {
        const last = acc[acc.length-1];
        acc[acc.length-1].height = last.height+(item.height || 1);
      } else {
        acc.push({
          usable: !item.height,
          height: item.height || 1
        })
      }
    }
    return acc
  },[])
  return usageData;
}

const usedMaterial = new Three.MeshPhongMaterial({
  color: '#f7f7f7',
  // shininess: 500,
  // specular: 'red'
});

const unUsedData = [
  {
    height: 1,
    color: 'red',
    opacity: 0.5
  },
  {
    height: 2,
    color: '#efda25'
  },
  {
    height: 3,
    color: '#39d5ef'
  },
  {
    color: '#2ce880'
  }
]

const unUsedMaterial = unUsedData.map((item)=>{
  return {
    height: item.height,
    material :new Three.MeshPhongMaterial({
      color: item.color,
      opacity: item.opacity || 0.7,
      transparent: true
    })
  }
})

export const genCabinetUsageArea = (serverData) => {
  const usageData = genCabinetUsageData(serverData);
  const cabinetUsageGroup = new Three.Group();
  usageData.forEach((item,index)=>{
    const geometry1 = item.usable ? new Three.BoxBufferGeometry(7.7,item.height,5.7) : new Three.BoxBufferGeometry(8,item.height,6);
    // const geometry2 = new Three.BoxBufferGeometry(8,0.2,6);
    const unUsedM = unUsedMaterial.find((m)=>m.height===item.height) || unUsedMaterial[3]
    const material = item.usable ? unUsedM.material : usedMaterial;
    const mesh = new Three.Mesh(geometry1,material);

    // const mesh2=new Three.Mesh(geometry2,transparentMaterial)
    let offsetY = 0;
    for(let i = 0;i<index;i++) {
      offsetY = offsetY + usageData[i].height
    }
    mesh.position.set(0,offsetY+item.height/2,0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    cabinetUsageGroup.add(mesh)
  })
  return cabinetUsageGroup
}


const boxGeometry = new Three.BoxBufferGeometry(8,15,6);
const edges = new Three.EdgesGeometry( boxGeometry );
const boxLine = new Three.LineSegments( edges, new Three.LineBasicMaterial( { color: 0xffffff } ) );

export const cabinetUsage = (percent) => {
  const group = new Three.Group();

  // const geometry = new Three.BoxBufferGeometry(8,15*percent,6);
  const geometry = new Three.BoxBufferGeometry(8,0.1,6);
  const material = new Three.MeshPhongMaterial();  //HSL(0.4,0.8,0.5) ~ HSL(0,0.8,0.5)就是从绿色到红色
  material.color.setHSL(0.4 - 0.4 * percent, 0.8, 0.5);
  const mesh = new Three.Mesh(geometry, material);
  // mesh.position.set(0, 15*percent / 2 - 15/2 ,0)
  mesh.position.set(0, 0.1 / 2 - 15/2 ,0)
  group.add(mesh);

  const boxCopy = boxLine.clone();
  group.add(boxCopy);


  group.userData.height = 15*percent;
  group.userData.up = true;
  group.userData.loop = 1;

  return group;
}