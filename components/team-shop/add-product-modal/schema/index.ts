import * as yup from "yup";

const money = (label: string) =>
  yup
    .string()
    .required(`${label} is required`)
    .test("is-positive", `Enter a ${label.toLowerCase()} greater than 0`, (v) => Number(v) > 0);

// Fields after "type" depend on it: merch needs stock and sizes, videos and collectibles need a game.
export const addProductSchema = yup.object({
  type: yup.string().required("Choose what you are adding"),
  name: yup.string().trim().required("Name is required"),
  image: yup.string().required("Upload an image"),
  price: money("Price"),
  dimes: yup
    .string()
    .required("Dimes price is required")
    .test("is-positive", "Enter Dimes greater than 0", (v) => Number(v) > 0),
  stock: yup.string().when("type", {
    is: "Merch",
    then: (s) => s.required("Stock is required"),
  }),
  sizes: yup.array(yup.string()).when("type", {
    is: "Merch",
    then: (s) => s.min(1, "Pick at least one size"),
  }),
  game: yup.string().when("type", {
    is: (t: string) => t === "Video" || t === "Collectible",
    then: (s) => s.required("Select the game"),
  }),
  duration: yup.string().when("type", {
    is: "Video",
    then: (s) => s.required("Duration is required").test("is-positive", "Enter seconds greater than 0", (v) => Number(v) > 0),
  }),
  rarity: yup.string().when("type", {
    is: "Collectible",
    then: (s) => s.required("Select a rarity"),
  }),
});
