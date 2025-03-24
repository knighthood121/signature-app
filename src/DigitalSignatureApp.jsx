import React, { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { PDFDocument } from 'pdf-lib';
import { Download, RefreshCw, Palette, Minus, Plus } from 'lucide-react';

function DigitalSignatureApp() {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatures, setSignatures] = useState([]);
  const [currentTool, setCurrentTool] = useState(null); // 'image', 'text', 'draw', 'signature'
  const [drawingPoints, setDrawingPoints] = useState([]);
  const [drawings, setDrawings] = useState([]);
  const [drawColor, setDrawColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);
  const [angle, setAngle] = useState(0);
  const [hasContent, setHasContent] = useState(false);
  const fileInputRef = useRef(null);
  const signaturePadRef = useRef(null);
  const canvasRef = useRef(null);

  // Handle file name change when new document is selected
  useEffect(() => {
    if (selectedDoc) {
      setFileName(selectedDoc.name);
    }
  }, [selectedDoc]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      const url = URL.createObjectURL(file);
      const newDoc = {
        id: Date.now(),
        name: file.name,
        url: url,
        file: file
      };
      setDocuments([...documents, newDoc]);
      setSelectedDoc(newDoc);
      setFileName(file.name);
    }
  };

  const handleSave = async () => {
    if (!selectedDoc || !canvasRef.current) return;
    
    try {
      const pdfDoc = await PDFDocument.load(await selectedDoc.file.arrayBuffer());
      const pages = pdfDoc.getPages();
      const page = pages[0];
      
      // Convert canvas to image and embed in PDF
      const drawingDataUrl = canvasRef.current.toDataURL('image/png');
      const drawingBytes = await fetch(drawingDataUrl).then(res => res.arrayBuffer());
      const drawingImage = await pdfDoc.embedPng(drawingBytes);
      
      // Add drawing as an overlay
      page.drawImage(drawingImage, {
        x: 0,
        y: 0,
        width: page.getWidth(),
        height: page.getHeight(),
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `signed_${fileName}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error saving PDF:', error);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      const input = fileInputRef.current;
      input.files = e.dataTransfer.files;
      handleFileUpload({ target: input });
    }
  };

  // Initialize canvas when component mounts
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set initial canvas properties
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getCoordinates = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e, canvas);
    
    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e, canvas);
    
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasContent(true);
  };

  const endDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasContent(false);
  };

  const downloadSignature = () => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'signature.png';
    link.href = dataUrl;
    link.click();
  };

  const handleColorChange = (e) => {
    const newColor = e.target.value;
    setDrawColor(newColor);
    const ctx = canvasRef.current.getContext('2d');
    ctx.strokeStyle = newColor;
  };

  const handleWidthChange = (e) => {
    const newWidth = parseInt(e.target.value);
    setLineWidth(newWidth);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineWidth = newWidth;
  };

  const rotateCanvas = (newAngle) => {
    setAngle(newAngle);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Save the current canvas state
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, 0, 0);
    
    // Clear and rotate
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width/2, canvas.height/2);
    ctx.rotate(newAngle * Math.PI / 180);
    ctx.translate(-canvas.width/2, -canvas.height/2);
    ctx.drawImage(tempCanvas, 0, 0);
    ctx.restore();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Draw your eSignature
          </h1>
          <p className="text-gray-600">
            Use your mouse or touch screen to create your signature
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Canvas Container */}
          <div className="p-8 border-b border-gray-100">
            <div className="relative border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 hover:border-blue-200 transition-colors">
              <canvas
                ref={canvasRef}
                width={800}
                height={250}
                className="w-full touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={endDrawing}
                onMouseLeave={endDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={endDrawing}
                style={{
                  background: 'white',
                  cursor: 'crosshair',
                  borderRadius: '0.75rem'
                }}
              />
              {!isDrawing && !hasContent && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
                  <span>Click and drag to sign</span>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="bg-gray-50 p-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Left Controls */}
              <div className="space-y-4">
                {/* Color Picker */}
                <div className="flex items-center gap-3">
                  <Palette className="w-5 h-5 text-gray-500" />
                  <input
                    type="color"
                    value={drawColor}
                    onChange={handleColorChange}
                    className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-200"
                  />
                </div>

                {/* Width Control */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Minus className="w-4 h-4" />
                      Line Width
                      <Plus className="w-4 h-4" />
                    </label>
                    <span className="text-sm text-gray-500">{lineWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={lineWidth}
                    onChange={handleWidthChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>

                {/* Angle Control */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" />
                      Rotation
                    </label>
                    <span className="text-sm text-gray-500">{angle}°</span>
                  </div>
                  <input
                    type="range"
                    min="-30"
                    max="30"
                    value={angle}
                    onChange={(e) => rotateCanvas(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              </div>

              {/* Right Controls - Action Buttons */}
              <div className="flex flex-col justify-end gap-3">
                <button
                  onClick={clearCanvas}
                  className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-600 hover:bg-gray-100 hover:border-gray-300 transition-all"
                >
                  <RefreshCw className="w-5 h-5" />
                  Clear Signature
                </button>
                <button
                  onClick={downloadSignature}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 rounded-xl text-white hover:bg-blue-600 transition-colors"
                >
                  <Download className="w-5 h-5" />
                  Download Signature
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          Your signature will be downloaded as a transparent PNG file
        </div>
      </div>
    </div>
  );
}

export default DigitalSignatureApp;