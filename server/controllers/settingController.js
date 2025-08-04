const db = require("../models/index");
const { authenticateJWT, isAdmin } = require("../middlewares/authMiddleware");

// Get departments and designations
exports.getSettings = [
    authenticateJWT,
    isAdmin,
    async (req, res) => {
        // console.log("getSettings for fetch the static data");

        try {
            const departments = await db.Department.findAll();
            const designations = await db.Designation.findAll();
            const reportingGroups = await db.ReportingGroup.findAll();
            const divisions = await db.Division.findAll();
            return res.json({
                departments,
                designations,
                reportingGroups,
                divisions,
            });
        } catch (err) {
            console.error("Error fetching settings:", err);
            return res.status(500).json({
                error: "Error fetching settings. Please try again later.",
            });
        }
    },
];

// Replace all Departments and Designations
exports.updateSettings = [
    authenticateJWT,
    isAdmin,
    async (req, res) => {
        // console.log(req.body);

        const transaction = await db.sequelize.transaction(); // Start a transaction

        try {
            const { departments, designations, reportingGroups, divisions } =
                req.body;

            // DEPARTMENTS - Complete replacement approach
            // Step 1: Delete all existing departments
            await db.Department.destroy({
                where: {},
                truncate: true, // This will delete all records
                cascade: true, // Ensure that any related models are also deleted (if any)
                transaction, // Execute within the transaction
            });

            // Step 2: Add all new departments from the request (if any)
            if (
                departments &&
                Array.isArray(departments) &&
                departments.length > 0
            ) {
                // Filter out any invalid department entries that don't have a name
                const validDepartments = departments
                    .filter((dept) => dept && dept.name) // Ensure 'name' exists
                    .map((dept) => ({ name: dept.name })); // Only keep the name field

                if (validDepartments.length > 0) {
                    // Add the new departments in bulk within the transaction
                    await db.Department.bulkCreate(validDepartments, {
                        transaction,
                    });
                }
            }

            // DESIGNATIONS - Complete replacement approach
            // Step 1: Delete all existing designations
            await db.Designation.destroy({
                where: {},
                truncate: true, // This will delete all records
                cascade: true, // Ensure that any related models are also deleted (if any)
                transaction, // Execute within the transaction
            });

            // Step 2: Add all new designations from the request (if any)
            if (
                designations &&
                Array.isArray(designations) &&
                designations.length > 0
            ) {
                // Filter out any invalid designation entries that don't have a designation_name
                const validDesignations = designations
                    .filter((desig) => desig && desig.designation_name) // Ensure 'designation_name' exists
                    .map((desig) => ({
                        designation_name: desig.designation_name,
                    })); // Only keep the designation_name field

                if (validDesignations.length > 0) {
                    // Add the new designations in bulk within the transaction
                    await db.Designation.bulkCreate(validDesignations, {
                        transaction,
                    });
                }
            }

            await db.ReportingGroup.destroy({
                where: {},
                truncate: true, // This will delete all records
                cascade: true, // Ensure that any related models are also deleted (if any)
                transaction, // Execute within the transaction
            });

            if (
                reportingGroups &&
                Array.isArray(reportingGroups) &&
                reportingGroups.length > 0
            ) {
                const validReportingGroups = reportingGroups
                    .filter((group) => group && group.groupname) // Ensure 'groupname' exists
                    .map((group) => ({ groupname: group.groupname })); // Only keep the groupname field

                if (validReportingGroups.length > 0) {
                    // Add the new reporting groups in bulk within the transaction
                    await db.ReportingGroup.bulkCreate(validReportingGroups, {
                        transaction,
                    });
                }
            }

            await db.Division.destroy({
                where: {},
                truncate: true, // This will delete all records
                cascade: true, // Ensure that any related models are also deleted (if any)
                transaction, // Execute within the transaction
            });

            // In your backend settingController.js, fix the divisions section:

            if (divisions && Array.isArray(divisions) && divisions.length > 0) {
                // console.log(divisions);
                // [ { name: 'asf' }, { name: 'sdg' }, { name: 'sdg' } ]

                const validDivisions = divisions
                    .filter((division) => division && division.name) // Filter for objects with 'name' property
                    .map((division) => ({
                        name: division.name, // Keep as 'name' to match your Sequelize model
                    }));
                // console.log(validDivisions);
                // This will output: [ { name: 'asf' }, { name: 'sdg' }, { name: 'sdg' } ]

                if (validDivisions.length > 0) {
                    // Add the new divisions in bulk within the transaction
                    await db.Division.bulkCreate(validDivisions, {
                        transaction,
                    });
                }
            }

            // Commit the transaction after both departments and designations are updated
            await transaction.commit();

            return res
                .status(200)
                .json({ message: "Settings updated successfully" });
        } catch (err) {
            // Rollback the transaction if there's an error
            await transaction.rollback();

            console.error("Error updating settings:", err);
            return res.status(500).json({
                error: "Error updating settings. Please try again later.",
            });
        }
    },
];

// The individual delete endpoints can be kept for backward compatibility or removed if no longer needed

// Delete Department
exports.deleteDepartment = [
    authenticateJWT,
    isAdmin,
    async (req, res) => {
        // console.log(req);

        try {
            const { id } = req.params;
            const deletedCount = await db.Department.destroy({ where: { id } });

            if (deletedCount === 0) {
                return res
                    .status(404)
                    .json({ message: "Department not found" });
            }

            return res
                .status(200)
                .json({ message: "Department deleted successfully" });
        } catch (err) {
            console.error("Error deleting department:", err);
            return res.status(500).json({
                error: "Error deleting department. Please try again later.",
            });
        }
    },
];

// Delete Designation
exports.deleteDesignation = [
    authenticateJWT,
    isAdmin,
    async (req, res) => {
        try {
            const { id } = req.params;
            const deletedCount = await db.Designation.destroy({
                where: { id },
            });

            if (deletedCount === 0) {
                return res
                    .status(404)
                    .json({ message: "Designation not found" });
            }

            return res
                .status(200)
                .json({ message: "Designation deleted successfully" });
        } catch (err) {
            console.error("Error deleting designation:", err);
            return res.status(500).json({
                error: "Error deleting designation. Please try again later.",
            });
        }
    },
];

// delete reporting group
exports.deleteReportingGroup = [
    authenticateJWT,
    isAdmin,
    async (req, res) => {
        try {
            const { id } = req.params; // Get the id from the URL params
            const deletedCount = await ReportingGroup.destroy({
                where: { id },
            });

            if (deletedCount === 0) {
                return res
                    .status(404)
                    .json({ message: "Reporting Group not found" });
            }

            return res
                .status(200)
                .json({ message: "Reporting Group deleted successfully" });
        } catch (err) {
            console.error("Error deleting reporting group:", err);
            return res.status(500).json({
                error: "Error deleting reporting group. Please try again later.",
            });
        }
    },
];

// delete division
exports.deleteDivision = [
    authenticateJWT,
    isAdmin,
    async (req, res) => {
        try {
            const { id } = req.params; // Get the id from the URL params
            const deletedCount = await Division.destroy({ where: { id } });

            if (deletedCount === 0) {
                return res.status(404).json({ message: "Division not found" });
            }

            return res
                .status(200)
                .json({ message: "Division deleted successfully" });
        } catch (err) {
            console.error("Error deleting division:", err);
            return res.status(500).json({
                error: "Error deleting division. Please try again later.",
            });
        }
    },
];
