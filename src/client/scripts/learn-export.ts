// @ts-nocheck

// Store reference to prevent concurrent exports
let isExporting = false;

/**
 * Export Circuit as Image (Enhanced for 3D Scene)
 * Supports PNG, JPG with Babylon.js screenshot capabilities
 */
function exportCircuitAsImage(format = 'png') {
  if (isExporting) {
    if (typeof showNotification === 'function') {
      showNotification('Export already in progress...', 'warning');
    }
    return;
  }

  // Check if Babylon.js scene exists
  if (!window.scene || !window.engine) {
    alert('No 3D scene to export. Please load components first.');
    return;
  }

  // Ask user for scale (resolution multiplier)
  let scale = 2;
  const scaleInput = prompt('Enter export scale (1 = normal, 2 = high quality, 3 = ultra HD):', '2');
  const parsed = parseFloat(scaleInput);
  if (!isNaN(parsed) && parsed > 0 && parsed <= 4) {
    scale = parsed;
  }

  isExporting = true;
  const exportBtn = document.getElementById('exportCircuitBtn');
  if (exportBtn) {
    exportBtn.disabled = true;
    exportBtn.style.opacity = '0.6';
    exportBtn.style.pointerEvents = 'none';
  }

  if (typeof showNotification === 'function') {
    showNotification('Capturing 3D scene...', 'info');
  }

  performBabylonExport(format, scale);
}

function performBabylonExport(format: string, scale = 2) {
  try {
    const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement | null;
    if (!canvas) {
      throw new Error('Render canvas not found');
    }

    BABYLON.Tools.CreateScreenshotUsingRenderTarget(
      window.engine,
      window.scene.activeCamera,
      { 
        width: canvas.width * scale, 
        height: canvas.height * scale,
        precision: scale
      },
      (data) => {
        downloadImage(data, format);
        if (typeof showNotification === 'function') {
          showNotification(`Circuit exported as ${format.toUpperCase()}`, 'success');
        }
        finishExport();
      },
      'image/png',
      1,
      false
    );
  } catch (error) {
    console.error('Babylon.js export error:', error);
    fallbackCanvasExport(format, scale);
  }
}

function fallbackCanvasExport(format: string, scale = 2) {
  console.log('Using fallback canvas export method...');
  
  const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement | null;
  if (!canvas) {
    alert('Canvas not found. Cannot export.');
    finishExport();
    return;
  }

  try {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width * scale;
    tempCanvas.height = canvas.height * scale;
    const ctx = tempCanvas.getContext('2d');
    
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
    }
    
    const dataUrl = tempCanvas.toDataURL(`image/${format}`, 0.95);
    downloadImage(dataUrl, format);
    
    if (typeof showNotification === 'function') {
      showNotification(`Circuit exported as ${format.toUpperCase()}`, 'success');
    }
  } catch (error) {
    console.error('Fallback export error:', error);
    alert('Failed to export. Please try again.');
  } finally {
    finishExport();
  }
}

/**
 * Export Schematic View as PNG
 */
function exportSchematicView() {
  if (isExporting) {
    if (typeof showNotification === 'function') {
      showNotification('Export already in progress...', 'warning');
    }
    return;
  }

  isExporting = true;
  const exportBtn = document.getElementById('exportCircuitBtn');
  if (exportBtn) {
    exportBtn.disabled = true;
    exportBtn.style.opacity = '0.6';
    exportBtn.style.pointerEvents = 'none';
  }

  if (typeof showNotification === 'function') {
    showNotification('Exporting schematic view...', 'info');
  }

  const schematicCanvas = document.getElementById('schematicCanvas') as HTMLCanvasElement | null;
  const schematicSVG = document.getElementById('schematicSVG') as SVGElement | null;

  if (schematicCanvas && schematicCanvas instanceof HTMLCanvasElement) {
    exportCanvasAsPNG(schematicCanvas);
  } else if (schematicSVG && schematicSVG instanceof SVGElement) {
    exportSVGAsPNG(schematicSVG);
  } else {
    const schematicContainer = document.getElementById('schematicView');
    if (schematicContainer) {
      if (typeof html2canvas !== 'undefined') {
        html2canvas(schematicContainer).then(canvas => {
          const dataUrl = canvas.toDataURL('image/png');
          downloadImage(dataUrl, 'png');
          if (typeof showNotification === 'function') {
            showNotification('Schematic exported as PNG', 'success');
          }
          finishExport();
        }).catch(err => {
          console.error('Schematic export failed:', err);
          alert('Failed to export schematic. html2canvas error.');
          finishExport();
        });
        return;
      } else {
        alert('html2canvas is required to export schematic view. Please include it in your page.');
        finishExport();
        return;
      }
    }

    alert('Schematic view not found. Please ensure one of the following exists:\n- <canvas id="schematicCanvas">\n- <svg id="schematicSVG">\n- <div id="schematicView">');
    finishExport();
    return;
  }
}

