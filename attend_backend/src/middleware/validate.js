const HttpError = require("../helpers/httpError");

// Validate req[source] against a zod schema and replace it with the parsed value
const validate = (schema, source = "body") => (req, res, next) => {
  const result = schema.safeParse(req[source] ?? {});
  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      field: i.path.join("."),
      message: i.message,
    }));
    throw new HttpError(400, details[0]?.message || "Invalid input", details);
  }
  if (source === "query") {
    // req.query is a getter in Express 5; stash parsed values separately
    req.validatedQuery = result.data;
  } else {
    req[source] = result.data;
  }
  next();
};

module.exports = validate;
