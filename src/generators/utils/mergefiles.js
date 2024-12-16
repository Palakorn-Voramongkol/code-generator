"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Program to read content from multiple files, merge them into a single string, and write the result to an output file.
 *
 * Parameters:
 * - outputFile: The file where the merged result will be written.
 * - filePaths: One or more file paths whose content will be merged.
 *
 * Usage:
 * 1. Compile the TypeScript file to JavaScript:
 *    tsc mergeFiles.ts
 *
 * 2. Run the compiled program with the following command:
 *    node mergeFiles.js <outputFile> <file1> <file2> <file3> ...
 *
 *    Example:
 *    node mergeFiles.js ./output.txt ./file1.txt ./file2.txt ./file3.txt
 *
 * Output:
 * - The program will save the merged content to the specified output file.
 *
 * Returns:
 * - 0 if the operation succeeds.
 * - -1 if an error occurs, along with the reason for failure.
 */
/**
 * Reads content from multiple files, merges them into a single string, and writes the result to an output file.
 *
 * @param outputFile - The file where the merged result will be written.
 * @param filePaths - One or more file paths whose content will be merged.
 * @returns 0 if the operation succeeds, -1 if an error occurs.
 */
function mergeFilesContent(outputFile, ...filePaths) {
    let mergedContent = "";
    // Loop through each file path and append the content
    for (const filePath of filePaths) {
        try {
            const absolutePath = path.resolve(filePath);
            // Check if the file exists before attempting to read
            if (!fs.existsSync(absolutePath)) {
                console.error(`Error: File not found at path "${absolutePath}".`);
                return -1; // Return -1 if any file does not exist
            }
            const fileContent = fs.readFileSync(absolutePath, "utf-8");
            mergedContent += fileContent + "\n"; // Add file content with a newline
        }
        catch (error) {
            console.error(`Error reading file "${filePath}":`, error);
            return -1; // Return -1 on failure to read any file
        }
    }
    try {
        const absoluteOutputPath = path.resolve(outputFile);
        // Ensure the output directory exists; if not, create it
        const outputDir = path.dirname(absoluteOutputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        // Write the merged content to the output file
        fs.writeFileSync(absoluteOutputPath, mergedContent.trim(), "utf-8");
        console.log(`Merged content successfully written to "${absoluteOutputPath}".`);
    }
    catch (error) {
        console.error(`Error writing to output file "${outputFile}":`, error);
        return -1; // Return -1 on failure to write to the output file
    }
    return 0; // Return 0 on success
}
// Retrieve command-line arguments (output file and file paths)
const args = process.argv.slice(2);
const outputFile = args[0];
const filePaths = args.slice(1);
// Ensure output file and at least one file path are provided
if (!outputFile || filePaths.length === 0) {
    console.error("Usage: node mergeFiles.js <outputFile> <file1> <file2> <file3> ...");
    process.exit(-1);
}
// Call the function to merge file contents and write to the output file
const result = mergeFilesContent(outputFile, ...filePaths);
process.exit(result); // Exit with the result status (0 or -1)
