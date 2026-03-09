
import { buildHex } from './compile';
import { CPUPerformance } from './cpu-performance';
import { AVRRunner } from './execute';
import { formatTime } from './format-time';


const BLINK_HEX = `
:100000000C9434000C943E000C943E000C943E0082
:100010000C943E000C943E000C943E000C943E0078
:100020000C943E000C943E000C943E000C943E0068
:100030000C943E000C943E000C943E000C943E0058
:100040000C943E000C943E000C943E000C943E0048
:100050000C943E000C943E000C943E000C943E0038
:100060000C943E000C943E0011241FBECFEFD8E080
:10007000DEBFCDBF0E9440000C9451000C940000CA
:100080008FEF84B1816084B98FEF84B18E7F84B9E3
:100090002FEF33E081E0215030408040E1F700C09C
:1000A0000000F1CF0000FFCF212F312F112420F013
:1000B00021503040F1F701901124E1F70895F89419
:00000001FF
`.trim();

// Set up toolbar
let runner: AVRRunner | null = null;

const runButton = document.getElementById('runCodeBtn') as HTMLButtonElement;
if (runButton) {
  runButton.addEventListener('click', compileAndRun);
  console.log("🚀 AVR EXECUTOR: Run button initialized.");
}

const stopButton = document.getElementById('stopCodeBtn') as HTMLButtonElement;
if (stopButton) {
  stopButton.addEventListener('click', stopCode);
}

const resetButton = document.getElementById('resetSimulatorBtn') as HTMLButtonElement;
if (resetButton) {
  resetButton.addEventListener('click', () => { });
}
//need to be added after initialize them in the index.html
const statusLabel = document.querySelector('#compileOutput');

// const compilerOutputText = document.querySelector('#compiler-output-text');
// const serialOutputText = document.querySelector('#serial-output-text');

function executeProgram(hex: string) {
  runner = new AVRRunner(hex);
  const MHZ = 16000000;
  const cpuPerf = new CPUPerformance(runner.cpu, MHZ);
  console.log("🚀 AVR EXECUTOR: virtual cpu created.");
  runner.execute((cpu) => {
    const time = formatTime(cpu.cycles / MHZ);
    const speed = (cpuPerf.update() * 100).toFixed(0);
    if (statusLabel) {
      statusLabel.textContent = `Simulation time: ${time} (${speed}%)`;
    }
  });
}

async function compileAndRun() {
  const arduinoCode = (window as any).getMonacoCode();


  console.log("🚀 AVR EXECUTOR: Compiling and running code...");
  //storeUserSnippet();

  runButton.setAttribute('disabled', '1');
  resetButton.setAttribute('disabled', '1');

  try {
    if (statusLabel) {
      statusLabel.textContent = 'Compiling...';
    }
    const result = await buildHex(arduinoCode);
    console.log("🚀 AVR EXECUTOR: this the code i get from monaco editor:", arduinoCode);
    if (!result.hex) {
      console.error("❌ AVR EXECUTOR: Hex is NULL or Empty!");
    } else {
      console.log("🚀 AVR EXECUTOR: Hex received successfully:", result.hex);
      console.log("🚀 AVR EXECUTOR: Hex received successfully:", arduinoCode);

    }
    //compilerOutputText.textContent = result.stderr || result.stdout;
    if (result.hex) {
      stopButton.removeAttribute('disabled');
      console.log("🚀 AVR EXECUTOR: Compilation successful, executing program.");
      executeProgram(result.hex);
    } else {
      runButton.removeAttribute('disabled');
    }
  } catch (err) {
    runButton.removeAttribute('disabled');
    resetButton.removeAttribute('disabled');
    alert('Failed: ' + err);
  }
  finally {
    if (statusLabel) {
      statusLabel.textContent = '';
    }
  }
}



function stopCode() {
  stopButton.setAttribute('disabled', '1');
  runButton.removeAttribute('disabled');
  resetButton.removeAttribute('disabled');
  if (runner) {
    runner.stop();
    runner = null;
  }
}


