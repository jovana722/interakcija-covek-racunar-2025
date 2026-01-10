import { Component, signal,inject } from '@angular/core'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { v4 as uuidv4 } from 'uuid'

import { ToyModel } from '../../models/toy.model'
import { ToyService } from '../../services/toy.service'
import { UserService } from '../../services/user.service'
import { Utils } from '../utils'
import { CartService } from '../../services/cart.service'

@Component({
  selector: 'app-order-item',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './orderitem.html',
  styleUrl: './orderitem.css'
})
export class OrderItemComponent {
  private toyService = inject(ToyService); 
  protected toy = signal<ToyModel | null>(null)
  protected form: FormGroup

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private builder: FormBuilder,
    private utils: Utils,
    private cartService: CartService
  ) {
    this.route.params.subscribe(p => {
      const permalink = p['permalink'];
      if (!permalink) return;

      if (!UserService.hasAuth()) {
        localStorage.setItem(UserService.TO_KEY, `/toy/${permalink}/order`);
        this.router.navigateByUrl('/login');
        return;
      }

      // Poziv preko instance
      this.toyService.getToyByPermalink(permalink)
        .then((toy: ToyModel) => this.toy.set(toy))
        .catch(err => console.error(err));
    });

    this.form = this.builder.group({
      quantity: [1, [Validators.required, Validators.min(1)]]
    });
  }

  protected onSubmit() {
  if (!this.form.valid) {
    this.utils.showAlert('Neispravni podaci!');
    return;
  }

  const toy = this.toy();
  if (!toy) {
    this.utils.showAlert('Igračka nije učitana!');
    return;
  }

  const quantity = this.form.value.quantity;

  this.cartService.addToCart({
    toyId: toy.toyId,
    name: toy.name,
    imageUrl: toy.imageUrl ?? 'assets/no-image.png',
    price: toy.price,
    quantity
  });

  this.router.navigateByUrl('/cart');
}
}
