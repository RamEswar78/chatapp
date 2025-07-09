import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const connectDb = async () => {
  try {
    const response = await prisma.$connect();
    console.log("Database connected successfully ", response);
    return response;
  } catch (error) {
    console.error("Database connection failed:", error);
    throw error; // Re-throw the error to handle it in the calling function
  }
};

export const createUser = async (email: string, username?: string) => {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      return existingUser; // Return existing user if found
    }
    const user = await prisma.user.create({
      data: {
        email: email,
        username: username || email.split("@")[0] + Math.random() * 1000, // Default username to email prefix if not provided
      },
    });
    return user;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error; // Re-throw the error to handle it in the calling function
  }
};
