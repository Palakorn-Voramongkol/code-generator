/**
 * Relationship Markdown Generator
 *
 * This JavaScript program reads relationship data from a JSON input file,
 * processes the data to interpret different types of relationships (many-to-many,
 * one-to-many, and one-to-one), and generates a formatted Markdown file
 * summarizing these relationships.
 *
 * Usage:
 *   node createDBRelationshipMD.js <inputFile> <outputFile>
 *
 * Parameters:
 *   inputFile  - Path to the JSON file containing relationship data.
 *   outputFile - Path where the generated Markdown file will be saved.
 *
 * Example:
 *   node createDBRelationshipMD.js ./data/relationships.json ./output/relationships.md
 *
 * Dependencies:
 *   - Node.js
 *   - pluralize (for accurate pluralization)
 *
 * To install dependencies, run:
 *   npm install pluralize
 *
 * Author: OpenAI ChatGPT
 * Date: 2024-04-27
 */

const fs = require("fs");
const path = require("path");
const pluralize = require("pluralize");

/**
 * Capitalizes the first letter of a string.
 *
 * @param {string} str - The input string.
 * @returns {string} The string with the first letter capitalized.
 */
function capitalizeFirstLetter(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Pluralizes a word using the 'pluralize' library.
 *
 * @param {string} str - The word to pluralize.
 * @returns {string} The plural form of the word.
 */
function pluralizeWord(str) {
  return pluralize(str);
}

/**
 * Adds a relationship entry to the relationships map.
 *
 * @param {Map<string, Array>} map - The map storing relationships for each entity.
 * @param {string} entity1 - The primary entity in the relationship.
 * @param {string} relationship - The relationship symbol (e.g., '>--<', '----').
 * @param {string} entity2 - The related entity in the relationship.
 * @param {string} details - A descriptive detail of the relationship.
 */
function addRelationship(
  map,
  entity1,
  relationship,
  entity2,
  details
) {
  const entry = {
    entity1,
    relationship,
    entity2,
    details,
  };
  if (!map.has(entity1)) {
    map.set(entity1, []);
  }
  map.get(entity1).push(entry);
}

/**
 * Generates Markdown content summarizing the relationships.
 *
 * @param {Object} data - The input data containing relationship information.
 * @returns {string} A string containing the formatted Markdown.
 */
function generateRelationshipsMarkdown(data) {
  // Map for real entity relationships (one-to-many and one-to-one)
  const realEntityRelationshipsMap = new Map();

  // Step 1: Collect all junction table names
  const junctionTableNames = new Set(
    data.manyToMany.map((relation) => relation.junctionTable.name)
  );

  // Step 2: Process oneToMany relationships
  data.oneToMany.manyToOne.forEach((relation) => {
    const many = capitalizeFirstLetter(relation.many.name);
    const manyField = relation.many.field;
    const one = capitalizeFirstLetter(relation.one.name);
    const oneField = relation.one.field;

    // Avoid processing if 'many' or 'one' is a junction table
    if (junctionTableNames.has(many) || junctionTableNames.has(one)) {
      return;
    }

    // Details for 'many' entity
    const detailsMany = `${pluralizeWord(many)} belong to a ${one}`;
    addRelationship(realEntityRelationshipsMap, many, ">---", one, detailsMany);

    // Details for 'one' entity
    const detailsOne = `${one} has many ${capitalizeFirstLetter(pluralizeWord(oneField))}`;
    addRelationship(realEntityRelationshipsMap, one, "---<", many, detailsOne);
  });

  // Step 3: Process oneToOne relationships
  data.oneToOne.forEach((relation) => {
    const table_one = capitalizeFirstLetter(relation.table_one.name);
    const field_one = relation.table_one.field;
    const table_two = capitalizeFirstLetter(relation.table_two.name);
    const field_two = relation.table_two.field;

    // Avoid processing if either table is a junction table
    if (
      junctionTableNames.has(table_one) ||
      junctionTableNames.has(table_two)
    ) {
      return;
    }

    // Details for table_one
    const detailsOne = `${table_one} has one ${capitalizeFirstLetter(field_one)}`;
    addRelationship(
      realEntityRelationshipsMap,
      table_one,
      "----",
      table_two,
      detailsOne
    );

    // Details for table_two
    const detailsTwo = `${table_two} has one ${capitalizeFirstLetter(field_two)}`;
    addRelationship(
      realEntityRelationshipsMap,
      table_two,
      "----",
      table_one,
      detailsTwo
    );
  });

  // Step 4: Process manyToMany relationships
  data.manyToMany.forEach((relation) => {
    const [entry1, entry2] = relation.relationTable;
    const entity1 = capitalizeFirstLetter(entry1.name);
    const entity2 = capitalizeFirstLetter(entry2.name);
    const junctionName = relation.junctionTable.name;

    // Avoid processing if either entity is a junction table
    if (junctionTableNames.has(entity1) || junctionTableNames.has(entity2)) {
      return;
    }

    // Details indicating a many-to-many relationship via the junction table
    const details = `${entity1} has many ${pluralizeWord(entity2)} via ${junctionName}`;
    addRelationship(
      realEntityRelationshipsMap,
      entity1,
      ">--<",
      entity2,
      details
    );

    // Add a reciprocal relationship entry for entity2 pointing to entity1
    const reverseDetails = `${entity2} has many ${pluralizeWord(entity1)} via ${junctionName}`;
    addRelationship(
      realEntityRelationshipsMap,
      entity2,
      ">--<",
      entity1,
      reverseDetails
    );
  });

  // Generate Markdown for real entity relationships
  let markdown = `# Entity Relationships\n\n`;

  // Sort entities alphabetically, optionally prioritizing 'User'
  const entities = Array.from(realEntityRelationshipsMap.keys()).sort(
    (a, b) => {
      if (a === "User") return -1;
      if (b === "User") return 1;
      return a.localeCompare(b);
    }
  );

  entities.forEach((entity) => {
    markdown += `## Relationships for [${entity}]\n`;
    markdown += `| Entity 1 | Relationship | Entity 2 | Details |\n`;
    markdown += `|----------|--------------|----------|---------|\n`;
    const relationships = realEntityRelationshipsMap.get(entity);
    if (relationships) {
      relationships.forEach((rel) => {
        markdown += `| ${rel.entity1} | ${rel.relationship} | ${rel.entity2} | ${rel.details} |\n`;
      });
    }
    markdown += `\n`;
  });

  // Step 5: Generate Markdown for junction tables
  if (data.manyToMany.length > 0) {
    markdown += `# Junction Tables\n\n`;

    // Sort junction tables alphabetically
    const sortedJunctionTables = data.manyToMany.sort((a, b) =>
      a.junctionTable.name.localeCompare(b.junctionTable.name)
    );

    sortedJunctionTables.forEach((relation) => {
      const junctionName = relation.junctionTable.name;
      const [entity1, entity2] = relation.relationTable;
      const field1Key = `${entity1.name}Field`;
      const field2Key = `${entity2.name}Field`;
      const field1 = relation.junctionTable[field1Key];
      const field2 = relation.junctionTable[field2Key];

      markdown += `## Junction Table: [${junctionName}]\n`;
      markdown += `| Entity 1 | Field 1 | Entity 2 | Field 2 |\n`;
      markdown += `|----------|---------|----------|---------|\n`;
      markdown += `| ${capitalizeFirstLetter(entity1.name)} | ${field1} | ${capitalizeFirstLetter(entity2.name)} | ${field2} |\n\n`;

      markdown += `### Relationships:\n`;
      markdown += `- **${capitalizeFirstLetter(entity1.name)}** has many **${pluralizeWord(entity2.name)}** via **${junctionName}**.\n`;
      markdown += `- **${capitalizeFirstLetter(entity2.name)}** has many **${pluralizeWord(entity1.name)}** via **${junctionName}**.\n\n`;
    });
  }

  return markdown;
}

/**
 * Main function to execute the program.
 */
function main() {
  // Extract command-line arguments
  const args = process.argv.slice(2);

  // Validate the number of arguments
  if (args.length !== 2) {
    console.error("Error: Incorrect number of arguments.");
    console.error(
      "Usage: node createDBRelationshipMD.js <inputFile> <outputFile>"
    );
    process.exit(1);
  }

  const inputFilePath = path.resolve(args[0]);
  const outputFilePath = path.resolve(args[1]);

  // Check if the input file exists
  if (!fs.existsSync(inputFilePath)) {
    console.error(
      `Error: Input file does not exist at path "${inputFilePath}".`
    );
    process.exit(1);
  }

  // Read and parse the input JSON file
  let inputData;
  try {
    const fileContent = fs.readFileSync(inputFilePath, "utf-8");
    inputData = JSON.parse(fileContent);
  } catch (error) {
    console.error("Error: Failed to read or parse the input JSON file.");
    console.error(error);
    process.exit(1);
  }

  // Generate the Markdown content
  const markdownOutput = generateRelationshipsMarkdown(inputData);

  // Ensure the output directory exists
  const outputDir = path.dirname(outputFilePath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write the Markdown content to the output file
  try {
    fs.writeFileSync(outputFilePath, markdownOutput, "utf-8");
    console.log(`Success: Markdown file generated at "${outputFilePath}".`);
  } catch (error) {
    console.error("Error: Failed to write to the output file.");
    console.error(error);
    process.exit(1);
  }
}

// Execute the main function
main();
