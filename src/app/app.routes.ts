import { Routes } from '@angular/router';
import { Home } from './home/home';
import { About } from './about/about';
import { Login } from './login/login';
import { Signup } from './signup/signup';
import { Profile } from './profile/profile';
import { Toy } from './toy/toy';
import { Cart } from './cart/cart';

import { Checkout } from './checkout/checkout';
import { Favorite } from './favorite/favorite';

export const routes: Routes = [
    { path: '', title: 'Home', component: Home },
    { path: 'about', title: 'About', component: About },
    { path: 'login', title: 'Login', component: Login },
    { path: 'signup', title: 'Signup', component: Signup },
    { path: 'profile', title: 'User Profile', component: Profile },
    { path: 'cart', title: 'Cart', component: Cart},
    {path:'favorite', title:'Favorite', component:Favorite},
    {path: 'checkout', title: 'Checkout', component: Checkout},

    // detalji igračke
    { path: 'toy/:id', title: 'Toy Details', component: Toy },

    // fallback
    { path: '**', redirectTo: '' }
];
