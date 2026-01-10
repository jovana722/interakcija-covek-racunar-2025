import { Component, computed, inject } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { ToyOrderModel } from '../../models/order.model';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  templateUrl: './cart.html',
  styleUrls: ['./cart.css'],
  imports: [RouterLink]
})
export class Cart {

  private cartService = inject(CartService);
  private router = inject(Router);

  cartItems = this.cartService.cartItems;

  total = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.totalPrice, 0)
  );

  removeFromCart(orderId: string) {
    this.cartService.remove(orderId);
  }
  
increase(cartItemId: string) {
  this.cartService.increase(cartItemId);
}

decrease(cartItemId: string) {
  this.cartService.decrease(cartItemId);
}


  clearCart() {
    this.cartService.clear();
  }

  reserve(orderId: string) {
  this.cartService.reserveItem(orderId);
}



}
