import { Injectable, signal } from '@angular/core';
import { UserService } from './user.service';
import { ToyOrderModel } from '../models/order.model';
import { CartItem } from '../models/cartitem.model';

@Injectable({ providedIn: 'root' })
export class CartService {

  private _cartItems = signal<CartItem[]>([]);
  cartItems = this._cartItems.asReadonly();

  addToCart(toy: any) {
    const items = this._cartItems();
    const existing = items.find(i => i.toyId === toy.toyId);

    if (existing) {
      existing.quantity++;
      existing.totalPrice = existing.quantity * existing.price;
      this._cartItems.set([...items]);
      return;
    }

    this._cartItems.set([
      ...items,
      {
        cartItemId: crypto.randomUUID(),
        toyId: toy.toyId,
        toyName: toy.name,
        imageUrl: toy.imageUrl ?? 'assets/no-image.png',
        price: toy.price,
        quantity: 1,
        totalPrice: toy.price,
        status: 'new'
      }
    ]);
  }

  remove(cartItemId: string) {
    this._cartItems.set(
      this._cartItems().filter(i => i.cartItemId !== cartItemId)
    );
  }

  clear() {
    this._cartItems.set([]);
  }

  increase(cartItemId: string) {
    this._cartItems.update(items =>
      items.map(i =>
        i.cartItemId === cartItemId
          ? { ...i, quantity: i.quantity + 1, totalPrice: (i.quantity + 1) * i.price }
          : i
      )
    );
  }

  decrease(cartItemId: string) {
    this._cartItems.update(items =>
      items.map(i =>
        i.cartItemId === cartItemId && i.quantity > 1
          ? { ...i, quantity: i.quantity - 1, totalPrice: (i.quantity - 1) * i.price }
          : i
      )
    );
  }

  createOrder(): ToyOrderModel | null {
    const items = this._cartItems();
    if (!items.length) return null;

    return {
      orderId: crypto.randomUUID(),
      status: 'new',
      createdAt: new Date().toISOString(),
      totalPrice: items.reduce((s, i) => s + i.totalPrice, 0),
      items: items.map(i => ({
        orderItemId: crypto.randomUUID(),
        toyId: i.toyId,
        toyName: i.toyName,
        imageUrl: i.imageUrl,
        price: i.price,
        quantity: i.quantity,
        totalPrice: i.totalPrice
      }))
    };
  }


  reserveItem(cartItemId: string) {
  // 1️⃣ Pronađi stavku
  const item = this._cartItems().find(i => i.cartItemId === cartItemId);
  if (!item) return;

  // 2️⃣ Kreiraj porudžbinu
  const order: ToyOrderModel = {
    orderId: crypto.randomUUID(),
    status: 'reserved',
    createdAt: new Date().toISOString(),
    totalPrice: item.totalPrice,
    items: [
      {
        orderItemId: crypto.randomUUID(),
        toyId: item.toyId,
        toyName: item.toyName,
        imageUrl: item.imageUrl,
        price: item.price,
        quantity: item.quantity,
        totalPrice: item.totalPrice
      }
    ]
  };

  // 3️⃣ Dodaj porudžbinu korisniku
  UserService.addOrder(order);

  // 4️⃣ ❗ UKLONI IZ KORPE NAKON REZERVACIJE
  this._cartItems.set(
    this._cartItems().filter(i => i.cartItemId !== cartItemId)
  );
}





markItemsAfterPayment(paidItems: CartItem[]) {
  const paidIds = paidItems.map(i => i.cartItemId);

  this._cartItems.update(items =>
    items.map(i =>
      paidIds.includes(i.cartItemId)
        ? { ...i, status: 'paid' }
        : { ...i, status: 'arrived' }
    )
  );
}



reserveEntireOrder(): boolean {
  const items = this._cartItems();
  if (!items.length) return false;

  const order: ToyOrderModel = {
    orderId: crypto.randomUUID(),
    status: 'reserved',
    createdAt: new Date().toISOString(),
    totalPrice: items.reduce((s, i) => s + i.totalPrice, 0),
    items: items.map(i => ({
      orderItemId: crypto.randomUUID(),
      toyId: i.toyId,
      toyName: i.toyName,
      imageUrl: i.imageUrl,
      price: i.price,
      quantity: i.quantity,
      totalPrice: i.totalPrice
    }))
  };

  UserService.addOrder(order);

  // Clear cart after reservation
  this._cartItems.set([]);

  return true;
}




}