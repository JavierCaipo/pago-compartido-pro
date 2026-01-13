
export interface Item {
  id: number;
  name: string;
  price: number;
  assignedTo: number[]; // Array of person IDs
}

export interface Person {
  id: number;
  name: string;
}

export interface RawItem {
    name: string;
    price: number;
}
