import { Parts } from '../models/part.js'; 

export async function getParts (req, res)  {
    try {
        const library = await Parts.findOne({ setName: "all_parts" });
        if (!library) return res.status(404).json({ message: "Library not found" });
        
        res.status(200).json(library.parts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export async function updatePart (req, res) {
    const { name } = req.params;
    const updates = { ...req.body };

    const allowedFields = ["icon", "desc", "fileName"];

    // Filter only allowed fields
    const filteredUpdates = {};
    for (const key of allowedFields) {
        if (updates[key] !== undefined) {
            filteredUpdates[key] = updates[key];
        }
    }

    // If no valid fields were provided
    if (Object.keys(filteredUpdates).length === 0) {
        return res.status(400).json({message: "No valid fields provided for update"});
    }

    const setFields = {};
    for (const key in filteredUpdates) {
        setFields[`parts.$.${key}`] = filteredUpdates[key];
    }

    try {
        const updatedParts = await Parts.findOneAndUpdate(
            { setName: "all_parts", "parts.name": name },
            { $set: setFields },
            { new: true, runValidators: true }
        );

        if (!updatedParts) {
            return res.status(404).json({message: "Part or Library not found"});
        }

        res.status(200).json({message: "Part updated successfully"});

    } catch (error) {
        res.status(500).json({message: error.message});
    }
};

export async function deletePart (req, res)  {
    const { name } = req.params; 

    try {
        const updatedParts = await Parts.findOneAndUpdate(
            { setName: "all_parts" }, 
            { 
                $pull: { parts: { name: name } } 
            },
            { new: true } 
        );

        if (!updatedParts) {
            return res.status(404).json({ message: "Library document not found." });
        }

        res.status(200).json({ 
            message: `Successfully removed '${name}' from the library.`,
            remainingCount: updatedParts.parts.length 
        });
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ message: "Failed to remove part from library." });
    }
};


export async function addPart (req, res) {
    const { name, icon, fileName, desc } = req.body;

    if (!name) {
        return res.status(400).json({ message: "Part name is required" });
    }

    const newPart = {
        name,
        icon: icon , 
        desc: desc || "",
        fileName: fileName  
    };

    try {
        const updatedLibrary = await Parts.findOneAndUpdate(
            { 
                setName: "all_parts", 
                "parts.name": { $ne: name } 
            },
            { $push: { parts: newPart } },
            { new: true, runValidators: true }
        );


        if (!updatedLibrary) {
            return res.status(409).json({ message: "Could not add part. Either the library is missing or a part with this name already exists." });
        }

        res.status(201).json({ message: "New part added successfully"});

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};