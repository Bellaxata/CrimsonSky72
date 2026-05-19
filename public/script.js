let currentFileContent = null;
let currentFileName = null;

// DOM elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const removeFileBtn = document.getElementById('removeFileBtn');
const encryptBtn = document.getElementById('encryptBtn');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const outputCode = document.getElementById('outputCode');
const hashInfo = document.getElementById('hashInfo');
const expiryInfo = document.getElementById('expiryInfo');
const statsInfo = document.getElementById('statsInfo');

// Expiry mode elements
const expiryModes = document.querySelectorAll('input[name="expiryMode"]');
const daysModeInput = document.getElementById('daysModeInput');
const dateModeInput = document.getElementById('dateModeInput');
const daysSlider = document.getElementById('daysSlider');
const daysValue = document.getElementById('daysValue');
const datePicker = document.getElementById('datePicker');
const datePreview = document.getElementById('datePreview');

// Set min date to today
const today = new Date().toISOString().split('T')[0];
datePicker.min = today;

// Toggle expiry mode inputs
expiryModes.forEach(mode => {
  mode.addEventListener('change', () => {
    if (mode.value === 'days') {
      daysModeInput.style.display = 'block';
      dateModeInput.style.display = 'none';
    } else if (mode.value === 'date') {
      daysModeInput.style.display = 'none';
      dateModeInput.style.display = 'block';
    } else {
      daysModeInput.style.display = 'none';
      dateModeInput.style.display = 'none';
    }
  });
});

// Days slider
daysSlider.addEventListener('input', () => {
  daysValue.textContent = daysSlider.value + ' days';
});

// Date picker preview
datePicker.addEventListener('change', () => {
  const selected = new Date(datePicker.value);
  const formatted = selected.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  datePreview.textContent = `Expires on: ${formatted}`;
});

// Preset day buttons
document.querySelectorAll('.preset-day').forEach(btn => {
  btn.addEventListener('click', () => {
    const days = btn.getAttribute('data-days');
    daysSlider.value = days;
    daysValue.textContent = days + ' days';
  });
});

// File upload handlers
browseBtn.addEventListener('click', () => {
  fileInput.click();
});

uploadArea.addEventListener('click', (e) => {
  if (e.target !== browseBtn && !fileInput.contains(e.target)) {
    fileInput.click();
  }
});

uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('drag-over');
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    handleFile(files[0]);
  }
});

fileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    handleFile(e.target.files[0]);
  }
});

function handleFile(file) {
  if (!file.name.match(/\.(js|mjs|txt)$/i)) {
    alert('Please upload a .js, .mjs, or .txt file');
    return;
  }
  
  if (file.size > 5 * 1024 * 1024) {
    alert('File too large! Maximum 5MB');
    return;
  }
  
  currentFileName = file.name;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    currentFileContent = e.target.result;
    
    fileName.textContent = file.name;
    fileSize.textContent = `(${(file.size / 1024).toFixed(2)} KB)`;
    fileInfo.style.display = 'flex';
    uploadArea.style.display = 'none';
    encryptBtn.disabled = false;
    
    outputCode.textContent = 'Ready to obfuscate with 23 protection layers...';
    hashInfo.innerHTML = '';
    expiryInfo.innerHTML = '';
    statsInfo.innerHTML = '';
  };
  reader.readAsText(file);
}

removeFileBtn.addEventListener('click', () => {
  currentFileContent = null;
  currentFileName = null;
  fileInfo.style.display = 'none';
  uploadArea.style.display = 'block';
  encryptBtn.disabled = true;
  outputCode.textContent = 'Waiting for file upload...';
  hashInfo.innerHTML = '';
  expiryInfo.innerHTML = '';
  statsInfo.innerHTML = '';
  copyBtn.disabled = true;
  downloadBtn.disabled = true;
});

// Get expiry settings
function getExpirySettings() {
  const selectedMode = document.querySelector('input[name="expiryMode"]:checked').value;
  
  if (selectedMode === 'off') {
    return { mode: 'off', value: 7 };
  } else if (selectedMode === 'days') {
    return { mode: 'days', value: parseInt(daysSlider.value) };
  } else {
    const dateValue = datePicker.value;
    if (!dateValue) {
      alert('Please select an expiry date');
      return null;
    }
    return { mode: 'date', value: dateValue };
  }
}

