const workercode = () => {
  onmessage = function(e) {
    // console.log('Message received from main script');
    // var workerResult = 'Received from main: ' + (e.data);
    // console.log('Posting message back to main script');

    // console.log(e.data,1111)

    const lineLenArr = e.data;

    setInterval(()=>{
      const newColors = [];

      lineLenArr.forEach((lineAttr)=>{
        if (lineAttr.colors.length) {
          if (lineAttr.index < lineAttr.colors.length / 3 - 1) {
            lineAttr.index = lineAttr.index + 1;
          } else {
            lineAttr.index = 0;
          }
    
          const b = lineAttr.colors.slice(lineAttr.index * 3);
          const f = lineAttr.colors.slice(0, lineAttr.index * 3);
          const newColorArray = [].concat(b, f) ;
    
          //模拟复杂的变化运算
          for(let j=1, total=1; j<=2000000; j++) {
            total += j;
          }
    
          // aniLine.geometry.setColors( newColorArray );
          newColors.push(newColorArray)
    
        } else {
          newColors.push([])
        }
      })

      postMessage(newColors);

    },1000/60*9)
     // here it's working without self
  }
};
// 把脚本代码转为string
let code = workercode.toString();
code = code.substring(code.indexOf("{")+1, code.lastIndexOf("}"));
 
const blob = new Blob([code], {type: "application/javascript"});
const worker_script = URL.createObjectURL(blob);


export default worker_script;