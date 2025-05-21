const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET is not defined. Please set it in your environment variables."
  );
}

export { JWT_SECRET };
