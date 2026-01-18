export interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  image: string;
}

export const products: Product[] = [
  {
    id: 1,
    name: "UTM Cap",
    description: "Official UTM cap with embroidered logo. Perfect for showing your UTM pride!",
    price: "50",
    image: "/merch/cap.png",
  },
  {
    id: 2,
    name: "UTM T-Shirt",
    description: "Premium quality cotton t-shirt with UTM branding. Available in multiple colors.",
    price: "75",
    image: "/merch/tshirt.png",
  },
  {
    id: 3,
    name: "UTM Hoodie",
    description: "Comfortable hoodie with UTM logo. Perfect for cooler weather.",
    price: "100",
    image: "/merch/hoodie.png",
  },
  {
    id: 4,
    name: "UTM Mug",
    description: "Ceramic coffee mug with UTM design. Great for morning coffee!",
    price: "25",
    image: "/merch/mug.png",
  },
  {
    id: 5,
    name: "UTM Notebook",
    description: "A5 notebook with UTM cover. Perfect for taking notes during classes.",
    price: "35",
    image: "/merch/notebook.png",
  },
  {
    id: 6,
    name: "UTM Sticker Pack",
    description: "Pack of 10 vinyl stickers featuring UTM artwork.",
    price: "15",
    image: "/merch/stickers.png",
  },
];

export const getProductById = (id: number): Product | undefined => {
  return products.find(p => p.id === id);
};

export const getProductsByPriceRange = (min: number, max: number): Product[] => {
  return products.filter(p => p.price >= String(min) && p.price <= String(max));
};
