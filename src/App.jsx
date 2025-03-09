import React, { useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
function App() {
  const [pencolor,setPencolor]=useState('black')
  const [signature,setSignature] = useState();
  const [result,setResult]=useState();
  const clearHandler=() =>{
     signature.clear()
     setResult(null)
  }
  const saveHandler=() =>{
      
     const sig = signature.toDataURL();
     console.log(sig)
     setResult(sig)
  }
  return (
    <div>
      <h1>Digital Signature </h1>
        <select value={pencolor} onChange={(e)=>setPencolor(e.target.value)} >
          <option value="red">red</option>
          <option value="blue">blue</option>
          <option value="green">green</option>
        </select>
        <div style={{height:"20px",width:"10px" ,borderRadius:"50%", backgroundColor:`${pencolor}`}}>

        </div>
      <div style={{width:500, height:200, border:'1px solid '}} >
      <SignatureCanvas
      ref={(ref) => setSignature(ref)}
      penColor={pencolor}
    canvasProps={{width: 500, height: 200, className: 'sigCanvas'}} />
      </div>
      <button onClick={clearHandler}>Clear </button>
      <button onClick={saveHandler}>Save</button>
      {
        result && (
          <div> 
            <img src={result}/>
          </div>
        )
      }
    </div>

  )
}

export default App