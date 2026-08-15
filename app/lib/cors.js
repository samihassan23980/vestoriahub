import Cors from "cors";

// Initialize the CORS middleware
const cors = Cors({
  origin: ["https://www.rabiaseethani.com"], // List of allowed origins
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

// Helper function to run middleware
export function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}
