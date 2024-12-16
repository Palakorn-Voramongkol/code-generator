import * as fs from "fs";
import * as path from "path";

/**
 * Recursively deletes a directory and all of its contents.
 *
 * @param directoryPath - The path of the directory to delete.
 *
 * Usage:
 * - Call the function with the directory path you wish to delete.
 *
 * Example:
 * ```typescript
 * deleteDirectory("./path/to/directory");
 * ```
 *
 * Notes:
 * - This function synchronously deletes files and directories.
 * - Use with caution as it will permanently remove files.
 *
 * Returns:
 * - void
 */
function deleteDirectory(directoryPath: string): void {
  if (fs.existsSync(directoryPath)) {
    fs.readdirSync(directoryPath).forEach((file) => {
      const curPath = path.join(directoryPath, file);
      const stats = fs.lstatSync(curPath);
      if (stats.isDirectory()) {
        // Recurse into subdirectory
        deleteDirectory(curPath);
      } else {
        // Delete file
        fs.unlinkSync(curPath);
      }
    });
    // Remove the now-empty directory
    fs.rmdirSync(directoryPath);
  }
}
