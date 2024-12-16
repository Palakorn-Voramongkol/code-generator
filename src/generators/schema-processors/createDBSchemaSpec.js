// scripts/createDBSchemaSpec.js

/**
 * Schema Specification Generator for Prisma Models.
 *
 * This script reads a Prisma schema file and generates a JSON schema containing detailed
 * specifications of each model's fields, including information about default values,
 * system-managed flags, and relation indicators.
 *
 * Usage:
 *   node scripts/createDBSchemaSpec.js <output_json_path> <prisma_schema_path>
 *
 * Example:
 *   node scripts/createDBSchemaSpec.js input/DBschemaSpec2.json input/schema.prisma
 */

const { getDMMF } = require("@prisma/internals");
const fs = require("fs");
const path = require("path");

/**
 * Generates the original Prisma schema line for a given field based on its properties.
 *
 * @param {Object} field - The field object containing its properties.
 * @returns {string} The Prisma schema line for the field.
 */
function generateOriginalLine(field) {
  const parts = [];

  // Field name and type
  parts.push(`${field.name} ${field.type}${field.isList ? '[]' : ''}`);

  // Directives
  const directives = [];

  if (field.isId) {
    directives.push("@id");
  }

  if (field.isUnique) {
    directives.push("@unique");
  }

  if (field.hasDefaultValue) {
    // Handle default values based on type and kind
    if (field.type === "Int" && field.defaultValue === "autoincrement()") {
      directives.push("@default(autoincrement())");
    } else if (field.type === "String") {
      const defaultVal = typeof field.defaultValue === 'string' ? `"${field.defaultValue}"` : field.defaultValue;
      directives.push(`@default(${defaultVal})`);
    } else if (field.type === "DateTime") {
      if (typeof field.defaultValue === 'string' && field.defaultValue === "now()") {
        directives.push("@default(now())");
      } else if (typeof field.defaultValue === 'object' && field.defaultValue.name === 'now') {
        directives.push("@default(now())");
      }
    } else if (field.type === "Boolean") {
      const defaultVal = field.defaultValue !== undefined ? field.defaultValue : false;
      directives.push(`@default(${defaultVal})`);
    } else {
      // Generic default value
      if (typeof field.defaultValue === 'object') {
        // Handle function-based defaults like now(), autoincrement(), etc.
        directives.push(`@default(${field.defaultValue.name}(${field.defaultValue.args.join(', ')}))`);
      } else {
        directives.push(`@default(${JSON.stringify(field.defaultValue)})`);
      }
    }
  }

  if (field.isUpdatedAt) {
    directives.push("@updatedAt");
  }

  if (field.relationName) {
    // Handle relation directives
    const relationParts = [`@relation("${field.relationName}"`];
    if (field.references) {
      relationParts.push(`references: [${field.references.join(', ')}]`);
    }
    relationParts.push(')');
    directives.push(relationParts.join(' '));
  }

  if (directives.length > 0) {
    parts.push(directives.join(' '));
  }

  return parts.join(' ');
}

/**
 * Retrieves specifications of each model’s fields, including flags for system management and relations.
 *
 * @param {Object} dmmf - The Prisma DMMF schema information.
 * @returns {Object} A JSON object containing detailed field specifications for each model.
 */
