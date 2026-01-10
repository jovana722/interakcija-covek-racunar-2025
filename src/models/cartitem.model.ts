export type CartItemStatus = 'new' | 'reserved' | 'paid' | 'arrived';


export interface CartItem {
  cartItemId: string;
  toyId: number;
  toyName: string;
  imageUrl?: string;
  price: number;
  quantity: number;
  totalPrice: number;
  status: CartItemStatus;
}
