import * as yup from "yup";

// Adding a payment method: the name is optional (Stripe's form has the numbers).
export const addMethodSchema = yup.object({
  holderName: yup.string().trim().max(100, "Use 100 characters or fewer"),
});

// Verifying a bank account entered by hand: the code on Stripe's $0.01 deposit…
export const verifyCodeSchema = yup.object({
  descriptorCode: yup
    .string()
    .trim()
    .required("Enter the code from the deposit")
    .matches(/^SM[A-Za-z0-9]{4}$/i, "The code looks like SM11AA: SM and 4 letters or digits"),
});

const cents = (which: string) =>
  yup
    .number()
    .typeError(`Enter the ${which} amount in cents, e.g. 32`)
    .required(`Enter the ${which} amount`)
    .integer("Enter whole cents, e.g. 32")
    .min(1, "Each amount is between 1 and 99 cents")
    .max(99, "Each amount is between 1 and 99 cents");

// …or the two small deposits, in cents.
export const verifyAmountsSchema = yup.object({
  first: cents("first"),
  second: cents("second"),
});
