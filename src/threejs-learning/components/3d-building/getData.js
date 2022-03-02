import { SRGB8_ALPHA8_ASTC_12x12_Format } from "three";
import obj2gltf from 'obj2gltf';


export const getTerrain = () => {
  let a = document.createElement('a');
  // a.href = '/API/globaldem?demtype=SRTMGL3&south=30.5681&north=30.5910&west=104.0439&east=104.0819&outputFormat=GTiff'; // 文件流生成的url
  a.href = '/API/globaldem?demtype=SRTMGL3&south=30.5207&north=30.6186&west=103.9823&east=104.2197&outputFormat=GTiff'; // 文件流生成的url
  document.body.appendChild(a);
  a.click();
  a.remove();
  // fetch('/API/globaldem?demtype=SRTMGL3&south=36.738884&north=38.091337&west=-120.168457&east=-118.465576&outputFormat=GTiff', {
  //   method: "GET",
  //   // headers: {
  //   //   "Content-Type": "text/plain;charset=UTF-8"
  //   // },
  //   // body: undefined,
  //   // referrer: "about:client",
  //   // referrerPolicy: "no-referrer-when-downgrade",
  //   // mode: "cors", 
  //   // credentials: "same-origin",
  //   // cache: "default",
  //   // redirect: "follow",
  //   // integrity: "",
  //   // keepalive: false,
  //   // signal: undefined
  // }).then((res)=>{
  //   console.log(res)
  //   // console.log(res.headers['content-disposition'])
  //   res.body.getReader().read()
    



  // }).then((file)=>{

  //   let blob = new Blob([file], { type: 'image/tiff' });

  //   let URL = window.URL || window.webkitURL;
  //   let objectUrl = URL.createObjectURL(blob);
  //   let a = document.createElement('a');
  //   a.href = objectUrl; // 文件流生成的url
  //   a.download = 'chengdu'; // 文件名
  //   document.body.appendChild(a);
  //   a.click();
  //   a.remove();
  // });

}

export const getOsmData = (data) => {
  const formData = new FormData();
  formData.append('data',  data);

  fetch('/api/interpreter', {
    method: 'POST',
    body: formData
  })

//   var formData = new FormData();
// var fileField = document.querySelector("input[type='file']");

// formData.append('username', 'abc123');
// formData.append('avatar', fileField.files[0]);

// fetch('https://example.com/profile/avatar', {
//   method: 'PUT',
//   body: formData
// })
.then(response => console.log(response))

}

export const objToGltf = () => {
  obj2gltf(require('./model/tree-obj/tree-05.obj').default)
    .then(function(gltf) {
        const data = Buffer.from(JSON.stringify(gltf));
        const blob = new Blob([data]);
        let URL = window.URL || window.webkitURL;
        let objectUrl = URL.createObjectURL(blob);
        let a = document.createElement('a');
        a.href = objectUrl; // 文件流生成的url
        a.download = 'chengdu'; // 文件名
        document.body.appendChild(a);
        a.click();
        a.remove();
    });
}
 
