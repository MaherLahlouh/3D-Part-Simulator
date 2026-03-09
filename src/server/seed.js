import mongoose from 'mongoose';
import { Parts } from './models/part.js'; // Ensure this path matches your schema file
import dotenv from 'dotenv';

dotenv.config();

//this code is just for the first time to seed components in the database if you want to use it again it need some edits

const my38PartsArray = [
    { name: '9V-battery', icon: '🔋', desc: 'Power source', fileName: '9v-battery.glb' },
    { name: 'basic_arduino_uno', icon: '⚡', desc: 'Essential Arduino board', fileName: 'basic_arduino_uno.glb' },
    { name: 'chassis', icon: '🧱', desc: 'Main frame', fileName: 'chassis_-SL.glb' },
    { name: 'holding_board__9V', icon: '📦', desc: 'Mounting surface', fileName: 'holding_board__9V.glb' },
    { name: 'L293D', icon: '🔌', desc: 'Motor driver IC', fileName: 'l293d.glb' },
    { name: 'master_wheel', icon: '🛞', desc: 'Drive wheel', fileName: 'master_wheel.glb' },
    { name: 'Mechacnical_track_Yellow', icon: '🧲', desc: 'Motion system', fileName: 'Mechachical_track_Yellow.glb' },
    { name: 'Motor', icon: '⚙️', desc: 'DC motor', fileName: 'N20DCMotor.glb' },
    { name: 'slave_wheel_SL', icon: '🛞', desc: 'Support wheel', fileName: 'slave_wheel_SL.glb' },
    { name: 'breadboard', icon: '📟', desc: 'Prototyping board', fileName: 'breadboard.glb' },

    { name: 'led_light', icon: '💡', desc: 'Light emitting diode with original colors', fileName: 'led_light.glb' },
    { name: '1k_ohm_resistor', icon: '🔲', desc: '1000Ω current limiter', fileName: '1k_ohm_resistor.glb' },
    { name: '10k_ohm_resistor', icon: '🔳', desc: '10000Ω resistor', fileName: '10k_ohm_resistor.glb' },
    { name: 'ir_sensor_module', icon: '👁️', desc: 'Infrared proximity sensor', fileName: 'ir_sensor_module.glb' },
    { name: '162__lcd_display', icon: '📺', desc: '16x2 character display', fileName: '162__lcd_display.glb' },
    { name: 'servo', icon: '⚙️', desc: 'Precision servo motor', fileName: 'servo.glb' },
    { name: 'buzzer', icon: '🔊', desc: 'Audio feedback module', fileName: 'arduino_module_buzzer.glb' },
    { name: 'ultrasonic', icon: '📡', desc: 'Distance measurement sensor', fileName: 'hc_sr04.glb' },
    { name: 'dht11', icon: '🌡️', desc: 'Temperature and humidity sensor', fileName: 'modulo_sensor_de_umidade_e_temperatura_dht11.glb' },
    { name: 'mq2', icon: '💨', desc: 'LPG, CO, and smoke detection sensor', fileName: 'mq2_lpg_co_smoke_gas_sensor.glb' },
    { name: 'pir_sensor', icon: '👤', desc: 'Motion detection sensor', fileName: 'pir_sensor.glb' },
    { name: 'rfid_module', icon: '📇', desc: 'RFID read/write module', fileName: 'rfid_readwrite_module_rc522.glb' },

    { name: 'part_1', icon: '🏠', desc: 'Building component', fileName: 'part_1.glb' },
    { name: 'part_2', icon: '🏘️', desc: 'Building component', fileName: 'part_2.glb' },
    { name: 'part_3', icon: '🏚️', desc: 'Building component', fileName: 'part_3.glb' },
    { name: 'part_4', icon: '🏗️', desc: 'Building component', fileName: 'part_4.glb' },
    { name: 'part_5', icon: '🧱', desc: 'Building component', fileName: 'part_5.glb' },
    { name: 'part_6', icon: '🏛️', desc: 'Building component', fileName: 'part_6.glb' },
    { name: 'part_7', icon: '🪟', desc: 'Building component', fileName: 'part_7.glb' },
    { name: 'part_8', icon: '🚪', desc: 'Building component', fileName: 'part_8.glb' },
    { name: 'part_9', icon: '🪜', desc: 'Building component', fileName: 'part_9.glb' },
    { name: 'part_10', icon: '🏠', desc: 'Building component', fileName: 'part_10.glb' },
    { name: 'part_11', icon: '🧱', desc: 'Building component', fileName: 'part_11.glb' },
    { name: 'part_12', icon: '🪟', desc: 'Building component', fileName: 'part_12.glb' },
    { name: 'part_13', icon: '🚪', desc: 'Building component', fileName: 'part_13.glb' },
    { name: 'part_14', icon: '🪜', desc: 'Building component', fileName: 'part_14.glb' },
    { name: 'part_15', icon: '🏗️', desc: 'Building component', fileName: 'part_15.glb' }
];

const seedDatabase = async () => {
    try {
        // 1. Connect to MongoDB
        await mongoose.connect(process.env.DATABASE_URI);
        console.log("🔌 Connected to MongoDB...");

        // 2. Wipe the collection (To avoid duplicating the 'all_parts' document)
        await Parts.deleteMany({});
        console.log("🧹 Collection cleared...");

        // 3. Create the single master document
        await Parts.create({
            setName: "all_parts",
            // Note: version and updatedAt are handled by our schema settings!
            parts: my38PartsArray
        });

        console.log("🌱 Successfully seeded 38 parts into 'all_parts' document!");
        localStorage.removeItem('parts_menu'); 

        // 4. Close connection
        mongoose.connection.close();
        process.exit();
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
};

seedDatabase();