function exportCanvasAsPNG(canvas: HTMLCanvasElement) {
  const scale = 2;
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width * scale;
  tempCanvas.height = canvas.height * scale;
  const ctx = tempCanvas.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
  }
  const dataUrl = tempCanvas.toDataURL('image/png');
  downloadImage(dataUrl, 'png');
  if (typeof showNotification === 'function') {
    showNotification('Schematic exported as PNG', 'success');
  }
  finishExport();
}

function exportSVGAsPNG(svgElement: SVGElement) {
  const serializer = new XMLSerializer();
  let source = serializer.serializeToString(svgElement);
  source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

  const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onload = () => {
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    }
    const dataUrl = canvas.toDataURL('image/png');
    downloadImage(dataUrl, 'png');
    URL.revokeObjectURL(svgUrl);
    if (typeof showNotification === 'function') {
      showNotification('Schematic exported as PNG', 'success');
    }
    finishExport();
  };
  img.onerror = () => {
    URL.revokeObjectURL(svgUrl);
    alert('Failed to load schematic SVG for export.');
    finishExport();
  };
  img.src = svgUrl;
}

/**
 * Export Project as PDF Documentation
 */
function exportProjectToPDF() {
  if (isExporting) {
    if (typeof showNotification === 'function') {
      showNotification('Export already in progress...', 'warning');
    }
    return;
  }

  if (typeof window.jspdf === 'undefined') {
    alert('PDF library not loaded. Please refresh the page and try again.');
    return;
  }

  if (!window.scene || !window.engine) {
    alert('No 3D scene to export. Please load components first.');
    return;
  }

  isExporting = true;
  const exportBtn = document.getElementById('exportPDFBtn');
  if (exportBtn) {
    exportBtn.disabled = true;
    exportBtn.style.opacity = '0.6';
    exportBtn.style.pointerEvents = 'none';
  }

  if (typeof showNotification === 'function') {
    showNotification('Generating PDF documentation...', 'info');
  }

  const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement | null;
  if (!canvas) {
    alert('Canvas not found. Cannot export PDF.');
    finishExport();
    return;
  }

  try {
    BABYLON.Tools.CreateScreenshotUsingRenderTarget(
      window.engine,
      window.scene.activeCamera,
      { 
        width: canvas.width * 2, 
        height: canvas.height * 2,
        precision: 2
      },
      (screenshotData) => {
        generatePDFWithScreenshot(screenshotData);
      },
      'image/png',
      1,
      false
    );
  } catch (error) {
    console.error('PDF screenshot error:', error);
    alert('Failed to generate PDF. Please try again.');
    finishExport();
  }
}

