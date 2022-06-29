// require("pretty-error").start();
// const { PrismaClient } = require("@prisma/client");
// const prisma = new PrismaClient();
// const log = require("log4js").getLogger("service");
// log.level = "info";

// exports.create = async (options) => {
//   try {
//     const data = await prisma.project.create({ data: options.body });
//     return { success: true, data };
//   } catch (err) {
//     return { success: false, message: "service down" };
//   }
// };

// exports.findOne = async (options) => {
//   try {
//     console.log(options);
//     const data = await prisma.project.findUnique(options);
//     return { success: true, data };
//   } catch (err) {
//     return { success: false, message: "service down" };
//   }
// };
