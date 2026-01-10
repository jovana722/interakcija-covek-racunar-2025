import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { ToyOrderModel } from '../../models/order.model';
import { CartService } from '../../services/cart.service';
import { CartItem } from '../../models/cartitem.model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.css']
})
export class Checkout {

  private cartService = inject(CartService);
  private router = inject(Router);
  protected showSuccessDialog = signal(false);
  cartItems = signal<CartItem[]>([]);


  order = computed(() => this.cartService.createOrder());

  reserve(cartItemId: string) {
  this.cartItems.update((items: CartItem[]) =>
    items.map(i =>
      i.cartItemId === cartItemId
        ? { ...i, status: 'reserved' }
        : i
    )
  );
}

pay() {
  const order = this.order();
  if (!order) return;

  UserService.addOrder({ ...order, status: 'paid' });

  // koristi stvarne stavke iz korpe, ne ToyOrderItem[]
  this.cartService.markItemsAfterPayment(this.cartService.cartItems());

  this.showSuccessDialog.set(true);

  setTimeout(() => {
    this.showSuccessDialog.set(false);
    this.router.navigate(['/']);
  }, 1000);
}

reserveOrder() {
  const order = this.order();
  if (!order) return;

  UserService.addOrder({ ...order, status: 'reserved' });

  // očisti korpu
  this.cartService.clear();
  this.router.navigate(['/']);
}


  cancel() {
    const order = this.order();
    if (!order) return;

    UserService.addOrder({ ...order, status: 'canceled' });
    this.router.navigate(['/cart']);
  }



}