function generatePDFWithScreenshot(screenshotData: string) {
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    
    const timestamp = new Date().toLocaleString();
    const componentCount = window.scene?.meshes?.filter(m => m.metadata?.isComponent)?.length || 0;
    const wireCount = window.allWires?.length || 0;
    
    doc.setFontSize(20);
    doc.setTextColor(39, 174, 96);
    doc.text('TAA Simulator - Project Documentation', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Generated: ${timestamp}`, 20, 35);
    doc.text(`Components: ${componentCount} | Wires: ${wireCount}`, 20, 42);
    
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 48, 190, 48);
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Circuit Design', 20, 58);
    
    const imgWidth = 170;
    const imgHeight = 120;
    doc.addImage(screenshotData, 'PNG', 20, 65, imgWidth, imgHeight);
    
    let yPosition = 195;
    if (window.scene && window.scene.meshes) {
      doc.setFontSize(14);
      doc.text('Component List', 20, yPosition);
      yPosition += 8;
      
      doc.setFontSize(10);
      const components = window.scene.meshes
        .filter(m => m.metadata?.isComponent)
        .map(m => m.metadata?.componentName || m.name);
      
      components.forEach((comp, index) => {
        if (yPosition > 280) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(`${index + 1}. ${comp}`, 25, yPosition);
        yPosition += 6;
      });
    }
    
    const codeTextarea = document.getElementById('arduinoCode') as HTMLTextAreaElement | null;
    if (codeTextarea && codeTextarea.value.trim() !== '') {
      doc.addPage();
      doc.setFontSize(14);
      doc.text('Arduino Code', 20, 20);
      
      doc.setFontSize(9);
      doc.setFont('courier');
      const code = codeTextarea.value;
      const lines = doc.splitTextToSize(code, 170);
      
      let codeY = 30;
      lines.forEach(line => {
        if (codeY > 280) {
          doc.addPage();
          codeY = 20;
        }
        doc.text(line, 20, codeY);
        codeY += 5;
      });
    }
    
    const pdfTimestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    doc.save(`TAA-Project-${pdfTimestamp}.pdf`);
    
    if (typeof showNotification === 'function') {
      showNotification('PDF exported successfully!', 'success');
    }
  } catch (error) {
    console.error('PDF generation error:', error);
    alert('Failed to generate PDF: ' + error.message);
  } finally {
    finishExport();
  }
}

function downloadImage(dataUrl: string, format: string) {
  const link = document.createElement('a');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  
  if (format === 'jpg' || format === 'jpeg') {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      }
      link.download = `circuit-3d-${timestamp}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.click();
    };
    img.src = dataUrl;
  } else {
    link.download = `circuit-3d-${timestamp}.${format}`;
    link.href = dataUrl;
    link.click();
  }
}

function finishExport() {
  isExporting = false;
  ['exportCircuitBtn', 'exportPDFBtn'].forEach(id => {
    const btn = document.getElementById(id) as HTMLButtonElement | null;
    if (btn) {
      btn.disabled = false;
      btn.style.opacity = '';
      btn.style.pointerEvents = '';
    }
  });
}

function showExportMenu(button: HTMLElement) {
  const existingMenu = document.getElementById('exportMenu');
  if (existingMenu) {
    existingMenu.remove();
  }

  const menu = document.createElement('div');
  menu.id = 'exportMenu';
  menu.className = 'export-menu';
  menu.style.cssText = `
    position: fixed;
    background: rgba(30, 30, 30, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    padding: 8px;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 220px;
    backdrop-filter: blur(10px);
  `;

  const formats = [
    { label: '📸 Export as PNG', format: 'png', desc: 'High quality with transparency', type: 'image' },
    { label: '🖼️ Export as JPG', format: 'jpg', desc: 'Smaller file size', type: 'image' },
    { label: '📄 Export as PDF', format: 'pdf', desc: 'Complete project documentation', type: 'pdf' },
    { label: '🔌 Export Schematic View', format: null, desc: '2D wiring diagram (PNG)', type: 'schematic' }
  ];

  formats.forEach(({ label, format, desc, type }) => {
    const btn = document.createElement('button');
    btn.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 2px;">
        <span style="font-weight: 600;">${label}</span>
        <span style="font-size: 11px; opacity: 0.7;">${desc}</span>
      </div>
    `;
    btn.style.cssText = `
      padding: 10px 12px;
      border: none;
      background: transparent;
      text-align: left;
      cursor: pointer;
      border-radius: 6px;
      font-size: 13px;
      transition: background 0.2s;
      color: white;
    `;
    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'rgba(255, 255, 255, 0.1)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'transparent';
    });
    btn.onclick = () => {
      menu.remove();
      if (type === 'pdf') {
        exportProjectToPDF();
      } else if (type === 'schematic') {
        exportSchematicView();
      } else {
        exportCircuitAsImage(format);
      }
    };
    menu.appendChild(btn);
  });

  const rect = button.getBoundingClientRect();
  menu.style.left = rect.left + 'px';
  menu.style.top = (rect.bottom + 5) + 'px';

  document.body.appendChild(menu);

  setTimeout(() => {
    document.addEventListener('click', function closeMenu(e) {
      if (!menu.contains(e.target) && e.target !== button) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    });
  }, 0);
}

// Expose globally
(window as any).exportCircuitAsImage = exportCircuitAsImage;
(window as any).exportProjectToPDF = exportProjectToPDF;
(window as any).exportSchematicView = exportSchematicView;
(window as any).showExportMenu = showExportMenu;

console.log('✅ Export utilities loaded for 3D Babylon.js scene with PDF and Schematic support');