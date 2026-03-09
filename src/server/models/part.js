import mongoose from "mongoose";

const partSchema = new mongoose.Schema({
    name: { type: String, required: true }, 
    icon: { type: String, default: '📦' },   
    desc: { type: String },                  
    fileName: { type: String, required: true }
});


const partsContainerSchema = new mongoose.Schema({
    setName: { type: String, default: "all_parts", immutable: true, unique: true }, 
    version: { type: Number, default: 1, required: true },
    parts: [partSchema] 
}, { timestamps: true });

// This creates a collection called 'parts'
export const Parts = mongoose.model('Part', partsContainerSchema);