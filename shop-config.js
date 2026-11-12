/* ==========================================================
   THE SHOP â€” one file controls the whole online store.

   â€¢ To OPEN the order page to the public: change  open: false
     to  open: true  below, then push. That's the only switch:
     customers no longer need to sign in, and an "Order Online"
     link appears in the menu at the top of every page.
   â€¢ To change a price or add a product: edit the list below.
     "from" is the starting price shown to customers. The final
     price is always confirmed by staff before work starts.
   ========================================================== */

export default {

  // false = only logged-in staff can see and use the order page.
  open: false,

  // Shown on the confirmation screen and the order page.
  payNote: "No payment now. We'll call or text to confirm your price, and you pay in store at pickup.",

  // The colours shown as dots on the shop's main page. The product page
  // still offers the full list above.
  frontColors: ["White", "Black", "Red", "Navy", "Forest", "Gray"],

  sizes: ["Youth S", "Youth M", "Youth L", "S", "M", "L", "XL", "2XL", "3XL"],

  colors: [
    { name: "White",  hex: "#FFFFFF" },
    { name: "Black",  hex: "#1E1E1E" },
    { name: "Navy",   hex: "#1C2B3A" },
    { name: "Gray",   hex: "#9A9DA1" },
    { name: "Red",    hex: "#B3261E" },
    { name: "Royal",  hex: "#2452A6" },
    { name: "Forest", hex: "#233D2E" },
    { name: "Pink",   hex: "#F2A7BB" },
    { name: "Tan",    hex: "#D8C3A0" }
  ],

  // shape: which photo the designer shows (null = no live preview, the
  // customer just describes it). image: photo used when there is no shape.
  // defaultColor: the colour shown first in the shop (must be one of frontColors). sized: asks for a size. blurb: the short description on the product page.
  products: [
    { id: "tshirt", defaultColor: "Navy",  name: "Custom T-Shirt", from: 25, shape: "tshirt", sized: true,
      blurb: "A classic tee with your logo, name or design. Add it below and see it on the shirt before you order." },
    { id: "polo", defaultColor: "Red",    name: "Custom Polo Shirt", from: 25, shape: "polo", sized: true,
      blurb: "A collared polo for work, teams and events, with your logo on the chest." },
    { id: "hoodie", defaultColor: "Forest",  name: "Custom Hoodie", from: 25, shape: "hoodie", sized: true,
      blurb: "A pullover hoodie with your logo, name or design on the front." },
    { id: "hat", defaultColor: "Black",     name: "Custom Hat", from: 25, shape: "hat", sized: false,
      blurb: "A baseball cap with your logo or words on the front." },
    { id: "tote", defaultColor: "Gray",    name: "Custom Tote Bag", from: 25, shape: "tote", sized: false,
      blurb: "A tote bag with your logo, monogram or design." },
    { id: "towel", defaultColor: "White",   name: "Custom Towel or Blanket", from: 25, shape: "towel", sized: false,
      blurb: "A towel or blanket with a name, monogram or design." },
    { id: "stocking", name: "Personalized Christmas Stocking", from: 20, shape: null, sized: false,
      image: "/images_fallback/stockings1.jpg",
      blurb: "A Christmas stocking with a name on it. Tell us the names and colours you'd like." },
    { id: "own",     name: "Bring Your Own Item", from: 20, shape: null, sized: false,
      image: "/images_fallback/monogram.jpg",
      blurb: "Already have the item? Bring it to the shop and we'll customize it. Tell us what it is and what you'd like on it." },
    { id: "other",   name: "Something Else", from: null, shape: null, sized: false,
      image: "/images_fallback/spools.jpg",
      blurb: "Don't see it here? We customize almost anything. Tell us what you need and we'll call you with a price." }
  ]
};
