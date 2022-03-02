import * as Three from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

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

export const caculatePosition = () => {
  const itemz = 90/3;
  const itemx = 90/8;
  const arr = [];
  for(let i=0; i<3; i++) {

    const offestZ = [0,-4,-8];
    const z =  itemz*i + itemz/2 - 45 + offestZ[i] ;  //-3是z轴上的便宜防止最后一排开门超出围墙
    for(let j=0; j<8; j++) {
      const x = itemx*j + itemx/2 - 45;
      if (j>0 && j<7) {
        arr.push({x,z,row:i+1,col:j+1});
      }
      
    }
  }
  return arr;
}

export const getTopParent = (child, topName) =>{
  if (child.parent.parent && child.parent.parent.name !== topName) {
    return getTopParent(child.parent, topName);
  } else {
    return child.parent;
  }
}

export const clearLabel = (cabinetGroup) => {
  cabinetGroup.children.forEach((server)=> {
    const labelObj = server.children.find((item)=>item.name===`${server.name}-label`);
    if (labelObj) {
      server.remove(labelObj);
    }
  })
}

export const loadGltfModel = (model) => {
  const loader = new GLTFLoader();
  //加载压缩过的文件需要这个
  const dracoLoader = new DRACOLoader();
  //指定包含 WASM/JS 解码库的文件夹的路径。
  // dracoLoader.setDecoderPath( 'https://threejs.org/examples/js/libs/draco/gltf/' );
  dracoLoader.setDecoderPath( '/draco/gltf/' );
  loader.setDRACOLoader( dracoLoader );
  return new Promise((resolve,reject)=>{
    loader.load(model, resolve, function ( xhr ) {
      console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
    },  reject)
  });
}

export const genServerData = () => {
  let index=0;
  const data=[];
  while(index<14){  //机柜高14
    const radom = Math.random()*3;
    const height = radom < 1 ? 0 : Math.round(Math.random()*3);  //服务器高度为1，2，3  随机生成服务器高度
    const nextIndex = height ? index+height : index+1;
    if (nextIndex<15)  {
      data.push({
        index,
        height
      });
    }
    index=nextIndex;
  }
  const last = data[data.length-1];
  let nextIndex = last.height ? last.index + last.height : last.index+1 
  if (last.index < 14) {  //数据没有撑满一整个机柜
    while( nextIndex<14){
      data.push({
        index: nextIndex,
        height:0,
      });
      nextIndex++;
    }
  }
  return data
  
}