// Encrypt function
encryptBtn.addEventListener('click', async () => {
  if (!currentFileContent) {
    alert('Please upload a file first');
    return;
  }
  
  const expiry = getExpirySettings();
  if (!expiry) return;
  
  encryptBtn.classList.add('loading');
  encryptBtn.disabled = true;
  encryptBtn.innerHTML = '<span class="btn-icon">💀</span> OBFUSCATING (23 LAYERS)...';
  outputCode.textContent = '🔒 Applying 23 protection layers...\n⏱️ This may take 20-40 seconds...\n\n';
  
  try {
    const response = await fetch('/api/encrypt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: currentFileContent,
        expiryMode: expiry.mode,
        expiryValue: expiry.value
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      outputCode.textContent = data.obfuscated;
      
      hashInfo.innerHTML = `
        🔐 SECURITY HASH: ${data.hash.substring(0, 32)}...
        <br>🛡️ SIGNATURE: ${data.signature}
        <br>⚠️ Any modification will break the code
      `;
      
      let expiryText = '';
      if (expiry.mode === 'days') {
        const expiryDate = new Date(Date.now() + (expiry.value * 24 * 60 * 60 * 1000));
        expiryText = `Expires after ${expiry.value} days (${expiryDate.toLocaleDateString()})`;
      } else if (expiry.mode === 'date') {
        expiryText = `Expires on ${new Date(expiry.value).toLocaleDateString()}`;
      } else {
        expiryText = 'No expiry - permanent license';
      }
      
      expiryInfo.innerHTML = `
        ⏰ TIMEBOMB: ${expiryText}
        <br>📞 Contact: <a href="${data.contact}" target="_blank" style="color:#ff3366">@Xatanicvxii on Telegram</a>
      `;
      
      statsInfo.innerHTML = `
        📊 Original: ${data.stats.originalSize} bytes | 
        Obfuscated: ${data.stats.obfuscatedSize} bytes | 
        Ratio: ${data.stats.ratio}
        <br>🛡️ Protection Layers: ${data.stats.layers} | Anti-Debug Methods: ${data.stats.antiDebugMethods}
      `;
      
      copyBtn.disabled = false;
      downloadBtn.disabled = false;
      
      encryptBtn.innerHTML = '<span class="btn-icon">✅</span> OBFUSCATED!';
      setTimeout(() => {
        encryptBtn.innerHTML = '<span class="btn-icon">💀</span> OBFUSCATE (23 LAYERS)';
      }, 2000);
    } else {
      outputCode.textContent = `❌ Error: ${data.error}`;
      expiryInfo.innerHTML = `Contact ${data.contact} for support`;
    }
    
  } catch (error) {
    outputCode.textContent = `❌ Network error: ${error.message}\n\nPlease make sure the server is running.`;
  } finally {
    encryptBtn.classList.remove('loading');
    encryptBtn.disabled = false;
  }
});

// COPY OUTPUT - FIXED
copyBtn.addEventListener('click', async () => {
  const text = outputCode.textContent;
  if (text && !text.includes('Waiting') && !text.includes('OBFUSCATING') && !text.includes('Error') && text !== 'Ready to obfuscate with 23 protection layers...') {
    try {
      await navigator.clipboard.writeText(text);
      const originalText = copyBtn.innerHTML;
      copyBtn.innerHTML = '✓ Copied!';
      setTimeout(() => {
        copyBtn.innerHTML = originalText;
      }, 1500);
    } catch (err) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      copyBtn.innerHTML = '✓ Copied!';
      setTimeout(() => {
        copyBtn.innerHTML = '📋 Copy';
      }, 1500);
    }
  }
});

// DOWNLOAD OUTPUT - FIXED
downloadBtn.addEventListener('click', () => {
  const text = outputCode.textContent;
  if (text && !text.includes('Waiting') && !text.includes('OBFUSCATING') && !text.includes('Error') && text !== 'Ready to obfuscate with 23 protection layers...') {
    try {
      const blob = new Blob([text], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const baseName = currentFileName ? currentFileName.replace(/\.(js|mjs|txt)$/i, '') : 'protected';
      const expiryMode = document.querySelector('input[name="expiryMode"]:checked').value;
      a.href = url;
      a.download = `${baseName}_nuclear_${expiryMode}.js`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      const originalText = downloadBtn.innerHTML;
      downloadBtn.innerHTML = '✓ Downloaded!';
      setTimeout(() => {
        downloadBtn.innerHTML = originalText;
      }, 1500);
    } catch (err) {
      console.error('Download error:', err);
      alert('Error downloading file: ' + err.message);
    }
  } else {
    alert('No obfuscated code to download. Please obfuscate a file first.');
  }
});