import fs from "fs";
import path from "path";

/**
 * Program to save string content to a file. Ensures that the necessary directories are created.
 *
 * Parameters:
 * - content: The string content to be saved to the file.
 * - filePath: The path to the output file where the content will be written.
 *
 * Usage:
 * 1. Run the program with the following command:
 *    node saveContent.js <content> <outputFile>
 *
 *    Example:
 *    node saveContent.js "This is a sample content." ./output/sample.txt
 *
 * Output:
 * - The program will save the content to the specified output file.
 *
 * Returns:
 * - 0 if the operation succeeds.
 * - -1 if an error occurs, along with the reason for failure.
 */

// Function to save string content to a file
function saveContentToFile(content, filePath) {
  try {
    const directoryPath = path.dirname(filePath);

    // Ensure the directory exists, if not, create it
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }

    // Write content to the file
    fs.writeFileSync(filePath, content, "utf-8");
    console.log(`Content successfully saved to ${filePath}`);
    return 0; // Return 0 on success
  } catch (error) {
    console.error(`Error saving content to file ${filePath}:`, error);
    return -1; // Return -1 on failure
  }
}

// Get command-line arguments (content and file path)
const content = process.argv[2];
const outputFile = process.argv[3];

// Ensure both content and output file are provided
if (!content || !outputFile) {
  console.error("Usage: node saveContent.js <content> <outputFile>");
  process.exit(-1);
}

// Call the function to save content to the file
const result = saveContentToFile(content, outputFile);
process.exit(result); // Exit with the result status (0 or -1)
