import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';



export const compileArduinoSketch = async (req, res) => {
    
    const { sketch } = req.body;
    
    if (!sketch) {
        return res.status(400).json({ message: "No source code provided" });
    }

    //  Create a unique folder for this specific build to avoid conflicts
    const buildId = `build_${Date.now()}`;
    const buildDir = path.join(process.cwd(), 'temp', buildId);
    const sketchPath = path.join(buildDir, `${buildId}.ino`);

    if (!fs.existsSync(buildDir)) {
        fs.mkdirSync(buildDir, { recursive: true });
    }

    try {
        // Save the code to the temporary file
        fs.writeFileSync(sketchPath, sketch);

        //  The Arduino CLI Command
        // --fqbn: The board (Arduino Uno)
        // --output-dir: Where to put the resulting .hex file
        const command = `arduino-cli compile --fqbn arduino:avr:uno --output-dir ${buildDir} ${sketchPath}`;

        console.log(`Executing: ${command}`);

        exec(command, (error, stdout, stderr) => {
            //  Read the generated HEX file
            const hexPath = path.join(buildDir, `${buildId}.ino.hex`);
            
            let hexData = null;
            if (fs.existsSync(hexPath)) {
                hexData = fs.readFileSync(hexPath, 'utf8');
            }

            //  Cleanup: Delete the temporary build folder
            fs.rmSync(buildDir, { recursive: true, force: true });

            if (error) {
                return res.status(400).json({
                    message: "Compilation Failed",
                    stdout,
                    stderr
                });
            }

            // Success! Send the HEX back to the simulator
            res.json({
                stdout,
                stderr,
                hex: hexData
            });
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal Server Error during compilation" });
    }

}