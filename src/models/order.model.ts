export interface ToyOrderItem {
  orderItemId: string;      // NOVO – obavezno
  toyId: number;
  toyName: string;
  imageUrl?: string;
  price: number;
  quantity: number;
  totalPrice: number;
}


export type OrderStatus = 'new' | 'paid' | 'canceled' | 'reserved';

export interface ToyOrderModel {
  orderId: string;
  items: ToyOrderItem[];
  status:'new' | 'paid' | 'canceled' | 'reserved';
  createdAt: string;
  totalPrice: number;
}
