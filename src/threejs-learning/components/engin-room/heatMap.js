import Heatmap from 'heatmap.js';
import * as Three from "three";

let timer;
let heatmapInstance

const addHeatMap = ({width,height, id}) => {
  const renderDom = document.getElementById(id);
  renderDom.style.width = `${width}px`
  renderDom.style.height = `${height}px`
  const config = {
    backgroundColor: '#fff',
    container: renderDom,
    radius: 8,
    width,
    height,
  };

  // create heatmap with configuration
  const heatmapInstance = Heatmap.create(config);

  return heatmapInstance;

 
};

const setHeatData = ({heatmapInstance,heatData,planeCenter, width, height}) => {
  const formateData = heatData.map((item)=>{
    return {
      x: item.x - planeCenter.x + parseInt(width/2),
      y: item.z - planeCenter.z + parseInt(height/2),
      value: item.value
    }
  })

  var data = {
    max: 100,
    min: 0,
    data: formateData
  };
  heatmapInstance.setData(data);
};

const getHeatData = (positions) => {
  const value = [100,80,60,40,20]
  for(let i = 0; i<5; i++){
    value[i] = Math.random() * 20 + value[i]
  }
  return positions.map((item,index)=>{
    if (index === 0) {
      item.value = value[0]
    } else if (index===1 || index===2) {
      item.value = value[1]
    } else {
      item.value = value[2]
    }
    return item 
  })
};

export const heatPlane = ({width, height, planeCenter, heatPosition, id} ) => {
  const geometry = new Three.PlaneGeometry( width, height );
  geometry.rotateX(Math.PI/2);
  const params = {
    width,
    height,
    id
  }
  heatmapInstance = addHeatMap(params);

  const heatData = getHeatData(heatPosition);
  setHeatData({heatmapInstance, heatData, planeCenter, ...params});

  const texture = new Three.CanvasTexture(heatmapInstance._renderer.canvas);

  timer = setInterval(()=>{
    console.log(88888)
    const heatData = getHeatData(heatPosition);
    setHeatData({heatmapInstance, heatData, planeCenter, ...params})
    texture.needsUpdate = true;
  },1000)
  
  texture.repeat.x =  texture.repeat.y =1;
  texture.needsUpdate = true 
  // const material = new Three.MeshBasicMaterial( {color: 'red', side: Three.DoubleSide} );
  const material = new Three.MeshBasicMaterial( {map: texture, side: Three.DoubleSide,transparent: true,} );
  const plane = new Three.Mesh( geometry, material );
  plane.position.set(planeCenter.x,0.06,planeCenter.z);

  return plane;
}

export const disposeHeatMap = () =>{
  if (timer) {
    clearInterval(timer);
  };
  const canvas = heatmapInstance._renderer.canvas; 
  canvas.remove();
  heatmapInstance = undefined;
}