/* ==========================================================
   THE SHOP — one file controls the whole online store.

   • To OPEN the order page to the public: change  open: false
     to  open: true  below, then push. That's the only switch.
   • To change a price or add a product: edit the list below.
     "from" is the starting price shown to customers. The final
     price is always confirmed by staff before work starts.
   ========================================================== */

export default {

  // false = only logged-in staff can see and use the order page.
  open: false,

  // Shown on the confirmation screen and the order page.
  payNote: "No payment now. We'll call or text to confirm your price, and you pay in store at pickup.",

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

  // shape: which picture the designer draws. sized: asks for sizes.
  products: [
    { id: "tshirt",  name: "T-Shirt",            from: 25, shape: "tshirt", sized: true  },
    { id: "polo",    name: "Polo Shirt",         from: 25, shape: "polo",   sized: true  },
    { id: "hoodie",  name: "Hoodie / Sweatshirt", from: 25, shape: "hoodie", sized: true  },
    { id: "hat",     name: "Hat / Cap",          from: 25, shape: "hat",    sized: false },
    { id: "tote",    name: "Tote Bag",           from: 25, shape: "tote",   sized: false },
    { id: "towel",   name: "Towel / Blanket",    from: 25, shape: "towel",  sized: false },
    { id: "stocking", name: "Christmas Stocking", from: 20, shape: "stocking", sized: false },
    { id: "own",     name: "My Own Item",        from: 20, shape: "towel",  sized: false,
      hint: "Bring it to the shop and we'll customize it." },
    { id: "other",   name: "Something Else",     from: null, shape: null,   sized: false,
      hint: "Tell us what you need and we'll make it happen." }
  ]
};
