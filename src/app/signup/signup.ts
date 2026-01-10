import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; // <-- ovo je novo
import { UserService } from '../../services/user.service';
import { UserModel } from '../../models/user.model';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule], // <-- dodaj FormsModule
  templateUrl: './signup.html',
  styleUrls: ['./signup.css']
})
export class Signup {
  protected firstName = signal('');
  protected lastName = signal('');
  protected email = signal('');
  protected phone = signal('');
  protected password = signal('');
  protected confirmPassword = signal('');

  protected showSuccessDialog = signal(false);
  protected showErrorDialog = signal(false);
  protected errorMessage = signal('');

  constructor(private router: Router) {}

  signup() {
    // validacija
    if (!this.firstName() || !this.lastName() || !this.email() || !this.phone() || !this.password() || !this.confirmPassword()) {
      this.errorMessage.set('Sva polja su obavezna!');
      this.showErrorDialog.set(true);
      setTimeout(() => this.showErrorDialog.set(false), 2000);
      return;
    }

    if (this.password() !== this.confirmPassword()) {
      this.errorMessage.set('Lozinke se ne poklapaju!');
      this.showErrorDialog.set(true);
      setTimeout(() => this.showErrorDialog.set(false), 2000);
      return;
    }

    const users = UserService.getUsers();
    if (users.some(u => u.email === this.email())) {
      this.errorMessage.set('Korisnik sa ovim email-om već postoji!');
      this.showErrorDialog.set(true);
      setTimeout(() => this.showErrorDialog.set(false), 2000);
      return;
    }

    const newUser: UserModel = {
      firstName: this.firstName(),
      lastName: this.lastName(),
      email: this.email(),
      phone: this.phone(),
      password: this.password(),
      orders: []
    };

    localStorage.setItem(UserService.USERS_KEY, JSON.stringify([...users, newUser]));

    this.showSuccessDialog.set(true);
    setTimeout(() => {
      this.showSuccessDialog.set(false);
      this.router.navigate(['/login']);
    }, 1500);
  }
}