const getAllTableFieldsSpec = (dmmf) => {
  return dmmf.datamodel.models.reduce((acc, model) => {
    acc[model.name] = {
      name: model.name,
      dbName: model.dbName,
      fields: model.fields.reduce((fieldsAcc, field) => {
        // Extract default value if present
        let defaultValue = null;
        if (field.default) {
          if (typeof field.default === 'object' && field.default.kind === 'literal') {
            defaultValue = field.default.value;
          } else if (typeof field.default === 'object' && field.default.kind === 'now') {
            defaultValue = 'now()';
          } else if (typeof field.default === 'object' && field.default.kind === 'autoincrement') {
            defaultValue = 'autoincrement()';
          } else {
            defaultValue = field.default; // Fallback
          }
        }

        // Determine if the field is system-managed based on the specified properties
        const isPrimaryKeySystemManaged =
          field.isId === true && field.hasDefaultValue === true;

        const originalLine = generateOriginalLine({
          name: field.name,
          type: field.type,
          isList: field.isList,
          isId: field.isId,
          isUnique: field.isUnique,
          hasDefaultValue: field.hasDefaultValue,
          defaultValue: defaultValue,
          isUpdatedAt: field.isUpdatedAt || false,
          relationName: field.relationName,
          references: field.references || null,
        });

        const isUpdatedAtSystemManaged =
          field.type === 'DateTime' &&
          originalLine &&
          originalLine.includes('@updatedAt');

        const isCreatedAtSystemManaged =
          field.type === 'DateTime' &&
          originalLine &&
          originalLine.includes('@default(now())');

        const isSystemManaged =
          isPrimaryKeySystemManaged ||
          isUpdatedAtSystemManaged ||
          isCreatedAtSystemManaged;

        // Determine if the field is a relation
        const isRelation = field.kind === 'object' && field.type !== 'Json';

        // Debugging: Uncomment to log field processing details
        // console.log(`Processing field: ${field.name}, isSystemManaged: ${isSystemManaged}, isRelation: ${isRelation}`);

        fieldsAcc[field.name] = {
          name: field.name,
          kind: field.kind,
          type: field.type,
          isList: field.isList,
          isRequired: field.isRequired,
          isId: field.isId,
          isUnique: field.isUnique,
          relationName: field.relationName,
          hasDefaultValue: field.hasDefaultValue,
          defaultValue: defaultValue,
          isSystemManaged: isSystemManaged,
          originalLine: originalLine,
          isRelation: isRelation,
          // Add more field properties as needed
        };
        return fieldsAcc;
      }, {}),
    };
    return acc;
  }, {});
};

/**
 * Identifies many-to-many relationships within the Prisma schema.
 *
 * @param {Object} dmmf - The Prisma DMMF schema information.
 * @returns {Array} A list of many-to-many relationships with junction tables.
 */
const getManyToManyRelations = (dmmf) => {
  const manyToManyRelations = [];

  // Step 1: Identify all potential junction tables.
  // We consider a junction table to have exactly two object fields,
  // representing the two entities it connects.
  const junctionModels = dmmf.datamodel.models.filter(model => {
    const objectFields = model.fields.filter(field => field.kind === 'object');
    // Still require exactly two object fields to identify a classic junction table pattern.
    return objectFields.length === 2;
  });

  // Iterate over each identified junction table to extract relationships.
  junctionModels.forEach(junctionModel => {
    const objectFields = junctionModel.fields.filter(field => field.kind === 'object');

    if (objectFields.length !== 2) return; // Safety check.

    const [field1, field2] = objectFields;

    // Find the related models based on the junction table's relation fields.
    const relatedModel1 = dmmf.datamodel.models.find(m => m.name === field1.type);
    const relatedModel2 = dmmf.datamodel.models.find(m => m.name === field2.type);

    if (!relatedModel1 || !relatedModel2) return; // Related models must exist.

    // Step 2: Find reciprocal fields in the related models.
    // These fields should point back to the junction table and be lists, indicating a many relationship.
    const reciprocalField1 = relatedModel1.fields.find(f =>
      f.kind === 'object' &&
      f.type === junctionModel.name &&
      f.isList
    );

    const reciprocalField2 = relatedModel2.fields.find(f =>
      f.kind === 'object' &&
      f.type === junctionModel.name &&
      f.isList
    );

    if (!reciprocalField1 || !reciprocalField2) return; // Reciprocal fields must exist and be lists.

    // Step 3: Collect scalar fields from the junction table.
    const scalarFields = junctionModel.fields.filter(field => field.kind === 'scalar');

    // Step 4: Construct the many-to-many relationship entry.
    manyToManyRelations.push({
      relationTable: [
        { name: relatedModel1.name, field: reciprocalField1.name },
        { name: relatedModel2.name, field: reciprocalField2.name },
      ],
      junctionTable: {
        name: junctionModel.name,
        [`${relatedModel1.name}Field`]: scalarFields.find(f => f.name.toLowerCase().includes(relatedModel1.name.toLowerCase()))?.name || scalarFields[0].name,
        [`${relatedModel2.name}Field`]: scalarFields.find(f => f.name.toLowerCase().includes(relatedModel2.name.toLowerCase()))?.name || scalarFields[1].name,
      },
    });
  });

  return manyToManyRelations;
};

/**
 * Retrieves all one-to-many relationships from the Prisma schema.
 *
 * @param {Object} dmmf - The Prisma DMMF schema information.
 * @returns {Object} A list of one-to-many relationships.
 */
