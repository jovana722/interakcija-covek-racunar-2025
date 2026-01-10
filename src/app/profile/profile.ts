import { Component, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { ToyService } from '../../services/toy.service';
import { UserService } from '../../services/user.service';
import { UserModel } from '../../models/user.model';
import { ToyOrderModel } from '../../models/order.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, DatePipe],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class Profile {

  protected showAlreadyPaidDialog = signal(false);
protected showAlreadyCanceledDialog = signal(false);
  protected showPaidDialog = signal(false);
protected showCanceledDialog = signal(false);

  protected activeUser = signal<UserModel | null>(null);
  protected showSuccessDialog = signal(false);
  protected toyTypes = signal<string[]>([]);
  profileForm!: FormGroup;

  private toyService = inject(ToyService);

  protected statusMap: Record<string, string> = {
    'reserved': 'Reserved',
    'paid': 'Paid',
    'canceled': 'Canceled'
  };

  protected sortedOrders = computed(() => {
    const user = this.activeUser();
    if (!user) return [];
    return [...user.orders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  });

  constructor(private router: Router, private fb: FormBuilder) {
    if (!UserService.hasAuth()) {
      localStorage.setItem(UserService.TO_KEY, '/profile');
      this.router.navigateByUrl('/login');
      return;
    }

    const user = UserService.getActiveUser();

    // Pročitaj prethodno sačuvanu kategoriju iz localStorage
    const savedCategory = localStorage.getItem('favoriteCategory');
    if (savedCategory) user.favoriteCategory = savedCategory;

    this.activeUser.set(user);

    this.profileForm = this.fb.group({
      firstName: [user.firstName, Validators.required],
      lastName: [user.lastName, Validators.required],
      email: [user.email, [Validators.required, Validators.email]],
      phone: [user.phone, Validators.required],
      favoriteCategory: [user.favoriteCategory || '']
    });

    this.loadToyTypes();
  }

  private async loadToyTypes() {
    try {
      const toys = await this.toyService.getTypes(); // string[] ili {name: string}[]
      const typeNames = (toys as any[]).map(t => typeof t === 'string' ? t : t.name);
      this.toyTypes.set(typeNames);
    } catch (err) {
      console.error(err);
    }
  }

  updateProfile() {
    if (this.profileForm.invalid) return;

    const updatedUser: UserModel = {
      ...this.activeUser(),
      ...this.profileForm.value
    };

    // Sačuvaj u UserService i u localStorage
    UserService.updateUserData(updatedUser);
    this.activeUser.set(updatedUser);
    localStorage.setItem('favoriteCategory', this.profileForm.value.favoriteCategory);

    this.showSuccessDialog.set(true);
    setTimeout(() => this.showSuccessDialog.set(false), 700);
  }

pay(order: ToyOrderModel) {
  if (order.status === 'paid') {
    this.showAlreadyPaidDialog.set(true);
    setTimeout(() => this.showAlreadyPaidDialog.set(false), 2000);
    return;
  }

  if (order.status === 'canceled') {
    this.showAlreadyCanceledDialog.set(true);
    setTimeout(() => this.showAlreadyCanceledDialog.set(false), 2000);
    return;
  }

  // Ako status nije finalizovan, izvrši plaćanje
  UserService.updateOrderStatus(order.orderId, 'paid');
  this.activeUser.set(UserService.getActiveUser());

  this.showPaidDialog.set(true);
  setTimeout(() => this.showPaidDialog.set(false), 1000);
}



cancel(order: ToyOrderModel) {
  if (order.status === 'canceled') {
    this.showAlreadyCanceledDialog.set(true);
    setTimeout(() => this.showAlreadyCanceledDialog.set(false), 2000);
    return;
  }

  if (order.status === 'paid') {
    this.showAlreadyPaidDialog.set(true);
    setTimeout(() => this.showAlreadyPaidDialog.set(false), 2000);
    return;
  }

  // Ako status nije finalizovan, izvrši otkazivanje
  UserService.updateOrderStatus(order.orderId, 'canceled');
  this.activeUser.set(UserService.getActiveUser());

  this.showCanceledDialog.set(true);
  setTimeout(() => this.showCanceledDialog.set(false), 1000);
}


getStatusClass(status: string): string {
  switch (status) {
    case 'paid':
      return 'bg-success';
    case 'canceled':
      return 'bg-danger';
    case 'reserved':
      return 'bg-warning text-dark';
    default:
      return 'bg-secondary';
  }
}

}