const getOneToManyRelations = (dmmf) => {
  const oneToMany = [];

  const models = dmmf.datamodel.models;

  // Iterate through each model to find potential "one" side
  for (const model of models) {
    for (const field of model.fields) {
      // Check if the field represents a one-to-many relationship
      if (
        field.kind === 'object' && // Object type
        field.isList && // It's a list (many)
        models.some((m) => m.name === field.type) // Related model exists
      ) {
        const relatedModelName = field.type;
        const relatedModel = models.find((m) => m.name === relatedModelName);
        if (!relatedModel) continue;

        // Find the reciprocal field in the related model
        const reciprocalField = relatedModel.fields.find(
          (f) =>
            f.kind === 'object' &&
            !f.isList &&
            f.type === model.name &&
            f.relationName === field.relationName
        );

        if (reciprocalField) {
          // Avoid duplicate relationships
          const isDuplicate = oneToMany.some(
            (rel) =>
              rel.one.name === model.name &&
              rel.one.field === field.name &&
              rel.many.name === relatedModel.name &&
              rel.many.field === reciprocalField.name
          );

          if (!isDuplicate) {
            oneToMany.push({
              many: { name: relatedModel.name, field: reciprocalField.name },
              one: { name: model.name, field: field.name },
            });
          }
        }
      }
    }
  }

  return { manyToOne: oneToMany };
};

/**
 * Retrieves all one-to-one relationships from the Prisma schema.
 *
 * @param {Object} dmmf - The Prisma DMMF schema information.
 * @returns {Array} A list of one-to-one relationships.
 */
const getOneToOneRelations = (dmmf) => {
  const oneToOne = [];

  dmmf.datamodel.models.forEach((model) => {
    model.fields.forEach((field) => {
      // Check if the field could indicate a one-to-one relationship
      if (field.kind === 'object' && !field.isList) {
        const tableOneName = model.name;
        const tableTwoName = field.type;
        const relationName = field.relationName;

        const relatedModel = dmmf.datamodel.models.find((m) => m.name === tableTwoName);
        if (!relatedModel) return;

        const relatedField = relatedModel.fields.find(
          (f) =>
            f.kind === 'object' &&
            !f.isList &&
            f.type === tableOneName &&
            f.relationName === relationName
        );

        if (relatedField) {
          // Avoid duplicate relationships
          const isDuplicate = oneToOne.some(
            (rel) =>
              (rel.table_one.name === tableOneName &&
                rel.table_one.field === field.name &&
                rel.table_two.name === tableTwoName &&
                rel.table_two.field === relatedField.name) ||
              (rel.table_one.name === tableTwoName &&
                rel.table_one.field === relatedField.name &&
                rel.table_two.name === tableOneName &&
                rel.table_two.field === field.name)
          );

          if (!isDuplicate) {
            oneToOne.push({
              table_one: { name: tableOneName, field: field.name },
              table_two: { name: tableTwoName, field: relatedField.name },
            });
          }
        }
      }
    });
  });

  return oneToOne;
};

/**
 * Generates a JSON file with all relationships and field specifications.
 *
 * @param {string} outputPath - The path to save the output JSON file.
 * @param {string} schemaFilePath - Path to the Prisma schema file.
 */
const generateJsonOutput = async (outputPath, schemaFilePath) => {
  try {
    // Read the Prisma schema file
    const schema = fs.readFileSync(schemaFilePath, 'utf-8');

    // Parse the schema to get the DMMF
    const dmmf = await getDMMF({ datamodel: schema });

    // Extract all relationships and field specifications
    const manyToMany = getManyToManyRelations(dmmf);
    const oneToMany = getOneToManyRelations(dmmf);
    const oneToOne = getOneToOneRelations(dmmf);
    const allTableFieldsSpec = getAllTableFieldsSpec(dmmf);

    // Prepare the output JSON structure
    const output = {
      allTableFieldsSpec,
      manyToMany,
      oneToMany,
      oneToOne,
    };

    // Ensure the output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write the output JSON to the specified file
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`✅ JSON schema successfully written to ${outputPath}`);
  } catch (error) {
    console.error('❌ Error generating JSON schema:', error);
    process.exit(1);
  }
};

// Extract command-line arguments
const [outputPath, schemaFilePath] = process.argv.slice(2);

// Validate command-line arguments
if (!outputPath || !schemaFilePath) {
  console.error('❌ Error: Please provide both output JSON path and input Prisma schema file path.');
  console.error('Usage: node scripts/createDBSchemaSpec.js <outputPath> <schemaFilePath>');
  process.exit(1);
}

// Execute the main function
generateJsonOutput(outputPath, schemaFilePath);
